# Install and connect Scenquira

Follow this guide once, then use [Testing and real use](TESTING.md). Instructions below target the verified Windows setup. Keep the interface in English; French OBS menu equivalents are included where useful.

## 1. Install and launch

Install Node.js 22 LTS or newer and npm. Download or clone this repository and open PowerShell in its root folder.

~~~powershell
node --version
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
~~~

Never overwrite an existing .env just to restart. Complete both credential sections below before launching where possible; environment changes require a backend restart.

**Terminal 1:**

~~~powershell
$env:SCENQUIRA_WEB_ORIGIN = 'http://localhost:3100'
npm run dev -w @scenquira/server
~~~

**Terminal 2:**

~~~powershell
npm run dev -w @scenquira/web -- --webpack --port 3100
~~~

Open **http://localhost:3100** and keep both terminals open. This is the documented demo configuration. API and overlay: localhost:4000. OBS WebSocket: 127.0.0.1:4455. Use localhost in the browser for the session and OAuth flow.

Set SCENQUIRA_WEB_ORIGIN in the backend terminal, not only in .env: it is currently read before .env loading. The default single-command launch, npm run dev, uses port 3000 and requires that variable to be unset or match localhost:3000. Do not run both launch methods simultaneously.

The Windows Turbopack production build previously failed with EPERM in its CSS worker. The webpack development launch is verified; a complete production build and clean-install rehearsal remain pending. npm run build and npm start are available but are not the verified demo launch path.

## 2. Register Twitch

