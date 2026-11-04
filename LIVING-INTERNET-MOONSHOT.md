# MYCELIUM — The Living Internet

> Codex-ready moonshot build plan and implementation prompt. Local-first, private by default, visual-first.

## Product thesis

Turn real developer activity into an explorable, persistent, procedurally generated digital ecosystem. Repositories become islands, commits become vegetation, branches become paths, automated tests become weather, and AI agent sessions become creatures. The system is an honest visualization of provenance-backed events, *not* a claim that imaginary behaviors are actual agent intentions. Its simulation and history must run without an LLM; AI optionally enriches narratives and behaviors.

### Experience principles
- First five minutes: import a repository, watch the landscape grow, select any tree to inspect the exact commit, scrub through time.
- Delight: dark bioluminescent 'cyberpunk nature' aesthetic; expressive animation, sound optional, intuitive orbital camera and cinematic flyover.
- Traceability: every meaningful world object has a source event, repository and timestamp; aesthetic symbolism is labeled distinctly from factual metrics.
- Trust: process data locally by default; opt-in integrations and model calls; never capture prompt bodies, tool outputs, source code, secrets or private paths unless expressly approved for a specific use.
- Availability: no API keys required for demo, Git import, deterministic simulation or replay.

## Bounded MVP (must ship before the moonshot)
1. Tauri desktop app with an embedded React + React Three Fiber viewer.
2. Import a local Git repository (explicit user selection; read-only), bounded historical scan and incremental rescan.
3. Persistent SQLite event journal and materialized world snapshot tables.
4. Seeded deterministic island layout: topography, trees for commits, colored trails for branches, one safe decorative creature.
5. Clickable world objects open a compact inspector showing short SHA, commit subject (opt-in metadata), timestamp and source repo.
6. Playback / pause / speed controls and time scrub with correct rewind / fast-forward behavior.
7. One fictional demo dataset with 300+ events and no external service requirement.
8. 60 FPS *target* on representative developer laptop with reasonable scene size; adaptive quality to maintain interaction.
9. Tests covering event ingestion idempotency, snapshot integrity, deterministic rebuild and UI smoke flow.

### MVP exclusions
No self-modifying production code, unbounded autonomous tool execution, network collaboration, automatic repository writes, cloud account sync, complex physics, full text ingest, or automatic access to user's filesystem outside chosen repo. No GitHub auth required.

## Architecture

```text
[Explicit Git import] [Codex hook adapter (opt-in)] [Build/test adapter (later)]
       \                 |                          /
        -> [Rust adapters: bounded reads + event normalization]
                              |
                  [Redaction / validation / dedupe]
                              |
                    [SQLite append-only event log]
                              |
                   [Projectors + snapshots + cursors]
                       /                     \
        [Deterministic world simulator]   [Optional AI enrichment]
                       \                     /
                      [Read-only world view model]
                                 |
                     [Tauri commands + events]
                                 |
                    [React Three Fiber renderer]
                                 |
                   [Selection / timeline / inspector]
```

### Technology decisions
- `apps/desktop`: Tauri 2; Rust shell; React 19 + Vite + TypeScript + R3F compatible stable version (verify version compatibility during setup).
- `crates/event-core`: event types, validators, provenance, redaction, schema version.
- `crates/connectors-git`: safe metadata capture via git executable or maintained Rust library; avoid shell concatenation; command args only; bounded scans.
- `crates/storage`: SQLite migrations, transactions, event log, projections, snapshots, indices and retention controls.
- `crates/world-engine`: pure deterministic mapping of events to world state; fixed-step simulation, seeded PRNG; no rendering dependency.
- `crates/bridge`: Tauri commands, permissions, event subscription, per-client backpressure.
- `packages/world`: React Three Fiber instanced meshes, shaders where needed, LOD, input and picking.
- `packages/ui`: inspector, event provenance, timeline, imports, integration controls, accessibility.
- `packages/shared`: generated/shared typed DTO schemas; avoid duplicate handwritten schema drift.
- `fixtures`: synthetic repository histories and event recordings; reproducible golden snapshots.
- `docs`: decisions, security, mappings, contributor playbook.

