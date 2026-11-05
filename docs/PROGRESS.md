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
