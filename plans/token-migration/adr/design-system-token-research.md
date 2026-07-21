# USWDS Elements Token Architecture — Decision Framework

**Status:** For team review  
**Date:** 2026-06-29  
**Context:** Informed by analysis of Tailwind CSS v4, Radix UI Themes, and Adobe Spectrum (1st + 2nd gen)

---

## Executive Summary

This document presents the key architectural decisions for USWDS Elements' design token system. Each section analyzes
approaches from mature design systems and provides a recommendation specific to USWDS Elements' needs:

- Government agency adoption (federal, state, local)
- Component library for web standards compliance
- No IE11 constraint — modern CSS fully available
- Must eliminate fallback maintenance burden

**Quick Reference**

| Decision           | Recommendation                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Tiering strategy   | **3 tiers**: Primitive → Semantic → Component                                                   |
| Namespace prefix   | **Keep `--usa-*`** prefix                                                                       |
| Scale system       | **Numeric 100-scale** (USWDS convention: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, vivid variants) |
| Theming            | **`light-dark()` function** with `color-scheme` property                                        |
| Fallback strategy  | **Eliminate inline fallbacks** — require global stylesheet                                      |
| Color architecture | **Retain USWDS palette depth** with semantic aliases                                            |

---

## 1. Tiering Strategy

**Question:** How many distinct layers should the token architecture have?

### External System Comparison

| System               | Tiers   | Description                                                         |
| -------------------- | ------- | ------------------------------------------------------------------- |
| **Tailwind v4**      | 1 tier  | Flat primitive-only. No semantic aliases.                           |
| **Radix UI**         | 3 tiers | Primitive (color scale 1-12) → Semantic (role mappings) → Component |
| **Spectrum 1st-gen** | 5 tiers | Primitive → Semantic → Component → System-bridge → Mod hooks        |
| **Spectrum 2nd-gen** | 2 tiers | Primitive (external package) → Semantic (generated CSS)             |

### Analysis

**Tailwind's flat approach:**

- ✅ Simple mental model
- ✅ No indirection
- ❌ No semantic meaning — components reference raw primitives like `blue-500`
- ❌ Rebranding requires find/replace across all components

**Radix's 3-tier approach:**

- ✅ Semantic layer enables global theme changes
- ✅ Component tier enables per-component customization
- ✅ Still simple enough to understand quickly
- ❌ Requires discipline to use semantic tokens consistently

**Spectrum's 5-tier approach:**

- ✅ Maximum flexibility
- ✅ System-bridge enables component+variant+state granularity
- ❌ Complex — hard to navigate
- ❌ Spectrum 2nd-gen collapsed to 2 tiers, suggesting 5 was over-engineered

### Recommendation: **3 Tiers (Radix model)**

```
Primitive → Semantic → Component
```

**Rationale:**

- **Primitive tier** — USWDS color palette (gray-5, blue-60, red-vivid-70, etc.), spacing scale, breakpoints
- **Semantic tier** — Role-based color aliases (base-lightest, primary, error-dark, info-lighter)
- **Component tier** — Component-specific tokens (alert-border-color, link-hover-color)

**Why not more?**

- Spectrum's 5-tier system added complexity without clear benefit (evidenced by 2nd-gen collapsing to 2)
- USWDS Elements is smaller in scope than Spectrum (fewer components, fewer variants)
- 3 tiers balances reusability with simplicity

**Why not fewer?**

- 1 tier (Tailwind) sacrifices semantic meaning — government sites need consistent info/warning/error colors
- 2 tiers collapses semantic and component concerns — harder to manage global theme vs. component-specific overrides

---

## 2. Namespace/Prefix Strategy

**Question:** Should tokens use a `--usa-*` prefix, no prefix (like Radix), or something else?

### External System Comparison

| System               | Prefix         | Reason                                                      |
| -------------------- | -------------- | ----------------------------------------------------------- |
| **Tailwind v4**      | None           | Theme definitions are scoped; no collision risk             |
| **Radix UI**         | None           | Scoped via `:where(.radix-themes)` low-specificity selector |
| **Spectrum 1st-gen** | `--spectrum-*` | Explicit namespace for Adobe's design system                |
| **Spectrum 2nd-gen** | `--swc-*`      | Changed prefix to match package name (breaking change)      |

### Analysis

**Unprefixed (Tailwind/Radix):**

- ✅ Shorter token names (`--blue-9` vs. `--usa-color-blue-vivid-90`)
- ✅ Cleaner aesthetic
- ❌ Risk of collision with third-party libraries (e.g., a site using both USWDS and another system)
- ❌ No clear ownership signal

**Prefixed (`--usa-*`):**

- ✅ Zero collision risk
- ✅ Clear ownership — tokens are unmistakably USWDS
- ✅ Aligns with existing USWDS convention across repos
- ❌ Longer token names
- ❌ If prefix changes, requires migration (as Spectrum experienced)

