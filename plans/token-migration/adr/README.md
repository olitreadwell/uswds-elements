# Token Migration ADRs

Architecture decision records for making the Style Dictionary in `tokens/` the source of truth
for USWDS design tokens. Each ADR captures the alternatives considered and their trade-offs so
decisions are reviewable and revisitable.

Prior decisions in [architecture-decisions.md](../architecture-decisions.md) are treated as
accepted context and are not re-litigated here: 3-tier architecture (Primitive → Semantic →
Component), `--usa-*` prefix, USWDS 10-scale + vivid, `light-dark()` theming, no inline fallbacks
(usa-banner excepted), full palette retention.

## Index

| ADR                                           | Title                                                     | Status   |
| --------------------------------------------- | --------------------------------------------------------- | -------- |
| [0001](0001-token-package-location.md)        | Token package and repo location                           | Proposed |
| [0002](0002-primitive-vivid-naming.md)        | Primitive color naming — emit both `60v` and `vivid-60`   | Accepted |
| [0003](0003-mode-aware-semantic-tier.md)      | Mode-aware semantic tier — prominence/usage naming        | Accepted |
| [0004](0004-component-token-tier.md)          | Component token tier — naming and source location         | Proposed |
| [0005](0005-scss-translation-layer.md)        | SCSS translation layer for USWDS core                     | Proposed |
| [0006](0006-sass-maps-and-lists.md)           | Handling Sass maps and lists                              | Proposed |
| [0007](0007-sass-function-values.md)          | Handling Sass function-call token values                  | Proposed |
| [0008](0008-false-sentinels.md)               | Representing `false` sentinels and disabled slots         | Proposed |
| [0009](0009-utility-scale-property-tokens.md) | Utility-scale property tokens — scope and negative values | Proposed |

## Conventions

- **Statuses:** Proposed (recommendation pending team review) → Accepted / Rejected / Superseded-by-NNNN
- **Format:** Status / Date / Context / Decision drivers / Alternatives considered (with pros/cons) / Decision or Recommendation / Consequences
- New decisions with more than one viable option get a new numbered ADR; do not fold them into plan documents
