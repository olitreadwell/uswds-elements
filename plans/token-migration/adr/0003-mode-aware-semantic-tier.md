# ADR-0003: Mode-aware semantic tier — prominence/usage naming

**Status:** Proposed
**Date:** 2026-07-02
**Related:** [design-system-token-research.md](design-system-token-research.md) Decision
Summary (recommended: `light-dark()` theming — pending team review), ADR-0008

## Context

USWDS is light-mode only today. Its semantic color ramps encode **physical lightness in their
names**: `$theme-color-primary-lightest/-lighter/-light/(base)/-vivid/-dark/-darker/-darkest`
(`uswds-core/src/styles/settings/_settings-color.scss`), surfaced in Elements as
`--usa-color-primary-lighter` etc. These names cannot support dark mode: "primary-darker" as a
hover shade must get _lighter_ in dark mode, so a token literally named `darker` would resolve to
a light value — a semantic contradiction.

The requirement: **preserve the existing semantic ramp tokens** (agencies and USWDS core depend on
them) while **adding a new semantic variant whose names stay truthful in both modes**, built on
the proposed `light-dark()` strategy (design-system-token-research.md).

## Decision drivers

- Existing ramp names must keep working, unchanged, with their current light-mode values
- New tier names must be mode-agnostic — they describe role/usage, not lightness
- Components (usa-alert, usa-button, …) should consume the new tier exclusively, so dark mode is a token-layer concern, not a component concern
- The same pattern must extend to every role with a lightness ramp: `base`, `primary`, `secondary`, `accent-warm`, `accent-cool`, `error`, `warning`, `success`, `info`, `disabled`, `emergency`

## Decision

**Prominence/usage roles.** For each semantic role, define adaptive tokens named by what the color
is _for_, with a prominence modifier:

```
--usa-color-{role}-surface           solid fill (buttons, badges)
--usa-color-{role}-surface-subtle    tinted background (alert bodies, highlights)
--usa-color-{role}-surface-strong    emphasized/active fill
--usa-color-{role}-border            borders, dividers, focus accents
--usa-color-{role}-text              text/icons on the app background
--usa-color-{role}-text-strong       high-contrast text
--usa-color-on-{role}                text/icons placed on {role}-surface
```

Each resolves via `light-dark()` to primitives per mode:

```css
:root {
    color-scheme: light dark;
    --usa-color-primary-surface: light-dark(
        var(--usa-color-blue-60v),
        var(--usa-color-blue-30)
    );
    --usa-color-primary-surface-subtle: light-dark(
        var(--usa-color-blue-10),
        var(--usa-color-blue-90)
    );
}

/* component usage */
.usa-button {
    background: var(--usa-color-primary-surface);
    color: var(--usa-color-on-primary);
}
```

**Legacy ramp tokens remain emitted** with their current light-mode-fixed values and are
documented as "fixed lightness — do not use in adaptive UIs." They become plain aliases of
primitives (no `light-dark()`), so nothing breaks for existing consumers.

DTCG modeling: one token per adaptive name; light and dark primitive references carried in
`$extensions` (e.g. `$extensions: { "uswds": { "dark": "{color.blue.30}" } }` with `$value` holding
the light reference). A custom Style Dictionary transform emits
`light-dark(var(--…), var(--…))` for CSS; the SCSS platform emits the light value (USWDS core
stays light-only until it opts in).

## Alternatives considered

### (b) Radix-style numeric steps — rejected

`--usa-color-primary-1 … -12`, each step with documented semantics (1 = app background,
9 = solid fill, 12 = high-contrast text), mirroring Radix Colors.

- ✅ Fully systematic; step semantics are documented once and apply to every role
- ✅ Proven model (Radix) for automatic light/dark inversion
- ❌ Introduces a second numeric vocabulary that visually collides with the USWDS 5–90 primitive scale (`--usa-color-primary-9` vs `--usa-color-blue-90` invite confusion)
- ❌ Step numbers are memorized conventions, not self-describing; higher onboarding cost for the federal community

### (c) Elevation/intensity mirror — rejected

Mechanical rename of the existing 7-step ramp to intensity words:
`--usa-color-primary-weakest/-weaker/-weak/(base)/-strong/-stronger/-strongest`.

- ✅ 1:1 mapping from existing ramp names makes migration a mechanical find/replace
- ✅ Names are mode-agnostic ("strong" can invert honestly)
- ❌ Inherits the ramp's core ambiguity: intensity still doesn't say _what the color is for_, so component authors keep guessing which step to use
- ❌ Perpetuates a 7-step ramp shape that exists because of light-mode Sass history, not component needs

## Consequences

- Components migrate to the adaptive tier only; legacy ramps stay for app-level/back-compat use
- A light/dark value pair must be chosen for every adaptive token per role (design work; the dark values are new decisions, not derivable mechanically)
- `color-scheme: light dark` ships in the token stylesheet; consumers can force a scheme via `color-scheme` on `:root` or a subtree
- USWDS core is unaffected until it opts into the adaptive tier — the ADR-0005 SCSS output exposes only light values initially
- The `on-{role}` names are net-new (no USWDS precedent); they fill the "text on solid fill" gap the ramp never covered
