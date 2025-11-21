# Karen CLI Backend - Implementation Guide for Claude

This guide provides step-by-step instructions for implementing the Karen CLI backend audit processing system.

---

## Prerequisites

Before starting, ensure you have:
- Supabase project created with database tables (run SQL scripts)
- Stripe account with products configured
- GitHub OAuth app created
- Claude API key from Anthropic
- Karen CLI package (you'll need to create or integrate this)

---

## Step 1: Implement Audit Creation API

Create the endpoint that receives audit requests from the dashboard.

**File:** `app/api/audits/create/route.ts`

\`\`\`typescript
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { site_url, repo_url } = await request.json();
    
    // Validate site_url
    if (!site_url || !site_url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid site_url' }, { status: 400 });
    }

    // Check user's subscription plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .single();

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
    }

    // Create audit record
    const { data: audit, error: insertError } = await supabase
      .from('audits')
      .insert({
        user_id: user.id,
        site_url,
        repo_url,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // TODO: Trigger background job to process audit
    // For now, we'll trigger it directly (replace with queue system)
    await triggerAuditJob(audit.id);

    return NextResponse.json({
      success: true,
      audit: {
        id: audit.id,
        status: audit.status,
        created_at: audit.created_at
      }
    });
  } catch (error) {
    console.error('[v0] Error creating audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Placeholder for job trigger
async function triggerAuditJob(auditId: string) {
  // TODO: Replace with actual job queue (Vercel Cron, Inngest, BullMQ, etc.)
  console.log('[v0] Triggered audit job for:', auditId);
}
\`\`\`

---

## Step 2: Implement Karen CLI Runner

Create the module that executes Karen CLI and parses results.

**File:** `lib/karen-runner.ts`

\`\`\`typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import puppeteer from 'puppeteer';

const execAsync = promisify(exec);

export interface KarenIssue {
  id: string;
  type: 'overflow' | 'spacing' | 'typescale' | 'color' | 'accessibility' | 'design-system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: string;
  viewport: string;
  message: string;
  screenshot?: string;
  fix?: {
    file: string;
    before: string;
    after: string;
  };
}

export interface KarenResults {
  issues: KarenIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export async function runKarenAudit(siteUrl: string): Promise<KarenResults> {
  try {
    console.log('[v0] Running Karen audit for:', siteUrl);

    // Execute Karen CLI
    // TODO: Replace with actual Karen CLI command
    const { stdout, stderr } = await execAsync(
      `karen audit --url ${siteUrl} --output json`
    );

    if (stderr) {
      console.error('[v0] Karen CLI stderr:', stderr);
    }

    // Parse Karen's JSON output
    const karenOutput = JSON.parse(stdout);

    // Transform to our format
    const issues: KarenIssue[] = karenOutput.tasks?.map((task: any, index: number) => ({
      id: `issue-${index + 1}`,
      type: detectIssueType(task.description),
      severity: task.severity || 'medium',
      element: task.element || task.selector || 'Unknown',
      viewport: task.viewport || 'desktop',
      message: task.message || task.description,
      screenshot: task.screenshot,
      fix: task.fix
    })) || [];

    // Calculate summary
    const summary = {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length
    };

    return { issues, summary };
  } catch (error) {
    console.error('[v0] Error running Karen audit:', error);
    throw new Error('Failed to run Karen audit');
  }
}

function detectIssueType(description: string): KarenIssue['type'] {
  const lower = description.toLowerCase();
  if (lower.includes('overflow')) return 'overflow';
  if (lower.includes('spacing') || lower.includes('margin') || lower.includes('padding')) return 'spacing';
  if (lower.includes('font') || lower.includes('type')) return 'typescale';
  if (lower.includes('color') || lower.includes('palette')) return 'color';
  if (lower.includes('contrast') || lower.includes('accessibility')) return 'accessibility';
  if (lower.includes('design system') || lower.includes('inconsistent')) return 'design-system';
  return 'overflow'; // default
}

export async function takeScreenshots(siteUrl: string, issues: KarenIssue[]): Promise<void> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(siteUrl, { waitUntil: 'networkidle0' });

    for (const issue of issues) {
      if (!issue.screenshot && issue.element !== 'Unknown') {
        // Try to screenshot the problematic element
        try {
          const element = await page.$(issue.element);
          if (element) {
            const screenshot = await element.screenshot({ encoding: 'base64' });
            issue.screenshot = screenshot;
          }
        } catch (error) {
          console.error('[v0] Error taking screenshot for:', issue.element);
        }
      }
    }
  } finally {
    await browser.close();
  }
}
\`\`\`

---

## Step 3: Implement Audit Processor Job

Create the background job that processes pending audits.

**File:** `lib/audit-processor.ts`

\`\`\`typescript
import { createServerClient } from '@/lib/supabase/server';
import { runKarenAudit, takeScreenshots } from '@/lib/karen-runner';
import { generateFixes } from '@/lib/claude-fixer';
import { createPullRequest } from '@/lib/github';

export async function processAudit(auditId: string) {
  const supabase = await createServerClient();

  try {
    console.log('[v0] Processing audit:', auditId);

    // Update status to running
    await supabase
      .from('audits')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', auditId);

    // Fetch audit details
    const { data: audit } = await supabase
      .from('audits')
      .select('*, subscriptions!inner(plan_type), github_connections(access_token)')
      .eq('id', auditId)
      .single();

    if (!audit) throw new Error('Audit not found');

    // Run Karen CLI
    const results = await runKarenAudit(audit.site_url);

    // Take screenshots
    await takeScreenshots(audit.site_url, results.issues);

    // Generate fixes for Pro users with GitHub connected
    if (audit.subscriptions.plan_type === 'pro' && audit.repo_url && audit.github_connections?.access_token) {
      console.log('[v0] Generating AI fixes for Pro user');

      // Generate fixes using Claude
      const fixedIssues = await generateFixes(results.issues);

      // Create PR with fixes
      const prUrl = await createPullRequest(
        audit.repo_url,
        audit.github_connections.access_token,
        fixedIssues
      );

      results.pr_url = prUrl;
    }

    // Update audit with results
    await supabase
      .from('audits')
      .update({
        status: 'completed',
        results,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId);

    console.log('[v0] Audit completed:', auditId);
  } catch (error) {
    console.error('[v0] Error processing audit:', error);

    // Update status to failed
    await supabase
      .from('audits')
      .update({
        status: 'failed',
        results: { error: error.message },
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId);
  }
}
\`\`\`

---

## Step 4: Implement Claude AI Fix Generator

Create the module that uses Claude to generate CSS fixes.

**File:** `lib/claude-fixer.ts`

\`\`\`typescript
import Anthropic from '@anthropic-ai/sdk';
import { KarenIssue } from './karen-runner';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateFixes(issues: KarenIssue[]): Promise<KarenIssue[]> {
  const fixedIssues = [...issues];

  for (const issue of fixedIssues) {
    if (!issue.fix) {
      try {
        console.log('[v0] Generating fix for:', issue.type);

        const fix = await generateSingleFix(issue);
        issue.fix = fix;
      } catch (error) {
        console.error('[v0] Error generating fix:', error);
      }
    }
  }

  return fixedIssues;
}

async function generateSingleFix(issue: KarenIssue) {
  const prompt = buildFixPrompt(issue);

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format from Claude');
  }

  // Parse Claude's response
  const fixText = content.text;
  
  // Extract code blocks from markdown
  const codeBlockRegex = /```(?:css|html)?\n([\s\S]*?)\n```/g;
  const matches = [...fixText.matchAll(codeBlockRegex)];

  if (matches.length === 0) {
    throw new Error('No code fix found in Claude response');
  }

  return {
    file: inferFileName(issue),
    before: issue.fix?.before || '/* Original code */',
    after: matches[0][1] // First code block is the fix
  };
}

function buildFixPrompt(issue: KarenIssue): string {
  return `You are Karen, a sassy CSS layout auditor. Fix this ${issue.type} issue:

**Issue:** ${issue.message}
**Element:** ${issue.element}
**Severity:** ${issue.severity}

Provide a CSS fix that resolves this issue. Be specific and minimal - only fix what's broken.
Return the fixed CSS code in a markdown code block.

Example response format:
\`\`\`css
.element {
  /* Fixed property */
  overflow: hidden;
}
\`\`\``;
}

