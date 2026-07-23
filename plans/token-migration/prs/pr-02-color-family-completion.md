# PR 2: Color family completion

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0002 (Amended), ADR-0008
**Prerequisite PRs:** PR 0 (tier-first restructure), PR 1 (vivid naming + alias)

---

## Concern

Bring the color family sources to **full coverage** of the USWDS system tier as
inventoried in `uswds-system-tokens.csv`. The current `tokens/system/color/` files
(post-PR-0 move) already cover all 25 named families plus `black-transparent` and
`white-transparent` — but vivid alias metadata (`$extensions.uswds.legacyName`) added
in PR 1 touches only families with vivid grades. This PR:

1. Adds `$extensions.uswds` metadata (`tier`, `legacyName`) to **every** token across
   all families — not just vivid ones — completing the `$extensions.uswds` annotation
   pass started in PR 1.
2. Confirms **gray grades 1–4** are present (they already are: `gray.json`, `gray-cool.json`,
   `gray-warm.json` include grades 1–4; this PR verifies and commits the reconciliation evidence).
3. Confirms **`-90v` vivid slots are absent** per ADR-0008 (nonexistent in USWDS core; the
   `-90v` shortcodes in `uswds-system-tokens.csv` resolve to `false` sentinels — they are
   omitted entirely, matching ADR-0008 Role 1: they are not tokens, so a map lookup on them
   should simply miss, the same way uswds-core's own `$system-color-shortcodes` map lacks
   these keys).
4. Gives `internals/scripts/reconcile-colors.js` an explicit skip-list of the 25 entries in
   `uswds-system-tokens.csv` that are shortcodes resolving to `false` (the `-90v` family), so
   the reconciliation script knows these CSV rows are expected to have **no** corresponding
   built token, instead of expecting JSON to carry a disabled placeholder for them.

No new token values are added. No names change.

---

## Files touched

| Action  | Path                                                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modify  | `tokens/system/color/*.json` — add `$extensions.uswds` block (`tier: "system"`, `legacyName: {...}`) to every existing token entry (nonexistent `-90v` grades get no entry at all) |
| New     | `internals/scripts/reconcile-colors.js` — CSV reconciliation script (name→value equality check)                                                                                    |
| Modify  | `package.json` — add `"reconcile:colors"` script                                                                                                                                   |
| Rebuild | `build/css/system/color.css`, `build/scss/system/_color.scss`                                                                                                                      |

---

## Implementation steps

1. **Add `$extensions.uswds` to every token**

    For each family file, add metadata under `$extensions.uswds`. Example for a
    standard (non-vivid) grade in `tokens/system/color/blue.json`:

    ```json
    "10": {
      "$value": "#d9e8f6",
      "$extensions": {
        "uswds": {
          "tier": "system",
          "legacyName": {
            "shortcode": "blue-10",
            "privateVar": "$color-blue-10",
            "publicVar": "$blue-10"
          }
        }
      }
    }
    ```

    For `black-transparent` and `white-transparent` (present in tokens, absent from
    `uswds-system-tokens.csv`'s `$system-color-*` rows), note in `$description` that
    these are USWDS global palette entries without a `$system-color-*` shortcode.

2. **Omit `-90v` slots entirely; give the reconciliation script an explicit skip-list**

    For each family that has a `-90v` entry in the CSV resolving to `false` (red,
    red-cool, red-warm, orange-warm, orange, gold, yellow, green-warm, green,
    green-cool, and others per CSV), add **no JSON entry at all** — per ADR-0008
    Role 1, these are not tokens, so e.g. `tokens/system/color/red.json`'s `vivid`
    group simply has no `"90"` key, exactly matching uswds-core's own map.

    `internals/scripts/reconcile-colors.js` (step 3) carries the exception list
    directly by reading the CSV's own `false` value per row, so it knows which CSV
    rows are expected to have **no** corresponding built token — no placeholder JSON
    entry is needed to make the script's job possible.

3. **Write `internals/scripts/reconcile-colors.js`**

    This script:
    - Parses `plans/token-migration/uswds-system-tokens.csv`
    - Walks `tokens/system/color/**/*.json` (post-build Style Dictionary flat output)
    - For every CSV row whose value is **not** `false`: asserts a matching token
      exists in the built output and the value matches.
    - For every CSV row whose value **is** `false` (the `-90v` family, ADR-0008
      Role 1): asserts **no** corresponding token exists in the built output — a
      present token here is itself a reconciliation failure, since these were never
      meant to be tokens.
    - Exits non-zero and prints a diff table on mismatch.

    Add to `package.json`:

    ```json
    "reconcile:colors": "node internals/scripts/reconcile-colors.js"
    ```

4. **Run build and reconciliation**
    ```bash
    npm run build:tokens
    node internals/scripts/reconcile-colors.js
    ```

---

## Done when

- [ ] `npm run build:tokens` exits 0
- [ ] `npm test` exits 0
- [ ] `node internals/scripts/reconcile-colors.js` exits 0 (all non-disabled CSV rows matched, all disabled rows accounted for)
- [ ] Every token in `tokens/system/color/*.json` has `$extensions.uswds.tier` set to `"system"`
- [ ] Every non-vivid token has `legacyName` populated (spot-check: `blue.10`, `gray.5`, `gray-cool.1`)
- [ ] No `-90v` keys appear anywhere in `tokens/system/color/*.json` or `build/css/system/color.css` — omitted entirely, not filtered
- [ ] Reconciliation count: CSV rows whose value is not `false` = built output token count; `false`-valued CSV rows have no corresponding built token
- [ ] `build/` output committed alongside source changes
