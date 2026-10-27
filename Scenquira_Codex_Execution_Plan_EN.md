# Scenquira — Codex Master Prompt and Execution Plan

Version: October 26, 2026. Working specification for a solo developer.

## How to use this document

Place this file in the project repository and tell Codex: “Read this document and execute the plan, starting with Milestone 0. Implement and verify each milestone before moving to the next.” Everything below is the execution prompt. The thresholds and performance targets are proposed design choices to validate, not results already achieved.

Project name: **Scenquira**. Use this name consistently in the interface, documentation, package metadata, examples, and demo materials. It replaces the previous working names Twitch Director and CrowdCue. Naming does not imply trademark or domain clearance.

## 1. Mission and product promise

You are my senior development partner. Build Scenquira, a live production assistant for solo streamers using Twitch and OBS Studio.

Product promise: “Production that follows your community’s moments while keeping you in control.”

The product receives Twitch events, measures collective activity, proposes or executes short visual sequences, and explains its decisions. Its distinguishing behavior is restraint: protect important moments, avoid reacting to every message, and immediately respect manual intervention.

Build a working application. Do not claim to recognize the streamer’s emotions. For the MVP, the streamer explicitly selects the editorial context: Normal, Explanation, or Suspense.

**English is the primary application language from the first implementation, not just the demo language.**

## 2. Prioritized scope

### P0 — required

- Real Twitch and OBS connections with visible connection status.
- Three sequences: Hype, Raid Welcome, and Suspense.
- Observe, Suggest, and Auto modes; start in Observe.
- Pause, Do Not Disturb, Restore My Scene, and Intensity controls.
- A log of proposals, actions, blocked decisions, and errors with understandable reasons.
- A simulator clearly labeled SIMULATION that works without external accounts.
- A real Twitch and OBS demonstration; simulated tests do not replace this validation.

### P1 — only after P0 is fully validated

- Optional contextual analysis using a language model.
- Simple sensitivity settings for different community sizes.
- An anonymized demo log export.

Outside the MVP: face tracking, emotion recognition, microphone monitoring, generated music, a Twitch Extension, payments, a mobile application, multiple channels, and a SaaS platform. Do not add these before P0 is stable.

## 3. Reference architecture

Use strict TypeScript, Next.js for the interface, and NestJS for a local service. Prefer a simple workspace with apps/web, apps/server, and packages/shared. Select compatible stable versions at project initialization and commit a lockfile. Check official documentation before implementing integrations.

The NestJS service runs on the streamer’s computer. It connects to OBS over loopback and to Twitch through outbound connections. A cloud-hosted backend cannot directly access the streamer’s localhost. Do not expose OBS ports publicly.

Server modules: TwitchConnector, EventNormalizer, ActivityAnalyzer, DirectorPolicy, ActionScheduler, ObsAdapter, OverlayGateway, AuditLog, and Simulator. Define connector interfaces so real and simulated implementations share the same decision policy.

Flow: Twitch event → normalization/deduplication → activity metrics → proposal → control policy → OBS/overlay sequence → log and interface.

Keep the decision engine independent of Twitch and OBS and test it with a controlled clock. Connector failures must not crash the interface.

Storage: use SQLite for configuration and a bounded log if helpful; a complex ORM is unnecessary. Keep raw messages in a short in-memory window, without permanent retention by default. Store secrets in environment variables or appropriate local secret storage, never in exported configuration or localStorage.

## 4. Twitch integration

Start with one authenticated broadcaster and their chat. Determine and document the minimum required scopes from official documentation; do not guess. Validate broadcaster/user/token constraints for channel.chat.message, then add incoming channel.raid events. Paid subscription events are optional; the demonstration must not depend on their availability.

Implement server-side OAuth with state validation, an explicitly registered callback URI, and token lifecycle handling appropriate to the selected flow. Never expose tokens or the client secret to the frontend. Ask the user only for essential manual steps: registering a Twitch application, authorizing an account, and configuring the local environment.

For EventSub WebSocket, handle welcome and session_id, create subscriptions through the API, monitor keepalives, and handle session_reconnect according to the protocol. Distinguish a requested connection migration from a lost connection that requires resubscription. Handle revocation, expiration, authorization errors, and intentional disconnects. Verify current requirements before implementation.

