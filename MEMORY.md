# Project memory

## Product identity

morningmixer is a motion-first, local-only, buildless browser game.
The player tilts or moves the phone to pour milk or soy sauce and match
a daily target color.

## Locked decisions

- Phone motion is the default and required input.
- There is no clickable direct-add milk/soy-sauce button.
- Shake and tilt are one unified motion-input system, not separate modes.
- Direction, angle, and movement intensity drive pour and swirl.
- History refreshes on every launch during the current testing phase.
- Persistent daily cache is deferred to the next sprint.
- No API keys, runtime model calls, remote telemetry, or paid services.
- Visual style: bright, rounded, 3D chibi anime.

## Engineering invariants

- `domain/` is pure and browser-free.
- `gameEngine.js` is the single source of truth.
- Motion controllers emit intents; they never mutate game state directly.
- UI renders state; it does not calculate pours.
- Calibration must occur before pouring.
- Neutral grip stops pouring immediately.
- Stale readings and grip changes pause the controller.
- Raw motion streams are never persisted.
- Stop motion on submit, navigation, page hide, background and completed rounds.
- Never persist keystrokes or screen recordings, or reset user data to test a change; use disposable test state.
- Preserve the prior project's separation of pure rules, sensor controllers, presentation and browser guards during any rebuild.

## Module ownership contract

The supplied file map defines responsibilities and boundaries for future changes. The implementation notes below identify where the current code uses different helper locations or command names.

| File | Responsibility | Must not do |
| --- | --- | --- |
| `src/domain/recipes.js` | Ingredients, base colors, portion sizes, maximum amounts and daily targets | Import DOM, sensors, storage or UI |
| `src/domain/mixture.js` | Pure color mixing and target-color calculation | Mutate game state or render visuals |
| `src/domain/scoring.js` | Compare mixture with target; return score, win/miss and direction | Add ingredient or consume attempts |
| `src/domain/round.js` | Pure irreversible-add, serve, miss, fresh-cup and attempt rules | Read browser APIs or own mutable application state |
| `src/motion/sensorSource.js` | Acquire and normalize sensor samples; own native sensor access | Decide game rules or update the cup |
| `src/motion/calibration.js` | Establish neutral grip and detect large grip changes | Directly add ingredient |
| `src/motion/tiltPour.js` | Convert calibrated pitch into bounded flow and discrete portion proposals | Access DOM, audio or storage |
| `src/motion/motionFilter.js` | Deadband, low-pass smoothing, stale-input handling and caps | Change score or mixture |
| `src/game/gameEngine.js` | Sole authority for round state, ingredient amount, attempts and completion | Render UI or attach sensor listeners |
| `src/game/intentBus.js` | Deliver normalized intent proposals to the engine | Contain sensor or UI logic, or own a second game state |
| `src/ui/liquid.js` | Render pour stream, swirl, color transition and liquid feedback | Own authoritative game state |
| `src/ui/motionStatus.js` | Display explicit calibration, active, paused and failure states | Silently substitute a manual-add control |
| `src/platform/*.js` | Secure-context, visibility, orientation and storage adapters | Contain game rules |

## Input, state and recovery contract

Sensor acquisition feeds calibration and filtering, then the pure tilt mapper proposes intents through the bus. Only the engine accepts and commits changes. Liquid, HUD and sound consume committed state or accepted events. Continuous visual flow is distinct from discrete ingredient addition: an amount changes only when the engine accepts a complete portion.

The example `{ type: "POUR", ingredient: "milk", amount: 5, flow: 0.62, source: "tilt" }` is a proposal, not permission to mutate the cup. The current transport also requires epoch, sequence and timestamp validation. Duplicate delivery must not add ingredient or repeat accepted-pour feedback.

| Motion setting | Contract |
| --- | --- |
| Neutral / deadband | Absolute relative pitch at or below 10° stops pouring immediately |
| Flow | Clamp `(abs(pitch delta) - 10) / (45 - 10)` to 0–1; full flow at ±45° |
| Rate and portions | At most two portions/sec; 5 ml milk or one soy-sauce drop per accepted portion |
| Stale cutoff | 250 ms; older readings stop input and clear partial credit |
| Grip change | Beyond 55° pauses input and requires recalibration |
| Swirl | Side-to-side movement controls swirl; swirl itself never adds ingredient |

Calibrate before pouring. Returning to neutral stops flow; holding a deliberate non-neutral tilt continues pouring. A scored miss consumes one attempt and starts a fresh cup if attempts remain. The final miss completes the round. Sensor failures and rotation interruptions preserve amount and attempts.

