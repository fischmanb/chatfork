# ChatFork

AI chat with Git-style branching.

## Quick Start
```bash
cd backend && npm install
cd ../frontend && npm install
```

## Deploy
```bash
cd backend && npm run deploy
cd ../frontend && npx vercel --prod
```

## Structure
```
backend/src/routes/     # ai.ts, auth.ts, settings.ts
frontend/src/components/ChatView.tsx
frontend/src/hooks/useBranchingChat.ts
```

## API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Sign in |
| POST | /ai/conversations | New conversation |
| PATCH | /ai/conversations/:id | Rename |
| POST | /ai/chat | Send message |
| POST | /ai/fork | Fork from message |
