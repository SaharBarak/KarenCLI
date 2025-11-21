# Karen CLI - Audit Engine Architecture

## Overview

Karen CLI is a containerized CSS layout auditing tool that examines websites across multiple viewports, uses AI to detect visual and code-level issues, and generates actionable fix recommendations with evidence.

**Core Philosophy:** Audit → Detect → Evidence → Recommend → (Optional) Auto-Fix

---

## System Architecture

### Deployment Model
- **Containerized**: Docker container for consistent execution
- **Cloud-Ready**: Runs on-demand in cloud environments (AWS Lambda, Google Cloud Run, Fly.io)
- **Stateless**: No persistent state between runs
- **Scalable**: Can run multiple audits in parallel

### Technology Stack
- **Runtime**: Node.js 20+
- **Browser Automation**: Playwright (Chromium, Firefox, WebKit)
- **AI Integration**: Anthropic Claude API (Sonnet 3.5/4)
- **Image Processing**: Sharp for screenshot manipulation
- **Code Analysis**: PostCSS, Cheerio for HTML/CSS parsing
- **Output**: JSON + Markdown reports

---

## Audit Pipeline

### Phase 1: Initialization
\`\`\`
Input: Site URL + Configuration
  ↓
Load karen.config.js (or defaults)
  ↓
Validate URL accessibility
  ↓
Initialize browser contexts (Playwright)
  ↓
Set up viewport configurations
\`\`\`

**Configuration Schema:**
\`\`\`javascript
{
  "spacingScale": [0, 4, 8, 12, 16, 24, 32, 48, 64],
  "typescale": {
    "base": 16,
    "ratio": 1.25, // golden ratio or custom
    "sizes": [12, 14, 16, 20, 25, 31, 39, 49]
  },
  "colorPalette": [
    "#F5E6D3", "#D4A574", "#8B7355", // Karen blonde theme
    "#E8998D", "#9CA986", "#B4A7D6"
  ],
  "breakpoints": [
    { "name": "mobile", "width": 375, "height": 667 },
    { "name": "tablet", "width": 768, "height": 1024 },
    { "name": "desktop", "width": 1440, "height": 900 },
    { "name": "ultrawide", "width": 2560, "height": 1440 }
  ],
  "lineLength": { "minCh": 45, "maxCh": 75 },
  "alignTolerancePx": 4,
  "contrastRatios": {
    "AA": 4.5,
    "AAA": 7.0
  },
  "failOn": ["critical", "high"], // For CI integration
  "features": [
    "overflow",
    "spacing",
    "typescale",
    "colors",
    "accessibility",
    "design-system"
  ]
}
\`\`\`

---

### Phase 2: Multi-Viewport Capture

For each configured viewport:

\`\`\`
Set viewport size
  ↓
Navigate to target URL
  ↓
Wait for network idle + custom selectors
  ↓
Take full-page screenshot
  ↓
Extract computed styles for all elements
  ↓
Build DOM tree with layout metrics
  ↓
Store viewport snapshot
\`\`\`

**Data Captured Per Viewport:**
- Full-page screenshot (base64/file)
- DOM tree with computed styles
- Layout metrics (getBoundingClientRect for all visible elements)
- Network requests (for resource analysis)
- Console errors/warnings
- Performance metrics (LCP, CLS, etc.)

**Implementation:**
\`\`\`typescript
interface ViewportSnapshot {
  viewport: {
    name: string;
    width: number;
    height: number;
  };
  screenshot: string; // base64 or file path
  dom: DOMElement[];
  styles: ComputedStyles[];
  metrics: LayoutMetrics;
  errors: string[];
}

interface DOMElement {
  selector: string;
  tagName: string;
  classes: string[];
  id: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  computedStyle: Record<string, string>;
  children: DOMElement[];
}
\`\`\`

---

### Phase 3: Issue Detection

Run detection algorithms on captured data. Each detector is independent and produces structured issues.

#### 3.1 Overflow Detection

**Algorithm:**
\`\`\`typescript
function detectOverflow(snapshots: ViewportSnapshot[]): Issue[] {
  const issues: Issue[] = [];
  
  for (const snapshot of snapshots) {
    for (const element of snapshot.dom) {
      const parent = findParent(element);
      
      // Check horizontal overflow
      if (element.rect.x + element.rect.width > parent.rect.x + parent.rect.width) {
        issues.push({
          id: generateId(),
          type: "overflow",
          severity: "high",
          viewport: snapshot.viewport.name,
          element: element.selector,
          message: `Sweetie, your ${element.tagName} is literally breaking its container.`,
          details: {
            overflow: "horizontal",
            elementWidth: element.rect.width,
            containerWidth: parent.rect.width,
            excess: (element.rect.x + element.rect.width) - (parent.rect.x + parent.rect.width)
          },
          screenshot: cropScreenshot(snapshot.screenshot, element.rect),
          fix: {
            suggestion: "Add max-width: 100% or use clamp() for responsive sizing",
            code: {
              before: extractStyles(element),
              after: generateFix(element, "overflow")
            }
          }
        });
      }
      
      // Check vertical overflow
      if (element.computedStyle.overflow === "visible" && isOverflowing(element)) {
        // Similar logic...
      }
    }
  }
  
  return issues;
}
\`\`\`

**Evidence:**
- Highlighted screenshot showing overflow
- Element selector path
- Parent container info
- Overflow amount in pixels

---

#### 3.2 Spacing Analysis

**Algorithm:**
\`\`\`typescript
function analyzeSpacing(snapshots: ViewportSnapshot[], config: Config): Issue[] {
  const issues: Issue[] = [];
  const spacingScale = config.spacingScale;
  
  for (const snapshot of snapshots) {
    for (const element of snapshot.dom) {
      const spacing = {
        margin: parseSpacing(element.computedStyle.margin),
        padding: parseSpacing(element.computedStyle.padding)
      };
      
      // Check if spacing values are on scale
      for (const [property, values] of Object.entries(spacing)) {
        for (const value of values) {
          if (!isOnScale(value, spacingScale) && value > 0) {
            issues.push({
              id: generateId(),
              type: "spacing",
              severity: "medium",
              viewport: snapshot.viewport.name,
              element: element.selector,
              message: `Random spacing? Really? ${value}px ${property}? Karen's judging your design tokens.`,
              details: {
                property: property,
                value: value,
                nearestScaleValue: findNearest(value, spacingScale),
                spacingScale: spacingScale
              },
              fix: {
                suggestion: `Use ${findNearest(value, spacingScale)}px from your spacing scale`,
                code: {
                  before: `${property}: ${value}px`,
                  after: `${property}: ${findNearest(value, spacingScale)}px`
                }
              }
            });
          }
        }
      }
    }
  }
  
  return issues;
}
\`\`\`

---

#### 3.3 Typescale Enforcement

**Algorithm:**
\`\`\`typescript
function enforceTypescale(snapshots: ViewportSnapshot[], config: Config): Issue[] {
  const issues: Issue[] = [];
  const typescale = config.typescale.sizes;
  
  for (const snapshot of snapshots) {
    const textElements = snapshot.dom.filter(el => 
      ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV'].includes(el.tagName)
    );
    
    for (const element of textElements) {
      const fontSize = parseFloat(element.computedStyle.fontSize);
      
      if (!typescale.includes(fontSize) && fontSize > 0) {
        issues.push({
          id: generateId(),
          type: "typescale",
          severity: "medium",
          viewport: snapshot.viewport.name,
          element: element.selector,
          message: `Font sizes all over the place? Karen enforces hierarchy like it's the law.`,
          details: {
            fontSize: fontSize,
            nearestScaleValue: findNearest(fontSize, typescale),
            typescale: typescale
          },
          fix: {
            suggestion: `Use ${findNearest(fontSize, typescale)}px from your type scale`,
            code: {
              before: `font-size: ${fontSize}px`,
              after: `font-size: ${findNearest(fontSize, typescale)}px`
            }
          }
        });
      }
    }
  }
  
  return issues;
}
\`\`\`

---

#### 3.4 Color Palette Consistency

**Algorithm:**
\`\`\`typescript
function analyzeColors(snapshots: ViewportSnapshot[], config: Config): Issue[] {
  const issues: Issue[] = [];
  const palette = config.colorPalette;
  const usedColors = new Map<string, { count: number, elements: string[] }>();
  
  // Collect all colors used
  for (const snapshot of snapshots) {
    for (const element of snapshot.dom) {
      const colors = [
        element.computedStyle.color,
        element.computedStyle.backgroundColor,
        element.computedStyle.borderColor
      ].filter(c => c && c !== 'transparent');
      
      for (const color of colors) {
        const normalized = normalizeColor(color);
        if (!usedColors.has(normalized)) {
          usedColors.set(normalized, { count: 0, elements: [] });
        }
        usedColors.get(normalized)!.count++;
        usedColors.get(normalized)!.elements.push(element.selector);
      }
    }
  }
  
  // Find near-duplicate colors
  const colorArray = Array.from(usedColors.entries());
  for (let i = 0; i < colorArray.length; i++) {
    for (let j = i + 1; j < colorArray.length; j++) {
      const [color1, data1] = colorArray[i];
      const [color2, data2] = colorArray[j];
      
      if (colorDistance(color1, color2) < 5) { // Very similar colors
        issues.push({
          id: generateId(),
          type: "color",
          severity: "medium",
          viewport: "all",
          element: "Multiple elements",
          message: `Using #F3F4F5 AND #F4F5F6? Karen's not having it. Pick a system.`,
          details: {
            color1: color1,
            color2: color2,
            distance: colorDistance(color1, color2),
            occurrences1: data1.count,
            occurrences2: data2.count
          },
          fix: {
            suggestion: `Consolidate to a single color from your palette`,
            affectedElements: [...data1.elements, ...data2.elements]
          }
        });
      }
    }
  }
  
  // Check if colors are on palette
  for (const [color, data] of usedColors) {
    if (!palette.some(paletteColor => colorDistance(color, paletteColor) < 10)) {
      issues.push({
        id: generateId(),
        type: "color",
        severity: "low",
        viewport: "all",
        element: data.elements[0],
        message: `Color ${color} isn't in your palette. Karen suggests picking from your design system.`,
        details: {
          color: color,
          nearestPaletteColor: findNearestColor(color, palette),
          occurrences: data.count
        }
      });
    }
  }
  
  return issues;
}
\`\`\`

---

#### 3.5 Accessibility & Contrast

**Algorithm:**
\`\`\`typescript
function checkAccessibility(snapshots: ViewportSnapshot[], config: Config): Issue[] {
  const issues: Issue[] = [];
  
  for (const snapshot of snapshots) {
    const textElements = snapshot.dom.filter(el => hasTextContent(el));
    
    for (const element of textElements) {
      const fg = parseColor(element.computedStyle.color);
      const bg = getBackgroundColor(element, snapshot.dom);
      const contrastRatio = calculateContrast(fg, bg);
      
      const requiredRatio = parseFloat(element.computedStyle.fontSize) < 18 
        ? config.contrastRatios.AAA 
        : config.contrastRatios.AA;
      
      if (contrastRatio < requiredRatio) {
        issues.push({
          id: generateId(),
          type: "accessibility",
          severity: "high",
          viewport: snapshot.viewport.name,
          element: element.selector,
          message: `Contrast ratio? Never heard of her. Gray text on gray background? Karen's calling WCAG on you.`,
          details: {
            foreground: fg,
            background: bg,
            contrastRatio: contrastRatio,
            required: requiredRatio,
            passes: contrastRatio >= requiredRatio
          },
          screenshot: highlightElement(snapshot.screenshot, element.rect),
          fix: {
            suggestion: `Increase contrast to meet WCAG ${requiredRatio >= 7 ? 'AAA' : 'AA'} standards`,
            code: {
              before: `color: ${element.computedStyle.color}`,
              after: `color: ${generateAccessibleColor(bg, requiredRatio)}`
            }
          }
        });
      }
    }
  }
  
  return issues;
}
\`\`\`

---

#### 3.6 Design System Chaos Detection

**Algorithm:**
\`\`\`typescript
function detectDesignSystemChaos(snapshots: ViewportSnapshot[]): Issue[] {
  const issues: Issue[] = [];
  
  // Track button variations
  const buttons = [];
  for (const snapshot of snapshots) {
    const buttonElements = snapshot.dom.filter(el => 
      el.tagName === 'BUTTON' || 
      el.classes.some(c => c.includes('btn') || c.includes('button'))
    );
    buttons.push(...buttonElements);
  }
  
  // Analyze button inconsistencies
  const buttonStyles = buttons.map(btn => ({
    borderRadius: btn.computedStyle.borderRadius,
    padding: btn.computedStyle.padding,
    fontSize: btn.computedStyle.fontSize,
    fontWeight: btn.computedStyle.fontWeight,
    backgroundColor: btn.computedStyle.backgroundColor
  }));
  
  const uniqueStyles = new Set(buttonStyles.map(s => JSON.stringify(s))).size;
  
  if (uniqueStyles > 5) {
    issues.push({
      id: generateId(),
      type: "design-system",
      severity: "high",
      viewport: "all",
      element: "Button components",
      message: `Buttons in ${uniqueStyles} different styles? Karen's documenting every inconsistency.`,
      details: {
        totalButtons: buttons.length,
        uniqueStyles: uniqueStyles,
        variations: buttonStyles
      },
      fix: {
        suggestion: `Create a Button component with consistent variants`,
        code: {
          example: `
// Define standard button variants
const buttonVariants = {
  primary: { ... },
  secondary: { ... },
  ghost: { ... }
}
          `
        }
      }
    });
  }
  
  return issues;
}
\`\`\`

---

### Phase 4: AI-Powered Visual Analysis

Use Claude Vision API to detect visual issues that are hard to catch with code analysis alone.

**Process:**
\`\`\`
For each viewport screenshot:
  ↓
Send to Claude Vision API with prompt
  ↓
Parse AI response for visual issues
  ↓
Cross-reference with code-detected issues
  ↓
Add unique visual issues to report
\`\`\`

**Claude Prompt Template:**
\`\`\`typescript
const visualAnalysisPrompt = `
You are Karen, a sassy CSS layout auditor. Analyze this webpage screenshot at ${viewport.name} (${viewport.width}x${viewport.height}).

