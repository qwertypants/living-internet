# Progress

Updated: 2026-11-04

## Done

- P0: React + TypeScript + Vite app scaffold, strict TypeScript, scripts, deterministic typed event model, stable IDs, 360-event synthetic fixture, unit tests, decisions and setup docs.
- P1: seeded procedural island, commits as selectable trees, branch trails, night lighting/fog/stars, orbital camera, compact provenance inspector, motion preference toggle, reduced-motion CSS, responsive layout and clearly marked decorative effects.
- P2 (browser prototype): Git folder chooser fallback for reflogs and loose commit objects, ordered replay/scrub/pause/speed controls, deterministic deduplication/mapping, and event persistence in localStorage across reloads.

## Verification

- `npm test` — passed, 3 unit tests (fixture repeatability, duplicate ingest/stable mapping, rewind/replay state).
- `npm run build` — passed with Vite production output and strict TypeScript.
- Build reports a 1.14 MB minified JavaScript chunk; split the 3D viewer before treating performance as tuned.

## Not yet shipped / MVP acceptance gaps

- This is a browser app, not the requested Tauri desktop app. Rust event/storage crates, SQLite journaling, migrations, snapshots, and restart recovery are not implemented.
- Browser Git import only handles reachable loose commit objects available through reflogs; packed histories, complete branch-head enumeration, incremental rescans, force-push topology, and large/bounded native scans are missing.
- Task 1 now has a headless WebGL motion smoke flow and baseline (below). Representative physical-display frame-rate measurement, adaptive quality, native performance overlay and real repo import verification remain outstanding.
- Playback timing and current scrub position are session-only; imported event data survives reload in browser localStorage.
- Visual trees are meshes per event rather than instanced LOD. Both 360 and 1,000 synthetic event scenes were profiled for Task 1; larger histories remain untested.
- Audio is a UI toggle only; no audio playback is implemented.

## Running

The web viewer is runnable using the commands in `README.md`. No services or API keys are needed.

## Next

1. Add a Tauri 2 shell with a narrowly scoped user-selected directory picker and typed commands.
2. Add a Rust event core, SQLite migrations/event journal, idempotent transaction, indexed projector and snapshot integrity checks.
3. Implement bounded incremental Git metadata extraction with `git` arguments (no shell interpolation), packed history support, explicit redaction, and tests using temporary repositories.
4. Connect persisted replay to the UI and verify import/restart/scrub/inspect end to end.
5. Profile and optimize the scene before making performance claims.

## Risks

- Browser `webkitdirectory` is Chromium-specific, and packed Git databases make the current importer fail for most compacted repositories. The UI reports that failure instead of presenting partial data as complete.
- npm reported 3 dependency audit findings (1 moderate, 2 critical) during install. They were not automatically force-updated; review the dependency tree before a release.

## Task 1 motion preferences (2026-11-04)

System reduced-motion preference is observed live until the existing toggle supplies a session override. Effective motion reaches camera auto-rotation, control damping, star speed and tree frame updates. Tree positions freeze immediately when disabled. History playback and scrubbing remain available; future scene transitions must use the same effective preference. Existing reduced CSS remains active. Mapping and provenance are unchanged.

Verification: npm test passed 4 tests, including system changes, override, scene props and replay under reduced motion. npm run build passed with the existing large-chunk warning. Component tests mock the renderer and do not prove WebGL behavior.

### Task 1 review follow-up: real WebGL evidence

Reproduction (from this checkout; no Playwright app dependency):

```sh
npm install --prefix /tmp/mycelium-browser-evidence playwright
npm run dev -- --host 127.0.0.1
# In a second terminal:
node scripts/motion-profile.mjs
```

The harness uses installed `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` in an isolated headless profile. `PLAYWRIGHT_PACKAGE` can point to another temporary package.json; `PROFILE_URL` and `PROFILE_OUTPUT` override the localhost URL and JSON result path. It seeds only synthetic fixtures in the isolated profile, imports the same Vite-loaded Fiber module, and reads actual renderer state. No app profiling hook or domain mutation was added.

