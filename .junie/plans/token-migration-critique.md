---
sessionId: session-260722-220214-d0wc
---

# Review Findings

### Overview

This review provides a comprehensive analysis of the Architectural Decision Records (ADRs) and Pull Request plans (PRs) in `plans/token-migration/`. While the proposed architecture is extremely thorough, modular, and well-designed, a deep-dive analysis of the files has revealed several **contradictions, syntax errors, and technical gaps** that must be resolved before proceeding with Phase 1 execution.

Additionally, we have validated all token-migration instructions, ADRs, and PR drafts against the official **Design Tokens Community Group (DTCG) Draft Specifications (including Format, Color, and Resolver modules)**. This validation has surfaced several critical non-compliance issues and areas where our custom solutions deviate from the emerging standards.

---

### 1. Color Family Completion vs. False Sentinels Contradiction

- **The Contradiction:**
    - **ADR-0008** (Decision, Role 1) explicitly states: **"Role 1 (nonexistent primitives, e.g. -90v vivids): alternative (a) — omit. They are not tokens;..."** This is chosen so that they simply do not exist in `$system-color-shortcodes`, causing standard out-of-bounds error behavior during map lookup.
    - **PR 2** (`prs/pr-02-color-family-completion.md` step 2) contradicts this by directing the developer to **include** them in the JSON source: _"For each family that has a -90v entry in the CSV resolving to false ... add a disabled placeholder in the family JSON: ... `"disabled": true`"_ so that the CSV reconciliation script can account for them.
- **The Problem:** PR 2 compromises the clean design of ADR-0008. It pollutes the JSON files with nonexistent values purely to accommodate a CSV checking script, which violates the "single source of truth" and "clean token schema" principles.

---

### 2. Malformed DTCG Alias Syntax in Spacing (PR 3)

- **The Error:**
    - **PR 3** (`prs/pr-03-spacing-scale-formulas.md` step 1) defines the `card` named spacing token with double-nested value wrapping:
        ```json
        "card": {
            "$value": { "$value": "{spacing.2}" },
            "$extensions": { "uswds": { "tier": "system" } }
        }
        ```
- **The Problem:** Under the Design Tokens Community Group (DTCG) specification, alias references are expressed as plain strings wrapped in curly braces (e.g., `"$value": "{spacing.2}"`). Wrapping `$value` in another object with a `$value` key is structurally malformed and will break standard Style Dictionary resolution.

---

### 3. Non-Standard DTCG `$type: "percentage"` (PR 7)

- **The Gap:**
    - **PR 7** (`prs/pr-07-grid-widths.md` step 1) specifies `"$type": "percentage"` for the 12-column fraction scale layout grid widths, but immediately notes: _"DTCG does not define a percentage type natively. ... Confirm at build time; use whatever emits the correct % suffix in CSS."_
- **The Problem:** Leaving the `$type` unresolved and using a non-standard `$type: "percentage"` violates strict DTCG compliance. Other tools or standard parsers consuming the raw JSON will fail schema validation.

---

### 4. Tier Path Dropping vs. JSON Root Keys (PR 0 & ADR-0010)

- **The Gap:**
    - **PR 0** and **ADR-0010** update `generateTokenName` to strip tier segments (`system`, `theme`, `state`) from `token.path` before joining, showing an example path: `["system","color","red","vivid","60"]` → `usa-color-red-vivid-60`.
    - However, the actual JSON structures defined in **PRs 2, 3, 4, 6, and 7** do **not** wrap their keys with the `"system"` key. For example, `z-index.json` starts with `"z-index": { ... }` and `spacing.json` starts with `"spacing": { ... }`.
- **The Problem:** Since Style Dictionary builds token paths strictly from JSON key nesting, the parsed `token.path` will be `["color", "blue", "5"]` or `["spacing", "05"]`. Because `"system"` is never in `token.path`, the tier-dropping logic in `generateTokenName` is dead/inert code.

---

### 5. Inconsistent `legacyName` Metadata Taxonomy

