# ADR-0004: Component token tier — naming and source location

**Status:** Proposed
**Date:** 2026-07-02
**Related:** [design-system-token-research.md](design-system-token-research.md) (recommendations, pending team review), [plan-02](../plan-02-port-audit-enforce.md) Objective 1.2, ADR-0003, ADR-0010

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

Most `$theme-{component}-*` defaults in the inventory are themselves quoted references to a
**theme/state role name**, not to a primitive and not to anything mode-adaptive:

```
$theme-link-color: "primary"
$theme-link-hover-color: "primary-dark"
$theme-link-active-color: "primary-darker"
$theme-accordion-button-background-color: "base-lightest"
```

Per ADR-0010 Decision 4, those role names (`primary`, `primary-dark`, `base-lightest`, …) are the
plain **theme/state tier** — tokens whose `$value` already aliases a system primitive
(`theme/color/primary.$value = {color.system.blue-warm.60v}`) — distinct from the ADR-0003
adaptive prominence/usage sub-tier that also lives in `theme/`/`state/`. The component tier needs
to alias both.

## Decision drivers

- Token name must identify the component by its tag name, so DevTools inspection and `custom-elements.json` docs line up
- Names must accommodate element, variant, and state axes found in the inventory (e.g. `$theme-step-indicator-counter-border-width` — element `counter`; `$theme-button-small-width` — variant `small`)
- One source of truth: the same component token must drive Elements CSS, docs, and (eventually) USWDS core's `$theme-{component}-*` defaults
- Component tokens must be able to ship as exact 1:1 aliases of existing `$theme-{component}-*` defaults immediately — a token can't be blocked on an ADR-0003 dark-mode value design that hasn't happened yet for every one of the ~152 component settings

## Alternatives considered

### Naming formula

**(a) Nathan Curtis' order: `--usa-{component}[-{element}][-{variant}][-{property}][-{state}]` — recommended**

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

### Alias target

**(a) Adaptive tier only — superseded**

Component `$value`s alias exclusively the ADR-0003 adaptive prominence/usage tier
(`--usa-color-{role}-surface`, `-text`, `-border`, `-on-{role}`).

- ✅ Every component token is dark-mode-correct by construction
- ✅ One alias pattern, so the Style Dictionary validation rule stays a single fixed check
- ❌ Blocks every one of the ~152 component settings on an undesigned dark-mode value pair before its component token file can be written, even where the CSV shows an exact, unambiguous existing default
- ❌ Breaks the ADR-0005 round-trip diff for any component token with no adaptive counterpart yet

**(b) Adaptive tier where the driver applies, plain theme/state tier where the CSV default is already a direct role reference — recommended**

A component token aliases the ADR-0003 adaptive tier for new or mode-sensitive usage; otherwise it
aliases the theme/state tier token matching the `$theme-{component}-*` default's existing role
reference (e.g. `$theme-link-color: "primary"` → component token aliases `theme/color/primary`).

- ✅ Matches actual USWDS practice — most sampled component settings reference theme/state roles directly, not adaptive semantics
- ✅ Unblocks CSV-driven 1:1 migration immediately, without waiting on unrelated dark-mode design work
- ✅ Reuses the ADR-0010 Decision 4 alias-walk unchanged: component→theme aliasing is the same mechanism as theme→system aliasing, so the ADR-0005 SCSS settings format needs no new logic to derive the legacy quoted-string reference
- ❌ Two valid alias targets weakens the Style Dictionary validation rule from one fixed pattern to "aliases theme, state, or the adaptive tier"
- ❌ A component token aliasing the plain theme/state tier inherits that tier's dark-mode blind spot and needs a discoverable path to migrate to the adaptive tier later (e.g. `$extensions.uswds.needsAdaptive`)

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

**Curtis-order naming + Style Dictionary source files + dual alias target.** Generate the initial
`tokens/components/*.json` skeletons and the `$theme-{component}-*` → `--usa-{component}-*`
migration table from `uswds-settings-tokens.csv` (the component/element/variant/state columns are
already populated). Component `$value`s alias the ADR-0003 adaptive tier when the mode-sensitivity
driver applies (new or mode-sensitive usage); otherwise they alias the theme/state tier token
matching the CSV default's existing role reference (ADR-0010 Decision 4's alias-walk covers both —
component→theme aliasing is the same mechanism as theme→system aliasing). Primitives only where
USWDS core's settings do the same.

## Consequences

- 29 component token files land incrementally as components are built (only usa-alert, usa-banner, usa-link exist today; plan-02 PR 8 starts this)
- The plan-02 enforcement scripts gain a rule: `:host` custom properties must be declared in the component's token file
- A handful of USWDS settings don't map to a single tag (e.g. `$theme-navigation-*`, `$theme-megamenu-*` belong to `usa-header`'s internals) — the migration table records these explicitly rather than assuming tag = settings prefix
- Component tokens aliasing theme/state tier tokens inherit that token's role/shortcode reference for free via the ADR-0010 Decision 4 alias-walk — the ADR-0005 SCSS settings format already follows the alias chain to derive the quoted-string reference, so no new translation logic is needed. The component token's own `$extensions.uswds.legacyName` still records the `$theme-{component}-*` settings var it replaces
- Component tokens aliasing the ADR-0003 adaptive tier have no legacy quoted-string equivalent (adaptive tokens are net-new and mode-aware; there's no single role or shortcode to point back to) — the ADR-0005 SCSS settings output must fall back to emitting the token's resolved light-mode value for these, a documented gap versus the always-alias behavior of the theme/state case.

    **Round-trip gate tolerance:** ADR-0005 §Decision (a) requires that the generated
    `_settings-*.scss` files produce a whitespace-only diff when used to compile USWDS
    core. Adaptive-tier component tokens have no quoted-string reference to emit, so the
    fallback to a resolved light-mode value (e.g. `#b50909` instead of `"red-60v"`) is a
    literal-value-vs-reference difference that would cause the round-trip diff to fail on
    those entries. The ADR-0005 round-trip check is therefore **scoped to theme/state-tier
    and system-tier tokens only** for this first phase; adaptive-tier component tokens are
    excluded from the diff gate and carry a prose note in the generated file marking them
    as "light-mode fallback — round-trip diff excluded, dark values pending design."
    When an adaptive token's dark-mode value pair is designed and the token is fully
    specified, it graduates to a proper SCSS expression (e.g. `light-dark(…)`) and the
    round-trip exclusion is lifted. This is the one intentional leak from the dark-mode
    "how" layer into the "prepare" layer; it is bounded to component settings that have
    no existing theme/state alias, and it is resolved token-by-token as dark-mode design
    work progresses.

- Component tokens on the plain theme/state tier need a discoverable migration path to the adaptive tier once their dark-mode values are designed — tracked via an `$extensions.uswds.needsAdaptive` marker (or equivalent) rather than left to be rediscovered ad hoc
