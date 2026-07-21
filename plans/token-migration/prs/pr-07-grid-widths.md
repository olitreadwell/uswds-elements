# PR 7: Grid widths

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0009 (Accepted), ADR-0010 (Accepted)
**Prerequisite PRs:** PR 0 (tier-first restructure)

---

## Concern

Create `tokens/system/grid/layout-grid-widths.json` covering the **12-column fraction
scale** sourced from `tokens/units/layout-grid-widths.scss` in uswds-core and
inventoried in `uswds-properties-tokens.csv`. This completes the full primitive tier
coverage for Phase 1.

The 12 values are percentage widths representing 1/12 through 12/12 of a container,
used by USWDS's grid utility classes.

---

## Files touched

| Action | Path |
|--------|------|
| New | `tokens/system/grid/layout-grid-widths.json` |
| Modify | `tokens/index.js` — register `system/grid` group |
| Modify | `config/style-dictionary.config.js` — add output file for grid group |
| New | `build/css/system/grid.css`, `build/scss/system/_grid.scss` |

---

## Implementation steps

1. **`tokens/system/grid/layout-grid-widths.json`**

   Values sourced directly from `uswds-properties-tokens.csv`
   (`$system-layout-grid-widths-1` through `$system-layout-grid-widths-12`):

   ```json
   {
     "layout-grid-widths": {
       "$type": "percentage",
       "1":  { "$value": 8.333333333333332,  "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-1"] } } },
       "2":  { "$value": 16.666666666666664, "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-2"] } } },
       "3":  { "$value": 25,                 "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-3"] } } },
       "4":  { "$value": 33.33333333333333,  "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-4"] } } },
       "5":  { "$value": 41.66666666666667,  "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-5"] } } },
       "6":  { "$value": 50,                 "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-6"] } } },
       "7":  { "$value": 58.333333333333336, "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-7"] } } },
       "8":  { "$value": 66.66666666666666,  "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-8"] } } },
       "9":  { "$value": 75,                 "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-9"] } } },
       "10": { "$value": 83.33333333333334,  "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-10"] } } },
       "11": { "$value": 91.66666666666666,  "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-11"] } } },
       "12": { "$value": 100,                "$extensions": { "uswds": { "tier": "system", "legacyName": ["$system-layout-grid-widths-12"] } } }
     }
   }
   ```

   Note on `$type: "percentage"`: DTCG does not define a `percentage` type natively.
   Use `$type: "number"` and record the unit context in `$description` ("percentage of
   container width"), or use `$type: "dimension"` with a `%` unit if Style Dictionary
   handles it. Confirm at build time; use whatever emits the correct `%` suffix in CSS.

2. **Register in `tokens/index.js` and `config/style-dictionary.config.js`** —
   add `system/grid` as a source group, add a platform file entry with destination
   `system/grid.css` / `system/_grid.scss`, filter on `tokens/system/grid/`.

3. **Run build**
   ```bash
   npm run build:tokens
   ```

---

## Done when

- [ ] `npm run build:tokens` exits 0
- [ ] `npm test` exits 0
- [ ] 12 entries (`--usa-layout-grid-widths-1` through `--usa-layout-grid-widths-12`) in `build/css/system/grid.css`
- [ ] Values match `uswds-properties-tokens.csv` exactly (spot-check: `widths-6` = `50%`, `widths-12` = `100%`)
- [ ] `$type` choice confirmed: CSS output emits percentage values with `%` suffix
- [ ] All 27 color families + spacing + typography + utility + grid groups accounted for — Phase 1 primitive tier is **complete**
- [ ] `build/` output committed alongside source changes

---

## Phase 1 completion gate (run after this PR merges)

With PR 7 merged, run the full Phase 1 verification:

```bash
npm run build:tokens       # full build green
npm run reconcile:colors   # every color CSV row matched or dispositioned
node internals/scripts/validate-spacing-formulas.js  # all spacing formulas correct
npm test                   # all unit tests pass
```

Any failure at this gate is a tracked issue before Phase 2 begins.
