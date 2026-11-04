// Shared deterministic control contract; no sensor or browser access.
export const MOTION_RULES = Object.freeze({ deadband: 10, maxTilt: 45,
  portionsPerSecond: 2, staleMs: 250, gripLimit: 55 });
export const ACTIVE_STATES = Object.freeze(['requesting','waiting','calibrating','active']);
export const STOP_STATES = Object.freeze(['paused','denied','permission_blocked','unsupported',
  'insecure','no_readings','stream_lost','rotated','reposition','invalid_readings',
  'unstable','background','permission_timeout','security_restriction','error']);
export function flowForPitch(pitch) {
  if (!Number.isFinite(pitch)) return 0;
  return Math.min(1,Math.max(0,(Math.abs(pitch) - MOTION_RULES.deadband) / (MOTION_RULES.maxTilt - MOTION_RULES.deadband)));
}
