import test from 'node:test';
import assert from 'node:assert/strict';
import { SensorSource } from '../src/motion/sensorSource.js';
import { Calibration } from '../src/motion/calibration.js';
import { MotionFilter } from '../src/motion/motionFilter.js';
import { TiltPour } from '../src/motion/tiltPour.js';
import { createIntentBus } from '../src/game/intentBus.js';
import { createGameEngine } from '../src/game/gameEngine.js';
import { fakeSensorEnv } from './helpers.js';

async function pipeline(mode='coffee') {
  const fake=fakeSensorEnv(),engine=createGameEngine({now:fake.env.now});
  engine.startRound(mode,'2026-11-03');
  const calibration=new Calibration(),filter=new MotionFilter(),tilt=new TiltPour(),bus=createIntentBus(engine.accept);
  let epoch;
  const status=state=>bus.publish({type:'MOTION_STATUS',state,epoch,at:fake.env.now(),source:'sensor'});
  const source=new SensorSource(fake.env,{
    canRead:()=>engine.snapshot().epoch===epoch,
    onState:status,
    onSample(sample){
      const c=calibration.sample(sample);
      if(c.error) return source.stop(c.error);
      if(c.calibrating) return status('calibrating');
      if(c.calibrated) return status('active');
      for(const intent of tilt.sample(mode,filter.sample(c.pitch,c.roll,c.at),epoch))bus.publish(intent);
    }
  });
  const enable=async()=>{source.stop();calibration.reset();filter.reset();tilt.reset();epoch=engine.beginMotion();await source.start();};
  await enable();return {...fake,engine,source,enable};
}
test('full sensor pipeline calibrates, pours by tilt, stops at neutral, and swirls without quantity change',async()=>{
  const p=await pipeline();for(let at=0;at<=600;at+=50)p.sample(at,30);assert.equal(p.engine.snapshot().round.amount,0);assert.equal(p.engine.snapshot().motion,'active');
  for(let at=650;at<=2000;at+=50)p.sample(at,75);const amount=p.engine.snapshot().round.amount;assert.ok(amount>=10);
  for(let at=2050;at<=3000;at+=50)p.sample(at,30,Math.sin(at/100)*20);assert.equal(p.engine.snapshot().round.amount,amount);assert.equal(p.engine.snapshot().control.flow,0);
});
test('full pipeline stops on stream loss, preserves the cup, and recalibrates a new grip on restart',async()=>{
  const p=await pipeline();for(let at=0;at<=600;at+=50)p.sample(at,30);for(let at=650;at<=1800;at+=50)p.sample(at,75);
  const amount=p.engine.snapshot().round.amount;p.tick(2100);assert.equal(p.engine.snapshot().motion,'stream_lost');assert.equal(p.engine.snapshot().round.attempts.length,0);
  await p.enable();for(let at=2150;at<=3000;at+=50)p.sample(at,75);assert.equal(p.engine.snapshot().round.amount,amount);assert.equal(p.engine.snapshot().motion,'active');
});
test('soy uses one-drop intents through the same pipeline',async()=>{
  const p=await pipeline('eggs');for(let at=0;at<=600;at+=50)p.sample(at,30);for(let at=650;at<=2000;at+=50)p.sample(at,75);
  assert.ok(p.engine.snapshot().round.amount>=2);assert.ok(p.engine.snapshot().round.amount<=3);
});
test('submit closes input and a queued sensor event cannot refill the new cup',async()=>{
  const p=await pipeline();for(let at=0;at<=600;at+=50)p.sample(at,30);for(let at=650;at<=1800;at+=50)p.sample(at,75);
  const queued=[...p.listeners][0];p.source.stop();p.engine.submit();const snapshot=p.engine.snapshot();p.setTime(1850);queued({beta:75,gamma:0});assert.deepEqual(p.engine.snapshot(),snapshot);
});