Measured 2026-11-04: Apple M3 Max, 48 GiB RAM, Darwin 25.6.0 arm64; Chrome 156.0.8078.80 headless; ANGLE Metal Apple M3 Max; viewport 1440 × 1000, browser and renderer DPR 1, WebGL drawing buffer 1372 × 725. Five-second requestAnimationFrame interval samples after two-second warmup, 300 intervals each. Draw calls come from `WebGLRenderer.info.render.calls` after render, not an estimated mesh count. Raw results: `docs/evidence/task-1-motion-profile.json`.

| Synthetic events | Motion | Draw calls/frame | Median interval ms | p95 interval ms |
| --- | --- | ---: | ---: | ---: |
| 360 | enabled | 1087 | 16.7 | 16.8 |
| 360 | reduced | 1087 | 16.7 | 16.7 |
| 1,000 | enabled | 3007 | 16.7 | 16.8 |
| 1,000 | reduced | 3007 | 16.7 | 16.8 |

Both sizes passed actual WebGL assertions: camera position, every tree group's vertical position and star shader time change with motion enabled; changing the live system preference while dragging orbit and then releasing freezes all three across a 600 ms observation; the explicit override restores camera motion and a second toggle disables it. Reduced-motion scrubbing to cursor 10 and Play advance to 17; after Pause the camera/tree/star snapshot stays unchanged. Renderer tests separately assert camera damping/auto-rotation props, star speed and frozen tree frame callbacks. A 1440 × 1000 screenshot was inspected: the island, trees, provenance labels and timeline render. No uncaught page errors occurred. Both rendering sizes passed; no failed rendering case.

Limits: automated mouse interaction and renderer observations in real headless WebGL, not a human physical-screen check. RAF intervals include scheduling and synchronization; they are not isolated GPU render durations, battery/thermal measurements, or proof of sustained 60 FPS on a representative developer laptop. Reduced motion still renders every frame and does not reduce draw calls. Browser smoke uses Vite development output; the production bundle was built but not profiled. No future transition exists to test.

Verification: `npm test` passes 5 tests across 2 files, with no React renderer/act warnings or global console suppression. Node 26 emits its pre-existing experimental localStorage warning. `npm run build` passes (1,162.75 kB JS chunk; existing >500 kB warning). `git diff --check` passes. The test-only Three renderer dependency shares ESM Three/Fiber via `vitest.config.ts` to avoid duplicate renderer instances. Initial harness development failures were instrumentation setup (wrong Vite module instance, accessing controls without makeDefault) and dev-server reloads during config edits; these were corrected before successful full runs. The first full measurement overlapped a separate screenshot browser briefly, so the recorded baseline is a final isolated rerun. The first build of the test aliases exposed missing Node URL types in the production config; moving renderer-only aliases to Vitest's own config restored the build.

## Task 2 camera descent

Selection uses one cancellable 900 ms smoothstep camera flight; reduced motion snaps. Orbit start cancels flight, Home clears selection and restores overview, and rewinding removes stale selection. A native commit select supplies keyboard selection. Camera mapping remains in App.tsx; domain.ts is unchanged.

Verification: npm test passes 5 tests; npm run build passes with existing large-chunk warning; git diff --check passes. `node scripts/camera-check.mjs` passes real headless Chrome WebGL checks at 1440x1000 and 390x1000: reduced snap, Enter-activated Home, rewind clearing, manual cancellation and reselection. Initial narrow drag hit an overlay; rerun uses exposed upper canvas and passes. Self-review checked single flight ownership and stale-selection clearing. Limits: no physical-screen inspection, real repository import, visual screenshot review or automated inspector overlap assertion. Existing motion profile expects automatic orbit with an initial selection; initial view now starts at overview. Narrow layout needs visual review before release.

### Task 2 review fixes

Home now has an explicit reset request, so pointer and keyboard activation reset a manually orbited overview even when selection is already empty. Flight activity is reactive; overview rotation stays off during travel and resumes after completion. Selection uses aspect-aware camera distance. Scene controls and the inspector no longer overlap at 390px; focused views hide decorative HUD text.

Verification: `npm test` passed 5 tests; `npm run build` passed with the existing chunk warning and Node localStorage experimental warning during tests. `node scripts/camera-check.mjs` passed at 1440x1000 and 390x1000, including empty-selection Home, interrupted flight, repeat selection reaching its target, flight rotation lifecycle, inspector bounds, and projected focus outside the inspector. Both screenshots were visually inspected. The script accepts APP_URL, CHROME_PATH and PLAYWRIGHT_PACKAGE overrides. Real Git import is still pending Task 6; no claim of complete import integration at this checkpoint.

