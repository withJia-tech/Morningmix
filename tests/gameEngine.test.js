import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameEngine } from '../src/game/gameEngine.js';
import { createIntentBus } from '../src/game/intentBus.js';
import { TiltPour } from '../src/motion/tiltPour.js';
function setup(mode='coffee') {
  let at=0,seq=0;const engine=createGameEngine({now:()=>at});engine.startRound(mode,'2026-11-03');const epoch=engine.beginMotion();
  const bus=createIntentBus(engine.accept);
  const status=state=>bus.publish({type:'MOTION_STATUS',state,epoch,at,source:'sensor'});
  for(const state of ['waiting','calibrating','active'])assert.equal(status(state).accepted,true);
  const control=(overrides={})=>bus.publish({type:'MOTION_CONTROL',epoch,seq:++seq,at,source:'tilt',flow:1,pitch:45,roll:0,vortexRadius:0,direction:0,...overrides});
  const pour=(overrides={})=>bus.publish({type:'POUR',epoch,seq:++seq,at,source:'tilt',flow:1,ingredient:'milk',amount:5,...overrides});
  return {engine,bus,epoch,control,pour,status,time:t=>{at=t;}};
}
test('engine commits a valid intent and only engine owns quantity', () => {
  const f=setup();f.time(500);f.control();assert.equal(f.pour().accepted,true);assert.equal(f.engine.snapshot().round.amount,5);
  assert.throws(()=>{f.engine.snapshot().round.amount=900;});assert.equal(f.engine.snapshot().round.amount,5);
});
test('invalid source, ingredient, amount, flow, epoch and timestamps are rejected', () => {
  const f=setup();f.time(500);f.control();
  for(const invalid of [{source:'button'},{ingredient:'soy sauce'},{amount:-5},{amount:10},{amount:NaN},{flow:Infinity},{flow:0},{epoch:999},{at:0},{at:501}])assert.equal(f.pour(invalid).accepted,false);
  assert.equal(f.engine.snapshot().round.amount,0);
});
test('replays and bursts cannot add duplicate portions', () => {
  const f=setup();f.time(500);f.control();assert.equal(f.pour({seq:100}).accepted,true);
  assert.equal(f.pour({seq:100}).reason,'replay');assert.equal(f.pour({seq:101}).reason,'rate_limit');assert.equal(f.engine.snapshot().round.amount,5);
});
test('a POUR without current nonzero control cannot commit', () => {
  const f=setup();f.time(500);assert.equal(f.pour().reason,'no_current_flow');
});
test('pause and submit invalidate the current epoch without consuming extra attempts', () => {
  const f=setup();f.time(500);f.control();f.pour();f.engine.pause('rotated');assert.equal(f.pour().accepted,false);assert.equal(f.engine.snapshot().round.amount,5);assert.equal(f.engine.snapshot().round.attempts.length,0);
  assert.equal(f.status('active').accepted,false);f.engine.submit();assert.equal(f.engine.snapshot().round.attempts.length,1);assert.equal(f.engine.snapshot().motion,'paused');
});
test('five submissions end the round, and completion rejects motion/serving', () => {
  const f=setup();for(let i=0;i<5;i++)f.engine.submit();assert.equal(f.engine.snapshot().round.finished,true);assert.equal(f.engine.submit(),false);assert.equal(f.engine.beginMotion(),null);assert.equal(f.engine.snapshot().round.attempts.length,5);
});
test('history is summaries only and a fresh engine starts empty', () => {
  const f=setup();f.engine.submit();const h=f.engine.snapshot().history;assert.equal(h.length,1);assert.deepEqual(Object.keys(h[0]),['id','mode','finished','attempts']);assert.equal(createGameEngine({now:()=>0}).snapshot().history.length,0);
});
test('tilt-to-bus-to-engine integration pours, stops and resumes without residual credit', () => {
  const f=setup(),t=new TiltPour();
  const feed=(at,pitch)=>{f.time(at);for(const intent of t.sample('coffee',{at,pitch,roll:0,stopFlow:Math.abs(pitch)<=10},f.epoch))f.bus.publish(intent);};
  for(let at=0;at<=1000;at+=50)feed(at,45);assert.equal(f.engine.snapshot().round.amount,10);
  for(let at=1050;at<=2000;at+=50)feed(at,0);assert.equal(f.engine.snapshot().round.amount,10);
  for(let at=2050;at<=2500;at+=50)feed(at,-45);assert.equal(f.engine.snapshot().round.amount,15);
});
test('menu navigation preserves an unserved cup and cannot reset attempts', () => {
  const f=setup();f.time(500);f.control();f.pour();const id=f.engine.snapshot().round.id;
  f.engine.home();assert.equal(f.engine.beginMotion(),null);assert.equal(f.engine.submit(),false);
  f.engine.startRound('coffee','2026-11-03');assert.equal(f.engine.snapshot().round.id,id);assert.equal(f.engine.snapshot().round.amount,5);
  f.engine.submit();f.engine.home();f.engine.startRound('coffee','2026-11-03');assert.equal(f.engine.snapshot().round.attempts.length,1);
});
test('returning to a completed daily order shows its result instead of a new round', () => {
  const f=setup();for(let n=0;n<5;n++)f.engine.submit();f.engine.home();f.engine.startRound('coffee','2026-11-03');
  assert.equal(f.engine.snapshot().round.finished,true);assert.equal(f.engine.snapshot().motion,'completed');assert.equal(f.engine.beginMotion(),null);
});
test('a control cannot claim flow beyond the allowed pitch mapping', () => {
  const f=setup();f.time(500);
  assert.equal(f.bus.publish({type:'MOTION_CONTROL',epoch:f.epoch,seq:1,at:500,source:'tilt',flow:1,pitch:0,roll:0,vortexRadius:0,direction:0}).accepted,false);
});
test('engine accepts the specified negative full tilt and rejects overclaimed half flow', () => {
  const f=setup();f.time(500);assert.equal(f.control({pitch:-27.5,flow:.6}).accepted,false);
  assert.equal(f.control({pitch:-45}).accepted,true);assert.equal(f.pour().accepted,true);assert.equal(f.engine.snapshot().round.amount,5);
});
test('motion status intents cannot skip calibration or reopen a stopped epoch', () => {
  let at=0;const engine=createGameEngine({now:()=>at});engine.startRound('coffee','2026-11-03');
  assert.equal(engine.snapshot().motion,'calibration_required');
  const epoch=engine.beginMotion(),bus=createIntentBus(engine.accept);
  const status=state=>bus.publish({type:'MOTION_STATUS',state,epoch,at,source:'sensor'});
  assert.equal(status('active').reason,'invalid_transition');
  for(const s of ['waiting','calibrating','active'])assert.equal(status(s).accepted,true);
  assert.equal(status('stream_lost').accepted,true);assert.equal(status('active').accepted,false);
  assert.equal(engine.snapshot().motion,'stream_lost');assert.equal(engine.snapshot().round.attempts.length,0);
});
test('only accepted pours notify presentation subscribers, and duplicate delivery changes nothing', () => {
  const f=setup(),events=[];f.engine.subscribe((state,event)=>events.push({state,event}));f.time(500);f.control();
  const intent={type:'POUR',epoch:f.epoch,seq:20,at:500,source:'tilt',flow:1,ingredient:'milk',amount:5};
  assert.equal(f.bus.publish(intent).accepted,true);const snapshot=f.engine.snapshot();
  assert.equal(f.bus.publish(intent).accepted,false);assert.deepEqual(f.engine.snapshot(),snapshot);
  const accepted=events.filter(e=>e.event.type==='POUR_ACCEPTED');assert.equal(accepted.length,1);assert.equal(accepted[0].state.round.amount,5);
  assert.equal(accepted[0].event.flow,1,'accepted pour reports its validated flow for sound feedback');
});
test('control freshness accepts the 250ms boundary and rejects older input', () => {
  const f=setup();f.time(250);assert.equal(f.control({at:0}).accepted,true);
  f.time(251);assert.equal(f.control({at:0}).reason,'stale');
});
test('switching recipes preserves each mixture and attempts and closes the old sensor epoch', () => {
  const f=setup();f.time(500);f.control();f.pour();const coffee=f.engine.snapshot().round;
  f.engine.startRound('eggs','2026-11-03');const eggId=f.engine.snapshot().round.id;
  assert.equal(f.engine.snapshot().round.amount,0);assert.equal(f.engine.snapshot().motion,'calibration_required');
  assert.equal(f.pour().accepted,false);assert.equal(f.status('active').accepted,false);
  f.engine.submit();assert.equal(f.engine.snapshot().round.attempts.length,1);
  f.engine.startRound('coffee','2026-11-03');assert.deepEqual(f.engine.snapshot().round,coffee);
  assert.equal(f.engine.snapshot().control.flow,0);assert.equal(f.engine.snapshot().motion,'calibration_required');
  f.engine.startRound('eggs','2026-11-03');assert.equal(f.engine.snapshot().round.id,eggId);assert.equal(f.engine.snapshot().round.attempts.length,1);
});
test('switching away from a completed order cannot replenish its five tries', () => {
  const f=setup();for(let i=0;i<5;i++)f.engine.submit();const completed=f.engine.snapshot().round;
  f.engine.startRound('eggs','2026-11-03');f.engine.home();f.engine.startRound('coffee','2026-11-03');
  assert.deepEqual(f.engine.snapshot().round,completed);assert.equal(f.engine.snapshot().motion,'completed');
  assert.equal(f.engine.submit(),false);assert.equal(f.engine.beginMotion(),null);
});
test('rounds stay separate by date and a new launch starts empty', () => {
  const f=setup();f.time(500);f.control();f.pour();const original=f.engine.snapshot().round;
  f.engine.startRound('coffee','2026-11-04');assert.notEqual(f.engine.snapshot().round.id,original.id);assert.equal(f.engine.snapshot().round.amount,0);
  f.engine.startRound('coffee','2026-11-03');assert.deepEqual(f.engine.snapshot().round,original);
  const fresh=createGameEngine({now:()=>0});fresh.startRound('coffee','2026-11-03');assert.equal(fresh.snapshot().round.amount,0);assert.deepEqual(fresh.snapshot().round.attempts,[]);
});
