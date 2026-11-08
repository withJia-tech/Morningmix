// Pure, read-only interpretation of motion state for the development diagnostics panel.
// Nothing here changes game state; it only labels values the engine and pipeline already hold.
import { ACTIVE_STATES } from '../domain/motionRules.js';

const BLOCKED = new Set(['denied','permission_blocked','security_restriction','unsupported','insecure',
  'no_readings','permission_timeout','error']);
const OFF = new Set(['off','calibration_required','completed']);

// Neutral / pouring only exist while active. Setup states are "starting"; failures that need the
// player or browser to change something are "blocked"; recoverable interruptions are "paused".
export function classifyMotion(motion, flow) {
  if (motion === 'active') return flow > 0 ? 'pouring' : 'neutral';
  if (ACTIVE_STATES.includes(motion)) return 'starting';
  if (BLOCKED.has(motion)) return 'blocked';
  if (OFF.has(motion)) return 'off';
  return 'paused';
}

const PERMISSION_FROM_STATE = Object.freeze({
  denied: 'denied', permission_blocked: 'blocked', security_restriction: 'blocked',
  permission_timeout: 'timed out', insecure: 'unavailable (not HTTPS)', unsupported: 'unavailable (no sensor)'
});

// Browser motion permission as observed through sensor-source states. Interruptions such as
// rotation or backgrounding keep the last known permission.
export function nextPermission(previous, state, promptRequired) {
  if (PERMISSION_FROM_STATE[state]) return PERMISSION_FROM_STATE[state];
  if (state === 'requesting') return promptRequired ? 'prompt shown' : 'not required';
  if (state === 'waiting' || state === 'calibrating' || state === 'active') return promptRequired ? 'granted' : 'not required';
  return previous;
}
