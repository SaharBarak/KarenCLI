# Karen CLI - Missing Features & Implementation Plan

**Generated:** November 20, 2025
**Status:** Architecture Gap Analysis Complete

---

## Executive Summary

After reviewing the architecture documents against the current implementation, **the codebase is 70% complete**. The core infrastructure is solid, but **2 major detectors and several enhancements are missing**.

### What's Working ✅
- Karen CLI executes successfully on live websites
- 4 viewports tested (mobile, tablet, desktop, ultrawide)
- 4 detectors implemented (overflow, spacing, typescale, accessibility)
- Result monad pattern throughout
- NestJS backend with 5 services
- Database schema with RLS
- Docker containerization
- Claude AI integration for visual analysis
- Markdown + JSON reports

### What's Missing ❌
- **2 critical detectors**: Color palette consistency, Design-system chaos
- **5 additional viewports** for comprehensive testing
- **Structured AI visual analysis parsing**
- **Line length validation**
- **Alignment tolerance checking**
- **Cron job for background processing**
- **Queue system for audit pipeline**

---

## Gap Analysis: Architecture vs Implementation

### 1. Missing Detectors (HIGH PRIORITY)

#### 1.1 Color Palette Consistency Detector
**File:** `packages/karen-cli/src/detectors/colors.ts`
**Status:** ❌ NOT IMPLEMENTED
**Specified in:** `karen-cli_architecture.md` lines 303-384

