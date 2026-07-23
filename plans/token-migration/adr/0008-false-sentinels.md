# ADR-0008: Representing `false` sentinels and disabled token slots

**Status:** Proposed
**Date:** 2026-07-02
**Related:** ADR-0005, ADR-0003

## Context

USWDS uses the Sass value `false` as a sentinel in three distinct roles:

1. **Permanently nonexistent primitives** — the **standard `-90` grade** is `false` in 22
   color families (e.g. `90: false` in `_blue.scss`'s top-level map; `$system-color-blue-90:
false`). These are not missing by accident — USWDS simply does not define a `-90` shade
   for most families. Separately, the `vivid` submap within each family also lacks a `90`
   key (vivid-90 does not exist as a slot at all, rather than being explicitly `false`).
   `set-theme-color()` errors with "USWDS does not include -90v color tokens" for the vivid
   case; map lookup on the standard `-90` returns `false`, which `color()` also rejects.
2. **Disabled semantic slots a theme may enable** — `$theme-color-primary-lightest: false`, `$theme-color-secondary-darkest: false` (`settings/_settings-color.scss`); resolving one via `color()` errors until a theme sets it
3. **Disabled typography features** — `$theme-font-weight-thin: false`, per-weight font `src` slots like `100: false` (weight not shipped)

The inventory contains ~60 `false`-valued system rows and a similar pattern across settings. DTCG
has no boolean-off convention; a decision is needed on how these slots appear in JSON and in each
output format.

## Decision drivers

- The USWDS-core-shaped SCSS (ADR-0005) must still emit literal `false` where uswds-core's functions expect it — the error behaviors are part of the public contract
- CSS output must _not_ contain junk like `--usa-color-primary-lightest: false`
- Tooling (docs, theme builders) benefits from seeing that a slot _exists but is off_ — that's different from a slot that never existed

## Alternatives considered

### (a) Omit disabled tokens from JSON entirely

- ✅ Cleanest schema; nothing to filter in outputs
- ❌ The ADR-0005 formats could not emit the `false` entries uswds-core expects without a hardcoded exception list
- ❌ Theme tooling can't distinguish "USWDS chose not to fill this slot" from "this slot is not a thing"

### (b) Include with a null-like `$value`

- ❌ DTCG requires `$value` to match `$type`; `null` values fail validators and break Style Dictionary resolution for anything aliasing the token

### (c) Include with `$extensions.uswds.disabled: true` and no `$value` output — **recommended for role 2/3**

```json
"lightest": {
  "$type": "color",
  "$value": "#00000000",
  "$extensions": { "uswds": { "disabled": true } }
}
```

(The placeholder `$value` satisfies schema/tooling; it is never emitted.) Filters exclude disabled
tokens from CSS/SCSS variable output; the ADR-0005 settings format emits
`$theme-color-primary-lightest: false !default;` for them.

- ✅ Slot visible to tooling and to the compat formats; single source drives both behaviors
- ✅ A theme (or dark-mode work per ADR-0003) can later enable the slot by replacing the placeholder — a value change, not a schema change
- ❌ Requires a documented placeholder convention and a filter every output platform must apply

## Decision

Split by role:

- **Role 1 (nonexistent primitives — the 22 standard `-90` grades and the absent vivid-90 slots): alternative (a) — omit.** They are not tokens; the compat format hardcodes nothing (uswds-core's own map lookup for a `-90` grade returns `false`, and the generated `$system-color-shortcodes` simply lacks the corresponding keys, matching lookup-failure behavior). Note: the CSV (`uswds-system-tokens.csv`) carries two distinct snapshot rows for several token names — e.g. `$system-color-blue-90` appears once with `#11181d` (the real grade value in the standard color map) and once with `false` (the standard-90 sentinel). The CSV de-duplication issue is a tracked prerequisite of PR 2 (see PR 2 for details); the reconciliation script must key on `(name, source-file, scale)` to resolve the ambiguity.
- **Roles 2–3 (disabled semantic/typography slots): alternative (c) — include, flagged disabled.** CSS/SCSS variable outputs filter them; the generated `_settings-*.scss` emits `false`.

## Consequences

- Every output platform gains a shared `filter` that drops `$extensions.uswds.disabled` tokens
- Docs generation can render disabled slots as "available for theming, off by default"
- One deviation from current uswds-core internals: the generated standard color maps omit the `90: false` keys (Role 1) instead of carrying them. `map-deep-get` returns `null` rather than `false` for missing keys, and `get-system-color()` passes that through, so `color()`'s not-a-token error still fires; the round-trip compile-and-diff in ADR-0005 verifies no behavioral difference. If a difference surfaces, the map format adds the literal `false` entries back for standard-90 slots only.

## DTCG 2025.10 Color module — required object shape

Color tokens in PR 1 and PR 2 (this ADR) are authored today as plain hex strings
(`"$value": "#eff6fb"`). The **DTCG 2025.10 Color module** (Final CG Report, 28 October 2025) specifies the following object shape for a color token's `$value`:

```json
{
    "$value": {
        "colorSpace": "srgb",
        "components": [0.937, 0.965, 0.984],
        "hex": "#eff6fb"
    }
}
```

**Required members** (per §4.1):

- `colorSpace` — string naming the color space (e.g. `"srgb"`)
- `components` — array of numeric components for that color space (sRGB: `[r, g, b]` each in `[0, 1]`)

**Optional members:**

- `alpha` — number in `[0, 1]`; omit for fully-opaque colors (assumed `1` when absent)
- `hex` — **6-digit** CSS hex fallback (`#RRGGBB`); note: no `$` prefix; must be 6 digits
  (the spec prohibits 8-digit hex here specifically to avoid conflicting with `alpha`)

The sources are made compliant _at rest_ in [PR 3](../prs/pr-03-dtcg-color-format.md)
via a committed transformer script (`internals/scripts/expand-color-format.js`) that
deterministically rewrites every leaf color `$value` in `tokens/colors/*.json` from its
current string form into the required object form. The transformer is idempotent and
covered by an exhaustive unit test suite. Running it and committing the result is the
single required action to make sources compliant; no hand-authoring of `components`
arrays is needed. See PR 3 for the full transformer specification.

**Transparent families (`black-transparent`, `white-transparent`):** these are currently
authored as `rgba(0,0,0,0.1)` etc. The transformer parses `rgba(r,g,b,a)` and produces:

```json
{
    "$value": {
        "colorSpace": "srgb",
        "components": [0, 0, 0],
        "alpha": 0.01,
        "hex": "#000000"
    }
}
```

The `alpha` value is taken verbatim from the `rgba()` source string (exact decimal, no
hex8 round-trip). The output value transform in `internals/token-helpers/index.ts`
renders tokens with `alpha < 1` back to `rgba(r,g,b,alpha)` strings in the built
CSS/SCSS, reconstructing the original representation exactly.

**What remains optional:** `$colorSpace` / `$components` enrichment beyond sRGB (e.g.
OKLCH for color-space-aware tooling) is a possible future add. sRGB + `hex` fallback is
the compliance baseline for all current USWDS palette tokens.
