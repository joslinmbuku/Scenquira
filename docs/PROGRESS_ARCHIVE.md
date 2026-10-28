# Historical progress archive

Superseded chronological notes through October 28, 2026. See PLAN.md for current status. Pending statements below reflect their original time.

# Scenquira implementation evidence

Specification: `Scenquira_Codex_Execution_Plan_EN.md` (read in full on October 26, 2026).
Application and development language: English. No automatic publication or submission.

## Milestone checklist

### Browser session recovery — October 28, 2026

- Investigated the unavailable-service banner: web and backend both returned HTTP 200, and fresh authenticated state showed OBS Connected. A backend restart invalidates the browser's in-memory server session; the UI previously retried failed reads without renewing it and retained the outage banner after recovery.
- Added a single session renewal and read retry on HTTP 403, shared concurrent renewal requests, updated the CSRF token, and cleared only the offline warning after successful state refresh. Production commands are never automatically replayed.
- Verification: all 50 tests passed, including expired-session recovery, bounded retry, and network/server-failure cases; `npm run typecheck` and `git diff --check` passed. Web page and authenticated service session both returned HTTP 200. Browser visual confirmation remains pending. Twitch remains disconnected following the earlier backend restart.

### Overlay and real Suspense verification — October 28, 2026

- With user authorization, added one shared `Scenquira Overlay` browser input to `Scene` and `Welcome`, enabled above their existing sources. URL: `http://localhost:4000/overlay`; dimensions: 1920 × 1080; browser page control permissions disabled. No broadcast or recording was started.
- Initial real Suspense test failed safely and returned to Observe. Diagnosed OBS error 402: `boundsWidth` below minimum 1. OBS returns zero unused bounds dimensions for free-scale cameras but rejects them when sent back in a transform write.
- Changed the OBS adapter to write only the two modified scale properties during zoom and restoration, while retaining full snapshots for ownership checks. Added a regression test for zero bounds dimensions. `npm test`: 47 passed; server TypeScript build passed.
- Restarted the backend, reconnected OBS, and revalidated existing mappings. Real Suspense retest completed: camera scale increased, exact original transform restored, active execution cleared, and overlay state cleared after the sequence. Captured and visually inspected the actual OBS browser source showing countdown `9` in `.local/verification/suspense-overlay.png` (ignored local evidence; contains no camera imagery).
- Director left paused in Suggest. Twitch authorization must be repeated after the restart. Real collective Hype, actual incoming raid output, and remaining manual safety/reliability checks remain pending.

- [x] M0: Inspect workspace and specification. Workspace initially contains only the specification; no local Git metadata or repository instructions found. Windows PowerShell, Node 20.14.0, npm 10.7.0, Git 2.51.0.
- [x] M1: Scaffold and real connectors. Real Twitch chat receipt verified on October 28, 2026; real OBS test-scene round trip verified through OBS state and confirmed visually by the user.
- [x] M2: Deterministic production engine and controlled-clock tests. All three sequences and policy restrictions pass automated tests; real-service validation remains under M1/M4.
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

## Continuation verification (October 27, 2026)

- Read the full execution specification and inspected commit `c019c66` (`Init project : files configuration`) before continuing. The working tree was clean. Earlier environment notes above describe initial setup, not the current Git state.
- Baseline `npm test`: all 43 tests passed. `npm run typecheck`: passed for server and web.
- Added regression coverage for synchronous adapter throws, asynchronous start failures, and restoration failures. The synchronous-throw test failed before the fix: an adapter could leave the director active and propagate its error. Moved adapter startup into the scheduler's error boundary so it clears ownership, logs the failure, and returns to Observe.
- After the fix, `npm test`: all 46 tests passed across four files, including controlled-clock sequence restoration and failure handling.
- `npm run build`: server compiled, but Next.js's CSS worker failed with `EPERM` while resolving the Windows user directory. The escalated rerun and a rerun with the local Node binary directory prepended to PATH both reproduced the error; the failing worker still reported Node 20.14.0. Production build and HTTP smoke verification remain blocked by this environment issue.
- Final `npm run typecheck` and `git diff --check`: passed.
- M1/M4 remain pending authorized real Twitch and OBS checks. Browser visual and keyboard review also remain pending. No real-service performance or live-readiness result is claimed.

## Real connection setup (October 27, 2026)

- Created the ignored root `.env` from the placeholder example without overwriting any existing file. User is configuring Twitch credentials and OBS authentication locally; values have not been printed.
- No running OBS process or executable in the standard installation directories was found during inspection. This does not rule out a portable or custom installation.
- `localhost:3000` served another application (BML ERP). Added an optional launch-environment `SCENQUIRA_WEB_ORIGIN` and started Scenquira on port 3100 using webpack, keeping the service and OAuth callback on port 4000.
- Server compilation passed. All three security tests passed with `SCENQUIRA_WEB_ORIGIN=http://localhost:3100`. HTTP session creation returned 200 with that exact allowed origin; authenticated state reported Observe with Twitch and OBS disconnected. The web server compiled `/page` and returned 200.
- Credentials and user authorization are still required before real chat receipt and an OBS scene round trip can be verified. See the alternate-port startup procedure in `docs/SETUP.md`.
- Subsequent OAuth troubleshooting: credentials are now configured and the local callback matches the expected URL. A direct credential check failed with network `EACCES` in the sandbox, then returned HTTP 200 from Twitch outside it; the temporary app token was revoked successfully. No secrets or tokens were printed. Restarted the loopback backend outside the sandbox for outbound Twitch access. Broadcaster authorization and real chat receipt still require a fresh browser authorization attempt; this app-token check does not establish a user connection.
- User completed broadcaster authorization. Authenticated service state now confirms Twitch `Connected` (the connector sets this after EventSub subscription creation succeeds), with director in Observe. No real chat receipt timestamp yet. OBS remains disconnected and its password is not configured; M1's real chat and OBS scene-round-trip exit criteria remain pending.
- Subsequent real OBS setup: user enabled the WebSocket server and corrected its password after an authentication rejection (4009). Direct authentication and read-only scene enumeration succeeded. Restarted Scenquira with the corrected configuration; its connection command succeeded and authenticated state confirms OBS Connected, Observe, and paused. OBS contains one scene named `Scene` with no source items. No scene or transform was changed. A second test scene and camera source are needed for mappings and the round-trip check. Twitch is disconnected after this restart and needs authorization again.
- User added a `Welcome` scene with a text source and a direct `Video Capture Device` item in `Scene`. Read-only enumeration confirmed both. Validated and saved mappings: Main and Camera scene = `Scene`, camera item ID = 1, Welcome = `Welcome`, zoom = 1.1. Mapping validation succeeded; director remains paused in Observe. Current scene is Welcome, so select Scene before the explicit five-second round-trip test. Twitch still reports Disconnected with no chat receipt timestamp. The round trip has not yet been executed.
- Real OBS round-trip verification: user reported no visible change after clicking the test. History showed completed tests. Read-only OBS diagnostics confirmed Studio Mode disabled and the Welcome text item enabled with nonzero dimensions. Repeated the explicit test once: freshly queried OBS scene state was `Scene` before, `Welcome` during, and `Scene` after six seconds, with a Completed audit entry. This verifies the real scene-command round trip; user-visible output confirmation remains pending. Scenquira's preview is a state visualization, not live OBS imagery. Real Twitch chat receipt remains pending, so M1 is not yet complete.
