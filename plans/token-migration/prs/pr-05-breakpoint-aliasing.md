# PR 5: Breakpoint aliasing

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0010
**Prerequisite PRs:** PR 0 (tier-first restructure), PR 3 (spacing scale — breakpoints alias into named spacing)

---

## Concern

Re-express `tokens/system/breakpoints/breakpoints.json` (post-PR-0 move) as **aliases
of the named spacing tokens** defined in PR 3, rather than hardcoded dimension values.

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

2. **Verify alias resolution** — after `npm run build:tokens`, spot-check that
   `--usa-breakpoint-tablet` in the built CSS output resolves to the same value as
   `--usa-spacing-tablet` (`40rem`). Both must be present and equal.

3. **Run build**
    ```bash
    npm run build:tokens
    ```

---

## Done when

- [ ] `npm run build:tokens` exits 0 (Style Dictionary resolves all `{spacing.*}` aliases without errors)
- [ ] `npm test` exits 0
- [ ] All 9 breakpoint tokens present in `build/css/system/breakpoints.css` with the same resolved values as before this PR
- [ ] `--usa-breakpoint-tablet` value equals `--usa-spacing-tablet` value in built output (`40rem`)
- [ ] No hardcoded dimension literals remain in `tokens/system/breakpoints/breakpoints.json`
- [ ] `build/` output committed alongside source changes