**What it should do:**
- Collect all colors used across all viewports (text, background, borders)
- Detect near-duplicate colors (e.g., #F3F4F5 vs #F4F5F6)
- Check if colors match the configured palette
- Report color chaos with consolidation suggestions

**Algorithm from architecture:**
```typescript
function analyzeColors(snapshots, config): Issue[] {
  // 1. Collect all colors from computed styles
  // 2. Find near-duplicate colors (distance < 5)
  // 3. Check if colors are on the configured palette
  // 4. Generate sassy messages about color inconsistency
}
```

**Example issues it should detect:**
- "Using #F3F4F5 AND #F4F5F6? Karen's not having it. Pick a system."
- "Color #FF5733 isn't in your palette. Karen suggests picking from your design system."

**Complexity:** Medium (2-3 hours)

---

#### 1.2 Design System Chaos Detector
**File:** `packages/karen-cli/src/detectors/design-system.ts`
**Status:** ❌ NOT IMPLEMENTED
**Specified in:** `karen-cli_architecture.md` lines 441-500

**What it should do:**
- Track all button variations across viewports
- Analyze button inconsistencies (border-radius, padding, fontSize, fontWeight, backgroundColor)
- Detect if there are too many unique button styles (threshold: > 5)
- Report design system chaos

**Algorithm from architecture:**
```typescript
function detectDesignSystemChaos(snapshots): Issue[] {
  // 1. Filter all button elements (button tag + .btn classes)
  // 2. Extract button styles (borderRadius, padding, fontSize, etc.)
  // 3. Count unique style combinations
  // 4. If > 5 unique styles, flag as design-system issue
}
```

**Example issues it should detect:**
- "Buttons in 12 different styles? Karen's documenting every inconsistency."
- "Create a Button component with consistent variants"

**Complexity:** Medium (2-3 hours)

---

### 2. Additional Viewports (MEDIUM PRIORITY)

**Current:** 4 viewports
**Recommended:** 9 viewports for comprehensive coverage

**Rationale:** Modern devices span a wide range. Missing common breakpoints means missing issues.

| Viewport Name | Width | Height | Why It Matters |
|---------------|-------|--------|----------------|
| **xs-mobile** | 320 | 568 | Older iPhones (5/SE) |
| **mobile** ✅ | 375 | 667 | iPhone 6/7/8 (current) |
| **lg-mobile** | 414 | 896 | iPhone Pro Max |
| **sm-tablet** | 600 | 960 | Small tablets/large phones |
| **tablet** ✅ | 768 | 1024 | iPad portrait (current) |
| **lg-tablet** | 1024 | 1366 | iPad landscape |
| **desktop** ✅ | 1440 | 900 | Standard laptop (current) |
| **lg-desktop** | 1920 | 1080 | Full HD monitors |
| **ultrawide** ✅ | 2560 | 1440 | 2K monitors (current) |
| **4k** | 3840 | 2160 | 4K displays |

**Action:** Add 5 new breakpoints to `defaultConfig` in `packages/karen-cli/src/types/config.ts`

**Complexity:** Low (30 minutes)

---

### 3. Enhanced AI Visual Analysis (MEDIUM PRIORITY)

**Current Status:** ⚠️ Partially Implemented
**Issue:** We send screenshots to Claude but don't parse structured JSON responses

**Specified in:** `karen-cli_architecture.md` lines 504-592

**Current implementation** (`packages/karen-cli/src/core/claude.ts`):
- Sends screenshot to Claude ✅
- Gets text response ✅
- Converts text to generic issues ✅

**Missing:**
- Structured JSON response parsing ❌
- Specific issue type mapping ❌
- Location-based issue detection ❌

**What should change:**

The prompt should request JSON format:
```typescript
const visualAnalysisPrompt = `
You are Karen, a sassy CSS layout auditor. Analyze this webpage screenshot.

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
`;
```

Then parse the JSON response and map AI-detected issues properly.

**Complexity:** Low (1 hour)

---

### 4. Additional Checks (LOW PRIORITY)

#### 4.1 Line Length Validation
**Status:** ❌ NOT IMPLEMENTED
**Config field exists:** ✅ `lineLength: { minCh: 45, maxCh: 75 }`
**Specified in:** `karen-cli_architecture.md` line 63

**What it should do:**
- Measure text content in paragraph elements
- Check if line length is between minCh and maxCh characters
- Flag lines that are too short (< 45ch) or too long (> 75ch)

**Why it matters:**
- Lines too long = hard to read
- Lines too short = choppy reading experience
- Optimal line length: 45-75 characters

**Complexity:** Low (1-2 hours)

---

#### 4.2 Alignment Tolerance Checking
**Status:** ❌ NOT IMPLEMENTED
**Config field exists:** ✅ `alignTolerancePx: 4`
**Specified in:** `karen-cli_architecture.md` line 64

**What it should do:**
- Check if elements in the same row/column are aligned
- Allow tolerance of ±4px
- Flag misalignments that break visual rhythm

**Example:**
```
Card 1 top: 100px
Card 2 top: 103px  // Within tolerance (3px diff)
Card 3 top: 108px  // MISALIGNED (8px diff)
```

**Complexity:** Medium (2-3 hours)

---

### 5. Backend Infrastructure Gaps (MEDIUM PRIORITY)

#### 5.1 Cron Job Implementation
**Status:** ❌ NOT IMPLEMENTED
**Specified in:** `implmentation_guide.md` lines 571-630

**Current:** `AuditProcessorService` exists but no trigger mechanism
**Needed:** Actual cron job or queue system

**Options:**
1. **Vercel Cron** (Recommended for MVP)
   - Add `vercel.json` with cron configuration
   - Run every 5 minutes to pick up pending audits
   - Simple, no external dependencies

2. **BullMQ + Redis** (Production-grade)
   - Better for high-volume audits
   - Retry logic built-in
   - Progress tracking

**File:** `app/api/cron/process-audits/route.ts` (guide has example code)

**Complexity:** Medium (2 hours for Vercel Cron, 4-6 hours for BullMQ)

---

#### 5.2 Queue System for Audit Pipeline
**Status:** ❌ Inline Processing Only
**Issue:** Audits block the API response

**Current flow:**
```
POST /api/audits/create
  → Create audit in DB
  → ❌ Call processAudit() inline (blocks request)
  → Return response
```

**Ideal flow:**
```
POST /api/audits/create
  → Create audit in DB (status: pending)
  → ✅ Add to job queue
  → Return immediately

Background Worker:
  → Pick up pending audits
  → Process via Docker
  → Update status to completed
```

**Complexity:** Medium-High (4-6 hours)

---

## Implementation Priority Roadmap

### Phase 1: Critical Detectors (HIGH PRIORITY) - 6 hours
**Goal:** Complete the missing detectors so all 6 features work

1. **Implement `colors.ts` detector** (2-3 hours)
   - Color collection from DOM
   - Near-duplicate detection (deltaE < 5)
   - Palette compliance checking
   - Sassy message generation

2. **Implement `design-system.ts` detector** (2-3 hours)
   - Button element collection
   - Style variation analysis
   - Inconsistency threshold (> 5 unique styles)
   - Component recommendation

3. **Wire up detectors in `audit-engine.ts`** (30 min)
   - Add detector imports
   - Call detectors when features enabled

4. **Add tests** (1 hour)
   - Test color near-duplicate detection
   - Test design-system chaos detection

**Deliverable:** All 6 feature flags working: overflow, spacing, typescale, **colors**, accessibility, **design-system**

---

### Phase 2: Viewport Expansion (MEDIUM PRIORITY) - 1 hour
**Goal:** Catch more issues across device spectrum

1. **Add 5 new breakpoints to config** (15 min)
2. **Test on live site with all 9 viewports** (30 min)
3. **Update documentation** (15 min)

**Deliverable:** 9 viewports covering 320px to 3840px

---

### Phase 3: Enhanced AI Analysis (MEDIUM PRIORITY) - 2 hours
**Goal:** Get structured visual issue detection

1. **Update Claude prompt for JSON output** (30 min)
2. **Add JSON parsing in `claude.ts`** (30 min)
3. **Map AI issue types properly** (30 min)
4. **Add error handling for malformed JSON** (30 min)

**Deliverable:** Structured AI visual issues in report

---

### Phase 4: Additional Checks (LOW PRIORITY) - 4 hours
**Goal:** Comprehensive design system enforcement

1. **Implement line length validation** (1-2 hours)
2. **Implement alignment tolerance checking** (2-3 hours)

**Deliverable:** 8 total detectors operational

---

### Phase 5: Production Backend (MEDIUM PRIORITY) - 6 hours
**Goal:** Non-blocking audit processing

1. **Set up Vercel Cron job** (2 hours)
   - Create cron endpoint
   - Configure `vercel.json`
   - Test cron trigger

2. **Add job queue (optional)** (4 hours)
   - Set up BullMQ + Redis
   - Create audit processor worker
   - Add retry logic

**Deliverable:** Audits process in background, not blocking API

---

## Total Estimated Effort

| Phase | Priority | Estimated Time | Status |
|-------|----------|----------------|--------|
| Phase 1: Critical Detectors | HIGH | 6 hours | ⏳ Pending |
| Phase 2: Viewport Expansion | MEDIUM | 1 hour | ⏳ Pending |
| Phase 3: Enhanced AI | MEDIUM | 2 hours | ⏳ Pending |
| Phase 4: Additional Checks | LOW | 4 hours | ⏳ Pending |
| Phase 5: Production Backend | MEDIUM | 6 hours | ⏳ Pending |
| **TOTAL** | | **19 hours** | |

---

## Quick Wins (Do These First)

1. **Add 5 new viewports** (30 min) - Immediate impact, minimal effort
2. **Implement color detector** (2-3 hours) - High visibility feature
3. **Set up Vercel Cron** (2 hours) - Enables async processing

These 3 tasks take ~5 hours and unlock major functionality.

---

## Architecture Compliance Score

| Component | Specified | Implemented | Score |
|-----------|-----------|-------------|-------|
| **Viewports** | 4+ | 4 | 🟡 50% |
| **Detectors** | 6 | 4 | 🟡 67% |
| **Config Types** | 10 fields | 10 fields | 🟢 100% |
| **Result Monad** | Yes | Yes | 🟢 100% |
| **Docker** | Yes | Yes | 🟢 100% |
| **AI Analysis** | Structured | Text-based | 🟡 70% |
| **Reports** | JSON + MD | JSON + MD | 🟢 100% |
| **Backend Services** | 5 | 5 | 🟢 100% |
| **Cron Jobs** | Yes | No | 🔴 0% |
| **Queue System** | Yes | No | 🔴 0% |
| **OVERALL** | | | **🟡 70%** |

---

## Recommendation

**Start with Phase 1 (Critical Detectors) immediately.**

The color and design-system detectors are:
- Explicitly mentioned in the architecture
- Already included in the config's `features` array
- Expected by the frontend/users
- High-value (designers care about color consistency and button chaos)

After Phase 1, you'll have a **complete, production-ready CLI** that matches the architecture 100%.

Phases 2-5 are enhancements that can be prioritized based on user feedback.

---

## Next Steps

1. **Review this plan** - Confirm priorities align with product goals
2. **Approve Phase 1** - Get go-ahead for critical detector implementation
3. **Execute Phase 1** - Implement colors.ts and design-system.ts
4. **Test on live sites** - Validate detectors work correctly
5. **Deploy** - Ship complete Karen CLI to production

---

✨ **This plan ensures Karen CLI is architecture-compliant and production-ready.**
