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
- [x] Newly revealed trees grow from their fixed anchors; replay speed does not change final shape, position or event identity.
- [x] Pause freezes growth; manual scrub settles immediately; replay from the beginning repeats the same final scene.
- [x] Reduced motion renders settled shapes, and animation state is bounded to active transitions rather than accumulated history.

**Verification:**
- [x] `npm test` passes, including relevant behavior tests.
- [x] `npm run build` passes.
- [x] Manual check: Replay at each speed, pause mid-growth, scrub backward and forward, and compare selected event and final forest with direct projection.
- [x] Record actual results and limits in `docs/PROGRESS.md`.

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
- [x] Overview and close-up reveal depth without floating tree bases or obscured selection; underside roots are explicitly decorative.
- [x] Details are reproducible from a fixed seed; reduced motion and lower quality remove optional animated effects.
- [x] Profile the completed scene against baseline; document costs and unresolved limitations without claiming unmeasured FPS.

**Verification:**
- [x] `npm test` passes, including relevant behavior tests.
- [x] `npm run build` passes.
- [x] Manual check: Inspect silhouettes at all allowed orbit angles and narrow viewports; compare normal, reduced-motion and lower-quality rendering.
- [x] Record actual results and limits in `docs/PROGRESS.md`.

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


## Task 6: Export all local authored Git history

**Description:** Build a read-only Git metadata exporter for all user-authorized repositories, then run it on the existing private inventory.

**Acceptance criteria:**
- [x] Read all reachable commits from all refs, exact author-email matching against the union of configured user.email identities; process metadata as a bounded stream/batches, not a silently capped recent sample. Support packed history, deduplicate Git common directories and per-project SHAs, report failed sources. No imported repo writes, no shell interpolation or Git fetch.
- [x] Emit schemaVersion 1 JSON with projects [{id,label}], commits [{projectId,sha,parents,occurredAt}], coverage {repositoryCount,matchingRepositoryCount,commitCount,unreadableRepositoryCount}. Project IDs are opaque stable hashes of resolved Git common directories; labels are repository basenames only. SHA/parent IDs are full hashes, timestamps ISO UTC. Do not emit subjects, authors/emails, remote URLs, absolute paths, source or diffs. Configured identities stay process-local.
- [x] Run on the ignored inventory, write actual output only to ignored local/history.json in the implementation checkout with private permissions, verify counts and sampled commits against read-only Git. Keep actual data out of commits, public assets and dist.

**Verification:**
- [x] Temporary Git fixtures cover packed objects, multiple refs, exact author filtering, repeated export stability, duplicate worktrees and no history cutoff.
- [x] npm test and npm run build pass; record actual aggregate coverage and limits in docs/PROGRESS.md without private names or paths.

**Dependencies:** 5.
**Files likely touched:** scripts/export-git-history.mjs, scripts/export-git-history.test.ts, docs/history-format.md, .gitignore, docs/PROGRESS.md.
**Estimated scope:** Medium.

## Task 7: Load and inspect the real history

**Description:** Validate the exporter envelope and connect the private local file to the browser prototype with replay, provenance and persistence.

**Acceptance criteria:**
- [ ] Validate the versioned envelope strictly before replacing data. Canonicalize events on import and legacy storage read so ordering, cursor labels and replay agree. Stable IDs include project identity and SHA; parents remain metadata only, no invented branch memberships or ancestry paths. Invalid input preserves the existing world and reports an error.
- [ ] Provide explicit JSON file import and a local development-only loading path for ignored local/history.json. Private history is never placed under public/ or bundled into dist. No external network requests or source-repository writes. Load all exported user history, retain project labels/provenance in inspector, keep synthetic demo explicitly selectable.
- [ ] Verify the actual local dataset loads, sampled SHA/project provenance agrees with export, replay/selection and reload persistence work; tests cover malformed input, stable repeat import and canonical ordering. Keep previous camera/forest/growth checks working.

**Verification:**
- [ ] npm test and npm run build pass.
- [ ] Actual Chrome readback proves real dataset count, source labels, sampled SHA, selection, timeline and reload.
- [ ] Production bundle contains no actual user dataset or private source paths; record limits and outstanding aliases/unreadable roots.

**Dependencies:** 6, docs/history-format.md.
**Files likely touched:** src/domain.ts, src/domain.test.ts, src/App.tsx, vite.config.ts, README.md, docs/PROGRESS.md, focused UI tests/scripts as needed.
**Estimated scope:** Medium implementation plus verification artifacts.
