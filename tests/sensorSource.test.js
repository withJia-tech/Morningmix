import test from 'node:test';
import assert from 'node:assert/strict';
import { SensorSource } from '../src/motion/sensorSource.js';
import { fakeSensorEnv } from './helpers.js';
function setup(permission) {
  const f=fakeSensorEnv(permission), states=[],samples=[];let allowed=true;
  const source=new SensorSource(f.env,{canRead:()=>allowed,onState:s=>states.push(s),onSample:s=>samples.push(s)});
  return {...f,source,states,samples,block:()=>{allowed=false;}};
}
test('permission is invoked synchronously inside start', async () => {
  let called=false;const f=setup(()=>{called=true;return Promise.resolve('granted');});const p=f.source.start();assert.equal(called,true);await p;assert.equal(f.listeners.size,1);
});
test('denial, insecure origin and absent API never attach', async () => {
  const denied=setup(()=>Promise.resolve('denied'));await denied.source.start();assert.equal(denied.source.state,'denied');assert.equal(denied.listeners.size,0);
  for(const [key,value,state] of [['secure',false,'insecure'],['Orientation',undefined,'unsupported']]) {const f=setup();f.env[key]=value;await f.source.start();assert.equal(f.source.state,state);assert.equal(f.listeners.size,0);}
});
test('API without requestPermission still waits for actual readings', async () => {
  const f=setup();f.env.Orientation={};await f.source.start();assert.equal(f.source.state,'waiting');f.tick(8000);assert.equal(f.source.state,'no_readings');assert.equal(f.listeners.size,0);
});
test('cancelled permission grant cannot attach or reactivate', async () => {
  let grant;const f=setup(()=>new Promise(r=>grant=r));const p=f.source.start();f.source.stop('background');grant('granted');await p;assert.equal(f.listeners.size,0);assert.equal(f.source.state,'background');
});
test('permission watchdog invalidates a later grant', async () => {
  let grant;const f=setup(()=>new Promise(r=>grant=r));const p=f.source.start();f.tick(15000);assert.equal(f.source.state,'permission_timeout');grant('granted');await p;assert.equal(f.listeners.size,0);
});
test('permission rejection is categorized without leaking messages', async () => {
  const f=setup(()=>Promise.reject({name:'SecurityError',message:'private'}));await f.source.start();assert.equal(f.source.state,'security_restriction');assert.equal(f.listeners.size,0);
});
test('repeated enable uses one listener; pause removes timers and rejects queued events', async () => {
  const f=setup();await f.source.start();await f.source.start();assert.equal(f.listeners.size,1);const queued=[...f.listeners][0];f.source.stop();queued({beta:30,gamma:0});assert.equal(f.samples.length,0);assert.equal(f.timers.size,0);
});
test('stream loss, invalid readings and closed lifecycle gate stop explicitly', async () => {
  const f=setup();await f.source.start();f.sample(0);f.tick(251);assert.equal(f.source.state,'stream_lost');assert.equal(f.listeners.size,0);
  const bad=setup();await bad.source.start();bad.sample(0,null);assert.equal(bad.source.state,'invalid_readings');
  const hidden=setup();await hidden.source.start();hidden.block();hidden.sample(0);assert.equal(hidden.source.state,'paused');assert.equal(hidden.samples.length,0);
});
