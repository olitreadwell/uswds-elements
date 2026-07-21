# PR 2: Color family completion

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0002 (Amended), ADR-0008 (Accepted)
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
   explicitly omitted with a recorded disposition, not accidentally missing).
4. Records the disposition of the 25 entries in `uswds-system-tokens.csv` that are
   shortcodes resolving to `false` (the `-90v` family) as `$extensions.uswds.disabled: true`
   entries so the CSV reconciliation script can account for them.

No new token values are added. No names change.

---

## Files touched

| Action | Path |
|--------|------|
| Modify | `tokens/system/color/*.json` — add `$extensions.uswds` block (`tier: "system"`, `legacyName: [...]`) to every non-vivid token entry |
| New | `internals/scripts/reconcile-colors.js` — CSV reconciliation script (name→value equality check) |
| Modify | `package.json` — add `"reconcile:colors"` script |
| Rebuild | `build/css/system/color.css`, `build/scss/system/_color.scss` |

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
         "legacyName": ["blue-10", "$color-blue-10", "$blue-10"]
       }
     }
   }
   ```

   For `black-transparent` and `white-transparent` (present in tokens, absent from
   `uswds-system-tokens.csv`'s `$system-color-*` rows), note in `$description` that
   these are USWDS global palette entries without a `$system-color-*` shortcode.

2. **Record `-90v` disabled dispositions**

   For each family that has a `-90v` entry in the CSV resolving to `false` (red,
   red-cool, red-warm, orange-warm, orange, gold, yellow, green-warm, green,
   green-cool, and others per CSV), add a disabled placeholder in the family JSON:

   ```json
   "vivid": {
     "90": {
       "$value": "none",
       "$extensions": {
         "uswds": {
           "tier": "system",
           "disabled": true,
           "legacyName": ["red-90v", "$color-red-90v", "$red-90v"]
         }
       }
     }
   }
   ```

   Style Dictionary's filter in `config/style-dictionary.config.js` must exclude
   tokens where `$extensions.uswds.disabled === true` from all build outputs.

3. **Write `internals/scripts/reconcile-colors.js`**

   This script:
   - Parses `plans/token-migration/uswds-system-tokens.csv`
   - Walks `tokens/system/color/**/*.json` (post-build Style Dictionary flat output)
   - For every non-disabled CSV row: asserts a matching token exists in the built
     output and the value matches.
   - For every `disabled: true` JSON entry: asserts the CSV row is present and the
     default value is `false`.
   - Exits non-zero and prints a diff table on mismatch.

   Add to `package.json`:
   ```json
   "reconcile:colors": "node internals/scripts/reconcile-colors.js"
   ```

4. **Update `config/style-dictionary.config.js`** — add a filter to exclude disabled
   tokens from all output platforms:

   ```js
   filter: (token) =>
     !token.$extensions?.uswds?.disabled &&
     token.filePath?.includes(`tokens/system/color/`),
   ```

5. **Run build and reconciliation**
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
- [ ] No `-90v` values appear in `build/css/system/color.css` (disabled filter confirmed)
- [ ] Reconciliation count: non-excluded CSV color rows = built output token count
- [ ] `build/` output committed alongside source changes
