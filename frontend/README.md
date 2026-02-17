# Chatfork Frontend

Git-style branching for AI conversations.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and set your backend API URL:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=https://chatfork-api.your-subdomain.workers.dev
```

## Deploy

### Vercel
```bash
npx vercel --prod
```

### Netlify
```bash
npx netlify deploy --prod
```

## Features

- Git-style branching for chat conversations
- Fork any message to create a new branch
- Switch between branches instantly
- Mobile-optimized interface
- Dark theme UI
- Kimi AI integration
