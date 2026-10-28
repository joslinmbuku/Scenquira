# Demonstration and submission draft

Status: submission draft. Real Twitch chat, OBS scene switching and Suspense output are verified; collective Hype, incoming raid and the full reliability matrix remain pending. Nothing has been submitted or published by this work.

## Official requirements checked October 28, 2026

Deadline: **November 2, 2026, 14:00 PST / 22:00 UTC / 23:00 Africa/Kinshasa**. Recheck the official countdown before submitting. The project must be newly built during the submission period, connect interactively to Twitch, and use Codex. Provide an accessible source repository, feature/Codex-use description, primary Codex session ID, and publicly visible YouTube demonstration under three minutes showing Twitch functionality and Codex development. Materials must be English or include English translations. Private repository access must follow the organizer's sharing instructions. These are a summary; the [official rules](https://twitchcon-codex.devpost.com/rules) govern eligibility and submission.

The overview and rules were accessible during this review. The resources page returned HTTP 403, so its additional guidance must be reviewed manually. See the [competition overview](https://twitchcon-codex.devpost.com/) and [resources](https://twitchcon-codex.devpost.com/resources).

## Submission checklist

- [ ] Owner confirms registration and eligibility against the official rules.
- [ ] Repository URL is accessible to judges and contains the final code, lockfile and guides.
- [ ] Clean-install walkthrough succeeds on the intended Windows machine; resolve or clearly document the remaining production-build issue.
- [ ] Testing instructions work for an evaluator without access to the author's computer or credentials. Link README > SETUP > TESTING.
- [ ] Final claims match VERIFICATION.md; pending tests are not described as passed.
- [ ] Record a public YouTube demo under three minutes; target 2:40. Include actual Twitch/OBS output and Codex work.
- [ ] Add the primary Codex session ID from the actual development session; never invent it.
- [ ] Complete the English description below and add reviewed screenshots.
- [ ] Remove secrets, stream keys and unnecessary personal data from repository history and footage; use authorized assets.
- [ ] Open every submitted link from another browser/session and check access.
- [ ] Owner reviews and submits before the deadline. No automatic submission.

## Recording preparation

Use the test collection and [real-use walkthrough](TESTING.md). Keep Scenquira and OBS side by side. Ensure Twitch is connected, mappings are valid, the camera scene is current, the overlay is enabled and the director is resumed. Prepare consenting chat participants for real Hype. Hide terminals/.env and private browser tabs from the recording.

The sequence below is a recording plan, not evidence that every scenario has passed. If Hype is not yet validated, finish that test before recording its claimed real behavior. If an incoming raid is unavailable, show only its SIMULATION segment with the label visible. The Welcome connection test is synthetic and must not be narrated as a real incoming raid.

## 2 minute 40 second video script

- **0:00–0:20:** “Running a stream alone means balancing the conversation and the production. Scenquira helps production follow community moments while keeping the streamer in control.” Show the actual application.
- **0:20–0:45:** Show real Connected status, scene mappings, and Normal / Explanation / Suspense. Explain that context is chosen explicitly; no emotions are inferred.
- **0:45–1:15:** Show multiple consenting participants sending real chat after warm-up and Hype appearing in the actual OBS output. Show the corresponding REAL decision. Include timing figures only if actually collected.
- **1:15–1:40:** Show Raid Welcome and its scene restoration. If a real raid is unavailable, use the isolated simulator and retain the SIMULATION label throughout. Never present simulated output as real OBS evidence.
- **1:40–2:00:** In Suggest, click Start Suspense and Approve in the modal. Show the real countdown and restoration. Include manual takeover only after completing its real acceptance test.
- **2:00–2:20:** Enable Do Not Disturb, send a triggering event, and show “Blocked: Do Not Disturb is enabled.”
- **2:20–2:40:** Show verifiable implementation files, tests, and the primary Codex conversation. “Scenquira is an automatic production assistant built with Codex. It reacts selectively and gives the streamer the final word.”

## Devpost draft notes

**Problem:** Solo streamers cannot continuously manage scene production while engaging their communities.

**Approach:** A local Next.js/Tailwind control room and NestJS service connect Twitch EventSub to OBS. Deterministic activity analysis produces Hype, Raid Welcome, and explicitly started Suspense. Observe, Suggest, and Auto separate observation from permission to act.

**Restraint:** Protected contexts, capped participant contributions, cooldowns, sequence ownership, expired proposals, and manual priority reduce unnecessary interruptions.

**Codex contribution:** This project was scaffolded and implemented in the primary Codex session that began with the supplied execution specification. Retain this conversation, the implementation diff, and actual test output as evidence. Do not invent a share link or claim runtime AI.

**Limitations:** Local-only single-channel session, in-memory configuration, no nested camera groups, and no crash-proof restoration. Real connectivity and Suspense are verified; collective Hype, incoming raid and the remaining safety matrix still need validation. Demo recording remains pending; use VERIFICATION.md as the acceptance checklist.

**Assets:** The interface and text use original code, system fonts, and CSS. No music, stock imagery, or generated character assets are included.

## Evidence of Codex contribution

Use this development conversation and actual source changes: deterministic policy tests; real OAuth/network troubleshooting; the OBS zero-bounds regression fixed by writing only scale properties; browser-session recovery; and the approval modal requested and confirmed by the user. Show concise examples without claiming the application uses a runtime model. The final complete suite recorded 50 passing tests; type checking also passed after the modal update.
