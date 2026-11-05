# Implementation plan: MYCELIUM living diorama

Status: implementation authorized on 2026-11-04 using subagent-driven development; add real Git history from a user-selected repository.

## Overview
Make the existing browser prototype feel like a place you can explore. The first release adds a cinematic descent, visibly growing trees during replay, and a sculpted floating island. Keep the existing provenance inspector and deterministic world mapping. Desktop, SQLite, and complete Git ingestion remain separate unfinished MVP work.

## Creative directions
1. Living diorama (recommended first): orbital overview, tree close-ups, growth choreography, cliffs and hanging roots. Works with the existing commit events and gives every selection a spatial payoff.
2. Underground observatory (later): peel back the island to reveal luminous parent-child roots and merge junctions. More distinctive as an information view, but requires verified parent metadata and complete enough topology.
3. Living archipelago (later): travel between repository islands with distinct seeded silhouettes. Requires multi-project identity/storage and explicit relationships before drawing bridges.

## Proposed experiences
- Cinematic descent: select a tree and glide to a framing that keeps its canopy and inspector visible. A Home action returns to the overview. Manual orbit cancels the move immediately.
- Growth choreography: a replayed commit sprouts, opens its canopy, and emits one restrained decorative pulse. Scrubbing settles directly at the chosen state instead of replaying every missed animation.
- Sculpted island: a tapered rocky underside, strata, hanging roots, and a faint mist layer make the existing disk feel suspended in space. These are decoration, not repository metrics.
- Distinct botanical forms: seeded fern, mushroom, and branching-tree silhouettes preserve each commit's ID and placement. Species are decorative, not inferred code categories or developer scores.
- Time lens (later): pin an earlier cursor and show later additions as translucent outlines in the same coordinates. Label the two dates and keep selection tied to actual events.
- Root observatory (later): expose parent links below ground, with merge junctions only where imported metadata proves them. Current branch-group trails do not prove ancestry.
- Observatory creature (optional later): one explicitly decorative moth follows the selected tree. No implication that it is a real coding agent.
- Weather and archipelago (later): source-backed test storms and multi-repository travel stay behind their separate data milestones. No invented relationships or inferred productivity.

## Architecture decisions
- Keep authoritative projection pure in src/domain.ts and rendering in src/App.tsx, following AGENTS.md. Frame interpolation never writes world state or persisted events.
- Keep existing event IDs and x/z placement unchanged for the first pass. Decorative shape derives from stable IDs and a documented visual seed.
- Use a bounded set of shared geometries and instanced tree parts. Picking must map instances back to stable event IDs, including after rewind.
- Use one camera owner. Orbit input cancels scripted travel; reduced motion snaps to the destination without automatic rotation or decorative animation.
- Pause freezes growth animation. Manual scrub renders settled geometry immediately. Reduced motion disables animation without disabling historical navigation or semantic playback.
- Do not adopt new graphics dependencies before profiling the installed stack. Decide any shader or postprocessing addition from measured cost.
- Preserve readable provenance and a lightweight scene option. Do not rely on glow or color alone for selection.

## Ordered task list
- [x] Task 1: Make the scene motion-safe and record a performance baseline.
- [x] Task 2: Add a cancellable camera descent to selected commits.
- [ ] Checkpoint A: navigation and motion preferences work together.
- [x] Task 3: Render a varied, instanced forest with stable picking.
- [ ] Task 4: Choreograph growth during event replay.
- [ ] Checkpoint B: dense forest, selection, and history remain correct.
- [ ] Task 5: Sculpt the floating island and add bounded atmosphere.
- [ ] Checkpoint C: visual review, measured performance, tests and build.

Full acceptance criteria and verification are in tasks/todo.md. Each task is a usable vertical slice. Implement sequentially because the slices share src/App.tsx; do not assign simultaneous edits to that file.

## Risks and mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Scene effects exhaust frame budget | High | Baseline first; shared geometry, bounded instances, cheaper quality option; record actual frame timings |
| New camera competes with orbit controls | Medium | One owner; pointer input cancels flight; test interruption and Home |
| Growth or scrubbing changes authoritative state | High | Separate decorative animation from pure projection; test rewind and repeatability |
| Forest variation hides identity or selection | Medium | Preserve placement and ID mapping; keyboard selection and clear selected outline |
| Island detail obscures commits | Medium | Keep tree anchor plane; decorative silhouette below it; compare overview and close-up |
| Attractive roots imply false ancestry | High | Defer factual network until parent metadata exists; label purely decorative roots |

## Verification and limits
Run npm test and npm run build after each implementation slice. Record actual results and limits in docs/PROGRESS.md. Capture 360-event and 1,000-event synthetic scenarios at a stated device, browser, viewport and pixel ratio; report median/p95 frame time and draw calls during orbit and replay. A 60 FPS target is not a verified result. Evaluate 10,000 events only as a later stress test with aggregation, not a promised capability of this release.

Planning inspection only: source and project docs were read; no browser rendering or performance measurements were performed. Tests and build were not rerun for this documentation-only proposal.

## Open decisions for review
- Recommended first scope is the five-task living diorama pass. Underground topology and archipelago are future proposals.
- Reference laptop/browser and acceptable performance floor must be recorded in Task 1 before graphics costs are accepted.
- Keep the existing green night palette initially; palette themes can wait until geometry and navigation work.

## Execution amendment
Implement tasks 1–5 sequentially with independent reviews, then Task 6 for real Git metadata. User approval to execute replaces intermediate human checkpoint pauses. Use a native-tool-managed isolated worktree after recording the existing untracked prototype as the baseline. Do not push or merge. Real-history repository selection is pending; do not infer authorization for other local repositories.
