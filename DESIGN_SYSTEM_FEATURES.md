# Design System Features Status

**Question:** Design system alignment and enforcement, use of vars and @media enforcers?

---

## 1. Design System Alignment ❌ NOT IMPLEMENTED

### What You Asked For
Checking if elements are properly aligned (e.g., grid items, cards in a row)

### Current Status
**Config field exists but NOT USED:**
```typescript
// types/config.ts:64
alignTolerancePx: 4
```

### What's Missing
No detector checks element alignment. Should detect:

```javascript
// Example misalignment:
Card 1: top: 100px
Card 2: top: 103px  // OK (3px diff, within 4px tolerance)
Card 3: top: 108px  // MISALIGNED! (8px diff > 4px tolerance)
```

### How to Implement

**File:** `packages/karen-cli/src/detectors/alignment.ts` (NEW)

```typescript
export function detectMisalignment(
  snapshots: ViewportSnapshot[],
  config: KarenConfig
): Issue[] {
  const issues: Issue[] = [];
  const tolerance = config.alignTolerancePx;

  for (const snapshot of snapshots) {
    // Group elements by approximate Y position (rows)
    const rows = groupElementsByRow(snapshot.dom, tolerance);

    for (const row of rows) {
      if (row.length < 2) continue;

      // Check if all elements in row are aligned
      const topPositions = row.map(el => el.rect.y);
      const minTop = Math.min(...topPositions);
      const maxTop = Math.max(...topPositions);

      if (maxTop - minTop > tolerance) {
        issues.push({
          id: generateId('ALN'),
          type: 'design-system',
          severity: 'medium',
          viewport: snapshot.viewport.name,
          element: row.map(el => el.selector).join(', '),
          message: `Elements aren't aligned? Karen's OCD is triggered. Fix your layout grid.`,
          details: {
            misalignment: maxTop - minTop,
            tolerance: tolerance,
            elements: row.map(el => ({
              selector: el.selector,
              top: el.rect.y
            }))
          },
          fix: {
            suggestion: `Align elements using flexbox or grid. Max difference: ${maxTop - minTop}px, tolerance: ${tolerance}px`,
            code: {
              file: 'styles/layout.css',
              before: `.container > * { /* misaligned */ }`,
              after: `.container { display: flex; align-items: center; }`
            }
          }
        });
      }
    }
  }

  return issues;
}

function groupElementsByRow(
  elements: DOMElement[],
  tolerance: number
): DOMElement[][] {
  const sorted = [...elements].sort((a, b) => a.rect.y - b.rect.y);
  const rows: DOMElement[][] = [];
  let currentRow: DOMElement[] = [];
  let currentY = -Infinity;

  for (const el of sorted) {
    if (Math.abs(el.rect.y - currentY) <= tolerance) {
      currentRow.push(el);
    } else {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [el];
      currentY = el.rect.y;
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}
```

**Effort:** 3-4 hours
**Priority:** Medium
**Status:** ❌ NOT IMPLEMENTED

---

## 2. Design System Enforcement ✅ PARTIALLY IMPLEMENTED

### What You Have

**File:** `packages/karen-cli/src/detectors/design-system.ts`

