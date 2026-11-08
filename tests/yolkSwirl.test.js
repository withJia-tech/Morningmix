import test from 'node:test';
import assert from 'node:assert/strict';
import { YolkSwirl,yolkPose } from '../src/ui/yolkSwirl.js';
import { createReplay,calibrate,hold } from './motionReplay.js';
import { MOTION_RULES } from '../src/domain/motionRules.js';
const control=(timestamp,direction=1)=>({timestamp,direction,vortexRadius:24});
test('clockwise then anticlockwise keeps blending until yolks disappear',()=>{
 const swirl=new YolkSwirl();let previous=0;
 for(let i=0;i<50;i++){
  const result=swirl.step(control(i*50,i<20?1:-1),i*50,.05);
  assert.ok(result.progress>=previous);previous=result.progress;
 }
 assert.equal(swirl.progress,1);
 for(const i of [0,1])assert.equal(yolkPose(i,swirl.progress,swirl.phase).visible,false);
});
test('pouring without rotation leaves yolks intact; pause cannot restore blended yolks',()=>{
 const swirl=new YolkSwirl();
 for(let i=0;i<100;i++)swirl.step({timestamp:i*50,direction:0,vortexRadius:0,flow:1},i*50,.05);
 assert.equal(swirl.progress,0);
 swirl.step(control(5000),5000,.05);const progress=swirl.progress;
 swirl.step({timestamp:null},5050,.05);assert.equal(swirl.progress,progress);
 assert.equal(new YolkSwirl(progress).progress,progress);
 assert.equal(new YolkSwirl().progress,0);
});
test('stale, future, missing and invalid control cannot blend; long frames are bounded',()=>{
 const swirl=new YolkSwirl();
 for(const c of [null,control(-251),control(1),{timestamp:0,direction:1,vortexRadius:NaN}])swirl.step(c,0,.05);
 assert.equal(swirl.progress,0);
 swirl.step(control(0),0,10);assert.equal(swirl.progress,.025);
});
test('yolk poses stay inside bowl; reduced motion fades without orbiting',()=>{
 for(let phase=0;phase<7;phase+=.1)for(const i of [0,1]){
  const pose=yolkPose(i,.5,phase);assert.ok(Math.hypot(pose.x,pose.z)+.4*pose.scale<1.09);
  assert.deepEqual(yolkPose(i,.5,phase,true),yolkPose(i,.5,0,true));
 }
});
test('real motion pipeline: roll blends without soy, forward tilt adds soy without blending',async()=>{
 // Ported to the shared replay harness, which runs the app's own motion session wiring.
 const p=createReplay({mode:'eggs'});await p.run([{enable:true},...calibrate(0,30)]);const swirl=new YolkSwirl();
 for(let at=650;at<=3000;at+=50){
  await p.step({at,beta:30,gamma:20*Math.sin((at-650)/180)});
  const state=p.engine.snapshot();swirl.step(state.control,at,.05);
  assert.equal(state.round.amount,0);assert.equal(state.round.attempts.length,0);
 }
 assert.ok(swirl.progress>.1);
 const q=createReplay({mode:'eggs'});await q.run([{enable:true},...calibrate(0,30)]);const intact=new YolkSwirl();
 for(const s of hold(650,2000,30+MOTION_RULES.maxTilt)){await q.step(s);const state=q.engine.snapshot();intact.step(state.control,state.control.timestamp,.05);}
 assert.equal(intact.progress,0);assert.ok(q.engine.snapshot().round.amount>0);
});
