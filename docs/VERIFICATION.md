# Verification record

Do not mark a real-service check complete from simulated output. Record date, OBS version, operating system, and sanitized observations. Never attach tokens, full chat logs, or unnecessary participant identifiers.

## Recorded real evidence

Real connectivity evidence recorded October 28, 2026 (Africa/Kinshasa): authenticated service state reports Twitch and OBS Connected. History contains a REAL chat receipt at 00:02:01 GMT+1, with no message text retained here. The real OBS test was queried as Scene → Welcome → Scene, and the user subsequently confirmed the visible switch worked. Read-only GetVersion reports OBS 33.0.0, obs-websocket 5.7.6, Windows. These checks satisfy M1; remaining output, safety, and reliability checks below are still pending.

## Automated checks

Latest complete suite: **50 passed**. Type checking passed after the approval-modal implementation. Server build passed. Full production build remains blocked/unverified after the Windows Turbopack worker error.

Commands: `npm run typecheck`, `npm test`, `npm run build`.
Results are tracked in `docs/PLAN.md` after execution.

## Required real integration checks — PENDING

- [x] Real Twitch authorization succeeds with only `user:read:chat`.
- [x] Real chat message produces a REAL receipt in History.
- [x] Explicit test switches to mapped Welcome and returns to the captured scene.
- [x] User confirmed that Start Suspense opens the approval modal and the approval flow works (October 28).
- [ ] A new user maps direct scenes/items without code changes.
- [ ] Five or more real participants produce at least ten accepted messages in ten seconds after warm-up; actual OBS browser-source Hype appears. Each participant contributes at most three per ten seconds.
- [ ] Welcome shows the incoming raid name/count; any simulated raid in the demonstration is visibly labeled.
- [x] Suspense countdown and configured framing appear in actual OBS output and restore. October 28: actual browser-source screenshot shows the countdown; real camera scales increased and the complete original transform was restored after ten seconds. Sequence completed and overlay cleared. Local evidence: `.local/verification/suspense-overlay.png`.
- [x] Real Suspense: external scene and camera changes survive its timer deadline (separate OBS client, October 28).
- [ ] Manual takeover for Hype and Raid Welcome, plus mouse/keyboard interaction on the target OBS installation.
- [x] Real Suspense: Pause and DND cancel, restore, clear the overlay and block new requests (October 28).
- [ ] Complete the real control matrix: Observe, expired approvals, Auto permissions and other sequence combinations.
- [ ] Invalid OBS password, deleted/missing source, revoked Twitch token, and closed OBS show recoverable states.
- [ ] EventSub requested migration preserves subscriptions; network loss resubscribes, displays gaps, and never replays stale effects.
- [ ] OBS reconnection resets to Observe and invalidates old snapshots/mappings.
- [ ] Closing the service mid-effect is recovered manually; no guaranteed outage restoration is claimed.
- [ ] Desktop/narrow-screen browser layout, keyboard controls, focus, errors, and overlays are visually checked.

## Timing evidence — NOT MEASURED ON REAL SERVICES

History API entries carry `decisionMs` (receipt → policy decision) and `acknowledgementMs` (sequence start → completed initial OBS operation). They are separate intervals. Record samples from the authorized test machine. The suggested one-second target is not an achieved measurement, and neither interval measures viewer video-delivery latency.

| Date / machine / OBS version | Scenario | Receipt → decision | Decision → OBS acknowledgement | Actual output observed |
| --- | --- | --- | --- | --- |
| Pending | Real collective Hype | Pending | Pending | Pending |

Runtime AI is intentionally absent; model availability/failure checks are not applicable. Chat injection is tested as untrusted data with no command execution path.
