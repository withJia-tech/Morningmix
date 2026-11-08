import { MOTION_RULES } from '../domain/motionRules.js';
// Decorative mixing only. Progress never changes quantities, scoring or attempts.
// About two seconds at full accepted swirl blends the yolks completely.
export class YolkSwirl {
  constructor(progress=0) { this.progress=Math.max(0,Math.min(1,progress)); this.phase=0; }
  step(control,now,dt) {
    const fresh=Number.isFinite(control?.timestamp)&&now>=control.timestamp&&now-control.timestamp<=MOTION_RULES.staleMs;
    const strength=fresh&&[-1,1].includes(control.direction)&&Number.isFinite(control.vortexRadius)
      ? Math.max(0,Math.min(1,control.vortexRadius/24)):0;
    const elapsed=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
    // Magnitude accumulates: reversing the wrist cannot unmix the bowl.
    this.progress=Math.min(1,this.progress+strength*elapsed/2);
    this.phase=(this.phase+strength*elapsed*2.4)%(Math.PI*2);
    return {progress:this.progress,phase:this.phase,strength};
  }
}
export function yolkPose(index,progress,phase,reduced=false) {
  const sign=index===0?-1:1,angle=reduced?0:phase;
  return {x:sign*(.43*Math.cos(angle)-.099*Math.sin(angle)),
    z:sign*(.43*Math.sin(angle)+.099*Math.cos(angle)),
    scale:1-.45*progress,opacity:1-progress,visible:progress<1};
}
