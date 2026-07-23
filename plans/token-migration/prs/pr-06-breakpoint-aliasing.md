# PR 6: Breakpoint aliasing

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0010
**Prerequisite PRs:** P1-PR 0 (tier-first restructure), P1-PR 4 (spacing scale — breakpoints alias into named spacing)

---

## Concern

Re-express `tokens/system/breakpoints/breakpoints.json` (post-PR-0 move) as **aliases
of the named spacing tokens** defined in PR 4, rather than hardcoded dimension values.

USWDS core's `$system-breakpoints` is itself a slice of the spacing scale — `mobile`,
`mobile-lg`, `tablet`, `tablet-lg`, `desktop`, `desktop-lg`, `widescreen` are
identical to their spacing counterparts. The `card` and `card-lg` breakpoints are also
present in the spacing named set. Making breakpoints DTCG aliases of spacing tokens
means a single source of truth: updating a named spacing value automatically propagates
to the corresponding breakpoint.

The current `breakpoints.json` hardcodes rem values directly; this PR replaces them
with `{spacing.<name>}` alias references.

---

## Files touched

| Action  | Path                                                                                                                        |
| ------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modify  | `tokens/system/breakpoints/breakpoints.json` — replace literal `$value` objects with DTCG alias references into `spacing.*` |
| Rebuild | `build/css/system/breakpoints.css`, `build/scss/system/_breakpoints.scss`                                                   |

---

## Implementation steps

1. **Replace literal values with aliases** in
   `tokens/system/breakpoints/breakpoints.json`:

    ```json
    {
        "breakpoint": {
            "$type": "dimension",
            "card": {
                "$value": "{spacing.card}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "card-lg": {
                "$value": "{spacing.card-lg}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "mobile": {
                "$value": "{spacing.mobile}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "mobile-lg": {
                "$value": "{spacing.mobile-lg}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "tablet": {
                "$value": "{spacing.tablet}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "tablet-lg": {
                "$value": "{spacing.tablet-lg}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "desktop": {
                "$value": "{spacing.desktop}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "desktop-lg": {
                "$value": "{spacing.desktop-lg}",
                "$extensions": { "uswds": { "tier": "system" } }
            },
            "widescreen": {
                "$value": "{spacing.widescreen}",
                "$extensions": { "uswds": { "tier": "system" } }
            }
        }
    }
    ```

    Note: Style Dictionary resolves DTCG aliases at build time, so the emitted CSS
    values are identical to today's hardcoded values — no output change for consumers.

2. **Verify alias resolution — `{value,unit}` object shape gate**

    P1-PR 4 adds named spacing tokens with `$value: { "value": N, "unit": "rem" }` (the
    DTCG dimension object shape). Before assuming the alias chain works end-to-end, verify
    that Style Dictionary correctly resolves a `{spacing.card}` alias whose target is a
    dimension object — not just a scalar — and that `getTokenValueWithUnit` concatenates
    the resolved `value`+`unit` correctly for the aliased result.

    Steps:
    a. After `npm run build:tokens`, check that `--usa-breakpoint-card` in
    `build/css/system/breakpoints.css` emits `10rem` (not `[object Object]` or a raw
    dimension-object string).
    b. If Style Dictionary does not auto-flatten the aliased dimension object, add a
    transform that does — analogous to the color object handling in P1-PR 3. Record
    the observed SD behavior in the PR description (same discipline as P1-PR 3 Step 0).

3. **Run build**
    ```bash
    npm run build:tokens
    ```

---

## Done when

- [ ] `npm run build:tokens` exits 0 (Style Dictionary resolves all `{spacing.*}` aliases without errors)
- [ ] `npm test` exits 0
- [ ] All 9 breakpoint tokens present in `build/css/system/breakpoints.css` with the same resolved values as before this PR (`card: 10rem`, `card-lg: 15rem`, `mobile: 20rem`, `mobile-lg: 30rem`, `tablet: 40rem`, `tablet-lg: 55rem`, `desktop: 64rem`, `desktop-lg: 75rem`, `widescreen: 87.5rem`)
- [ ] `--usa-breakpoint-tablet` value equals `--usa-spacing-tablet` value in built output (`40rem`)
- [ ] `{value,unit}` alias-resolution check completed — observed SD behavior recorded in PR description; no `[object Object]` in any breakpoint output
- [ ] No hardcoded dimension literals remain in `tokens/system/breakpoints/breakpoints.json`
- [ ] `build/` output committed alongside source changes