Look for:
1. Visual overflow or clipping
2. Misaligned elements
3. Awkward spacing or layout breaks
4. Text that's too long or poorly wrapped
5. Images that are stretched or distorted
6. Broken grid/flex layouts

For each issue found, respond in this JSON format:
{
  "issues": [
    {
      "type": "visual_overflow" | "misalignment" | "spacing" | "text_layout" | "image_distortion" | "layout_break",
      "severity": "critical" | "high" | "medium" | "low",
      "description": "Brief description",
      "location": "Describe where in the viewport",
      "roast": "Your sassy Karen-style roast message"
    }
  ]
}

Be specific about locations using visual landmarks (e.g., "top navigation", "hero section", "third card in grid").
`;

async function analyzeVisualIssues(
  screenshot: string, 
  viewport: Viewport
): Promise<Issue[]> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: screenshot
          }
        },
        {
          type: 'text',
          text: visualAnalysisPrompt
        }
      ]
    }]
  });
  
  const aiIssues = JSON.parse(response.content[0].text);
  
  return aiIssues.issues.map(issue => ({
    id: generateId(),
    type: issue.type,
    severity: issue.severity,
    viewport: viewport.name,
    element: issue.location,
    message: issue.roast,
    details: {
      aiDetected: true,
      description: issue.description
    },
    screenshot: screenshot
  }));
}
\`\`\`

---

### Phase 5: Fix Generation (Optional)

When auto-fix is enabled, use Claude to generate code fixes.

**Process:**
\`\`\`typescript
async function generateFix(issue: Issue, context: CodeContext): Promise<Fix> {
  const prompt = `