Favor one Rust process and SQLite over microservices, Kafka, Redis or Docker at MVP. Introduce a worker boundary only if profiling demonstrates need.

## Event contracts

Minimal versioned canonical envelope:

```ts
type WorldEvent = {
  id: string; // deterministic identity for source event where possible
  schemaVersion: 1;
  source: 'git' | 'codex' | 'test' | 'synthetic';
  kind: string; // e.g. git.commit, codex.turn.completed, test.run.failed
  occurredAt: string; // ISO-8601 UTC source time
  observedAt: string; // local ingest timestamp
  projectId: string;
  subjectId?: string; // hash or stable opaque handle
  correlationId?: string;
  payload: Record<string, unknown>; // strict allowlisted per kind
  privacy: 'metadata' | 'local-sensitive';
};
```

Define schemas per source and per event kind. Enforce reasonable maximum sizes; reject unknown fields at trust boundaries. Event identity: `SHA256(source | projectId | stableSourceId | kind | canonical payload discriminator)` for stable source events, not ingest time. Store original occurrence and ingest timestamp separately. All ingests use an atomic transaction; unique event ID means re-import is idempotent. Treat force-push and rewritten histories explicitly: preserve already observed events, mark branch head topology as a separate evolving projection rather than silently overwriting history. Use schema migrations and projection versions.

Storage tables (initial): `projects`, `events`, `ingest_cursors`, `world_snapshots`, `projection_versions`, `settings`, `integration_permissions`; indexes on `(project_id, occurred_at, id)` and source identity. Optionally add `objects` only if projection profiling calls for it.

## Rules for honest world mapping

Deterministic initial world seed derived from project ID plus schema version. A source event's object ID and position must remain stable across replays at the same projection version. Define explicit mappings:

| Source signal | World metaphor | Inspector provenance |
| --- | --- | --- |
| Repository | Floating island | repo identity and local provenance |
| Commit | Growing tree | short SHA, date, summary if opted in |
| Branch head | Navigable illuminated path | branch name and commit hash |
| Merge | Root network junction | merge parent hashes |
| Completed agent turn | Bioluminescent pulse | session's opaque ID, time, outcome |
| Failed test run (later) | Temporary storm | test run ID, status; do not imply code quality from animation |
| Inactive repo | Night cycle / dormant ecology | latest observed event date |

Do not use commit lines changed as an objective quality score. Make weather a symbolic representation of signals with user-visible legend. Provide neutral/no-data states. Never infer a person's emotional state, team productivity or developer ability.

## Simulation engine

Use fixed-step updates, e.g. 20Hz simulation and independent render cadence. A replay processes events in stable total order `(occurredAt, id)` to support identical results on the same engine/version/seed. Live arrival order may differ from historical order; handle late events by replay from a recent checkpoint. Snapshot at fixed event intervals, e.g. every 100 events, and verify snapshot signatures. Visual animation should interpolate; it must not mutate authoritative simulation state. Creatures in MVP are rule-based, non-autonomous, and metadata-driven; they never execute tools.

By the moonshot phase, introduce configurable inhabitants with finite state machines/utility scoring, limited energy/resources and measurable actions. An optional LLM proposes a plan, but deterministic policy validates allowed actions; all resulting simulation events are logged. Separate fictional simulation decisions from real Codex actions. Agent execution (if added) requires individual explicit opt-in, sandboxed workspace and user approval for writes and risky operations.

## Local privacy and security