function inferFileName(issue: KarenIssue): string {
  // Simple heuristic - you might want to improve this
  if (issue.type === 'typescale') return 'styles/typography.css';
  if (issue.type === 'color') return 'styles/colors.css';
  return 'styles/layout.css';
}
\`\`\`

---

## Step 5: Implement GitHub PR Creator

Create the module that creates PRs with fixes.

**File:** `lib/github.ts`

\`\`\`typescript
import { Octokit } from '@octokit/rest';
import { KarenIssue } from './karen-runner';

export async function createPullRequest(
  repoUrl: string,
  accessToken: string,
  issues: KarenIssue[]
): Promise<string> {
  const octokit = new Octokit({ auth: accessToken });

  // Parse repo URL
  const [owner, repo] = parseRepoUrl(repoUrl);

  try {
    console.log('[v0] Creating PR for:', owner, repo);

    // Get main branch SHA
    const { data: mainBranch } = await octokit.repos.getBranch({
      owner,
      repo,
      branch: 'main'
    });

    const mainSha = mainBranch.commit.sha;

    // Create new branch
    const branchName = `karen-fixes-${Date.now()}`;
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainSha
    });

    // Apply fixes to files
    const fileChanges = groupIssuesByFile(issues);

    for (const [filePath, fileIssues] of Object.entries(fileChanges)) {
      // Get current file content
      let fileContent = '';
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branchName
        });
        
        if ('content' in data) {
          fileContent = Buffer.from(data.content, 'base64').toString();
        }
      } catch (error) {
        // File doesn't exist, create it
        console.log('[v0] Creating new file:', filePath);
      }

      // Apply fixes
      let updatedContent = fileContent;
      for (const issue of fileIssues) {
        if (issue.fix) {
          updatedContent = applyFix(updatedContent, issue.fix);
        }
      }

      // Commit file
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: `Fix: ${fileIssues.map(i => i.type).join(', ')} issues`,
        content: Buffer.from(updatedContent).toString('base64'),
        branch: branchName
      });
    }

    // Create PR
    const prBody = buildPRDescription(issues);
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `🔧 Karen found ${issues.length} layout issues`,
      head: branchName,
      base: 'main',
      body: prBody
    });

    console.log('[v0] PR created:', pr.html_url);
    return pr.html_url;
  } catch (error) {
    console.error('[v0] Error creating PR:', error);
    throw new Error('Failed to create GitHub PR');
  }
}

function parseRepoUrl(repoUrl: string): [string, string] {
  const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  return [match[1], match[2]];
}

function groupIssuesByFile(issues: KarenIssue[]): Record<string, KarenIssue[]> {
  const grouped: Record<string, KarenIssue[]> = {};
  
  for (const issue of issues) {
    if (issue.fix) {
      const file = issue.fix.file;
      if (!grouped[file]) grouped[file] = [];
      grouped[file].push(issue);
    }
  }
  
  return grouped;
}

function applyFix(content: string, fix: { before: string; after: string }): string {
  // Simple replace - you might want more sophisticated merging
  return content.replace(fix.before, fix.after);
}

function buildPRDescription(issues: KarenIssue[]): string {
  let description = '## 💅 Karen has spoken\n\n';
  description += `Found ${issues.length} layout issues that need fixing.\n\n`;
  
  // Group by severity
  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  
  if (critical.length > 0) {
    description += `### 🚨 Critical Issues (${critical.length})\n\n`;
    critical.forEach(i => {
      description += `- **${i.type}**: ${i.message}\n`;
    });
    description += '\n';
  }
  
  if (high.length > 0) {
    description += `### ⚠️ High Priority (${high.length})\n\n`;
    high.forEach(i => {
      description += `- **${i.type}**: ${i.message}\n`;
    });
    description += '\n';
  }
  
  if (medium.length > 0) {
    description += `### 📋 Medium Priority (${medium.length})\n\n`;
    medium.forEach(i => {
      description += `- **${i.type}**: ${i.message}\n`;
    });
  }
  
  description += '\n---\n\n';
  description += '✨ This PR was automatically generated by Karen CLI';
  
  return description;
}
\`\`\`

---

## Step 6: Set Up Cron Job for Processing

Create a cron endpoint to process pending audits.

**File:** `app/api/cron/process-audits/route.ts`

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { processAudit } from '@/lib/audit-processor';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();

  try {
    // Fetch pending audits
    const { data: audits } = await supabase
      .from('audits')
      .select('id')
      .eq('status', 'pending')
      .limit(5); // Process 5 at a time

    if (!audits || audits.length === 0) {
      return NextResponse.json({ message: 'No pending audits' });
    }

    console.log('[v0] Processing', audits.length, 'audits');

    // Process each audit
    await Promise.all(
      audits.map(audit => processAudit(audit.id))
    );

    return NextResponse.json({
      success: true,
      processed: audits.length
    });
  } catch (error) {
    console.error('[v0] Error in cron job:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
\`\`\`

**Configure in Vercel:**
Add to `vercel.json`:
\`\`\`json
{
  "crons": [{
    "path": "/api/cron/process-audits",
    "schedule": "*/5 * * * *"
  }]
}
\`\`\`

---

## Testing Checklist

1. **Authentication Flow**
   - [ ] User can sign in with Google
   - [ ] Profile is created in database
   - [ ] Free subscription is created

2. **Audit Creation**
   - [ ] User can create audit from dashboard
   - [ ] Audit appears with "pending" status
   - [ ] Validation works (requires valid URL)

3. **Audit Processing**
   - [ ] Cron job picks up pending audits
   - [ ] Karen CLI executes successfully
   - [ ] Results are stored in database
   - [ ] Status updates to "completed"

4. **AI Fixes (Pro Users)**
   - [ ] Claude generates valid CSS fixes
   - [ ] Fixes are applied to correct files
   - [ ] Code changes make sense

5. **GitHub Integration**
   - [ ] User can connect GitHub account
   - [ ] PRs are created successfully
   - [ ] PR description includes issue details
   - [ ] Branch and commits are correct

6. **Stripe Integration**
   - [ ] User can subscribe to Pro plan
   - [ ] Webhook updates subscription status
   - [ ] Pro features are enabled after payment

---

This implementation guide provides all the code and steps needed to build the Karen CLI backend. Follow each step sequentially, test thoroughly, and refer back to ARCHITECTURE.md for system design details.
