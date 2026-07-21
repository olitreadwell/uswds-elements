# Plan: Style Dictionary as the USWDS Token Source of Truth

## Context

The token inventory of USWDS core is complete and classified per Nathan Curtis' naming taxonomy:

- [`uswds-settings-tokens.csv`](uswds-settings-tokens.csv) — ~508 settings (`$theme-*`) tokens; 174 of them are utility-generator configuration, not design tokens (see ADR-0006)
- [`uswds-system-tokens.csv`](uswds-system-tokens.csv) — ~1,100 system tokens (color families, spacing, type scale)
- [`uswds-properties-tokens.csv`](uswds-properties-tokens.csv) — Batch 3, ~144 utility-scale tokens: z-index, opacity, box-shadow, order, flex/flex-direction/flex-wrap, gap, letter-spacing, per-typeface line-height, and the 12-column grid fraction scale. Extracted from `uswds-core/src/styles/_properties.scss` (the `$system-properties` map) and `tokens/units/layout-grid-widths.scss` — neither is under `settings/` or `tokens/`'s simple-map files, so the regex-based extractor used for the other two CSVs can't safely resolve them (nested function-call values like `rgba(0, 0, 0, 0.1)` and `#{$neg-prefix}` key interpolation break it). This batch was extracted with `internals/scripts/extract-properties.js`, which compiles the real USWDS source with dart-sass and reads resolved values directly from the compiler instead of parsing SCSS text. The same fix cleaned up `uswds-system-tokens.csv`'s previously-corrupted negative-spacing rows (`neg-*`, was one garbled ~900-character row, now 16 clean entries).

This plan makes the Style Dictionary in `tokens/` the comprehensive source of truth for USWDS:

1. **CSS custom properties** for web components (`--usa-color-red-60v`, `--usa-button-*`)
2. **Generated SCSS** that USWDS core consumes in place of its hand-authored token files, with a translation layer so legacy names (`$red-60v`, `$theme-color-primary`) keep working while token semantics evolve
3. **npm-distributed tokens**, colors first
4. A **mode-aware semantic tier** so future dark-mode support doesn't fight the existing `-light*`/`-dark*` ramp names

Decisions with alternatives are recorded in [`adr/`](adr/README.md). Prior accepted decisions live
in [architecture-decisions.md](architecture-decisions.md). The audit/enforcement workstream is
[plan-02](plan-01-port-audit-enforce.md) and is folded into Phase 6.

### Current state (summary)

**USWDS core** (`uswds/uswds`, `packages/uswds-core/src/styles/`) resolves tokens through a
3-layer chain: nested system maps (`$system-colors`, `$system-spacing`, `$system-type-scale`) →
flat `$theme-*` settings whose values are _string references_ (`"blue-60v"`, `"md"`, `6`) →
lookup functions (`color()`, `units()`, `radius()`, `family()`) over merged maps
(`$all-color-shortcodes`, `$project-spacing-standard`). ~600 flat shortcode scalars
(`$color-blue-60v` / `$red-60v`) bridge the nested maps to the string-keyed API. Spacing values
are computed from an 8px grid (`spacing-multiple()`); `false` is a sentinel in three roles
(ADR-0008).

**This repo** has Style Dictionary v5.1.1 with DTCG-format sources
(`tokens/{colors,spacing,breakpoints}/*.json`), custom transforms in
`internals/token-helpers/index.ts`, config in `config/style-dictionary.config.js`, and outputs
`build/css/*.css` + `build/scss/_*.scss` published via `@uswds/elements`' `./styles/*` export.
Current vivid naming is `--usa-color-red-vivid-60`; a canonical `--usa-color-red-60v` is added
alongside it per ADR-0002 (both names supported, no rename).

---

## Phases

Each phase is a set of independently reviewable PRs, plan-02 style. A phase's ADRs must be
Accepted before its PRs merge.

### Phase 0 — Decide

Team review of ADRs 0001–0009. ADR-0003 (prominence-scale adaptive tier) is already Accepted;
the rest are Proposed with recommendations.

**Exit criteria:** all nine ADRs Accepted (or amended and Accepted).

### Phase 1 — Complete the primitive tier (ADR-0002, 0006, 0007)

