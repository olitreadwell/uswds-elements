# P1-PR 3: DTCG 2025.10 color-format compliance

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0008
**Prerequisite PRs:** P1-PR 0 (tier-first restructure), P1-PR 1 (vivid naming + alias),
P1-PR 2 (color family completion + `$extensions.uswds` metadata)

---

## Concern

Make the system color sources compliant with the
[DTCG 2025.10 Color module](https://www.designtokens.org/TR/2025.10/color/)
(Final CG Report, 28 October 2025).

Today every color `$value` is a plain string (`"$value": "#b50909"` or
`"$value": "rgba(0,0,0,0.01)"`). Per the spec §4.1, a color token's `$value` **must**
be an object with two required members and two optional members:

```json
{
    "$value": {
        "colorSpace": "srgb",
        "components": [0.7098, 0.0353, 0.0353],
        "hex": "#b50909"
    }
}
```

| Member       | Required | Notes                                                                     |
| ------------ | -------- | ------------------------------------------------------------------------- |
| `colorSpace` | **yes**  | e.g. `"srgb"`                                                             |
| `components` | **yes**  | array of numbers for the named color space; sRGB = `[r, g, b]` in `[0,1]` |
| `alpha`      | no       | number in `[0,1]`; omit for fully-opaque colors (assumed `1`)             |
| `hex`        | no       | **6-digit** CSS hex fallback (`#RRGGBB`); no `$` prefix; no 8-digit form  |

Note: `hex` being optional means the spec does not require it, but USWDS includes it as
the authoritative fallback for tooling that does not resolve `colorSpace`/`components`.

This PR converts every leaf color `$value` in `tokens/colors/*.json` from its current
string form to this required object form. No output values change. No token names change.
P1-PR 2 is a prerequisite so the full color set and `$extensions.uswds` metadata already
exist — this PR is a **single clean format pass**, not a moving target.

### Transparent families

`black-transparent` and `white-transparent` are authored today as
`rgba(0,0,0,0.01)` … `rgba(255,255,255,0.9)`. These families **must continue to emit
exactly those `rgba(...)` strings** in the built CSS/SCSS.

For these, the spec's optional `alpha` member carries the exact decimal value, and
`hex` is the 6-digit opaque form:

```json
"10": {
  "$value": {
    "colorSpace": "srgb",
    "components": [0, 0, 0],
    "alpha": 0.1,
    "hex": "#000000"
  }
}
```

The `alpha` value is taken verbatim from the `rgba()` source string (e.g. `0.1`) — exact
by construction, no hex8 round-trip drift. The spec's `hex` must be 6-digit specifically
to avoid conflict with the separate `alpha` member, which is why 8-digit hex is not used.

## Out of scope

- **`$colorSpace` / `$components` enrichment beyond sRGB** — optional; sRGB is the
  compliance baseline for all current USWDS palette tokens.
- Any `theme/color` / `state/color` alias tokens — those carry DTCG alias references,
  not literal color values, and are unaffected by this format change.

---

## Implementation steps

### Step 1 — Write `internals/scripts/expand-color-format.js` (transformer)

A committed codemod-style script that reads each `tokens/colors/*.json` file, rewrites
every leaf color `$value` in place to the required DTCG object form, and writes the file
back. It is idempotent (safe to re-run) and leaves the existing JSON structure and key
order intact (values-only rewrite). Running it once and committing the result makes the
sources compliant at rest and produces a clean git-diff audit trail.

**Add to `package.json`:**

```json
"expand:colors": "node internals/scripts/expand-color-format.js"
```

**Pure converter functions (the auditable core):**

```js
/**
 * Convert a 6-digit hex string to a DTCG sRGB color object.
 * Components are rounded to 4 decimal places — the minimum precision
 * that guarantees round(component * 255) === original byte for all 256
 * possible byte values (proven by the exhaustive unit test).
 *
 * @param {string} hex — "#RRGGBB"
 * @returns {{ colorSpace: "srgb", components: number[], hex: string }}
 */
export function hexToSrgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return {
        colorSpace: "srgb",
        components: [
            Math.round((r / 255) * 10000) / 10000,
            Math.round((g / 255) * 10000) / 10000,
            Math.round((b / 255) * 10000) / 10000,
        ],
        hex,
    };
}

/**
 * Convert an rgba() string to a DTCG sRGB color object.
 * Alpha is taken verbatim from the source string (exact decimal, no round-trip).
 * hex is the 6-digit opaque form (#RRGGBB) — 6 digits per spec requirement.
 *
 * @param {string} rgba — "rgba(r,g,b,a)" where r,g,b are 0-255 integers
 * @returns {{ colorSpace: "srgb", components: number[], alpha: number, hex: string }}
 */
export function rgbaToSrgb(rgba) {
    const [r, g, b, a] = rgba.match(/[\d.]+/g).map(Number);
    const toHex = (n) => Math.round(n).toString(16).padStart(2, "0");
    return {
        colorSpace: "srgb",
        components: [
            Math.round((r / 255) * 10000) / 10000,
            Math.round((g / 255) * 10000) / 10000,
            Math.round((b / 255) * 10000) / 10000,
        ],
        alpha: a,
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
    };
}
```

**File walker logic (pseudocode):**

```
for each file in tokens/colors/*.json:
  parse JSON
  walk every leaf node under a $type:"color" group
  if leaf.$value is a string starting with "#":
    leaf.$value = hexToSrgb(leaf.$value)
  else if leaf.$value is a string starting with "rgba":
    leaf.$value = rgbaToSrgb(leaf.$value)
  else if leaf.$value is already an object with colorSpace + components:
    skip (idempotent)
  write file back with 2-space indentation, trailing newline
```

### Step 2 — Unit tests (`internals/scripts/expand-color-format.test.ts`)

These tests are the **audit trail** for the conversion: they prove the math is correct,
the precision guarantee holds for every possible byte value, and the transformer is safe
to re-run.

Required test cases:

1. **`hexToSrgb` spot values** — assert exact expected object for a representative set:
    - `"#d83933"` → `{ colorSpace:"srgb", components:[0.8471, 0.2235, 0.2], hex:"#d83933" }`
    - `"#000000"` → `{ colorSpace:"srgb", components:[0, 0, 0], hex:"#000000" }`
    - `"#ffffff"` → `{ colorSpace:"srgb", components:[1, 1, 1], hex:"#ffffff" }`
    - Spot check a mid-range color with non-trivial component values

2. **Exhaustive round-trip** — for every integer byte value 0–255:

    ```ts
    for (let byte = 0; byte <= 255; byte++) {
        const hex = `#${byte.toString(16).padStart(2, "0").repeat(3)}`;
        const {
            components: [c],
        } = hexToSrgb(hex);
        expect(Math.round(c * 255)).toBe(byte);
    }
    ```

    This proves P=4 decimal places is sufficient for exact byte round-trip for all 256
    values and makes the precision choice auditable and regression-proof.

3. **`rgbaToSrgb` exact alpha** — assert verbatim alpha preservation:
    - `rgbaToSrgb("rgba(0,0,0,0.01)")` → `{ colorSpace:"srgb", components:[0,0,0], alpha:0.01, hex:"#000000" }`
    - `rgbaToSrgb("rgba(255,255,255,0.9)")` → `{ colorSpace:"srgb", components:[1,1,1], alpha:0.9, hex:"#ffffff" }`
    - Specifically assert `alpha === 0.01` (not `0.0118` or any other hex8-recovered value)

4. **Opaque colors have no `alpha` key** — `"alpha" in hexToSrgb("#d83933")` is `false`

5. **Idempotence** — transformer applied twice yields the same object as applied once:

    ```ts
    const once = hexToSrgb("#b50909");
    const twice = expandValue(expandValue("#b50909"));
    expect(twice).toEqual(once);
    ```

6. **Non-color tokens untouched** — a dimension token's `$value` passes through unchanged
   (regression guard for the file-walker branch logic)

### Step 3 — Run the transformer and commit

```bash
node internals/scripts/expand-color-format.js
```

Commit all modified `tokens/colors/*.json` files. The git diff is the audit trail: every
changed `$value` line in the diff shows the source-to-expanded conversion for review.

### Step 4 — Update the value output transform

In `internals/token-helpers/index.ts`, extend `getTokenValueWithUnit` with a color branch
so CSS/SCSS output emits the right format from the new object shape:

```ts
export const getTokenValueWithUnit = (token: TransformedToken) => {
    if (token.$type === "dimension" && typeof token.$value === "object") {
        return token.$value.value + (token.$value.unit || "");
    }
    if (token.$type === "color" && typeof token.$value === "object") {
        if (token.$value.alpha !== undefined && token.$value.alpha < 1) {
            // Transparent family: reconstruct exact rgba() from components + alpha
            const [r, g, b] = token.$value.components.map((c: number) =>
                Math.round(c * 255),
            );
            return `rgba(${r},${g},${b},${token.$value.alpha})`;
        }
        // Standard family: emit hex fallback
        return token.$value.hex;
    }
    return token.$value;
};
```

Add unit tests in `internals/token-helpers/index.test.ts`:

- Standard color object → `"#d83933"`
- Transparent color object (alpha 0.01) → `"rgba(0,0,0,0.01)"` (exact alpha, not `0.0118`)
- Transparent color object (alpha 0.9) → `"rgba(255,255,255,0.9)"`
- Dimension object → unchanged (regression guard)

### Step 5 — Verify the P1-PR 1 vivid-alias custom format

P1-PR 1's `css/variables-with-vivid-alias` / `scss/variables-with-vivid-alias` formats
iterate `dictionary.allTokens` and emit the value. Confirm they read the **post-transform**
value (`token.value`), not the raw `$value` object — otherwise every color emits
`[object Object]` from that format path. Fix to read `token.value` if needed.

### Step 6 — Update `reconcile-colors.js` to validate built hex

Update `internals/scripts/reconcile-colors.js` (from P1-PR 2) to reconcile CSV values
against the **built output** (`build/css/system/color.css` / flat hex), not the source
JSON `$value`. This makes reconcile format-agnostic: it validates the actual emitted hex
and is unaffected by the source `$value` becoming an object.

The two transparent families are absent from `uswds-system-tokens.csv`, so reconcile does
not cover them. Use the standalone gate below for those.

### Step 7 — Build and commit output

```bash
node internals/scripts/expand-color-format.js
npm run build:tokens
node internals/scripts/reconcile-colors.js
npm test
```

Commit source + rebuilt `build/css/system/color.css` + `build/scss/system/_color.scss`.

---

## Done when

- [ ] `internals/scripts/expand-color-format.js` implemented and `"expand:colors"` script added
- [ ] `internals/scripts/expand-color-format.test.ts` passes — all 6 test groups above, including the exhaustive 256-byte round-trip
- [ ] Every leaf `$value` in `tokens/colors/*.json` is an object with required `colorSpace` + `components` members (no bare-string color values remain)
- [ ] Opaque tokens have **no** `alpha` key; transparent tokens carry the exact source `alpha` decimal
- [ ] `hex` member is always 6 digits (`#RRGGBB`) — no 8-digit hex anywhere in sources
- [ ] `npm run build:tokens` exits 0
- [ ] `npm test` exits 0 (transformer tests + output-transform tests + existing tests)
- [ ] **Standard families:** built hex in both `build/css/system/color.css` and `build/scss/system/_color.scss` is byte-identical to pre-conversion (spot-check `--usa-color-red-50: #d83933;` / `$usa-color-red-50: #d83933;`)
- [ ] **Transparent-family standalone gate:** capture the 20 `rgba(...)` lines (both files) _before_ conversion; assert byte-identical _after_ — this is the safety net for exact-alpha behavior
- [ ] P1-PR 1 vivid-alias custom format verified to emit transformed values (no `[object Object]` in output)
- [ ] `node internals/scripts/reconcile-colors.js` exits 0, validating against **built** hex
- [ ] `build/` output committed alongside source changes
