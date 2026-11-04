import { sensorFailure, ACTIVE_STATES } from './motionErrors.js';
import { MOTION_RULES } from '../domain/motionRules.js';
import { hasSecureContext } from '../platform/secureContext.js';
// All native sensor acquisition is contained in this adapter.
export function browserSensorEnvironment(win = window) {
  return { secure: hasSecureContext(win), Orientation: win.DeviceOrientationEvent,
    now: () => win.performance.now(),
    add: fn => win.addEventListener('deviceorientation',fn), remove: fn => win.removeEventListener('deviceorientation',fn),
    setInterval: (fn,ms) => win.setInterval(fn,ms), clearInterval: id => win.clearInterval(id) };
}
export class SensorSource {
  constructor(env, { canRead, onState, onSample }) {
    this.env = env; this.canRead = canRead; this.onState = onState; this.onSample = onSample;
    this.state = 'off'; this.generation = 0; this.listener = null; this.timer = null;
  }
  stateTo(state) { this.state = state; this.onState(state); }
  cleanup() {
    if (this.listener) this.env.remove(this.listener);
    if (this.timer !== null) this.env.clearInterval(this.timer);
    this.listener = null; this.timer = null;
  }
  stop(state = 'paused') { ++this.generation; this.cleanup(); this.stateTo(state); }
  async start() {
    if (ACTIVE_STATES.includes(this.state)) return;
    this.cleanup(); const generation = ++this.generation;
    if (!this.env.secure) return this.stop('insecure');
    if (!this.env.Orientation) return this.stop('unsupported');
    try {
      if (!this.canRead()) return this.stop();
      this.stateTo('requesting');
      if (typeof this.env.Orientation.requestPermission === 'function') {
        const started = this.env.now();
        this.timer = this.env.setInterval(() => {
          if (generation === this.generation && this.env.now() - started >= 15000) this.stop('permission_timeout');
        },50);
        // Invoke before any await so transient user activation is retained.
        const permission = await this.env.Orientation.requestPermission();
        if (generation !== this.generation) return;
        this.cleanup();
        if (permission !== 'granted') return this.stop('denied');
      }
      if (generation !== this.generation) return;
      if (!this.canRead()) return this.stop();
      const started = this.env.now(); let received = null;
      this.stateTo('waiting');
      this.listener = event => {
        if (generation !== this.generation) return;
        try {
          if (!this.canRead()) return this.stop();
          if (![event.beta,event.gamma].every(Number.isFinite) || Math.abs(event.beta) > 180 || Math.abs(event.gamma) > 90) return this.stop('invalid_readings');
          const at = this.env.now();
          if (received !== null && (at <= received || at - received > MOTION_RULES.staleMs)) return this.stop('stream_lost');
          received = at;
          // Only normalized numbers leave this adapter. Alpha/compass data is unused.
          this.onSample({ pitch: event.beta, roll: event.gamma, at });
        } catch { this.stop('error'); }
      };
      this.env.add(this.listener);
      this.timer = this.env.setInterval(() => {
        if (generation !== this.generation) return;
        try {
          if (!this.canRead()) return this.stop();
          const at = this.env.now();
          if (received === null && at - started >= 8000) this.stop('no_readings');
          else if (received !== null && at - received > MOTION_RULES.staleMs) this.stop('stream_lost');
        } catch { this.stop('error'); }
      },50);
    } catch (error) {
      if (generation === this.generation) this.stop(sensorFailure(error).state);
    }
  }
}
