# Agent instructions

Read `PRODUCT.md`, `ARCHITECTURE.md`, `TESTING.md`, and `MEMORY.md`
before changing code.

## Non-negotiables

- Phone motion is the primary input.
- Do not add a button that directly adds milk or soy sauce.
- Do not introduce API keys, model calls, remote telemetry, or paid services.
- Keep `src/domain/` and `src/motion/tiltPour.js` free of DOM/browser APIs.
- The game engine is the only authority for ingredient amount and attempts.
- UI renders state; it never independently changes score or mixture.
- Sensor failures must be explicit, not silently ignored.
- Stop motion on submit, navigation, page hide, background, and completed rounds.
- Do not persist raw motion streams, keystrokes, or screen recordings.
- Do not reset user data to test a change; use disposable test state.

## Testing

Run:

```sh
npm run check
npm test
```

Synthetic tests prove logic only. Real-phone testing is required before
claiming motion works on hardware.

## Current phase

Testing build:
- History is ephemeral and refreshed on launch.
- Persistent daily cache is deferred.
