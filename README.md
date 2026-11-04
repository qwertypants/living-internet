# MYCELIUM — The Living Internet

An offline-friendly, visual-first prototype that turns commit events into a replayable bioluminescent island. No API keys or services are used. The current build runs as a browser app; imported event metadata is stored in this browser's local storage.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The first launch loads a deterministic 360-event demo. Select a tree to inspect its source event, drag the time slider to scrub, and use play/speed controls to replay. “Import repo” asks for a repository folder; this browser prototype currently reads reachable loose Git commit objects from reflogs. Git packfiles are not supported.

## Verify

```sh
npm test
npm run build
```

See [docs/PROGRESS.md](docs/PROGRESS.md) for implemented scope, acceptance status, and known gaps. The full target specification is [LIVING-INTERNET-MOONSHOT.md](LIVING-INTERNET-MOONSHOT.md).