#### ✅ Button Chaos Detection
```typescript
// Detects > 5 unique button styles
if (uniqueStyles > 5) {
  issues.push({
    message: `Buttons in ${uniqueStyles} different styles? Karen's documenting every inconsistency.`,
    fix: {
      code: {
        after: `const buttonVariants = {
  primary: { padding: '12px 24px', borderRadius: '8px', ... },
  secondary: { ... },
  ghost: { ... }
}`
      }
    }
  });
}
```

#### ✅ Border-Radius Inconsistency
```typescript
if (borderRadii.size > 3) {
  issues.push({
    message: `Button border-radius all over the place? Pick ONE system, sweetie.`,
    fix: {
      code: {
        after: `border-radius: var(--border-radius-button, 8px);`
      }
    }
  });
}
```

#### ✅ Padding Inconsistency
```typescript
if (paddings.size > 4) {
  issues.push({
    message: `Random button padding values? Karen's judging your spacing tokens.`,
    fix: {
      code: {
        after: `padding: var(--spacing-3) var(--spacing-6);`
      }
    }
  });
}
```

### What's Missing

#### ❌ Input Field Variations
No detection for inconsistent input styles

#### ❌ Card Component Variations
No detection for inconsistent card styles

#### ❌ Heading Hierarchy Violations
No detection for skipped heading levels (H1 → H3, skipping H2)

#### ❌ Icon Size Variations
No detection for inconsistent icon sizing

#### ❌ Shadow/Elevation Inconsistency
No detection for random box-shadow values

### How to Expand

**Add to `design-system.ts`:**

```typescript
export function detectDesignSystemChaos(snapshots: ViewportSnapshot[]): Issue[] {
  const issues: Issue[] = [];

  // Existing button analysis
  issues.push(...analyzeButtonVariations(snapshots));

  // NEW: Input field analysis
  issues.push(...analyzeInputVariations(snapshots));

  // NEW: Card component analysis
  issues.push(...analyzeCardVariations(snapshots));

  // NEW: Heading hierarchy
  issues.push(...analyzeHeadingHierarchy(snapshots));

  return issues;
}

function analyzeInputVariations(snapshots: ViewportSnapshot[]): Issue[] {
  const inputs = [];
  for (const snapshot of snapshots) {
    const inputElements = snapshot.dom.filter(el =>
      el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
    );
    inputs.push(...inputElements);
  }

  const inputStyles = inputs.map(input => ({
    height: input.computedStyle.height,
    borderRadius: input.computedStyle.borderRadius,
    border: input.computedStyle.border,
    padding: input.computedStyle.padding
  }));

  const uniqueStyles = new Set(inputStyles.map(s => JSON.stringify(s))).size;

  if (uniqueStyles > 3) {
    return [{
      type: 'design-system',
      message: `Input fields in ${uniqueStyles} different styles? Karen demands consistency.`,
      fix: {
        suggestion: 'Create a standardized Input component with consistent styling'
      }
    }];
  }

  return [];
}
```

**Effort:** 4-6 hours for full expansion
**Priority:** High
**Status:** ⚠️ PARTIALLY IMPLEMENTED (buttons only)

---

## 3. CSS Variables (Design Tokens) ⚠️ SUGGESTED BUT NOT ENFORCED

### Current Status

**Karen SUGGESTS CSS variables in fixes:**

```typescript
// design-system.ts:174
after: `border-radius: var(--border-radius-button, 8px);`

// design-system.ts:199
after: `padding: var(--spacing-3) var(--spacing-6); /* 12px 24px */`

// claude.ts:193
"Use modern CSS (clamp, min/max, CSS variables)"
```

### What's Missing

#### ❌ No Detection of Hardcoded Values
Doesn't detect when CSS variables SHOULD be used but aren't:

```css
/* Should detect this as bad: */
.button {
  padding: 12px 24px;        /* ❌ hardcoded */
  border-radius: 8px;        /* ❌ hardcoded */
  background: #0066FF;       /* ❌ hardcoded */
}

