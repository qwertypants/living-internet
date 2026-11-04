# Design decisions

## 2026-11-04 — Browser-first vertical slice

The repository had no existing app. Start with a React 19, Vite, TypeScript, Three.js and React Three Fiber browser application so the island and replay can be run immediately. Keep the domain mapping independent of rendering. Defer Tauri, Rust, and SQLite instead of shipping unverified native scaffolding; browser persistence currently uses localStorage and is explicitly identified as a prototype limitation.

## Deterministic event and object identity

Demo event IDs derive from stable commit-like IDs, and tree positions derive from the event ID rather than the current event index. Therefore adding an older event does not relocate existing trees. Replay sorts by occurrence timestamp and ID and deduplicates by event ID.

## Git import limits

The browser fallback only sees files explicitly selected by the user. It reads reflog entries and reachable loose commit objects; it cannot execute Git or decode packfiles, so many normal repositories cannot be imported. This limitation is surfaced in the UI and must be replaced by a narrow native Git adapter before calling P2 complete.
