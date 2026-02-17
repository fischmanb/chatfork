# Chatfork API

Backend API for Chatfork - Git-style branching for AI conversations.

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Neon PostgreSQL
- **Auth:** Self-hosted (session-based)
- **Encryption:** Web Crypto API (AES-256-GCM)

## Prerequisites

- Node.js 18+
- Cloudflare account
- Neon PostgreSQL account

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

1. Create a free Neon PostgreSQL database at https://neon.tech
2. Copy the connection string
3. Run the schema:

```bash
psql "postgresql://..." -f schema.sql
```

### 3. Configure Environment Variables

```bash
# Set secrets (these are encrypted by Cloudflare)
npx wrangler secret put DATABASE_URL
# Enter your Neon connection string

npx wrangler secret put ENCRYPTION_KEY
# Enter a random 32-character string for API key encryption

npx wrangler secret put SESSION_SECRET
# Enter a random 32-character string for session signing
```

### 4. Deploy

```bash
npm run deploy
```

## Development

```bash
# Run locally
npm run dev

# Run tests
npm test
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations/:id` | Get conversation |
| PATCH | `/api/conversations/:id` | Update conversation |
| DELETE | `/api/conversations/:id` | Delete conversation |

### Branches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/branches/conversation/:id` | List branches |
| POST | `/api/branches` | Fork new branch |
| PATCH | `/api/branches/:id` | Rename branch |
| DELETE | `/api/branches/:id` | Delete branch |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/branch/:id` | Get messages |
| POST | `/api/messages/branch/:id` | Send message |
| DELETE | `/api/messages/:id` | Delete message |

## Cost

| Users | Cost/Month |
|-------|------------|
| 1-10 | $0 (free tiers) |
| 10-50 | ~$54 ($1.08/user) |
| 50-100 | ~$109 ($1.09/user) |

## Security

- Passwords hashed with SHA-256
- API keys encrypted with AES-256-GCM
- Session tokens in HTTP-only cookies
- CORS configured for allowed origins
- Row-level security via database queries

## License

MIT
