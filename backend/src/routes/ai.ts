import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { decryptApiKey } from './settings';

export const aiRouter = new Hono<{ Bindings: Env }>();

aiRouter.use('*', authMiddleware);

/**
 * Helper to generate auto-title from first user message
 * Takes first 40 chars and adds ellipsis if needed
 */
function generateAutoTitle(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.slice(0, 40) + '...';
}

aiRouter.post('/chat', async (c) => {
  const userId = c.get('userId');
  const { messages, conversationId, branchId, isFirstMessage } = await c.req.json();
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: 'Messages are required' }, 400);
  }
  
  try {
    const settings = await c.env.DB.prepare(
      'SELECT api_key_encrypted FROM user_settings WHERE user_id = ?'
    ).bind(userId).first();
    
    if (!settings || !settings.api_key_encrypted) {
      return c.json({ error: 'API key not configured. Please add your Kimi API key in settings.' }, 401);
    }
    
    let apiKey: string;
    try {
      apiKey = await decryptApiKey(settings.api_key_encrypted, c.env.ENCRYPTION_KEY);
    } catch (decryptError) {
      console.error('Failed to decrypt API key:', decryptError);
      return c.json({ error: 'Invalid stored API key. Please re-configure your API key.' }, 401);
    }
    
    // Load branch-specific messages from database for proper context isolation
    let contextMessages: Array<{ role: string; content: string }> = [];
    
    if (conversationId && branchId) {
      // Get branch info to check for parent
      const branch = await c.env.DB.prepare(
        'SELECT id, parent_branch_id, forked_from_message_id FROM branches WHERE id = ? AND conversation_id = ?'
      ).bind(branchId, conversationId).first();
      
      if (branch) {
        // Build context: parent messages up to fork point + branch messages
        let dbMessages: any[] = [];
        
        if (branch.parent_branch_id && branch.forked_from_message_id) {
          // Get parent messages up to and including the forked message
          const parentMessages = await c.env.DB.prepare(
            `SELECT role, content 
             FROM messages 
             WHERE branch_id = ? 
             AND created_at <= (SELECT created_at FROM messages WHERE id = ?)
             ORDER BY created_at ASC`
          ).bind(branch.parent_branch_id, branch.forked_from_message_id).all();
          
          dbMessages = [...(parentMessages.results || [])];
        }
        
        // Get messages belonging to this branch
        const branchMessages = await c.env.DB.prepare(
          `SELECT role, content 
           FROM messages 
           WHERE branch_id = ? 
           ORDER BY created_at ASC`
        ).bind(branchId).all();
        
        dbMessages = [...dbMessages, ...(branchMessages.results || [])];
        
        // Use database messages for context, but append the latest user message from frontend
        contextMessages = dbMessages.map((m: any) => ({ role: m.role, content: m.content }));
      }
    }
    
    // If we couldn't load from DB, fall back to frontend messages (for new conversations)
    const messagesForAI = contextMessages.length > 0 
      ? [...contextMessages, messages[messages.length - 1]].map((m: any) => ({ role: m.role, content: m.content }))
      : messages.map((m: any) => ({ role: m.role, content: m.content }));
    
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'kimi-latest',
        messages: messagesForAI,
        stream: false,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Kimi API error:', response.status, errorData);
      if (response.status === 401) return c.json({ error: 'Invalid Kimi API key. Please check your API key.' }, 401);
      if (response.status === 429) return c.json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
      return c.json({ error: 'Kimi API error', details: errorData.error?.message || `HTTP ${response.status}` }, 500);
    }
    
    const data = await response.json();
    
    let savedMessageId: string | undefined;
    if (conversationId) {
      try {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user' && lastUserMessage.id) {
          await c.env.DB.prepare(
            `INSERT OR IGNORE INTO messages (id, conversation_id, branch_id, role, content, parent_message_id, created_at)
             VALUES (?, ?, ?, 'user', ?, ?, datetime('now'))`
          ).bind(lastUserMessage.id, conversationId, branchId || null, lastUserMessage.content, messages.length > 1 ? messages[messages.length - 2].id : null).run();
        }
        const assistantMessageId = crypto.randomUUID();
        await c.env.DB.prepare(
          `INSERT INTO messages (id, conversation_id, branch_id, role, content, parent_message_id, created_at)
           VALUES (?, ?, ?, 'assistant', ?, ?, datetime('now'))`
        ).bind(assistantMessageId, conversationId, branchId || null, data.choices[0]?.message?.content || '', lastUserMessage?.id || null).run();
        savedMessageId = assistantMessageId;
        
        // Auto-rename conversation on first message if requested
        if (isFirstMessage && lastUserMessage?.role === 'user') {
          const newTitle = generateAutoTitle(lastUserMessage.content);
          await c.env.DB.prepare(
            'UPDATE conversations SET title = ?, updated_at = datetime("now") WHERE id = ?'
          ).bind(newTitle, conversationId).run();
        } else {
          // Just update the timestamp
          await c.env.DB.prepare('UPDATE conversations SET updated_at = datetime("now") WHERE id = ?').bind(conversationId).run();
        }
      } catch (dbError) {
        console.error('Failed to save message:', dbError);
      }
    }
    
    return c.json({ message: data.choices[0]?.message, messageId: savedMessageId, usage: data.usage });
  } catch (error) {
    console.error('Chat error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

aiRouter.get('/conversations/:id/messages', async (c) => {
  const userId = c.get('userId');
  const conversationId = c.req.param('id');
  const branchId = c.req.query('branchId');
  
  try {
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(conversationId, userId).first();
    if (!conversation) return c.json({ error: 'Conversation not found' }, 404);
    
    // If no branchId specified, get all messages for the main branch (null parent_branch_id)
    if (!branchId) {
      const messages = await c.env.DB.prepare(
        `SELECT id, branch_id, role, content, parent_message_id, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`
      ).bind(conversationId).all();
      return c.json({ messages: messages.results || [] });
    }
    
    // Get branch info to check for parent
    const branch = await c.env.DB.prepare(
      'SELECT id, parent_branch_id, forked_from_message_id FROM branches WHERE id = ? AND conversation_id = ?'
    ).bind(branchId, conversationId).first();
    
    if (!branch) return c.json({ error: 'Branch not found' }, 404);
    
    let messages: any[] = [];
    
    // If branch has a parent, get inherited messages up to fork point
    if (branch.parent_branch_id && branch.forked_from_message_id) {
      // Get parent messages up to and including the forked message
      const parentMessages = await c.env.DB.prepare(
        `SELECT id, branch_id, role, content, parent_message_id, created_at 
         FROM messages 
         WHERE branch_id = ? 
         AND created_at <= (SELECT created_at FROM messages WHERE id = ?)
         ORDER BY created_at ASC`
      ).bind(branch.parent_branch_id, branch.forked_from_message_id).all();
      
      messages = [...(parentMessages.results || [])];
    }
    
    // Get messages belonging to this branch
    const branchMessages = await c.env.DB.prepare(
      `SELECT id, branch_id, role, content, parent_message_id, created_at 
       FROM messages 
       WHERE branch_id = ? 
       ORDER BY created_at ASC`
    ).bind(branchId).all();
    
    messages = [...messages, ...(branchMessages.results || [])];
    
    return c.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

aiRouter.get('/conversations/:id/branches', async (c) => {
  const userId = c.get('userId');
  const conversationId = c.req.param('id');
  try {
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(conversationId, userId).first();
    if (!conversation) return c.json({ error: 'Conversation not found' }, 404);
    
    // Get branches with message count and last activity
    const branches = await c.env.DB.prepare(
      `SELECT 
        b.id, 
        b.parent_branch_id, 
        b.name, 
        b.forked_from_message_id, 
        b.created_at,
        (SELECT COUNT(*) FROM messages WHERE branch_id = b.id) as message_count,
        (SELECT MAX(created_at) FROM messages WHERE branch_id = b.id) as last_activity
       FROM branches b 
       WHERE b.conversation_id = ? 
       ORDER BY b.created_at ASC`
    ).bind(conversationId).all();
    
    return c.json({ branches: branches.results || [] });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return c.json({ error: 'Failed to fetch branches' }, 500);
  }
});

aiRouter.post('/conversations', async (c) => {
  const userId = c.get('userId');
  const { title } = await c.req.json();
  try {
    const conversationId = crypto.randomUUID();
    const branchId = crypto.randomUUID();
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`).bind(conversationId, userId, title || 'New Conversation'),
      c.env.DB.prepare(`INSERT INTO branches (id, conversation_id, name, created_at) VALUES (?, ?, 'Main', datetime('now'))`).bind(branchId, conversationId),
    ]);
    return c.json({ conversationId, branchId, message: 'Conversation created' });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

aiRouter.put('/conversations/:id', async (c) => {
  const userId = c.get('userId');
  const conversationId = c.req.param('id');
  const { title } = await c.req.json();
  if (!title || typeof title !== 'string') return c.json({ error: 'Title is required' }, 400);
  try {
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(conversationId, userId).first();
    if (!conversation) return c.json({ error: 'Conversation not found' }, 404);
    await c.env.DB.prepare('UPDATE conversations SET title = ?, updated_at = datetime("now") WHERE id = ?').bind(title, conversationId).run();
    return c.json({ success: true, message: 'Conversation renamed' });
  } catch (error) {
    console.error('Error renaming conversation:', error);
    return c.json({ error: 'Failed to rename conversation' }, 500);
  }
});

aiRouter.post('/fork', async (c) => {
  const userId = c.get('userId');
  const { conversationId, parentMessageId, branchName } = await c.req.json();
  if (!conversationId || !parentMessageId) return c.json({ error: 'conversationId and parentMessageId are required' }, 400);
  try {
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(conversationId, userId).first();
    if (!conversation) return c.json({ error: 'Conversation not found' }, 404);
    
    const parentMessage = await c.env.DB.prepare(
      'SELECT branch_id, created_at FROM messages WHERE id = ? AND conversation_id = ?'
    ).bind(parentMessageId, conversationId).first();
    
    if (!parentMessage) return c.json({ error: 'Parent message not found' }, 404);
    
    const newBranchId = crypto.randomUUID();
    
    // Create the new branch
    await c.env.DB.prepare(
      `INSERT INTO branches (id, conversation_id, parent_branch_id, forked_from_message_id, name, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(newBranchId, conversationId, parentMessage.branch_id, parentMessageId, branchName || `Branch from message`).run();
    
    // Copy parent messages up to and including the forked message to the new branch
    const messagesToCopy = await c.env.DB.prepare(
      `SELECT id, role, content, parent_message_id, created_at 
       FROM messages 
       WHERE branch_id = ? 
       AND created_at <= ?
       ORDER BY created_at ASC`
    ).bind(parentMessage.branch_id, parentMessage.created_at).all();
    
    // Insert copied messages with new IDs but preserve the content and relationships
    for (const msg of (messagesToCopy.results || [])) {
      const newMessageId = crypto.randomUUID();
      await c.env.DB.prepare(
        `INSERT INTO messages (id, conversation_id, branch_id, role, content, parent_message_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        newMessageId,
        conversationId,
        newBranchId,
        msg.role,
        msg.content,
        msg.parent_message_id ? crypto.randomUUID() : null, // Generate new parent ID reference
        msg.created_at
      ).run();
    }
    
    return c.json({ branchId: newBranchId, message: 'Branch created' });
  } catch (error) {
    console.error('Error forking branch:', error);
    return c.json({ error: 'Failed to fork branch' }, 500);
  }
});

// Create a new top-level thread from a message (no parent branch)
aiRouter.post('/thread', async (c) => {
  const userId = c.get('userId');
  const { conversationId, fromMessageId, threadName } = await c.req.json();
  if (!conversationId || !fromMessageId) return c.json({ error: 'conversationId and fromMessageId are required' }, 400);
  if (!threadName || typeof threadName !== 'string') return c.json({ error: 'threadName is required' }, 400);
  try {
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(conversationId, userId).first();
    if (!conversation) return c.json({ error: 'Conversation not found' }, 404);
    const fromMessage = await c.env.DB.prepare('SELECT id FROM messages WHERE id = ? AND conversation_id = ?').bind(fromMessageId, conversationId).first();
    if (!fromMessage) return c.json({ error: 'Message not found' }, 404);
    const newBranchId = crypto.randomUUID();
    // Create a top-level branch (no parent_branch_id) that forks from the message
    await c.env.DB.prepare(
      `INSERT INTO branches (id, conversation_id, parent_branch_id, forked_from_message_id, name, created_at) VALUES (?, ?, NULL, ?, ?, datetime('now'))`
    ).bind(newBranchId, conversationId, fromMessageId, threadName).run();
    return c.json({ branchId: newBranchId, message: 'Thread created' });
  } catch (error) {
    console.error('Error creating thread:', error);
    return c.json({ error: 'Failed to create thread' }, 500);
  }
});

aiRouter.get('/conversations', async (c) => {
  const userId = c.get('userId');
  try {
    const conversations = await c.env.DB.prepare(
      `SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC`
    ).bind(userId).all();
    return c.json({ conversations: conversations.results || [] });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// Delete a single conversation
aiRouter.delete('/conversations/:id', async (c) => {
  const userId = c.get('userId');
  const conversationId = c.req.param('id');
  try {
    // Verify the conversation belongs to the user
    const conversation = await c.env.DB.prepare(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
    ).bind(conversationId, userId).first();
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    // Delete related data (cascade delete)
    await c.env.DB.batch([
      // Delete messages first
      c.env.DB.prepare('DELETE FROM messages WHERE conversation_id = ?').bind(conversationId),
      // Delete branches
      c.env.DB.prepare('DELETE FROM branches WHERE conversation_id = ?').bind(conversationId),
      // Delete conversation
      c.env.DB.prepare('DELETE FROM conversations WHERE id = ?').bind(conversationId),
    ]);
    
    return c.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return c.json({ error: 'Failed to delete conversation' }, 500);
  }
});

// Delete all conversations for the user
aiRouter.delete('/conversations', async (c) => {
  const userId = c.get('userId');
  try {
    // Get all conversation IDs for this user
    const conversations = await c.env.DB.prepare(
      'SELECT id FROM conversations WHERE user_id = ?'
    ).bind(userId).all();
    
    const conversationIds = (conversations.results || []).map((c: any) => c.id);
    
    if (conversationIds.length === 0) {
      return c.json({ success: true, message: 'No conversations to delete', deletedCount: 0 });
    }
    
    // Delete all related data for each conversation
    for (const convId of conversationIds) {
      await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM messages WHERE conversation_id = ?').bind(convId),
        c.env.DB.prepare('DELETE FROM branches WHERE conversation_id = ?').bind(convId),
        c.env.DB.prepare('DELETE FROM conversations WHERE id = ?').bind(convId),
      ]);
    }
    
    return c.json({ 
      success: true, 
      message: 'All conversations deleted',
      deletedCount: conversationIds.length 
    });
  } catch (error) {
    console.error('Error deleting all conversations:', error);
    return c.json({ error: 'Failed to delete conversations' }, 500);
  }
});
