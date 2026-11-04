# Deployment

## Rules

- Deploy a static HTTPS build.
- Never deploy API keys or secrets.
- Never overwrite an existing production project without explicit approval.
- Use a separate preview URL for sensor testing.
- Record the deployed commit/build identifier and test result.

## Release gate

Before promoting:

1. `npm run check` passes.
2. `npm test` passes.
3. Real-phone motion walkthrough passes.
4. Rotation interruption behaves correctly.
5. History reset behavior is intentional and labeled.
6. No direct-add button is present.
7. No remote calls or API keys are introduced.

All seven gates must be satisfied for the exact candidate being promoted. Passing these gates does not replace the requirement for explicit approval before overwriting an existing production project. Record the approval against the intended project and build.

## Current package

This is the separate **morningmixer** sensor-testing Site, created at the user’s request. Sites now reports a public audience; retain that existing access. Its hosting identity is kept privately by the owner and is not stored in this repository. The previous Morning Mix production project is unchanged. This Site is a hosted test candidate, not a sensor-verified release.

## Static output

```sh
npm run check
npm test
npm run build
```

Serve the contents of `dist/` at the intended base URL over trusted HTTPS. Keep the directory structure intact. No bundler, environment variables, API secrets, package install or build-time network access is required. Source modules, CSS and PNG assets are local. The HTML CSP blocks fetch/WebSocket connections and external scripts; do not relax it to add telemetry accidentally.

The local server serves only `/`, `/index.html`, `/src/` and `/assets/`. It is a development helper, not a production server. The static build excludes tests, documentation and synthetic fixtures.

## Preview and promotion procedure

Verify the intended hosting project through its hosting workflow. Deploy the static candidate to a separate HTTPS preview URL; sensor testing must not replace the current production deployment. Complete browser QA and the real-phone checklist against that exact preview. Record the preview URL, deployed commit/build identifier, device/browser details and observed test results. No deployment is implied by generating `dist/`. Do not promote this build as sensor-verified based on synthetic tests.

Before production promotion, confirm every release gate and obtain explicit approval for overwriting the identified production project. After an approved deployment, record the actual production URL, deployment identifier, deployed commit/build identifier and final test result. Do not substitute a source snapshot ID for a verified deployed build.

The current phase intentionally starts fresh on reload. It does not migrate or delete older localStorage data. Before enabling persistent daily completion later, decide the schema, ownership, corruption recovery and migration behavior explicitly.

## Historical test.3 preparation record

| Field | Current evidence |
| --- | --- |
| Candidate version | `1.6.0-test.3` |
| Candidate runtime build identifier | `morningmixer-1.6.0-test.3+c0df55b75350` |
| Runtime SHA-256 | `c0df55b753509c9317a28e60bee957ca8c3d8058fb0177a46311a1a392a2631c` |
| Automated result | Syntax/import/boundary checks passed; 57 synthetic tests passed; static build passed on 3 November 2026, Node v24.22.1 |
| Candidate update | Branding renamed to morningmixer; motion and game rules unchanged from test.2 |
| Separate private test Site | [private ChatGPT Sites URL, redacted] (publication pending at source preparation) |
| Verified deployed commit/build identifier | None; deployment pending |
| Browser and real-phone result | Desktop browser smoke passed: home/order, explicit insecure-context retry, 5→4 tries on a miss, menu/resume retains four tries, reload returns to fresh session. Mobile layout, sensor simulation, audio output and real-phone acceptance remain pending. |
| Production approval / deployment | Not requested / not deployed |

The runtime fingerprint hashes a UTF-8 manifest of all regular files in `src/` and `assets/`, plus `index.html`, sorted by relative POSIX path. Each manifest line is `<file SHA-256><two spaces><relative path><newline>`. This identifies the static candidate without claiming a Git commit or an actual deployment. Documentation-only edits do not change this runtime fingerprint.

## Recovery

Keep the prior release available at the host. If permission, mapping or rendering regresses, return to the prior reviewed build rather than changing live storage. A sensor failure in this build stops input, retains the current in-memory cup and attempts, and requires an explicit retry/calibration. Navigation does not reset the cup within the same session.

## Current test.4 update — 4 November 2026

The user explicitly requested edits to morningmixer while preserving the rest of the experience. This update is authorised for the same Site, [Sites project ID, redacted], at [private ChatGPT Sites URL, redacted]. The earlier separate Morning Mix project is unchanged. Access is public as returned by get_site; no access change is requested or made. This remains an experimental test build, not a sensor-verified promotion.

