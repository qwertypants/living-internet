# Working in MYCELIUM

- Read `LIVING-INTERNET-MOONSHOT.md` and `docs/PROGRESS.md` before extending scope.
- Keep world mapping pure and deterministic in `src/domain.ts`; keep rendering in `src/App.tsx`.
- Never write to an imported Git repository. Import only user-selected metadata and never add source code, diffs, prompts, or secrets to events.
- Preserve provenance labels: synthetic fixture events are not real developer activity; visual glow is decorative.
- Run `npm test` and `npm run build` after changes. Record actual results and limits in `docs/PROGRESS.md`.
- The current app is a browser prototype. Do not describe it as a Tauri/SQLite desktop app until those are implemented and verified.
