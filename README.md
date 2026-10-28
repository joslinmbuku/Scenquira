# Scenquira

**Production that follows your community's moments while keeping you in control.**

Scenquira is a local production assistant for solo Twitch streamers using OBS Studio, built with OpenAI Codex for the Codex x TwitchCon Hackathon. It turns collective chat activity into short visual sequences, asks for approval when requested, and gives manual controls priority.

## What it does

| Sequence | Trigger | Effect |
| --- | --- | --- |
| Hype | Collective activity above the recent baseline | Overlay and optional subtle camera zoom for 3 seconds |
| Raid Welcome | Incoming Twitch raid | Welcome scene and name/viewer-count overlay for 5 seconds, then return |
| Suspense | Streamer clicks Start Suspense | 10-second countdown and configured camera zoom, then restore |

Observe logs without effects. Suggest waits for approval. Auto executes authorized sequences. Pause, Do Not Disturb, and Restore My Scene keep control with the streamer. The preview in Scenquira is a state visualization; watch OBS for the actual image.

There is no runtime language model, emotion recognition, face tracking, or automatic broadcast start/stop. Codex helped build and debug the software; runtime decisions use deterministic rules.

## Verified status - October 28, 2026

- Real Twitch authorization and real chat receipt verified.
- Real OBS scene switch and return verified and confirmed visually by the user.
- Real Suspense countdown, camera zoom, exact framing restoration, and overlay cleanup verified.
- Suspense approval modal confirmed working by the user.
- Real Suspense: Pause, DND, and external scene/camera takeover passed; original framing restored after testing.
- Latest automated suite: 50 passing tests. Type checking passed after the modal change.

Real collective Hype, incoming-raid output, and the full manual safety/reconnection checklist remain pending. This is a working prototype, not a claim of complete live-production validation. See [verification evidence](docs/VERIFICATION.md).

## Start here

Use **Node.js 22 LTS or newer**, npm, and a local computer. The verified environment is Windows with OBS 33.0.0 and obs-websocket 5.7.6. Other operating systems have not been validated.

From the repository root in PowerShell:

~~~powershell
node --version
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
~~~

For the documented Windows demo, use two terminals. Port 3100 avoids the existing application on port 3000, and webpack avoids the Turbopack worker error observed locally.

**Terminal 1 - backend:**

~~~powershell
$env:SCENQUIRA_WEB_ORIGIN = 'http://localhost:3100'
npm run dev -w @scenquira/server
~~~

**Terminal 2 - interface:**

~~~powershell
npm run dev -w @scenquira/web -- --webpack --port 3100
~~~

Open **http://localhost:3100**. Keep both terminals running. The backend and overlay use port 4000. Use the exact localhost address, not 127.0.0.1 in the browser.

For the default port-3000 launch, unset SCENQUIRA_WEB_ORIGIN and use npm run dev. Do not start a second copy if a service is already running. The full production build previously failed in the local Turbopack worker; the development path above is the demonstrated path. A clean production build remains a delivery check.

## Choose your test path

**No Twitch account or OBS needed:** open Simulator, choose Auto, enable Hype and Raid Welcome under Allow in Auto, advance warm-up, then click Collective Hype. Wait for completion before trying Incoming raid. All output is labeled SIMULATION and does not control OBS.

**Real Twitch and OBS:** follow [the setup guide](docs/SETUP.md), then [the real-use test walkthrough](docs/TESTING.md). Start with chat receipt and the Welcome scene test before enabling Auto.

**Try Suspense after setup:** select the camera scene in OBS. In Live Director, Resume, choose Suggest, disable Do Not Disturb, and click Start Suspense. Click Approve in the modal within 15 seconds. Watch OBS for the countdown and zoom. Nothing should execute while paused or in Observe.

## Documentation

| Document | Purpose |
| --- | --- |
| [Setup](docs/SETUP.md) | Twitch registration, OBS scenes, mappings, overlay, troubleshooting |
| [Testing and real use](docs/TESTING.md) | Sequential tests with expected results and daily startup |
| [Verification](docs/VERIFICATION.md) | Evidence and uncompleted acceptance checks |
| [Plan](docs/PLAN.md) | Current milestones and next priorities |
| [Demo and submission](docs/DEMO.md) | Recording script and hackathon delivery checklist |
| [Local API](docs/API.md) | Sessions, commands, and read-only overlay |

## Development

~~~powershell
npm run typecheck
npm test
npm run build -w @scenquira/server
~~~

The workspace contains apps/web (Next.js/React/Tailwind), apps/server (NestJS, connectors, engine, simulator), and packages/shared (contracts and English strings). Full build/start commands are npm run build and npm start; their combined production path still needs verification on the target machine.

## Privacy and limitations

Keep .env private. Credentials stay server-side. Tokens, mappings, configuration, and bounded history are held in memory: restarting the backend requires Twitch authorization and OBS mapping again. Read-session recovery in the browser does not restore those integrations.

Only direct camera scene items with No bounds framing are supported. Zoom changes scale; it does not track a face. A crash or outage can prevent restoration; use OBS directly to recover. The simulator cannot prove real-output reliability. Raw chat text is not retained in audit history.

The hackathon submission has not been published or submitted. The [delivery checklist](docs/DEMO.md) identifies remaining work and required evidence.
