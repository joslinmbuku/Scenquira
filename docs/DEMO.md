# Demonstration and submission draft

Status: preparation only. Real-service evidence is pending. Do not submit or publish automatically. Check [current competition rules](https://twitchcon-codex.devpost.com/rules) and [deliverables](https://twitchcon-codex.devpost.com/resources) manually before submission.

## 2 minute 40 second video script

- **0:00–0:20:** “Running a stream alone means balancing the conversation and the production. Scenquira helps production follow community moments while keeping the streamer in control.” Show the actual application.
- **0:20–0:45:** Show real Connected status, scene mappings, and Normal / Explanation / Suspense. Explain that context is chosen explicitly; no emotions are inferred.
- **0:45–1:15:** Show multiple consenting participants sending real chat after warm-up and Hype appearing in the actual OBS output. Show the corresponding REAL decision and measured timings.
- **1:15–1:40:** Show Raid Welcome and its scene restoration. If a real raid is unavailable, use the isolated simulator and retain the SIMULATION label throughout. Never present simulated output as real OBS evidence.
- **1:40–2:00:** Start Suspense, change framing manually, and show that Scenquira yields control without a later timer undoing the change.
- **2:00–2:20:** Enable Do Not Disturb, send a triggering event, and show “Blocked: Do Not Disturb is enabled.”
- **2:20–2:40:** Show verifiable implementation files, tests, and the primary Codex conversation. “Scenquira is an automatic production assistant built with Codex. It reacts selectively and gives the streamer the final word.”

## Devpost draft notes

**Problem:** Solo streamers cannot continuously manage scene production while engaging their communities.

**Approach:** A local Next.js/Tailwind control room and NestJS service connect Twitch EventSub to OBS. Deterministic activity analysis produces Hype, Raid Welcome, and explicitly started Suspense. Observe, Suggest, and Auto separate observation from permission to act.

**Restraint:** Protected contexts, capped participant contributions, cooldowns, sequence ownership, expired proposals, and manual priority reduce unnecessary interruptions.

**Codex contribution:** This project was scaffolded and implemented in the primary Codex session that began with the supplied execution specification. Retain this conversation, the implementation diff, and actual test output as evidence. Do not invent a share link or claim runtime AI.

**Limitations:** Local-only single-channel session, in-memory configuration, no nested camera groups, and no crash-proof restoration. Real testing and demo recording remain required; use `docs/VERIFICATION.md` as the acceptance checklist.

**Assets:** The interface and text use original code, system fonts, and CSS. No music, stock imagery, or generated character assets are included.