### Recommendation: **Keep `--usa-*` prefix**

**Rationale:**

- **Government context:** Federal agencies often integrate multiple design systems (USWDS + agency-specific patterns).
  Explicit namespacing prevents collisions.
- **Cross-team consistency:** USWDS Compile (Sass) uses `$theme-*` prefix. USWDS Elements should use `--usa-*` for CSS
  custom properties to maintain brand consistency.
- **Discovery:** Developers can autocomplete `--usa-` to see all available tokens.

**Migration note:** If the prefix ever needs to change, a regex find/replace across the codebase is straightforward. The
prefix is a shallow concern compared to the depth of the architecture.

---

## 3. Scale System

**Question:** How should numeric scales be structured? USWDS uses 5-10-20-...-90 with "vivid" variants. Should we keep
this or adopt a different system?

### External System Comparison

| System              | Scale Type             | Range                                                                        |
| ------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| **Tailwind v4**     | 100-scale              | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 (11 stops)              |
| **Radix UI**        | Integer 1-12           | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (12 steps, each with semantic meaning) |
| **Spectrum**        | 100-scale + fractional | 50, 75, 100, 200, 300, ..., 1600 (16 steps)                                  |
| **USWDS (current)** | 10-scale + vivid       | 5, 10, 20, 30, 40, 50, 60, 70, 80, 90 + vivid variants (11 stops per hue)    |

### Analysis

**Radix's 1-12 scale:**

- ✅ Each step
  has [documented semantic meaning](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) (
  1=app background, 9=solid backgrounds, 12=high-contrast text)
- ✅ Simple mental model
- ❌ Not compatible with USWDS's existing 5-90 convention
- ❌ Only 12 stops — less granularity than USWDS

**Tailwind's 50-950 scale:**

- ✅ Room to grow (can add 150, 250 without breaking existing values)
- ✅ Industry familiarity (Material Design, Tailwind)
- ❌ Inconsistent step size (50-100 is a 50-unit jump, 900-950 is a 50-unit jump)

**USWDS's 5-90 + vivid:**

- ✅ Already established across federal agencies
- ✅ "Vivid" modifier provides semantic clarity (accessible high-contrast colors)
- ✅ 10-unit steps feel natural (0-100 scale)
- ❌ Mixing modifiers with numbers adds complexity (blue-vivid-60)

### Recommendation: **Keep USWDS 10-scale with vivid modifier**

**Rationale:**

- **Continuity:** USWDS Compile uses this convention. Changing it would fragment the ecosystem.
- **Adoption inertia:** Federal agencies already using USWDS tokens would face migration costs.
- **"Vivid" semantics:** The modifier communicates accessibility intent (vivid = meets contrast ratios).

**Path forward:**

- Maintain current primitive scale: `5, 10, 20, 30, 40, 50, 60, 70, 80, 90` + `vivid` variants
- Document the scale semantics (what 50 vs. 70 means in terms of lightness/usage)

---

## 4. Theming Strategy

**Question:** How should light/dark mode (and potentially custom themes) be implemented?

### External System Comparison

| System               | Approach                               | Details                                                     |
| -------------------- | -------------------------------------- | ----------------------------------------------------------- |
| **Tailwind v4**      | `@theme default` + variant classes     | Tokens defined once; `dark:` variant applies dark styles    |
| **Radix UI**         | `light-dark()` via `data-*` attributes | Uses CSS `light-dark()` function + `color-scheme` property  |
| **Spectrum 1st-gen** | Separate CSS files                     | `light-vars.css` + `dark-vars.css`, loaded via class toggle |
| **Spectrum 2nd-gen** | `light-dark()` function                | Native CSS: `--token: light-dark(lightValue, darkValue)`    |

### Analysis

**Separate CSS files (Spectrum 1st-gen):**

- ❌ Doubles the token count (every color defined twice)
- ❌ Maintenance burden (update both files)
- ❌ Spectrum abandoned this in 2nd-gen

**Variant classes (Tailwind):**

- ✅ Well-understood pattern
- ❌ Requires utility-class framework
- ❌ Not applicable to custom properties

**`light-dark()` function (Radix, Spectrum 2nd-gen):**

- ✅ Native CSS — no build step
- ✅ Single source of truth per token
- ✅ Works with `prefers-color-scheme` and explicit `color-scheme` override
- ✅ Supported in all modern browsers (Chrome 123+, Firefox 120+, Safari 17.5+)
- ❌ Older browsers see fallback (but IE11 is gone)

### Recommendation: **Use `light-dark()` function**

**Implementation:**

