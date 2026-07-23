# ADR-0002: Primitive color naming — emit both `vivid-60` and `60v`

**Status:** Proposed
**Date:** 2026-07-02
**Amended:** 2026-07-21 — Canonical and legacy roles inverted. `vivid-60` is now the
canonical name (holds the literal value); `60v` is the legacy alias (a `var()`
reference). Rationale: prefer the verbose, self-describing, forkable-friendly name as
canonical. All implementation and consequence notes below reflect this inversion.
**Related:** [design-system-token-research.md](design-system-token-research.md) Decision
Summary (recommended: keep USWDS 10-scale + vivid — pending team review), ADR-0005

## Context

USWDS Sass exposes flat vivid shortcodes like `$red-60v` (defined in
`uswds-core/src/styles/tokens/color/shortcodes-color-system.scss` as
`$color-red-60v: get-system-color("red", 60, "vivid")`). The CSS package must also
support `--usa-color-red-60v` — Sass/CSS name parity matters for agency muscle memory
and documentation continuity.

The current Style Dictionary source nests vivid values under a `vivid` group
(`tokens/system/color/red.json` → `color.red.vivid.60`), and the current name
transform (`generateTokenName` in `internals/token-helpers/index.ts`) joins path
segments with `-`, producing `--usa-color-red-vivid-60` — the name `@uswds/elements`
alpha releases already shipped.

Source structure and output naming are separable concerns: the transform, not the JSON
shape, determines the emitted names.

## Decision drivers

- **Verbose, self-describing name as canonical** — `vivid-60` communicates variant and
  grade to any reader (human, design tool, or AI) without context; `60v` requires
  knowing USWDS's `v`-suffix convention. For a package positioning itself as a
  forkable design system foundation, the more explicit name is the better canonical.
- USWDS Sass parity: `--usa-color-red-60v` / `$usa-color-red-60v` must still _exist_
  as a supported legacy alias — parity preserved via the alias chain
- The two names must never drift: one value definition, the other name derived
- The JSON source should stay useful to tooling (design-tool sync, docs generation)
  that benefits from an explicit variant hierarchy

## Decision

**Emit both names for every vivid token.** Keep the nested `vivid` group in the JSON
source (`color.red.vivid.60`); the build emits:

- **`--usa-color-red-vivid-60`** — canonical name, holds the literal value; used in
  documentation, component CSS, and as the source for the ADR-0005 SCSS translation
  layer
- **`--usa-color-red-60v`** — legacy alias, defined as a reference to the canonical
  name so the value cannot drift:

```css
:root {
    --usa-color-red-vivid-60: #b50909;
    --usa-color-red-60v: var(--usa-color-red-vivid-60);
}
```

```scss
$usa-color-red-vivid-60: #b50909;
$usa-color-red-60v: $usa-color-red-vivid-60;
```

Implementation: `generateTokenName` leaves the `vivid-{grade}` path join as-is
(canonical output); a small custom format (or format wrapper) appends the `{grade}v`
legacy alias line for each token whose path contains `vivid`. The helper
`getVividLegacyName` derives the `60v`-style name by locating the `vivid` segment in
the path and suffixing `v` to the adjacent grade:
`["color","red","vivid","60"]` → `usa-color-red-60v`.

`$extensions.uswds.legacyName` on each vivid token records the USWDS-core back-map
forms (e.g. `["red-60v", "$color-red-60v", "$red-60v"]`) — these are the _legacy_
USWDS names, derived from the `60v` convention, not from the canonical `vivid-60` name.

Unit coverage for both the transform and the alias emission (grades with and without
vivid, `default` stripping, spacing/breakpoint passthrough).

## Alternatives considered

### (a) `60v` as canonical, `vivid-60` as legacy alias — rejected

`60v` was the original format in USWDS core. `vivid-60` was implemented at the start of the elements repo and was already the shipped alpha name.
The parity argument for `60v` can remain supported by retaining `60v` as an alias. `-vivid` is favored as canonical because it's a clear, semantic label.

### (b) Flatten JSON keys to `"60v"` — rejected

Author `color.red.60v` directly in the source files.

- ✅ Source path equals the `60v` output name; no transform logic
- ✅ Matches the flat shortcode mental model (`$red-60v`)
- ❌ Loses the variant axis — tooling can't distinguish "vivid 60" from "a grade named 60v" without string parsing
- ❌ Diverges from USWDS core's nested map structure, making the ADR-0005 map regeneration (which needs `family → "vivid" → grade`) reconstruct nesting by parsing key suffixes

### (c) Keep only `-vivid-60` output — rejected

- ✅ No change at all from the current build; `vivid-60` is already canonical
- ❌ Drops `60v` support, breaking USWDS Sass parity and agency stylesheets that use the `v`-suffix form

### (d) Rename-only: transform to `vivid-60`, drop `60v` entirely — rejected

- ✅ Single name per token; smallest output
- ❌ Drops `60v` support (same parity argument as (c))

## Consequences

- No breaking change: `--usa-color-*-vivid-*` names were already canonical (shipped in
  alpha); `60v` names are additive as legacy aliases
- Both spellings are supported public API; docs present `vivid-60` as canonical and
  `60v` as the USWDS-parity legacy alias — the docs generator should list them
  together, not as two tokens
- Output size grows by one `var()` alias line per vivid token (~230 lines across
  CSS+SCSS); negligible
- DTCG aliases in source keep referencing `{color.red.vivid.60}`; grade keys stay
  numeric — both suffix styles are render-time concerns
- The ADR-0005 compat layer emits the unprefixed legacy `$red-60v` from the same
  canonical token (`$usa-color-red-vivid-60`), so all three spellings resolve to one
  definition
- `$extensions.uswds.legacyName` records `["red-60v", "$color-red-60v", "$red-60v"]`
  as the USWDS legacy back-map forms; the canonical `vivid-60` form is not in
  `legacyName` (it is the current name, not a legacy one)
