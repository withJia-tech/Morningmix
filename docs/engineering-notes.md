# Engineering notes — motion input

Index of the motion engineering work, newest first. Each entry says what changed, why it matters and what it taught. Evidence (commands, counts, deployments) lives in `TESTING.md` and `DEPLOYMENT.md`.

| Build | Topic | Detail |
| --- | --- | --- |
| test.8 | Irreversible yolk swirl | `docs/yolk-swirl-note.md` |
| test.7 | Motion diagnostics and deterministic replay (merged design) | this file, below |
| — | Alternative diagnostics candidate (`?motionDebug=1`, not merged) | `docs/motion-diagnostics-engineering-note.md` |

## test.7 — motion diagnostics and deterministic replay

### What the repository showed before the change

- **Capture:** `sensorSource.js` requests permission inside the tap and reads the browser's `beta`/`gamma` as pitch and roll. It rejects invalid, out-of-range or late readings (gaps over 250 ms).
- **Calibration:** `calibration.js` takes 5 steady readings over 400 ms as the starting grip; moving more than 55° away stops as `reposition`.
- **Thresholds:** `domain/motionRules.js` holds the 10° deadband, full flow at 45° and at most 2 portions/s. `motionFilter.js` stops flow on the first reading back inside the deadband; `tiltPour.js` turns flow into POUR proposals.
- **Authority:** `gameEngine.js` is the only writer of amount, attempts and score, and validates every proposal.
- **Stops:** permission failures end in sensor-source states; rotation is caught by `orientationGuard.js` and page hiding by `visibility.js`.
- **Gap:** the wiring that joins these stages lived only in `main.js`, which tests cannot import. `pipeline.test.js` kept its own copy. That copy lacked the 15 s calibration deadline, the `invalid_readings` stop, the rotation-guard check, the page-visibility check and stop cleanup. Rotation and hiding were tested only as isolated units.

### What changed

- `src/motion/motionSession.js` holds the motion wiring, moved out of `main.js` unchanged, so the app and the tests run the same code.
- `src/ui/diagnosticsPanel.js` is a development-only panel (`?diagnostics=1`). It shows permission, tilt from grip, filtered pitch, a state (off, starting, neutral, pouring, paused, blocked), pour intensity and the last action sent to the engine. It reads a frozen snapshot and cannot change the game. It keeps no history, stores nothing and sends nothing, and taps pass through it.
- `tests/motionReplay.js` replays scripted readings through the real session, engine, orientation guard and visibility observer. Only the clock, sensor events, window and document are fake.

### Why it matters

A test copy of the wiring had drifted from what players run, so tests could pass while the app behaved differently. On a phone, the panel shows why a pour did or did not happen instead of leaving it to guesswork.

### Reproducible failure and resolution

The new tests passed on their first run, which proves little, so three plausible regressions were injected one at a time. Only one was caught at first.

1. Changing `Math.abs(pitch) <= MOTION_RULES.deadband` to `<` in `motionFilter.js` went unnoticed. The test never returned from a pour to exactly the 10° edge, which is where the rule matters.
2. Making rotation pause the engine without stopping the sensor went unnoticed. The engine's epoch check detached the sensor on the next reading, which hid the bug.

The tests were tightened to check the first reading at the deadband edge, and that the sensor detaches the moment rotation or hiding happens. All three regressions are now caught. No production code changed for this.

### Findings

- **Near-upright tilt (open, TODO test).** Euler `gamma` becomes unstable near upright. A 1° twist reads as more than 50° of roll, so a forward big pour stops as `reposition` at about 90°. Fixing it needs a gravity-vector mapping, which is a gameplay change.
- **No-sensor browsers.** Desktop Chromium sends one trusted `deviceorientation` event with null values, which the app reports as `invalid_readings` instead of `unsupported`. The panel exposed this in its first second of use. The behaviour predates test.7.

### What it taught

- **Motion inputs:** sensor angles cannot be taken at face value. They become unstable near upright, and a laptop sends a reading even without a sensor. Validate at the boundary.
- **State transitions:** one stop is guarded several times over (listener removal, epoch check, read gate). A test that looks at a later reading can pass while the first guard is broken, so assert at the moment the state changes.
- **Regression testing:** tests that pass on the first run are not yet evidence. Injecting plausible bugs found two of three gaps. Deterministic replay makes every run exactly comparable, and test fixtures that copy production wiring drift, so share the code instead.

## Alternative diagnostics candidate (not merged)

A separate candidate built the same brief from test.5 as a lighter observer of engine snapshots (`?motionDebug=1`). It was not merged, to avoid two panels. Its replay fixture also rebuilt the wiring outside `main.js`. Its note is kept in full in `docs/motion-diagnostics-engineering-note.md` because it holds evidence:

- an independent inspection
- a second reproducible failure: removing the neutral cutoff in `motionFilter.js` is caught by its replay test
- the first user-reported iPhone result: permission, calibration, neutral stop and overlay passed; swirl was not visible
- a deployment audit of what each host was serving on 8 November 2026

## test.8 — yolk swirl

See `docs/yolk-swirl-note.md`. Wrist roll blends the egg yolks irreversibly as a visual effect; quantities, attempts and score are unchanged. The candidate's fifth test now runs on the shared replay harness. Three injected swirl regressions were all caught. The coffee/milk swirl reported as not visible on iPhone is still open.
