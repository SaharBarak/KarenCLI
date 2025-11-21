# Setup Guide

Complete setup instructions for the Karen CLI Platform.

## Prerequisites

Ensure you have the following installed:

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** (for running Karen CLI in container)
- **Git**

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/KarenCLI.git
cd KarenCLI

# Install dependencies
pnpm install
```

## Step 2: Set Up Supabase

### Option A: Use Existing Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and service role key
3. Run migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Option B: Local Supabase Development

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db push

# Access Studio at http://localhost:54323
```

## Step 3: Configure Environment Variables

### Backend Environment

```bash
cd packages/karen-backend
cp .env.example .env
```

Edit `.env`:

```bash
PORT=4000
FRONTEND_URL=http://localhost:3000

# Supabase (from your Supabase project settings)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Stripe (from stripe.com dashboard)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# GitHub OAuth (create app at github.com/settings/developers)
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_REDIRECT_URI=http://localhost:4000/api/github/callback

# Anthropic (from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-xxx
```

## Step 4: Build & Run

### Build All Packages

```bash
# From root directory
pnpm build
```

### Run Backend Service

```bash
cd packages/karen-backend
pnpm dev

# Server will start at http://localhost:4000
```

### Test Karen CLI

```bash
cd packages/karen-cli

# Run directly (requires build first)
pnpm build
node dist/cli.js audit https://example.com --api-key sk-ant-xxx

# Or use Docker
docker build -t karen-cli .
docker run -e ANTHROPIC_API_KEY=sk-ant-xxx karen-cli audit https://example.com
```

## Step 5: Configure External Services

### Stripe Setup

1. Go to [stripe.com](https://stripe.com) and create account
2. Get API keys from Dashboard → Developers → API keys
3. Create products:
   - **Pro Plan**: Recurring subscription at $29/month
   - **Single Audit**: One-time payment at $5
4. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/stripe/webhooks`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: Karen CLI
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:4000/api/github/callback
4. Copy Client ID and Client Secret to `.env`

### Anthropic API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add to `.env` as `ANTHROPIC_API_KEY`

## Step 6: Database Seed Data (Optional)

```sql
-- Create a test user in Supabase Auth
-- Then run:

INSERT INTO public.profiles (id, email, full_name)
VALUES (
  'uuid-of-test-user',
  'test@example.com',
  'Test User'
);
```

## Step 7: Verify Installation

### Test Backend API

```bash
curl http://localhost:4000/api/audits
# Should return empty array or authentication error
```

### Test Karen CLI

```bash
cd packages/karen-cli
pnpm karen audit https://example.com --api-key sk-ant-xxx
# Should generate karen-tasks.json and KAREN_TASKS.md
```

## Development Workflow

### Start Development Environment

```bash
# Terminal 1: Backend
cd packages/karen-backend
pnpm dev

# Terminal 2: Build karen-cli (if making changes)
cd packages/karen-cli
pnpm build
```

### Making Changes

1. Make changes to source files
2. Run `pnpm build` in the package directory
3. Test changes
4. Commit and push

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

### Playwright Installation Issues

```bash
cd packages/karen-cli
pnpm exec playwright install chromium
```

### Supabase Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active
- Ensure RLS policies are set up correctly

### Docker Build Issues

```bash
# Clean Docker cache
docker system prune -a

# Rebuild with no cache
docker build --no-cache -t karen-cli .
```

## Production Deployment

### Deploy Backend to Railway/Render/Fly.io

```bash
# Build
pnpm build

# Set environment variables in platform
# Deploy with your platform CLI
```

### Deploy Karen CLI Container

```bash
# Build and push to registry
docker build -t your-registry/karen-cli:latest .
docker push your-registry/karen-cli:latest
```

### Deploy Database

- Use Supabase hosted database
- Or self-host PostgreSQL
- Ensure connection string is in environment

## Next Steps

1. ✅ Set up authentication with Supabase Auth
2. ✅ Configure Google OAuth provider
3. 🚧 Build Next.js web platform (karen-web)
4. 🚧 Implement webhook handlers for Stripe
5. 🚧 Add email notifications
6. 🚧 Set up CI/CD pipeline

## Support

For issues or questions:
- Check the [main README](./README.md)
- Review architecture docs in `/docs`
- Open an issue on GitHub

---

**Happy auditing! 💅**
