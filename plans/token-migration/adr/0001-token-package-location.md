# ADR-0001: Token package and repo location

**Status:** Proposed
**Date:** 2026-07-02
**Related:** [architecture-decisions.md](../architecture-decisions.md) (accepted: 3 tiers, `--usa-*` prefix), [plan-03](../plan-02-style-dictionary-source-of-truth.md) Phase 5

## Context

The Style Dictionary source in `tokens/` is becoming the comprehensive source of truth for USWDS design tokens. Three consumers need its output:

1. **USWDS Elements** (this repo) — CSS custom properties for web components
2. **USWDS core** (`uswds/uswds`) — generated SCSS replacing hand-authored token files (see ADR-0005)
3. **Downstream agencies** — color tokens distributed as an npm package, consumable without either framework

Today the tokens live inside `@uswds/elements` and ship via its `"./styles/*": "./build/*"` package export. That couples the token release cadence to the component-library release cadence, and gives USWDS core no clean way to depend on tokens without depending on a web-component library.

## Decision drivers

- USWDS core and USWDS Elements must consume the _same_ built artifacts, versioned independently of either consumer
- Color tokens ship first, but spacing, typography, and component tokens follow — the packaging choice should not require a rename later
- Agencies should be able to `npm install` tokens alone (CSS-only or design-tooling use cases)

## Alternatives considered

### (a) Standalone `@uswds/tokens` package — **recommended**

A dedicated package (own workspace, eventually its own repo or a workspace in the USWDS monorepo) holding the DTCG JSON source plus built artifacts, with per-category exports:

```
@uswds/tokens
├── tokens/                    # DTCG JSON source
├── dist/css/colors.css        # :root { --usa-color-red-60v: #b50909; ... }
├── dist/scss/_colors.scss     # $usa-color-red-60v: #b50909;
├── dist/scss/uswds-core/      # translation layer for uswds core (ADR-0005)
├── dist/json/colors.json      # flat name → value map
└── package.json               # exports: "./css/*", "./scss/*", "./json/*"
```

- ✅ USWDS core, USWDS Elements, and agencies all depend on one versioned artifact
- ✅ Token changes release on their own cadence (Changesets already in use here)
- ✅ Name has room for all categories (colors first, then spacing/typography/components)
- ❌ One more package to maintain, publish, and document
- ❌ Cross-repo coordination if it moves out of this repo

### (b) Keep publishing from `@uswds/elements`

Retain `tokens/` here; the existing `"./styles/*": "./build/*"` export is the distribution channel.

- ✅ Zero new infrastructure; already works today
- ✅ Simplest while USWDS Elements is the only consumer
- ❌ USWDS core's source of truth would depend on a web-component library release
- ❌ Agencies wanting only colors install a component library
- ❌ Token-only breaking changes force a major version of the whole elements package

### (c) Color-only `@uswds/color-tokens`

A package scoped strictly to color.

- ✅ Smallest possible surface for the first npm deliverable
- ❌ Spacing/typography follow soon after; leads to either many micro-packages or a rename/deprecation
- ❌ Component tokens reference color _and_ spacing — cross-package references complicate the build

## Recommendation

**(a) Standalone `@uswds/tokens`.** Start as a workspace in this repo (source moves from `tokens/` into `packages/tokens/` or equivalent) so the existing Style Dictionary config, Changesets, and CI carry over; extract to the USWDS org's preferred home once USWDS core adopts it. Colors are the first published category; spacing, typography, and component tokens ship from the same package as they land.

## Consequences

- `@uswds/elements` gains a dependency on `@uswds/tokens` and drops its own `build/` token artifacts (its `./styles/*` export can re-export for compatibility during transition)
- USWDS core's adoption path (ADR-0005) is `npm install @uswds/tokens` + import of the generated `uswds-core/` SCSS
- Versioning policy needed: token value changes = minor; token removals/renames = major; the compat layer (ADR-0005) absorbs renames
