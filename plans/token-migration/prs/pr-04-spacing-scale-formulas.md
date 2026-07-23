# PR 4: Spacing scale + formula provenance

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0007, ADR-0010
**Prerequisite PRs:** P1-PR 0 (tier-first restructure)

---

## Concern

Expand `tokens/system/spacing/spacing.json` from its current partial set (multiples
`05–6` only) to the **full computed USWDS spacing scale**, and annotate every computed
entry with `$extensions.uswds.formula` for CI drift-guard recomputation (ADR-0007).

The full scale covers:

- **Multiples**: `05`, `1`, `105`, `2`, `205`, `3`, `4`, `5`, `6`, `7`, `8`, `9`,
  `10`, `15` (computed as `grid-base × m`, where grid-base = `8px` = `0.5rem` and
  `m` is the token's **fractional multiple**, not its key digits — the keys are
  shorthand: `05` → `0.5`, `105` → `1.5`, `205` → `2.5`, `1` → `1`, `2` → `2`, etc.,
  matching USWDS core `spacing-multiple(m)`)
- **Named aliases**: `card` (10rem), `card-lg` (15rem), `mobile` (20rem), `mobile-lg`
  (30rem), `tablet` (40rem), `tablet-lg` (55rem), `desktop` (64rem),
  `desktop-lg` (75rem), `widescreen` (87.5rem)
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
            "105": {
                "$value": { "value": 0.75, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 1.5",
                        "legacyName": {
                            "publicVar": "$system-spacing-small-105",
                            "mapKey": "105"
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
                "$value": { "value": 10, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 20",
                        "legacyName": {
                            "publicVar": "$system-spacing-large-card",
                            "mapKey": "card"
                        }
                    }
                }
            },
            "card-lg": {
                "$value": { "value": 15, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 30",
                        "legacyName": {
                            "publicVar": "$system-spacing-large-card-lg",
                            "mapKey": "card-lg"
                        }
                    }
                }
            },
            "mobile": {
                "$value": { "value": 20, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 40",
                        "legacyName": {
                            "publicVar": "$system-spacing-large-mobile",
                            "mapKey": "mobile"
                        }
                    }
                }
            },
            "mobile-lg": {
                "$value": { "value": 30, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 60",
                        "legacyName": {
                            "publicVar": "$system-spacing-larger-mobile-lg",
                            "mapKey": "mobile-lg"
                        }
                    }
                }
            },
            "tablet": {
                "$value": { "value": 40, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 80",
                        "legacyName": {
                            "publicVar": "$system-spacing-larger-tablet",
                            "mapKey": "tablet"
                        }
                    }
                }
            },
            "tablet-lg": {
                "$value": { "value": 55, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 110",
                        "legacyName": {
                            "publicVar": "$system-spacing-larger-tablet-lg",
                            "mapKey": "tablet-lg"
                        }
                    }
                }
            },
            "desktop": {
                "$value": { "value": 64, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 128",
                        "legacyName": {
                            "publicVar": "$system-spacing-largest-desktop",
                            "mapKey": "desktop"
                        }
                    }
                }
            },
            "desktop-lg": {
                "$value": { "value": 75, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 150",
                        "legacyName": {
                            "publicVar": "$system-spacing-largest-desktop-lg",
                            "mapKey": "desktop-lg"
                        }
                    }
                }
            },
            "widescreen": {
                "$value": { "value": 87.5, "unit": "rem" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "formula": "grid-base * 175",
                        "legacyName": {
                            "publicVar": "$system-spacing-largest-widescreen",
                            "mapKey": "widescreen"
                        }
                    }
                }
            }
        }
    }
    ```

    Named spacing tokens (`card` through `widescreen`) are **literal `spacing-multiple(m)`
    formula entries**, not aliases of the small-scale numeric multiples. Each value equals
    `grid-base × m` = `m × 0.5rem`, matching USWDS core's `spacing.scss` exactly. Note the
    multiplier `m` is the value passed to `spacing-multiple()` in core, which for the
    fractional keys is **not** the key digits — e.g. `105` → `spacing-multiple(1.5)`,
    `205` → `spacing-multiple(2.5)`:

    | token        | `spacing-multiple(m)`   | value   |
    | ------------ | ----------------------- | ------- |
    | `card`       | `spacing-multiple(20)`  | 10rem   |
    | `card-lg`    | `spacing-multiple(30)`  | 15rem   |
    | `mobile`     | `spacing-multiple(40)`  | 20rem   |
    | `mobile-lg`  | `spacing-multiple(60)`  | 30rem   |
    | `tablet`     | `spacing-multiple(80)`  | 40rem   |
    | `tablet-lg`  | `spacing-multiple(110)` | 55rem   |
    | `desktop`    | `spacing-multiple(128)` | 64rem   |
    | `desktop-lg` | `spacing-multiple(150)` | 75rem   |
    | `widescreen` | `spacing-multiple(175)` | 87.5rem |

    These values match the committed `tokens/breakpoints/breakpoints.json` exactly — the
    PR 6 alias gate ("same resolved values as before") will pass. The CI validate-spacing
    script recomputes all `formula`-tagged values from `grid-base = 0.5rem`.

2. **`validate-spacing-formulas.js`**

    ```js
    // Reads tokens/system/spacing/spacing.json
    // For each entry with $extensions.uswds.formula:
    //   - parses the multiplier from the formula STRING ("grid-base * m"),
    //     NOT from the token key — keys like "105"/"205" are shorthand whose
    //     real multiplier is 1.5/2.5, and the correct value lives in the formula
    //   - evaluates "grid-base * m" using a fixed GRID_BASE = 0.5rem
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