```css
:root {
    color-scheme: light dark; /* Enable native theme switching */
}

:root {
    /* Semantic tokens using light-dark() */
    --usa-color-base-lightest: light-dark(
        var(--usa-color-gray-5),
        /* light mode */ var(--usa-color-gray-90) /* dark mode */
    );

    --usa-color-primary: light-dark(
        var(--usa-color-blue-vivid-60),
        var(--usa-color-blue-40)
    );
}
```

**Why this?**

- **Modern CSS alignment:** This is the future-proof approach. `light-dark()` is the standard.
- **Single definition:** One token, one line, two values.
- **Automatic switching:** Respects user's OS preference via `prefers-color-scheme`.
- **Explicit override:** Apps can set `<html style="color-scheme: dark">` to force a scheme.

**Browser support:**

- Chrome 123+ (March 2024)
- Firefox 120+ (Nov 2023)
- Safari 17.5+ (May 2024)

Since IE11 support is dropped, this is safe.

---

## 5. Fallback Elimination

**Question:** Should components have inline fallback values like `var(--usa-color-info-lighter, #e7f6f8)`?

### Current State

Components currently use:

```css
--usa-alert-info-background: var (--usa-color-info-lighter, #e7f6f8);
```

**Problems:**

- Fallback values drift from token definitions (manual sync required)
- Duplication (value exists in both style-dictionary output AND component CSS)
- Maintenance burden

### External System Comparison

| System                   | Approach                                           |
| ------------------------ | -------------------------------------------------- |
| **Tailwind v4**          | No fallbacks — utilities require theme CSS         |
| **Radix UI**             | No fallbacks — requires `.radix-themes` stylesheet |
| **Spectrum 1st/2nd-gen** | No fallbacks — components expect global tokens     |

**All three systems require a global stylesheet.** None provide standalone components with baked-in fallbacks.

### Recommendation: **Eliminate inline fallbacks**

**New pattern:**

```css
/* Component CSS */
:host {
    --usa-alert-info-background: var(--usa-color-info-lighter);
    --usa-alert-info-border: var(--usa-color-info);
}
```

**Requirements:**

1. Apps must load a stylesheet that contains the tokens that their application or component usage depends upon. This mean `build/css/colors.css` (or the full token stylesheet)
2. usa-banner remains self-contained (special case for compliance)

**Why?**

- ✅ Single source of truth (style-dictionary output only)
- ✅ No drift between fallback and token definition
- ✅ Aligns with industry standard (Tailwind, Radix, Spectrum all require global stylesheet)

**Exception: usa-banner**

The banner is a special compliance component that must work when dropped onto any page from a CDN. It keeps hardcoded
values in its CSS and does NOT depend on the global stylesheet.

---

## 6. Color Architecture

**Question:** How deep should the color palette be? Should USWDS Elements retain the full USWDS color system, or
simplify?

### External System Comparison

| System              | Palette           | Hues                                                                                                                                                                                                                                     | Stops per Hue           |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Tailwind v4**     | 22 hues           | red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, slate, gray, zinc, neutral, stone                                                                                  | 11 stops (50-950)       |
| **Radix UI**        | 30 hues           | tomato, red, ruby, crimson, pink, plum, purple, violet, iris, indigo, blue, cyan, teal, jade, green, grass, lime, mint, sky, amber, orange, yellow, gold, bronze, brown, gray, mauve, slate, sage, olive, sand                           | 12 stops (1-12)         |
| **Spectrum**        | ~10 semantic hues | gray, blue, red, orange, green, cyan, magenta, purple, indigo                                                                                                                                                                            | 16 stops (50-1600)      |
| **USWDS (current)** | 17 hues           | red, red-warm, red-cool, orange, orange-warm, gold, yellow, green, green-warm, green-cool, mint, mint-cool, cyan, blue, blue-warm, blue-cool, indigo, indigo-warm, indigo-cool, violet, violet-warm, magenta, gray, gray-warm, gray-cool | 11 stops (5-90) + vivid |

### Analysis

**USWDS has the most granular palette** (17 hues with warm/cool variants).

**Pros:**

- Government accessibility requirements often demand specific contrast ratios
- Warm/cool variants provide designers with more tools
- Already established across federal design community

**Cons:**

- More tokens to maintain
- Decision paralysis (is it blue-warm or blue-cool?)

**Simplification risk:**

- Removing hues would break existing federal sites using USWDS
- Warm/cool distinction is meaningful for accessibility (subtle warmth can improve readability)

### Recommendation: **Retain full USWDS palette**

**Rationale:**

- **Continuity:** Don't break existing federal agency implementations
- **Accessibility:** The palette depth supports diverse contrast needs
- **Differentiation:** This is a USWDS strength — other systems have simpler palettes

**Path forward:**

- Keep all current primitive hues
- Document when to use warm vs. cool variants
- Semantic tier simplifies common use cases (designers don't need to choose between blue-warm-vivid-60 and blue-vivid-60
  every time — they use `--usa-color-primary`)

