# ADR-0010: Tier-first token structure, `$extensions.uswds` meta, and the three SCSS builds

**Status:** Proposed
**Date:** 2026-07-21
**Related:** ADR-0001 (packaging), ADR-0002 (vivid naming), ADR-0003 (semantic tier), ADR-0005 (SCSS translation layer), ADR-0007/0008 (`$extensions.uswds` precedent), [plan-01](../plan-01-style-dictionary-source-of-truth.md)

## Context

The token package is being positioned for two audiences at once: (1) a widely distributed,
open-source design system that other organizations **fork as a foundation** ("USWDS as a base for
your own design system"), and (2) a **dependency consumed inside USWDS core's own SCSS**. Both
audiences, plus AI/tooling consumers, need the token source to be organized, self-describing, and
mechanically back-mappable to USWDS's existing names and Sass structure.

The current layout is **category-first** (`tokens/{colors,spacing,breakpoints}/*.json`), builds a
single prefixed output (`--usa-`/`$usa-`) via one hardcoded `prefix: "usa"` in
`config/style-dictionary.config.js`, and has no semantic tier, no back-map metadata, and no
USWDS-core-shaped SCSS. USWDS's published color model has three named layers — **system** (raw
palette), **theme** (branding roles: primary, base, secondary, accent, emergency), and **state**
(feedback roles: error, warning, success, info, disabled) — which the current structure does not
reflect.

This ADR records four coupled decisions that emerged from a design review: the directory/tier
model, the export granularity, the `$extensions.uswds` metadata convention (including the back-map),
and the three distinct SCSS/CSS build outputs. It supersedes the category-first assumptions in
plan-01 and refines the packaging in ADR-0001.

## Decision drivers

- **Forkability** — a downstream system should be able to take the raw palette alone and write its
  own theme/state on top, or take theme and swap only state. Fine-grained, take-what-you-need.
- **Doc parity** — the token buckets should match USWDS's published `system` / `theme` / `state`
  vocabulary so a reader (human or AI) finds the same three buckets they read about.
- **Back-mapping** — token changes must map cleanly and mechanically back to USWDS's existing names
  and Sass structure (nested maps, flat shortcodes, `$theme-*` settings), so the package can be
  consumed as a dependency in USWDS core (ADR-0005) without hand-maintained mapping tables.
- **No breaking rename** — existing published `--usa-color-*` names must keep working.
- **Single source of truth** — the old↔new mapping and the alias graph must live in exactly one
  generated place, never reconstructed by fragile string logic.

## Decision 1: Tier-first directory structure

Tier is the parent; category nests under it: `tokens/<tier>/<category>/…`.

```
tokens/
  system/          # all raw primitives, one category per subdir
    color/         # blue.json, gray.json, red-warm.json, …
    spacing/
    font-size/
    z-index/  opacity/  shadow/  flex/  gap/  line-height/  grid/
  theme/           # branding roles
    color/         # primary, base, secondary, accent-warm/cool, emergency
  state/           # feedback roles (sparse — color-only for the foreseeable future)
    color/         # error, warning, success, info, disabled
```

- `system/` is the home for **every** raw primitive scale, not only the "design-y" ones — the
  `uswds-properties-tokens.csv` scales (`z-index`, `opacity`, `shadow`, `flex`, `gap`,
  `line-height`, grid widths, per ADR-0009) are sibling categories under `system/`.
- `state/` is a deliberately **sparse** tier. USWDS defines state only for color; there is no
  "state font-size." Empty category dirs are not manufactured to make the three tiers look
  symmetric. It grows only if USWDS adds non-color state tokens.
- Color is the first category built out this way; other categories follow the same pattern as they
  land (Phase 1 of plan-01).

This mirrors USWDS core's own source layout (`settings/` ≈ theme, the `$system-*` maps ≈ system,
with color/spacing/type as concerns _inside_ each) and matches the `tier`/`category` columns already
present in the migration CSVs.

**Alternatives considered.** _Category-first_ (`color/{system,theme,state}`) — rejected: a forker
must cherry-pick `color/system` + `spacing/system` + `type/system` separately instead of taking
`system/` as one coherent foundation, and it diverges from USWDS's own tier-first source layout.
_Two tiers (`system` + combined `semantic`)_ — rejected: re-collapses the `theme`/`state` buckets
USWDS publishes as distinct, losing doc parity.

## Decision 2: Per-tier-per-category exports, emitting references

Package exports are keyed **per tier per category**, each with `.css` / `.scss` / `.json` variants:

```
@uswds/tokens/system/color   @uswds/tokens/system/spacing   …
@uswds/tokens/theme/color
@uswds/tokens/state/color
```

Theme and state outputs **emit references, not resolved values**, chained `system ← theme ← state`:

```css
/* theme/color */
--usa-color-primary: var(--usa-color-blue-warm-60v);
```

```scss
/* theme/color */
$usa-color-primary: $usa-color-blue-warm-60v;
```

