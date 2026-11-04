export function sensorFailure(error) {
  const name = ['NotAllowedError','SecurityError','NotSupportedError','AbortError','TypeError'].includes(error?.name) ? error.name : 'UnknownError';
  return { name, state: name === 'NotAllowedError' ? 'permission_blocked' : name === 'SecurityError' ? 'security_restriction' : name === 'NotSupportedError' ? 'unsupported' : 'error' };
}
export const MOTION_MESSAGES = Object.freeze({
  off: 'Hold your phone comfortably. Enable motion, then hold still to find your starting grip.',
  requesting: 'Allow motion access in the browser prompt.',
  waiting: 'Waiting for orientation readings. Keep your phone still.',
  calibrating: 'Hold still briefly to set your starting grip.',
  calibration_required: 'Calibration required. Enable motion and hold your phone still in a comfortable starting grip.',
  active: 'Tilt forward or back to pour. Return to your starting grip to stop. Gently roll to swirl.',
  paused: 'Motion paused. Enable it again to recalibrate your grip.',
  completed: 'Round complete. Motion is off.',
  denied: 'Motion permission was denied. Allow it in your browser settings, then retry.',
  unsupported: 'This browser or device does not expose orientation sensors. Open this link on a supported phone.',
  insecure: 'Motion needs a trusted HTTPS link. Open the secure preview on your phone.',
  no_readings: 'Permission did not produce usable readings. Retry on your phone in its browser.',
  invalid_readings: 'The sensor sent invalid readings. Pouring stopped; your mix and tries are kept.',
  stream_lost: 'Sensor readings stopped or arrived too slowly. Your mix and tries are kept. Retry to recalibrate.',
  unstable: 'A steady starting grip was not found. Hold still, then retry.',
  reposition: 'Your grip moved beyond the control range. Your mix is kept. Retry in a comfortable position.',
  rotated: 'Screen orientation changed. Your mix and tries are kept. Return upright, lock portrait rotation and retry.',
  portrait_required: 'Hold the phone upright and lock portrait rotation before enabling motion.',
  background: 'Motion stopped while the page was inactive. Enable it again when you are ready.',
  permission_timeout: 'The permission request did not finish. Motion is stopped. Retry from this page.',
  permission_blocked: 'The browser blocked the permission request. Open this link directly in your phone browser and retry.',
  security_restriction: 'Browser security settings blocked motion. Open a trusted HTTPS link directly in your phone browser.',
  error: 'Motion could not start. Your mix and tries are kept. Retry from your phone browser.'
});
export { ACTIVE_STATES } from '../domain/motionRules.js';
