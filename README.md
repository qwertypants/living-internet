# MYCELIUM — The Living Internet

An offline-friendly, visual-first prototype that turns commit events into a replayable bioluminescent island. No API keys or services are used. The current build runs as a browser app; imported event metadata is stored in this browser's local storage.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The first launch loads a deterministic 360-event demo. Select a tree to inspect its source event, drag the time slider to scrub, and use play/speed controls to replay. Import history JSON from the metadata exporter described below. The exporter supports packed Git histories.

## Verify

```sh
npm test
npm run build
```

See [docs/PROGRESS.md](docs/PROGRESS.md) for implemented scope, acceptance status, and known gaps. The full target specification is [LIVING-INTERNET-MOONSHOT.md](LIVING-INTERNET-MOONSHOT.md).

### Private history

Export user-selected metadata with `node scripts/export-git-history.mjs --inventory /path/to/private/inventory.json --output local/history.json`. Keep the inventory and output private and ignored. Run `npm run dev -- --host 127.0.0.1 --port 5187`, then open `http://127.0.0.1:5187/?history=local` or click **Load local history**. The URL explicitly reloads the fixed snapshot; use `/` to restore persisted events without reimporting. JSON upload works in production too. **Synthetic demo** replaces the stored world with the deterministic fixture.

Only development serves the fixed `local/history.json` endpoint, to loopback same-origin requests. There is no arbitrary path parameter. Static private paths are denied and no history is bundled. Imported events persist in this browser's localStorage; clear site data to remove them. Subjects are not imported; branch membership and ancestry are unknown, and parents are metadata only. Repository labels remain private. Coverage describes the inventory: protected Desktop/Downloads locations and unknown historical email aliases may omit activity.

Real-history browser checks: `node scripts/history-check.mjs` (installed Chrome, Playwright package under `/tmp/mycelium-browser-evidence`, dev port 5187). Screenshots go to `/tmp`.
