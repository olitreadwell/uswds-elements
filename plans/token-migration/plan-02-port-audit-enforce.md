# Plan: Token Infrastructure — Port, Audit, Enforce

## Context

USWDS Elements has a partial style-dictionary setup (`tokens/`, `config/style-dictionary.config.js`) that produces primitive color, spacing, and breakpoint tokens. However:

- **Semantic tokens are missing** — components reference `--usa-color-info-lighter`, `--usa-color-base-darkest`, etc. but style-dictionary only produces primitives like `--usa-color-cyan-vivid-30`. The semantic layer currently lives as a handful of ad-hoc aliases in `src/core/colors.css`.
- **Component tokens aren't in style-dictionary** — values like `--usa-banner-background-color` are hand-authored in component CSS with hardcoded hex fallbacks.
- **Naming is inconsistent** — usa-link uses `--theme-*` prefix while other components use `--usa-*`.
- **No enforcement** — nothing prevents a contributor from introducing off-convention token names.

This plan covers:

1. Porting semantic and component tokens into style-dictionary as the single source of truth
2. Auditing token names in the custom-elements manifest against USWDS conventions
3. Adding a lint/validation step to enforce naming going forward

This plan comes after [plan-01](plan-01-style-dictionary-source-of-truth.md), which establishes the Style Dictionary in `tokens/` as the comprehensive source of truth for USWDS; the audit/enforcement workstream here is folded into that plan's Phase 6.

The CSS consumption pattern (how components import and use tokens at runtime) is covered in a separate plan.

---

## Objective 1: Port Tokens to Style Dictionary

### 1.1 Add Semantic Color Tokens

**New file:** `tokens/colors/semantic.json`

Maps USWDS semantic roles to primitive palette tokens using style-dictionary alias references:

```json
{
  "color": {
    "base": {
      "$type": "color",
      "lightest": { "$value": "{color.gray.5}" },
      "lighter": { "$value": "{color.gray-cool.10}" },
      "light": { "$value": "{color.gray-cool.30}" },
      "default": { "$value": "{color.gray-cool.50}" },
      "dark": { "$value": "{color.gray-cool.60}" },
      "darker": { "$value": "{color.gray-cool.70}" },
      "darkest": { "$value": "{color.gray.90}" }
    },
    "primary": { ... },
    "info": { ... },
    "error": { ... },
    "warning": { ... },
    "success": { ... },
    "emergency": { ... }
  }
}
```

Exact values derived from the `settings-tokens.csv` extraction (e.g., `$theme-color-base-lightest` maps to `"gray-5"`).

### 1.2 Add Component Token Files

**New directory:** `tokens/components/`

One file per component, declaring the component's public custom properties with alias references to semantic/primitive tokens:

- `tokens/components/alert.json` — info/error/warning/success backgrounds, border, icon colors
- `tokens/components/link.json` — link-color, visited-color, hover-color, active-color

Example (`tokens/components/alert.json`):

```json
{
    "alert": {
        "background-color": {
            "$type": "color",
            "$value": "{color.info.lighter}"
        },
        "border-color": { "$type": "color", "$value": "{color.info.default}" },
        "icon-color": { "$type": "color", "$value": "{color.info.default}" },
        "text-color": { "$type": "color", "$value": "{color.base.darkest}" },
        "padding-x": { "$type": "dimension", "$value": "{spacing.205}" },
        "padding-y": { "$type": "dimension", "$value": "{spacing.2}" }
    }
}
```

### 1.3 Add `spacing.205` Token

The alert currently uses `1.25rem` padding which corresponds to USWDS spacing `205` (2.5 × 8px = 20px). This token is missing from `tokens/spacing/spacing.json` and should be added.

### 1.4 Update Style Dictionary Config

Modify `config/style-dictionary.config.js`:

1. Register a new `json/flat-map` format that outputs a `{ "--usa-token-name": "resolved-value" }` map. This will be used later by the CSS consumption pattern plan for build-time fallback injection.
2. Add `components` to the output groups (auto-discovered via `tokens/index.js` since it reads subdirectories).
3. Handle `"default"` path segment — the `generateTokenName` transform should omit it so `color.base.default` produces `--usa-color-base` not `--usa-color-base-default`.