---

## 7. Synthesized Recommendation

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: PRIMITIVE TOKENS                                    │
│ Source: tokens/{colors,spacing,breakpoints}/*.json          │
│ Prefix: --usa-                                              │
│ Examples:                                                   │
│   --usa-color-blue-vivid-60                                 │
│   --usa-color-gray-5                                        │
│   --usa-spacing-2                                           │
│   --usa-breakpoint-tablet                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: SEMANTIC TOKENS                                     │
│ Source: tokens/colors/semantic.json                         │
│ Prefix: --usa-color-                                        │
│ Uses light-dark() for theming:                             │
│   --usa-color-base-lightest: light-dark(                   │
│     var(--usa-color-gray-5),                                │
│     var(--usa-color-gray-90)                                │
│   );                                                        │
│   --usa-color-primary: light-dark(                         │
│     var(--usa-color-blue-vivid-60),                        │
│     var(--usa-color-blue-40)                                │
│   );                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: COMPONENT TOKENS                                    │
│ Source: Component CSS :host {} blocks                       │
│ Prefix: --usa-{component}-                                  │
│ Examples:                                                   │
│   --usa-alert-border-color: var(--usa-color-info);         │
│   --usa-link-hover-color: var(--usa-color-primary-dark);   │
│                                                             │
│ No inline fallbacks — require global stylesheet            │
└─────────────────────────────────────────────────────────────┘
```

### Migration Path

**Phase 1: Expand Style Dictionary (builds on plan-02 PRs)**

1. Add light/dark values to semantic.json using `light-dark()` syntax
2. Update style-dictionary config to output `light-dark()` format
3. Add `color-scheme: light dark` to :root

**Phase 2: Update Components**

1. Remove inline fallback values from component CSS
2. Update component tokens to reference semantic tokens
3. Document that apps must load global stylesheet (except usa-banner)

**Phase 3: Validation & Enforcement**

1. Stylelint rule: no hardcoded colors (enforce token usage)
2. CI validation: all `var()` references resolve to style-dictionary tokens
3. Document token usage guidelines (when to use primitive vs. semantic vs. component)

### Key Design Principles

1. **Conservative evolution** — Don't break the USWDS ecosystem
2. **Modern CSS** — Use native features (`light-dark()`, `color-scheme`)
3. **Single source of truth** — Style Dictionary generates all tokens
4. **Clear semantics** — 3 tiers with distinct purposes
5. **Require global stylesheet** — Eliminate fallback maintenance burden (except usa-banner)

---

## Decision Summary

| Decision  | Choice                                     | Status         |
| --------- | ------------------------------------------ | -------------- |
| Tiering   | 3 tiers (Primitive → Semantic → Component) | ✅ Recommended |
| Prefix    | Keep `--usa-*`                             | ✅ Recommended |
| Scale     | Keep USWDS 10-scale + vivid                | ✅ Recommended |
| Theming   | `light-dark()` function                    | ✅ Recommended |
| Fallbacks | Eliminate (require global stylesheet)      | ✅ Recommended |
| Palette   | Retain full USWDS color depth              | ✅ Recommended |

---

## Comparison to External Systems

| Aspect       | USWDS Elements (Recommended) | Tailwind v4     | Radix UI       | Spectrum 2nd-gen |
| ------------ | ---------------------------- | --------------- | -------------- | ---------------- |
| Tiers        | 3                            | 1               | 3              | 2                |
| Prefix       | `--usa-*`                    | none            | none           | `--swc-*`        |
| Scale        | 10-scale + vivid             | 100-scale       | 1-12           | 100-scale        |
| Theming      | `light-dark()`               | variant classes | `light-dark()` | `light-dark()`   |
| Fallbacks    | None (require sheet)         | None            | None           | None             |
| Palette Hues | 17                           | 22              | 30             | ~10              |

**Alignment:** USWDS Elements' recommended architecture most closely resembles **Radix UI** (3-tier, `light-dark()`, no
fallbacks) but with USWDS-specific prefix and scale conventions.

---

## Next Steps

**For the team to decide:**

1. Review and approve/modify these recommendations
2. Prototype the `light-dark()` implementation with a small token set
3. Update plan-02 PRs to incorporate theming strategy
4. Document migration guide for consumers

**Questions for discussion:**

- Should dark mode be opt-in or default-enabled?
- How should custom themes (beyond light/dark) be handled?
- Should we provide a `tokens.json` export for apps that generate CSS at runtime?

**Reference:**

- [CSS `light-dark()` on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [Radix Colors Documentation](https://www.radix-ui.com/colors/docs/overview/getting-started)
- [Spectrum Tokens Package](https://www.npmjs.com/package/@adobe/spectrum-tokens)
