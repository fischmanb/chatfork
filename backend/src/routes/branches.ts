import { Hono } from 'hono';
import { z } from 'zod';
import { getDB, query, queryOne } from '../db';
import type { Env } from '../index';

const branchesRouter = new Hono<{ Bindings: Env }>();

// List branches for a conversation
branchesRouter.get('/conversation/:conversationId', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const conversationId = c.req.param('conversationId');
  
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
  
  const branches = await query(
    db,
    `SELECT b.*, 
      (SELECT COUNT(*) FROM messages WHERE branch_id = b.id) as message_count
     FROM branches b
     WHERE b.conversation_id = $1
     ORDER BY b.created_at`,
    [conversationId]
  );
  
  return c.json({ branches });
});

// Fork new branch
branchesRouter.post('/', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const schema = z.object({
    conversationId: z.string().uuid(),
    parentBranchId: z.string().uuid(),
    forkedFromMessageId: z.string().uuid(),
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  });
  
  const result = schema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.errors }, 400);
  }
  
  const { conversationId, parentBranchId, forkedFromMessageId, name, color } = result.data;
  
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
  
  // Check if branch name already exists in this conversation
  const existing = await queryOne(
    db,
    'SELECT 1 FROM branches WHERE conversation_id = $1 AND name = $2',
    [conversationId, name]
  );
  
  if (existing) {
    return c.json({ error: 'Branch name already exists' }, 409);
  }
  
  // Create branch
  const branch = await queryOne(
    db,
    `INSERT INTO branches (conversation_id, name, parent_branch_id, forked_from_message_id, created_by, color)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [conversationId, name, parentBranchId, forkedFromMessageId, userId, color || generateRandomColor()]
  );
  
  if (!branch) {
    return c.json({ error: 'Failed to create branch' }, 500);
  }
  
  return c.json({ branch }, 201);
});

// Rename branch
branchesRouter.patch('/:id', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const branchId = c.req.param('id');
  const body = await c.req.json();
  
  const schema = z.object({ name: z.string().min(1).max(100) });
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return c.json({ error: 'Invalid input' }, 400);
  }
  
  // Verify access and get conversation ID
  const branchInfo = await queryOne<{ conversation_id: string }>(
    db,
    `SELECT b.conversation_id FROM branches b
     JOIN conversations c ON b.conversation_id = c.id
     JOIN workspaces w ON c.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE b.id = $1 AND wm.user_id = $2`,
    [branchId, userId]
  );
  
  if (!branchInfo) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // Check if name already exists
  const existing = await queryOne(
    db,
    'SELECT 1 FROM branches WHERE conversation_id = $1 AND name = $2 AND id != $3',
    [branchInfo.conversation_id, result.data.name, branchId]
  );
  
  if (existing) {
    return c.json({ error: 'Branch name already exists' }, 409);
  }
  
  await query(
    db,
    'UPDATE branches SET name = $1 WHERE id = $2',
    [result.data.name, branchId]
  );
  
  return c.json({ success: true });
});

// Delete branch
branchesRouter.delete('/:id', async (c) => {
  const db = getDB(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const branchId = c.req.param('id');
  
  // Don't allow deleting main branch
  const branch = await queryOne<{ name: string }>(
    db,
    'SELECT name FROM branches WHERE id = $1',
    [branchId]
  );
  
  if (!branch) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  if (branch.name === 'main') {
    return c.json({ error: 'Cannot delete main branch' }, 400);
  }
  
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
  
  await query(db, 'DELETE FROM branches WHERE id = $1', [branchId]);
  
  return c.json({ success: true });
});

function generateRandomColor(): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export { branchesRouter };
