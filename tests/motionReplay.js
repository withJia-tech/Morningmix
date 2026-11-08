// Deterministic motion replay harness.
// Real modules: motion session, sensor source, calibration, filter, tilt mapper, intent bus,
// game engine, orientation guard and visibility observer, wired the way src/main.js wires them.
// Faked: the clock, sensor events, window (screen orientation) and document (visibility).
import { createGameEngine } from '../src/game/gameEngine.js';
import { createIntentBus } from '../src/game/intentBus.js';
import { createMotionSession } from '../src/motion/motionSession.js';
import { createOrientationGuard } from '../src/platform/orientationGuard.js';
import { observeVisibility } from '../src/platform/visibility.js';
import { fakeSensorEnv } from './helpers.js';

export const STEP_MS = 50;

// Sample steps every 50 ms from `from` (inclusive) to `to` (inclusive) at one beta/gamma.
export function hold(from, to, beta, gamma = 0) {
  const steps = [];
  for (let at = from; at <= to; at += STEP_MS) steps.push({ at, beta, gamma });
  return steps;
}
// Still grip for 600 ms: enough for the existing 5-sample / 400 ms calibration rule.
export const calibrate = (from, beta) => hold(from, from + 600, beta);

export function createReplay({ mode = 'coffee', date = '2026-11-08', permission } = {}) {
  const fake = fakeSensorEnv(permission);
  const engine = createGameEngine({ now: fake.env.now }), bus = createIntentBus(engine.accept);
  const win = new EventTarget();
  win.screen = { orientation: new EventTarget() };
  Object.assign(win.screen.orientation, { type: 'portrait-primary', angle: 0 });
  Object.assign(win, { innerWidth: 390, innerHeight: 844, navigator: { maxTouchPoints: 1 } });
  const doc = new EventTarget();
  doc.visibilityState = 'visible';
  let session = null;
  const guard = createOrientationGuard(reason => session.stop(reason), win);
  session = createMotionSession({ engine, bus, env: fake.env, guard,
    isVisible: () => doc.visibilityState === 'visible', now: fake.env.now });
  // Same one-line wiring as src/main.js.
  observeVisibility(reason => session.interrupt(reason), doc, win);
  engine.startRound(mode, date);

  async function step(s) {
    if (s.enable) await session.enable();
    else if (s.rotate) {
      Object.assign(win.screen.orientation, { type: 'landscape-primary', angle: 90 });
      win.dispatchEvent(new Event('orientationchange'));
    } else if (s.hide) {
      doc.visibilityState = 'hidden';
      doc.dispatchEvent(new Event('visibilitychange'));
    } else if (s.hiddenWithoutEvent) {
      doc.visibilityState = 'hidden';
    } else if (s.tick !== undefined) fake.tick(s.tick);
    else fake.sample(s.at, s.beta, s.gamma ?? 0);
    return session.diagnostics();
  }
  // Runs every step in order and returns one diagnostics snapshot per step.
  async function run(steps) {
    const trace = [];
    for (const s of steps) trace.push(await step(s));
    return trace;
  }
  return { engine, session, fake, run, step };
}
