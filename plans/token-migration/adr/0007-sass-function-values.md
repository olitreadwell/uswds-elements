# ADR-0007: Handling Sass function-call token values

**Status:** Proposed
**Date:** 2026-07-02
**Related:** ADR-0005, ADR-0006

## Context

Many USWDS token values are not literals but Sass function calls or computed expressions:

- Spacing: `$system-spacing` entries are `spacing-multiple($n)` = `8px × n ÷ 16px × 1rem` (`tokens/units/spacing.scss`); only `1px`, `2px`, `0`, `auto` are literal
- Color scalars: `$color-blue-60v: get-system-color("blue", 60, "vivid")` — map lookups, not values
- Root sizing: `$root-font-size-equiv: if($theme-respect-user-font-size, 16px, $theme-root-font-size)` (`functions/units/_root.scss`) feeds all `px-to-rem()` math
- Font sizing: `font-size()` normalizes the type scale by each typeface's cap-height (`normalize-type-scale()`) — genuine math, not lookup
- Merged maps: `map-collect(...)` expressions

DTCG JSON must hold either resolved values or references — it cannot execute Sass.

## Decision drivers

- The JSON source must be the single source of truth: a consumer reading `colors.json` gets real values without running Sass
- Provenance of computed values (the 8px-grid formula) shouldn't be lost — it's how future tokens get derived consistently
- USWDS core's _consumption_ functions (`color()`, `units()`, `radius()`) are public API and must survive (ADR-0005)

## Alternatives considered

### (a) Pre-evaluate at token-authoring/build time; record formulas as metadata — **recommended**

Function-call values are resolved once into the JSON source. Lookup calls
(`get-system-color(...)`) become DTCG **aliases** (`{color.blue.vivid.60}`); arithmetic
(`spacing-multiple(2.5)`) becomes the resolved dimension with the formula kept in extensions:

```json
"205": {
  "$value": { "value": 1.25, "unit": "rem" },
  "$extensions": { "uswds": { "formula": "grid-base * 2.5" } }
}
```

- ✅ JSON is self-contained; every downstream format (CSS, SCSS, JSON, JS) gets concrete values
- ✅ Lookup-style calls map 1:1 onto DTCG aliasing — most "functions" in the inventory are lookups
- ✅ Formula metadata preserves the 8px-grid provenance and lets a validation script recompute/verify values in CI
- ❌ Changing the grid base would require regenerating spacing values (script-assisted, guarded by the CI recompute check)

### (b) Model formulas as DTCG aliases + math transforms — rejected

Store `"$value": "{spacing.grid-base} * 2.5"` and evaluate in Style Dictionary transforms.

- ✅ Formula stays executable; grid-base changes propagate automatically
- ❌ DTCG has no standard expression syntax; every consumer of the raw JSON (design tools, other pipelines) would need our evaluator
- ❌ Cannot express the conditional (`if($theme-respect-user-font-size, …)`) or cap-height cases anyway — would split token values across two mechanisms

### (c) Keep computed values in Sass only — rejected

- ✅ Zero migration effort for computed tokens
- ❌ Splits the source of truth: CSS custom properties and the npm JSON would lack spacing/type values, defeating the goal

## Recommendation

**(a)**, with a clear boundary: **functions are API, not token storage.**

- _Values_ (what a token equals) are pre-evaluated into DTCG source
- _Lookups_ (`color("primary")`, `units(2)`) remain USWDS core's Sass API, fed by the generated maps of ADR-0005 — unchanged behavior
- _Genuine runtime math_ stays where it runs: the cap-height `font-size()` normalization remains a Sass concern initially; its **inputs** (type-scale px values, per-typeface cap-heights) become tokens. Root-size conditionals remain settings logic in generated `_settings-*.scss`.
- A CI script recomputes formula-tagged values from `$extensions.uswds.formula` and fails on mismatch (drift guard)

## Consequences

- The spacing JSON grows to cover the full computed scale (multiples, named, negative) with formulas attached
- `tokens/system/spacing/spacing.json`'s existing entries gain `$extensions.uswds.formula` retroactively (pre-P1-PR0 path: `tokens/spacing/spacing.json`)
- Anyone adding a spacing token must supply grid-consistent values (enforced by the recompute check rather than by running Sass)
- If USWDS ever changes the 8px grid or root-size policy, the token package regenerates values in one scripted pass — an accepted, explicit event rather than an implicit cascade