## Task 3 instanced forest

Three ID-seeded decorative forms share six instanced botanical meshes. Positions/domain/provenance and camera logic are preserved. Simple quality reduces crown geometry; selected trees have a white diamond ground ring and overhead pointer independent of glow. Instance lookup uses the same species bucket as matrix construction. Trees are static; growth choreography and island changes are deferred.

Verification: npm test passes 5 tests; npm run build passes with existing chunk warning; camera-check passes at 1440 and 390 widths. Adapted motion profile records actual calls: 13 overview / 15 selected at both 360 and 1000 events versus baseline 1087/3007. Same 1440x1000 viewport, DPR 1, 1372x725 buffer, Chrome/Metal host; five-second RAF medians 16.7ms and p95 16.7–16.8ms. Raw evidence task-3-motion-profile.json. No page errors. Initial profile override assertion failed after pointer selection/manual camera state; removed that unrelated assertion, retaining motion/freeze/replay checks. Limits: pointer-to-expected-SHA after reorder and visual species/marker desktop/narrow inspection remain unverified. This checkpoint does not complete those acceptance checks.

### Task 3 review fixes

Moved the quality control into the ordinary scene controls because the previous Drei Html control was absent in actual browser checks. Added deterministic Arrow/Home/End navigation to the native commit select. `node scripts/forest-check.mjs` passes at 360 and 1,000 events for original and reversed input, rewind to 30 and fast-forward, with pointer hits checked against canonical positions/SHAs independently of renderer eventIds. Keyboard selection, marker presence and accessible quality switching pass. Desktop/narrow screenshots at both counts were inspected: three distinct silhouettes and geometric marker visible, controls and inspector readable.

`npm test` passes 6 tests including selection after reorder/rewind. `npm run build` passes with existing chunk warning; Node experimental localStorage warning remains. `PROFILE_URL=http://127.0.0.1:5182 node scripts/task-3-profile.mjs` passes with explicit selected-state/marker assertions and separate selected measurements. Raw evidence is in docs/evidence/task-3-motion-profile.json. These are headless development-renderer measurements, not physical-display proof.

Known pre-existing issue: injecting reverse-ordered legacy localStorage data leaves timeline date labels based on input order even though rendered replay/selection is canonical. Task 6 must normalize stored/imported event order before labels and replay consume it.

## Task 4 replay growth

Added 600ms smoothstep sprouting and a restrained 6% sine canopy pulse in the six existing instance batches. Active transition maps discard completed/removed IDs; projection and persisted events are unchanged. Deliberate Pause freezes growth independently of automatic playback completion. Scrub/fast-forward/restart and reduced motion settle transitions.

Verification: npm test passes all 6 existing tests; npm run build passes with existing large chunk warning. APP_URL=http://127.0.0.1:5183 node scripts/growth-check.mjs passes actual Chrome instance-matrix regression checks for pause/resume, 1/3/8 speed final equality, automatic end settling, scrub and reduced motion. forest-check passes 360/1000 canonical pointer/keyboard picking, reorder/rewind, marker and quality. Growth screenshot /tmp/mycelium-growth.png visually inspected: settled forest and controls render correctly. Camera check passed desktop but first narrow run failed manual cancellation timing; rerun recorded separately in report. Limits: headless development WebGL, no physical-display verification; growth regression currently exercises the final ten commits rather than full-history playback.

### Task 4 review fixes — 2026-11-05

The first narrow cancellation run and its rerun both failed. Investigation found two issues: the old drag path crossed the wrapped scene controls, and a drag across an instanced tree also fired its click handler, starting a new selection flight. The camera harness now asserts its starting hit is the canvas and that selection remains unchanged after dragging. The picker rejects movement greater than two pixels. Camera logic itself did not need a change.

