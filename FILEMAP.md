# ChatFork File Map

## For LLM Agents & Contributors

This document helps AI agents and contributors navigate the codebase.

---

## Backend (`backend/`)

### Entry Points
| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/index.ts` | Hono app setup, route mounting | `app` |
| `src/types.ts` | Shared TypeScript interfaces | `Variables`, `User`, `Conversation`, etc. |

### Routes (`backend/src/routes/`)
| File | Endpoints | Purpose |
|------|-----------|---------|
| `ai.ts` | `/ai/*` | Chat, conversations, forking, messages |
| `auth.ts` | `/auth/*` | Register, login, JWT handling |
| `settings.ts` | `/settings/*` | API key storage/retrieval |

### Middleware (`backend/src/middleware/`)
| File | Purpose |
|------|---------|
| `auth.ts` | JWT Bearer token verification |

### Database
| File | Purpose |
|------|---------|
| `schema.sql` | Complete D1 schema definition |

### Config
| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare Workers deployment config |

---

## Frontend (`frontend/`)

### Entry Points
| File | Purpose |
|------|---------|
| `src/main.tsx` | React DOM render |
| `src/App.tsx` | Root component, auth routing |
| `src/index.css` | Tailwind CSS imports |

### Components (`frontend/src/components/`)
| File | Purpose | Key Props/Exports |
|------|---------|-------------------|
| `ChatView.tsx` | Main chat UI with sidebar | `ChatViewProps` |

### Hooks (`frontend/src/hooks/`)
| File | Purpose | Returns |
|------|---------|---------|
| `useAuth.ts` | Authentication state | `{ user, login, signup, logout, getToken }` |
| `useBranchingChat.ts` | Chat messages, branches, forking | `{ state, sendUserMessage, forkBranch, switchBranch, ... }` |

### Types (`frontend/src/types/`)
| File | Purpose |
|------|---------|
| `index.ts` | Shared frontend types |

---

## Common Tasks

### Add new API endpoint
1. Add route handler in `backend/src/routes/ai.ts`
2. Export in `backend/src/index.ts` if new router
3. Add type in `backend/src/types.ts`
4. Add frontend call in appropriate hook

### Modify chat UI
1. Edit `frontend/src/components/ChatView.tsx`
2. Update types in `frontend/src/types/index.ts` if needed

### Database changes
1. Edit `backend/schema.sql`
2. Create migration file in `backend/migrations/`
3. Apply via `wrangler d1 migrations apply`

---

## Build & Deploy

```bash
# Backend
cd backend && npm run build && npm run deploy

# Frontend
cd frontend && npm run build && npx vercel --prod
```

## GitHub Actions

Auto-deploy on push to `main`:
- Backend → Cloudflare Workers
- Frontend → Vercel

Requires secrets: `CF_API_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
