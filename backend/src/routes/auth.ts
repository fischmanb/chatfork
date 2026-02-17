import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

export const authRouter = new Hono<{ Bindings: Env }>();

// Hash password using Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + salt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${salt}:${hashHex}`;
}

// Verify password
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt] = storedHash.split(':');
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

// Generate random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Sign up
authRouter.post('/signup', async (c) => {
  const { email, password, name } = await c.req.json();
  
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }
  
  if (password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400);
  }
  
  try {
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409);
    }
    
    // Hash password
    const salt = generateToken().slice(0, 16);
    const passwordHash = await hashPassword(password, salt);
    
    // Create user with ISO timestamp
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, name, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(userId, email, passwordHash, name || null, now).run();
    
    // Create session with ISO timestamp (7 days expiry)
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await c.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), userId, token, expiresAt, now).run();
    
    return c.json({
      token,
      user: {
        id: userId,
        email,
        name: name || null,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Login
authRouter.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }
  
  try {
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, name FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Create session with ISO timestamp (7 days expiry)
    const token = generateToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await c.env.DB.prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), user.id, token, expiresAt, now).run();
    
    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user
authRouter.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const email = c.get('userEmail');
  const name = c.get('userName');
  
  return c.json({
    id: userId,
    email,
    name,
  });
});

// Logout
authRouter.post('/logout', authMiddleware, async (c) => {
  const sessionId = c.get('sessionId');
  
  try {
    await c.env.DB.prepare(
      'DELETE FROM sessions WHERE id = ?'
    ).bind(sessionId).run();
    
    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
