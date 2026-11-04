# Release checklist — 1.6.0-test.3

Date: 3 November 2026 (Singapore). Status: separate morningmixer private testing Site prepared for publication; real-phone gates remain open.

## Automated evidence

- [x] `npm run check`: syntax, module references, pure-domain boundaries, local-only runtime and bundled assets.
- [x] `npm test`: 57 passing synthetic tests, including the complete sensor → calibration/filter → tilt mapper → bus → engine pipeline.
- [x] `npm run build`: static package produced without tests or development sensor fixtures.
- [x] HTTP smoke check: 30 public files match local bytes; documentation/test routes are not served.
- [x] Original v1.5 text extraction verified against all 54 recorded file hashes.
- [x] Generated mascot inspected and RGBA transparency verified.

The initial test run failed a calibration fixture with only four stable samples. The fixture was corrected to supply the required five readings. No gameplay threshold was relaxed. Native prompt blur cancellation was identified during review and covered by a regression test.

## Browser evidence

- [ ] Browser visual/interaction QA at 320px, 390px and desktop widths.
- [ ] No horizontal overflow; controls remain reachable with mobile browser chrome.
- [ ] Play → enable → neutral stop → re-enable → submit → menu return.
- [ ] Old localStorage sentinels unchanged; reload shows fresh testing history.
- [ ] Error copy, reduced-motion behavior and sound control checked in a browser.

Current desktop smoke (1363×936, cloud Chromium): home and order visuals inspected; insecure-context error/retry shown; a served miss changes five tries to four; menu/resume keeps four tries; reload returns to a fresh session. No direct-add control is present. The local HTTP preview cannot test real sensor permission. Mobile widths, synthetic sensor injection, storage sentinels, reduced-motion and audible output remain unchecked. The earlier browser-start failure is retained in MEMORY.md as historical evidence.

## Pending real-phone acceptance

- [ ] Record model, OS, browser, trusted HTTPS preview URL and exact build fingerprint.
- [ ] Permission opens from the motion button; allowing it starts calibration.
- [ ] Comfortable neutral grip calibrates without adding ingredient.
- [ ] Forward and backward tilt beyond 10° pour; ±45° reach full flow within the cap.
- [ ] Return to neutral stops immediately, including the visible stream.
- [ ] Side-to-side movement swirls without pouring at neutral pitch.
- [ ] Pause/re-enable recalibrates; no residual credit crosses sessions.
- [ ] Denial, unsupported API, no data and stream loss are explicit and preserve tries.
- [ ] Screen rotation pauses without changing amount/attempts; upright return does not auto-resume.
- [ ] Page hide/background/submit/menu/completion stop input and reject late events.
- [ ] Menu return preserves an unserved cup and a completed result.
- [ ] No direct-add, undo, reset, subtract or amount-slider control exists.

## Publication

- [x] Verify intended hosting project identity: new private morningmixer project.
- [ ] Deploy a static HTTPS build to a separate preview URL; preserve existing production.
- [ ] Record the actual preview URL and verified deployed commit/build identifier.
- [ ] Record the device/browser and actual test result for that deployed build.
- [ ] Complete all seven release gates below before promotion.
- [ ] Obtain explicit approval before overwriting the identified production project; record the approved build.
- [ ] After an approved promotion, record the production URL, deployment identifier and deployed build/test result.

## Promotion gate status

| Required gate | Current evidence |
| --- | --- |
| `npm run check` passes | Passed for the renamed test.3 runtime candidate |
| `npm test` passes | 57 synthetic tests passed |
| Real-phone motion walkthrough passes | Pending |
| Rotation interruption behaves correctly | Synthetic tests pass; real-phone evidence pending |
| History reset behavior is intentional and labeled | Intentional in-memory reset and on-screen label verified in desktop browser |
| No direct-add button is present | Source and desktop browser contain no direct-add control |
| No remote calls or API keys are introduced | Local-only runtime checks pass; final deployed-artifact check pending |

Candidate build: `morningmixer-1.6.0-test.3+c0df55b75350`. This identifies the local runtime, not a deployed commit. The full runtime fingerprint and deployment record are in DEPLOYMENT.md. Production approval does not replace unfinished release gates.

Do not convert unchecked items into “passed” from simulated sensor output.

## Current testing-policy acceptance

TESTING.md preserves the seven acceptance criteria and their required evidence. Pure logic and complete Node pipeline tests pass. Desktop navigation and fresh-session reload are verified. Browser motion/audio synchronization and real-phone sensor/permission/rotation/comfort tests remain pending. This candidate is therefore ready for those checks, not marked fully accepted. A duplicate POUR through the bus produces exactly one accepted-pour notification; that event-contract test does not substitute for observing audio and visuals in the browser.

## test.4 presentation update

4 November 2026. Candidate `morningmixer-1.6.0-test.4+a41a8a9ab8fc`. Preserve the earlier acceptance history; this is a requested update to the existing experimental Site, not completion of the phone release gate.

- Five new audio lifecycle/waveform tests join the existing 57 tests; final checks/build run in the packaging workflow.
- Browser: explicit WebGL fallback, sound toggle, motion error/retry, both recipe presentation components and neutral stop checked.
- Geometry shape/framing inspected through a software projection of the same mesh assets. This does not establish GPU rendering.
- Still pending: GPU appearance on iPhone, audible music/gurgle balance, full physical motion walkthrough and rotation/interruption acceptance.
- Current Site audience is public according to Sites; preserve it. The user authorised these bounded edits. The previous Morning Mix production project stays unchanged.
- Packaging removes all disposable `_qa` fixtures. The native saved version and deployment record identify the exact source commit and live URL.

## test.5 navigation update

Candidate `morningmixer-1.6.0-test.5+1572b67b0542`. Syntax/architecture checks and all 65 tests pass. Browser Coffee/Eggs navigation, active-page style, home card, Back and per-order remaining tries verified. Both orders are available every day; earlier alternate-day availability is superseded by the user’s request. Physical-phone regression of switching mid-motion remains a follow-up check; the engine rejects stale epochs in tests.