Bring `tokens/` to full coverage of the system tier, sourced from `uswds-system-tokens.csv`:

- **Colors:** all 27 families, including gray grades 1–4; nonexistent `-90v` vivid slots omitted (ADR-0008); canonical `60v` names emitted with `vivid-{grade}` aliases kept alongside (ADR-0002) via `internals/token-helpers/index.ts` + alias-emitting format
- **Spacing:** full computed scale — multiples (`05`…`15`), named (`card`, `card-lg`, `mobile`, `mobile-lg`, `tablet`, `desktop`, `widescreen`, …), negatives (`neg-*`), pixel literals (`1px`, `2px`) — each with `$extensions.uswds.formula` provenance (ADR-0007)
- **Typography:** `tokens/typography/` — type scale (1–20), line heights (1–6) plus the richer per-typeface combinations (`sans-1..6`, `serif-1..6`, `mono-1..6`, `cond-1..6`, `heading-1..6`, `ui-1..6`), letter-spacing including negatives (`ls-neg-1/2/3`), font stacks as `fontFamily` arrays, typeface metadata (display name, cap-height, stack) per ADR-0006; @font-face `src` maps stay out
- **Utility scale** (new, sourced from `uswds-properties-tokens.csv`, ADR-0009): `tokens/utility/` — `z-index.json` (`auto, bottom:-100, 0, 100–500, top:99999`), `opacity.json` (`0–100` → `0`–`1`), `shadow.json` (box-shadow `none, 1–5`), `flex.json` (flex `1–12/fill/auto`, flex-direction, flex-wrap, order `first:-1, last:999, 0–11`), `gap.json` (column-gaps merged with `theme-column-gap-{sm,md,lg}`)
- **Grid** (new): `tokens/grid/layout-grid-widths.json` — 12-column fraction scale (`1/12 … 12/12`, from `tokens/units/layout-grid-widths.scss`)
- **Breakpoints:** re-expressed as aliases of named spacing tokens (matching `$system-breakpoints` being a slice of spacing)

**Negative values:** spacing negatives (`neg-*`), `z-index.bottom` (`-100`), `order.first` (`-1`), and `letter-spacing.ls-neg-{1,2,3}` all resolve to literal negative values, not a separate naming convention — see ADR-0009.

**PRs:** (1) vivid `60v` transform + `vivid-*` alias emission (additive, no rename), (2) color
family completion, (3) spacing scale + formulas, (4) typography sources, (5) breakpoint aliasing.
Each runs `build:tokens` and commits output.

**Verification:** script compares built flat output against `uswds-system-tokens.csv` values
(name→value equality; count reconciliation for the ~60 intentionally omitted/disabled rows).

### Phase 2 — Semantic tier (ADR-0003, 0008)

- Port the 86 `_settings-color.scss` tokens into `tokens/colors/semantic.json` **preserving names** (`base`, `primary-lighter`, `error-dark`, …) as light-mode-fixed aliases of primitives; disabled slots (`primary-lightest`, etc.) carry `$extensions.uswds.disabled` (ADR-0008)
- Add the **adaptive prominence tier** per role (`surface`, `surface-subtle`, `surface-strong`, `border`, `text`, `text-strong`, `on-{role}`) with light/dark primitive pairs and a `light-dark()` CSS transform; `color-scheme: light dark` in the emitted `:root` (ADR-0003). Dark values require design input — start with `base`/`primary`/`error` as the reference set, extend role-by-role
- Port non-color settings that are true design decisions (`$theme-type-scale-*`, `$theme-line-height-*`, `$theme-site-*` widths/margins, focus tokens) as alias tokens in their categories

**Verification:** built CSS for legacy semantic names byte-matches pre-phase output (no
regressions); adaptive tokens render `light-dark(var(--usa-color-…), var(--usa-color-…))`;
Storybook visual check of usa-alert/usa-link in forced dark scheme.

### Phase 3 — Component tier (ADR-0004)

