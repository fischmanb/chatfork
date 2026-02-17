# File Map

## Backend
- index.ts - Hono entry
- routes/ai.ts - Chat, fork, conversations
- routes/auth.ts - Login/register
- routes/settings.ts - API key storage
- middleware/auth.ts - JWT verify

## Frontend
- App.tsx - Root
- components/ChatView.tsx - Main chat UI
- hooks/useAuth.ts - Auth state
- hooks/useBranchingChat.ts - Chat + branching
