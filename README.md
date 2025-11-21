# Karen CLI Platform

> Sassy CSS layout auditor with AI-powered visual analysis and managed service platform

Karen CLI is a comprehensive CSS layout auditing platform that combines a powerful CLI tool with a managed service for automated fixes and PR generation.

## Architecture

This monorepo contains three main packages:

### 📦 Packages

1. **karen-cli** - CLI tool for CSS layout auditing
   - Multi-viewport testing (mobile, tablet, desktop, ultrawide)
   - AI-powered visual analysis using Claude Sonnet 4.5
   - Accessibility & WCAG contrast checking
   - Design system enforcement (spacing, typescale, colors)
   - Containerized with Docker

2. **karen-backend** - NestJS API service
   - Audit processing and management
   - Stripe integration for payments
   - GitHub OAuth and PR creation
   - Supabase integration for data storage
   - Result monad pattern for robust error handling

3. **karen-web** - Next.js 16 web platform *(Coming soon)*
   - User dashboard
   - Audit management interface
   - Subscription management
   - GitHub repository integration

## Features

✨ **Multi-Viewport Testing** - Test across mobile, tablet, desktop, and ultrawide screens
🤖 **AI-Powered Analysis** - Claude vision API detects visual layout issues
♿ **Accessibility Checks** - WCAG contrast ratio validation
📏 **Design System Enforcement** - Spacing scale, typescale, and color palette validation
🔧 **Auto-Fix Suggestions** - Get code fixes for detected issues
🐳 **Containerized** - Run anywhere with Docker
💳 **Managed Service** - Automated fixes with PR creation (Pro plan)
📊 **Multiple Output Formats** - JSON and Markdown reports

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: NestJS (TypeScript)
- **CLI**: Node.js 20, Playwright, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Payments**: Stripe
- **AI**: Anthropic Claude Sonnet 4.5
- **Infrastructure**: Docker, Vercel
- **Error Handling**: neverthrow (Result monad pattern)

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker (for running Karen CLI)
- Supabase account
- Stripe account
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/KarenCLI.git
cd KarenCLI

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Karen CLI Usage

```bash
# Navigate to CLI package
cd packages/karen-cli

# Run audit
pnpm karen audit https://example.com --api-key sk-ant-xxx

# With custom config
pnpm karen audit https://example.com --config karen.config.js

# Using Docker
docker build -t karen-cli .
docker run -e ANTHROPIC_API_KEY=sk-ant-xxx karen-cli audit https://example.com
```

### Backend Service Setup

```bash
# Navigate to backend package
cd packages/karen-backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Run development server
pnpm dev

# Build for production
pnpm build
pnpm start
```

### Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Run migrations
supabase db push

# Or connect to existing Supabase project
supabase link --project-ref your-project-ref
```

## Configuration

### Karen CLI Config (karen.config.js)

```javascript
export default {
  spacingScale: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  typescale: {
    base: 16,
    ratio: 1.25,
    sizes: [12, 14, 16, 20, 25, 31, 39, 49],
  },
  colorPalette: [
    '#F5E6D3', // Karen blonde theme
    '#D4A574',
    '#8B7355',
  ],
  breakpoints: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ],
  failOn: ['critical', 'high'], // For CI integration
  features: ['overflow', 'spacing', 'typescale', 'accessibility'],
};
```

### Environment Variables

#### Backend (.env)

```bash
PORT=4000
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# GitHub OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
```

## Project Structure

```
KarenCLI/
├── packages/
│   ├── karen-cli/              # CLI Tool
│   │   ├── src/
│   │   │   ├── core/           # Core functionality
│   │   │   │   ├── browser.ts  # Playwright automation
│   │   │   │   ├── claude.ts   # AI integration
│   │   │   │   ├── audit-engine.ts
│   │   │   │   └── result.ts   # Result monad
│   │   │   ├── detectors/      # Issue detectors
│   │   │   │   ├── overflow.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── typescale.ts
│   │   │   │   └── accessibility.ts
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── utils/          # Utilities
│   │   │   ├── cli.ts          # CLI entry point
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── karen-backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── audits/         # Audit module
│   │   │   ├── github/         # GitHub integration
│   │   │   ├── stripe/         # Stripe integration
│   │   │   ├── supabase/       # Database
│   │   │   ├── common/         # Shared utilities
│   │   │   │   └── result.ts   # Result monad
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── karen-web/              # Next.js Platform (TBD)
│       └── package.json
│
├── supabase/
│   ├── migrations/             # Database migrations
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_subscriptions.sql
│   │   ├── 003_create_audits.sql
│   │   └── 004_create_github_connections.sql
│   └── config.toml
│
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── implmentation_guide.md
│   └── karen-cli_architecture.md
│
├── package.json                # Root package
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

## Development

### Monorepo Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all packages in dev mode
pnpm dev

# Run specific package
pnpm --filter karen-cli dev
pnpm --filter karen-backend dev

# Lint all packages
pnpm lint

# Clean all build artifacts
pnpm clean
```

### Running Tests

```bash
# Run tests for all packages
pnpm test

# Run tests for specific package
pnpm --filter karen-cli test
```

## API Documentation

### Audits API

#### Create Audit

```bash
POST /api/audits/create
Content-Type: application/json

{
  "siteUrl": "https://example.com",
  "repoUrl": "https://github.com/user/repo"
}
```

#### Get Audit

```bash
GET /api/audits/:id
```

#### List User Audits

```bash
GET /api/audits
```

## Deployment

### Docker Deployment

```bash
# Build Karen CLI image
cd packages/karen-cli
docker build -t karen-cli .

# Run container
docker run -e ANTHROPIC_API_KEY=xxx karen-cli audit https://example.com
```

### NestJS Backend

```bash
# Build
cd packages/karen-backend
pnpm build

# Run production
NODE_ENV=production pnpm start
```

### Database Migrations

```bash
# Run migrations
supabase db push

# Reset database (CAUTION: Deletes all data)
supabase db reset
```

## Architecture Highlights

### Result Monad Pattern

This project uses the Result monad (via `neverthrow`) for robust error handling, similar to Kotlin's `Result` type:

```typescript
import { ok, err, type Result } from 'neverthrow';

async function createAudit(): Promise<Result<Audit, ServiceError>> {
  const result = await database.insert(audit);

  if (result.success) {
    return ok(result.data);
  } else {
    return err(ServiceError.databaseError('Failed to create audit'));
  }
}

// Usage
const result = await createAudit();

result.match(
  (audit) => console.log('Success:', audit.id),
  (error) => console.error('Error:', error.message)
);
```

### Clean Service Layer

Services return `Result<T, ServiceError>` instead of throwing exceptions, making error paths explicit and type-safe.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © Sahar Barak

## Acknowledgments

- Built with ❤️ using Claude Code
- Inspired by the need for better CSS layout tooling
- AI-powered by Anthropic Claude

---

**Note**: This is a work in progress. The Next.js web platform (karen-web) is coming soon!
