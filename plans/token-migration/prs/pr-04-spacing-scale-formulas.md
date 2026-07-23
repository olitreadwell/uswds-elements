# PR 4: Spacing scale + formula provenance

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0007, ADR-0010
**Prerequisite PRs:** PR 0 (tier-first restructure)

---

## Concern

Expand `tokens/system/spacing/spacing.json` from its current partial set (multiples
`05–6` only) to the **full computed USWDS spacing scale**, and annotate every computed
entry with `$extensions.uswds.formula` for CI drift-guard recomputation (ADR-0007).

The full scale covers:

- **Multiples**: `05`, `1`, `105`, `2`, `205`, `3`, `4`, `5`, `6`, `7`, `8`, `9`,
  `10`, `15` (computed as `grid-base × n`, where grid-base = `8px` = `0.5rem`)
- **Named aliases**: `card` (2rem), `card-lg` (3rem), `mobile` (20rem), `mobile-lg`
  (30rem), `tablet` (40rem), `tablet-lg` (55rem), `desktop` (64rem),
  `desktop-lg` (75rem), `widescreen` (160rem)
- **Negatives** (`neg-*`): negative forms of multiples 05–15 and `1px`/`2px`
- **Pixel literals**: `1px`, `2px` (not formula-derived; `0` and `auto` are not tokens
  — they are CSS keywords)

All current entries in `spacing.json` gain `$extensions.uswds.formula` retroactively.
A new CI validation script recomputes and verifies formula-tagged values against the
8px grid constant.

---

## Files touched

| Action  | Path                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| Modify  | `tokens/system/spacing/spacing.json` — full scale, negatives, named, formulas |
| New     | `internals/scripts/validate-spacing-formulas.js` — recompute + diff CI script |
| Modify  | `package.json` — add `"validate:spacing"` script                              |
| Rebuild | `build/css/system/spacing.css`, `build/scss/system/_spacing.scss`             |

---

## Implementation steps

1. **Extend `tokens/system/spacing/spacing.json`**

    Full scale structure (excerpt — all entries follow this pattern):

    ```json
    {
        "spacing": {
            "$type": "dimension",
            "grid-base": {
                "$value": { "value": 0.5, "unit": "rem" },
                "$description": "8px base unit (8px ÷ 16px = 0.5rem). All multiples derive from this.",
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "8px / root-font-size"
                    }
                }
            },
            "05": {
                "$value": { "value": 0.25, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 0.5",
                        "legacyName": {
                            "publicVar": "$system-spacing-small-05",
                            "mapKey": "05"
                        }
                    }
                }
            },
            "1": {
                "$value": { "value": 0.5, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 1",
                        "legacyName": {
                            "publicVar": "$system-spacing-small-1",
                            "mapKey": "1"
                        }
                    }
                }
            },
            "neg-05": {
                "$value": { "value": -0.25, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * -0.5",
                        "legacyName": {
                            "publicVar": "$system-spacing-small-negative-neg-05"
                        }
                    }
                }
            },
            "1px": {
                "$value": { "value": 1, "unit": "px" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-spacing-smaller-1px"
                        }
                    }
                }
            },
            "card": {
                "$value": "{spacing.2}",
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-spacing-large-card"
                        }
                    }
                }
            }
        }
    }
    ```

    Named spacing tokens (`card`, `card-lg`, `mobile`, etc.) are **aliases** of their
    corresponding multiples (`card` = `{spacing.2}` = 1rem, `card-lg` = `{spacing.3}`,
    etc.) — consistent with plan-01's note that breakpoints are a slice of named spacing.

2. **`validate-spacing-formulas.js`**

    ```js
    // Reads tokens/system/spacing/spacing.json
    // For each entry with $extensions.uswds.formula:
    //   - evaluates "grid-base * N" using a fixed GRID_BASE = 0.5rem
    //   - compares to the token's $value using an epsilon tolerance, NOT strict equality:
    //       const EPSILON = 1e-5;
    //       const isMatch = Math.abs(computed - tokenValue) < EPSILON;
    //     (plain `===` false-fails on IEEE-754 rounding, e.g. 0.5 * 0.5 vs 0.25)
    //   - exits non-zero and prints a diff table on any mismatch
    ```

    Add to `package.json`:

    ```json
    "validate:spacing": "node internals/scripts/validate-spacing-formulas.js"
    ```

3. **Update `config/style-dictionary.config.js`** — ensure `disabled`-filter and
   tier-segment-drop from PR 0 also apply to the spacing platform file.

4. **Run build and validation**
    ```bash
    npm run build:tokens
    node internals/scripts/validate-spacing-formulas.js
    ```

---

## Done when

- [ ] `npm run build:tokens` exits 0
- [ ] `npm test` exits 0
- [ ] `node internals/scripts/validate-spacing-formulas.js` exits 0 (all formula-tagged values match computed values within 1e-5 epsilon tolerance)
- [ ] All 14 positive multiples (`05` through `15`) present in `build/css/system/spacing.css`
- [ ] All negative forms (`neg-05` through `neg-15`, `neg-1px`, `neg-2px`) present in built output
- [ ] All 9 named aliases (`card` through `widescreen`) present in built output
- [ ] `1px` and `2px` literals present; `0` and `auto` are absent (CSS keywords, not tokens)
- [ ] Every computed token has `$extensions.uswds.formula` set
- [ ] `build/` output committed alongside source changes
