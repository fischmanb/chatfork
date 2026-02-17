import { Hono } from 'hono';
import { z } from 'zod';
import { getDB, query, queryOne } from '../db';
import type { Env } from '../index';

const conversationsRouter = new Hono<{ Bindings: Env }>();

// List conversations
conversationsRouter.get('/', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  
  const conversations = await query(
    db,
    `SELECT c.*, w.name as workspace_name,
      (SELECT COUNT(*) FROM branches WHERE conversation_id = c.id) as branch_count,
      (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) as last_message_at
     FROM conversations c
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );
  
  return c.json({ conversations });
});

// Create conversation
conversationsRouter.post('/', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const schema = z.object({ title: z.string().min(1).max(255) });
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return c.json({ error: 'Invalid input' }, 400);
  }
  
  // Get user's default workspace
  const workspace = await queryOne<{ id: string }>(
    db,
    `SELECT w.id FROM workspaces w
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = $1
     LIMIT 1`,
    [userId]
  );
  
  if (!workspace) {
    return c.json({ error: 'No workspace found' }, 404);
  }
  
  // Create conversation
  const conversation = await queryOne(
    db,
    'INSERT INTO conversations (workspace_id, title, created_by) VALUES ($1, $2, $3) RETURNING *',
    [workspace.id, result.data.title, userId]
  );
  
  if (!conversation) {
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
  
  // Create main branch
  await query(
    db,
    'INSERT INTO branches (conversation_id, name, created_by, color) VALUES ($1, $2, $3, $4)',
    [conversation.id, 'main', userId, '#B7FF3A']
  );
  
  return c.json({ conversation }, 201);
});

// Get conversation with branches
conversationsRouter.get('/:id', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const conversationId = c.req.param('id');
  
  // Verify access
  const access = await queryOne(
    db,
    `SELECT 1 FROM conversations c
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE c.id = $1 AND wm.user_id = $2`,
    [conversationId, userId]
  );
  
  if (!access) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // Get conversation
  const conversation = await queryOne(
    db,
    'SELECT * FROM conversations WHERE id = $1',
    [conversationId]
  );
  
  if (!conversation) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // Get branches
  const branches = await query(
    db,
    `SELECT b.*, 
      (SELECT COUNT(*) FROM messages WHERE branch_id = b.id) as message_count
     FROM branches b
     WHERE b.conversation_id = $1
     ORDER BY b.created_at`,
    [conversationId]
  );
  
  return c.json({ conversation, branches });
});

// Update conversation
conversationsRouter.patch('/:id', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const conversationId = c.req.param('id');
  const body = await c.req.json();
  
  const schema = z.object({ title: z.string().min(1).max(255) });
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return c.json({ error: 'Invalid input' }, 400);
  }
  
  // Verify access
  const access = await queryOne(
    db,
    `SELECT 1 FROM conversations c
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE c.id = $1 AND wm.user_id = $2`,
    [conversationId, userId]
  );
  
  if (!access) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  await query(
    db,
    'UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2',
    [result.data.title, conversationId]
  );
  
  return c.json({ success: true });
});

// Delete conversation
conversationsRouter.delete('/:id', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const conversationId = c.req.param('id');
  
  // Verify access (only owner or workspace admin can delete)
  const access = await queryOne(
    db,
    `SELECT 1 FROM conversations c
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE c.id = $1 AND wm.user_id = $2 AND (c.created_by = $2 OR wm.role = 'owner')`,
    [conversationId, userId]
  );
  
  if (!access) {
    return c.json({ error: 'Not found or not authorized' }, 404);
  }
  
  await query(db, 'DELETE FROM conversations WHERE id = $1', [conversationId]);
  
  return c.json({ success: true });
});

export { conversationsRouter };
