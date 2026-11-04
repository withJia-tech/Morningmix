import { synthesizeGurgle } from './gurgle.js';
import { synthesizeMilkPour, BIG_POUR_FLOW } from './milkPour.js';

// Original 8-bar chiptune. Quiet square/triangle voices; no sampled game melody.
const MELODY=[
  74,0,79,81,0,79,76,74, 71,74,0,76,79,0,76,0,
  72,0,76,79,81,79,0,76, 74,71,0,69,71,74,0,0,
  74,79,0,83,81,0,79,76, 72,76,0,79,76,74,0,72,
  71,0,74,76,79,76,74,0, 69,71,74,0,67,0,0,0
];
const BASS=[43,40,48,38,43,48,40,38],EIGHTH=60/112/2;
const hz=midi=>440*2**((midi-69)/12);

export class GameAudio {
  constructor({Audio=()=>globalThis.AudioContext||globalThis.webkitAudioContext,setTimer=(fn,ms)=>globalThis.setTimeout(fn,ms),clearTimer=id=>globalThis.clearTimeout(id)}={}) {
    this.Audio=Audio;this.setTimer=setTimer;this.clearTimer=clearTimer;
    this.ctx=null;this.enabled=true;this.visible=true;this.musicWanted=false;this.timer=null;this.voices=new Set();
  }
  unlock() {
    if(!this.enabled||!this.visible)return;
    try {
      const Audio=this.Audio();if(!Audio)return;
      if(!this.ctx){this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=1;this.master.connect(this.ctx.destination);}
      if(this.ctx.state==='suspended')Promise.resolve(this.ctx.resume()).then(()=>this.syncMusic()).catch(()=>{});
      else this.syncMusic();
    } catch { /* Sound capability is optional; gameplay remains usable. */ }
  }
  setEnabled(value){this.enabled=!!value;if(!this.enabled)this.silence();else {if(this.master)this.master.gain.value=1;this.unlock();}}
  setVisible(value){this.visible=!!value;if(!this.visible)this.silence();else if(this.master){this.master.gain.value=this.enabled?1:0;this.syncMusic();}}
  setMusicActive(value){this.musicWanted=!!value;this.syncMusic();}
  ready(){return this.enabled&&this.visible&&this.ctx?.state==='running';}
  track(source,nodes,kind='effect') {
    const voice={source,nodes,kind};this.voices.add(voice);
    source.onended=()=>{nodes.forEach(n=>n.disconnect());this.voices.delete(voice);};
  }
  stopVoices(kind){for(const v of [...this.voices])if(!kind||v.kind===kind){try{v.source.stop();}catch{}v.nodes.forEach(n=>n.disconnect());this.voices.delete(v);}}
  stopMusic(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;this.stopVoices('music');}
  silence(){this.stopMusic();if(this.master)this.master.gain.value=0;this.stopVoices();}
  syncMusic(){
    if(!this.ready()||!this.musicWanted){this.stopMusic();return;}
    if(this.timer!==null)return;
    this.step=0;this.nextNote=this.ctx.currentTime+.04;this.schedule();
  }
  schedule(){
    if(!this.ready()||!this.musicWanted){this.stopMusic();return;}
    // Discard missed time after OS interruption; never play a catch-up burst.
    if(this.nextNote<this.ctx.currentTime-.1)this.nextNote=this.ctx.currentTime+.04;
    while(this.nextNote<this.ctx.currentTime+.15){
      const note=MELODY[this.step%MELODY.length],delay=Math.max(0,this.nextNote-this.ctx.currentTime);
      if(note)this.tone(hz(note),EIGHTH*.65,delay,'square',.008,'music');
      if(this.step%4===0)this.tone(hz(BASS[Math.floor(this.step/8)%8]),EIGHTH*1.5,delay,'triangle',.016,'music');
      this.step++;this.nextNote+=EIGHTH;
    }
    this.timer=this.setTimer(()=>{this.timer=null;this.schedule();},80);
  }
  tone(frequency,duration,delay=0,type='sine',volume=.08,kind='effect') {
    if(!this.ready())return;
    const start=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(frequency,start);g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(volume,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
    o.connect(g);g.connect(this.master);this.track(o,[o,g],kind);o.start(start);o.stop(start+duration+.01);
  }
  click(){this.tone(650,.055,0,'triangle',.055);this.tone(180,.04,0,'sine',.05);}
  playBuffer(data,volume){
    const c=this.ctx,buffer=c.createBuffer(1,data.length,c.sampleRate);
    buffer.getChannelData(0).set(data);
    const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;gain.gain.value=volume;
    source.connect(gain);gain.connect(this.master);this.track(source,[source,gain]);source.start();
  }
  pour(mode,flow=0){
    if(!this.ready())return;
    const c=this.ctx;
    if(mode==='eggs'){this.playBuffer(synthesizeGurgle(c.sampleRate),.28);return;}
    // A steep tilt (big milk pour) gets a fuller glugging stream instead of the light hiss and blip.
    if(flow>=BIG_POUR_FLOW){this.playBuffer(synthesizeMilkPour(c.sampleRate),.3);return;}
    const duration=.24,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),a=buffer.getChannelData(0);
    for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
    const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
    source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1400;filter.Q.value=.5;gain.gain.value=.13;
    source.connect(filter);filter.connect(gain);gain.connect(this.master);this.track(source,[source,filter,gain]);source.start();
    this.tone(300,.1,.015,'sine',.04);
  }
  collect(){this.tone(660,.12);this.tone(990,.15,.09);}
  finish(won){for(const [i,note]of(won?[523,659,784,1047]:[392,330]).entries())this.tone(note,.2,i*.1,'triangle',.07);}
  dispose(){this.musicWanted=false;this.visible=false;this.silence();this.ctx?.close();}
}
