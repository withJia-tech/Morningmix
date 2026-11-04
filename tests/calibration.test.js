import test from 'node:test';
import assert from 'node:assert/strict';
import { Calibration, angleDelta } from '../src/motion/calibration.js';
const sample=(c,at,pitch=30,roll=0)=>c.sample({at,pitch,roll});
test('five stable readings across 400ms calibrate without a pour', () => {
  const c=new Calibration(); for(let at=0;at<400;at+=100) assert.equal(sample(c,at).calibrating,true);
  assert.deepEqual(sample(c,400),{calibrated:true}); assert.equal(sample(c,500,50).pitch,20);
});
test('moving during setup restarts the stable window', () => {
  const c=new Calibration(); sample(c,0);sample(c,100);sample(c,200,40);sample(c,300,40);
  assert.equal(sample(c,400,40).calibrating,true);sample(c,500,40); assert.equal(sample(c,600,40).calibrated,true);
});
test('wraparound is a small relative movement; yaw is unnecessary', () => {
  assert.equal(angleDelta(-179,179),2); const c=new Calibration();
  for(let at=0;at<=400;at+=100) sample(c,at,179);
  assert.equal(sample(c,500,-179).pitch,2);
});
test('malformed readings, stale samples and discontinuities fail explicitly', () => {
  const c=new Calibration(); assert.equal(c.sample({pitch:null,roll:0,at:0}).error,'invalid_readings');
  for(let at=0;at<=400;at+=100) sample(c,at);
  assert.equal(sample(c,500,100).error,'reposition');
  assert.equal(sample(c,800).error,'stream_lost');
});
test('re-enable establishes a new neutral grip', () => {
  const c=new Calibration();for(let at=0;at<=400;at+=100) sample(c,at);
  c.reset();for(let at=500;at<=900;at+=100) sample(c,at,60);
  assert.equal(sample(c,1000,60).pitch,0);
});
test('grip changes beyond 55 degrees pause in either direction', () => {
  for(const sign of [-1,1]) {
    const c=new Calibration();for(let at=0;at<=400;at+=100)sample(c,at,0);
    assert.equal(sample(c,500,sign*55).pitch,sign*55);
    assert.equal(sample(c,600,sign*55.01).error,'reposition');
  }
});
