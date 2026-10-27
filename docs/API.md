# Local API

Base URL: `http://localhost:4000`, IPv4 loopback only. The browser frontend origin is `http://localhost:3000`. JSON command bodies are validated using Zod; invalid bodies return 400, missing session/origin/CSRF returns 403. Responses use no-store caching. There is no remote control or permissive CORS mode.

## Session

`POST /session` requires the exact frontend Origin. It sets an HttpOnly, SameSite=Lax cookie and returns `{ csrf }`. Keep this value only in memory and send it as `X-Scenquira-CSRF` on commands, with credentials. Sessions expire after 12 hours. Reload to establish a new session after expiration.

## Read endpoints (session required)

- `GET /state`: independent real/simulated director snapshots, bounded history, OBS connection/mapping state, Twitch receipt timestamp and missed-event intervals, and overlay URL. Never contains secrets or raw chat text.
- `GET /scenes`: current OBS scene identifiers/names.
- `GET /items?scene=...`: direct source item IDs and display names.
- `GET /auth/twitch/callback`: registered OAuth callback; verifies one-time state, session binding, and expiration before exchanging the code.

## Commands

`POST /command` accepts one of:

```json
{ "action": "configure", "target": "SIMULATION", "value": { "mode": "Auto", "authorized": ["Hype", "Raid Welcome", "Suspense"] } }
```

`target` is `REAL` or `SIMULATION`. Configuration also accepts `context`, `paused`, `dnd`, and `intensity` (0–1).

| Action | Additional fields | Behavior |
| --- | --- | --- |
| `suspense` | target | Explicit bounded Suspense through the common policy |
| `cancel` | target | Cancel and restore still-owned properties |
| `restore` | target | Cancel, restore still-owned properties, and pause |
| `approve`, `dismiss` | target, id | Resolve a pending proposal |
| `simulate` | scenario | `warm`, `hype`, `raid`, `spam`, `stale`, `duplicate`, `manual`, or `reset` |
| `obs-connect`, `obs-disconnect` | none | Use server environment credentials; invalidate old snapshots |
| `map` | mapping | Validate main/welcome/cameraScene, cameraId, zoom (1–1.2) |
| `obs-test` | none | Explicit five-second Welcome round trip using the scheduler |
| `recover-main` | none | Pause and explicitly switch to freshly validated mapped Main |
| `twitch-connect` | none | Return an authorization URL with one-time state |
| `twitch-disconnect` | none | Clear tokens and attempt revocation |

## Public read-only overlay

`GET /overlay` is the OBS browser-source page. `GET /overlay/state` exposes only the currently displayed real effect and server time. There are no public mutating overlay routes. Display text uses DOM textContent, not HTML interpolation of event data. The overlay clears itself if polling fails or the effect expires.
