# PR 3: DTCG 2025.10 color-format compliance

**Phase:** 1 — Complete the primitive tier
**Related ADRs:** ADR-0008
**Prerequisite PRs:** PR 0 (tier-first restructure), PR 1 (vivid naming + alias), PR 2 (color family completion + `$extensions.uswds` metadata)

---

## Concern

Make the system color sources compliant with the
[DTCG 2025.10 Color module](https://www.designtokens.org/tr/2025.10/color/).
Today every color `$value` is a plain string (`"$value": "#b50909"` or
`"$value": "rgba(0,0,0,0.01)"`). The DTCG Color module requires a color token's
`$value` to be an **object** whose only required member is `$hex` (a hex
triplet/quartet, e.g. `#RRGGBB` or `#RRGGBBAA`); `$colorSpace` is **optional**.

This PR converts every token in `tokens/system/color/*.json` from a string value
to the required `{ "$hex": … }` object form. With `$hex` present, the tokens are
**fully DTCG-compliant** — `$colorSpace` / `$components` (srgb) is an _optional
enrichment_, not a compliance gap, and is deliberately kept out of this PR (see
"Out of scope" below). It resolves the "Deferred: DTCG structured color objects"
note in ADR-0008 for the required-support baseline.

PR 2 is a prerequisite so the full color set and the `$extensions.uswds` metadata
already exist: this PR is a **single clean format pass**, not a moving target that
gets re-touched when later color work lands.

No output values change. No token names change.

### Transparent families keep `rgba()` output

`black-transparent` and `white-transparent` are authored today as
`rgba(0,0,0,0.01)` … `rgba(255,255,255,0.9)` and **must continue to emit exactly
those `rgba(...)` strings** in the built CSS/SCSS. DTCG's `$hex` cannot hold an
`rgba()` string, so:

- The **source** `$hex` becomes an 8-digit hex (`#RRGGBBAA`) — spec-compliant.
- The **output** is rendered back to the original `rgba(...)` by the value
  transform, driven by an `$extensions.uswds` output-format hint.
- **The exact decimal alpha is stored in the metadata**, not recovered from the
  hex8. A naive `alpha = parseInt(aa, 16) / 255` round-trip drifts every value
  (`0.01` → `0x03` → `0.0118`; `0.1` → `0x1a` → `0.102`). Reading the exact alpha
  from metadata makes the emitted `rgba()` alpha exact **by construction** — no
  lookup table, no lossy reversal.

## Out of scope

- **`$colorSpace` / `$components` (srgb).** Optional under the spec; the tokens are
  already compliant with `$hex` alone. Adding structured color-space components is
  a possible future enrichment for color-space-aware tooling, tracked separately —
  it is **not** a deferred compliance requirement.
- Any `theme/color` / `state/color` (alias) tokens — those carry DTCG aliases, not
  literal color values, and are unaffected by this format change.

---

## Implementation steps

### Step 0 — Empirical Style Dictionary behavior check (gate for the rest)

**Do this before writing the transform.** Style Dictionary v5 has built-in DTCG
support and may already flatten `{ "$hex": "#…" }` to a hex string on its own. Do
not assume — verify:

1. Convert **one** family file (e.g. `tokens/system/color/red.json`) to the
   `{ "$hex": … }` form.
2. Run `npm run build:tokens` and inspect `build/css/system/color.css` +
   `build/scss/system/_color.scss` for the converted family.
3. Record the observed output in the PR description:
    - If SD already emits `--usa-color-red-50: #d83933;` unchanged → the standard
      families need **no** transform work; only the transparent-family `rgba()`
      path is new.
    - If SD emits `[object Object]` or the raw object → the value transform must
      extract `$hex`.

Write the transform to **extend** SD's actual behavior, not duplicate a built-in.

### Step 1 — Convert standard family sources

For every non-transparent family file, replace each string `$value` with an object:

```json
"50": {
  "$value": { "$hex": "#d83933" },
  "$extensions": { "uswds": { "tier": "system", "legacyName": { … } } }
}
```

The `$extensions.uswds` block from PR 1/PR 2 is preserved as-is.

### Step 2 — Convert transparent family sources + add rgba output hint

For `black-transparent.json` and `white-transparent.json`, set `$hex` to the hex8
equivalent and record the **exact** output alpha and format in metadata. Example
(`black-transparent.json`, grade `10`):

```json
"10": {
  "$value": { "$hex": "#0000001a" },
  "$extensions": {
    "uswds": {
      "tier": "system",
      "output": { "format": "rgba", "alpha": 0.1 }
    }
  }
}
```

- `$hex` is the compliant 8-digit source of truth.
- `output.format: "rgba"` tells the transform to emit `rgba(...)`.
- `output.alpha` is the **exact** decimal used in the emitted string (`0.01`, `0.1`,
  `0.2`, … `0.9`) — authoritative, so output does not drift.

The transform keys off `output.format`, **not** the family name, so it stays
generic and data-driven.

### Step 3 — Update the value transform

In `internals/token-helpers/index.ts`, extend `getTokenValueWithUnit` (or add a
dedicated color transform) so that, informed by Step 0:

- color tokens with `$extensions.uswds.output.format === "rgba"` emit
  `rgba(r, g, b, <output.alpha>)` — `r,g,b` parsed from the first 6 hex digits,
  alpha taken verbatim from metadata;
- all other color tokens emit their flat `$hex` (only if Step 0 shows SD does not
  already do this);
- `dimension` handling is unchanged.

Add unit tests in `internals/token-helpers/index.test.ts`:

- hex8 + `output` metadata → exact `rgba(0,0,0,0.01)` (assert the string, including
  the exact alpha, for a spot set of grades);
- a standard hex-object → flat `#RRGGBB`;
- an existing dimension token → unchanged (regression guard).

### Step 4 — Verify the PR 1 vivid-alias custom format consumes transformed values

PR 1's `css/variables-with-vivid-alias` / `scss/variables-with-vivid-alias`
formats iterate `dictionary.allTokens` and print the value directly. Confirm they
read the **post-transform** value (`token.value`), not the raw `$value` object —
otherwise every color emits `[object Object]` from that format path specifically.
Fix the format to use the transformed value if needed. This is a wiring check: the
format looks done but is inert against the new object shape unless it reads the
transformed value.

### Step 5 — Update the reconciliation script to validate built hex

Update `internals/scripts/reconcile-colors.js` (from PR 2) to reconcile CSV values
against the **built output** (`build/css/system/color.css` / flat hex), not the
source JSON `$value`. This makes reconcile **format-agnostic**: it is unaffected by
the source `$value` becoming an object, and it validates the actual emitted hex.
(The two transparent families are absent from `uswds-system-tokens.csv`, so
reconcile does not cover them — see the standalone gate below.)

### Step 6 — Build and commit

```bash
npm run build:tokens
node internals/scripts/reconcile-colors.js
npm test
```

Commit source + rebuilt `build/css/system/color.css` + `build/scss/system/_color.scss`.

---

## Done when

- [ ] Step 0 empirical SD-behavior check completed; observed output recorded in the PR description; transform written to match it (extends, not duplicates, SD)
- [ ] Every `$value` in `tokens/system/color/*.json` is an object with a required `$hex` member (no bare-string color values remain)
- [ ] `npm run build:tokens` exits 0
- [ ] `npm test` exits 0 (new hex8→rgba tests + existing transform tests pass)
- [ ] **Standard families:** built hex in both `build/css/system/color.css` and `build/scss/system/_color.scss` is byte-identical to pre-conversion (spot-check `--usa-color-red-50: #d83933;` / `$usa-color-red-50: #d83933;`)
- [ ] **Transparent-family standalone gate:** capture the 20 `rgba(...)` lines (both files) _before_ conversion; assert they are byte-identical _after_ — this is the only safety net for the exact-alpha behavior, since reconcile does not cover these CSV-absent families
- [ ] PR 1 vivid-alias custom format verified to emit transformed values (no `[object Object]` in output)
- [ ] `node internals/scripts/reconcile-colors.js` exits 0, validating against **built** hex
- [ ] `build/` output committed alongside source changes