- Previous published source: `4e8966d64d4919792901cb795451c50efe0f3f2e`, saved version 1.
- New runtime build: `morningmixer-1.6.0-test.4+a41a8a9ab8fc`.
- Runtime SHA-256: `a41a8a9ab8fc4e5f88c2afeb100ed06d7d63dae96c260920b85ebf0947073713`.
- Change scope: original soy gurgles, faint original chiptune, 3D coffee cup/milk pitcher and egg bowl/soy bottle; locally vendored MIT Three.js.
- Final workflow runs syntax/architecture checks, all 62 tests and static packaging before save/deploy. The hosting version records the exact pushed source commit and deployment result.
- Browser: audio startup/mute and explicit motion error work; fallback component layouts at 390/320px inspected. GPU is disabled in the cloud browser, so 3D shader output remains unverified. Physical-phone rendering, sound and motion acceptance remain pending.
- No new endpoints, secrets, model calls, analytics, persistence or manual-add controls. CSP remains unchanged; all runtime assets are local. Disposable QA pages are excluded by the clean static build.

## test.5 navigation update — 4 November 2026

User-authorised update to the same morningmixer Site and existing public audience. Previous deployed source: `4fb9509cc4bc3fe583649cb14c1e1798bb02d28a`, saved version 2, deployment [Sites deployment ID, redacted], succeeded at [private ChatGPT Sites URL, redacted].

Candidate `morningmixer-1.6.0-test.5+1572b67b0542`; runtime SHA-256 `1572b67b05421e8d5a8a1501c4952322c2199410b353cd3b1ccf8d0b654fb646`. Checks, 65 tests and static build pass; browser navigation and attempt retention verified. Version label updated to test.5; packaging rebuilds static output before publication. Saved-version metadata records the exact pushed commit and deployment result. Direct routes: `#coffee`, `#eggs`, `#home`. Both recipes are available every day; switching retains each round and stops motion. No change to audio, graphics assets, permissions, persistence or motion thresholds.

## GitHub Pages preview — 4 November 2026

User-requested separate preview on GitHub instead of ChatGPT Sites. No ChatGPT Sites project (including [Sites project ID, redacted]) was attached or modified from this repository.

| Field | Evidence |
| --- | --- |
| Preview URL | https://withjia-tech.github.io/Morningmix/ |
| Repository / commit | withJia-tech/Morningmix `2a81ad3bd247edd795b64f412693dbd44b569758` |
| Workflow run / deployment | Actions run 41772673669 (success); GitHub deployment 7537834112, `github-pages` |
| Runtime build | `morningmixer-1.6.0-test.5+1572b67b0542` (runtime SHA-256 recomputed and matching) |
| Automated | `npm run check` passed (41 JS files); `npm test` 65/65; `npm run build` passed — locally (Node 22) and in CI before deploy |
| Browser smoke (headless Chromium, synthetic) | `#home`, `#coffee`, `#eggs` at 320 / 390 / 1280 px: no horizontal overflow, no off-screen controls, no page errors, no direct-add button. Header brand link is 33–36 px tall (below 44 px touch guideline). GPU disabled, so 3D output unverified. |
| Real-phone acceptance | Not run. Motion, sound and 3D rendering on hardware remain unverified. |
| Production approval | Not requested / not promoted |

## test.6 big-pour sound — 4 November 2026 (GitHub Pages)

User-requested change: a different milk sound for big-volume pours. Same GitHub Pages preview; no ChatGPT Sites project touched.

| Field | Evidence |
| --- | --- |
| Preview URL | https://withjia-tech.github.io/Morningmix/ |
| Commit | `b6f107b310eeafde28131e9f0e0d486a879b31f2` |
| Workflow run / deployment | Actions run 41773815722 (success); GitHub deployment 7537983838 |
| Runtime build | `morningmixer-1.6.0-test.6+506ce2b098c5` (runtime SHA-256 `506ce2b098c5badc824c8706cf186ea4c74e4bb8ad464a86e7372967031eff68`) |
| Change scope | New `audio/milkPour.js`; `sound.js` picks it for accepted milk portions at flow ≥ 0.6 (about 31° past grip). `POUR_ACCEPTED` now carries the engine-validated `flow`. Soy and gentle-milk sounds, thresholds, scoring and state ownership unchanged. README documents structure and data flow. |
| Automated | `npm run check` (42 JS files) and `npm test` 67/67 passed locally and in CI; headless smoke at 320/390/1280 px shows no page errors |
| Not verified | How the new sound feels on a phone speaker; real-phone motion, 3D rendering |
| Production approval | Not requested / not promoted |
