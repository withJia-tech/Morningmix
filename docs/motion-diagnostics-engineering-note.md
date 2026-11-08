> **Status (8 November 2026):** this note describes the alternative `?motionDebug=1` diagnostics candidate, built from test.5. That panel and its replay fixture were **not merged**: the repository uses the test.7 diagnostics (`?diagnostics=1`, `src/motion/motionSession.js`). The note is kept for its inspection findings, its reproducible failure and the iPhone report and deployment audit at the end. File names and test counts below refer to that candidate, not to `main`. See `docs/engineering-notes.md` for the merged design.

# Motion diagnostics — incremental engineering note

## Scope and inspection

Based on local repository commit `6eb3235d7e6f95553cedb576ceebc3b075da646e` (package `1.6.0-test.5`). This change is a review candidate, not a deployed release. No claim is made that this checkout matches any later remote changes.

- `sensorSource.js` acquires DeviceOrientation events, validates finite beta/gamma and their ranges, timestamps with an injected clock, and emits normalized pitch/roll. It handles permission denial, cancellation, timeouts and the stale-stream watchdog.
- `calibration.js` requires at least five stable readings spanning 400ms, calculates wrapped relative angles, and rejects grip changes beyond 55 degrees. `motionFilter.js` smooths input but immediately cuts flow on raw neutral return.
- `domain/motionRules.js` owns the existing 10-degree deadband, 45-degree full-flow threshold, two portions/sec maximum and 250ms stale limit. The mapper proposes discrete portions. The engine validates accepted controls and pours; it alone owns quantity, attempts and transitions.
- `main.js` connects page visibility and orientation guards to sensor stop, which invalidates the input epoch through engine status handling. Returning upright or visible does not resume automatically.
- Existing calibration, tiltPour, sensorSource, platform, pipeline and gameEngine tests cover these components. Baseline: 65 passing tests. Historical documents contain older version/test counts; executable source and this run establish this candidate's evidence.

## Small change

The opt-in panel reads immutable engine snapshots and accepted events. It cannot publish intents or mutate gameplay. It shows permission availability, calibrated **filtered** pitch, neutral/pouring/paused/blocked state (plus setup), exact failure reason, normalized intensity and last significant engine action. Ordinary CONTROL frames retain the last significant action so discrete pours remain visible. An inactive angle is unavailable rather than a stale reading. The engine's flow is a continuous control; ingredient quantity changes only on an accepted discrete portion.

Permission availability means the adapter reached waiting/calibrating/active; it does not assert that an explicit permission prompt was shown. The snapshot cannot distinguish explicit grant from browsers that do not require that API. After pause it retains the last observed permission status, not a fresh OS permission query.

Run `npm start` and open `http://127.0.0.1:3000/?motionDebug=1#coffee`. Omit the query to disable. A trusted HTTPS origin is still required for phone sensors. No developer sensor injection route is shipped. No network, storage, raw sensor logging, runtime AI or new dependency is introduced.

## Files changed

- `src/main.js`: opt-in read-only subscription.
- `src/ui/motionDiagnostics.js`: diagnostic projection and text-only panel.
- `src/styles/layout.css`: non-intercepting debug overlay.
- `tests/pipeline.test.js`: reuse extracted fixture; retain all four prior assertions/tests.
- `tests/motionReplay.js`: reusable synthetic sensor pipeline and frame replay helper.
- `tests/motionReplay.test.js`: ten replay tests.
- `tests/motionDiagnostics.test.js`: four observer/panel tests.
- `docs/motion-diagnostics-engineering-note.md`: this evidence and reproducible failure.
- `TESTING.md`, `MEMORY.md`: current candidate evidence and usage.

## Verification

Commands: `npm run check`, `npm test`, `npm run build`.

Final results: syntax/import/architecture checks pass; **79 tests pass, zero fail, zero skipped**; static packaging passes. The 14 new tests cover neutral, inside/exact deadband, expected filtered intensity, denial, rotation, hidden page, pagehide, deterministic replay, immediate neutral return, explicit opt-in, diagnostic state semantics, panel rendering/cleanup and observation leaving outputs unchanged.

Rotation and visibility replay tests dispatch events through the real platform adapters and real sensor-to-engine pipeline, then attempt late sensor delivery. They verify zero flow, preserved cup/tries, invalidated epoch and no automatic resume. Fixtures use existing thresholds and clocks. Equivalent initial conditions reproduce every engine snapshot, not only the final amount.

Browser UI integration/layout and physical-phone permission/motion walkthrough were not executed in this change. Panel tests use a small DOM double, not a browser. Replay assembles the production components in a test fixture; it does not execute the whole `main.js` browser/audio/3D composition. These are explicit remaining evidence gaps. The overlay may obscure part of the scene when enabled and needs phone layout inspection. Hardware compatibility and comfort are unverified.

## Reproducible failure and resolution

This is a deliberately injected regression, not a newly discovered production defect. In a **disposable copy**, edit `src/motion/motionFilter.js`:

1. Remove `if (neutral) this.pitch = pitch;`.
2. Change `stopFlow: neutral` to `stopFlow: false`.
3. Run `node --test --test-name-pattern="neutral return stops immediately" tests/motionReplay.test.js`.

Executed result: exit 1; one failure. After calibration, the fixture holds full tilt, then returns to neutral. Smoothing retains residual pitch and therefore nonzero flow. The assertion requiring immediate zero flow and unchanged ingredient amount fails.

Resolution: restore both lines. The real working source was never mutated; the disposable copy was removed. The unchanged safeguard passes the regression in the final full suite. This experiment shows the test detects loss of an important safety behavior rather than merely exercising code.

## What this teaches

Sensor readings are proposals, not game state. Permission and lifecycle transitions are as important as angle arithmetic. Filtering makes movement smooth, but safety stops must take effect immediately. Regression tests become useful evidence when a plausible broken implementation demonstrably fails them. Determinism requires equivalent initial calibration, clocks and input epochs—not just repeated angle values.

## iPhone report and deployment audit — 8 November 2026

User-observed passes: permission, calibration, neutral stop, overlay does not obscure gameplay. User-observed failure: swirl rotation not visible in yolk or milk animation. Exact tested URL/build and iOS/browser version are unconfirmed. Do not label full hardware acceptance passed.

GitHub Pages at https://withjia-tech.github.io/Morningmix/ serves application-version 1.6.0-test.6. Latest successful Pages workflow: https://github.com/withJia-tech/Morningmix/actions/runs/41780096581, source commit d78cac687ce2a0da86ef0f391a6da5dbf4608c95. Public main.js has no diagnostics import/mount; src/ui/motionDiagnostics.js returns 404. Current GitHub source tree lacks the new diagnostics/replay files. The diagnostics candidate is not published at this checked URL.

The ChatGPT-hosted diagnostics path returned an HTML fallback labelled 1.6.0-test.5, not the diagnostics JavaScript. A further main.js request was denied with HTTP 403, limiting verification of that origin. No deployment changed. The observed overlay needs its exact tested URL before attaching device evidence to a release or selecting the destination for publication. Swirl remains an open defect; no fix or causal diagnosis was verified by this audit.
