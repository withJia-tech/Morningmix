import { MOTION_RULES } from '../domain/motionRules.js';
export class MotionFilter {
  constructor() { this.reset(); }
  reset() { this.pitch = 0; this.roll = 0; this.lastAt = null; }
  sample(pitch, roll, at) {
    if (![pitch,roll,at].every(Number.isFinite)) { this.reset(); return null; }
    const elapsed = this.lastAt === null ? 0 : at - this.lastAt;
    if (elapsed < 0 || elapsed > MOTION_RULES.staleMs) { this.reset(); this.lastAt = at; return { pitch: 0, roll: 0, stopFlow: true, at }; }
    this.lastAt = at;
    const alpha = 1 - Math.exp(-elapsed / 100);
    const previousRoll = this.roll;
    this.pitch += alpha * (pitch - this.pitch);
    this.roll += alpha * (roll - this.roll);
    // Cut flow on raw neutral immediately; do not wait for smoothing to decay.
    const neutral = Math.abs(pitch) <= MOTION_RULES.deadband;
    if (neutral) this.pitch = pitch;
    return { pitch: Math.abs(this.pitch) < 2 ? 0 : this.pitch,
      roll: Math.abs(this.roll) < 2 ? 0 : this.roll,
      rollSpeed: elapsed > 0 ? Math.max(-240,Math.min(240,(this.roll - previousRoll) * 1000 / elapsed)) : 0,
      stopFlow: neutral, at };
  }
}
