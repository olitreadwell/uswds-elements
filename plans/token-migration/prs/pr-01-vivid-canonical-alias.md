# PR 1: Vivid canonical naming + `60v` legacy alias

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0002 (Amended), ADR-0010
**Prerequisite PRs:** PR 0 (tier-first restructure must be merged first)

---

## Concern

Implement the **inverted** vivid naming convention per the ADR-0002 amendment:

- **`--usa-color-red-vivid-60`** — canonical name; holds the literal value; used in
  documentation, component CSS, and the ADR-0005 SCSS translation layer.
- **`--usa-color-red-60v`** — legacy alias; defined as a `var()` reference to the
  canonical name so the value cannot drift.

The current `generateTokenName` already produces `--usa-color-red-vivid-60` (by joining
path segments). This PR adds the alias emission — a small custom format that appends a
`-{grade}v` alias line for every token whose path contains `vivid`. It also adds the
`$extensions.uswds.legacyName` metadata to vivid token entries recording `60v` as the
legacy USWDS back-map form (per ADR-0010 Decision 3).

No token values change. No existing names are removed.

---

## Files touched

| Action  | Path                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Modify  | `internals/token-helpers/index.ts` — add vivid alias format helper                                                                             |
| Modify  | `config/style-dictionary.config.js` — register new `css/vivid-with-alias` and `scss/vivid-with-alias` formats; wire them to the color platform |
| Modify  | `tokens/system/color/*.json` — add `$extensions.uswds.legacyName` to each vivid token entry                                                    |
| Modify  | `internals/token-helpers/index.test.ts` — unit tests for alias emission                                                                        |
| Rebuild | `build/css/system/color.css`, `build/scss/system/_color.scss`                                                                                  |

---

## Implementation steps

1. **Verify current `generateTokenName` output**

    With path `["color","red","vivid","60"]` (tier already stripped by PR 0), the
    current join produces `usa-color-red-vivid-60`. This is correct — it is now the
    canonical name. No change to `generateTokenName` needed.

2. **Add `$extensions.uswds.legacyName` to vivid tokens**

    For every vivid entry in `tokens/system/color/*.json`, add the `legacyName` list
    recording the USWDS-core forms that map back to this canonical token. Example in
    `tokens/system/color/red.json`:

    ```json
    "vivid": {
      "60": {
        "$value": "#b50909",
        "$extensions": {
          "uswds": {
            "tier": "system",
            "legacyName": ["red-60v", "$color-red-60v", "$red-60v"]
          }
        }
      }
    }
    ```

3. **Implement the alias-emitting format**

    In `internals/token-helpers/index.ts`, export a helper that, given a token whose
    path contains `vivid`, derives the `60v`-style legacy name:

    ```ts
    export const getVividLegacyName = (
        token: TransformedToken,
        prefix: string,
    ): string | null => {
        const vividIdx = token.path.indexOf("vivid");
        if (vividIdx === -1) return null;
        // segments with tier already stripped; path is e.g. ["color","red","vivid","60"]
        const before = token.path.slice(0, vividIdx); // ["color","red"]
        const grade = token.path[vividIdx + 1]; // "60"
        return `${prefix}-${before.join("-")}-${grade}v`; // "usa-color-red-60v"
    };
    ```

4. **Register a custom Style Dictionary format** in `config/style-dictionary.config.js`:

    ```js
    StyleDictionary.registerFormat({
        name: "css/variables-with-vivid-alias",
        format: ({ dictionary, options }) => {
            const lines = [":root {"];
            for (const token of dictionary.allTokens) {
                const canonical = `--${token.name}`;
                lines.push(`  ${canonical}: ${token.$value};`);
                const legacy = getVividLegacyName(
                    token,
                    options.prefix ?? "usa",
                );
                if (legacy) {
                    lines.push(`  --${legacy}: var(${canonical});`);
                }
            }
            lines.push("}");
            return lines.join("\n");
        },
    });
    ```

    Add an equivalent `scss/variables-with-vivid-alias` format that emits `$`-prefixed
    variables.

5. **Wire the format to color platforms** in `config/style-dictionary.config.js` —
   replace `format: "css/variables"` with `format: "css/variables-with-vivid-alias"`
   for the system/color output files only.

6. **Update unit tests** (`internals/token-helpers/index.test.ts`)
    - `getVividLegacyName` with `["color","red","vivid","60"]`, prefix `"usa"` →
      `"usa-color-red-60v"`.
    - `getVividLegacyName` with `["color","blue","vivid","50"]` → `"usa-color-blue-50v"`.
    - `getVividLegacyName` with a non-vivid path (e.g. `["color","blue","5"]`) → `null`.
    - `getVividLegacyName` with a multi-segment family (`["color","blue-warm","vivid","60"]`)
      → `"usa-color-blue-warm-60v"`.

7. **Run build and commit output**

    ```bash
    npm run build:tokens
    ```

    Spot-check `build/css/system/color.css` contains both:

    ```css
    --usa-color-red-vivid-60: #b50909;
    --usa-color-red-60v: var(--usa-color-red-vivid-60);
    ```

---

## Done when

- [ ] `npm run build:tokens` exits 0
- [ ] `npm test` exits 0
- [ ] All 4 `getVividLegacyName` unit test cases pass
- [ ] `build/css/system/color.css` contains both `--usa-color-red-vivid-60` (literal value) and `--usa-color-red-60v` (var reference) for every vivid token
- [ ] `build/scss/system/_color.scss` equivalent: `$usa-color-red-vivid-60` (literal) and `$usa-color-red-60v: $usa-color-red-vivid-60`
- [ ] Every vivid token in `tokens/system/color/*.json` has `$extensions.uswds.legacyName` populated
- [ ] No existing `--usa-color-*-vivid-*` names are removed (additive only)
- [ ] `build/` output committed alongside source changes
