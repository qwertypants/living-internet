# Tasks: MYCELIUM living diorama

Execution authorized. Unfinished work remains unchecked. See plan.md for design and deferred concepts.

## Task 1: Make motion preferences effective

**Description:** Make reduced motion apply to the actual 3D scene and establish a reproducible performance baseline.

**Acceptance criteria:**
- [x] System preference and the existing override control camera rotation, stars, tree movement and future transitions.
- [x] Historical navigation and playback remain usable with reduced motion; decorative motion is disabled.
- [x] Record device, browser, viewport, pixel ratio, draw calls and frame timing for 360 and 1,000 synthetic events, including any failed case.

**Verification:**
- [x] `npm test` passes, including relevant behavior tests.
- [x] `npm run build` passes.
- [x] Manual check: Toggle motion while orbiting and replaying; confirm no automatic scene movement and record baseline measurements.
- [x] Record actual results and limits in `docs/PROGRESS.md`.

**Dependencies:** None

**Files likely touched:**
- `src/App.tsx`
- `src/App.test.tsx (new)`
- `docs/PROGRESS.md`

**Estimated scope:** Medium, 3–5 files.

## Task 2: Descend to a selected commit

**Description:** Add a short camera flight to the selected tree and an accessible Home action, retaining the provenance inspector.

**Acceptance criteria:**
- [x] Selection frames the chosen tree and keeps the inspector readable at desktop and narrow widths.
- [x] Manual orbit interrupts a flight; Home restores overview; repeated selections never leave conflicting camera animation running.
- [x] Reduced motion snaps immediately; rewind that removes the selected tree clears its focus safely.

**Verification:**
- [x] `npm test` passes, including relevant behavior tests.
- [x] `npm run build` passes.
- [x] Manual check: Select an edge tree, interrupt a flight, select another, rewind before its event, and return Home with pointer and keyboard.
- [x] Record actual results and limits in `docs/PROGRESS.md`.

**Dependencies:** 1

**Files likely touched:**
- `src/App.tsx`
- `src/App.test.tsx`
- `docs/PROGRESS.md`

**Estimated scope:** Medium, 3–5 files.

## Checkpoint: After task 2

- [ ] All tests and production build pass.
- [ ] Import/demo, selection and timeline flows still work; synthetic provenance remains visible.
- [ ] Independently review the result and record measured limits before the next phase.

## Task 3: Create a varied instanced forest

**Description:** Replace per-tree mesh duplication with a bounded set of shared botanical forms and stable instance selection.

**Acceptance criteria:**
- [x] At least three decorative silhouettes are seeded by stable event IDs without changing existing positions.
- [x] Click and keyboard selection resolve to the correct event after rewind, fast-forward and input reordering.
- [x] Record draw calls and frame timings against Task 1 at identical settings; retain a simpler forest quality option.

**Verification:**
- [x] `npm test` passes, including relevant behavior tests.
- [x] `npm run build` passes.
- [x] Manual check: Inspect overlapping trees and forest edges at both dataset sizes; compare performance and verify selected SHA after rewind.
- [x] Record actual results and limits in `docs/PROGRESS.md`.

**Dependencies:** 2

**Files likely touched:**
- `src/App.tsx`
- `src/domain.ts`
- `src/domain.test.ts`
- `src/App.test.tsx`
- `docs/PROGRESS.md`

**Estimated scope:** Medium, 3–5 files.

## Task 4: Animate commits growing during replay

**Description:** Make playback reveal new trees with restrained growth and one decorative pulse, using a bounded animation state separate from event projection.

**Acceptance criteria:**
- [ ] Newly revealed trees grow from their fixed anchors; replay speed does not change final shape, position or event identity.
- [ ] Pause freezes growth; manual scrub settles immediately; replay from the beginning repeats the same final scene.
- [ ] Reduced motion renders settled shapes, and animation state is bounded to active transitions rather than accumulated history.