/* Should suggest this: */
.button {
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-md);
  background: var(--color-primary);
}
```

#### ❌ No Design Token Definition Detection
Doesn't check if CSS variables are defined:

```css
:root {
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;

  --color-primary: #0066FF;
  --color-secondary: #6B7280;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

#### ❌ No CSS Variable Usage Analysis
Doesn't track which CSS variables are used vs defined

### How to Implement

**File:** `packages/karen-cli/src/detectors/design-tokens.ts` (NEW)

```typescript
export function enforceDesignTokens(
  snapshots: ViewportSnapshot[],
  config: KarenConfig
): Issue[] {
  const issues: Issue[] = [];

  // Define expected design tokens
  const expectedTokens = {
    spacing: config.spacingScale.map((val, i) => ({
      name: `--spacing-${i}`,
      value: `${val}px`
    })),
    colors: config.colorPalette.map((color, i) => ({
      name: `--color-${i}`,
      value: color
    })),
    radii: [
      { name: '--radius-sm', value: '4px' },
      { name: '--radius-md', value: '8px' },
      { name: '--radius-lg', value: '12px' }
    ]
  };

  for (const snapshot of snapshots) {
    for (const element of snapshot.dom) {
      // Check for hardcoded spacing
      const padding = element.computedStyle.padding;
      if (padding && !padding.includes('var(')) {
        const paddingValues = padding.split(' ').map(v => parseInt(v));
        const shouldUseToken = paddingValues.some(val =>
          config.spacingScale.includes(val)
        );

        if (shouldUseToken) {
          issues.push({
            id: generateId('DT'),
            type: 'design-system',
            severity: 'low',
            viewport: snapshot.viewport.name,
            element: element.selector,
            message: `Hardcoded padding? Karen insists on design tokens for consistency.`,
            details: {
              currentValue: padding,
              shouldUseToken: true
            },
            fix: {
              suggestion: 'Replace hardcoded values with CSS variables',
              code: {
                file: 'styles/components.css',
                before: `padding: ${padding};`,
                after: `padding: var(--spacing-3) var(--spacing-6);`
              }
            }
          });
        }
      }

      // Check for hardcoded colors
      const bgColor = element.computedStyle.backgroundColor;
      if (bgColor && !bgColor.includes('var(')) {
        const normalized = normalizeColor(bgColor);
        const inPalette = config.colorPalette.some(c =>
          colorDistance(normalized, c) < 5
        );

        if (inPalette) {
          issues.push({
            id: generateId('DT'),
            type: 'design-system',
            severity: 'low',
            viewport: snapshot.viewport.name,
            element: element.selector,
            message: `Hardcoded color? Use design tokens like you're supposed to.`,
            details: {
              currentColor: bgColor
            },
            fix: {
              suggestion: 'Use CSS variable from your color palette',
              code: {
                file: 'styles/colors.css',
                before: `background-color: ${bgColor};`,
                after: `background-color: var(--color-primary);`
              }
            }
          });
        }
      }
    }
  }

  return issues;
}
```

**Effort:** 3-4 hours
**Priority:** High (design system enforcement is critical)
**Status:** ⚠️ SUGGESTED IN FIXES, NOT ENFORCED AS RULE

---

## 4. @media Query Enforcers ❌ NOT IMPLEMENTED

### What You Asked For
Detection of missing or improper media queries for responsive design

### Current Status
**NO DETECTION WHATSOEVER**

Karen doesn't check:
- ❌ If elements have responsive styles
- ❌ If breakpoints are used correctly
- ❌ If mobile-first approach is followed
- ❌ If media queries match configured breakpoints
- ❌ If components break at certain screen sizes without media queries

### What Should Be Detected

#### Missing Media Queries
```css
/* Bad: Fixed font size, no responsiveness */
.heading {
  font-size: 48px;  /* ❌ Will overflow on mobile! */
}

/* Good: Responsive with media queries */
.heading {
  font-size: 24px;  /* Mobile first */
}

@media (min-width: 768px) {
  .heading {
    font-size: 32px;
  }
}

@media (min-width: 1440px) {
  .heading {
    font-size: 48px;
  }
}
```

#### Wrong Breakpoint Values
```css
/* Bad: Random breakpoints not matching design system */
@media (min-width: 650px) { }  /* ❌ Should be 768px (tablet) */
@media (min-width: 1200px) { } /* ❌ Should be 1440px (desktop) */

/* Good: Using configured breakpoints */
@media (min-width: 768px) { }  /* ✅ Matches config.breakpoints */
@media (min-width: 1440px) { } /* ✅ Matches config.breakpoints */
```

#### No Mobile-First
```css
/* Bad: Desktop-first approach */
.container {
  width: 1200px;  /* ❌ Desktop default */
}

@media (max-width: 768px) {
  .container {
    width: 100%;
  }
}

/* Good: Mobile-first approach */
.container {
  width: 100%;    /* ✅ Mobile default */
}

