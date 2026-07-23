# ADR-0005: SCSS translation layer for USWDS core

**Status:** Proposed
**Date:** 2026-07-02
**Related:** ADR-0001, ADR-0006, ADR-0007, ADR-0008

## Context

The end state is that USWDS core (`uswds/uswds`) consumes **built SCSS artifacts** from the token
package instead of hand-authoring its token files — even while token names evolve toward the new
semantics. USWDS core's internals depend on specific Sass structures
(all under `packages/uswds-core/src/styles/`):

- ~600 flat shortcode scalars: `$color-blue-60v` and the public `$red-60v` style aliases (`tokens/color/shortcodes-color-system.scss`)
- Nested family maps merged into `$system-colors` (`tokens/color/system-colors.scss`)
- The flat lookup map `$system-color-shortcodes` feeding `color()` / `set-theme-color()`
- `$theme-*: <value> !default;` settings (`settings/_settings-*.scss`) whose values are string references (`"blue-60v"`, `"md"`, `6`)
- Spacing/type maps: `$system-spacing`, `$system-type-scale`, `$system-line-height`

The resolution functions (`color()`, `units()`, `radius()`, `family()`) are lookup wrappers over
these maps. If the maps and settings arrive with the right shape and values, the functions — and
every component/utility built on them — work unchanged.

## Decision drivers

- USWDS core adoption must be incremental and low-risk: swap token _files_, not the resolution machinery
- Old names (`$red-60v`, `$theme-color-primary`) must keep working while new canonical names (`$usa-color-red-60v`, prominence-tier names) are introduced
- The mapping between old and new names must live in exactly one generated place, never hand-maintained

## Alternatives considered

### (a) Custom Style Dictionary formats regenerate USWDS-shaped files — **recommended**

The token package's build emits a `dist/scss/uswds-core/` directory whose files are drop-in
replacements for USWDS core's hand-authored token files:

```
dist/scss/uswds-core/
├── _system-colors.scss          # $system-color-blue: (...nested map...); $system-colors: map-collect(...)
├── _shortcodes-color-system.scss# $color-blue-60v: #005ea2; $blue-60v: $color-blue-60v; $system-color-shortcodes: (...)
├── _settings-color.scss         # $theme-color-primary: "blue-60v" !default; ...
├── _system-spacing.scss         # $system-spacing map with resolved rem values
├── _system-type.scss            # $system-type-scale, $system-line-height
└── _compat.scss                 # legacy name → canonical $usa-* aliases + deprecation notes
```

Custom formats (Style Dictionary v5 `registerFormat`) walk the dictionary and print Sass maps and
scalars; grouping/nesting comes from the DTCG path, values from the resolved tokens.

- ✅ `color()`, `units()`, `set-theme-color()` and all components/utilities work unchanged
- ✅ Old→new mapping is generated, versioned, and testable (round-trip: compile USWDS with generated files, diff output CSS against baseline)
- ✅ Deprecations become mechanical: mark a token in `$extensions`, the format emits a `@warn`-wrapped alias
- ❌ Format code must faithfully reproduce Sass idioms (nested maps, `!default`, quoted string references, `false` sentinels — see ADR-0008)
- ❌ Two artifacts styles in one package: canonical `$usa-*` SCSS and USWDS-core-shaped SCSS

### (b) Rewrite USWDS core internals to read canonical `$usa-*` variables — rejected for now

Change `color()`/`units()`/settings plumbing to consume the new flat names directly.

- ✅ No translation layer; one naming system everywhere
- ❌ Invasive change to uswds-core's most load-bearing code; blocks incremental adoption
- ❌ Breaks every theme that overrides `$theme-*` settings — the settings API _is_ USWDS's public theming contract
- Viable as a later major-version step after the generated files are proven

### (c) Hand-maintained `_compat.scss` alias file — rejected

- ✅ Quick to write once
- ❌ Drifts from the dictionary — exactly the fallback-drift failure mode plan-02 exists to eliminate
- ❌ ~600 color shortcodes plus settings make manual maintenance unrealistic

## Recommendation

**(a).** Build the formats in this order, each verified by the round-trip diff before the next:
system color maps + shortcodes → spacing/type maps → settings files. Legacy names are emitted
indefinitely at first; canonical `$usa-*` names ship alongside from day one, and deprecation
warnings are a later, config-driven switch.

## Consequences

- USWDS core's adoption is a file-swap PR per area (colors first), with CSS-diff evidence attached
- The token package build gains a compile-USWDS integration test (dart-sass compile of uswds-core against `dist/scss/uswds-core/`). This test sources USWDS core from the existing `@uswds/uswds` npm dependency already declared in `package.json` (a regular `dependencies` entry, currently `^3.13.0`) — it is already present in `node_modules` on every `npm ci`, including in CI's existing setup step, so no new checkout mechanism, git submodule, or pinned fixture repo is needed. The version is pinned the same way every other dependency in this repo is pinned: via `package.json`'s semver range plus `package-lock.json`'s resolved version.
- Settings values in generated `_settings-*.scss` stay _string references_ (`"blue-60v"`) — they are DTCG aliases in the source, and the format prints the referenced token's USWDS shortcode name, not the resolved hex, preserving USWDS's theme-override semantics
- Utility-generator config (`*-settings`, `*-palettes`) is explicitly out of scope and stays hand-authored in uswds-core (ADR-0006)
- `legacyName` (ADR-0010 Decision 3) is a keyed object (`shortcode`/`privateVar`/`publicVar`/`mapKey`); this translation layer reads it by key name, never by array position, so it can consume categories with different legacy-artifact sets (color's full four keys vs. typography's `publicVar`-only) without per-category special-casing.
