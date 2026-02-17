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
    
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'kimi-latest',
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
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
  try {
    const conversation = await c.env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(conversationId, userId).first();
    if (!conversation) return c.json({ error: 'Conversation not found' }, 404);
    const messages = await c.env.DB.prepare(
      `SELECT id, branch_id, role, content, parent_message_id, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`
    ).bind(conversationId).all();
    return c.json({ messages: messages.results || [] });
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
    const branches = await c.env.DB.prepare(
      `SELECT id, parent_branch_id, name, forked_from_message_id, created_at FROM branches WHERE conversation_id = ? ORDER BY created_at ASC`
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
    const parentMessage = await c.env.DB.prepare('SELECT branch_id FROM messages WHERE id = ? AND conversation_id = ?').bind(parentMessageId, conversationId).first();
    if (!parentMessage) return c.json({ error: 'Parent message not found' }, 404);
    const newBranchId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO branches (id, conversation_id, parent_branch_id, forked_from_message_id, name, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(newBranchId, conversationId, parentMessage.branch_id, parentMessageId, branchName || `Branch from message`).run();
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
