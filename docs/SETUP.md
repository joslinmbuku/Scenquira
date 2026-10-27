# Install and connect Scenquira

Use a local Windows, macOS, or Linux computer running OBS Studio. The service binds to IPv4 loopback; do not expose either port publicly. Open the application as `http://localhost:3000` (the origin is intentional).

## Install

Use Node 22 LTS or newer and npm. From the repository root:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

The web interface is at http://localhost:3000. The NestJS service uses http://localhost:4000. For production builds, run `npm run build`, then `npm start`. Both processes must remain running during a sequence. Check with `npm run typecheck` and `npm test`.

## Twitch

1. Register a confidential application in the Twitch developer console. Enable two-factor authentication on the registering account if requested by Twitch.
2. Register the exact OAuth callback `http://localhost:4000/auth/twitch/callback`.
3. Put the client ID and client secret in the root `.env`. Restart the local service after editing environment values.
4. In Connections, choose **Authorize Twitch** and sign in as the broadcaster whose chat you want to receive. This MVP uses that same user ID for the chat reader and broadcaster.
5. Send one real message to that channel. Connections should show Connected and a real chat receipt timestamp; History should contain “Real Twitch chat message received.” Keep Observe selected for this initial check.

The installed-chatbot user-token flow requests only `user:read:chat`. It does not send messages. `channel.chat.message` version 1 uses `broadcaster_user_id = user_id = validated token user`. Incoming `channel.raid` version 1 uses `to_broadcaster_user_id`; this event needs no additional scope. Paid subscriptions are not required. The client secret and access/refresh tokens stay server-side, in memory. Restarting requires authorization again. Disconnect attempts revocation and clears local tokens.

Tokens are validated at authorization and every 55 minutes; expired tokens are refreshed using the server-side authorization-code refresh token. Revocation and permission errors require reauthorization. WebSocket requested migrations transfer the existing subscriptions; transport loss creates a new session and subscriptions. Connection gaps are displayed as potentially missed events, never as recovered events.

References checked during implementation (October 26, 2026):

- [Installed chatbot authentication](https://dev.twitch.tv/docs/chat/authenticating/)
- [EventSub subscription types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/)
- [WebSocket lifecycle](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/)
- [Authorization code flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/)
- [Token validation requirements](https://dev.twitch.tv/docs/authentication/validate-tokens/)

## OBS Studio

1. Use an installation supporting obs-websocket v5 (built into OBS Studio 28 and later). Open Tools → WebSocket Server Settings. Enable the server and authentication. Keep access local; never forward port 4455 on a router.
2. Set `OBS_URL=ws://127.0.0.1:4455` and `OBS_PASSWORD` in `.env`; restart Scenquira. Passwords are never sent to the web UI.
3. Use a test scene collection. Create or select Main and Welcome scenes yourself. Scenquira does not create, delete, or rename scenes and never starts or stops a broadcast.
4. Connect OBS, read the available scenes, and map Main, Welcome, Camera scene, and Camera source. Sources nested in groups are not supported in this first implementation; select a direct scene item.
5. For digital framing, set the camera item's bounding-box type to “No bounds” in OBS. Choose a suitable centered alignment/framing yourself. The configured zoom is bounded to 1.0–1.2 and scaled by Intensity. It is not face tracking. Hype and Suspense zoom only when the camera's mapped scene is the current scene; their overlay can still run elsewhere.
6. Validate and save mappings. Mapping changes pause the director; return to Live Director and Resume when ready.
7. Add `http://localhost:4000/overlay` as a browser source (1920 × 1080) in relevant test scenes. This URL is read-only and transparent when idle.
8. Choose the explicit Welcome scene test. It temporarily uses Suggest, performs a five-second Raid Welcome, and returns only if the sequence retains control. DND still blocks it. Watch OBS directly and confirm both the switch and the return. Record actual results in `docs/VERIFICATION.md`.

OBS reconnect is explicit through Connect OBS. Reconnection discards old snapshots, rereads current state, removes old mappings, pauses, and selects Observe. Revalidate mappings before enabling Auto again.

[obs-websocket-js](https://github.com/obs-websocket-community-projects/obs-websocket-js) and the [OBS protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md) were consulted before implementation.

## Safe operating controls

- **Observe:** computes and logs without changing OBS or the on-stream overlay.
- **Suggest:** waits for Approve; approval rechecks controls, readiness, freshness, and limits. Proposals expire after 15 seconds and do not form a backlog.
- **Auto:** requires valid mappings and explicit authorization per sequence. Starts are limited to three automatic sequences per rolling minute; Hype has a 45-second cooldown.
- **Pause:** cancels the active sequence, clears proposals, and restores still-owned properties. Resume allows future decisions; suppressed events are not replayed.
- **Do Not Disturb:** blocks all sequences, including raids and explicitly requested Suspense; enabling it cancels the current effect.
- **Restore My Scene:** cancels timers, restores still-owned scene/framing properties, clears proposals, and pauses. It does not overwrite a manual change or blindly switch to Main.
- **Manual takeover:** external scene or affected camera changes cancel the sequence. A bounded expected-event list distinguishes application changes from other OBS events. Restoration checks current values before writing. A simultaneous external write in the final OBS request round trip remains a protocol-level race; validate behavior on your installation.
- **Recovery after a crash/outage:** restoration cannot be guaranteed. Use OBS directly to restore your preferred scene and camera framing. After reconnecting and mapping, the explicit **Recover to mapped Main scene** control rereads state and switches only the scene to mapped Main; it cannot reconstruct lost camera transforms. It pauses the director.

## Simulator

Simulator is an isolated director and simulated OBS adapter; it cannot write to real OBS. Its modes and permissions are separate. Select Auto, authorize desired sequences, advance the warm-up by 70 seconds, then use Collective Hype, Incoming raid, or Start Suspense. Also exercise one-person repetition, duplicates, stale events, and manual takeover. Every simulated record carries SIMULATION. Warm-up advances the activity clock only when idle; sequence durations still use real timers.

## Privacy and local trust

Only capped participant/time/reaction data is retained in a 70-second activity window. Raw chat text is discarded after classification. No persistent chat log, token export, or browser localStorage is used. Audit history is bounded to 300 records per director in memory. Settings and mappings are session-only; reconfigure after restarting. The browser has an HttpOnly local session cookie and an in-memory CSRF token; mutating commands validate the exact application origin. Other local processes and browser extensions are within the host trust boundary. The read-only overlay exposes only the currently displayed effect and raid display data.
