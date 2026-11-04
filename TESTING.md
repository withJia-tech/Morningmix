# Testing policy

## Automated tests

Run:

```sh
npm run check
npm test
```

Cover:

- Recipe and target reachability
- Mixture bounds and invalid input
- Irreversible ingredient addition
- Serve, miss, attempt consumption, fresh cup
- Tilt-to-flow mapping
- Deadband and maximum flow
- Calibration and recalibration
- Angle wraparound
- Stale sensor readings
- Grip-change pause
- Rotation interruption
- Permission and insecure-context failures
- Intent bus prevents duplicate pours

## Evidence levels

| Evidence | Proves |
|---|---|
| Unit tests | Pure logic and state transitions |
| Browser simulation | UI wiring and synthetic sensor behavior |
| Real-phone walkthrough | Actual sensor, permission, rotation, and comfort behavior |

Synthetic tests do not prove retention, enjoyment, or hardware compatibility.

## Current acceptance

A test build is acceptable when:

1. Motion setup and calibration work.
2. Tilt pours deterministically.
3. Neutral return stops pouring immediately.
4. No direct-add button exists.
5. Sensor failure produces a clear paused/error state.
6. History resets on launch.
7. UI, audio, and game state remain synchronized.

## Coverage and current evidence

The policy above preserves the supplied requirements. Run commands from the `morningmixer/` project directory on Node 20+. No dependency installation is required. Version `1.6.0-test.3` has 57 passing synthetic tests and passing syntax/import/architecture checks. These results do not mark the complete acceptance criteria passed.

| Required coverage | Test files / evidence |
| --- | --- |
| Recipe reachability, bounds, invalid input, irreversible addition | `tests/mixture.test.js`: both recipes over a full year, positive-only addition and capped quantities |
| Serve, miss, attempts, fresh cup, completed result | `tests/round.test.js`, `tests/gameEngine.test.js` |
| Mapping, deadband, full flow and maximum rate | `tests/tiltPour.test.js`: exact ±10° deadband, ±27.5° half flow, ±45° full flow, cap at two portions/sec |
| Update-rate consistency | `tests/tiltPour.test.js`: 50, 100, 125, 200 and 250 ms sample intervals integrate the same sustained flow |
| Calibration, recalibration, wraparound and grip pause | `tests/calibration.test.js`, `tests/pipeline.test.js`: fresh neutral grip, wrapped deltas, pause beyond ±55° |
| Stale input | `tests/sensorSource.test.js`, `tests/tiltPour.test.js`, `tests/gameEngine.test.js`: 250 ms boundary, older readings, stopped streams and cleared partial credit |
| Rotation / background interruption | `tests/platform.test.js`, `tests/gameEngine.test.js`: preserve cup/tries, invalidate input epoch, no automatic restart |
| Permission / secure context | `tests/sensorSource.test.js`, `tests/motionErrors.test.js`: denial, blocked/security error, unsupported API, insecure context, timeouts and late grant cancellation |
| Duplicate pours through intent bus | `tests/gameEngine.test.js`: publish the same intent twice; only one quantity change and one accepted-pour notification |
| Complete deterministic pipeline | `tests/pipeline.test.js`: sensor → calibration/filter → mapping → intent bus → engine |
| UI/audio event contract | `tests/gameEngine.test.js`: presentation subscribers receive committed state only for accepted pours; actual rendering/audio still require browser validation |

The intent bus has one engine executor. Duplicate detection and authoritative state protection live in that executor; the regression test publishes through the bus and checks the resulting state and notifications. Avoid adding an independent mixture or score inside the bus or UI.

## Acceptance status

| Acceptance criterion | Current status | Missing evidence |
| --- | --- | --- |
| Setup/calibration | Synthetic lifecycle and calibration tests pass | Browser and real-phone permission/calibration walkthrough |
| Deterministic tilt pouring | Pure mapping and complete-pipeline tests pass | Browser wiring and physical sensor behavior |
| Immediate neutral stop | Symmetric neutral cutoff and credit-reset tests pass | Visible stream and comfortable physical stop on phone |
| No direct-add control | Source contains no direct-add button or input path | Browser control inspection |
| Explicit sensor failures | Bounded state codes and recovery copy tested | Visible recovery behavior in browser/phone |
| History resets on launch | New engine/store has empty history; no browser persistence access | Reload in browser and confirm older storage sentinels remain unchanged |
| UI/audio/state synchronization | Accepted state/event contract tested | Rendered amount, liquid, controls and audible feedback observed together |

The renamed build has a desktop browser smoke check: home/order rendering, explicit insecure-context error, serving consumes one attempt, menu/resume preserves attempts, and reload starts a fresh session. Browser sensor simulation and real-phone testing remain pending. Do not label Node pipeline tests or this UI smoke as hardware verification. See docs/release-checklist.md for remaining viewport/audio checks.

## Phone walkthrough and evidence record

Use a separate trusted HTTPS preview and record its exact deployed build identifier, device, OS, browser, date and each observed result. Test enable/allow → steady calibration → forward/backward tilt → neutral stop → side-to-side swirl → pause/re-enable → submit → menu/resume → completion. Repeat denial, no-data/stream-loss recovery, page hide/return and rotation interruption. No sensor failure should consume a try.

Use disposable test state; never clear the user's old stored data. Do not publish synthetic sensor fixtures or add a test pour button. Check layouts at 320px, 390px and desktop widths, reduced-motion behavior, and synchronized visual/audio feedback. The release checklist and explicit production approval rule in DEPLOYMENT.md still apply.

## test.4 presentation evidence — 4 November 2026

Added five audio lifecycle/waveform tests: gesture/round gating and single scheduler, immediate mute cleanup, late-resume/background suppression, no catch-up burst, and finite non-clipping gurgles at 44.1/48 kHz. Existing 57 logic tests are retained.

Cloud Chromium smoke checks exercise round opening, sound on/off, insecure-context retry and labelled WebGL fallback. A disposable, excluded fixture checks coffee at 390px and eggs at 320px, accepted-portion presentation and neutral stop. Three.js cannot create a GPU context in this browser (`GL_RENDERER = Disabled`); therefore live 3D rendering is unverified. A separate software projection of the original meshes inspected shape and framing only. The narrow component check is not a complete physical mobile viewport test.

Real-device checks still required: 3D cup/jug and bowl/bottle appearance, actual audio balance/gurgle timbre, screen rotation, immediate neutral stream stop, and a full tilt/swirl walkthrough on iPhone. The native audio timer-binding issue found in browser QA was corrected before packaging. No synthetic sensor or direct-add fixture is deployed.

## test.5 navigation evidence — 4 November 2026

65 tests pass. Three additional engine regressions cover cross-recipe mixture/attempt retention and invalidated sensor epochs, completed orders not regaining attempts, and date/session isolation.

Browser smoke: Coffee top navigation and home card open Morning coffee; after a miss Coffee has four tries; switching to Eggs shows five; Back returns to Coffee with four; home/logo and the Coffee card preserve those four; the current link has `aria-current=page`. The user reported that the egg experience works. Sensor mapping, audio and 3D assets are unchanged in this update.