You are Karen, a CSS layout expert. Fix this issue:

**Issue:** ${issue.message}
**Type:** ${issue.type}
**Element:** ${issue.element}
**Details:** ${JSON.stringify(issue.details)}

**Current Code:**
\`\`\`css
${context.currentStyles}
\`\`\`

**HTML Context:**
\`\`\`html
${context.htmlSnippet}
\`\`\`

Generate a clean, minimal CSS fix. Respond with:
{
  "fix": {
    "file": "path/to/file.css",
    "changes": [
      {
        "selector": ".class-name",
        "before": "property: value;",
        "after": "property: new-value;",
        "explanation": "Why this fixes the issue"
      }
    ]
  }
}

Rules:
- Use modern CSS (clamp, min/max, CSS variables)
- Maintain responsive behavior
- Don't break other layouts
- Follow the project's spacing/color scale if provided
  `;
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  return JSON.parse(response.content[0].text).fix;
}
\`\`\`

---

### Phase 6: Report Generation

Generate two output formats:

#### 6.1 JSON Report (`karen-tasks.json`)
\`\`\`json
{
  "meta": {
    "site_url": "https://example.com",
    "audit_date": "2024-01-15T10:30:00Z",
    "karen_version": "1.0.0",
    "config": { /* ... */ }
  },
  "summary": {
    "total_issues": 15,
    "by_severity": {
      "critical": 2,
      "high": 5,
      "medium": 6,
      "low": 2
    },
    "by_type": {
      "overflow": 3,
      "spacing": 4,
      "typescale": 2,
      "color": 2,
      "accessibility": 3,
      "design-system": 1
    },
    "by_viewport": {
      "mobile": 8,
      "tablet": 4,
      "desktop": 3
    }
  },
  "issues": [
    {
      "id": "KRN-0001",
      "type": "overflow",
      "severity": "high",
      "viewport": "mobile",
      "element": ".hero-title",
      "message": "Sweetie, your hero text is literally breaking its container.",
      "details": { /* ... */ },
      "screenshot": "artifacts/KRN-0001.png",
      "fix": {
        "suggestion": "Use clamp() for responsive font sizing",
        "code": {
          "file": "styles/hero.css",
          "before": "font-size: 48px;",
          "after": "font-size: clamp(1.5rem, 4vw + 0.5rem, 3rem);"
        }
      }
    }
  ],
  "artifacts": {
    "screenshots": ["artifacts/KRN-0001.png", "..."],
    "full_viewport_captures": {
      "mobile": "artifacts/viewport-mobile.png",
      "tablet": "artifacts/viewport-tablet.png",
      "desktop": "artifacts/viewport-desktop.png"
    }
  }
}
\`\`\`

#### 6.2 Markdown Report (`KAREN_TASKS.md`)
\`\`\`markdown
# Karen's Layout Audit Report

**Site:** https://example.com  
**Date:** January 15, 2024  
**Total Issues:** 15 (2 critical, 5 high, 6 medium, 2 low)

---

## 🚨 Critical Issues

### KRN-0001: Hero text overflow on mobile
**Viewport:** Mobile (375x667)  
**Element:** `.hero-title`

> Sweetie, your hero text is literally breaking its container.

**Fix:**
\`\`\`css
/* Before */
font-size: 48px;

/* After */
font-size: clamp(1.5rem, 4vw + 0.5rem, 3rem);
max-width: 20ch;
\`\`\`

![Screenshot](artifacts/KRN-0001.png)

---

## Summary by Type

- **Overflow:** 3 issues
- **Spacing:** 4 issues
- **Typescale:** 2 issues
- **Colors:** 2 issues
- **Accessibility:** 3 issues
- **Design System:** 1 issue
\`\`\`

---

## Docker Container Specification

### Dockerfile
\`\`\`dockerfile
FROM node:20-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Karen CLI
COPY package*.json ./
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install chromium firefox webkit

COPY . .

# Create output directory
RUN mkdir -p /app/output

ENTRYPOINT ["node", "bin/karen.js"]
CMD ["audit"]
\`\`\`

### Running the Container
\`\`\`bash
# Build image
docker build -t karen-cli .

# Run audit
docker run \
  -e ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} \
  -v $(pwd)/output:/app/output \
  karen-cli audit https://example.com \
  --out /app/output/tasks.json \
  --md /app/output/TASKS.md

# Run with custom config
docker run \
  -e ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY} \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/.karenrc:/app/.karenrc \
  karen-cli audit https://example.com
\`\`\`

---

## Cloud Deployment Options

### Option 1: AWS Lambda + Docker
\`\`\`yaml
# serverless.yml
service: karen-cli-runner

provider:
  name: aws
  runtime: provided.al2
  ecr:
    images:
      karen:
        path: ./
        file: Dockerfile

functions:
  runAudit:
    image:
      name: karen
    timeout: 900 # 15 minutes
    memorySize: 2048
    environment:
      ANTHROPIC_API_KEY: ${env:ANTHROPIC_API_KEY}
    events:
      - http:
          path: /audit
          method: post
\`\`\`

### Option 2: Google Cloud Run
\`\`\`yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/karen-cli', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/karen-cli']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'karen-cli'
      - '--image=gcr.io/$PROJECT_ID/karen-cli'
      - '--platform=managed'
      - '--region=us-central1'
      - '--memory=2Gi'
      - '--timeout=900'
\`\`\`

### Option 3: Fly.io
\`\`\`toml
# fly.toml
app = "karen-cli"

[build]
  dockerfile = "Dockerfile"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [services.concurrency]
    type = "requests"
    hard_limit = 5
    soft_limit = 3

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.tcp_checks]]
    grace_period = "10s"
    interval = "30s"
    timeout = "5s"

[env]
  NODE_ENV = "production"
\`\`\`

---

## API Integration for Web Platform

The web platform should trigger audits via HTTP:

\`\`\`typescript
// lib/karen-runner.ts
import { spawn } from 'child_process';

export async function runAudit(
  siteUrl: string,
  config: KarenConfig
): Promise<AuditResult> {
  // Option 1: Run locally via Docker
  const result = await runDockerContainer({
    url: siteUrl,
    config: config,
    outputDir: '/tmp/karen-output'
  });
  
  // Option 2: Call cloud function
  const response = await fetch('https://karen-cli.fly.dev/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: siteUrl,
      config: config
    })
  });
  
  return await response.json();
}

async function runDockerContainer(params: {
  url: string;
  config: KarenConfig;
  outputDir: string;
}): Promise<AuditResult> {
  return new Promise((resolve, reject) => {
    const docker = spawn('docker', [
      'run',
      '--rm',
      '-e', `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`,
      '-v', `${params.outputDir}:/app/output`,
      'karen-cli',
      'audit',
      params.url,
      '--out', '/app/output/tasks.json',
      '--config', JSON.stringify(params.config)
    ]);
    
    let stdout = '';
    let stderr = '';
    
    docker.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    docker.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    docker.on('close', (code) => {
      if (code === 0) {
        const result = JSON.parse(
          fs.readFileSync(path.join(params.outputDir, 'tasks.json'), 'utf-8')
        );
        resolve(result);
      } else {
        reject(new Error(`Docker exit code ${code}: ${stderr}`));
      }
    });
  });
}
\`\`\`

---

## Performance Optimization

### Parallel Viewport Processing
\`\`\`typescript
async function captureViewports(url: string, viewports: Viewport[]) {
  // Launch browsers in parallel
  const results = await Promise.all(
    viewports.map(viewport => 
      captureViewport(url, viewport)
    )
  );
  
  return results;
}
\`\`\`

### Incremental Analysis
\`\`\`typescript
// Skip unchanged pages
const hash = hashPage(dom, styles);
if (cache.has(hash)) {
  return cache.get(hash);
}
\`\`\`

### Screenshot Optimization
\`\`\`typescript
// Compress screenshots
await sharp(screenshotBuffer)
  .resize(1920, null, { withoutEnlargement: true })
  .jpeg({ quality: 80 })
  .toFile(outputPath);
\`\`\`

---

## Exit Codes for CI Integration

\`\`\`typescript
enum ExitCode {
  SUCCESS = 0,           // No issues found
  ISSUES_FOUND = 1,      // Issues found but within threshold
  CRITICAL_ISSUES = 2,   // Critical issues found
  HIGH_ISSUES = 3,       // Too many high severity issues
  EXECUTION_ERROR = 10   // Runtime error
}

// In CI mode
if (config.failOn.includes('critical') && summary.critical > 0) {
  process.exit(ExitCode.CRITICAL_ISSUES);
}
\`\`\`

---

## Logging & Observability

\`\`\`typescript
// Structured logging
logger.info('Audit started', {
  url: siteUrl,
  viewports: config.breakpoints.length,
  features: config.features
});

logger.debug('Viewport captured', {
  viewport: 'mobile',
  elements: dom.length,
  duration: '2.3s'
});

logger.warn('Issue detected', {
  id: 'KRN-0001',
  type: 'overflow',
  severity: 'high'
});

logger.error('Audit failed', {
  error: error.message,
  stack: error.stack
});
\`\`\`

---

This architecture document provides the complete blueprint for building the Karen CLI audit engine as a containerized, cloud-ready solution that can be triggered on-demand by the web platform.
