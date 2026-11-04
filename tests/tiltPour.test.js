import test from 'node:test';
import assert from 'node:assert/strict';
import { TiltPour, mapTilt } from '../src/motion/tiltPour.js';
import { MotionFilter } from '../src/motion/motionFilter.js';
const feed=(t,at,pitch=45,roll=0)=>t.sample('coffee',{at,pitch,roll,stopFlow:Math.abs(pitch)<=10},7);
test('tilt accumulates bounded portions; no initial or stationary neutral pour', () => {
  const t=new TiltPour(); let pours=[];
  for(let at=0;at<=1000;at+=50) pours.push(...feed(t,at).filter(x=>x.type==='POUR'));
  assert.equal(pours.length,2); assert.ok(pours.every(p=>p.amount===5 && p.ingredient==='milk' && p.source==='tilt'));
});
test('angle controls volume rate', () => {
  const count = pitch => {const t=new TiltPour();let n=0;for(let at=0;at<=5000;at+=50)n+=feed(t,at,pitch).filter(x=>x.type==='POUR').length;return n;};
  assert.ok(count(30)>count(18));assert.equal(count(0),0);
});
test('neutral stops immediately and discards unfinished credit', () => {
  const t=new TiltPour();for(let at=0;at<=400;at+=100)feed(t,at);
  assert.equal(feed(t,450,0).length,1);assert.equal(t.credit,0);
  assert.equal(feed(t,500).length,1);
});
test('swirl alone never proposes a pour', () => {
  const t=new TiltPour();for(let at=0;at<=4000;at+=50){const intents=feed(t,at,0,Math.sin(at/100)*20);assert.equal(intents.length,1);assert.equal(intents[0].flow,0);}
});
test('a sample gap clears flow and partial credit', () => {
  const t=new TiltPour();feed(t,0);feed(t,100);assert.ok(t.credit>0);
  const intents=feed(t,1000);assert.equal(intents[0].flow,0);assert.equal(t.credit,0);
});
test('filter neutral cutoff does not wait for smoothed pitch', () => {
  const f=new MotionFilter();for(let at=0;at<=500;at+=50)f.sample(30,0,at);
  const neutral=f.sample(0,0,550);assert.equal(neutral.stopFlow,true);assert.equal(neutral.pitch,0);
});
test('reset cannot carry residual credit into another input epoch', () => {
  const t=new TiltPour();for(let at=0;at<=400;at+=50)feed(t,at);t.reset();
  const first=feed(t,500);assert.equal(first.length,1);assert.equal(first[0].seq,1);
});
test('side-to-side direction and movement intensity control swirl without flow', () => {
  const control=speed=>mapTilt({pitch:0,roll:15,at:100,stopFlow:true,rollSpeed:speed});
  assert.ok(control(100).vortexRadius>control(20).vortexRadius);assert.equal(control(-100).direction,-1);
  assert.equal(control(0).vortexRadius,0);assert.equal(control(100).flow,0);
});
test('10-degree deadband and 45-degree full flow have exact symmetric mapping', () => {
  for (const [pitch,expected] of [[0,0],[10,0],[-10,0],[27.5,.5],[-27.5,.5],[45,1],[-45,1],[55,1],[-55,1]]) {
    assert.equal(mapTilt({pitch,roll:0,at:0}).flow,expected,`pitch ${pitch}`);
  }
  assert.ok(mapTilt({pitch:10.01,roll:0,at:0}).flow>0);
});
test('each tilt direction caps at two portions per second', () => {
  for(const pitch of [-55,-45,45,55]) {
    const t=new TiltPour();let count=0;
    for(let at=0;at<=2000;at+=50)count+=feed(t,at,pitch).filter(i=>i.type==='POUR').length;
    assert.equal(count,4);
  }
});
test('valid sensor cadences integrate elapsed time consistently up to 250ms', () => {
  for(const interval of [50,100,125,200,250]) {
    const t=new TiltPour();let count=0;
    for(let at=0;at<=2000;at+=interval)count+=feed(t,at).filter(i=>i.type==='POUR').length;
    assert.equal(count,4,`interval ${interval}`);
  }
});
test('return from either tilt direction stops at the raw neutral boundary immediately', () => {
  for(const sign of [-1,1]) {
    const f=new MotionFilter();for(let at=0;at<=500;at+=50)f.sample(sign*45,0,at);
    const neutral=f.sample(sign*10,0,550);
    assert.equal(neutral.stopFlow,true);assert.equal(mapTilt(neutral).flow,0);
  }
});
