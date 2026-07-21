# ADR-0002: Primitive color naming — emit both `60v` and `vivid-60`

**Status:** Accepted
**Date:** 2026-07-02
**Related:** [architecture-decisions.md](../architecture-decisions.md) §3 (accepted: keep USWDS 10-scale + vivid), ADR-0005

## Context

USWDS Sass exposes flat vivid shortcodes like `$red-60v` (defined in
`uswds-core/src/styles/tokens/color/shortcodes-color-system.scss` as
`$color-red-60v: get-system-color("red", 60, "vivid")`). The CSS equivalent must include
`--usa-color-red-60v` — Sass/CSS name parity matters for agency muscle memory and documentation
continuity.

The current Style Dictionary source nests vivid values under a `vivid` group
(`tokens/colors/red.json` → `color.red.vivid.60`), and the current name transform
(`generateTokenName` in `internals/token-helpers/index.ts`) joins path segments with `-`,
producing `--usa-color-red-vivid-60` — the name `@uswds/elements` alpha releases already shipped.
Source structure and output naming are separable concerns: the transform, not the JSON shape,
determines the emitted names.

## Decision drivers

- USWDS convention parity: `--usa-color-red-60v` / `$usa-color-red-60v` must exist
- Already-published `--usa-color-*-vivid-*` names should keep working — no breaking rename
- The two names must never drift: one value definition, the other name derived
- The JSON source should stay useful to tooling (design-tool sync, docs generation) that benefits from an explicit variant hierarchy

## Decision

**Emit both names for every vivid token.** Keep the nested `vivid` group in the JSON source
(`color.red.vivid.60`); the build emits:

- **`--usa-color-red-60v`** — canonical name, holds the literal value; used in documentation and by the ADR-0005 SCSS translation layer (matches USWDS's `$red-60v` modulo prefix)
- **`--usa-color-red-vivid-60`** — supported alias, defined as a reference to the canonical name so the value cannot drift:

```css
:root {
    --usa-color-red-60v: #b50909;
    --usa-color-red-vivid-60: var(--usa-color-red-60v);
}
```

```scss
$usa-color-red-60v: #b50909;
$usa-color-red-vivid-60: $usa-color-red-60v;
```

Implementation: `generateTokenName` renders a `vivid` segment by suffixing `v` to the adjacent
grade (`["color","red","vivid","60"]` → `usa-color-red-60v`); a small custom format (or format
wrapper) appends the `-vivid-{grade}` alias line for each token whose path contains `vivid`.
Unit coverage for both the transform and the alias emission (grades with and without vivid,
`default` stripping, spacing/breakpoint passthrough).

## Alternatives considered

### (a) Rename-only: transform to `60v`, drop `vivid-60` — rejected

- ✅ Single name per token; smallest output
- ✅ Output matches USWDS convention exactly
- ❌ Breaks already-published alpha consumers of `--usa-color-*-vivid-*` for no functional gain
- ❌ Loses the more explicit, self-describing name some consumers may prefer

### (b) Flatten JSON keys to `"60v"` — rejected

Author `color.red.60v` directly in the source files.

- ✅ Source path equals canonical output name; no transform logic
- ✅ Matches the flat shortcode mental model (`$red-60v`)
- ❌ Loses the variant axis — tooling can't distinguish "vivid 60" from "a grade named 60v" without string parsing
- ❌ Diverges from USWDS core's nested map structure, making the ADR-0005 map regeneration (which needs `family → "vivid" → grade`) reconstruct nesting by parsing key suffixes

### (c) Keep only `-vivid-60` output — rejected

- ✅ No change at all from the current build
- ❌ Violates the Sass/CSS parity requirement; every USWDS doc, designer, and agency stylesheet says `60v`
- ❌ Permanent translation burden between USWDS core names and Elements names

## Consequences

- No breaking change: existing `--usa-color-*-vivid-*` consumers are unaffected; `60v` names are additive
- Both spellings are supported public API; docs present `60v` as canonical and `vivid-*` as an equivalent alias — the docs generator should list them together, not as two tokens
- Output size grows by one `var()` alias line per vivid token (~230 lines across CSS+SCSS); negligible
- DTCG aliases in source keep referencing `{color.red.vivid.60}`; grade keys stay numeric — both suffix styles are render-time concerns
- The ADR-0005 compat layer emits the unprefixed legacy `$red-60v` from the same canonical token, so all three spellings resolve to one definition
