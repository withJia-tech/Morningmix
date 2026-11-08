import { YolkSwirl, yolkPose } from './yolkSwirl.js';
import { mix } from '../domain/mixture.js';
import { recipes } from '../domain/recipes.js';
import { LiquidField } from './liquid.js';
const css = c => `rgb(${c.map(Math.round).join(',')})`;
export class BreakfastScene {
  constructor(canvas,mode,amount,reduced=false) {
    this.canvas=canvas;this.mode=mode;this.amount=amount;this.reduced=reduced;
    this.from=this.to=mix(mode,amount);this.changedAt=0;this.pourUntil=0;this.activityUntil=0;
    this.swirl=new YolkSwirl();this.frame=null;this.disposed=false;this.lastDraw=0;this.control={};
    this.field=new LiquidField(96);this.texture=document.createElement('canvas');this.texture.width=this.texture.height=96;
    this.textureContext=this.texture.getContext('2d');this.pixels=this.textureContext.createImageData(96,96);
    this.observer=new ResizeObserver(()=>this.request());this.observer.observe(canvas);this.request();
  }
  mixingProgress(){return this.swirl.progress;}
  restoreMixing(progress){this.swirl=new YolkSwirl(progress);this.request();}
  request() {if(!this.disposed&&this.frame===null)this.frame=requestAnimationFrame(t=>{this.frame=null;this.draw(t);});}
  setControl(data) {
    this.control=data||{};
    if (!(this.control.flowVelocity > 0)) this.pourUntil=0;
    if(!this.reduced&&(this.control.vortexRadius||0)>1)this.activityUntil=performance.now()+500;
    this.request();
  }
  set(amount,animate=false) {
    const now=performance.now(),added=amount-this.amount;
    if (amount === this.amount) return;
    if (added < 0) { this.field = new LiquidField(96); this.pourUntil = this.activityUntil = 0; }
    this.from=this.current(now);this.to=mix(this.mode,amount);this.amount=amount;
    this.changedAt=animate&&!this.reduced?now:0;
    if(animate&&!this.reduced&&added>0){
      const roll=this.control.roll||0;
      this.field.inject(.13+Math.max(-.18,Math.min(.18,roll*.004)),-.27,Math.min(1.3,.55+added*.09));
      this.pourUntil=now+650;this.activityUntil=now+4500;
    }
    this.request();
  }
  current(now) {
    const t=this.changedAt?Math.min(1,(now-this.changedAt)/850):1;
    return this.from.map((v,i)=>v+(this.to[i]-v)*t);
  }
  dispose() {this.disposed=true;this.observer.disconnect();if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;}
  draw(now) {
    if(this.disposed)return;
    if(now-this.lastDraw<30){this.request();return;}
    const dt=this.lastDraw?Math.min(.05,(now-this.lastDraw)/1000):1/30;this.lastDraw=now;
    // Use logical layout dimensions; only the bottle and liquid respond to sensors.
    const canvas=this.canvas,w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const x=w*.51,y=h*.58,r=Math.min(w*.285,h*.30),base=this.current(now),pouring=now<this.pourUntil;
    const controlFresh=Number.isFinite(this.control.timestamp)&&now-this.control.timestamp<300;
    const drive=controlFresh?(this.control.direction||1)*(this.control.vortexRadius||0)/10:0;
    const settlingSpin=Math.max(0,1-(now-this.pourUntil)/3200)*1.5;
    if(!this.reduced)this.field.step(dt,drive+(pouring?3.2:settlingSpin));
    const circle=(xx,yy,rr,fill)=>{ctx.beginPath();ctx.arc(xx,yy,rr,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();};
    ctx.save();ctx.shadowColor='#3b20095c';ctx.shadowBlur=22;ctx.shadowOffsetY=12;circle(x,y,r*1.28,'#e6dfcb');ctx.restore();
    const ceramic=ctx.createRadialGradient(x-r*.3,y-r*.4,r*.2,x,y,r*1.28);
    ceramic.addColorStop(0,'#fffef5');ceramic.addColorStop(.83,'#f2eddd');ceramic.addColorStop(.94,'#fffcf0');ceramic.addColorStop(1,'#bdb6a1');circle(x,y,r*1.28,ceramic);
    if(this.mode==='coffee'){
      ctx.save();ctx.lineWidth=r*.18;ctx.strokeStyle='#f3ecdc';ctx.shadowColor='#76593355';ctx.shadowBlur=5;
      ctx.beginPath();ctx.ellipse(x+r*1.02,y,r*.34,r*.43,0,-Math.PI*.65,Math.PI*.65);ctx.stroke();ctx.restore();
    }
    circle(x,y,r*1.06,'#fffdf6');
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();circle(x,y,r,css(base));
    if(!this.reduced&&this.field.energy>.003){
      this.field.paint(this.pixels.data,base,recipes[this.mode].add);this.textureContext.putImageData(this.pixels,0,0);
      ctx.imageSmoothingEnabled=true;ctx.drawImage(this.texture,x-r,y-r,r*2,r*2);
    }
    const mixing=this.swirl.step(this.mode==='eggs'?this.control:null,now,dt);
    if(this.mode==='eggs'){
      for(const i of [0,1]){
        const pose=yolkPose(i,mixing.progress,mixing.phase,this.reduced);
        if(!pose.visible)continue;
        const xx=x+pose.x*r,yy=y+pose.z*r;
        ctx.save();ctx.globalAlpha=pose.opacity;
        const yolk=ctx.createRadialGradient(xx-r*.13,yy-r*.16,2,xx,yy,r*.43);
        yolk.addColorStop(0,'#fff7b548');yolk.addColorStop(.45,'#ffffd006');yolk.addColorStop(1,'#713d1335');circle(xx,yy,r*.42,yolk);
        ctx.save();ctx.filter='blur(1.5px)';ctx.beginPath();ctx.ellipse(xx-r*.11,yy-r*.20,r*.12,r*.045,-.5,0,Math.PI*2);ctx.fillStyle='#fffce6a0';ctx.fill();ctx.restore();ctx.restore();
      }
    }else{
      const crema=ctx.createRadialGradient(x,y,r*.76,x,y,r);
      crema.addColorStop(0,'#d49d5800');crema.addColorStop(.80,'#e5b97709');crema.addColorStop(.93,'#e5b97748');crema.addColorStop(1,'#5c2b1240');circle(x,y,r,crema);
      for(let i=0;i<80;i++){
        const a=i*2.39996,rr=r*(.89+(i%7)*.013),size=.35+(i%5)*.25;
        circle(x+Math.cos(a)*rr,y+Math.sin(a)*rr,size,'#ffe6bc60');
      }
    }
    const edge=ctx.createRadialGradient(x,y,r*.87,x,y,r);edge.addColorStop(0,'#00000000');edge.addColorStop(1,'#35221142');circle(x,y,r,edge);
    // Soft specular patches are surface lighting, not outlined ripple graphics.
    ctx.save();ctx.translate(x,y);ctx.rotate(-.45+Math.max(-.08,Math.min(.08,drive*.025)));
    ctx.filter='blur(5px)';ctx.beginPath();ctx.ellipse(-r*.28,-r*.57,r*.27,r*.042,0,0,Math.PI*2);ctx.fillStyle='#fff5d932';ctx.fill();ctx.restore();
    if(pouring){
      const spot=ctx.createRadialGradient(x+r*.13,y-r*.27,1,x+r*.13,y-r*.27,r*.16);
      spot.addColorStop(0,this.mode==='coffee'?'#fff4df60':'#51220c60');spot.addColorStop(1,'#ffffff00');circle(x+r*.13,y-r*.27,r*.16,spot);
    }
    ctx.restore();
    ctx.beginPath();ctx.arc(x,y,r*1.045,Math.PI*1.03,Math.PI*1.7);ctx.strokeStyle='#ffffffa8';ctx.lineWidth=3;ctx.stroke();
    if(pouring){
      const roll=controlFresh?this.control.roll||0:0,sx=w*.78+roll*.25,sy=h*.16;
      for(const [width,colour] of this.mode==='coffee'?[[8,'#eed9b778'],[5,'#fff3dc'],[1.6,'#fffdf6b0']]:[[5,'#51291250'],[3,'#4a230d'],[.7,'#b16a2f55']]){
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(w*.70,h*.23,x+r*.20,y-r*.42,x+r*.13,y-r*.27);ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
      }
    }
    if(!this.reduced&&(now<this.activityUntil||this.field.energy>.003||pouring))this.request();
  }
}