Keep permission denied, permission blocked, unsupported sensor, insecure context, no readings, stale readings, rotation interruption, calibration required and grip changed distinguishable. Do not collapse them into a generic error or silently fall back to manual addition. Actual runtime codes and recovery behavior are mapped in ARCHITECTURE.md.

## Validation and release contract

Read PRODUCT.md, ARCHITECTURE.md, TESTING.md and this memory before changing code. Run `npm run check` and `npm test`. Pure tests establish logic and transitions; browser simulation establishes synthetic UI wiring; a real-phone walkthrough establishes actual permission, sensor, rotation and comfort behavior. Synthetic evidence does not establish hardware compatibility, retention or enjoyment.

Acceptance requires setup/calibration, deterministic pouring, immediate neutral stop, no direct-add control, explicit sensor failures, fresh history on launch and observed UI/audio/state synchronization. Detailed coverage and incomplete acceptance evidence remain in TESTING.md.

Deploy static files over HTTPS to a separate sensor-testing preview and record its actual deployed identifier and results. Promotion requires passing checks/tests, the real-phone walkthrough, correct rotation interruption, intentionally labelled history reset, no direct-add button and no remote calls or API keys. Explicit approval is additionally required before overwriting an existing production project. The attachment's shorter README wording does not waive the fuller deployment rule.

## Lessons from previous build

- Counter-rotating the page to fake portrait lock failed on a real phone.
- Do not claim sensor support from synthetic tests alone.
- Separate visual flow from discrete ingredient portions.
- Preserve explicit sensor-failure categories.
- Keep manual accessibility considerations separate from the primary
  motion gameplay model; do not silently reintroduce a direct-add button.

## Next sprint

- Add versioned local daily cache.
- Add export/import.
- Tune tilt sensitivity with real-phone walkthroughs.
- Add chibi mascot reactions and richer liquid feedback.

These are deferred work items, not capabilities shipped in the current testing build. Design and validate cache migration, import validation and recovery before introducing persistence; never use the user's stored data as a test fixture.

## Current implementation and evidence

The sections above preserve the supplied project memory. Buildless means native browser ES modules and local assets with no compilation, bundler or installed npm dependencies. `npm run build` only copies public files into `dist/` for static deployment; it does not transform the source. A server is still required to serve modules, and real-phone testing requires trusted HTTPS.

One DeviceOrientation pipeline currently maps relative pitch to pouring and side-to-side angular speed to swirl. The unified-input decision does not imply a separate shake mode or a shipped acceleration-based shake classifier. The home chibi mascot is generated raster art. Since test.4, play scenes use real Three.js meshes and a Canvas liquid texture; the old Canvas/CSS renderer remains an explicit WebGL-unavailable fallback. Optional APIs and remaining candidate libraries are labelled in REFERENCES.md.

Current candidate: `1.6.0-test.5`, named **morningmixer**. It preserves the existing motion/scoring rules and adds safe navigation between separately retained recipe rounds. Current build fingerprint, checks and deployment evidence are recorded in DEPLOYMENT.md and docs/release-checklist.md. Real-phone behavior remains an open acceptance gate.

## Attachment reconciliation

The consolidated reference `Pasted text(5).txt` restates the accepted product, architecture, testing, deployment, memory and reference catalogue, and adds a module responsibility map. Treat that map as a design contract while retaining these verified implementation distinctions:

- Its `package.json` version `0.1.0` and `scripts/serve.mjs` / `scripts/check.mjs` paths are scaffold examples. The current package remains `1.6.0-test.2`, with working `.js` helpers, `node --test tests/*.test.js` and optional static-copy packaging. Do not roll back version labels or point commands at nonexistent files during a documentation merge.
- The reference lists intent examples `POUR`, `STOP`, `SERVE` and `PAUSE`. The current engine accepts `POUR`, `MOTION_CONTROL` and `MOTION_STATUS` through the bus; user submit/pause actions call explicit engine methods. Literal `STOP`, `SERVE` and `PAUSE` bus handlers are not implemented. Any future routing change must preserve immediate stopping, one attempt per submission and replay protection; a memory update does not implement it.
- The reference groups irreversible addition under `round.js`. The current pure `addIngredient` helper is in `mixture.js`; `round.js` calculates serve outcomes, while the engine commits amounts and attempt records. Keep the pure-rule / sole-writer boundary intact and document any future relocation.
- Stale-input protection spans the sensor watchdog, calibration, filter, mapper and engine. The filter cannot detect a silent stream without new samples; retain the sensor watchdog rather than assigning all stale-stream protection to smoothing alone.
- DeviceMotionEvent remains a reference option, not an implemented acceleration source. The coffee persona remains **barista**, following the user's earlier correction. Candidate libraries, optional vibration and 3D aspirations are not claims of installed dependencies or shipped capabilities.