**Files to modify:**

- `config/style-dictionary.config.js`
- `internals/token-helpers/index.ts` (update `generateTokenName` to filter "default" segment)

### 1.5 Special Case: usa-banner

The banner is a standalone compliance component (per https://standards.digital.gov/standards/banner/) that must work when dropped onto any page from a CDN with no setup. Its tokens remain self-contained with hardcoded fallback values. It does NOT get a `tokens/components/banner.json` file — its values are authored directly in its CSS. The banner is excluded from the "require a global stylesheet" pattern.

---

## Objective 2: Audit Token Names

### 2.1 Naming Convention

All tokens in USWDS Elements must follow:

| Tier       | Pattern                                       | Example                     |
| ---------- | --------------------------------------------- | --------------------------- |
| Primitive  | `--usa-{category}-{hue}[-{modifier}]-{scale}` | `--usa-color-blue-vivid-60` |
| Semantic   | `--usa-{category}-{role}[-{grade}]`           | `--usa-color-base-lightest` |
| Component  | `--usa-{component}-{property}[-{state}]`      | `--usa-alert-border-color`  |
| Spacing    | `--usa-spacing-{scale}`                       | `--usa-spacing-2`           |
| Breakpoint | `--usa-breakpoint-{name}`                     | `--usa-breakpoint-tablet`   |

The `--theme-*` prefix is **not** part of the convention and should be retired.

### 2.2 Audit Script

**New file:** `internals/scripts/audit-token-names.js`

This script:

1. Parses `custom-elements.json` → extracts all `cssProperties[].name` entries
2. Parses each component CSS file → extracts all custom property declarations and `var()` references
3. Validates each token name against the naming convention regex
4. Cross-references component tokens against style-dictionary output to flag:
    - Tokens that exist in CSS but not in style-dictionary (undeclared)
    - Tokens in style-dictionary that no component references (unused)
    - Naming violations (`--theme-*`, missing `--usa-` prefix, etc.)

Output: a report listing violations and suggestions.

### 2.3 Known Violations to Fix

| Component | Token                        | Issue        | Fix                          |
| --------- | ---------------------------- | ------------ | ---------------------------- |
| usa-link  | `--theme-link-color`         | Wrong prefix | → `--usa-link-color`         |
| usa-link  | `--theme-link-visited-color` | Wrong prefix | → `--usa-link-visited-color` |
| usa-link  | `--theme-link-hover-color`   | Wrong prefix | → `--usa-link-hover-color`   |
| usa-link  | `--theme-link-active-color`  | Wrong prefix | → `--usa-link-active-color`  |
| usa-link  | `--theme-focus-width`        | Wrong prefix | → `--usa-focus-width`        |
| usa-link  | `--theme-focus-style`        | Wrong prefix | → `--usa-focus-style`        |
| usa-link  | `--theme-focus-color`        | Wrong prefix | → `--usa-focus-color`        |
| usa-link  | `--theme-focus-offset`       | Wrong prefix | → `--usa-focus-offset`       |

---

## Objective 3: Enforce Conventions

### 3.1 Stylelint Rule

Add to `config/stylelint.config.mjs`:

```js
"custom-property-pattern": [
  "^usa-[a-z][a-z0-9]*(-[a-z0-9]+)*$",
  { message: "Custom properties must use --usa-* prefix (found \"%s\")" }
]
```

This catches any `--theme-*` or other off-convention declarations.

### 3.2 Token Validation Script (CI)

**New file:** `internals/scripts/validate-tokens.js`

Runs as part of CI (`npm run lint:tokens`). Checks:

1. Every `var(--usa-*)` reference in component CSS points to either:
    - A token defined in style-dictionary output, OR
    - A component token declared in the same file's `:host {}` block
2. Every `:host {}` custom property declaration follows `--usa-{component}-*` where `{component}` matches the file's parent directory name
3. No orphaned tokens (declared but never consumed in the component's rules)

### 3.3 Package.json Script

```json
"lint:tokens": "node internals/scripts/validate-tokens.js"
```

Integrated into the existing lint pipeline so PRs that introduce naming violations fail CI.

---

## PRs (each independently reviewable and mergeable)

### PR 1: Add semantic color tokens to style-dictionary

**Scope:** New file only — no component changes.

- Create `tokens/colors/semantic.json`
- Update `internals/token-helpers/index.ts` to omit "default" path segment
- Run `build:tokens`, commit updated `build/` output
- **Review surface:** 2 files changed, ~80 lines

### PR 2: Add missing spacing token

**Scope:** One-line addition.

- Add `"205": { "$value": { "value": "1.25", "unit": "rem" } }` to `tokens/spacing/spacing.json`
- Run `build:tokens`, commit updated output
- **Review surface:** 1 file changed, ~3 lines

### PR 3: Add `json/flat-map` format to style-dictionary

**Scope:** Config change, new build artifact.

- Register new format in `config/style-dictionary.config.js`
- Generates `build/token-map.json` (used by future CSS pattern work)
- **Review surface:** 1 file changed, ~15 lines + generated JSON

### PR 4: Add token audit script

**Scope:** New script, no production code changes.

- Create `internals/scripts/audit-token-names.js`
- Add `"audit:tokens"` script to `package.json`
- Document findings in PR description
- **Review surface:** 1 new file, ~100 lines

### PR 5: Fix usa-link `--theme-*` → `--usa-*` naming

**Scope:** Rename tokens in one component.

- Update `src/components/usa-link/usa-link.css`
- Update `@cssprop` JSDoc in `src/components/usa-link/index.js`
- Update `src/core/colors.css` (remove `--theme-link-*` aliases)
- Regenerate `custom-elements.json`
- **Review surface:** 3 files, ~20 lines changed
- **Breaking change:** document migration in PR (consumers using `--theme-*` must update)

### PR 6: Add stylelint `custom-property-pattern` rule

**Scope:** Config change only.

- Add rule to `config/stylelint.config.mjs`
- Verify `npm run stylelint` passes (after PR 5 is merged)
- **Review surface:** 1 file, ~5 lines

### PR 7: Add token validation script for CI

**Scope:** New script, package.json hook.

- Create `internals/scripts/validate-tokens.js`
- Add `"lint:tokens"` script to `package.json`
- **Review surface:** 1 new file, ~80 lines

### PR 8: Add component token files to style-dictionary

**Scope:** New token source files (depends on PRs 1-2 being merged).

- Create `tokens/components/alert.json`
- Create `tokens/components/link.json`
- Run `build:tokens`, commit output
- **Review surface:** 2 new files, ~40 lines each

---

### Merge Order

```
PR 1 (semantic tokens) ─┐
PR 2 (spacing 205) ─────┼─→ PR 8 (component token files)
PR 3 (flat-map format) ─┘
PR 4 (audit script) ────→ PR 5 (fix usa-link) ─→ PR 6 (stylelint rule)
PR 7 (validate script) — independent, merge anytime after PR 1
```

PRs 1-4 and 7 can be worked in parallel. PR 5 depends on PR 4 (audit confirms the violations). PR 6 depends on PR 5 (rule would fail if `--theme-*` tokens still exist). PR 8 depends on PRs 1-2 (needs semantic token aliases to reference).

---

## Verification (per PR)

Each PR has its own pass/fail check:

- PR 1-3, 8: `npm run build:tokens` succeeds, output matches expectations
- PR 4: `node internals/scripts/audit-token-names.js` runs and reports known violations
- PR 5: `npm run stylelint` passes, `custom-elements.json` has no `--theme-*` entries
- PR 6: `npm run stylelint` catches `--theme-*` if re-introduced
- PR 7: `npm run lint:tokens` validates all var() references resolve

Across all PRs: usa-banner CSS is unchanged (it stays self-contained).

---

## Critical Files

- `config/style-dictionary.config.js`
- `config/stylelint.config.mjs`
- `internals/token-helpers/index.ts`
- `tokens/colors/semantic.json` (new)
- `tokens/components/alert.json` (new)
- `tokens/components/link.json` (new)
- `internals/scripts/audit-token-names.js` (new)
- `internals/scripts/validate-tokens.js` (new)
- `src/components/usa-link/usa-link.css` (rename --theme-\* tokens)
