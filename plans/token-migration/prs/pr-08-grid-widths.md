# PR 8: Grid widths

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0009, ADR-0010
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

| Action | Path                                                                 |
| ------ | -------------------------------------------------------------------- |
| New    | `tokens/system/grid/layout-grid-widths.json`                         |
| Modify | `tokens/index.js` — register `system/grid` group                     |
| Modify | `config/style-dictionary.config.js` — add output file for grid group |
| New    | `build/css/system/grid.css`, `build/scss/system/_grid.scss`          |

---

## Implementation steps

1. **`tokens/system/grid/layout-grid-widths.json`**

    Values sourced directly from `uswds-properties-tokens.csv`
    (`$system-layout-grid-widths-1` through `$system-layout-grid-widths-12`):

    ```json
    {
        "layout-grid-widths": {
            "$type": "dimension",
            "1": {
                "$value": { "value": 8.333333333333332, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-1"
                        }
                    }
                }
            },
            "2": {
                "$value": { "value": 16.666666666666664, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-2"
                        }
                    }
                }
            },
            "3": {
                "$value": { "value": 25, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-3"
                        }
                    }
                }
            },
            "4": {
                "$value": { "value": 33.33333333333333, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-4"
                        }
                    }
                }
            },
            "5": {
                "$value": { "value": 41.66666666666667, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-5"
                        }
                    }
                }
            },
            "6": {
                "$value": { "value": 50, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-6"
                        }
                    }
                }
            },
            "7": {
                "$value": { "value": 58.333333333333336, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-7"
                        }
                    }
                }
            },
            "8": {
                "$value": { "value": 66.66666666666666, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-8"
                        }
                    }
                }
            },
            "9": {
                "$value": { "value": 75, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-9"
                        }
                    }
                }
            },
            "10": {
                "$value": { "value": 83.33333333333334, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-10"
                        }
                    }
                }
            },
            "11": {
                "$value": { "value": 91.66666666666666, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-11"
                        }
                    }
                }
            },
            "12": {
                "$value": { "value": 100, "unit": "%" },
                "$extensions": {
                    "uswds": {
                        "tier": "system",
                        "legacyName": {
                            "publicVar": "$system-layout-grid-widths-12"
                        }
                    }
                }
            }
        }
    }
    ```

    Note on `$type`: DTCG does not define a `percentage` type natively, so this group
    uses `$type: "dimension"` with `unit: "%"` instead. This reuses the existing
    `getTokenValueWithUnit` transform in `config/style-dictionary.config.js` as-is — it
    already concatenates `value` + `unit` for any dimension-typed token — so no new
    build logic is required to emit the `%` suffix.

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
- [ ] `$type: "dimension"` + `unit: "%"` confirmed: CSS output emits percentage values with `%` suffix via the existing `getTokenValueWithUnit` transform
- [ ] All 27 color families + spacing + typography + utility + grid groups accounted for — Phase 1 primitive tier is **complete**
- [ ] `build/` output committed alongside source changes

---

## Phase 1 completion gate (run after this PR merges)

With PR 8 merged, run the full Phase 1 verification:

```bash
npm run build:tokens       # full build green
npm run reconcile:colors   # every color CSV row matched or dispositioned
node internals/scripts/validate-spacing-formulas.js  # all spacing formulas correct
npm test                   # all unit tests pass
```

Any failure at this gate is a tracked issue before Phase 2 begins.