This is a documentation reconciliation. It adds no runtime behavior, persistence or new hardware evidence. The verified licence/provenance links in REFERENCES.md remain authoritative over the attachment's unresolved `[15][9]` markers.

## Decision and evidence history

2026-11-03: The user supplied the module tree, one-way sensor-to-engine pipeline, exact AGENTS.md rules and an example POUR intent. These are the current authority and supersede conflicting historical documents.

Baseline: `MorningMix_v1.5_Complete_Source.md`, source commit `39f4d06a9000911edcc9521c0deb9930d8ccccff`. Its 54 text files were extracted and SHA-256 verified. The original breakfast artwork comes from `MorningMix_Codex_Deploy_Candidate_v1.5.zip`. The baseline contains shake/manual fallback/persistent pantry requirements that no longer apply to this testing build.

Retain the warm-food-v2 palette, irreversible-v1 scoring, scene/liquid rendering and synthetic sound. Reorganize motion lifecycle and engine ownership into the requested modules. Do not claim this detached package is the live Site or that earlier test logs prove it works.

The user's current rules require no button that adds ingredient and ephemeral history. Preserve existing saved browser records by not accessing browser storage. No deployed Site is changed by this package.

Interpretation: “revert and become stationary” means return to the calibrated starting grip. A deliberate non-neutral held tilt keeps pouring. Preserve this distinction in tests and validate with the player. The final product brief specifies side-to-side swirl: filtered roll velocity now drives swirl direction/intensity. No circular-gesture or translation-only shake classifier is claimed.

Prior device failures show why passing simulated tests is insufficient. Physical iPhone acceptance is an explicit pending gate, not a task an agent can mark passed from synthetic output.

The later product brief adds the daily-order loop and bright 3D chibi direction. PRODUCT.md preserves the supplied brief, with explicitly labelled implementation decisions. Daily coffee/eggs alternation is retained; same-launch menu return resumes rather than resets. A generated barista mascot is bundled as a project asset. Generation is a build-time operation, not an AI runtime integration.

A code review found that cancelling on window blur could cancel a native permission dialog. Only page hide/hidden lifecycle events cancel; blur alone does not. This has a regression test. The first test run also caught a calibration fixture containing four stable samples instead of five; the fixture was corrected, not the calibration rule.

Browser QA could not run: the available Playwright package has no browser binary, and its standard browser download returned an invalid/truncated archive. Do not mark responsive screenshots or actual DOM interaction verified. Synthetic end-to-end pipeline tests do not resolve this gap.

2026-11-03 deployment update: The user supplied explicit static-HTTPS rules and seven promotion gates. Preserve an existing production project unless the user explicitly approves its overwrite. Use a separate preview URL for sensor testing and record the actual deployed build identifier and test outcome. DEPLOYMENT.md preserves the supplied rules and gate; its candidate fingerprint is not evidence of deployment. This documentation update changes no runtime code or assets. All phone/browser gates remain pending.

2026-11-03 references update: Added the user's browser API, open-source library, asset-source and design catalogue with primary source links. Third-party libraries remain candidates, not installed dependencies. DeviceMotionEvent and Vibration API remain optional/not implemented. Lucide's primary licence file includes ISC and separate MIT notices for listed Feather-derived icons. Asset packs require individual licence verification; no third-party pack was added. The original tabletop's source art-direction note confirms generated-image provenance. Replaced unresolvable citation markers [15][9] with direct source references. Runtime and the previous 48-test evidence remain unchanged.

2026-11-03 testing/architecture update (`1.6.0-test.2`): The user supplied the testing policy, evidence levels, seven current acceptance criteria and a new explicit flow formula. The absolute relative pitch now controls flow symmetrically: deadband 10 degrees, full flow 45 degrees, at most two portions per second, 5 ml/1 drop portions, stale cutoff 250 ms, grip-change pause beyond 55 degrees. This supersedes test.1's forward-only `(pitch - 15) * .12` mapping. Immediate neutral cutoff is symmetric. Valid sensor intervals use actual elapsed time up to 250 ms so slow-but-valid streams do not systematically under-pour.