`APP_URL=http://127.0.0.1:5183 node scripts/camera-check.mjs` now passes at 1440 and 390 widths. `APP_URL=http://127.0.0.1:5183 node scripts/forest-check.mjs` passes at 360 and 1,000 events, verifying ordinary clicks still select the correct commits after reorder/rewind/fast-forward. `npm test` passes all 6 tests and `npm run build` passes; existing Node localStorage and bundle-size warnings remain.

The strengthened growth harness asserts newly revealed trunks have intermediate height relative to their canonical height, freeze while paused, and advance after resume. Full 360-event playback from the beginning at 1x, 3x and 8x converges exactly to the initial settled instance matrices. Automatic completion, scrub and reduced motion checks pass. Command: `APP_URL=http://127.0.0.1:5183 node scripts/growth-check.mjs`. A paused mid-growth screenshot was visually inspected. The scripts were formatted for readability. Browser setup: `npm install --prefix /tmp/mycelium-browser-evidence playwright`, run Vite on loopback, then the commands above; override PLAYWRIGHT_PACKAGE, CHROME_PATH and APP_URL for another setup. Headless real Chrome/WebGL evidence, not physical-display proof.

## Task 5 sculpted island — 2026-11-05

Replaced noisy shallow ground with a flat y=0 tree anchor plane and 3.4-unit tapered rocky underside. Fixed phase seed 1.4 controls irregular radial strata and vertex colors. No random/time inputs or domain changes. Hanging roots are explicitly decorative in scene metadata and inspector text, unrelated to commit ancestry. Bounded geometry: 80 radial segments/8 height rings (32 in simple), 18 three-point roots (8 in simple), one static low-opacity mist ring; zero new particles or frame callbacks. Simple/reduced omit mist. Scene quality now labels the existing shared simpleForest control; six forest batches, picker delta guard, camera and growth state are untouched.

Verification: npm test passes all 6 tests; npm run build passes (1,167.57 kB JS; existing chunk warning). git diff --check passes. Real installed Chrome/Playwright: camera-check passes desktop/narrow; forest-check passes 360/1000 pointer/keyboard selection, reordered input, rewind/fast-forward and updated quality label; growth-check passes full-history 1/3/8 speeds, intermediate matrices, pause/resume, automatic settle, scrub and reduction. island-check passes at 1440x1000 and 390x1000: exact top maximum y=0, underside minimum approximately -3.4, six batches, decorative metadata and mist presence/absence. Captures overview, low orbit, close-up, simple/reduced plus four azimuths at near-zenith and maximum polar angle. Representative screenshots visually inspected in /tmp/island-*.png: tapered silhouette and hanging roots visible, tree bases grounded, marker/inspector usable. Narrow overview crops island sides; no framing redesign in Task5. Strata are deliberately dark. Mist is static, with no optional new moving effect.

Final profile: PROFILE_URL=http://127.0.0.1:5184 node scripts/task-5-profile.mjs. Raw docs/evidence/task-5-motion-profile.json. Same baseline host/settings: M3 Max 48 GiB, Chrome 156 Metal, viewport 1440x1000, DPR1, buffer1372x725, 2-second warmup, 5-second RAF samples. Both 360/1000: detailed overview 32 calls, simple overview 20, selected 23, reduced 30. Medians all 16.7ms; p95 16.7–16.8ms. Task3 was 13 overview/15 selected; roots add bounded draw cost independent of history size, and frustum culling explains lower selected calls. RAF pacing is not GPU duration or sustained physical-display FPS. Browser evidence runs briefly overlapped portions of profiling, so timing is indicative, not isolated benchmark evidence. No page errors. Production built, development renderer profiled. No real importer verification (Task6).

Self-review removed intersecting separate strata meshes, added geometry disposal, and clamped Float32 top rounding to exactly zero after initial focused assertion found +4.8e-8. Fixed the harness to traverse nested forest batches rather than count scene children. No push/merge or source-repository writes.

## Task 6 private Git metadata exporter — 2026-11-05

Added a read-only Node CLI with all-ref streamed metadata, exact case-insensitive configured identity union, resolved common-directory and commit deduplication, deterministic private schema v1 output and atomic mode-0600 replacement. No browser integration (Task 7).