- **The Gap:**
    - The `legacyName` metadata list serves as the authoritative source of truth for back-mapping (ADR-0010 Decision 3). However, different PRs define its contents inconsistently:
        - **PR 2 (Color):** `["blue-10", "$color-blue-10", "$blue-10"]` (includes shortcode, private, and public Sass variables).
        - **PR 3 (Spacing):** `["$system-spacing-small-05", "05"]` (includes variable and bare key `"05"`).
        - **PR 4 (Typography):** `["$system-type-scale-1"]` (only includes the variable).
- **The Problem:** Without a strict taxonomy, different categories will carry different metadata styles, which will cause downstream failures in the automated ADR-0005 translation formats that expect a uniform back-map schema.

---

### 6. Floating-Point Math Rounding in CI Verification

- **The Gap:**
    - **PR 3** adds `validate-spacing-formulas.js` to verify formula-tagged spacing values.
- **The Problem:** In JavaScript, simple floating-point operations (e.g., `0.5 * 0.5` or `0.5 * 1.5`) are prone to precision representation limits. Directly asserting equality (e.g., `computed === token.$value`) without an epsilon tolerance or rounding to a fixed precision will cause false positives and fail the CI build.

---

### 7. Core Submodule/Checkout Source Gap

- **The Gap:**
    - **ADR-0005** and **plan-01** require a "round-trip verification" compile-and-diff integration test in CI, swapping generated SCSS into USWDS core and compiling with Dart Sass.
- **The Problem:** There is no specification of how the CI runner will access USWDS core's codebase. Without defining whether this will be a git submodule, a pinned devDependency, or a cloned repo, the CI integration test cannot be configured or run.

---

### 8. Non-Standard Dimension Units (`"em"`) in Letter Spacing (DTCG Format Spec Gaps)

- **The Gap:**
    - **PR 4** (`prs/pr-04-typography-sources.md` step 4) defines the `letter-spacing` scale under `$type: "dimension"`, using `"em"` as the unit (e.g., `{"value": 0.025, "unit": "em"}`).
- **The Problem:** Under the official **DTCG Format Module (Section 8.2)**, the only supported units of measurement for `dimension` tokens are `"px"` and `"rem"`. Utilizing `"em"` is a non-standard unit of distance, which will cause strict DTCG validators and parsers to reject the design token source.

---

### 9. String Keyword `"initial"` as Dimension Value (DTCG Format Spec Gaps)

- **The Gap:**
    - **PR 4** (`prs/pr-04-typography-sources.md` step 4) includes a letter-spacing token named `auto` with `"$value": "initial"`. Since it is grouped under `"letter-spacing"`, it inherits `$type: "dimension"`.
- **The Problem:** The **DTCG Format Module (Section 8.2)** states that the value of a `dimension` token must be an object containing a numeric `value` and a valid `unit` string. A raw string like `"initial"` is structurally invalid for the `dimension` type. Standard compilers and translators expecting a structured object will fail when processing this token.

---

### 10. Non-Standard Hex Strings in Color Tokens (DTCG Color Module Gaps)

- **The Gap:**
    - Throughout our migration plans (including **PR 2** and all existing color JSON files like `blue.json`), color tokens are defined using simple hex strings (e.g., `"$value": "#eff6fb"`).
- **The Problem:** Under the stable **DTCG Color Module (Section 4)**, color tokens must represent their values using a structured object containing `colorSpace` (e.g., `"srgb"`, `"oklch"`, `"hsl"`), `components` (numeric array), and optionally `alpha` and fallback `hex`. Simple hex strings are considered legacy/draft syntax, which limits deep automated color transformations (such as relative colors or color-space compilation).

---

### 11. Proprietary Mode-Aware Extension vs. Standard Resolver (DTCG Resolver Module Gaps)

- **The Gap:**
    - **ADR-0003** handles dark-mode/mode-aware semantic tokens using a custom property inside the extension block: `"$extensions": { "uswds": { "dark": "{color.blue.30}" } }`, while `$value` holds the light-mode primitive reference.
- **The Problem:** The stable **DTCG Resolver Module** provides a formal, platform-agnostic specification for managing multi-context (light/dark themes, varying viewports) design systems using a separate `.resolver.json` document. A resolver document organizes tokens in `sets` and custom `modifiers` (e.g., a `"theme"` modifier with `"light"` and `"dark"` contexts) and defines their merge order in `resolutionOrder`. Storing mode overrides in a custom `$extensions` namespace breaks interoperability with standard DTCG-compliant toolchains (e.g., Figma variables, Tokens Studio, Terrazzo).

