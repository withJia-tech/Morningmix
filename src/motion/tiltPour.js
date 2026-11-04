import { recipes } from '../domain/recipes.js';
import { MOTION_RULES, flowForPitch } from '../domain/motionRules.js';
export const MAX_PORTIONS_PER_SECOND = MOTION_RULES.portionsPerSecond;
export const FRESH_MS = MOTION_RULES.staleMs;
export function mapTilt(sample) {
  if (!sample || ![sample.pitch,sample.roll,sample.at].every(Number.isFinite)) return null;
  const speed = Number.isFinite(sample.rollSpeed) ? sample.rollSpeed : 0;
  return { flow: sample.stopFlow ? 0 : flowForPitch(sample.pitch),
    pitch: sample.pitch, roll: sample.roll, vortexRadius: Math.min(24,Math.abs(speed) * .12), direction: Math.sign(speed), at: sample.at };
}
// Produces proposals, never commits amount. Clock/epoch are injected, not browser globals.
export class TiltPour {
  constructor() { this.reset(); }
  reset() { this.credit = 0; this.lastAt = null; this.seq = 0; }
  sample(mode, sample, epoch) {
    const r = recipes[mode], c = mapTilt(sample);
    if (!r || !c) { this.reset(); return []; }
    const elapsed = this.lastAt === null ? 0 : c.at - this.lastAt;
    this.lastAt = c.at;
    if (elapsed < 0 || elapsed > FRESH_MS) { this.credit = 0; c.flow = 0; }
    const envelope = () => ({ epoch, seq: ++this.seq, at: c.at, source: 'tilt' });
    const intents = [{ type: 'MOTION_CONTROL', ...c, ...envelope() }];
    if (c.flow <= 0) { this.credit = 0; return intents; }
    this.credit += c.flow * MAX_PORTIONS_PER_SECOND * Math.max(0,Math.min(FRESH_MS,elapsed)) / 1000;
    if (this.credit >= 1 - 1e-9) {
      this.credit = Math.max(0,this.credit - 1);
      intents.push({ type: 'POUR', ingredient: r.ingredient, amount: r.portion, flow: c.flow, ...envelope() });
    }
    return intents;
  }
}