Deduplicate notifications using their identifiers with bounded retention. Do not replay stale actions after reconnecting. Display any interval during which events may have been missed; do not claim those events were recovered.

## 5. OBS integration

Use the obs-websocket protocol supported by the target installation and a maintained client library, such as obs-websocket-js after verification. Include local authentication and connection diagnostics.

The setup wizard reads existing scenes and sources. The streamer maps logical roles Main, Welcome, and Camera to the appropriate OBS identifiers. Do not hardcode scene names. Validate mappings before enabling Auto.

Use documented operations such as GetSceneList, GetCurrentProgramScene, SetCurrentProgramScene, and scene-item transformation operations. Confirm the camera exists in the target scene and capture its exact transform before modifying it. Zoom is digital and uses a configured framing; it does not track faces.

Never start or stop a broadcast, delete scenes, or modify an existing collection without an explicit user action. A separate demonstration scene collection may be supplied for voluntary import.

## 6. The three sequences

### Hype

Measure a sliding 10-second window: message count, distinct participants, and recognized reactions. Compare its activity rate with a recent baseline, for example 60 seconds, after a warm-up period. Initial configurable thresholds: at least 5 distinct participants, at least 10 messages, and activity exceeding 2.5 times the baseline rate. Normalize rates to the same time unit and explicitly handle a zero baseline.

Cap each person’s contribution and ignore the bot account. English/French vocabulary and emotes are enthusiasm indicators, not proof of emotion. The English interface does not require restricting incoming chat to English. Do not call an LLM for every message.

Effect: a short overlay, an optional subtle camera zoom for 3 seconds, then restoration. Initial settings: a 45-second Hype cooldown and a maximum of 3 automatic sequences per minute across the application. Test with real participants. Provide an explicitly selected small-community profile rather than silently lowering thresholds.

### Raid Welcome

For a valid incoming raid, propose or run a 5-second Welcome sequence showing the name and viewer count supplied by the event. Capture the current scene before execution and restore it only while the sequence still owns control. Escape all displayed text. Ignore duplicate or stale raid events.

### Suspense

The streamer explicitly starts a sequence with a bounded duration, for example 10 seconds: a countdown overlay and configured camera framing, followed by restoration. Do not automatically infer fear or tension. Support immediate cancellation. Audio is optional and limited to original or properly licensed assets.

## 7. Control policy and concurrency

Priority order: manual stop/takeover → Pause or Do Not Disturb → current mode → validity/freshness → permissions and OBS mappings → cooldown/budget → execution.

Observe computes and logs decisions without changing OBS or the on-stream overlay. Suggest displays a proposal and waits for a click; proposals expire, and approval rechecks current preconditions. Auto executes only actions authorized by the streamer.

Do Not Disturb blocks automatic sequences, including raids. Log suppressed events without replaying them later. An explicitly initiated streamer action may bypass Do Not Disturb only if the interface clearly communicates that exception. Pause cancels current sequences and blocks new ones.

Run at most one sequence at a time. Each execution has an ownership identifier and cancellation token. Timers check the token before taking action. Avoid a backlog of effects: expire or discard proposals when an incompatible sequence is already running.

If the streamer manually changes the scene or camera transform, cancel the affected sequence and yield control. Distinguish expected application changes from external OBS events with bounded correlation, not a single global boolean.

Restore only properties still owned by the sequence and not subsequently changed by the streamer. Never overwrite new manual framing with an old snapshot. Restore My Scene cancels timers, restores properties still under application control, and pauses the director. Document the exact behavior.

After OBS reconnects, reread its state, invalidate old snapshots, and resume in Observe. If the service crashes, its timers cannot restore OBS: provide a manual recovery procedure and a recovery control after checking current state. Never promise guaranteed restoration during an outage.

## 8. Optional contextual AI

Implement a reliable deterministic policy first. If time permits, add an optional, disableable, replaceable model adapter. Verify available models and APIs at implementation time.

Send only a bounded activity summary and a small necessary sample, minimizing personal data. Chat messages are untrusted data, never system instructions. Limit request frequency, cost, output size, and response time.

