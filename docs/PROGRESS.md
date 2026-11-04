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
- No end-to-end browser smoke flow, representative laptop frame-rate measurement, adaptive quality, native performance overlay, or real repo import verification has been run.
- Playback timing and current scrub position are session-only; imported event data survives reload in browser localStorage.
- Visual trees are meshes per event rather than instanced LOD. A 360-event scene is the only current scene-size target.
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

Profiling limitation: local Playwright is not installed. No actual browser/orbit interaction or GPU measurement was performed. Both requested synthetic datasets (360 and 1,000 events) remain unmeasured: device/browser/viewport/pixel ratio/draw calls/frame timing are unavailable. No timing or FPS claim is made. Follow-up baseline procedure: load each generated fixture via localStorage, reload, record hardware/browser/viewport/DPR, warm up, collect renderer draw calls and median/p95 frame intervals over a fixed window, then repeat with motion disabled and while replaying. This task has not completed the profiling acceptance gate.