- Start with read-only user-selected repos. Do not traverse parent directories or follow unexpected symlinks.
- Safe process execution: no shell interpolation; sanitize branch and commit text before rendering; never render markdown as raw HTML.
- Persist only allowlisted source metadata. Token redact before storage and logging; default no prompt contents, model answers, source code, diffs, email, user identity or secrets.
- Optional prompt/response capture must be an explicit separate feature with settings, disclosure, deletion and retention controls, not part of this MVP.
- No outgoing network requests without opt-in; if models are used, show provider, requested content class, cost/usage possibility and controls.
- Codex hooks must be optional, short-running, nonblocking and trust-reviewed; event adapter writes to bounded local queue; never interrupt a developer session if the viewer is down.
- Backups/export/import should be safe and versioned; redaction policy applies to exports.
- No automatic modifications of repositories or Codex configuration. Show exact proposed hook changes and require approval.
- Tauri permissions: least privilege, narrow commands, no global filesystem access. CSP, typed messages, bounded payloads.

## Phases and exit criteria

### P0: Foundations
- Scaffold workspace, toolchains, formatting, strict TS, CI, architecture decision record.
- Define canonical event schema, stable IDs, migration system, synthetic fixture generator, UI shell.
- Exit: all checks pass; demo fixtures load in empty local DB; architecture documented.

### P1: Genesis (visual vertical slice)
- Build a single gorgeous procedural island with seeded geometry, day/night lighting, fog, LOD/instancing and intuitive camera.
- Add selection + inspector, performance overlay, reduced-motion mode.
- Exit: one-click demo displays island at acceptable frame rate, selection works and appearance is deterministic.

### P2: Git grows the forest
- Implement explicit repo picker, bounded incremental Git scan, event normalization, SQLite, stable mapping to trees/paths.
- Historical replay, pause, speed, timeline, snapshots and restart recovery.
- Exit: importing same repo twice doesn't duplicate; rewind reproduces the same world; selected tree resolves to a real commit.

### P3: First contact
- Add opt-in Codex lifecycle adapter. Start with stable documented events, e.g. SessionStart, Stop/SessionEnd; research exact payloads first.
- Display agent avatar and activity pulses; show disconnected/unsupported state gracefully.
- Exit: session metadata drives visible safe animation; no hook blocks a Codex run; demo and Git-only modes still work.

### P4: Ecology
- Fixed-step weather, resource cycles and small rule-based population; event-driven reactions, no LLM dependency.
- Exit: replay and simulation reproducible; pause and resume correct; numerical invariants hold.

### P5: Archipelago
- Multi-repo islands, graph-based bridges based on explicit user tags or observed cross-repo references; never invent dependencies.
- Exit: worlds remain navigable and selectively loaded with 10+ sample repos.

### P6: Interpretation
- Optional provider-agnostic AI summaries and lore with prompt templates, structured JSON, caching, retry/rate caps, explicit provenance distinction.
- Exit: same data usable without a model; synthetic content visibly identified; provider error does not break world.

### P7: Time machine
- Scrub historical world, compare snapshots, fork a speculative simulation timeline that never alters real event history.
- Exit: can restore real timeline exactly after speculative branch.

### P8: Moonshot lab
- Simulation-only evolving creature policies; experiments with measurable fitness criteria and visible evolutionary genealogy; user-controlled budgets.
- Optional explicitly approved sandboxed coding agents separated from ecology engine.
- Exit: a reproducible experiment with measurable outcomes, rollback and no unauthorized external side effects.

## Interesting technical problems (not hand-waved)
1. *Semantic compression*: tens of thousands of events into a navigable forest without overwhelming visuals; aggregation with drill-down and spatial clustering.
2. *Replay correctness*: branch rewriting, late events, database migrations and engine versioning should not silently corrupt deterministic history.
3. *Stable procedural geography*: adding a new commit should not randomly relocate every existing tree; use stable placement and collision resolution.
4. *Simulation versus rendering*: prevent frame-rate variability from affecting ecological decisions.
5. *Truthful symbolism*: prevent viewers from mistaking weather/creature movement for objective productivity assessment.
6. *Real-time UX*: bursty events, backpressure and rendering throttles; no accidental React rerender of entire forest per tick.
7. *Safe hooks*: no collection of prompt bodies/secrets, minimal hook overhead, safe graceful fallback and explicit trust.
8. *Agent ontology*: differentiate a simulated decorative creature, a policy-driven simulated agent, and a real Codex coding agent with permissions.
9. *Time travel*: efficient checkpoints and clean fork semantics for hypothetical histories.
10. *Creative constraints*: bioluminescent procedural vegetation, organic growth animations, distinct worlds based on actual development patterns, optional spatial audio.