1. Sign in at [Twitch Developer Console](https://dev.twitch.tv/console/apps).
2. Choose Register Your Application (Enregistrer votre application).
3. Enter a unique application name, choose an appropriate application-integration category, and choose Confidential if the form asks for client type.
4. Register this exact OAuth redirect URL: **http://localhost:4000/auth/twitch/callback**. Keep port 4000 even though the interface uses 3100.
5. Create the application, open Manage, copy Client ID, and generate a Client Secret.
6. Save the values in the root .env. Do not use your Twitch username as the client ID.

~~~dotenv
TWITCH_CLIENT_ID=your_application_client_id
TWITCH_CLIENT_SECRET=your_application_client_secret
TWITCH_REDIRECT_URI=http://localhost:4000/auth/twitch/callback
~~~

Restart the backend after edits. In Scenquira, open Connections > Authorize Twitch and authorize the broadcaster account whose chat you want to receive. Wait for Connected.

To send a test message: open Twitch > profile picture > Channel > Chat, type a short message, and press Enter. Check the real receipt timestamp in Connections. This works while the channel is offline.

The connector requests user:read:chat, with the authenticated user as both broadcaster and chat reader. Incoming channel.raid requires no additional scope. Tokens remain server-side and in memory. Restarting requires authorization again. Disconnect clears local tokens and attempts revocation.

References: [registration](https://dev.twitch.tv/docs/authentication/register-app/), [chat authentication](https://dev.twitch.tv/docs/chat/authenticating/), [OAuth](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/), [EventSub lifecycle](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/).

## 3. Enable OBS WebSocket

1. Install/open [OBS Studio](https://obsproject.com/download). The real checks used OBS 33.0.0 with obs-websocket 5.7.6 on Windows.
2. Open Tools > WebSocket Server Settings. Enable the server, set port 4455, enable authentication, and click Apply/OK.
3. Use Show Connect Info to copy the Server Password. Save it in .env, keeping it private.

~~~dotenv
OBS_URL=ws://127.0.0.1:4455
OBS_PASSWORD=your_obs_websocket_password
~~~

Restart the backend after edits. In Connections, click Connect OBS. Keep the WebSocket local and never forward its port on your router. [OBS remote-control guide](https://obsproject.com/kb/remote-control-guide).

## 4. Prepare two test scenes

Use a test scene collection. Do not begin broadcasting yet.

1. Keep or create a main scene. In the verified setup it is named Scene.
2. Select it and add Sources > + > Video Capture Device. Select your camera and arrange its framing.
3. Right-click the camera source > Transform > Edit Transform. Use No bounds for the bounding-box type. Digital zoom does not track a face or automatically center the crop.
4. Add a second scene named Welcome.
5. Select Welcome > Sources > + > Text (GDI+) on Windows. Create a source, enter Welcome!, and click OK. Drag/resize the text in the preview. If Sources is missing, enable Docks > Sources.

These names are examples, not hardcoded requirements. The app maps existing scenes and direct camera items. Cameras nested in groups are not supported.

## 5. Save scene mappings

In Scenquira > Connections, click Read scenes and sources. For the example above:

| Setting | Select |
| --- | --- |
| Main scene | Scene |
| Welcome scene | Welcome |
| Camera scene | Scene |
| Camera source | Video Capture Device |
| Digital zoom factor | 1.1 |

Click Validate and save mappings. This pauses the director. The scene/source form may need Read scenes and sources again after a page reload; saved mapping state is held by the backend until it restarts.

## 6. Add the overlay

If Scenquira Overlay already exists in both scenes, do not add duplicates.

1. In OBS, select the main scene > Sources > + > Browser.
2. Name it Scenquira Overlay. Uncheck Local file if selected.
3. URL: **http://localhost:4000/overlay**. Width: **1920**; height: **1080** for a 1920 x 1080 base canvas.
4. Keep its background transparent. Disable page control permissions when that option is available; it needs only read access.
5. Move it above the camera in Sources and keep its eye icon enabled.
6. In Welcome, add a Browser source using Add Existing > Scenquira Overlay, above the text source.

An idle overlay is transparent: an empty image is normal until a sequence runs. The overlay source was already installed in the developer's current Scene/Welcome collection; a new installation must add its own.

## 7. First visible tests

**Welcome:** select Scene in OBS, then click Switch to Welcome for 5 seconds, then return in Connections. Watch OBS, not Scenquira's state preview. Twitch is not required for this explicit connection test.

**Suspense:** select Scene in OBS. In Live Director choose Suggest > Resume if paused > disable Do Not Disturb > Start Suspense. Approve in the modal within 15 seconds. Watch the countdown/zoom and restoration in OBS. The user confirmed this flow works.

Continue with [the real-use walkthrough](TESTING.md) before enabling automatic effects.

## Safe operating controls

| Control | Behavior |
| --- | --- |
| Observe | Logs decisions; no overlay or OBS effects |
| Suggest | Creates proposals; approval rechecks current conditions and expiry |
| Auto | Requires valid mappings and explicit automatic-sequence permissions |
| Pause | Cancels current effects and blocks new ones |
| Do Not Disturb | Blocks all sequences, including explicitly requested Suspense |
| Cancel sequence | Cancels the current effect and restores still-owned properties |
| Restore My Scene | Cancels timers, restores owned properties, and pauses; does not blindly switch to Main |
| Recover to mapped Main scene | Explicit recovery command that pauses and switches to validated Main; cannot recover lost camera snapshots |

External scene or camera changes cause the sequence to yield. A service crash or OBS outage can prevent restoration: use OBS directly to recover. Reconnect discards old snapshots, returns to Observe, pauses and removes mappings; read and validate them again. Suppressed or stale events are not replayed.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Another application appears | Use localhost:3100 with the matching backend launch environment |
| Service unavailable | Keep both terminals running; refresh the exact localhost URL. The UI now renews expired read sessions after restarts |
| Twitch authorization failed | Check callback spelling and client credentials; restart after .env edits. Backend must reach Twitch over HTTPS/WebSocket; a sandbox network denial can also cause failure |
| OBS connection refused | OBS must be running with WebSocket enabled on port 4455; click Apply |
| OBS authentication failed | Copy Server Password from Show Connect Info, save .env, restart backend |
| Start Suspense does nothing | Check Recent decision: Resume, choose Suggest, disable DND, then Approve in the modal |
| No modal | Only a valid Suspense proposal in Suggest opens it; Observe/Pause/DND block it, and proposals expire after 15 seconds |
| No visible scene change | Start on Main, not Welcome. Watch OBS; in Studio Mode inspect Program output |
| Countdown invisible | Confirm overlay URL/dimensions, enabled eye icon, top layer and current scene; idle overlay is transparent |
| Camera does not zoom | Use mapped camera scene, direct item, No bounds, zoom above 1 and Intensity above 0 |
| Hype does not trigger | Check warm-up, participants, message/reaction count, baseline, context, permissions, cooldown and budget in TESTING.md |
| Connections lost after restart | Expected: reauthorize Twitch, reconnect OBS and validate mappings; browser session recovery does not restore tokens |

## Privacy

The application binds to loopback. Commands require the exact configured origin, a local session and CSRF token. The public overlay cannot command OBS. Credentials must never be committed or shown in demo footage. Raw chat is classified transiently; audit history holds bounded decisions, not message text. Configuration, tokens and history remain in memory.