Validate output against a schema: action from NONE, HYPE, or SUGGEST_WELCOME; a short reason; and an indicative score. A model score is not a calibrated probability. The model receives neither secrets nor permission to call OBS directly. Every proposal passes through the same policy. Invalid output, timeouts, or late responses produce no new AI action. Core functionality remains available.

Describe the AI role accurately: Codex helps build the software; an optional runtime model helps interpret context. Without that module, describe the product as an automatic production assistant built with Codex. Do not invent active semantic analysis.

## 9. Interface, English language requirements, and local security

### Language

Use English as the default and primary language across onboarding, navigation, forms, buttons, tooltips, validation, empty states, errors, notifications, accessibility labels, overlays, simulator scenarios, history reasons, and recovery instructions.

Use English for the README, installation guide, API documentation, code identifiers, developer comments, test descriptions, environment-variable explanations, and demo materials. Preserve user-generated content and Twitch usernames as received; do not translate them automatically.

Centralize user-facing strings in a lightweight English resource dictionary, such as messages/en.ts, to support future localization. Do not build a language switcher or French interface for the MVP. Set the document language to en. Use locale-aware date/number formatting and show the applicable timezone for timestamps.

Use consistent labels: Connections, Live Director, Simulator, History, Observe, Suggest, Auto, Normal, Explanation, Suspense, Pause, Resume, Do Not Disturb, Restore My Scene, Intensity, Hype, Raid Welcome, Approve, Dismiss, Connected, Disconnected, and Reconnecting. Use “Blocked: Do Not Disturb is enabled” for a suppressed action, rather than exposing internal implementation details.

### Interface

Use a professional control-room style: dark background, readable contrast, violet accents, and restrained animation.

- Connections: Twitch, OBS, scene/source mapping, and a non-destructive connection test.
- Live Director: status, mode, context, intensity, activity, recent decision, and priority controls.
- Simulator: guided scenarios with a persistent SIMULATION indicator.
- History: reason, status, duration, real/simulated origin, and any error.

A preview is a state visualization until actual OBS imagery is integrated; do not present a fake preview as live video. Include empty, loading, disconnected, and error states. Provide accessible keyboard controls and do not rely solely on color.

### Local security

Bind servers to loopback by default. Protect mutating commands with a session and origin validation; permissive CORS is not authentication. Separate read-only overlay access from control endpoints. Third-party pages and overlays must not be able to command OBS. Redact secrets from logs, provide a placeholder-only .env.example, and support Twitch disconnection.

## 10. Execution milestones and exit criteria

### Milestone 0 — inspect the environment

Inspect the repository and its instructions. Confirm the environment, versions, and available capabilities. Create docs/PLAN.md and a checklist. List necessary manual setup steps. If Twitch or OBS is unavailable in your environment, continue with simulated adapters and explicitly mark real integration validation as pending. Do not publish or submit the project automatically.

### Milestone 1 — prove real connectivity

Implement the minimal scaffold and connectors. Exit criterion: receive a real Twitch chat message and intentionally switch a test OBS scene, then return. Obtain this proof before extensive visual polishing. Document the exact verified scopes and settings. When local access is unavailable, provide a runnable verification procedure and keep the milestone pending while progressing on independent work.

### Milestone 2 — implement the production engine

Implement normalization, deduplication, activity calculations, policy, scheduling, and restoration. Exit criterion: all three sequences are reproducible with simulated events and a controlled clock; prohibited actions never execute.

### Milestone 3 — build the interface and overlay

Implement setup, dashboard, history, overlay, and simulator. Exit criterion: a new user can map their OBS setup without editing code; real and simulated activity are clearly distinguished; all application-owned text is English.

### Milestone 4 — verify end-to-end behavior and reliability

Connect real Twitch events, the engine, and real OBS. Test on an authorized test stream with multiple participants. Exit criterion: reactions appear in the actual OBS output, manual controls take priority, and reconnect behavior is verified. Retain useful test evidence without tokens or unnecessary personal information.

### Milestone 5 — polish and deliver

