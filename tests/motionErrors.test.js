import test from 'node:test';
import assert from 'node:assert/strict';
import { sensorFailure, MOTION_MESSAGES } from '../src/motion/motionErrors.js';
test('errors use bounded codes and exclude sensitive exception text', () => {
  assert.deepEqual(sensorFailure({name:'NotAllowedError',message:'private URL'}),{name:'NotAllowedError',state:'permission_blocked'});
  assert.deepEqual(sensorFailure({name:'secret value'}),{name:'UnknownError',state:'error'});
});
test('all sensor failure categories have explicit user-facing recovery copy', () => {
  for(const state of ['calibration_required','insecure','unsupported','denied','no_readings','invalid_readings','stream_lost','unstable','reposition','rotated','background','permission_timeout','permission_blocked','security_restriction','error']) assert.ok(MOTION_MESSAGES[state]?.length>20,state);
});