Actual inventory export: 167 resolved repositories, 99 matching repositories, 2,489 project/commit pairs, zero unreadable inventoried sources. Ten sampled pairs matched Git SHA, parents and author timestamp. Repeat actual export was byte-identical. Actual output is ignored (`git check-ignore` verified), mode 0600, outside public assets. No subjects, emails or absolute paths are emitted; project labels remain private basenames. Source commands only read metadata/configuration; no fetch or source writes.

Limits: inventory discovery previously could not access two protected locations; historical email aliases remain unknown. Zero unreadable sources describes this inventory, not complete machine coverage. Streaming has explicit failure limits; final JSON remains memory-resident. See docs/history-format.md for schema and placeholder refresh command. Build passes with existing large-chunk warning. Tests cover packed 1,005-commit history, other-author exclusion, multiple refs, duplicate worktrees, repeat stability and unchanged source refs; existing six app tests also pass. Initial fixture worktree setup required detached mode; corrected before final verification. Node localStorage warning remains.

Exporter review fixes: iteration replaces spread append, and only Git config exit 1 means an unset identity; other failures count as unreadable. Three integration tests passed, including 140,000 streamed commits, a matching commit exclusive to a side ref, and simulated config failure. Actual refreshed snapshot: 167 repos, 99 matching, 2,490 pairs, zero unreadable. Build passed.

## Task 7 real history — 2026-11-05

Added strict schema-v1 metadata validation, canonical import and legacy-storage ordering, project-plus-SHA IDs, JSON upload, fixed private development endpoint, explicit local URL loading, persistent events and selectable synthetic demo. Inspector retains repository labels and Git metadata provenance; subjects are explicitly not imported, branches unknown and parents metadata only. Unknown branches generate no trails. Rendering/camera/growth/picking mapping is preserved.

Verification: eight app/parser tests pass; npm test exporter integration suite passed all three tests (55.15 seconds, including large streamed fixture), run once. Production build passes with existing chunk warning. Actual Chrome loaded 2,490 pairs, 167 projects and 99 matching repositories; three sampled project/SHA/parents comparisons, inspector labels, scrub, repeat import, invalid JSON preservation, reload persistence and demo switching pass. Static local and @fs private requests are blocked. Camera desktop/narrow and forest 360/1,000 checks pass. Private screenshots remain /tmp. Production scan finds no exported SHA/project IDs, private absolute source path or endpoint; one exact repository-label literal coincides with ordinary bundle text, so substring absence cannot prove label exclusion. No data file is imported by the build.

Coverage remains inventory-scoped: protected Desktop/Downloads and unknown historical aliases can omit activity. Browser prototype/headless Chrome evidence only; no physical-screen or native desktop claim. Growth rerun and final report record remaining verification details. No push, merge, external requests or imported source-repository writes.

Final Task7 growth rerun passed real Chrome intermediate matrices, pause/resume, complete 360-event replay at 1/3/8 speeds, automatic settle, scrub and reduced motion. Initial growth attempt lost its injected helper during a development config reload; rerun completed successfully. Final eight unit tests and build pass. Overview screenshot visually inspected in /tmp/task7-real-history.png.

Task7 review fixes: legacy Git events now receive project/SHA IDs, unknown branch labels, omitted subjects and validated parent hashes. Saved dates normalize to UTC before ordering. Stale folder-import instructions removed. npx vitest run:9 passing; npm run build passes with existing warning. Regression covers chronological ordering across UTC offsets and legacy provenance migration.

## Final acceptance — 2026-11-05
All seven slices completed and independently reviewed. Whole-branch review: no Critical or Important findings. Final npm test: nine Vitest tests and three exporter integration tests passed, including 140,000 commits; final npm run build passed. Existing large-bundle and Node localStorage warnings remain. Actual Chrome evidence covers the private 2,490-pair snapshot, provenance, replay, selection, persistence and demo switching. Minor follow-ups and execution decisions are in tasks/todo.md and docs/EXECUTION.md. Branch preserved locally; no push, merge or deployment.

## Main integration — 2026-11-05
Fast-forward merged the reviewed branch into main at 8319548. Preserved private local/history.json in the main checkout with hash verification and mode 0600. Final main checks: 9 Vitest tests and 3 exporter integration tests passed; production build passed with existing chunk warning. Initial npm ci cache ENOTEMPTY error resolved on retry. Removed the merged implementation worktree and branch. No push or deployment.
