#!/bin/bash

# Chatfork Backend Deployment Script
# This script automates the entire backend deployment process

set -e

echo "🚀 Chatfork Backend Deployment"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prereqs() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx is not available. Please install npm.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites met${NC}"
    echo ""
}

# Install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
}

# Setup Neon database
setup_database() {
    echo "🗄️  Setting up Neon PostgreSQL database..."
    echo ""
    echo -e "${YELLOW}⚠️  You'll need a Neon account. If you don't have one:${NC}"
    echo "   1. Go to https://console.neon.tech/signup"
    echo "   2. Create a free account"
    echo "   3. Create a new project"
    echo "   4. Copy the connection string (starts with postgresql://)"
    echo ""
    
    read -p "Press Enter when you have your Neon connection string ready..."
    echo ""
    
    read -p "Enter your Neon connection string: " db_url
    
    if [[ -z "$db_url" ]]; then
        echo -e "${RED}❌ Database URL is required${NC}"
        exit 1
    fi
    
    # Test connection and run schema
    echo "🔄 Testing database connection and running schema..."
    
    if command -v psql &> /dev/null; then
        psql "$db_url" -f schema.sql
        echo -e "${GREEN}✅ Database schema created${NC}"
    else
        echo -e "${YELLOW}⚠️  psql not found. Please run schema.sql manually in your Neon dashboard.${NC}"
        echo "   SQL file location: $(pwd)/schema.sql"
    fi
    
    # Save to .env for later
    echo "DATABASE_URL=$db_url" > .env
    echo ""
}

# Setup Cloudflare
setup_cloudflare() {
    echo "☁️  Setting up Cloudflare Workers..."
    echo ""
    echo -e "${YELLOW}⚠️  You'll need a Cloudflare account. If you don't have one:${NC}"
    echo "   1. Go to https://dash.cloudflare.com/sign-up"
    echo "   2. Create a free account"
    echo ""
    
    read -p "Press Enter when you have your Cloudflare account ready..."
    echo ""
    
    # Check if already logged in
    if npx wrangler whoami &> /dev/null; then
        echo -e "${GREEN}✅ Already logged into Cloudflare${NC}"
    else
        echo "🔐 Logging into Cloudflare..."
        npx wrangler login
    fi
    echo ""
}

# Generate secrets
generate_secrets() {
    echo "🔑 Generating secure secrets..."
    
    ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env
    echo "SESSION_SECRET=$SESSION_SECRET" >> .env
    
    echo -e "${GREEN}✅ Secrets generated${NC}"
    echo ""
}

# Set Cloudflare secrets
set_secrets() {
    echo "🔒 Setting Cloudflare secrets..."
    
    source .env
    
    echo "   Setting DATABASE_URL..."
    echo "$DATABASE_URL" | npx wrangler secret put DATABASE_URL
    
    echo "   Setting ENCRYPTION_KEY..."
    echo "$ENCRYPTION_KEY" | npx wrangler secret put ENCRYPTION_KEY
    
    echo "   Setting SESSION_SECRET..."
    echo "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET
    
    echo -e "${GREEN}✅ Secrets set${NC}"
    echo ""
}

# Deploy
deploy() {
    echo "🚀 Deploying to Cloudflare Workers..."
    npx wrangler deploy
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
}

# Get deployment URL
get_url() {
    echo "📡 Getting deployment URL..."
    
    # Try to get the URL from wrangler
    URL=$(npx wrangler deployment list 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
    
    if [[ -z "$URL" ]]; then
        URL="https://chatfork-api.your-subdomain.workers.dev"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Your backend is live at:${NC}"
    echo "   $URL"
    echo ""
    echo "   Health check: $URL/health"
    echo ""
    
    # Save URL for frontend update
    echo "API_URL=$URL" >> .env
}

# Update frontend
update_frontend() {
    echo "🔄 Updating frontend with backend URL..."
    
    source .env
    
    # Update the API URL in the frontend
    FRONTEND_DIR="../app/src/lib"
    mkdir -p "$FRONTEND_DIR"
    
    cat > "$FRONTEND_DIR/api.ts" << EOF
// Auto-generated API client
const API_URL = '${API_URL}';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(\`\${API_URL}\${endpoint}\`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(\`API error: \${response.status}\`);
  }
  
  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchWithAuth('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string, displayName?: string) =>
      fetchWithAuth('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
    logout: () => fetchWithAuth('/api/auth/logout', { method: 'POST' }),
    me: () => fetchWithAuth('/api/auth/me'),
  },
  conversations: {
    list: () => fetchWithAuth('/api/conversations'),
    create: (title: string) => fetchWithAuth('/api/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
    get: (id: string) => fetchWithAuth(\`/api/conversations/\${id}\`),
  },
  branches: {
    list: (conversationId: string) => fetchWithAuth(\`/api/branches/conversation/\${conversationId}\`),
    fork: (data: any) => fetchWithAuth('/api/branches', { method: 'POST', body: JSON.stringify(data) }),
  },
  messages: {
    list: (branchId: string) => fetchWithAuth(\`/api/messages/branch/\${branchId}\`),
    send: (branchId: string, content: string) =>
      fetchWithAuth(\`/api/messages/branch/\${branchId}\`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
};
EOF
    
    echo -e "${GREEN}✅ Frontend API client created${NC}"
    echo "   Location: $FRONTEND_DIR/api.ts"
    echo ""
}

# Main
main() {
    check_prereqs
    install_deps
    setup_database
    setup_cloudflare
    generate_secrets
    set_secrets
    deploy
    get_url
    update_frontend
    
    echo ""
    echo "================================"
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "================================"
    echo ""
    echo "Next steps:"
    echo "   1. Your backend is live (see URL above)"
    echo "   2. Frontend API client created"
    echo "   3. Rebuild and redeploy your frontend"
    echo ""
    echo "To update frontend:"
    echo "   cd ../app && npm run build && npm run deploy"
    echo ""
}

# Run
main
