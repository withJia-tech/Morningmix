# Irreversible yolk swirl — local review candidate

The previous renderer left both yolk meshes at fixed positions. Liquid dye advection alone could not show the intended mixing, especially before soy was added.

The new presentation controller accumulates the magnitude of accepted wrist-roll motion. Yolks orbit, shrink and fade; clockwise then anticlockwise continues mixing. Forward tilt alone still pours soy without blending them. Stopped/stale controls freeze blending. Reduced-motion mode fades without orbiting. Both 3D and simplified views use the same progress model.

Only visual progress is new. Ingredient quantities, attempts, score, calibrated motion thresholds, sensor acquisition and game-engine transitions are unchanged. No raw sensor persistence, network calls or runtime AI. Decorative progress is retained in memory across menu/recipe navigation and reset when a miss creates a fresh bowl.

Files: src/ui/yolkSwirl.js (new), scene.js, sceneFallback.js, app.js; tests/yolkSwirl.test.js (new); PRODUCT.md, MEMORY.md, TESTING.md and this note.

Executed in the candidate: npm run check, npm test (84 passed, 0 failed/skipped), npm run build. Results after integration are in TESTING.md. Five new tests cover reversal, pouring/mixing separation, freshness/input bounds, bowl bounds/reduced motion and synthetic sensor-to-engine-to-animation replay. No browser/GPU or real-phone animation test was executed. Navigation retention remains to be browser-verified.

Phone acceptance: enable and calibrate in Eggs; forward tilt adds soy with intact yolks; return to neutral stops pour; roll the wrist with pitch near neutral, then reverse it—yolks must keep dissolving without adding soy or spending a try. Pause must stop blending. Menu/return must retain blending; a miss must start intact yolks in a fresh bowl.

This is wrist roll, not changing portrait/landscape orientation or compass yaw. Two seconds at maximum accepted swirl is an initial visual tuning choice requiring phone feedback. The disappearance is stylised, not a physical egg-fluid simulation. Coffee visuals are unchanged.

Integrated into the GitHub repository as 1.6.0-test.8 (8 November 2026) on top of test.6 (big milk pour sound) and test.7 (motion diagnostics, `?diagnostics=1`). The candidate's separate `?motionDebug=1` diagnostics were not merged, at the owner's choice, to avoid two panels. The fifth swirl test was ported to the shared replay harness. The candidate was built from test.5 (local commit 6eb3235).
