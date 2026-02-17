import type { MiddlewareHandler } from 'hono';

export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const sessionToken = authHeader?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }
  
  try {
    const session = await c.env.DB.prepare(
      `SELECT s.id, s.user_id, s.expires_at, u.email, u.name
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).bind(sessionToken).first();
    
    if (!session) {
      return c.json({ error: 'Unauthorized - Invalid or expired session' }, 401);
    }
    
    c.set('userId', session.user_id);
    c.set('userEmail', session.email);
    c.set('userName', session.name);
    c.set('sessionId', session.id);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};
