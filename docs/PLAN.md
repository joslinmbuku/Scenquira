# Scenquira execution plan and evidence

Updated October 28, 2026. Timezone: Africa/Kinshasa. Specification: [execution plan](../Scenquira_Codex_Execution_Plan_EN.md). Application and delivery documentation remain in English.

## Current milestones

| Milestone | Status | Evidence / remaining work |
| --- | --- | --- |
| M0: environment | Complete | Windows workspace, dependencies, strict TypeScript, setup documentation |
| M1: real connectivity | Complete | Real Twitch chat receipt and actual OBS scene round trip, user confirmed |
| M2: production engine | Automated criteria met | Three sequences and policy covered by controlled-clock tests; real reliability belongs to M4 |
| M3: interface and overlay | Implemented; acceptance partial | Real overlay rendered; user confirmed Suspense approval modal; independent onboarding and full keyboard/mobile review pending |
| M4: reliability and real output | In progress | Real Suspense verified; collective Hype, incoming raid, manual control matrix and reconnect tests pending |
| M5: delivery | In progress | README, setup, walkthrough and submission draft updated; clean install/build, recording and submission pending |

## Verified evidence

- October 28, 00:02:01 GMT+1: service recorded a REAL Twitch chat receipt. OAuth and EventSub subscription creation succeeded with the configured read-chat scope.
- Real OBS state read Scene > Welcome > Scene during the explicit five-second test; user confirmed visible operation.
- OBS 33.0.0, obs-websocket 5.7.6, Windows reported by the real service.
- Added a shared 1920 x 1080 browser overlay to Scene and Welcome with user authorization. No broadcast or recording was started.
- Real Suspense completed: countdown screenshot from OBS browser source, increased camera scale, exact original transform restored, active sequence and overlay cleared. Local screenshot: .local/verification/suspense-overlay.png (ignored; not a public deliverable).
- User confirmed the new approval modal works. It opens for streamer-requested Suspense in Suggest, displays expiry, supports Approve/Dismiss, and uses a native modal dialog.
- Latest complete test suite: 50 passed. Type checking passed after the modal change. Server compilation passed. No need to rerun unchanged suites for documentation-only updates.

## Fixes driven by real testing

| Finding | Change | Verification |
| --- | --- | --- |
| Immediate adapter throw could leave an execution active | Handle startup inside scheduler error boundary | Regression tests |
| OBS rejected zero unused bounds dimensions | Write only scaleX/scaleY for zoom and restore; retain full ownership snapshots | Regression test and real Suspense |
| Browser reported offline after backend restart | Renew expired read sessions once; update CSRF; clear offline banner after successful read | Three recovery tests; HTTP checks |
| Approve was hidden below the controls panel | Native approval modal after Start Suspense in Suggest | Type checking and user confirmation |

## Next priorities, in order

1. Continue the [real-use walkthrough](TESTING.md): expiry/Observe/Auto permissions and manual priority for Hype and Raid Welcome. Pause, DND and external scene/camera takeover passed for real Suspense. Record outcomes in [VERIFICATION.md](VERIFICATION.md).
2. Arrange five consenting participants for a real collective Hype test. Do not lower thresholds silently or present simulator output as real evidence.
3. Verify an incoming raid if available. Otherwise label its demo segment SIMULATION and retain the real raid check as pending.
4. Test OBS loss/reconnect and Twitch authorization failure without replaying old effects; document manual recovery.
5. Verify clean installation and a complete production build. Current working development launch uses port 3100 and webpack; the previous Turbopack production build failed with Windows EPERM.
6. Record the English demo, assemble submission links and primary Codex session ID, review the official requirements, and let the owner submit.

P1 runtime AI, extra profiles, audio, and exports remain deferred. Preserve real connectivity, manual controls and the three sequences first.

## Operating notes

- Both servers are local. Backend/overlay: localhost:4000. Documented demo UI: localhost:3100. SCENQUIRA_WEB_ORIGIN must match the UI and be set in the backend launch environment.
- The default npm run dev uses port 3000; another application occupied that port on the inspected machine.
- Backend restarts clear tokens, mappings, history and director state. The browser can recover its session but Twitch must be authorized and OBS mapped again.
- The sandbox denied outbound Twitch access. Real authorization succeeded when the backend ran with the required network access. Do not interpret this as invalid credentials.
- No publication, video upload, repository push or competition submission has been performed by this work.

## Documentation maintenance

After each meaningful implementation or real test, update this current plan and the relevant guide. Mark each claim as implemented, automatically verified, real-service verified, or pending. Keep README concise and link detailed procedures. Preserve user-confirmed outcomes without secrets or raw chat.

Earlier setup notes are preserved in [the chronological archive](PROGRESS_ARCHIVE.md). They contain superseded pending states; this file and VERIFICATION.md describe the current status.

## Real manual-priority tests - October 28, 2026

At 21:20-21:21 Africa/Kinshasa, four checks passed against real OBS using the application command API and an independent authenticated OBS client. Pause and DND cancelled active Suspense, cleared the overlay, restored original framing, and blocked new Suspense. External scene and camera changes survived beyond the original ten-second timer deadline without takeover. These external changes were injected by a separate OBS client, not mouse/keyboard interaction.

Local evidence: .local/verification/manual-priority.json. Test camera framing was restored afterward; the camera scene is current and the director is paused in Suggest with DND off. Twitch was disconnected before these tests and was not changed. These results cover Suspense only; other sequence/manual-control combinations remain pending.