- Generate the `$theme-{component}-*` → `--usa-{component}-*` migration table from the 152 component rows in `uswds-settings-tokens.csv` (component/element/variant/state columns are populated); record non-1:1 cases (`navigation`/`megamenu` → `usa-header` internals) explicitly
- Create `tokens/components/{component}.json` for existing components first (alert, banner\*, link — extends plan-02 PR 8), then per new component as built; values alias the adaptive tier by default
- Update component CSS to consume component tokens without fallbacks (plan-02's pattern; usa-banner stays self-contained)

**Verification:** plan-02's `audit-token-names.js` cross-references `custom-elements.json`,
component CSS, and Style Dictionary output with zero violations.

### Phase 4 — SCSS translation layer for USWDS core (ADR-0005, 0006, 0007, 0008)

Custom Style Dictionary formats emit `dist/scss/uswds-core/` drop-in replacements:

1. Nested family maps + `$system-colors` merge
2. Flat shortcodes (`$color-blue-60v`, `$blue-60v`) + `$system-color-shortcodes` map
3. `$system-spacing`, `$system-type-scale`, `$system-line-height` maps (resolved values)
4. `_settings-*.scss` with `$theme-*: "<shortcode>" !default;` — values printed as _string references_ (preserving USWDS's theme-override contract), `false` for disabled slots
5. `_compat.scss` — legacy → canonical `$usa-*` aliases

**Round-trip verification (the gate for this phase):** compile USWDS core with generated files
substituted, diff the resulting CSS against a baseline build — differences must be
whitespace-only. Add this as a CI integration test (dart-sass compile of
`~/devspace/uswds` / a pinned uswds checkout).

**PRs:** one per format group above, each carrying its round-trip diff evidence; final PR proposes
the file-swap in the uswds repo.

### Phase 5 — Packaging (ADR-0001)

- Restructure into a standalone `@uswds/tokens` workspace: DTCG source + `dist/{css,scss,json}` with per-category exports (`./css/colors.css`, `./scss/colors`, `./json/colors.json`, `./scss/uswds-core/*`)
- Publish colors first (the npm color-tokens deliverable); other categories ship as Phases 1–4 land
- `@uswds/elements` consumes `@uswds/tokens`; its `./styles/*` export re-exports during a deprecation window
- Versioning policy: value change = minor, rename/removal = major, absorbed by the compat layer where possible

**Verification:** `npm pack` dry-run inspection; a scratch project installs the tarball and uses
`css/colors.css` + `json/colors.json` standalone.

### Phase 6 — Enforcement (plan-02, extended)

Everything from plan-02 (stylelint `custom-property-pattern`, `audit-token-names.js`,
`validate-tokens.js`), plus:

- Formula recompute check for `$extensions.uswds.formula` spacing values (ADR-0007)
- Rule: component CSS consumes adaptive-tier semantic tokens, not legacy ramp names (allowlist for intentional exceptions)
- CSV↔dictionary reconciliation script from Phase 1 kept in CI so inventory and source can't drift silently

---

## Critical files

- `config/style-dictionary.config.js` — platforms, new formats/filters
- `internals/token-helpers/index.ts` — `generateTokenName` (`vivid`→`v`, `default` stripping), disabled-token filter, `light-dark()` transform
- `tokens/colors/*.json`, `tokens/colors/semantic.json`, `tokens/spacing/spacing.json`, `tokens/typography/*` (new), `tokens/utility/*.json` (new), `tokens/grid/layout-grid-widths.json` (new), `tokens/components/*.json` (new)
- `internals/formats/` (new) — uswds-core SCSS map/settings/shortcode formats
- `plans/token-migration/uswds-{settings,system,properties}-tokens.csv` — migration source data
- `internals/scripts/extract-properties.js` — Sass-based extractor for `_properties.scss`/`layout-grid-widths.scss`/spacing negatives (Batch 3)
- USWDS core targets (Phase 4 swap): `packages/uswds-core/src/styles/tokens/color/*`, `tokens/units/spacing.scss`, `tokens/font/*`, `settings/_settings-color.scss` et al.

## Overall verification

1. `npm run build:tokens` green at every PR; built artifacts committed
2. CSV reconciliation: every non-excluded inventory row maps to a dictionary token or a recorded disposition (disabled / out-of-scope / superseded)
3. Round-trip: USWDS core compiled with generated SCSS diffs clean against baseline CSS
4. Storybook/e2e visual checks for components in light and forced-dark schemes
5. Packed `@uswds/tokens` consumable standalone (CSS-only and JSON consumers)