- A forker who imports `system/color` and overrides `--usa-color-blue-warm-60v` gets the override to
  flow through `theme` and `state` for free — the core "USWDS as a foundation" use case. Resolved
  values would freeze the palette and defeat it.
- Consumers load the tiers they reference (`theme`/`state` depend on `system` being present). This is
  consistent with the "no inline fallbacks, require the global stylesheet" recommendation (research
  doc §5, pending team review).
- It matches USWDS core's own model, where theme settings are references, not resolved values.

**Alternatives considered.** _Whole-tier exports_ (`system` = all categories in one file) — rejected:
a consumer wanting only the palette would pull system spacing/type too. _Resolved values baked into
each export_ — rejected: breaks override-flow-through and the forking story.

## Decision 3: `$extensions.uswds` metadata convention

Machine-readable metadata lives under the bare **`uswds`** vendor key in DTCG `$extensions`
(consistent with the existing `formula` in ADR-0007 and `disabled` in ADR-0008 — one vendor
namespace, not `uswds` in some places and `gsa.uswds` in others). Human/AI-facing meaning uses the
DTCG-native **`$description`** field, not an extension.

Fields under `$extensions.uswds`:

- **`tier`** — `"system" | "theme" | "state"`. This is the sole source of tier information a token
  carries. Tier is expressed by the directory a token's source file sits in
  (`tokens/<tier>/<category>/…`, Decision 1), but each file's JSON content nests directly under its
  category key (e.g. `color.blue.5`) — a token's DTCG `path` never contains a tier segment. `tier`
  here is what travels into flattened JSON exports and lets any tool ask a token's tier without
  re-deriving it from a file path.