@media (min-width: 768px) {
  .container {
    width: 1200px;
  }
}
```

### How to Implement

**File:** `packages/karen-cli/src/detectors/responsive.ts` (NEW)

```typescript
export function enforceResponsiveDesign(
  snapshots: ViewportSnapshot[],
  config: KarenConfig
): Issue[] {
  const issues: Issue[] = [];

  // Compare same element across different viewports
  const elementsBySelector = new Map<string, ViewportSnapshot[]>();

  for (const snapshot of snapshots) {
    for (const element of snapshot.dom) {
      if (!elementsBySelector.has(element.selector)) {
        elementsBySelector.set(element.selector, []);
      }
      elementsBySelector.get(element.selector)!.push(snapshot);
    }
  }

  for (const [selector, snapshotsWithElement] of elementsBySelector) {
    if (snapshotsWithElement.length < 2) continue;

    // Get element data from each viewport
    const elementData = snapshotsWithElement.map(snapshot => {
      const element = snapshot.dom.find(el => el.selector === selector);
      return {
        viewport: snapshot.viewport.name,
        width: snapshot.viewport.width,
        fontSize: element?.computedStyle.fontSize,
        padding: element?.computedStyle.padding,
        width: element?.computedStyle.width
      };
    });

    // Check if font size changes across viewports
    const fontSizes = new Set(elementData.map(d => d.fontSize));
    if (fontSizes.size === 1) {
      // Same font size on all viewports - might need media query
      const fontSize = parseInt(elementData[0].fontSize!);
      if (fontSize > 24) { // Large text should scale down on mobile
        issues.push({
          id: generateId('MQ'),
          type: 'design-system',
          severity: 'medium',
          viewport: 'all',
          element: selector,
          message: `Fixed ${fontSize}px font on all screens? Karen demands responsive typography.`,
          details: {
            fontSize: fontSize,
            viewports: elementData.map(d => d.viewport)
          },
          fix: {
            suggestion: 'Use clamp() or media queries for responsive text sizing',
            code: {
              file: 'styles/typography.css',
              before: `${selector} {\n  font-size: ${fontSize}px;\n}`,
              after: `${selector} {\n  font-size: clamp(1.5rem, 4vw + 0.5rem, ${fontSize / 16}rem);\n}`
            }
          }
        });
      }
    }

    // Check if padding changes across viewports
    const paddings = new Set(elementData.map(d => d.padding));
    if (paddings.size === 1) {
      // Same padding on all viewports - might be too much on mobile
      const padding = elementData[0].padding!;
      const paddingValues = padding.split(' ').map(v => parseInt(v));
      const maxPadding = Math.max(...paddingValues);

      if (maxPadding > 32) {
        issues.push({
          id: generateId('MQ'),
          type: 'design-system',
          severity: 'medium',
          viewport: 'all',
          element: selector,
          message: `${maxPadding}px padding on mobile? Karen's concerned about your spacing.`,
          details: {
            padding: padding,
            suggestion: 'Reduce padding on smaller screens'
          },
          fix: {
            suggestion: 'Use media queries to reduce padding on mobile',
            code: {
              file: 'styles/layout.css',
              before: `${selector} {\n  padding: ${padding};\n}`,
              after: `${selector} {\n  padding: 16px; /* Mobile */\n}\n\n@media (min-width: 768px) {\n  ${selector} {\n    padding: ${padding};\n  }\n}`
            }
          }
        });
      }
    }
  }

  return issues;
}
```

**Additional Check: Breakpoint Validation**

```typescript
export function validateMediaQueries(
  stylesheets: string[],
  config: KarenConfig
): Issue[] {
  const issues: Issue[] = [];
  const configuredBreakpoints = config.breakpoints.map(bp => bp.width);

  for (const stylesheet of stylesheets) {
    // Extract all @media queries
    const mediaQueryRegex = /@media\s*\([^)]*min-width:\s*(\d+)px[^)]*\)/g;
    let match;

    while ((match = mediaQueryRegex.exec(stylesheet)) !== null) {
      const breakpoint = parseInt(match[1]);

      // Check if breakpoint matches any configured breakpoint
      const isConfigured = configuredBreakpoints.some(bp =>
        Math.abs(bp - breakpoint) < 10 // Allow 10px tolerance
      );

      if (!isConfigured) {
        const nearest = configuredBreakpoints.reduce((prev, curr) =>
          Math.abs(curr - breakpoint) < Math.abs(prev - breakpoint) ? curr : prev
        );

        issues.push({
          id: generateId('MQ'),
          type: 'design-system',
          severity: 'low',
          viewport: 'all',
          element: 'Media query',
          message: `Random breakpoint at ${breakpoint}px? Karen insists on using ${nearest}px from your design system.`,
          details: {
            currentBreakpoint: breakpoint,
            suggestedBreakpoint: nearest,
            configuredBreakpoints: configuredBreakpoints
          },
          fix: {
            suggestion: `Use ${nearest}px from configured breakpoints`,
            code: {
              file: 'styles/responsive.css',
              before: `@media (min-width: ${breakpoint}px)`,
              after: `@media (min-width: ${nearest}px)`
            }
          }
        });
      }
    }
  }

  return issues;
}
```

**Effort:** 5-6 hours
**Priority:** High (responsive design is critical)
**Status:** ❌ NOT IMPLEMENTED AT ALL

---

## Summary Matrix

| Feature | Status | Details |
|---------|--------|---------|
| **Alignment Detection** | ❌ NO | Config field exists, no detector |
| **Design System Enforcement** | ⚠️ PARTIAL | Buttons only, need inputs/cards/headings |
| **CSS Variables/Tokens** | ⚠️ SUGGESTED | Recommends vars in fixes, doesn't enforce |
| **@media Query Enforcement** | ❌ NO | No detection of responsive issues |

---

## What You Have vs What You Need

### ✅ What Works Now

1. **Button chaos detection** - Finds > 5 button style variations
2. **Border-radius inconsistency** - Detects varying border radii
3. **Padding inconsistency** - Detects varying padding values
4. **CSS variable suggestions** - Recommends `var()` in fixes

### ❌ What's Missing

1. **Alignment checking** - No detection of misaligned elements
2. **Input/Card/Heading consistency** - Only buttons checked
3. **CSS variable enforcement** - Suggests but doesn't require
4. **Media query validation** - No responsive design checks
5. **Breakpoint enforcement** - No validation of media query values
6. **Mobile-first validation** - No detection of desktop-first code

---

## Priority Ranking for Implementation

### Priority 1: CRITICAL (Ship Blockers)
None - current features work for v1.0

### Priority 2: HIGH (Add Soon)
1. **CSS Variable Enforcement** (3-4 hours)
   - Detect hardcoded values that should use tokens
   - Most valuable for design system adoption

2. **Responsive Design Checks** (5-6 hours)
   - Detect elements that don't scale properly
   - Critical for mobile users

### Priority 3: MEDIUM (Nice to Have)
3. **Alignment Detection** (3-4 hours)
   - Grid/flex alignment validation
   - Improves visual polish

4. **Expanded Component Checks** (4-6 hours)
   - Input fields, cards, headings
   - Broader design system coverage

### Priority 4: LOW (Future Enhancement)
5. **Media Query Validation** (2-3 hours)
   - Validate breakpoint values
   - Enforce mobile-first approach

---

## Recommendation

### Ship Now? ✅ YES

Current design system features are sufficient for v1.0:
- ✅ Button consistency detection works
- ✅ CSS variable suggestions in fixes
- ✅ Basic design system chaos detection

### Add Post-Launch

**Week 1:**
- CSS variable enforcement (high value, medium effort)

**Week 2:**
- Responsive design checks (high value, higher effort)

**Week 3:**
- Alignment detection + expanded component checks

---

✨ **Bottom Line:** You have basic design system enforcement (buttons) and CSS variable suggestions. Missing: alignment detection, full component coverage, CSS variable enforcement, and @media query validation.
