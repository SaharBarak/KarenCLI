# Karen CLI - Full Backend Architecture

## System Overview

Karen CLI is a CSS layout auditing tool with two modes:
1. **CLI Mode**: Developers install and run locally
2. **Managed Service**: Users pay for audits via web dashboard, Karen runs audits and creates PRs with fixes

### Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Payments**: Stripe (Subscriptions & One-time payments)
- **Version Control**: GitHub OAuth for repository access
- **Search**: Upstash Vector for semantic documentation search
- **Hosting**: Vercel

---

## Database Schema

### Tables

#### 1. `profiles`
User profile information synced from Supabase Auth.

\`\`\`sql
id: uuid (PK, references auth.users)
email: text
full_name: text
avatar_url: text
created_at: timestamptz
updated_at: timestamptz
\`\`\`

**Policies:**
- Users can view/update their own profile

#### 2. `subscriptions`
User subscription status and Stripe integration.

\`\`\`sql
id: uuid (PK)
user_id: uuid (FK → profiles.id)
stripe_customer_id: text (unique)
stripe_subscription_id: text (unique)
status: text ('active', 'canceled', 'past_due', 'trialing')
plan_type: text ('free', 'pro')
current_period_end: timestamptz
created_at: timestamptz
updated_at: timestamptz
\`\`\`

**Policies:**
- Users can view their own subscription

**Business Rules:**
- Free plan: Manual CLI usage only
- Pro plan ($29/month): Unlimited audits, auto-fixes, PR creation

#### 3. `audits`
Audit requests and results storage.

\`\`\`sql
id: uuid (PK)
user_id: uuid (FK → profiles.id)
site_url: text (required)
repo_url: text (optional)
status: text ('pending', 'running', 'completed', 'failed')
results: jsonb
created_at: timestamptz
updated_at: timestamptz
\`\`\`

**Policies:**
- Users can CRUD their own audits

**Results JSON Structure:**
\`\`\`json
{
  "issues": [
    {
      "id": "issue-1",
      "type": "overflow" | "spacing" | "typescale" | "color" | "accessibility" | "design-system",
      "severity": "critical" | "high" | "medium" | "low",
      "element": "selector or description",
      "viewport": "mobile | tablet | desktop",
      "message": "Karen's sassy roast message",
      "screenshot": "base64 or URL",
      "fix": {
        "file": "path/to/file.css",
        "before": "code snippet",
        "after": "code snippet"
      }
    }
  ],
  "summary": {
    "total": 15,
    "critical": 2,
    "high": 5,
    "medium": 6,
    "low": 2
  },
  "pr_url": "https://github.com/user/repo/pull/123" // if auto-fixed
}
\`\`\`

#### 4. `github_connections`
GitHub OAuth tokens for repository access.

\`\`\`sql
id: uuid (PK)
user_id: uuid (FK → profiles.id, unique)
github_id: text
github_username: text
access_token: text (encrypted)
created_at: timestamptz
updated_at: timestamptz
\`\`\`

**Policies:**
- Users can CRUD their own GitHub connection

---

## API Routes

### Authentication

#### `POST /auth/login`
Initiates Google OAuth flow via Supabase.

**Request:** None (redirects to Google)

**Response:** Redirects to Google OAuth consent screen

---

#### `GET /auth/callback`
Handles OAuth callback from Google.

**Query Params:**
- `code`: Authorization code from Google

**Response:** Redirects to `/dashboard` on success, `/auth/error` on failure

**Side Effects:**
- Creates/updates profile in database
- Creates free subscription if new user

---

### GitHub Integration

#### `GET /api/github/authorize`
Initiates GitHub OAuth flow for repository access.

**Response:** Redirects to GitHub OAuth

---

#### `GET /api/github/callback`
Handles GitHub OAuth callback.

**Query Params:**
- `code`: Authorization code from GitHub

**Response:** Redirects to `/dashboard/settings`

**Side Effects:**
- Stores GitHub access token in `github_connections` table

---

### Stripe Integration

#### `POST /api/webhooks/stripe`
Handles Stripe webhook events.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Events Handled:**
- `checkout.session.completed`: Create/update subscription
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Cancel subscription

**Side Effects:**
- Updates `subscriptions` table with Stripe data

---

### Audit Management

#### `POST /api/audits/create`
Creates a new audit request.

**Request Body:**
\`\`\`json
{
  "site_url": "https://example.com",
  "repo_url": "https://github.com/user/repo" // optional
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "uuid",
  "status": "pending"
}
\`\`\`

**Side Effects:**
- Inserts audit record with status "pending"
- Triggers audit processing job (see below)

---

#### `GET /api/audits/:id`
Fetches audit details and results.

**Response:**
\`\`\`json
{
  "id": "uuid",
  "site_url": "https://example.com",
  "status": "completed",
  "results": { /* results JSON */ },
  "created_at": "timestamp"
}
\`\`\`

---

## Server Actions

### `lib/search-action.ts`
\`\`\`typescript
async function searchDocs(query: string): Promise<SearchResult[]>
\`\`\`
Searches documentation using keyword filtering.

---

### `app/actions/stripe.ts`

#### `createCheckoutSession`
\`\`\`typescript
async function createCheckoutSession(
  priceId: string,
  type: 'subscription' | 'payment'
): Promise<{ url: string }>
\`\`\`
Creates Stripe checkout session for subscriptions or one-time audits.

**Plans:**
- `price_pro_monthly`: Pro plan at $29/month
- `price_audit_onetime`: Single audit at $5

---

## Audit Processing Pipeline

### Step 1: Trigger Audit
When a user creates an audit:
1. Insert audit record with `status: 'pending'`
2. Trigger background job (implement with Vercel Cron or external service)

### Step 2: Run Karen CLI
Backend job should:
1. Update audit status to `'running'`
2. Execute Karen CLI against the `site_url`:
   \`\`\`bash
   karen audit --url <site_url> --output json
   \`\`\`
3. Parse Karen's JSON output
4. Take screenshots of issues
5. Store results in audit's `results` JSONB column

### Step 3: Generate Fixes (Pro Users Only)
For Pro users with GitHub connected:
1. Parse detected issues
2. Generate CSS/HTML fixes using Claude API
3. Create branch in user's repo
4. Commit fixes
5. Create Pull Request with:
   - Before/after screenshots
   - Karen's roast messages
   - Detailed fix explanations
6. Store PR URL in results

### Step 4: Update Status
1. Update audit status to `'completed'` or `'failed'`
2. Send notification to user (email or in-app)

---

## Environment Variables

### Required

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# GitHub OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_REDIRECT_URI=https://yourdomain.com/api/github/callback

# Upstash Vector Search
UPSTASH_SEARCH_REST_URL=https://xxx.upstash.io
UPSTASH_SEARCH_REST_TOKEN=xxx

# App Config
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Claude API (for AI fixes)
ANTHROPIC_API_KEY=sk-ant-xxx
\`\`\`

---

## Data Flow Diagrams

### User Registration Flow
\`\`\`
User clicks "Sign in with Google"
  → /auth/login
  → Google OAuth consent
  → /auth/callback
  → Supabase creates auth.users entry
  → Trigger: handle_new_user()
  → Creates profiles + subscriptions entries
  → Redirect to /dashboard
\`\`\`

### Audit Creation Flow (Free User)
\`\`\`
User creates audit
  → POST /api/audits/create
  → Insert audit (status: pending)
  → Background job picks up audit
  → Run Karen CLI
  → Store results in audits.results
  → Update status to completed
  → User views results in dashboard
\`\`\`

### Audit Creation Flow (Pro User + GitHub)
\`\`\`
User creates audit
  → POST /api/audits/create
  → Insert audit (status: pending)
  → Background job picks up audit
  → Run Karen CLI
  → Call Claude API for fixes
  → Create branch in GitHub
  → Commit fixes
  → Create Pull Request
  → Store PR URL in results
  → Update status to completed
  → User reviews PR and merges
\`\`\`

### Subscription Purchase Flow
\`\`\`
User clicks "Upgrade to Pro"
  → createCheckoutSession('price_pro_monthly', 'subscription')
  → Redirect to Stripe Checkout
  → User completes payment
  → Stripe webhook: checkout.session.completed
  → /api/webhooks/stripe
  → Update subscriptions table
  → User has Pro access
\`\`\`

---

## Security Considerations

### Row Level Security (RLS)
All tables use RLS policies to ensure users can only access their own data.

### Token Storage
- GitHub access tokens should be encrypted at rest
- Use Supabase Vault or environment variables for sensitive keys

### API Rate Limiting
Implement rate limiting on:
- Audit creation (prevent abuse)
- API endpoints (DDoS protection)

### Webhook Verification
Always verify Stripe webhook signatures using `stripe.webhooks.constructEvent()`

---

## Integration Points

### 1. Karen CLI
The CLI tool that performs the actual audits. Backend should:
- Install Karen CLI in serverless function or Docker container
- Execute with proper flags: `--url`, `--output json`, `--config`
- Parse JSON output for storage

### 2. Claude AI (Anthropic)
Used for generating CSS/HTML fixes:
\`\`\`typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: `Fix this CSS issue: ${issue.message}\n\nCurrent code:\n${issue.fix.before}`
  }]
});
\`\`\`

### 3. GitHub API
For creating PRs with fixes:
\`\`\`typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: githubAccessToken });

// Create branch
await octokit.git.createRef({
  owner,
  repo,
  ref: 'refs/heads/karen-fixes-123',
  sha: mainBranchSha
});

// Create/update files
await octokit.repos.createOrUpdateFileContents({
  owner,
  repo,
  path: 'styles.css',
  message: 'Fix: Overflow issues in header',
  content: base64Content,
  branch: 'karen-fixes-123'
});

// Create PR
await octokit.pulls.create({
  owner,
  repo,
  title: 'Karen found 15 layout issues',
  head: 'karen-fixes-123',
  base: 'main',
  body: prDescription
});
\`\`\`

---

## Recommended Next Steps for Claude

### Phase 1: Core Backend Setup
1. Set up Supabase database with provided SQL scripts
2. Implement audit processing job (use Vercel Cron or Inngest)
3. Create `/api/audits/create` endpoint
4. Create `/api/audits/:id` endpoint

### Phase 2: Karen CLI Integration
1. Package Karen CLI in serverless-friendly format
2. Implement audit execution logic
3. Parse and store results
4. Handle screenshots and artifacts

### Phase 3: AI Fix Generation
1. Integrate Claude API
2. Build prompt templates for each issue type
3. Generate CSS/HTML fixes
4. Validate fixes before committing

### Phase 4: GitHub Integration
1. Implement PR creation logic
2. Format PR descriptions with screenshots
3. Handle branch conflicts
4. Add retry logic for failed operations

### Phase 5: Monitoring & Optimization
1. Add logging (Vercel Analytics, Sentry)
2. Implement queue system for audit processing
3. Add webhook retry logic
4. Set up alerting for failed audits

---

## Example API Contracts

### Create Audit Request
\`\`\`typescript
POST /api/audits/create

Headers:
  Authorization: Bearer <supabase-jwt>

Body:
{
  "site_url": "https://example.com",
  "repo_url": "https://github.com/user/repo",
  "config": {
    "viewports": ["mobile", "tablet", "desktop"],
    "features": ["overflow", "spacing", "typescale", "accessibility"]
  }
}

Response:
{
  "success": true,
  "audit": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

### Get Audit Results
\`\`\`typescript
GET /api/audits/550e8400-e29b-41d4-a716-446655440000

Headers:
  Authorization: Bearer <supabase-jwt>

Response:
{
  "success": true,
  "audit": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "site_url": "https://example.com",
    "status": "completed",
    "results": {
      "issues": [...],
      "summary": {...},
      "pr_url": "https://github.com/user/repo/pull/42"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:35:00Z"
  }
}
\`\`\`

---

## File Structure

\`\`\`
karen-cli-platform/
├── app/
│   ├── api/
│   │   ├── audits/
│   │   │   ├── create/route.ts
│   │   │   └── [id]/route.ts
│   │   ├── github/
│   │   │   ├── authorize/route.ts
│   │   │   └── callback/route.ts
│   │   └── webhooks/
│   │       └── stripe/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── callback/route.ts
│   │   └── error/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── settings/page.tsx
│   └── pricing/page.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── stripe.ts
│   ├── github.ts
│   └── karen-runner.ts  // TO BE IMPLEMENTED
├── scripts/
│   ├── 001_create_profiles.sql
│   └── 002_create_github_connections.sql
└── middleware.ts
\`\`\`

---

This architecture provides a complete blueprint for building the Karen CLI managed service backend. Use this document as the source of truth when implementing the audit processing pipeline and API endpoints.
