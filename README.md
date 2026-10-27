# Scenquira

Production that follows your community’s moments while keeping you in control.

Scenquira is a local production assistant built with Codex for solo Twitch streamers using OBS Studio. It provides Hype, Raid Welcome, and explicitly started Suspense, with Observe, Suggest, and Auto modes. English is the primary application language.

**Status:** Implementation and automated verification are in progress. Real Twitch/OBS validation is pending. Simulation is not evidence of live readiness. See [milestone evidence](docs/PLAN.md).

## Run locally

Use Node 22 LTS or newer and npm. The project includes a local Node 22 development runtime for the inspected Windows environment.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:3000**. The local service listens on **http://localhost:4000**. Keep the exact `localhost` origin. The Simulator works without Twitch or OBS and is isolated from real production. Select Auto and authorize sequences in Simulator, advance warm-up, then run Collective Hype or Incoming raid. Start Suspense from its director controls.

```powershell
npm run typecheck
npm test
npm run build
npm start
```

## Connect your stream

Follow the [installation and connection guide](docs/SETUP.md) to register a Twitch application, configure local secrets, enable authenticated OBS WebSocket v5, map existing scenes and a camera item, and add the read-only overlay. No broadcast starts or stops automatically.

The application starts in Observe. Auto requires validated mappings and explicit sequence authorization. Pause, Do Not Disturb, Restore My Scene, and manual scene/framing changes take priority. Lost connection snapshots are discarded; use the documented [recovery procedure](docs/SETUP.md#safe-operating-controls) after a crash or outage.

## Workspace

- `apps/web`: Next.js, React, and Tailwind CSS control room.
- `apps/server`: NestJS loopback service, Twitch/OBS adapters, deterministic engine, and simulator.
- `packages/shared`: strict TypeScript contracts and English resources.
- `docs/PLAN.md`: milestone progress and actual evidence.
- `docs/VERIFICATION.md`: required real-world acceptance checklist.
- `docs/DEMO.md`: English video script and submission draft notes.

Configuration, mappings, tokens, and bounded audit records remain in memory. The root `.env` is ignored by Git. Raw chat is classified transiently and is not retained in history. There is no runtime model, emotion recognition, face tracking, payment system, or cloud service.

Known limits include session-only configuration, direct camera items only, free-scale digital zoom, and no guaranteed restoration when the service or OBS is unavailable. Real service testing, measured real latency, browser visual review, and authorized demo recording remain pending until recorded in the verification checklist.
