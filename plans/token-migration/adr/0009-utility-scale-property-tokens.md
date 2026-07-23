# ADR-0009: Utility-scale property tokens — scope and negative values

**Status:** Proposed
**Date:** 2026-07-15
**Related:** ADR-0006, ADR-0007, ADR-0010

## Context

`_properties.scss`'s `$system-properties` map (713 lines, one entry per CSS property the utility
generator can emit) was never part of the extracted inventory — Batch 1/2 only scanned
`settings/` and `tokens/`, and `_settings-utilities.scss` (which Batch 3 was originally aimed at
per plan-01.md) turned out to hold only empty generator-config stubs, not the values (see
ADR-0006 §3). The real values live in `$system-properties`, now extracted into
`uswds-properties-tokens.csv` via `internals/scripts/extract-properties.js`.

`$system-properties` is not uniformly token-shaped. Some entries carry a numeric scale or formula
a themer could plausibly override (`z-index`, `opacity`, `box-shadow`, `order`, `flex`, `gap`,
`letter-spacing`, `line-height`). Others are closed CSS keyword enumerations with no scale to grow
or theme (`cursor: (auto, default, pointer, wait, move, not-allowed)`, `display`, `overflow`,
`float`, `justify-content`, `align-items`, `align-self`, `font-style`, `text-transform`,
`vertical-align`, `white-space`, `font-feature-settings`). Two decisions follow: which entries
become DTCG tokens, and how negative values in the in-scope set are represented.

## Decision drivers

- Curtis's taxonomy (used throughout this inventory) models tokens as scales/roles with values a
  themer might override — not every enumerable CSS keyword needs a token indirection layer
- ADR-0007 already set the precedent for negative values (spacing `neg-*`): resolve to a literal
  with formula provenance, don't invent a parallel naming scheme
- The utility-class generator (not yet migrated) still needs _some_ source for the keyword-enum
  properties; excluding them from the token package must not mean deleting them

## Decision 1: Scope boundary

**In scope (become sibling categories under `tokens/system/` — `z-index`, `opacity`,
`shadow`, `flex`, `gap` — or extend `tokens/system/typography/*` for letter-spacing and
line-height; see ADR-0010):**

`z-index`, `opacity`, `box-shadow`, `order`, `flex`, `flex-direction`, `flex-wrap`, `gap`,
`letter-spacing`, `line-height`.

Rationale per entry: each has a numeric scale (`opacity` 0–100, `z-index` 100–500, `order` 0–11),
a small closed set that themes plausibly override as a whole (`box-shadow` 1–5), or is shared
with the already-in-scope typography tier (`letter-spacing`, `line-height`).

**Out of scope (stay Sass-only, feed the utility generator directly, no token indirection):**

`cursor`, `display`, `overflow`, `float`, `justify-content`, `align-items`, `align-self`,
`font-style`, `text-transform`, `vertical-align`, `white-space`, `font-feature-settings`, and the
remaining `$system-properties` entries that only alias other already-tokenized maps (`background-color`,
`color`, `height`, `width`, `margin`, `padding`, `outline`, `outline-color`, `top`/`right`/`bottom`/`left`,
`breakpoints`, `circle`) — these have no independent scale of their own; they're `map-collect()`
compositions of tokens that are already covered elsewhere in the inventory (colors, spacing).

**Alternative considered — model everything in `$system-properties` as tokens:** rejected. It
would put closed CSS keyword lists (`cursor: pointer`) into the token package with no benefit — no
themer overrides `cursor`'s value set — and would double-count the alias entries (`background-color`
already resolves through the color tier).

## Decision 2: Negative-value representation

Follow the ADR-0007 pattern proposed for spacing: resolve to the literal negative value,
carry provenance in `$extensions.uswds.formula`, no separate `neg-*`-style naming convention
invented for this tier.

```json
"order": {
  "first": { "$value": -1, "$extensions": { "uswds": { "formula": "literal" } } }
},
"z-index": {
  "bottom": { "$value": -100, "$extensions": { "uswds": { "formula": "literal" } } }
},
"letter-spacing": {
  "ls-neg-3": { "$value": "-0.03em", "$extensions": { "uswds": { "formula": "literal" } } }
}
```

- ✅ Consistent with the ADR-0007 spacing precedent — one pattern for negative values across the
  whole token package, not one per category
- ✅ `"formula": "literal"` distinguishes these from computed negatives (spacing's `spacing-multiple(-n)`,
  which keeps its arithmetic formula) without a separate schema field
- ❌ None identified — this is a narrow extension of the ADR-0007 pattern

## Consequences

- `z-index`, `opacity`, `shadow`, `flex`, `gap` become sibling categories under
  `tokens/system/` (ADR-0010) — no separate `utility` tier or category; every entry's
  `$extensions.uswds.tier` is `"system"`
- `tokens/typography/` gains letter-spacing and the per-typeface line-height combinations
  (`sans-1..6`, `serif-1..6`, `mono-1..6`, `cond-1..6`, `heading-1..6`, `ui-1..6`) alongside the
  already-planned type-scale/line-height(1–6)/typefaces
- The out-of-scope keyword-enum properties remain hand-authored in uswds-core's `_properties.scss`
  consumption layer — the token migration does not touch them
- `uswds-properties-tokens.csv`'s `category` column is the enforcement mechanism: any future
  `$system-properties` entry with a `category` that isn't already covered above needs this ADR
  amended before it's added to `tokens/`
