# Testing and real use

Use the [setup guide](SETUP.md) first. The documented UI is http://localhost:3100. Keep OBS and both Scenquira terminals running. Watch the OBS image for real effects; Scenquira's preview is not live video.

## 1. Account-free rehearsal

1. Open Simulator. Confirm the persistent SIMULATION label.
2. Choose Auto and enable Hype and Raid Welcome under Allow in Auto. Resume if paused and leave Do Not Disturb off.
3. Click Advance warm-up by 70 seconds, then Collective Hype. Expect a simulated Hype and completion after about three seconds.
4. After it completes, click Incoming raid. Expect the simulated Welcome scene for five seconds and a return.
5. Choose Suggest and click Start Suspense. Approve in the modal within 15 seconds. Expect a ten-second simulated countdown/state transition.
6. During another sequence, click Manual takeover. Expect cancellation with no later timer reclaiming control.
7. Use Reset rehearsal for independent scenarios. One-person repetition must not trigger collective Hype; Duplicate raid must not execute twice; Stale raid must be blocked.

These controls do not write to real OBS. Repeated tests can encounter the 45-second Hype cooldown or three-automatic-sequences-per-minute budget; reset rehearsal or wait.

## 2. Real chat receipt

1. In Connections, authorize Twitch with the broadcaster account and wait for Connected.
2. Choose Observe in Live Director.
3. Open that Twitch account's channel Chat, send a short message, and check the receipt timestamp in Connections and the REAL entry in History.

Expected: a real receipt, with no OBS effect. One message is not enough for Hype. Chat receipt can be tested while the channel is offline; this alone does not demonstrate a functioning broadcast.

## 3. Real scene round trip

1. Ensure OBS is Connected and mappings are saved.
2. Select your Main/camera scene in OBS. Starting in Welcome would make the test appear unchanged.
3. In Connections, click Switch to Welcome for 5 seconds, then return.
4. Watch OBS: Main > Welcome > original scene. History should show completion.

The explicit test uses real OBS but a synthetic connection-test event, not an incoming Twitch raid. Its history currently uses the Raid Welcome sequence label. Do not present it as evidence of a real raid. It temporarily selects Suggest and resumes; Pause or manual takeover cancels it, and DND blocks it.

## 4. Real Suspense and approval

1. Select the mapped camera scene in OBS. Confirm the Scenquira Overlay source is enabled above the camera.
2. In Live Director, choose Suggest, click Resume if displayed, and turn off Do Not Disturb.
3. Click Start Suspense. The approval modal opens. Click Approve before its 15-second timer reaches zero.
4. Watch OBS for the countdown and subtle zoom. After ten seconds, the countdown disappears and original camera framing returns.

Dismiss or Escape cancels the proposal. Letting the proposal expire must cause no effect. Observe, Pause and DND prevent the sequence and may therefore prevent an approval modal from opening; read Recent decision or History. A failed effect returns the director to Observe.

## 5. Manual priority tests

Run each case separately on the test collection, beginning from a known camera framing. Check after the original ten-second duration as well as immediately.

| Test | Action | Expected result |
| --- | --- | --- |
| Pause | Approve Suspense, then click Pause | Effect cancels, owned framing restores, new effects blocked |
| Restore My Scene | Approve Suspense, then click Restore My Scene | Timers cancel, owned properties restore, director pauses |
| Manual camera change | During Suspense, change camera position/scale directly in OBS | Sequence yields; the new manual framing remains after the old timer deadline |
| Manual scene change | During Suspense, select Welcome in OBS | Sequence yields; no delayed switch back over the manual selection |
| Do Not Disturb | Enable it, then request Suspense | No effect; History explains DND |
| Observe | Choose Observe and request Suspense | No effect; decision logged as Observed |
| Expiry | In Suggest, request Suspense and wait over 15 seconds | Modal/proposal disappears; no production action |

After a manual camera test, restore your preferred framing yourself. Do not mark the whole matrix passed after only one case. Record exact results in VERIFICATION.md.

## 6. Real collective Hype - pending acceptance

1. Connect Twitch and OBS, choose the camera scene, keep the overlay enabled, and select Normal context.
2. Resume, turn off DND, choose Auto, and explicitly allow Hype. Keep other automatic sequence permissions disabled unless needed.
3. Allow at least 70 seconds of analyzer warm-up. For a predictable first test, keep the preceding minute quiet.
4. Ask at least five consenting participants to each send two short enthusiasm messages within the same ten seconds, such as HYPE or bravo. Do not use one account to impersonate multiple participants.
5. Expect Hype only if all thresholds pass: at least ten accepted messages, five participants, three recognized reactions, and recent activity greater than 2.5 times the baseline. Each participant contributes at most three messages per ten seconds.
6. Confirm the actual overlay and optional camera zoom in OBS, completion after three seconds, restoration, and REAL history.

There is a 45-second Hype cooldown and a budget of three automatic sequences per minute across the app. Explanation and Suspense contexts block Hype. A busy scene sequence blocks overlapping effects. A failed trigger is not proof of a connection failure: inspect these conditions first.

Record receipt-to-decision and decision-to-OBS-acknowledgement separately if collecting latency evidence. Neither measures video delivery to viewers. Do not claim the proposed subsecond target until measured.

## 7. Incoming raid - pending acceptance

On an authorized test stream, arrange a legitimate incoming raid from another channel. In Suggest, use the Waiting for your decision panel to approve its proposal before expiry; in Auto, explicitly enable Raid Welcome. The modal added for Start Suspense is not an automatic popup for incoming raids or Hype.

Expect the event-provided name/count, a five-second Welcome scene, and restoration unless the streamer takes over. DND must block the raid. If no real raid is available, use the isolated Simulator and keep SIMULATION visible in all demo footage.

## 8. Restart and daily use

1. Start OBS and the two local services using SETUP.md.
2. Reauthorize Twitch after every backend restart.
3. Connect OBS, read scenes/sources, and validate mappings again. Mapping/reconnection pauses the director.
4. Confirm Main is current and the overlay URL is reachable. Run the Welcome test if the scene collection changed.
5. Choose Observe or Suggest first. Resume when ready. Enable Auto and individual permissions only after checking the actual output.
6. To stop effects, use Restore My Scene before closing the service. If the service or OBS is unavailable, restore the scene and framing directly in OBS.

Scenquira does not start your broadcast. Begin streaming yourself only when your test/demo setup is ready. A local-only installation must run on the same computer as OBS.

## Record the result

For every acceptance test, record date/time with timezone, OBS version, real/simulated origin, expected versus observed behavior, and remaining issues. Keep tokens, passwords, stream keys and private chat out of screenshots and documentation. Local evidence under .local is ignored and must be deliberately reviewed before inclusion in the submission.
