import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../src/audio/sound.js';
import { synthesizeGurgle } from '../src/audio/gurgle.js';
import { synthesizeMilkPour, MILK_POUR_SECONDS, BIG_POUR_FLOW } from '../src/audio/milkPour.js';

function fixture({suspended=false}={}) {
  const timers=new Map(),sources=[];let sequence=0,resume;
  const param=()=>({value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>({connect(){},disconnect(){this.disconnected=true;},gain:param(),frequency:param(),Q:param()});
  const source=()=>{const n={...node(),start(){this.started=true;},stop(){this.stopped=true;}};sources.push(n);return n;};
  const ctx={state:suspended?'suspended':'running',currentTime:0,sampleRate:48000,destination:node(),createGain:node,createOscillator:source,createBufferSource:source,createBiquadFilter:node,createBuffer:(_channels,size)=>({getChannelData:()=>new Float32Array(size)}),resume:()=>new Promise(resolve=>{resume=()=>{ctx.state='running';resolve();};}),close(){}};
  const audio=new GameAudio({Audio:()=>function(){return ctx;},setTimer:fn=>{timers.set(++sequence,fn);return sequence;},clearTimer:id=>timers.delete(id)});
  return {audio,ctx,timers,sources,resume:()=>resume()};
}
test('music requires both a player gesture and an active round',()=>{
  const f=fixture();f.audio.setMusicActive(true);assert.equal(f.timers.size,0);
  f.audio.unlock();assert.equal(f.timers.size,1);assert.ok(f.sources.length>0);
  for(let i=0;i<20;i++)f.audio.setMusicActive(true);
  assert.equal(f.timers.size,1,'state updates must not stack soundtrack timers');
});
test('mute immediately cancels music and accepted-pour voices',()=>{
  const f=fixture();f.audio.unlock();f.audio.setMusicActive(true);f.audio.pour('eggs');f.audio.setEnabled(false);
  assert.equal(f.timers.size,0);assert.equal(f.audio.master.gain.value,0);assert.equal(f.audio.voices.size,0);
  assert.ok(f.sources.every(n=>n.stopped&&n.disconnected));
  const count=f.sources.length;f.audio.pour('eggs');assert.equal(f.sources.length,count);
});
test('background and late audio permission cannot restart a hidden soundtrack',async()=>{
  const f=fixture({suspended:true});f.audio.setMusicActive(true);f.audio.unlock();f.audio.setVisible(false);
  f.resume();await Promise.resolve();assert.equal(f.timers.size,0);assert.equal(f.sources.length,0);
  f.audio.setVisible(true);assert.equal(f.timers.size,1);
  f.audio.setMusicActive(false);assert.equal(f.timers.size,0);assert.equal(f.audio.voices.size,0);
});
test('return from menu schedules a fresh phrase instead of catching up',()=>{
  const f=fixture();f.audio.unlock();f.audio.setMusicActive(true);f.audio.setMusicActive(false);f.ctx.currentTime=900;
  const count=f.sources.length;f.audio.setMusicActive(true);assert.equal(f.sources.length-count,2);assert.equal(f.timers.size,1);
});
test('gurgle is finite, non-clipping and bounded at common device sample rates',()=>{
  for(const rate of [44100,48000]){
    const a=synthesizeGurgle(rate,()=>.5);assert.equal(a.length,Math.ceil(rate*.38));
    assert.ok(a.every(Number.isFinite));const peak=a.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
    assert.ok(peak>.1&&peak<1);assert.equal(a[0],0);assert.ok(Math.abs(a.at(-1))<.02);
  }
});
test('big milk pour is finite, non-clipping, silent at both ends and longer than the light pour',()=>{
  for(const rate of [44100,48000]){
    let seed=1;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const a=synthesizeMilkPour(rate,random);assert.equal(a.length,Math.ceil(rate*MILK_POUR_SECONDS));
    assert.ok(a.every(Number.isFinite));const peak=a.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
    assert.ok(peak>.1&&peak<=.85+1e-9);assert.ok(Math.abs(a[0])<.02);assert.equal(Math.abs(a.at(-1)),0);
    assert.ok(MILK_POUR_SECONDS>.24);
  }
});
test('milk pour sound follows accepted flow: steep tilt plays the glug stream, gentle tilt keeps the light pour',()=>{
  const f=fixture();f.audio.unlock();
  let count=f.sources.length;f.audio.pour('coffee',1);
  const big=f.sources.slice(count);assert.equal(big.length,1,'big pour: one buffer voice and no blip oscillator');
  count=f.sources.length;f.audio.pour('coffee',BIG_POUR_FLOW-.01);
  assert.equal(f.sources.length-count,2,'gentle pour: unchanged hiss plus blip');
  count=f.sources.length;f.audio.pour('coffee');
  assert.equal(f.sources.length-count,2,'missing flow keeps the existing light pour');
  f.audio.setEnabled(false);assert.equal(f.audio.voices.size,0,'mute still cancels big-pour voices');
});