---

# Technical Recommendations

### Actionable Resolutions

To resolve the identified review findings, the following concrete design refinements should be incorporated into the token-migration plans:

---

### 1. Enforce Omission of vivid-90v in JSON (Fixes Finding 1)

- **Action:** Update the specification in **PR 2** step 2 to omit all `-90v` keys entirely from the JSON files.
- **Action:** Update the `reconcile-colors.js` script to skip nonexistent `-90v` entries or compare against an explicit skip-list in the script itself, keeping the JSON files 100% compliant with ADR-0008.

---

### 2. Correct Spacing Alias Syntax (Fixes Finding 2)

- **Action:** Modify `prs/pr-03-spacing-scale-formulas.md` to define named spacing aliases using standard DTCG syntax:
    ```json
    "card": {
        "$value": "{spacing.2}",
        "$extensions": {
            "uswds": {
                "tier": "system",
                "legacyName": ["$system-spacing-large-card"]
            }
        }
    }
    ```

---

### 3. Resolve Grid Percentage Type (Fixes Finding 3)

- **Action:** Standardize `layout-grid-widths.json` in **PR 7** to use either:
    - `"$type": "dimension"` with `unit: "%"` if Style Dictionary is configured to handle percentage dimensions correctly.
    - `"$type": "number"` with a detailed `$description` noting it represents a percentage, and let the Style Dictionary output format append the `%` suffix during build time.

---

### 4. Align Style Dictionary Path Prepending (Fixes Finding 4)

- **Action:** Either wrap the JSON files in a top-level tier key (e.g., `"system": { "spacing": { ... } }`) so that `"system"` naturally enters `token.path`, OR document in `style-dictionary.config.js` that a custom parser/transformer must be registered to prepends the tier name (extracted from the file directory) to `token.path`. This ensures the tier-dropping logic in `generateTokenName` works as intended.

---

### 5. Define `legacyName` Taxonomy and Strict Validation (Fixes Finding 5)

- **Action:** Establish a strict format rule for `$extensions.uswds.legacyName` in ADR-0010:
    - Index 0: The Sass nested map lookup key (or flat shortcode lookup key).
    - Index 1: The private `$color-*` style SCSS variable name.
    - Index 2: The public SCSS variable name.
- **Action:** Write a JSON schema validator in Phase 6 to automatically assert that all `legacyName` lists contain the correct number and formats of strings.

---

### 6. Introduce Epsilon Tolerance in Spacing Validation (Fixes Finding 6)

- **Action:** Specify that `validate-spacing-formulas.js` in **PR 3** must use an epsilon comparison:
    ```js
    const Math_Tolerance = 1e-5;
    const isMatched = Math.abs(computedValue - tokenValue) < Math_Tolerance;
    ```
    This prevents false CI pipeline failures due to JS floating-point issues.

---

### 7. Clarify USWDS Core Source Checkout in CI (Fixes Finding 7)

- **Action:** Specify that the token-migration CI pipeline will checkout a pinned, stable release tag of USWDS core (using GitHub Actions checkout step) to a scratch directory to execute the round-trip compilation and diffing test.

---

### 8. Resolve Letter-Spacing Dimension Units (Fixes Finding 8)

- **Action:** To maintain DTCG compliance for `letter-spacing` while allowing Style Dictionary to output `"em"` values:
    - Define the tokens with `$type: "number"` and use a custom Style Dictionary transformer to append the `em` suffix at build time.
    - Alternatively, declare `"em"` as a custom supported unit in the validation config, acknowledging it as a necessary extension of the DTCG standard for web typography.

---

### 9. Correct Letter-Spacing String Keywords (Fixes Finding 9)

- **Action:** Refactor `letter-spacing.json` in **PR 4** to ensure the `auto` token does not inherit the parent `$type: "dimension"`.
    - Either isolate `auto` into its own non-typed block, or explicitly define it with `$type: "number"` (with `$value: 0` or similar fallback) and let the translation layer handle special keyword cases.

---

### 10. Map Out a Structured Color Transition Plan (Fixes Finding 10)

