// Damped air-bubble resonances, synthesised locally for each accepted soy drop.
export function synthesizeGurgle(sampleRate,random=Math.random) {
  const duration=.38,samples=new Float32Array(Math.ceil(sampleRate*duration));
  for(let bubble=0;bubble<5;bubble++) {
    const onset=.012+bubble*.059+random()*.011,frequency=140+random()*150;
    for(let i=Math.floor(onset*sampleRate);i<samples.length;i++) {
      const t=i/sampleRate-onset;
      if(t<0||t>.14)continue;
      const envelope=(1-Math.exp(-t*900))*Math.exp(-t*34);
      const phase=2*Math.PI*(frequency*t+frequency*.55*(1-Math.exp(-t*22))/22);
      samples[i]+=envelope*(Math.sin(phase)*.48+Math.sin(phase*1.91)*.09+(random()*2-1)*.026);
    }
  }
  return samples;
}