- **`legacyName`** — a **keyed object**, not an array, of every USWDS-core construct this token maps
  back to. Fixed key set (a token populates only the keys that historically applied to it, so
  categories with fewer legacy artifacts are unambiguous rather than padded):
    - `mapKey` — the bare Sass nested-map lookup key (e.g. spacing's `"05"`)
    - `privateVar` — the private/internal SCSS variable (e.g. `$color-blue-warm-60v`)
    - `publicVar` — the public consumer-facing SCSS variable/alias (e.g. `$blue-warm-60v`,
      `$system-spacing-small-05`)
    - `shortcode` — the flat USWDS lookup string used in `$system-color-shortcodes` and in
      `$theme-*` settings string references (e.g. `"blue-warm-60v"`)

    This is the **authoritative input to the ADR-0005 SCSS translation layer** and to any tool
    answering "what was the old name for this token?" — the translation layer reads `legacyName` by
    key name, never by position, so a category that only ever had a `publicVar` (typography, utility
    scale) is just as unambiguous as one with all four (color).

- **`formula`** (ADR-0007) and **`disabled`** (ADR-0008) continue under this same key.

System primitive example (canonical key is `vivid-60`; the `60v` short form is
recorded in `legacyName` as the USWDS-core legacy name per ADR-0002):

```json
"vivid": {
  "60": {
    "$type": "color",
    "$value": "#005ea2",
    "$description": "Vivid blue-warm for primary interactive elements; meets WCAG AA on white.",
    "$extensions": {
      "uswds": {
        "tier": "system",
        "legacyName": {
          "shortcode": "blue-warm-60v",
          "privateVar": "$color-blue-warm-60v",
          "publicVar": "$blue-warm-60v"
        }
      }
    }
  }
}
```

The emitted canonical CSS name is `--usa-color-blue-warm-vivid-60` (path segments joined; tier is
never part of the path — see Decision 5); the legacy `--usa-color-blue-warm-60v` alias is emitted as
a `var()` reference by the alias-emitting format (ADR-0002).

**Why explicit `legacyName` rather than convention-derived.** The old names are reconstructible from
the token path _only where naming is regular_. It is not regular: the `vivid` → `60v` suffix
compression (ADR-0002), `default` stripping, the omitted `-90v` vivid slots (ADR-0008), and the
theme string-reference form. An explicit per-token map is the robust source that stops the old↔new
mapping from being rebuilt by fragile string logic — the exact fallback-drift failure mode the
enforcement workstream exists to eliminate. A keyed object (not a positional array, not a scalar) is
required because one canonical token maps back to several USWDS constructs at once, and which
constructs apply varies by category — a positional array has no way to say "this category has no
`mapKey`" other than a fragile convention around array length and order.

## Decision 4: Theme/state alias model (single alias graph)

USWDS theme settings are peculiar: `$theme-color-primary: "blue-warm-60v"` — the _value is a quoted
string reference_ to a shortcode, and that string-reference **is** USWDS's public theming contract
(ADR-0005). The source serves both the canonical `var()` build and the USWDS-core-shaped build from
**one** alias graph, without duplicating string references:

- `theme/color/primary.$value` = a DTCG alias `"{color.system.blue-warm.60v}"` — drives the
  canonical `var(--usa-color-blue-warm-60v)` / `$usa-color-blue-warm-60v` output (Decision 2).
- `theme/color/primary.$extensions.uswds.legacyName` = `{ "publicVar": "$theme-color-primary" }` — the settings var
  it replaces.
- The quoted-string USWDS form (`"blue-warm-60v"`) is **derived** by the ADR-0005 settings format:
  it follows the alias to the target system token and reads that token's `legacyName` shortcode. The
  quoted string is never stored on the theme token.

State tokens that USWDS derives from theme roles (e.g. some link/state colors from `primary`) alias
`theme`, extending the chain `system ← theme ← state`; a forker replacing `theme` sees `state`
follow.

## Decision 5: Three build outputs; tier is not in the name

The build matrix:

| Output          | Prefix   | Names                                            | Purpose                                  |
| --------------- | -------- | ------------------------------------------------ | ---------------------------------------- |
| CSS             | `--usa-` | canonical                                        | web components + agencies                |
| SCSS canonical  | `$usa-`  | canonical                                        | agencies wanting namespaced Sass         |
| SCSS uswds-core | _none_   | legacy names **+ legacy map/settings structure** | drop-in dependency for USWDS core (0005) |
| JSON            | —        | canonical + `legacyName`                         | tooling / AI / runtime                   |

- The **"SCSS without prefix"** deliverable is the full ADR-0005 uswds-core-shaped translation layer
  — separate custom Style Dictionary formats emitting legacy names _and_ the legacy map/settings
  _structure_ (nested `$system-color-*` maps, `$system-color-shortcodes`, `$theme-*: "…" !default`,
  `false` sentinels), gated by the round-trip diff. It is **not** a prefix-stripped flavor of the
  canonical `$usa-` build. Stripping the prefix would yield flat `$blue-warm-vivid-60` scalars that
  lack the map shape `color()`/`set-theme-color()` require — SCSS that looks done but is inert.
  The uswds-core formats derive legacy `$blue-warm-60v` names from each token's `legacyName` list,
  not from the canonical `vivid-60` path form (ADR-0002).
- `prefix` becomes a **per-platform** config value (`usa` for the css/scss-canonical platforms,
  absent for the uswds-core platform), replacing the single hardcoded global constant. The
  uswds-core formats bypass `generateTokenName` entirely and name tokens from `legacyName`.
- **Tier is NOT in the canonical token name.** Because each tier's JSON files nest content directly
  under the category key (`color.blue.5`, not `system.color.blue.5`), `token.path` never contains a
  tier segment in the first place — tier is conveyed by the directory a file lives in (Decision 1)
  and by `$extensions.uswds.tier` (Decision 3), not by DTCG path nesting. `generateTokenName` needs
  no tier-aware logic at all: the existing `${prefix}-${token.path.join("-")}` already produces
  `--usa-color-blue-cool-10`, `--usa-color-primary`, `--usa-color-error` unchanged — non-breaking,
  matching the research doc examples and USWDS's convention that system/theme/state is
  _organizational_, not part of the CSS var name.

**Alternative considered.** _Tier in the name_ (`--usa-color-system-blue-cool-10`,
`--usa-color-theme-primary`) — rejected: it renames every existing `--usa-color-*` token (breaking),
is verbose, and contradicts the research doc's own naming. The directory organizes, the meta
records, the name stays clean.

## Consequences

- **Supersedes plan-01's category-first assumptions.** plan-01 is amended to use `tokens/<tier>/…`,
  per-tier-per-category exports, and the `$extensions.uswds` meta convention. Color is Phase 1's
  first category.
- **Refines ADR-0001.** Per-category `dist/{css,scss,json}/colors.*` exports become
  per-tier-per-category (`system/color`, `theme/color`, `state/color`, …). The standalone
  `@uswds/tokens` package and versioning policy in ADR-0001 are otherwise unchanged.
- **Semantic tier (ADR-0003) lands in `theme/`/`state/`.** The prominence/adaptive `light-dark()`
  work attaches to whichever tier holds the role tokens; it does not reintroduce a `semantic/`
  directory.
- **Migration source mapping:** `system/color/*` ← `uswds-system-tokens.csv`; `theme/color/*` ← the
  branding `$theme-color-*` rows; `state/color/*` ← the feedback `$theme-color-*` rows.
- **Per-platform `prefix` config changes** are required, plus the new uswds-core custom formats —
  tracked as build work, not done in this planning pass. `generateTokenName` itself is unchanged:
  tier is directory/metadata only (Decision 5) and was never part of `token.path`.
- **Deferred (out of scope here):** removing inline fallback tokens from the web components.
- **Enforcement:** a token whose `tier` is not one of `system`/`theme`/`state`, or a `theme`/`state`
  token whose `$value` is not an alias, or any token missing a required `legacyName` key where the
  translation layer needs one, is a validation failure — folded into plan-01 Phase 6.
