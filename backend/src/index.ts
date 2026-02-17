import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { aiRouter } from './routes/ai';
import { settingsRouter } from './routes/settings';

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('*', cors({
  origin: ['https://chatfork-frontend.vercel.app', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  exposeHeaders: ['Set-Cookie'],
  credentials: true,
  maxAge: 86400,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'ChatFork API' }));

// Routes
app.route('/auth', authRouter);
app.route('/ai', aiRouter);
app.route('/settings', settingsRouter);

export default app;