- **Action:** Proceed with simpler hex strings initially in Phase 1 and 2 to minimize migration friction for the 300+ legacy colors.
- **Action:** Incorporate a build-time utility or a custom Style Dictionary parser in a later phase to dynamically convert these hex strings into fully compliant sRGB structured objects (e.g., mapping `"#eff6fb"` to `{"colorSpace": "srgb", "components": [0.937, 0.965, 0.984], "hex": "#eff6fb"}`), satisfying strict DTCG Color Module 2025.10.

---

### 11. Establish a Standard `.resolver.json` Specification Bridge (Fixes Finding 11)

- **Action:** While keeping our custom `$extensions.uswds.dark` implementation internally to easily compile native CSS `light-dark()` functions, build a lightweight build script (`generate-resolvers.js`) in Phase 6.
- **Action:** This script will programmatically translate our single light/dark token files into a standard-compliant `.resolver.json` document with separate `sets` and `modifiers` (such as light and dark themes). This guarantees 100% interoperability with external DTCG design tools like Figma or Tokens Studio without sacrificing our optimal runtime build setup.

---

# Delivery Steps

### Step 1: Resolve ADR/PR Contradictions and Syntax Errors in JSON Sources

Nonexistent vivid-90v primitives are excluded from JSON, and spacing aliases use correct DTCG syntax.

- Update PR 2 to omit red-90v and other -90v vivid grades entirely from the color family JSON files, in alignment with ADR-0008.
- Update the reconcile-colors.js script to skip or explicitly ignore nonexistent -90v grades during CSV reconciliation instead of expecting placeholder entries in the JSON.
- Correct the DTCG alias syntax for the card token in PR 3 (tokens/system/spacing/spacing.json) from "$value": { "$value": "{spacing.2}" } to "$value": "{spacing.2}".

### Step 2: Standardize DTCG Compliance and Token Path Traversal

Grid width tokens use standard DTCG dimension types, and tier-dropping is clarified.

- Replace "$type": "percentage" in layout-grid-widths.json (PR 7) with "$type": "dimension" and unit: "%" or "$type": "number" to ensure strict DTCG validation schema compliance.
- Document or implement how Style Dictionary prepends the tier (system/theme/state) to token.path so that generateTokenName dropping tier segments is functional rather than dead code.
- Verify that all tokens resolved at build time correctly match their expected CSS custom property names (e.g., --usa-color-blue-5).

### Step 3: Resolve Typography Dimension and Unit Gaps

Letter-spacing tokens use compliant units or custom types, and string keywords are isolated from dimension groups.

- Update pr-04-typography-sources.md to change letter-spacing tokens using non-standard "em" units to use either custom transformers with $type: "number" or a custom type.
- Fix the auto letter-spacing token to bypass $type: "dimension" inheritance, avoiding raw string value "initial" under a dimension type.

### Step 4: Harmonize legacyName Metadata Across Categories

Legacy name arrays across color, spacing, and typography follow a unified, robust schema.

- Establish a strict taxonomy and validation schema for the legacyName list in $extensions.uswds.
- Align spacing and typography tokens' legacyName arrays so they consistently include (or exclude) bare keys, Sass map keys, and shortcode keys.
- Ensure that the ADR-0005 SCSS translation formats can programmatically parse these legacyName arrays without custom overrides per category.

### Step 5: Bridge Proprietary Modes with Standard DTCG Color and Resolver Specs

Custom light-dark formats are mapped to standard DTCG resolver documents, and structured colors are designed.

- Document and implement a conversion utility or parser option to compile our custom $extensions.uswds.dark format into a fully compliant standard .resolver.json document.
- Provide a migration path (using a script) to transform raw hex-string colors into compliant structured srgb color objects as defined in the DTCG Color Module 2025.10.

### Step 6: Enhance Validation Scripts and CI Integration Tests

CI validating scripts handle floating-point math correctly, and the USWDS core compile test has a clear source path.

- Update validate-spacing-formulas.js to handle floating-point arithmetic rounding errors by using an epsilon tolerance of 1e-5 or rounding to 4 decimal places.
- Define the exact mechanism (e.g., git submodule or pinned npm devDependency) for the CI to check out USWDS core code for the round-trip compilation and diffing test.
- Add the integration test suite to the GitHub Actions workflow file to guard against style regression on token changes.
