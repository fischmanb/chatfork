# ChatFork

AI-powered chat with Git-style branching. Fork conversations at any message to explore different directions simultaneously.

[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://vercel.com)
[![Backend](https://img.shields.io/badge/backend-cloudflare-orange)](https://workers.cloudflare.com)

## Features

- **AI Chat** - Powered by Kimi AI
- **Git-style Branching** - Fork conversations at any point
- **Timeline Navigation** - Switch between branches instantly
- **Persistent Storage** - Cloudflare D1 database
- **Secure API Keys** - AES-GCM encrypted storage

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Hono + Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| AI | Kimi API |
| Auth | JWT Bearer tokens |

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set environment variables
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL

# Run locally
cd backend && npm run dev      # http://localhost:8787
cd frontend && npm run dev     # http://localhost:5173
```

## Deploy

```bash
# Deploy backend (Cloudflare Workers)
cd backend && npm run deploy

# Deploy frontend (Vercel)
cd frontend && npx vercel --prod
```

## Project Structure

```
chatfork/
├── backend/              # Cloudflare Workers API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── ai.ts        # Chat, fork, conversations
│   │   │   ├── auth.ts      # Login, register
│   │   │   └── settings.ts  # API key management
│   │   ├── middleware/
│   │   │   └── auth.ts      # JWT verification
│   │   ├── types.ts         # TypeScript types
│   │   └── index.ts         # Hono entry
│   ├── schema.sql           # Database schema
│   └── wrangler.toml        # Cloudflare config
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatView.tsx     # Main chat UI
│   │   ├── hooks/
│   │   │   ├── useAuth.ts       # Auth state
│   │   │   └── useBranchingChat.ts  # Chat logic
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   └── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml       # Auto-deploy on push
├── README.md
├── FILEMAP.md               # For LLM agents
└── LICENSE
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Sign in, get token |
| GET | `/auth/me` | Get current user |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/conversations` | Create conversation |
| GET | `/ai/conversations` | List all conversations |
| PATCH | `/ai/conversations/:id` | Rename conversation |
| GET | `/ai/conversations/:id/messages` | Get messages |
| GET | `/ai/conversations/:id/branches` | Get branches |

### Chat & Forking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/chat` | Send message, get AI response |
| POST | `/ai/fork` | Create branch from message |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Check if API key exists |
| POST | `/settings/api-key` | Save encrypted API key |

## Database Schema (D1)

```sql
users (id, email, password_hash, name, created_at)
sessions (id, user_id, token, expires_at)
conversations (id, user_id, title, created_at, updated_at)
branches (id, conversation_id, parent_branch_id, forked_from_message_id, name, created_at)
messages (id, branch_id, role, content, parent_message_id, created_at)
user_settings (user_id, api_key_encrypted, updated_at)
```

## Environment Variables

### Backend (Cloudflare Secrets)
```bash
wrangler secret put ENCRYPTION_KEY    # 32-char key for API encryption
wrangler secret put MOONSHOT_API_KEY  # Optional default AI key
```

### Frontend (.env)
```
VITE_API_URL=https://your-worker.your-subdomain.workers.dev
```

## For LLM Agents / Contributors

See [FILEMAP.md](./FILEMAP.md) for detailed file navigation.

When modifying:
1. **API changes** → Edit `backend/src/routes/ai.ts`
2. **UI changes** → Edit `frontend/src/components/ChatView.tsx`
3. **Auth changes** → Edit both backend `routes/auth.ts` AND frontend `hooks/useAuth.ts`
4. Always run `npm run build` in both folders before committing

## License

MIT - See [LICENSE](./LICENSE)
