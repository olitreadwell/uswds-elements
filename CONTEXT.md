# uswds/uswds-elements context
> refreshed 2026-10-11 | upstream default: develop @ 9e4afcf793a587bd35db658c5f0b9532052e6585

## Identity & policies
- upstream: uswds/uswds-elements, default branch develop, TypeScript (Lit web components; npm workspaces: `packages/elements` + `packages/tokens`), English-first? yes (all issues/docs/PRs English; UI ships en + es)
- CLA/DCO: none found in CONTRIBUTING or .github (no CLA bot, no DCO sign-off requirement)
- AI-assisted PR policy: unstated in CONTRIBUTING and the PR template (no AI ban, no AI-disclosure requirement; no `ai-generated`/`no-ai` labels)
- signed commits required: no (fork PRs #1/#2 were unsigned and passed; no required_signatures branch protection seen)
- PR template: .github/PULL_REQUEST_TEMPLATE.md (present; "Web components : <summary>" title convention)
- external tracker: GitHub
- CI: GitHub Actions (formatting.yml, ui-test.yml, playwright.yml, codeql.yml). `formatting.yml`/`ui-test.yml` run on `push`; substantive gate = prettier:js + prettier:md + stylelint + storybook tests + vitest (`test:ci`).

## Maintainer / contribution gate — README says "welcome", CONTRIBUTING says "not yet"
CONTRIBUTING.md (UNCHANGED at HEAD 9e4afcf; the 2026-09-28 moderation-statement addition c427831 was reverted by #332 on 2026-10-01) says, verbatim:
- "**This repo is currently in beta and not yet ready for community code contributions.**"
- "we'd prefer you do not submit pull requests unless you're in active partnership with us"
- "In this repo, we're not accepting code contributions from the broader community yet (other than the aforementioned limited partnerships). Check back later in 2026 for more info."

The docs-site contributor page `packages/elements/storybook/contributing.mdx` (imports CONTRIBUTING.md verbatim) opens with: "This information is for USWDS Core team members contribute to the USWDS Elements project."

CONFLICT (unchanged, flagged for Oli): README.md (revised 2026-07-21) says "Contributions are now welcome, though the USWDS Elements review process prioritizes USWDS Open Source Community member and USWDS partnership contributions." Data still shows no external community merge (see Maintainer picture), but maintainers now publicly INVITE a PR for the banner web component (issue #275 comment, below).

## Decision (2026-10-11) — GO for a fork-staged PR (promotion stays Oli's call)
Previous runs (2026-08-26 `dropped-maintainers-ban-community-prs`, 2026-09-30 `skipped`) treated the CONTRIBUTING banner as a hard block. This run escalates because there is now a MAINTAINER-ENGAGED, maintainer-authored, unassigned open issue with a concrete checklist, plus an explicit, on-record invitation to PR the exact component:
- #191 "usa-banner icon aria-label update" — filed 2025-10-21 by maintainer ethangardner; unassigned; label Q4 2025; open. Body is an actionable 3-item checklist (remove "icon" from the lock aria-label; localize it for `lang="es"`; update the CustomContent story's French translation). No open/merged/closed PR addresses it.
- #275 "Improve heading semantics of banner component" — open, unassigned; ethangardner 2026-04-30: "For the Banner Web Component version `<usa-banner>`, we'd happily accept a PR to fix it"; annepetersen moved it to uswds-elements 2026-06-01.
The work is fork-internal only (never upstream), the CONTRIBUTING tension is a PROMOTION gate for Oli, and the pick is small/verifiable (unit test). Proceed; flag the README/CONTRIBUTING conflict and the Q4-2025 label for Oli.

## Conventions (verified from merged PRs)
- branch naming: mixed topic branches (`task/<n>-<slug>`, `docs/<slug>`, `fix/<slug>`); `fix/<type>/<kebab>` is a safe fallback.
- PR title: "Web components : <summary>" (per .github/PULL_REQUEST_TEMPLATE.md).
- commit style: mixed — plain imperative (ethangardner: "move components to packages", "add new sections to PR template") and Conventional Commits (ryparker: "docs: ...", "revert: docs: ..."). Either reads native.
- tests: repo root `npm run test:ci` (vitest workspaces: elements 36 tests + tokens 13 tests). Lint/format: `npm run prettier:js`, `npm run prettier:md`, `npm run stylelint`. Build: `npm run build`. Storybook tests: `npm run test:storybook:ci`.
- Node: repo `.nvmrc` = v22.21.1 — `npm ci` FAILS on Node 20 (husky exit 127 / style-dictionary needs >=22). Use Node 22.
- changesets: repo is in changeset PRE mode (`.changeset/pre.json`, tag `alpha`, baseBranch develop). README recommends a changeset per PR; PR #318 carried several, PR #189 did not. One is safe/expected for a component change.
- how outside PRs actually get merged: they don't yet (core team + bots only) — see Maintainer picture.

## Maintainer picture
- active core team: ethangardner, ryparker, annepetersen, ericsorenson (chandracarney, heymatthenry, iamjolly on a11y/testing epics)
- newest merges: #332 revert/docs (ryparker 2026-10-01), #329 docs (ryparker 2026-09-18), #327 PR template (ethangardner 2026-09-10), #321/#318 npm-workspaces restructure + tokens extraction (ethangardner 2026-09-10). Everything else in the last 60 days is dependabot.
- zero external community merges in the last 60 days; external PRs #186/#244 closed unmerged, #40 (2024-07) still open.
- actively working on: token migration epic (#314 + #301–#320 cluster), Playwright/visual-regression plumbing (#297/#298). Avoid that territory.

## Issue-area health
- #191 (usa-banner lock aria-label) — quiet, unassigned, maintainer-authored, concrete; NO redesign/contested signals in-thread. One non-maintainer comment (caseywatts) floats dropping the label entirely, but the maintainer's checklist says keep+localize → follow the checklist. GO.
- #275 (banner heading semantics) — quiet, maintainer invited a PR, but larger (render/markup semantics); left for a future distinct PR.
- #297/#298 (Playwright report URL / version drift) — core-team infra; #297 needs 14 visual baselines regenerated via a workflow; not locally reproducible. Skip.
- #246 (Help wanted docs) — assigned to iamjolly + chandracarney (core team). Not ours.
- #314/#301–#320 (tokens epic) — core-team, complex, in-flight. Skip.

## Gap ledger (dedupe — READ FIRST, never re-pick)
- 2026-08-26 self-found a11y (banner aria-controls) — pr-opened (fork #2, `fix/usa-banner-aria-controls-id-20260826-124837`); lesson: fork #2 later went `dirty` after the Sept restructure moved `src/` → `packages/elements/src/`; needs a rebase before any promotion.
- 2026-08-26 contribution gate — dropped-maintainers-ban-community-prs.
- 2026-09-25/26/27 engine-failure — error (no trace).
- 2026-09-30 trivial pass — skipped (repo closed to community PRs; >=3 genuine fixes found but not opened).
- 2026-10-11 #191 (usa-banner lock aria-label) — pr-opened (fork PR, `fix/usa-banner-lock-icon-aria-label`); lesson: maintainer-authored checklist issue + on-record invitation in #275 flipped the gate to GO; CONTRIBUTING "not accepting community code PRs yet" still stands and is Oli's promotion-time call.

## Mined gaps (discovered, not yet attempted)
- 2026-09-30 two dead links in `packages/elements/storybook/contributing.mdx` (lines 22 and 130): `https://github.com/uswds/uswds-elements/tree/develop/e2e` returns 404 (moved to `packages/elements/e2e` in the Sept 2026 restructure) — status: proposed
- 2026-09-30 README.md CAUTION block: `[OMB Memo M-23-22](<[url](url)>)` is a malformed nested markdown link (renders broken) — status: proposed
- 2026-09-30 README.md install step 4 heading says "Add `@uswds/uswds` to your project's package.json" but the command installs `@uswds/elements` — status: proposed
- 2026-09-30 typo "documentaton" -> "documentation" in `packages/elements/CHANGELOG.md:13` (changesets-generated; edit with care) — status: proposed
- 2026-10-11 #275 banner heading semantics (maintainer invited a PR for `<usa-banner>`; larger markup/semantics change) — status: proposed
- codespell false positives to ignore in this repo: "oficial" (correct Spanish in usa-banner `es` strings), "informations" (correct French in usa-banner stories).