**Verification:**
- [ ] `npm test` passes, including relevant behavior tests.
- [ ] `npm run build` passes.
- [ ] Manual check: Replay at each speed, pause mid-growth, scrub backward and forward, and compare selected event and final forest with direct projection.
- [ ] Record actual results and limits in `docs/PROGRESS.md`.

**Dependencies:** 3

**Files likely touched:**
- `src/App.tsx`
- `src/App.test.tsx`
- `src/domain.test.ts`
- `docs/PROGRESS.md`

**Estimated scope:** Medium, 3–5 files.

## Checkpoint: After task 4

- [ ] All tests and production build pass.
- [ ] Import/demo, selection and timeline flows still work; synthetic provenance remains visible.
- [ ] Independently review the result and record measured limits before the next phase.

## Task 5: Sculpt the island silhouette

**Description:** Add seeded rock strata, a tapered underside, hanging decorative roots and restrained mist while preserving stable tree anchors.

**Acceptance criteria:**
- [ ] Overview and close-up reveal depth without floating tree bases or obscured selection; underside roots are explicitly decorative.
- [ ] Details are reproducible from a fixed seed; reduced motion and lower quality remove optional animated effects.
- [ ] Profile the completed scene against baseline; document costs and unresolved limitations without claiming unmeasured FPS.

**Verification:**
- [ ] `npm test` passes, including relevant behavior tests.
- [ ] `npm run build` passes.
- [ ] Manual check: Inspect silhouettes at all allowed orbit angles and narrow viewports; compare normal, reduced-motion and lower-quality rendering.
- [ ] Record actual results and limits in `docs/PROGRESS.md`.

**Dependencies:** 4

**Files likely touched:**
- `src/App.tsx`
- `src/App.test.tsx`
- `docs/PROGRESS.md`

**Estimated scope:** Medium, 3–5 files.

## Checkpoint: After task 5

- [ ] All tests and production build pass.
- [ ] Import/demo, selection and timeline flows still work; synthetic provenance remains visible.
- [ ] Independently review the result and record measured limits before the next phase.


## Task 6: Load real Git history

**Description:** Provide a bounded local metadata exporter using the Git executable and a validated JSON import path in the browser. The user authorized all their commits across every local repository. Inventory source repositories without writing to them; import only matching authored commits. Support packed histories without a native desktop rewrite.

**Acceptance criteria:**
- [ ] Export all commits authored by configured user Git identities across all refs in discovered local repositories; process history in bounded batches without silently truncating. Discover under /Users/wilkins/Sites first and deduplicate linked worktrees using their Git common directory. Report aliases, unreadable repositories and uncovered roots as limitations. Read identities locally for filtering but never export personal identifiers. Use Git using argument arrays, no shell interpolation, no repository writes; capture full SHA, timestamp and parent IDs. Subjects are excluded by default and opt-in only. Do not export source, diffs, authors, email, remote URLs or absolute paths.
- [ ] Browser validates the versioned JSON envelope before replacing its events; deterministic identity, replay and provenance work with real metadata, and malformed input leaves existing data intact. Do not imply a branch membership or parent relationship unsupported by exported metadata.
- [ ] Read and load the discovered real repositories; keep actual metadata in ignored local files and browser storage, never commits. Verify sampled SHAs/counts against read-only Git output and record actual limits.

**Verification:**
- [ ] Tests exercise a temporary repository with packed commits, repeat exports, malformed imports and export bounds.
- [ ] `npm test` and `npm run build` pass.
- [ ] Real-history loading and selection verified, with privacy and packed-history limits recorded in docs/PROGRESS.md.

**Dependencies:** 5; repository inventory and configured author identities.

**Files likely touched:** scripts/export-git-history.mjs, src/domain.ts, src/App.tsx, tests and README.md; isolate CLI and UI integration if the slice grows.

**Estimated scope:** Split exporter and UI wiring into two reviewable substeps if necessary.
