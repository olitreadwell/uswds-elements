# Plan: Token Infrastructure — Port, Audit, Enforce

> **Amendment (2026-07-21, ADR-0010):** The tier-first restructure
> (`tokens/<tier>/<category>/…`) supersedes the single-file plan described below. Semantic roles
> split by tier: branding roles (`base`, `primary`, `secondary`, `accent-warm`, `accent-cool`,
> `emergency`) live one-per-file in `tokens/theme/color/*.json`; feedback roles (`error`,
> `warning`, `success`, `info`, `disabled`) live one-per-file in `tokens/state/color/*.json`.
> ADR-0010 is authoritative on structure; this plan's Objective 1.1 is superseded by it.

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

**New files, one per role, split by tier (ADR-0010):**

- `tokens/theme/color/base.json`, `primary.json`, `secondary.json`, `accent-warm.json`, `accent-cool.json`, `emergency.json` — branding roles
- `tokens/state/color/error.json`, `warning.json`, `success.json`, `info.json`, `disabled.json` — feedback roles

Maps USWDS semantic roles to primitive palette tokens using style-dictionary alias references.
Example (`tokens/theme/color/base.json`):

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
        }
    }
}
```

Each other role (`primary`, `info`, `error`, `warning`, `success`, `emergency`, …) follows the same
per-role-file shape in its own file under `tokens/theme/color/` or `tokens/state/color/` per the
tier it belongs to. Exact values derived from the `settings-tokens.csv` extraction (e.g.,
`$theme-color-base-lightest` maps to `"gray-5"`).

### 1.2 Add Component Token Files

**New directory:** `tokens/components/`

One file per component, declaring the component's public custom properties with alias references to theme/state/primitive tokens:

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

The alert currently uses `1.25rem` padding which corresponds to USWDS spacing `205`
(2.5 × 8px = 20px). This token is **owned by plan-01 P1-PR 4** (the full spacing scale)
and will be added to `tokens/system/spacing/spacing.json` as part of that PR. P2-PR 2
(this plan) must gate on P1-PR 4 and not independently add `spacing.205` — doing so
would create duplicate entries at conflicting paths.

See plan-01's Critical Files note on `spacing.205` for the dependency record.

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

> **PR numbering note:** PRs in this plan are prefixed `P2-PR` to distinguish them from
> plan-01's `P1-PR 0–8`. All cross-references below use that prefix.

### P2-PR 1: Add semantic color tokens to style-dictionary

**Scope:** New files only — no component changes.

- Create per-role files under `tokens/theme/color/*.json` (branding roles) and `tokens/state/color/*.json` (feedback roles)
- Update `internals/token-helpers/index.ts` to omit "default" path segment
- Run `build:tokens`, commit updated `build/` output
- **Review surface:** several new files, ~80 lines total

### P2-PR 2: Add missing spacing token

**Scope:** One-line addition.

**Prerequisite:** P1-PR 4 (plan-01's full spacing scale) owns `spacing.205` in
`tokens/system/spacing/spacing.json` (post-P1-PR0 path). This PR must **not** independently
add `spacing.205` to the old `tokens/spacing/spacing.json` path — doing so creates a
duplicate at two paths. Instead, gate this PR on P1-PR 4 having merged and verify the token
already exists before writing any new lines.

### P2-PR 3: Add `json/flat-map` format to style-dictionary

**Scope:** Config change, new build artifact.

- Register new format in `config/style-dictionary.config.js`
- Generates `build/token-map.json` (used by future CSS pattern work)
- **Review surface:** 1 file changed, ~15 lines + generated JSON

### P2-PR 4: Add token audit script

**Scope:** New script, no production code changes.

- Create `internals/scripts/audit-token-names.js`
- Add `"audit:tokens"` script to `package.json`
- Document findings in PR description
- **Review surface:** 1 new file, ~100 lines

### P2-PR 5: Fix usa-link `--theme-*` → `--usa-*` naming

**Scope:** Rename tokens in one component.

- Update `src/components/usa-link/usa-link.css`
- Update `@cssprop` JSDoc in `src/components/usa-link/index.js`
- Update `src/core/colors.css` (remove `--theme-link-*` aliases)
- Regenerate `custom-elements.json`
- **Review surface:** 3 files, ~20 lines changed
- **Breaking change:** document migration in PR (consumers using `--theme-*` must update)

### P2-PR 6: Add stylelint `custom-property-pattern` rule

**Scope:** Config change only.

- Add rule to `config/stylelint.config.mjs`
- Verify `npm run stylelint` passes (after P2-PR 5 is merged)
- **Review surface:** 1 file, ~5 lines

### P2-PR 7: Add token validation script for CI

**Scope:** New script, package.json hook.

- Create `internals/scripts/validate-tokens.js`
- Add `"lint:tokens"` script to `package.json`
- **Review surface:** 1 new file, ~80 lines

### P2-PR 8: Add component token files to style-dictionary

**Scope:** New token source files (depends on P2-PRs 1-2 being merged).

- Create `tokens/components/alert.json`
- Create `tokens/components/link.json`
- Run `build:tokens`, commit output
- **Review surface:** 2 new files, ~40 lines each

---

### Merge Order

```
P2-PR 1 (semantic tokens) ─┐
P2-PR 2 (spacing 205) ─────┼─→ P2-PR 8 (component token files)
P2-PR 3 (flat-map format) ─┘
P2-PR 4 (audit script) ────→ P2-PR 5 (fix usa-link) ─→ P2-PR 6 (stylelint rule)
P2-PR 7 (validate script) — independent, merge anytime after P2-PR 1
```

P2-PRs 1, 3, 4, and 7 can be worked in parallel. P2-PR 2 must gate on P1-PR 4 (plan-01)
having merged first. P2-PR 5 depends on P2-PR 4 (audit confirms the violations). P2-PR 6
depends on P2-PR 5 (rule would fail if `--theme-*` tokens still exist). P2-PR 8 depends on
P2-PRs 1-2 (needs semantic token aliases to reference).

---

## Verification (per PR)

Each PR has its own pass/fail check:

- P2-PR 1, 3, 8: `npm run build:tokens` succeeds, output matches expectations
- P2-PR 2: verify `spacing.205` already present (from P1-PR 4); no new file write if token exists
- P2-PR 4: `node internals/scripts/audit-token-names.js` runs and reports known violations
- P2-PR 5: `npm run stylelint` passes, `custom-elements.json` has no `--theme-*` entries
- P2-PR 6: `npm run stylelint` catches `--theme-*` if re-introduced
- P2-PR 7: `npm run lint:tokens` validates all var() references resolve

Across all PRs: usa-banner CSS is unchanged (it stays self-contained).

---

## Critical Files

- `config/style-dictionary.config.js`
- `config/stylelint.config.mjs`
- `internals/token-helpers/index.ts`
- `tokens/theme/color/*.json`, `tokens/state/color/*.json` (new)
- `tokens/components/alert.json` (new)
- `tokens/components/link.json` (new)
- `internals/scripts/audit-token-names.js` (new)
- `internals/scripts/validate-tokens.js` (new)
- `src/components/usa-link/usa-link.css` (rename --theme-\* tokens)
