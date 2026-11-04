import { recipes, daily } from '../domain/recipes.js';
import { addIngredient } from '../domain/mixture.js';
import { serveAttempt, ATTEMPTS } from '../domain/round.js';
import { MOTION_RULES, flowForPitch, ACTIVE_STATES, STOP_STATES } from '../domain/motionRules.js';
import { createSessionHistory } from './sessionHistory.js';
const zeroControl = () => ({ flow: 0, flowVelocity: 0, pitch: 0, roll: 0, vortexRadius: 0, direction: 0, timestamp: null });
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export function createGameEngine({ now, history = createSessionHistory() }) {
  let round = null, view = 'home', motion = 'off', epoch = 0, roundId = 0, lastSeq = 0, control = zeroControl();
  let budget = 0, budgetAt = 0;
  const listeners = new Set();
  // The engine owns one round per recipe/date for this launch. Navigation never resets it.
  const rounds = new Map();
  const snapshot = () => freeze(structuredClone({ round, view, motion, epoch, control, history: history.read() }));
  const emit = event => { const state = snapshot(); for (const listener of listeners) listener(state,event); };
  const invalidate = reason => { ++epoch; motion = reason; control = zeroControl(); budget = 0; lastSeq = 0; };
  const playable = () => view === 'round' && !!round && !round.finished;
  const reject = reason => ({ accepted: false, reason });
  return Object.freeze({
    snapshot,
    subscribe(fn) { listeners.add(fn); fn(snapshot(),{type:'INITIAL'}); return () => listeners.delete(fn); },
    startRound(mode, date) {
      if (!recipes[mode]) throw new Error('Unknown recipe');
      const target = daily(mode,date);
      invalidate('calibration_required');
      view = 'round';
      const key = `${date}:${mode}`, existing = rounds.get(key);
      if (existing) {
        round = existing;
        if (round.finished) motion = 'completed';
        emit({type:'ROUND_RESUMED'}); return;
      }
      round = { id: ++roundId, mode, date, target, amount: 0, attempts: [], allowance: ATTEMPTS, finished: false };
      rounds.set(key,round);
      emit({type:'ROUND_STARTED'});
    },
    home() { invalidate('off'); view = 'home'; emit({type:'HOME'}); },
    beginMotion() {
      if (!playable()) return null;
      invalidate('requesting'); budgetAt = now(); emit({type:'MOTION_STATUS'}); return epoch;
    },
    pause(reason = 'paused') { invalidate(reason); emit({type:'MOTION_STATUS'}); },
    accept(intent) {
      if (intent?.type === 'MOTION_STATUS') {
        const t = now();
        if (!playable() || intent.epoch !== epoch || !ACTIVE_STATES.includes(motion)) return reject('inactive_status');
        if (intent.source !== 'sensor' || !Number.isFinite(intent.at) || intent.at > t || t - intent.at > MOTION_RULES.staleMs) return reject('invalid_status');
        if (STOP_STATES.includes(intent.state)) { invalidate(intent.state); emit({type:'MOTION_STATUS'}); return {accepted:true}; }
        const allowed = { requesting:['requesting','waiting'], waiting:['waiting','calibrating'], calibrating:['calibrating','active'], active:['active'] };
        if (!allowed[motion].includes(intent.state)) return reject('invalid_transition');
        if (motion === intent.state) return {accepted:true};
        motion = intent.state; control = zeroControl();
        if (motion === 'active') { budget = 0; budgetAt = t; }
        emit({type:'MOTION_STATUS'}); return {accepted:true};
      }
      if (!intent || !playable() || motion !== 'active') return reject('inactive');
      const t = now(), r = recipes[round.mode];
      if (intent.epoch !== epoch) return reject('old_epoch');
      if (!Number.isInteger(intent.seq) || intent.seq <= lastSeq) return reject('replay');
      if (!Number.isFinite(intent.at) || intent.at > t || t - intent.at > MOTION_RULES.staleMs) return reject('stale');
      if (intent.source !== 'tilt' || !Number.isFinite(intent.flow) || intent.flow < 0 || intent.flow > 1) return reject('invalid_control');
      if (intent.type === 'MOTION_CONTROL') {
        if (![intent.pitch,intent.roll,intent.vortexRadius,intent.direction].every(Number.isFinite) ||
          Math.abs(intent.pitch) > MOTION_RULES.gripLimit || Math.abs(intent.roll) > MOTION_RULES.gripLimit || intent.vortexRadius < 0 || intent.vortexRadius > 24 || ![-1,0,1].includes(intent.direction) ||
          intent.flow > flowForPitch(intent.pitch)) return reject('invalid_control');
        lastSeq = intent.seq;
        control = { flow: intent.flow, flowVelocity: intent.flow, pitch: intent.pitch, roll: intent.roll,
          vortexRadius: intent.vortexRadius, direction: intent.direction, timestamp: intent.at };
        emit({type:'CONTROL'}); return {accepted:true};
      }
      if (intent.type !== 'POUR') return reject('unknown_intent');
      if (intent.ingredient !== r.ingredient || intent.amount !== r.portion || intent.flow <= 0) return reject('invalid_pour');
      if (control.flow <= 0 || intent.at !== control.timestamp || intent.flow !== control.flow) return reject('no_current_flow');
      budget = Math.min(1,budget + Math.max(0,t - budgetAt) * MOTION_RULES.portionsPerSecond / 1000); budgetAt = t;
      if (budget < 1 - 1e-9) return reject('rate_limit');
      if (round.amount >= r.max) return reject('full');
      budget = Math.max(0,budget - 1); lastSeq = intent.seq;
      round.amount = addIngredient(round.mode,round.amount,intent.amount);
      emit({type:'POUR_ACCEPTED',flow:intent.flow}); return {accepted:true};
    },
    submit() {
      if (!playable()) return false;
      invalidate('paused');
      const outcome = serveAttempt(round.mode,round.amount,round.target,round.attempts.length,round.allowance);
      round.attempts.push(outcome.result); round.amount = outcome.nextAmount; round.finished = outcome.finished;
      if (round.finished) motion = 'completed';
      history.record(round); emit({type:'SERVED', result:outcome.result}); return true;
    }
  });
}
