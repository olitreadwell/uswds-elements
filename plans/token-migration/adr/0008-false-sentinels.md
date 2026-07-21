# ADR-0008: Representing `false` sentinels and disabled token slots

**Status:** Proposed
**Date:** 2026-07-02
**Related:** ADR-0005, ADR-0003

## Context

USWDS uses the Sass value `false` as a sentinel in three distinct roles:

1. **Permanently nonexistent primitives** — e.g. `90: false` inside the `vivid` submap of `tokens/color/_blue.scss`; `set-theme-color()` even hard-errors with "USWDS does not include -90v color tokens"
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

- **Role 1 (nonexistent primitives, e.g. `-90v` vivids): alternative (a) — omit.** They are not tokens; the compat format hardcodes nothing (uswds-core's own error in `set-theme-color()` already guards the name space, and the generated `$system-color-shortcodes` simply lacks the keys, matching lookup-failure behavior).
- **Roles 2–3 (disabled semantic/typography slots): alternative (c) — include, flagged disabled.** CSS/SCSS variable outputs filter them; the generated `_settings-*.scss` emits `false`.

## Consequences

- Every output platform gains a shared `filter` that drops `$extensions.uswds.disabled` tokens
- Docs generation can render disabled slots as "available for theming, off by default"
- One deviation from current uswds-core internals: the generated vivid submaps omit `90: false` keys instead of carrying them. `map-deep-get` returns `null` rather than `false` for missing keys, and `get-system-color()` passes that through, so `color()`'s not-a-token error still fires; the round-trip compile-and-diff in ADR-0005 verifies no behavioral difference. If a difference surfaces, the map format adds the literal `false` entries back for vivid-90 slots only.