Add contextual AI only after P0 is validated. Complete installation instructions, tests, video script, English README, and Devpost draft notes. List known limitations and pending manual checks. Never invent test results.

## 11. Essential verification

Targeted automated tests:

- Duplicate notification → one decision/action.
- One person repeating messages → no collective trigger.
- Zero baseline, warm-up, and small-community settings → bounded, explainable calculations.
- Observe, Pause, Do Not Disturb, and cooldown → no prohibited effects.
- Expired proposal or mode change before approval → approval is reevaluated.
- Concurrent events → no incompatible overlapping sequences.
- Manual intervention during an effect → no timer takes control again.
- Restoration → preserve manual changes and untouched properties.
- Reconnection and stale events → no unexpected delayed effects.
- Model unavailable, invalid output, or chat injection → no unauthorized commands.
- Unauthenticated client or invalid origin → control command rejected.

Manual checks: invalid OBS credentials, a missing source, a revoked Twitch token, OBS closing during an effect, and recovery behavior. Verify minimum required permissions.

Measure event receipt → decision separately from decision → OBS acknowledgement. Indicative non-AI target: issue the first effect command within one second on the test computer. Do not confuse this with Twitch video delivery latency experienced by viewers. Report measurements only after collecting them.

Verify that no application-owned French strings remain in the delivered UI, overlay, errors, or documentation. Do not flag user-generated French chat content as a localization defect.

## 12. Proposed schedule

Dates below are planning targets for 2026, using Africa/Kinshasa for user-facing scheduling.

| Date | Target |
| --- | --- |
| October 26–27 | Milestones 0–1 |
| October 28 | Milestone 2 |
| October 29 | Milestone 3 |
| October 30 | Milestone 4 |
| October 31 | Fixes and user testing |
| November 1 | Video and submission materials |
| November 2 | Buffer and manual submission after checking the official countdown |

If behind schedule, remove runtime AI first, followed by audio and secondary settings. Preserve real connectivity, manual controls, the three core sequences, and the demonstration. Prioritize a working integration over a marketing page.

## 13. Demo and submission materials

Target video length: 2 minutes 40 seconds. Narration, captions, application interface, and presentation materials should be in English.

- 0:00–0:20: the solo streamer’s problem and the product promise.
- 0:20–0:45: connection status and context control.
- 0:45–1:15: real collective chat reaction and Hype.
- 1:15–1:40: Raid Welcome; explicitly label any simulated raid.
- 1:40–2:00: Suspense and manual takeover.
- 2:00–2:20: Do Not Disturb and the explanation for a blocked action.
- 2:20–2:40: concrete evidence of Codex’s contribution and the closing product statement.

Prepare the English README, OBS/Twitch setup guide, installation commands, .env.example, startup scripts, tests, authorized assets, known limitations, and Devpost description. Identify the primary Codex session and retain verifiable examples of its contribution. Check the competition’s current requirements before submission. Never submit on the user’s behalf without explicit instructions.

## 14. Expected Codex workflow

Inspect, then implement; do not stop at producing another plan. Work through milestones and maintain docs/PLAN.md with evidence, commands, and blockers. Make reasonable choices and explain tradeoffs. Ask only for information that actually blocks integration. Continue independent work when credentials or local validation are unavailable.

Do not call the application live-ready after simulated testing alone. Distinguish implemented, automatically verified, verified with real services, and pending verification.

At each milestone, summarize the usable result, checks performed, limitations, and next step. At completion, provide exact startup commands and the demo checklist. Keep development documentation and in-repository progress notes in English.

## 15. Official references

- Competition and judging criteria: https://twitchcon-codex.devpost.com/
- Rules: https://twitchcon-codex.devpost.com/rules
- FAQ and deliverables: https://twitchcon-codex.devpost.com/resources
- Twitch Chat: https://dev.twitch.tv/docs/chat/send-receive-messages/
- EventSub WebSocket: https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
- Subscription types: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/
- Twitch authentication: https://dev.twitch.tv/docs/authentication/
- OBS protocol: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md

APIs, permissions, and competition requirements may change. Recheck these references at implementation time and before submission. This plan is neither a name-clearance search nor a guarantee of competition placement.
