# Verification record

Do not mark a real-service check complete from simulated output. Record date, OBS version, operating system, and sanitized observations. Never attach tokens, full chat logs, or unnecessary participant identifiers.

## Automated checks

Commands: `npm run typecheck`, `npm test`, `npm run build`.
Results are tracked in `docs/PLAN.md` after execution.

## Required real integration checks — PENDING

- [ ] Real Twitch authorization succeeds with only `user:read:chat`.
- [ ] Real chat message produces a REAL receipt in History.
- [ ] Explicit test switches to mapped Welcome and returns to the captured scene.
- [ ] A new user maps direct scenes/items without code changes.
- [ ] Five or more real participants produce at least ten accepted messages in ten seconds after warm-up; actual OBS browser-source Hype appears. Each participant contributes at most three per ten seconds.
- [ ] Welcome shows the incoming raid name/count; any simulated raid in the demonstration is visibly labeled.
- [ ] Suspense countdown and configured framing appear in actual OBS output and restore.
- [ ] Scene and camera manual takeover during each effect prevent later timer takeover.
- [ ] Pause, DND, Observe, expired approvals, and Auto permissions prevent forbidden effects.
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