## Quality gates
- Unit: schema, event identity, redaction, git parsing edge cases, deterministic PRNG, simulation invariants.
- Property tests: ingestion duplication has no effect; replay of shuffled arrival order yields the same canonical state after ordering.
- Integration: temp Git fixtures including merges/renames/force-push detection; SQLite migration and restore.
- E2E: first-run demo, import path approval, select commit, timeline scrub, quit/relaunch persistence.
- Performance: profile 1k / 10k / 50k events and record actual median/p95 startup/import/replay; target smooth camera at 60 FPS on reference hardware, adapt LOD if needed.
- Security: test path traversal, symlinks, untrusted commit text, oversized event payloads, secret redaction, hook failure.
- Accessibility: semantic controls, keyboard inspector navigation, color-independent legends and reduced motion.

## Delivery conventions for coding agents
- Prefer runnable code over prose-only planning.
- Commit each phase at a stable checkpoint, if authorized, without changing user's unrelated work.
- Keep `docs/PROGRESS.md`: done / running / next / risks / test results; update after each milestone.
- Keep `docs/DECISIONS.md`: design decisions and trade-offs.
- Each phase ends with demo instructions, screenshots if feasible, acceptance test results and exact limits.
- Do not fake live integrations. Implement synthetic adapters first where credentials/hook support are missing.
- Do not claim tests pass unless executed; include command output summary.
- The priority is a beautiful, replayable vertical slice, not broad scaffolding across all future phases.

---

# Codex master implementation prompt

Copy everything in this section into Codex in an empty repository. This file's preceding sections are the binding specification.

