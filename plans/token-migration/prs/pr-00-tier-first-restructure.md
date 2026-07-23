# PR 0: Tier-first directory restructure

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0010
**Prerequisite PRs:** none — this is the foundation; all other Phase 1 PRs depend on it

---

## Concern

Migrate the token source from the current **category-first** layout
(`tokens/{colors,spacing,breakpoints}/*.json`) to the **tier-first** layout
(`tokens/<tier>/<category>/…`) defined in ADR-0010. Update the build config to
match: per-platform `prefix` and per-tier-per-category output files.

`generateTokenName` needs no change. Tier is directory/metadata only
(ADR-0010 Decision 5): each file's JSON content nests directly under its category
key (`color.blue.5`), never under a tier key, so `token.path` never contains a tier
segment to drop — the existing `${prefix}-${token.path.join("-")}` already produces
the correct output names.

No new tokens are added. No token values change. This is purely structural.

---

## Files touched

| Action  | Path                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Move    | `tokens/colors/*.json` → `tokens/system/color/*.json`                                                                           |
| Move    | `tokens/spacing/spacing.json` → `tokens/system/spacing/spacing.json`                                                            |
| Move    | `tokens/breakpoints/breakpoints.json` → `tokens/system/breakpoints/breakpoints.json`                                            |
| Delete  | `tokens/colors/`, `tokens/spacing/`, `tokens/breakpoints/` (now empty)                                                          |
| Modify  | `tokens/index.js` — update group discovery to reflect new paths                                                                 |
| Modify  | `config/style-dictionary.config.js` — per-platform `prefix`, tier-aware file filters, per-tier-per-category output destinations |
| Rebuild | `build/css/`, `build/scss/` — committed output; filenames change to per-tier-per-category (e.g. `build/css/system/color.css`)   |

---

## Implementation steps

1. **Create new directories**

    ```
    tokens/system/color/
    tokens/system/spacing/
    tokens/system/breakpoints/
    ```

2. **Move source files** — git mv each existing JSON file into the new path so history is preserved.

3. **Update `tokens/index.js`** — the file currently lists token groups (used by `makePlatform` in the config to generate output filenames and filters). Replace the flat group list with tier-aware discovery or an explicit manifest that reflects `system/color`, `system/spacing`, `system/breakpoints`.

4. **Update `config/style-dictionary.config.js`**
    - `prefix` moves from the hardcoded global `prefix: "usa"` inside `makePlatform` to a per-platform value (ADR-0010 Decision 5). For Phase 1, both the `css` and `scss-canonical` platforms use `prefix: "usa"`; the `uswds-core` SCSS platform (Phase 4) will use no prefix — leave a comment noting this.
    - `source` glob: `tokens/**/*.json` continues to match; no change needed here.
    - `files` array: update `filter` paths and `destination` paths to reflect `system/<category>` structure (e.g. destination `system/color.css`, filter `tokens/system/color/`).

5. **Run build and commit output**
    ```bash
    npm run build:tokens
    git add build/ tokens/ config/ internals/ && git commit
    ```

---

## Done when

- [ ] `git mv` used for all moved files (history preserved, verify with `git log --follow`)
- [ ] `npm run build:tokens` exits 0
- [ ] `npm test` exits 0 (all existing transform tests pass unchanged — `generateTokenName` is untouched)
- [ ] Output token names in `build/css/system/color.css` are **identical** to pre-restructure names (grep spot-check: `--usa-color-blue-5` still present, value unchanged)
- [ ] No `tokens/colors/`, `tokens/spacing/`, `tokens/breakpoints/` directories remain
- [ ] `build/` output committed alongside source changes
