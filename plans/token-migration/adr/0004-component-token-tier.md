# ADR-0004: Component token tier — naming and source location

**Status:** Proposed
**Date:** 2026-07-02
**Related:** [design-system-token-research.md](design-system-token-research.md) (recommendations, pending team review), [plan-02](../plan-02-port-audit-enforce.md) Objective 1.2, ADR-0003

## Context

USWDS core defines 152 component settings in
`uswds-core/src/styles/settings/_settings-components.scss` across 29 components
(`$theme-button-*`, `$theme-card-*`, `$theme-alert-*`, `$theme-step-indicator-*`, …). Per the
inventory (`uswds-settings-tokens.csv`), their name formulas are dominated by
`namespace.component.property` (94), plus element (27) and state (16) suffixed variants.

USWDS Elements needs the equivalent tier as CSS custom properties, named after the **web component
tag** each token belongs to: `--usa-button-*`, `--usa-card-*`, `--usa-alert-*`. The component
settings names already align with tag names (`$theme-button-*` → `<usa-button>`), so the mapping
is mostly mechanical.

## Decision drivers

- Token name must identify the component by its tag name, so DevTools inspection and `custom-elements.json` docs line up
- Names must accommodate element, variant, and state axes found in the inventory (e.g. `$theme-step-indicator-counter-border-width` — element `counter`; `$theme-button-small-width` — variant `small`)
- One source of truth: the same component token must drive Elements CSS, docs, and (eventually) USWDS core's `$theme-{component}-*` defaults

## Alternatives considered

### Naming formula

**(a) Curtis order: `--usa-{component}[-{element}][-{variant}][-{property}][-{state}]` — recommended**

Examples (before → after):

| USWDS setting                          | Component token                       |
| -------------------------------------- | ------------------------------------- |
| `$theme-button-border-radius`          | `--usa-button-border-radius`          |
| `$theme-alert-icon-size`               | `--usa-alert-icon-size`               |
| `$theme-step-indicator-counter-gap`    | `--usa-step-indicator-counter-gap`    |
| `$theme-accordion-border-color`        | `--usa-accordion-border-color`        |
| `$theme-table-header-background-color` | `--usa-table-header-background-color` |

- ✅ Matches how the 94 `namespace.component.property` settings already read — most names carry over verbatim after prefix swap
- ✅ Matches the classification columns in the inventory, so the migration table can be generated from the CSV
- ❌ Long names for deep cases (element + variant + property + state)

**(b) Property-first orderings** (e.g. `--usa-border-radius-button`)

- ✅ Groups by CSS property in alphabetized listings
- ❌ Breaks component discoverability (autocomplete on `--usa-button-` is the primary lookup path)
- ❌ Contradicts both the existing USWDS settings names and the alert/banner tokens already shipped in Elements

### Source location

**(a) Style Dictionary files, one per component: `tokens/components/{component}.json` — recommended**

- ✅ Single source drives `custom-elements.json` docs, the built CSS, and the ADR-0005 generation of `$theme-{component}-*` defaults for USWDS core
- ✅ Component tokens can alias semantic tokens (`{color.primary.surface}`) and get validated like any other token
- ❌ Contributors touch two places when adding a component token (JSON + component CSS consuming it)

**(b) Component CSS `:host` blocks only** (current practice in usa-alert/usa-banner)

- ✅ Everything about a component in one file
- ❌ Not machine-readable as a token source; exactly the drift/fallback problem plan-02 is eliminating
- ❌ USWDS core could not derive its component settings from it

## Recommendation

**Curtis-order naming + Style Dictionary source files.** Generate the initial
`tokens/components/*.json` skeletons and the `$theme-{component}-*` → `--usa-{component}-*`
migration table from `uswds-settings-tokens.csv` (the component/element/variant/state columns are
already populated). Component values alias the ADR-0003 adaptive semantic tier by default;
primitives only where USWDS core's settings do the same.

## Consequences

- 29 component token files land incrementally as components are built (only usa-alert, usa-banner, usa-link exist today; plan-02 PR 8 starts this)
- The plan-02 enforcement scripts gain a rule: `:host` custom properties must be declared in the component's token file
- A handful of USWDS settings don't map to a single tag (e.g. `$theme-navigation-*`, `$theme-megamenu-*` belong to `usa-header`'s internals) — the migration table records these explicitly rather than assuming tag = settings prefix