Shared rules moved to pure `domain/motionRules.js`; the engine no longer imports motion mapping. Native sensor access moved into `sensorSource.js`, with secure-context capability remaining in platform. Sensor/calibration statuses now pass through the intent bus; the engine owns their validated state transitions. Added explicit `calibration_required` status and regression tests for symmetric thresholds, cadence, stale boundaries, grip limits, status transitions and duplicate presentation notifications. 57 synthetic tests and architecture checks pass. Browser simulation, real-phone behavior and visual/audio synchronization remain unverified; the test build is not marked fully accepted. The existing deployment rules and seven promotion gates remain unchanged.

2026-11-03 project-memory update: Added the supplied product identity, locked decisions, engineering invariants, prior-build lessons and next-sprint items above. Preserved the evidence history and clarified buildless execution versus optional static packaging. REFERENCES.md already covers the supplied catalogue, individual asset verification and reduced-motion direction; retained its primary links and implemented-versus-optional labels. This documentation-only update does not change the runtime fingerprint, install libraries or implement deferred features.

2026-11-03 consolidated-reference update: Reconciled `Pasted text(5).txt` into this memory. Added the module ownership map, visual-flow versus accepted-portion contract, shutdown/privacy rules, motion defaults, explicit failures and validation/release requirements. Recorded scaffold and implementation differences without changing code or weakening deployment gates. Prior evidence and deferred sprint scope remain intact.

2026-11-03 morningmixer: User requested a new site and this new name. Create a separate private sensor-testing site; preserve the previous production project. Rename the visible brand, page metadata and package identity. Preserve all input, state, storage and release boundaries. Retain historical Morning Mix names where they identify earlier artifacts or provenance.

Branding candidate `morningmixer-1.6.0-test.3+c0df55b75350`: checks, 57 tests and static build pass. Desktop browser smoke verified home/order render, insecure-context error/retry, miss attempt consumption, menu/resume preservation and fresh session on reload. Mobile viewport, audio and real-phone gates remain open.

2026-11-04 presentation update (`1.6.0-test.4`): User asked to retain everything except soy gurgling, faint Mario-like background music and a 3D coffee/milk-jug barista scene. Preserve daily alternation and the existing home mascot, not a new recipe chooser or a redesign. Added original quiet retro-platformer music and a damped-bubble gurgle. Both use the existing sound toggle and start only after a player gesture. Music stops on menu/completion/background; muting also cancels scheduled effects.

Play scenes now use original procedural 3D mesh assets and locally pinned Three.js 0.180.0. The actual coffee cup, saucer, milk pitcher, egg bowl and soy dispenser replace the flat play objects. Camera/tabletop remain fixed; engine and motion code are unchanged. WebGL absence shows the labelled old view; context loss pauses motion through an injected command. No network loaders, persistence or runtime AI were introduced.

The cloud browser has WebGL disabled, so GPU rendering could not be visually verified there. The original model geometry was separately projected for shape/layout inspection, and the browser checked the simplified view at 390/320px component widths. That is not GPU or physical-phone evidence. Browser inspection found and corrected a native timer receiver issue in audio scheduling. Real-phone rendering, sound balance, tilt and swirl remain pending. Current access returned by Sites is public; preserve it (the older private designation is historical).

2026-11-04 navigation update (`1.6.0-test.5`): User reports “Egg yolk works” but cannot find coffee. Both recipes must be accessible every day. This explicitly supersedes alternating-day availability and the earlier instruction to retain that schedule. Add permanent Coffee / Eggs navigation, two clear home cards, active-page styling and direct hash links. The existing home mascot and play scenes stay intact.

Engine retains one round per recipe/date in session memory. Switching, Menu and browser Back preserve mixture, attempts and completion. Navigation stops sensors, invalidates old intents and requires a fresh calibration; it never adds ingredient or resets tries. The brand home link now navigates instead of reloading. No persistence, remote calls or new sensor mapping were added.

65 automated tests pass, including cross-recipe mixture/attempt retention, completed-order retention, old-epoch rejection and date/session isolation. Browser checks: Coffee opens from the top link and home card; Eggs starts with its own five tries; Back returns to Coffee with four tries after a miss; logo/home preserves four tries; Coffee has aria-current=page. The user’s positive egg report is recorded without treating it as completion of every hardware acceptance case.
