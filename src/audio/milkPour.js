// Big milk pour: a soft low-passed liquid stream with a few deep glugs,
// synthesised locally. Used only when an accepted milk portion arrives at high flow.
export const BIG_POUR_FLOW = .6;
export const MILK_POUR_SECONDS = .46;

export function synthesizeMilkPour(sampleRate,random=Math.random) {
  const samples=new Float32Array(Math.ceil(sampleRate*MILK_POUR_SECONDS));
  // Stream body: one-pole low-pass noise (~600 Hz) so it reads as liquid, not hiss.
  const k=1-Math.exp(-2*Math.PI*600/sampleRate);
  let low=0;
  for(let i=0;i<samples.length;i++) {
    const t=i/sampleRate,rest=1-t/MILK_POUR_SECONDS;
    low+=k*((random()*2-1)-low);
    samples[i]=low*.9*(1-Math.exp(-t*40))*rest*Math.sqrt(rest);
  }
  // Three deep glugs, lower and rounder than the soy bubbles.
  for(let glug=0;glug<3;glug++) {
    const onset=.03+glug*.12+random()*.02,frequency=85+random()*65;
    for(let i=Math.floor(onset*sampleRate);i<samples.length;i++) {
      const t=i/sampleRate-onset;
      if(t>.2)break;
      const envelope=(1-Math.exp(-t*500))*Math.exp(-t*18);
      const phase=2*Math.PI*(frequency*t+frequency*.4*(1-Math.exp(-t*14))/14);
      samples[i]+=envelope*(Math.sin(phase)*.5+Math.sin(phase*2.02)*.08);
    }
  }
  // Fade the final 10 ms to silence and keep a safe peak, so overlapping portions never click or clip.
  const fade=Math.ceil(sampleRate*.01);
  let peak=0;
  for(let i=0;i<samples.length;i++) {
    if(i>=samples.length-fade)samples[i]*=(samples.length-1-i)/fade;
    peak=Math.max(peak,Math.abs(samples[i]));
  }
  if(peak>.85)for(let i=0;i<samples.length;i++)samples[i]*=.85/peak;
  return samples;
}
