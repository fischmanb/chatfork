import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

export const settingsRouter = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all settings routes
settingsRouter.use('*', authMiddleware);

// Get user settings
settingsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const result = await c.env.DB.prepare(
      'SELECT api_key_encrypted, created_at, updated_at FROM user_settings WHERE user_id = ?'
    ).bind(userId).first();
    
    if (!result) {
      return c.json({ hasApiKey: false });
    }
    
    return c.json({ 
      hasApiKey: !!result.api_key_encrypted,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// Store API key
settingsRouter.post('/api-key', async (c) => {
  const userId = c.get('userId');
  const { apiKey } = await c.req.json();
  
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return c.json({ error: 'API key is required' }, 400);
  }
  
  try {
    // Encrypt the API key
    const encryptedKey = await encryptApiKey(apiKey.trim(), c.env.ENCRYPTION_KEY);
    
    // Upsert the settings with ISO timestamp
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO user_settings (user_id, api_key_encrypted, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
       api_key_encrypted = excluded.api_key_encrypted,
       updated_at = ?`
    ).bind(userId, encryptedKey, now, now, now).run();
    
    return c.json({ success: true, message: 'API key saved' });
  } catch (error) {
    console.error('Error saving API key:', error);
    return c.json({ error: 'Failed to save API key' }, 500);
  }
});

// Delete API key
settingsRouter.delete('/api-key', async (c) => {
  const userId = c.get('userId');
  
  try {
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE user_settings SET api_key_encrypted = NULL, updated_at = ? WHERE user_id = ?'
    ).bind(now, userId).run();
    
    return c.json({ success: true, message: 'API key deleted' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return c.json({ error: 'Failed to delete API key' }, 500);
  }
});

// Encrypt API key using AES-GCM
async function encryptApiKey(apiKey: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  // Derive key from encryption key string
  const keyData = encoder.encode(encryptionKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData.slice(0, 32),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine IV + encrypted data and convert to base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Decrypt API key
export async function decryptApiKey(encryptedKey: string, encryptionKey: string): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  // Decode base64
  const combined = new Uint8Array(
    atob(encryptedKey).split('').map(c => c.charCodeAt(0))
  );
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // Derive key
  const keyData = encoder.encode(encryptionKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData.slice(0, 32),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return decoder.decode(decrypted);
}
