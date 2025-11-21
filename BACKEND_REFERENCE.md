# Karen CLI Backend - Complete Reference Guide

**Last Updated:** November 21, 2025
**Version:** 1.0.0

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Authentication Patterns](#authentication-patterns)
3. [Database Schema](#database-schema)
4. [Complete Audit Flow](#complete-audit-flow)
5. [API Endpoints](#api-endpoints)
6. [Background Worker Implementation](#background-worker-implementation)
7. [Tech Stack](#tech-stack)
8. [Environment Variables](#environment-variables)
9. [Deployment](#deployment)
10. [Key Implementation Notes](#key-implementation-notes)

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     KAREN CLI ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐              ┌──────────────────┐    │
│  │   CLI (Client)   │              │   Web Backend    │    │
│  │  - Local exec    │              │   - SaaS service │    │
│  │  - gh CLI auth   │              │   - OAuth auth   │    │
│  │  - Git cloning   │              │   - GitHub API   │    │
│  └──────────────────┘              └──────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Shared Detectors & Logic                │   │
│  │  - Overflow, Spacing, Typography, etc.              │   │
│  │  - Claude Vision Analysis                            │   │
│  │  - AI Fix Generation                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Separation: CLI vs Backend

| Aspect | CLI (karen-cli) | Backend (karen-backend) |
|--------|-----------------|-------------------------|
| **Execution** | User's machine | Cloud (Vercel/AWS) |
| **Authentication** | `gh auth login` (GitHub CLI) | OAuth 2.0 tokens |
| **Git Operations** | Local clone + push | GitHub API only |
| **Token Storage** | `~/.config/gh/` (managed by gh) | Supabase (encrypted) |
| **Use Case** | Developer workflow | SaaS product |
| **Dependencies** | simple-git, gh CLI | @octokit/rest, axios |

---

## Authentication Patterns

### CLI Authentication Flow

```bash
# 1. User authenticates with GitHub CLI (one-time setup)
$ gh auth login
# Opens browser, completes OAuth, stores token in ~/.config/gh/

# 2. Karen CLI uses gh CLI for all GitHub operations
$ karen audit https://example.com --create-pr
# ✓ Auto-detects repo from git remote
# ✓ Uses gh CLI to create PR (no manual tokens!)
# ✓ Git operations use native credentials (SSH/HTTPS)
```

**Implementation:**
- Check auth: `gh auth status`
- Create PR: `gh pr create --repo owner/repo --title "..." --body-file pr-body.md`
- Auto-detect repo: Read from `git remote get-url origin`

### Backend OAuth Flow

```
1. User clicks "Connect GitHub" in dashboard
   ↓
2. Redirect to: GET /api/github/oauth/authorize
   ↓
3. GitHub OAuth page: authorize app
   ↓
4. Callback: GET /api/github/oauth/callback?code=xxx
   ↓
5. Exchange code for access_token
   ↓
6. Store token in github_connections table (ENCRYPTED!)
   ↓
7. Use token for GitHub API operations (@octokit/rest)
```

**Implementation:**
- OAuth endpoints in `github.controller.ts`
- Token exchange in `github.service.ts`
- PR creation via Octokit: `octokit.pulls.create()`
- File updates via API: `octokit.repos.createOrUpdateFileContents()`

---

## Database Schema

### Core Tables (Supabase PostgreSQL)

```sql
-- User Management
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  tier TEXT CHECK (tier IN ('free', 'managed', 'pro')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  github_repo_full_name TEXT, -- "owner/repo"
  github_branch TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  viewports JSONB DEFAULT '[]'::jsonb, -- Array of viewport objects
  spacing_scale INTEGER[] DEFAULT '{4,8,12,16,24,32,48,64}'::integer[],
  type_scale JSONB DEFAULT '{}'::jsonb,
  color_palette JSONB DEFAULT '{}'::jsonb,
  auto_fix_enabled BOOLEAN DEFAULT false,
  auto_create_pr BOOLEAN DEFAULT false,
  schedule_cron TEXT, -- e.g., "0 0 * * *"
  fail_on_critical INTEGER DEFAULT 0,
  fail_on_high INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audits
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES profiles(id),
  version INTEGER NOT NULL, -- Auto-increment per project
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  triggered_by TEXT CHECK (triggered_by IN ('manual', 'scheduled', 'ci')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  high_issues INTEGER DEFAULT 0,
  medium_issues INTEGER DEFAULT 0,
  low_issues INTEGER DEFAULT 0,
  pr_url TEXT,
  pr_number INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screenshots
CREATE TABLE screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  viewport TEXT NOT NULL, -- "iPhone 12 - 390x844"
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  screenshot_url TEXT NOT NULL, -- Vercel Blob URL
  thumbnail_url TEXT, -- Compressed version
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- "overflow", "spacing", "typography", etc.
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT NOT NULL,
  element_selector TEXT,
  viewport TEXT,
  screenshot_url TEXT,
  file_path TEXT,
  line_number INTEGER,
  code_snippet TEXT,
  karen_roast TEXT, -- The sassy comment
  has_suggested_fix BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('open', 'fixed', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixes
CREATE TABLE fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES audits(id),
  fix_type TEXT CHECK (fix_type IN ('code-change', 'style-addition', 'refactor')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  file_path TEXT NOT NULL,
  original_code TEXT,
  fixed_code TEXT NOT NULL,
  diff TEXT,
  explanation TEXT,
  status TEXT CHECK (status IN ('suggested', 'applied', 'rejected')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub Connections (OAuth)
CREATE TABLE github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  github_user_id INTEGER NOT NULL,
  github_login TEXT NOT NULL,
  access_token TEXT NOT NULL, -- ENCRYPT THIS!
  scope TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Complete Audit Flow

### Step-by-Step Execution

```
┌─────────────────────────────────────────────────────────────┐
│  USER TRIGGERS AUDIT                                         │
│  - Manual: Dashboard "Run Audit" button                     │
│  - Scheduled: Cron job                                       │
│  - CI: Webhook from GitHub Actions                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: AUDIT CREATION (10 seconds)                       │
│                                                              │
│  1. POST /api/audits/create                                 │
│  2. Validate user subscription & quota                      │
│  3. Create audit record (status: pending)                   │
│  4. Queue job to Upstash Redis                              │
│  5. Return audit ID to user                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: SCREENSHOT CAPTURE (2-5 minutes)                  │
│                                                              │
│  For each viewport (70+ combinations):                      │
│    1. Launch Playwright browser                             │
│    2. Navigate to project URL                               │
│    3. Set viewport dimensions                               │
│    4. Wait for page load + 2s                               │
│    5. Capture full-page screenshot                          │
│    6. Upload to Vercel Blob Storage                         │
│    7. Create thumbnail (300px wide)                         │
│    8. Insert record into screenshots table                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: VISUAL ANALYSIS WITH CLAUDE (3-7 minutes)         │
│                                                              │
│  Batch process (5 screenshots at a time):                   │
│    1. Convert screenshot to base64                          │
│    2. Send to Claude Vision API with prompt:               │
│       "Analyze for overflow, responsive breaks, spacing"   │
│    3. Claude returns structured JSON with issues            │
│    4. Extract category, severity, description, selector    │
│    5. Add Karen's roast for each issue                      │
│    6. Insert issues into issues table                       │
│                                                              │
│  Example Issue:                                              │
│  {                                                           │
│    category: "overflow",                                     │
│    severity: "critical",                                     │
│    description: "Hero text overflows container",            │
│    element_selector: ".hero h1",                            │
│    viewport: "iPhone 12 - 390x844",                         │
│    karen_roast: "Sweetie, your hero text is literally       │
│                  breaking its container. Test on mobile?"   │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: CODE ANALYSIS (2-4 minutes)                       │
│  (Only if GitHub repo connected)                            │
│                                                              │
│  1. Clone repository to /tmp/audit-{id}                     │
│  2. Parse all CSS/SCSS/styled-components files              │
│  3. Run static analysis:                                    │
│     a) Spacing violations (17px, 23px not in scale)         │
│     b) Typography violations (font-size not in scale)       │
│     c) Color violations (near-duplicates, off-brand)        │
│     d) Accessibility (contrast ratios < 4.5:1)              │
│  4. Extract file path, line number, code snippet            │
│  5. Insert code issues into issues table                    │
│                                                              │
│  Example Issue:                                              │
│  {                                                           │
│    category: "spacing",                                      │
│    severity: "medium",                                       │
│    description: "Spacing value 23px not in design system",  │
│    element_selector: ".card",                               │
│    file_path: "components/Card.tsx",                        │
│    line_number: 42,                                          │
│    code_snippet: "padding: 23px;",                          │
│    karen_roast: "23px? Pick a number from the spacing       │
│                  scale, sweetie. This isn't a guessing      │
│                  game."                                      │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: AI FIX GENERATION (1-3 minutes)                   │
│                                                              │
│  For each issue with severity >= "high":                    │
│    1. Fetch surrounding code context (±10 lines)            │
│    2. Send to Claude Sonnet with prompt:                    │
│       "Fix this issue while maintaining design system"     │
│    3. Claude returns:                                        │
│       - fix_type: "code-change" | "style-addition"         │
│       - confidence: 0.0-1.0                                 │
│       - original_code: "..."                                │
│       - fixed_code: "..."                                   │
│       - diff: unified diff format                           │
│       - explanation: human-readable                         │
│    4. Insert into fixes table                               │
│    5. Update issue: has_suggested_fix = true                │
│                                                              │
│  Example Fix:                                                │
│  {                                                           │
│    fix_type: "code-change",                                 │
│    confidence: 0.95,                                         │
│    file_path: "components/Hero.tsx",                        │
│    original_code: '<h1 className="text-5xl">',              │
│    fixed_code: '<h1 className="text-4xl md:text-5xl">',    │
│    explanation: "Add responsive text sizing",               │
│    diff: "- text-5xl\n+ text-4xl md:text-5xl"              │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 6: APPLY FIXES (if auto-fix enabled)                │
│                                                              │
│  If audit_config.auto_fix_enabled:                          │
│    1. Filter fixes with confidence >= 0.85                  │
│    2. Create Git branch: "karen-audit-{audit_id}"           │
│    3. For each fix:                                         │
│       a) Read file content                                  │
│       b) Apply string replacement                           │
│       c) Write updated file                                 │
│       d) Git add & commit                                   │
│    4. Push branch to remote                                 │
│    5. Create Pull Request:                                  │
│       - Title: "Karen Audit #{version} - {n} fixes"        │
│       - Body: Detailed list + Karen's roasts               │
│       - Using: gh CLI (CLI) or Octokit (Backend)           │
│    6. Update audit record:                                  │
│       - pr_url: "https://github.com/..."                    │
│       - pr_number: 123                                      │
│    7. Update fix records: status = "applied"                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 7: FINALIZE AUDIT (10 seconds)                      │
│                                                              │
│  1. Calculate summary:                                      │
│     - total_issues = COUNT(issues)                          │
│     - critical_issues = COUNT WHERE severity = critical     │
│     - high_issues = COUNT WHERE severity = high             │
│     - medium_issues = COUNT WHERE severity = medium         │
│     - low_issues = COUNT WHERE severity = low               │
│  2. Calculate duration: (completed_at - started_at)         │
│  3. Update audit record:                                    │
│     - status = "completed"                                  │
│     - completed_at = NOW()                                  │
│     - duration_seconds = (end - start)                      │
│     - summary fields populated                              │
│  4. Send notification:                                      │
│     - Email to user                                         │
│     - Webhook to CI (if triggered from CI)                  │
│  5. Cleanup temporary files                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Audit Management

```typescript
POST /api/audits/create
Body: {
  projectId: string
  triggeredBy: "manual" | "scheduled" | "ci"
}
Response: {
  auditId: string
  status: "pending"
  estimatedDuration: number
}

GET /api/audits/:auditId
Response: {
  audit: Audit
  issues: Issue[]
  screenshots: Screenshot[]
  fixes: Fix[]
}

POST /api/audits/:auditId/rerun
Response: {
  newAuditId: string
}
```

### Fixes Management

```typescript
POST /api/fixes/:fixId/approve
Body: {}
Response: { success: boolean }

POST /api/fixes/:fixId/reject
Body: { reason?: string }
Response: { success: boolean }

GET /api/fixes/:fixId/preview
Response: {
  original: string
  fixed: string
  diff: string
}
```

### Projects

```typescript
GET /api/projects
Response: { projects: Project[] }

POST /api/projects/create
Body: {
  name: string
  url: string
  description?: string
  github_repo?: string
}
Response: { project: Project }

PATCH /api/projects/:projectId
Body: Partial<Project>
Response: { project: Project }

DELETE /api/projects/:projectId
Response: { success: boolean }
```

### GitHub OAuth (Backend Only)

```typescript
GET /api/github/oauth/authorize
// Redirects to GitHub OAuth page

GET /api/github/oauth/callback?code=xxx
// Exchanges code for token, stores in DB

GET /api/github/repos?access_token=xxx
Response: {
  repos: Array<{
    full_name: string
    description: string
    default_branch: string
  }>
}

POST /api/github/create-pr
Body: {
  accessToken: string
  repoUrl: string
  issues: Issue[]
}
Response: {
  prUrl: string
  prNumber: number
}
```

### Webhooks

```typescript
POST /api/webhooks/stripe
// Stripe subscription events

POST /api/webhooks/github
// PR status updates (merged, closed, etc.)

POST /api/cron/scheduled-audits
Headers: { Authorization: Bearer CRON_SECRET }
// Triggers scheduled audits
```

---

## Background Worker Implementation

### Job Queue (Upstash Redis + Inngest)

```typescript
// Add job to queue
import { inngest } from '@/lib/inngest'

await inngest.send({
  name: 'audit/execute',
  data: {
    auditId: audit.id,
    projectId: audit.project_id,
    userId: audit.user_id,
  },
})
```

### Worker Function

```typescript
// app/api/inngest/route.ts
import { inngest } from '@/lib/inngest'
import { serve } from 'inngest/next'

const executeAudit = inngest.createFunction(
  { name: 'Execute Karen Audit' },
  { event: 'audit/execute' },
  async ({ event, step }) => {
    const { auditId } = event.data

    // Phase 1: Setup
    const context = await step.run('setup', async () => {
      const audit = await getAudit(auditId)
      const project = await getProject(audit.project_id)
      const config = await getAuditConfig(project.id)
      return { audit, project, config }
    })

    // Phase 2: Screenshots
    const screenshots = await step.run('capture-screenshots', async () => {
      return await captureAllScreenshots(context.project.url, context.config.viewports)
    })

    // Phase 3: Visual Analysis
    const visualIssues = await step.run('analyze-visual', async () => {
      return await analyzeWithClaudeVision(screenshots)
    })

    // Phase 4: Code Analysis
    const codeIssues = await step.run('analyze-code', async () => {
      if (!context.project.github_repo_full_name) return []
      return await analyzeCode(context.project.github_repo_full_name, context.config)
    })

    // Phase 5: Generate Fixes
    const fixes = await step.run('generate-fixes', async () => {
      const allIssues = [...visualIssues, ...codeIssues]
      const highPriority = allIssues.filter(i => ['critical', 'high'].includes(i.severity))
      return await generateFixes(highPriority)
    })

    // Phase 6: Apply Fixes (if enabled)
    if (context.config.auto_fix_enabled) {
      await step.run('apply-fixes', async () => {
        return await applyFixesAndCreatePR(auditId, context.project, fixes)
      })
    }

    // Phase 7: Finalize
    await step.run('finalize', async () => {
      await finalizeAudit(auditId, visualIssues, codeIssues, fixes)
    })
  }
)

export const { GET, POST, PUT } = serve(inngest, [executeAudit])
```

---

## Tech Stack

### CLI (karen-cli)

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "playwright": "^1.40.0",
    "simple-git": "^3.30.0",
    "commander": "^11.1.0",
    "ora": "^7.0.1",
    "picocolors": "^1.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.10.0"
  }
}
```

**External Dependencies:**
- GitHub CLI (`gh`) - Installed on user's machine
- Git - Native credential storage

### Backend (karen-backend)

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "@octokit/rest": "^20.0.0",
    "@vercel/blob": "^0.15.0",
    "playwright": "^1.40.0",
    "stripe": "^14.0.0",
    "inngest": "^3.0.0",
    "axios": "^1.6.0",
    "sharp": "^0.33.0"
  }
}
```

---

## Environment Variables

### CLI (.env)

```bash
# Required for AI analysis
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Optional (overrides)
OUTPUT_DIR=./output
NODE_ENV=production
```

### Backend (.env)

```bash
# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# Upstash Redis (Job Queue)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxx

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxx
GITHUB_REDIRECT_URI=https://karen-cli.com/api/github/oauth/callback

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_MANAGED_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx

# App Config
NEXT_PUBLIC_APP_URL=https://karen-cli.com
FRONTEND_URL=https://karen-cli.com
PORT=4000
NODE_ENV=production

# Cron Secret (for scheduled audits)
CRON_SECRET=xxxxxxxxxxxxx

# Logging
LOG_LEVEL=info
```

---

## Deployment

### CLI Distribution

```bash
# Build
pnpm build

# Pack for npm
pnpm pack

# Publish to npm
npm publish

# Users install globally
npm install -g karen-cli

# Or run directly
npx karen-cli audit https://example.com
```

### Backend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add SUPABASE_URL
# ... etc
```

### Docker Container (Background Workers)

```dockerfile
FROM node:20-alpine

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Install system dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Entrypoint
CMD ["node", "dist/worker.js"]
```

**Deploy to:**
- AWS Lambda (with Docker support)
- Google Cloud Run
- Fly.io
- Railway

---

## Key Implementation Notes

### 1. Authentication Differences

**CLI:**
- User runs `gh auth login` once
- Karen CLI automatically uses `gh` CLI for all GitHub operations
- No token management in Karen's code
- Git operations use native credentials (SSH keys, credential manager)

**Backend:**
- User authorizes Karen app via OAuth
- Backend stores encrypted access token in Supabase
- Backend uses Octokit with stored token
- No local git operations - all via GitHub API

### 2. PR Creation Differences

**CLI (github-fixer.ts):**
```typescript
// Clone repo locally
await git.clone('https://github.com/owner/repo.git', tempDir)

// Apply fixes to local files
await fs.writeFile(filePath, fixedContent)

// Commit and push
await git.add('.')
await git.commit('fix: message')
await git.push('origin', branchName)

// Create PR with gh CLI
await execAsync(`gh pr create --repo owner/repo --title "..." --body-file body.md`)
```

**Backend (github.service.ts):**
```typescript
// Never clones - uses GitHub API only
const octokit = new Octokit({ auth: accessToken })

// Create branch
await octokit.git.createRef({
  ref: `refs/heads/${branchName}`,
  sha: mainSha,
})

// Update files via API
await octokit.repos.createOrUpdateFileContents({
  path: filePath,
  content: Buffer.from(fixedContent).toString('base64'),
  message: 'fix: message',
  branch: branchName,
})

// Create PR
await octokit.pulls.create({
  title: '...',
  head: branchName,
  base: 'main',
  body: '...',
})
```

### 3. Rate Limiting & Quotas

```typescript
// Check quota before audit
async function checkQuota(userId: string) {
  const subscription = await getSubscription(userId)

  switch (subscription.tier) {
    case 'free':
      return { allowed: 0, message: 'Upgrade to run audits' }

    case 'managed':
      const purchases = await getAuditPurchases(userId)
      const used = await getAuditsThisMonth(userId)
      return { allowed: purchases - used, message: `${purchases - used} audits remaining` }

    case 'pro':
      const used = await getAuditsThisMonth(userId)
      return { allowed: 50 - used, message: `${50 - used}/50 audits remaining this month` }
  }
}
```

### 4. Error Handling

```typescript
// Audit failure scenarios
try {
  await executeAudit(auditId)
} catch (error) {
  await updateAudit(auditId, {
    status: 'failed',
    error_message: error.message,
    completed_at: new Date(),
  })

  await sendErrorNotification(userId, {
    auditId,
    error: error.message,
  })

  // Retry logic for transient errors
  if (isRetryable(error)) {
    await scheduleRetry(auditId, retryCount + 1)
  }
}
```

### 5. Screenshot Optimization

```typescript
import sharp from 'sharp'

async function optimizeScreenshot(buffer: Buffer) {
  // Compress full image
  const compressed = await sharp(buffer)
    .png({ quality: 80, compressionLevel: 9 })
    .toBuffer()

  // Generate thumbnail
  const thumbnail = await sharp(buffer)
    .resize(300, null, { fit: 'inside' })
    .png({ quality: 70 })
    .toBuffer()

  // Upload both
  const fullUrl = await uploadToBlob(compressed, 'screenshots')
  const thumbUrl = await uploadToBlob(thumbnail, 'thumbnails')

  return { fullUrl, thumbUrl }
}
```

### 6. Claude API Best Practices

```typescript
// Batch visual analysis (5 screenshots at once)
async function analyzeVisualBatch(screenshots: Screenshot[]) {
  const chunks = chunk(screenshots, 5)

  for (const batch of chunks) {
    const content = batch.flatMap(s => [
      { type: 'image', source: { type: 'base64', data: s.base64 } },
      { type: 'text', text: `Viewport: ${s.viewport.name}` },
    ])

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    })

    // Parse and save issues
    const issues = parseClaudeResponse(response)
    await saveIssues(issues)
  }
}
```

---

## Success Metrics

- ✅ CLI runs audits locally without SaaS
- ✅ CLI authenticates via `gh auth login` (no manual tokens)
- ✅ Backend handles OAuth for web users
- ✅ 70+ viewport matrix captured in < 5 minutes
- ✅ Claude Vision identifies visual issues accurately
- ✅ Code analysis detects spacing/typography violations
- ✅ AI generates fixes with 85%+ confidence
- ✅ PRs created automatically (CLI: gh CLI, Backend: Octokit)
- ✅ Subscription tiers enforce correct quotas
- ✅ Complete audit finishes in < 10 minutes

---

## Quick Reference Commands

### CLI Usage

```bash
# Install
npm install -g karen-cli

# Authenticate with GitHub
gh auth login

# Run audit
karen audit https://example.com

# Run audit with PR creation
karen audit https://example.com --create-pr

# Run audit with custom repo (overrides auto-detect)
karen audit https://example.com --create-pr --github-repo https://github.com/user/repo

# Run audit with custom branch name
karen audit https://example.com --create-pr --branch my-fixes

# Run audit with custom config
karen audit https://example.com --config karen.config.js

# Run audit without AI
karen audit https://example.com --no-ai
```

### Development

```bash
# CLI development
cd packages/karen-cli
pnpm install
pnpm dev
pnpm test
pnpm build

# Backend development
cd packages/karen-backend
pnpm install
pnpm dev
pnpm test
pnpm build
```

---

**END OF REFERENCE DOCUMENT**

Return to this document whenever context is lost or clarification is needed.
