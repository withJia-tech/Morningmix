import { MOTION_RULES } from '../domain/motionRules.js';
export const angleDelta = (a,b) => ((a - b + 540) % 360) - 180;
export class Calibration {
  constructor() { this.reset(); }
  reset() { this.samples = []; this.neutral = null; this.lastAt = null; }
  sample(sample) {
    if (!sample || ![sample.pitch,sample.roll,sample.at].every(Number.isFinite)) return { error: 'invalid_readings' };
    const { pitch, roll, at } = sample;
    if (this.lastAt !== null && (at <= this.lastAt || at - this.lastAt > MOTION_RULES.staleMs)) {
      this.reset();
      this.lastAt = at;
      return { error: 'stream_lost' };
    }
    this.lastAt = at;
    if (!this.neutral) {
      const first = this.samples[0];
      if (first && (Math.abs(angleDelta(pitch,first.pitch)) > 4 || Math.abs(angleDelta(roll,first.roll)) > 4)) this.samples = [];
      this.samples.push(sample);
      // Retain a bounded stable window even with unusually fast hardware events.
      if (this.samples.length >= 5 && at - this.samples[0].at >= 400) {
        this.neutral = sample; this.samples = []; return { calibrated: true };
      }
      if (this.samples.length > 256) this.samples.splice(1,1);
      return { calibrating: true };
    }
    const relativePitch = angleDelta(pitch,this.neutral.pitch), relativeRoll = angleDelta(roll,this.neutral.roll);
    if (Math.abs(relativePitch) > MOTION_RULES.gripLimit || Math.abs(relativeRoll) > MOTION_RULES.gripLimit) return { error: 'reposition' };
    return { pitch: relativePitch, roll: relativeRoll, at };
  }
}