```text
You are the founding engineer, creative director, simulation architect and security reviewer for MYCELIUM: The Living Internet.

MISSION
Build a local-first desktop application that turns developer events into a breathtaking, persistent, explorable procedural ecosystem. Repository = island; commit = tree; branch = illuminated path; agent session = creature/activity pulse; build/test signals = weather. Visual delight matters as much as technical correctness. Think bioluminescent forests, cyberpunk nature, organic geometry, cinematic lighting and playful interactions. Do not make a generic admin dashboard.

REFERENCE
Read LIVING-INTERNET-MOONSHOT.md in full (put this file at the repo root first). Its MVP, architecture, security and exit criteria are binding. Create a short AGENTS.md containing durable conventions and next-step instructions for future Codex sessions.

TECHNOLOGY
Use Tauri 2, Rust, SQLite, React, TypeScript, Vite, Three.js, React Three Fiber and well-maintained compatible supporting libraries. Verify current compatibility from installed package/toolchain docs before pinning versions. Keep backend data deterministic and independent of rendering. Do not introduce cloud services or mandatory model API calls.

WORKING STYLE
1. Inspect environment and repo first; do not overwrite existing work.
2. Write a short implementation plan and record key technical choices.
3. Implement P0 then P1 then P2, with runnable checkpoints after each. Do not jump directly to speculative P8 features.
4. Use realistic synthetic fixtures to make first-run experience compelling without Git/Codex setup.
5. Use typed Rust->TS contracts, minimal permissions, secure local storage and testable pure functions.
6. Build a captivating visual world: attractive lighting, organic seeded terrain, vegetation, gentle particles, hover feedback, flyover camera, compact controls. Add graceful graphics fallback and accessibility.
7. Ensure all visible world entities correspond to recorded provenance or are explicitly labeled decorative/simulated.
8. For Git ingestion: read-only explicit repo picker; commit identity, bounded historical scans, incremental refresh; never commit or modify user repositories.
9. For event replay: stable source IDs, SQLite uniqueness constraints, ordered deterministic processing, rewind snapshots, persisted selection and camera preferences.
10. Verify with formatting, static analysis, unit/integration tests and one E2E smoke flow. Report what actually ran and what could not run.
11. After each milestone update docs/PROGRESS.md and docs/DECISIONS.md.
12. Continue autonomously through P0-P2 as long as dependencies are locally available and tool permissions allow. If an action requires approval, request it rather than bypassing it. If you reach tool/context/time limits, leave a compilable checkpoint and a precisely actionable continuation note.

PHASED IMPLEMENTATION
P0: scaffold workspace, event schema, migrations, synthetic data generator, main desktop UI, tests and docs.
P1: procedural single-island 3D world with stable seeded layout, interaction, camera, lighting, instancing/LOD, reduced motion, and inspector.
P2: Git ingestion pipeline, event log, visualization mappings, timeline controls, deterministic history replay, snapshots, import idempotency and persistence.
Only after P0-P2 pass, propose P3 (Codex hooks) with exact integration permission flow and isolated tests. Do not automatically edit ~/.codex settings.

DECISIONS
Favor the smallest architecture that can support the moonshot: one Rust application and SQLite. Prefer functional core/imperative shell. Avoid speculative abstractions, microservices, complex orchestration frameworks and unnecessary package dependencies. If native build environment is missing, complete usable web demo plus Rust crates/tests and document desktop limitations; never pretend desktop was built.

DEFINITION OF DONE FOR THIS RUN
- A functioning, attractive application launches (desktop where environment permits, web viewer fallback otherwise).
- Demo event stream makes a beautiful island grow in front of the user.
- A Git repo can be imported (if Rust/native toolchain available) and visualized as commits/branches.
- Click-to-inspect and historical replay work with reproducibility tests.
- Persistence survives restart.
- No model/API key required.
- README has exact local run/test commands; PROGRESS clearly states shipped scope, missing scope and next milestone.

START NOW. Do not stop after writing a plan. Implement, test and demonstrate the earliest complete vertical slice before expanding.
```

## Suggested continuation prompts (one per subsequent Codex session)

**P3 — First contact:** "Read AGENTS.md, docs/PROGRESS.md and the master spec. Implement P3 only: documented Codex lifecycle metadata adapter behind explicit opt-in, safe queue, no prompt capture, hook failure resilience, first agent avatar, provenance inspector, tests. Do not modify global Codex config without my approval. Produce an executable demo and update progress."

**P4/P5 — Living archipelago:** "Implement fixed-tick ecology and multi-project islands according to the spec. Require deterministic simulation tests and bounded rendering benchmarks. Use rules before LLMs; visually distinguish simulated creatures and real agent sessions."

**P6/P7 — Meaning and time:** "Implement opt-in structured AI interpretation, content/cost disclosures, provenance labels, history snapshots and speculative time forks. Keep existing local-only functionality working with networking disabled."

**P8 — Experimental evolution:** "Build a sandboxed, simulation-only policy evolution lab with explicit fitness metrics, experiment genealogy, resource budgets and replayable results. Never give creatures host shell/repo-write permissions. Propose any real agent execution feature separately for my approval."

## References checked November 2026
- Codex hooks: https://learn.chatgpt.com/docs/hooks
- Codex SDK: https://learn.chatgpt.com/docs/codex-sdk
- Codex as a platform: https://developers.openai.com/blog/codex-as-a-platform
- Tauri architecture: https://v2.tauri.app/concept/architecture/
- React Three Fiber: https://r3f.docs.pmnd.rs/
- OpenTelemetry event conventions: https://opentelemetry.io/docs/specs/semconv/general/events/
