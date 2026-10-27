# Scenquira implementation evidence

Specification: `Scenquira_Codex_Execution_Plan_EN.md` (read in full on October 26, 2026).
Application and development language: English. No automatic publication or submission.

## Milestone checklist

- [x] M0: Inspect workspace and specification. Workspace initially contains only the specification; no local Git metadata or repository instructions found. Windows PowerShell, Node 20.14.0, npm 10.7.0, Git 2.51.0.
- [ ] M1: Scaffold and real connectors. Real chat receipt and intentional test-scene round trip are pending external setup.
- [ ] M2: Deterministic production engine and controlled-clock tests.
- [ ] M3: Connections, Live Director, Simulator, History, and read-only overlay.
- [ ] M4: Automated reliability checks and authorized real-output demonstration.
- [ ] M5: Installation, recovery, demo script, limitations, and delivery documentation.

## Manual setup needed

1. Use Node 22 LTS or newer: the selected framework packages accept Node 20, but a transitive Nest dependency requires Node 22. Installation and runtime verification are in progress.
2. Register a Twitch application with the exact callback documented in `.env.example`; configure its client ID and secret locally, then authorize the broadcaster. Never send secrets in chat.
3. Run OBS Studio with authenticated obs-websocket v5 enabled on loopback. Supply the password locally. Map existing test scenes and camera source in Connections.
4. Authorize a test scene round trip, verify a real chat message, and later test with multiple participants and capture actual OBS output.

## Evidence and blockers

- Read full specification; no implementation existed at inspection.
- `git status --short`: not a Git repository. Existing GitHub remote inspection pending network access.
- npm/GitHub requests hit restricted network access; requested sandbox escalation.
- OBS executable was not found on PATH. This is not proof that OBS is absent; real connection availability remains unverified.
- Official Twitch authentication, EventSub lifecycle, subscription types, and obs-websocket-js documentation reviewed before integration work.
- No real-service, latency, or live-readiness claims have been made.

## Implementation progress

- Preserved existing remote `main` history locally; remote initially contained only README.md. Nothing pushed.
- Selected Next.js 16.4.3, NestJS 12.2.0, obs-websocket-js 5.0.8 from registry metadata.
- User requested Tailwind directly; added Tailwind PostCSS integration and utility-based dashboard styling. Dependency installation is being verified.
- Implemented OAuth state/session binding, token validation/refresh, chat and incoming-raid subscriptions, keepalive/loss/migration handling, revocation, and missed-event intervals. These are implemented, not yet verified with Twitch.
- Implemented mapped OBS scenes/items, bounded expected-event correlation, property ownership, read-before-restore, explicit test and recovery controls. Real validation pending.
- Added independent simulation, controlled-clock engine tests, origin/session/CSRF boundary tests, and English shared resources.
- M1 remains pending its real-service exit criterion. M2/M3 independent implementation is underway as permitted by the specification.
- Initial dependency installation encountered extraction conflicts; resolving before build/test evidence is recorded.

## Verification log (October 26–27)

- `npm run typecheck`: passed before dependency refresh (both server and web).
- First controlled-clock suite: 18 passed, 10 failed. Found and fixed captured `Date.now` reference; clock now calls the current implementation so a controlled clock applies consistently. Final rerun pending.
- Added Twitch protocol tests for OAuth state/session binding, exact subscription conditions, migration without resubscription, transport-loss resubscription, watchdogs, revocation, and channel normalization.
- Added OBS adapter tests for mapped IDs, expected-event correlation, exact framing restoration, manual scene/camera ownership, and disconnect invalidation.
- Browser skill initialization and browser listing returned no available browser. Browser visual/keyboard review remains pending; this is not marked verified.
- Dependency audit identified outdated Vitest/Zod and Multer. Updated Vitest to 5.0.5, Zod to 4.6.7, and requested Multer >=2.5.0 through an override.
- Existing lockfile contained incomplete package metadata after overlapping initial installs; archived generated dependencies and lockfile under ignored `.local/install-backup`, then started a clean Node 22 install. No source files were deleted. Build/test/audit must be rerun on the clean tree.
- No `.env` exists yet; Twitch credentials and authenticated OBS setup remain manual prerequisites. P1 runtime AI and community profiles remain deferred until P0 real validation.
