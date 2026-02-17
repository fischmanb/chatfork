import { Hono } from 'hono';
import { z } from 'zod';
import { getDB, query, queryOne } from '../db';
import type { Env } from '../index';

const messagesRouter = new Hono<{ Bindings: Env }>();

// Get messages in branch (with inheritance)
messagesRouter.get('/branch/:branchId', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const branchId = c.req.param('branchId');
  
  // Verify access
  const access = await queryOne(
    db,
    `SELECT 1 FROM branches b
     JOIN conversations c ON b.conversation_id = c.id
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE b.id = $1 AND wm.user_id = $2`,
    [branchId, userId]
  );
  
  if (!access) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // Get branch info
  const branch = await queryOne<{
    id: string;
    parent_branch_id: string | null;
    forked_from_message_id: string | null;
    created_at: string;
  }>(
    db,
    'SELECT id, parent_branch_id, forked_from_message_id, created_at FROM branches WHERE id = $1',
    [branchId]
  );
  
  if (!branch) {
    return c.json({ error: 'Branch not found' }, 404);
  }
  
  let messages: any[] = [];
  
  // If branch has parent, get inherited messages
  if (branch.parent_branch_id && branch.forked_from_message_id) {
    // Get parent messages up to fork point
    const parentMessages = await query(
      db,
      `SELECT * FROM messages 
       WHERE branch_id = $1 
       AND created_at <= (SELECT created_at FROM messages WHERE id = $2)
       ORDER BY created_at`,
      [branch.parent_branch_id, branch.forked_from_message_id]
    );
    
    messages = [...parentMessages];
  }
  
  // Get branch messages
  const branchMessages = await query(
    db,
    'SELECT * FROM messages WHERE branch_id = $1 ORDER BY created_at',
    [branchId]
  );
  
  messages = [...messages, ...branchMessages];
  
  return c.json({ messages });
});

// Send message (and get AI response)
messagesRouter.post('/branch/:branchId', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const branchId = c.req.param('branchId');
  const body = await c.req.json();
  
  const schema = z.object({ content: z.string().min(1).max(10000) });
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return c.json({ error: 'Invalid input' }, 400);
  }
  
  // Verify access and get conversation ID
  const access = await queryOne<{ conversation_id: string }>(
    db,
    `SELECT c.id as conversation_id FROM branches b
     JOIN conversations c ON b.conversation_id = c.id
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE b.id = $1 AND wm.user_id = $2`,
    [branchId, userId]
  );
  
  if (!access) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  const conversationId = access.conversation_id;
  
  // Save user message
  const userMessage = await queryOne(
    db,
    'INSERT INTO messages (conversation_id, branch_id, content, role, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [conversationId, branchId, result.data.content, 'user', userId]
  );
  
  if (!userMessage) {
    return c.json({ error: 'Failed to save message' }, 500);
  }
  
  // Get user's API key
  const settings = await queryOne<{ encrypted_api_key: string | null }>(
    db,
    'SELECT encrypted_api_key FROM user_settings WHERE user_id = $1',
    [userId]
  );
  
  let assistantMessage;
  
  if (settings?.encrypted_api_key) {
    try {
      // Decrypt API key
      const apiKey = await decryptApiKey(settings.encrypted_api_key, c.env.ENCRYPTION_KEY);
      
      // Get conversation history for context (last 20 messages)
      const history = await query(
        db,
        `SELECT role, content FROM messages 
         WHERE branch_id = $1 
         ORDER BY created_at DESC 
         LIMIT 20`,
        [branchId]
      );
      
      // Reverse to get chronological order
      history.reverse();
      
      // Call Kimi API
      const aiResponse = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: history.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
      
      if (!aiResponse.ok) {
        throw new Error(`AI API error: ${aiResponse.status}`);
      }
      
      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      const tokensUsed = aiData.usage?.total_tokens || 0;
      
      // Save AI response
      assistantMessage = await queryOne(
        db,
        'INSERT INTO messages (conversation_id, branch_id, content, role, model, tokens_used) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [conversationId, branchId, aiContent, 'assistant', 'moonshot-v1-8k', tokensUsed]
      );
    } catch (error) {
      console.error('AI error:', error);
      assistantMessage = await queryOne(
        db,
        'INSERT INTO messages (conversation_id, branch_id, content, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [conversationId, branchId, 'Error: Could not connect to AI service. Please check your API key.', 'assistant']
      );
    }
  } else {
    // No API key set
    assistantMessage = await queryOne(
      db,
      'INSERT INTO messages (conversation_id, branch_id, content, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [conversationId, branchId, 'Please set your Kimi API key in settings to get AI responses.', 'assistant']
    );
  }
  
  // Update conversation timestamp
  await query(
    db,
    'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
    [conversationId]
  );
  
  return c.json({
    userMessage,
    assistantMessage,
  });
});

// Delete message
messagesRouter.delete('/:id', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const messageId = c.req.param('id');
  
  // Verify access (only message creator or workspace admin can delete)
  const access = await queryOne(
    db,
    `SELECT 1 FROM messages m
     JOIN branches b ON m.branch_id = b.id
     JOIN conversations c ON b.conversation_id = c.id
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE m.id = $1 AND wm.user_id = $2 AND (m.created_by = $2 OR wm.role = 'owner')`,
    [messageId, userId]
  );
  
  if (!access) {
    return c.json({ error: 'Not found or not authorized' }, 404);
  }
  
  await query(db, 'DELETE FROM messages WHERE id = $1', [messageId]);
  
  return c.json({ success: true });
});

// Encrypt API key
async function encryptApiKey(apiKey: string, masterKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  // Derive key from master key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Decrypt API key
async function decryptApiKey(encryptedData: string, masterKey: string): Promise<string> {
  const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);
  
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

export { messagesRouter };
