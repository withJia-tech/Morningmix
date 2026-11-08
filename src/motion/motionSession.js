// Motion input session: sensor source -> calibration -> filter -> tilt mapper -> intent bus.
// Moved out of main.js unchanged so the app and the replay tests run the same wiring.
// Browser objects are injected (sensor environment, orientation guard, visibility check, clock).
// The engine stays the only writer of game state; this module only proposes intents.
import { SensorSource } from './sensorSource.js';
import { Calibration } from './calibration.js';
import { MotionFilter } from './motionFilter.js';
import { TiltPour } from './tiltPour.js';
import { ACTIVE_STATES } from './motionErrors.js';
import { classifyMotion, nextPermission } from './diagnostics.js';

export const CALIBRATION_DEADLINE_MS = 15000;

export function createMotionSession({ engine, bus, env, guard, isVisible, now }) {
  const calibration = new Calibration(), filter = new MotionFilter(), tilt = new TiltPour();
  const promptRequired = typeof env.Orientation?.requestPermission === 'function';
  let token = null, startedAt = 0;
  // Latest values only, in memory. No sample history is kept, stored or sent.
  let permission = 'not requested', tiltFromGrip = null, flow = 0, lastAction = null;

  const record = (intent, result) => {
    // Accepted MOTION_CONTROL arrives with every reading; keep only actions and rejections.
    if (intent.type === 'MOTION_CONTROL' && result.accepted) return;
    lastAction = { type: intent.type, accepted: !!result.accepted, reason: result.reason ?? null,
      detail: intent.type === 'POUR' ? `${intent.amount} ${intent.ingredient}` : intent.type === 'MOTION_STATUS' ? intent.state : null };
  };
  const publish = intent => { const result = bus.publish(intent); record(intent,result); return result; };
  const motionStatus = state => token === null ? {accepted:false} : publish({type:'MOTION_STATUS',state,epoch:token,at:now(),source:'sensor'});
  const clearControls = () => { calibration.reset(); filter.reset(); tilt.reset(); tiltFromGrip = null; flow = 0; };

  const source = new SensorSource(env, {
    canRead: () => {
      const s = engine.snapshot();
      return token === s.epoch && s.view === 'round' && !!s.round && !s.round.finished && isVisible() && guard.check();
    },
    onState(state) {
      permission = nextPermission(permission,state,promptRequired);
      if (ACTIVE_STATES.includes(state)) {
        if (state === 'waiting') startedAt = now();
        motionStatus(state);
      }
      else { guard.disarm(); clearControls(); motionStatus(state); token = null; }
    },
    onSample(sample) {
      const result = calibration.sample(sample);
      if (result.error) { stop(result.error); return; }
      if (result.calibrating) {
        if (now() - startedAt >= CALIBRATION_DEADLINE_MS) { stop('unstable'); return; }
        motionStatus('calibrating'); return;
      }
      if (result.calibrated) { motionStatus('active'); return; }
      tiltFromGrip = { pitch: result.pitch, roll: result.roll };
      const filtered = filter.sample(result.pitch,result.roll,result.at);
      if (!filtered) { stop('invalid_readings'); return; }
      const intents = tilt.sample(engine.snapshot().round.mode,filtered,token);
      flow = intents[0]?.flow ?? 0;
      for (const intent of intents) publish(intent);
    }
  });

  function stop(reason = 'paused') { guard.disarm(); source.stop(reason); }
  // Returns the sensor start promise when motion actually starts, otherwise undefined.
  function enable() {
    const state = engine.snapshot();
    if (!state.round || state.round.finished || !isVisible()) return;
    if (ACTIVE_STATES.includes(state.motion)) { stop(); return; }
    stop();
    if (!guard.arm()) { engine.pause('portrait_required'); return; }
    clearControls(); token = engine.beginMotion(); startedAt = now();
    // Permission remains directly inside this button gesture: start() calls it before any await.
    return source.start();
  }

  return Object.freeze({
    enable, stop,
    // Page hidden or closed: stop only if motion is running (same rule main.js used).
    interrupt(reason) { if (ACTIVE_STATES.includes(engine.snapshot().motion)) stop(reason); },
    // Read-only copy for the diagnostics panel and tests. Mutating it changes nothing.
    diagnostics() {
      const s = engine.snapshot();
      return Object.freeze({
        permission,
        motion: s.motion,
        state: classifyMotion(s.motion,s.control.flow),
        tiltFromGrip: tiltFromGrip ? Object.freeze({ ...tiltFromGrip }) : null,
        filteredPitch: s.control.timestamp === null ? null : s.control.pitch,
        flow,
        lastAction: lastAction ? Object.freeze({ ...lastAction }) : null,
        amount: s.round?.amount ?? null,
        triesLeft: s.round ? s.round.allowance - s.round.attempts.length : null
      });
    }
  });
}
