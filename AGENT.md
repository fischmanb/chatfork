# AGENT.md - For LLMs and AI Agents

## Quick Start for AI Agents

If you're an LLM/agent working on this project, here's how to get started:

### 1. Clone and Setup

```bash
# Clone the repo
git clone https://github.com/fischmanb/chatfork.git
cd chatfork

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Read These Files First

**MUST READ before making changes:**
1. `README.md` - Project overview, features, API reference
2. `FILEMAP.md` - Detailed file structure and navigation
3. `backend/schema.sql` - Database schema
4. `backend/src/routes/ai.ts` - Main API logic
5. `frontend/src/components/ChatView.tsx` - Main UI component

### 3. Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + Vite + Tailwind                                     │
│  ├── components/ChatView.tsx    (Main chat UI)              │
│  ├── hooks/useAuth.ts           (Auth state)                │
│  └── hooks/useBranchingChat.ts  (Chat + branching logic)    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/JSON
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Hono + Cloudflare Workers                                   │
│  ├── routes/ai.ts               (Chat, fork, conversations) │
│  ├── routes/auth.ts             (Login, register)           │
│  ├── routes/settings.ts         (API key storage)           │
│  └── middleware/auth.ts         (JWT verification)          │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE                              │
│  Cloudflare D1 (SQLite)                                      │
│  ├── users, sessions                                         │
│  ├── conversations, branches, messages                       │
│  └── user_settings                                           │
└─────────────────────────────────────────────────────────────┘
```

### 4. How to Make Changes

#### A. Fix a Bug in the Chat UI

```bash
# 1. Read the file
cat frontend/src/components/ChatView.tsx

# 2. Make your edits
# 3. Test build
cd frontend && npm run build

# 4. Commit and push
git add frontend/src/components/ChatView.tsx
git commit -m "fix: [describe the bug fix]"
git push
```

#### B. Add a New API Endpoint

```bash
# 1. Read existing routes
cat backend/src/routes/ai.ts

# 2. Add your endpoint in ai.ts
# 3. Update types in backend/src/types.ts if needed
# 4. Test build
cd backend && npm run build

# 5. Commit and push
git add backend/
git commit -m "feat: add [endpoint name] endpoint"
git push
```

#### C. Modify Database Schema

```bash
# 1. Read current schema
cat backend/schema.sql

# 2. Edit schema.sql
# 3. Create migration file
cat > backend/migrations/002_[description].sql << 'EOF'
-- Your migration SQL here
EOF

# 4. Apply migration (requires wrangler)
cd backend && npx wrangler d1 migrations apply chatfork-db

# 5. Commit and push
git add backend/
git commit -m "db: [describe schema change]"
git push
```

### 5. Code Conventions

#### Backend (TypeScript/Hono)
- Use `async/await` for all async operations
- Return JSON with consistent structure: `{ success: true, data: ... }` or `{ error: 'message' }`
- Use `c.get('user')` to get authenticated user in routes
- Always validate input with proper error messages

#### Frontend (React/TypeScript)
- Use functional components with hooks
- State management: `useState` for local, custom hooks for shared
- API calls: Use fetch with Bearer token from `getToken()`
- Styling: Tailwind CSS classes

#### Git Commits
Follow conventional commits:
- `feat: ` - New feature
- `fix: ` - Bug fix
- `docs: ` - Documentation
- `refactor: ` - Code refactoring
- `db: ` - Database changes

### 6. Testing Before Push

**ALWAYS run these before committing:**

```bash
# Backend
cd backend
npm run build
# Should complete without errors

# Frontend
cd frontend
npm run build
# Should complete without errors
```

### 7. Environment Variables

**Backend secrets** (Cloudflare):
- `ENCRYPTION_KEY` - 32-char key for API encryption
- `MOONSHOT_API_KEY` - Optional default AI key

**Frontend** (`.env` file):
```
VITE_API_URL=https://chatfork-api.lively-block-6291.workers.dev
```

### 8. Common Tasks Reference

| Task | Files to Edit |
|------|---------------|
| Change chat appearance | `frontend/src/components/ChatView.tsx` |
| Add new API endpoint | `backend/src/routes/ai.ts` |
| Fix auth issues | `backend/src/routes/auth.ts` + `frontend/src/hooks/useAuth.ts` |
| Change database | `backend/schema.sql` + create migration |
| Modify branching logic | `frontend/src/hooks/useBranchingChat.ts` |
| Add new component | Create in `frontend/src/components/` |

### 9. API Quick Reference

**Base URL:** `https://chatfork-api.lively-block-6291.workers.dev`

**Auth header:** `Authorization: Bearer <token>`

**Key endpoints:**
- `POST /auth/register` - `{ email, password, name? }`
- `POST /auth/login` - `{ email, password }`
- `POST /ai/conversations` - `{ title }`
- `GET /ai/conversations` - List all
- `PUT /ai/conversations/:id` - `{ title }`
- `POST /ai/chat` - `{ messages, conversationId, branchId }`
- `POST /ai/fork` - `{ conversationId, parentMessageId, branchName }`

### 10. Troubleshooting

**Build fails?**
- Check TypeScript errors: `npx tsc --noEmit`
- Check for missing imports
- Verify all dependencies installed: `npm install`

**Database issues?**
- Check schema matches code expectations
- Verify migrations applied: `npx wrangler d1 migrations list`

**Auth not working?**
- Check token is being passed in `Authorization: Bearer <token>` header
- Verify JWT secret matches between login and middleware

---

## For Human Developers

If you're a human reading this, you can:
1. Give this AGENT.md to any LLM along with the repo URL
2. The LLM will understand how to work on your project
3. The LLM can clone, edit, build, and push changes

**To revoke LLM access:** Delete the Personal Access Token in GitHub Settings.
