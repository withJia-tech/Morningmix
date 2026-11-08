import { YolkSwirl, yolkPose } from './yolkSwirl.js';
import * as T from '../../assets/vendor/three/three.module.min.js';
import { mix } from '../domain/mixture.js';
import { recipes } from '../domain/recipes.js';
import { LiquidField } from './liquid.js';
import { BreakfastScene as FlatScene } from './sceneFallback.js';
import { createCup,createMilkJug,createEggBowl,createSoyBottle,createShadow,disposeModels } from './baristaModels.js';

// Presentation only: model poses and liquid colours consume committed snapshots.
export class BreakfastScene {
  constructor(canvas,mode,amount,reduced=false,onInterrupt=()=>{}) {
    this.canvas=canvas;this.mode=mode;this.amount=amount;this.reduced=reduced;
    this.swirl=new YolkSwirl();this.control={};this.frame=null;this.lastDraw=0;this.activityUntil=0;this.disposed=false;
    this.from=this.to=mix(mode,amount);this.changedAt=0;this.field=new LiquidField(96);
    this.notice=canvas.parentElement.querySelector('.scene-notice');
    try {this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}
    catch {
      const replacement=canvas.cloneNode();canvas.replaceWith(replacement);this.canvas=replacement;
      if(this.notice)this.notice.textContent='3D unavailable · simplified view';
      this.fallbackVessel=document.createElement('div');this.fallbackVessel.className=`ingredient ${mode}`;
      this.fallbackVessel.setAttribute('aria-hidden','true');this.fallbackVessel.innerHTML=`<div class="ingredient-cap"></div><span>${mode==='coffee'?'MILK':'SOY'}</span>`;
      replacement.parentElement.append(this.fallbackVessel);
      this.fallback=new FlatScene(replacement,mode,amount,reduced);return;
    }
    canvas.dataset.renderer='webgl';
    this.renderer.setClearColor(0x000000,0);this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.world=new T.Scene();this.camera=new T.OrthographicCamera(-3,3,2.5,-2.5,.1,30);
    this.camera.position.set(0,6.3,8);this.camera.lookAt(0,.75,0);
    this.world.add(new T.HemisphereLight(0xfff8e9,0x958d83,2.3));
    const key=new T.DirectionalLight(0xffffff,2.6);key.position.set(-3,7,5);this.world.add(key);
    const fill=new T.DirectionalLight(0xb7e4ff,.9);fill.position.set(4,2,-2);this.world.add(fill);
    const vessel=mode==='coffee'?createCup():createEggBowl();
    this.cup=vessel.group;this.cup.position.set(-.46,0,.44);this.world.add(this.cup);
    const shadow=createShadow();shadow.position.x=-.46;shadow.position.z=.44;this.world.add(shadow);
    const pitcher=mode==='coffee'?createMilkJug():createSoyBottle();
    this.pitcher=pitcher.group;this.spout=pitcher.spout;this.pitcher.scale.setScalar(mode==='coffee'?.88:.76);
    this.pitcher.position.set(1.29,1.16,-.25);this.world.add(this.pitcher);
    this.surfaceY=vessel.surfaceY;
    this.textureCanvas=document.createElement('canvas');this.textureCanvas.width=this.textureCanvas.height=96;
    this.textureContext=this.textureCanvas.getContext('2d');this.pixels=this.textureContext.createImageData(96,96);
    this.liquidTexture=new T.CanvasTexture(this.textureCanvas);this.liquidTexture.colorSpace=T.SRGBColorSpace;
    // Unlit texture keeps the scored colour comparable with the target swatch.
    this.surface=new T.Mesh(new T.CircleGeometry(vessel.radius,64),new T.MeshBasicMaterial({map:this.liquidTexture}));
    this.surface.rotation.x=-Math.PI/2;this.surface.position.y=vessel.surfaceY;this.cup.add(this.surface);
    this.yolks=[];
    if(mode==='eggs')for(const x of [-.43,.43]){
      const yolk=new T.Mesh(new T.SphereGeometry(.40,32,20),new T.MeshPhongMaterial({color:0xf7bd3d,shininess:100,transparent:true}));
      yolk.scale.set(1,.24,1);yolk.position.set(x,vessel.surfaceY+.01,x*.23);this.cup.add(yolk);this.yolks.push(yolk);
    }
    this.stream=new T.Mesh(new T.CylinderGeometry(1,1,1,12),new T.MeshPhongMaterial({color:mode==='coffee'?0xfff6dc:0x49220e,shininess:100}));
    this.stream.visible=false;this.world.add(this.stream);
    this.rings=[];
    for(let i=0;i<3;i++){
      const ring=new T.Mesh(new T.TorusGeometry(.13,.009,6,40),new T.MeshBasicMaterial({color:mode==='coffee'?0xfff7df:0x8b4a1d,transparent:true,opacity:0}));
      ring.rotation.x=-Math.PI/2;ring.position.set(-.33,vessel.surfaceY+.008,.22);this.world.add(ring);this.rings.push(ring);
    }
    this.onLost=e=>{e.preventDefault();this.lost=true;if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;if(this.notice)this.notice.textContent='3D view paused · reload to restore';onInterrupt();};
    this.onRestored=()=>{this.lost=false;if(this.notice)this.notice.textContent='';this.liquidTexture.needsUpdate=true;this.request();};
    canvas.addEventListener('webglcontextlost',this.onLost);canvas.addEventListener('webglcontextrestored',this.onRestored);
    this.onVisibility=()=>{if(document.visibilityState==='visible')this.request();else if(this.frame!==null){cancelAnimationFrame(this.frame);this.frame=null;}};
    document.addEventListener('visibilitychange',this.onVisibility);
    this.observer=new ResizeObserver(()=>this.request());this.observer.observe(canvas);this.request();
  }
  mixingProgress(){return this.fallback?this.fallback.mixingProgress():this.swirl.progress;}
  restoreMixing(progress){if(this.fallback){this.fallback.restoreMixing(progress);return;}this.swirl=new YolkSwirl(progress);this.request();}
  request(){if(!this.disposed&&!this.lost&&document.visibilityState==='visible'&&this.frame===null)this.frame=requestAnimationFrame(t=>{this.frame=null;this.draw(t);});}
  setControl(data){if(this.fallback){this.fallback.setControl(data);const pitch=this.reduced?0:data?.pitch||0,roll=this.reduced?0:data?.roll||0;this.fallbackVessel.style.transform=`translate(${roll*.25}px,0) rotate(${18+pitch*.65+roll*.2}deg)`;return;}this.control=data||{};this.request();}
  set(amount,animate=false){
    if(this.fallback){this.fallback.set(amount,animate);return;}
    if(amount===this.amount)return;const now=performance.now(),added=amount-this.amount;
    if(added<0){this.field=new LiquidField(96);this.activityUntil=0;}
    this.from=this.current(now);this.to=mix(this.mode,amount);this.amount=amount;this.changedAt=animate&&!this.reduced?now:0;
    if(added>0&&animate&&!this.reduced){this.field.inject(.13,-.22,Math.min(1.3,.55+added*.09));this.activityUntil=now+4000;}
    this.request();
  }
  current(now){const t=this.changedAt?Math.min(1,(now-this.changedAt)/850):1;return this.from.map((v,i)=>v+(this.to[i]-v)*t);}
  draw(now){
    if(this.disposed||this.lost)return;
    if(now-this.lastDraw<30){this.request();return;}
    const dt=this.lastDraw?Math.min(.05,(now-this.lastDraw)/1000):1/30;this.lastDraw=now;
    const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight),ratio=w/h,dpr=Math.min(devicePixelRatio||1,1.75);
    if(this.width!==w||this.height!==h||this.dpr!==dpr){
      this.width=w;this.height=h;this.dpr=dpr;this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);
      const span=Math.max(3.65,4.85/ratio);this.camera.left=-span*ratio/2;this.camera.right=span*ratio/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.updateProjectionMatrix();
    }
    const fresh=Number.isFinite(this.control.timestamp)&&now-this.control.timestamp<=250;
    const flow=fresh?Math.max(0,Math.min(1,this.control.flowVelocity||0)):0;
    const drive=fresh?(this.control.direction||1)*(this.control.vortexRadius||0)/10:0;
    const pitch=fresh?this.control.pitch||0:0,roll=fresh?this.control.roll||0:0;
    this.pitcher.rotation.z=this.reduced?.10:.10+Math.min(.94,Math.abs(pitch)*.021);
    this.pitcher.rotation.x=this.reduced?0:roll*.004;
    this.pitcher.position.x=1.29+(this.reduced?0:Math.max(-.15,Math.min(.15,roll*.006)));
    const base=this.current(now);
    const mixing=this.swirl.step(this.mode==='eggs'?this.control:null,now,dt);
    if(!this.reduced)this.field.step(dt,drive+(flow>0?2:0));
    this.field.paint(this.pixels.data,base,recipes[this.mode].add);
    this.textureContext.putImageData(this.pixels,0,0);this.liquidTexture.needsUpdate=true;
    for(const [i,yolk] of this.yolks.entries()){
      const pose=yolkPose(i,mixing.progress,mixing.phase,this.reduced);
      yolk.position.set(pose.x,this.surfaceY+.01,pose.z);
      yolk.scale.set(pose.scale,.24*pose.scale,pose.scale);
      yolk.material.opacity=pose.opacity;yolk.visible=pose.visible;
      yolk.material.color.setRGB(base[0]/255,base[1]/255,base[2]/255,T.SRGBColorSpace);
    }
    this.stream.visible=flow>0;
    if(flow>0){
      const start=this.spout.getWorldPosition(new T.Vector3()),end=new T.Vector3(-.33,this.surfaceY+.01,.22),delta=end.clone().sub(start);
      this.stream.position.copy(start).add(end).multiplyScalar(.5);this.stream.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());
      const thickness=(this.mode==='coffee'?.029:.019)*(0.55+flow*.45);this.stream.scale.set(thickness,delta.length(),thickness);
    }
    for(const [i,ring] of this.rings.entries()){
      const p=(now/820+i/3)%1;ring.visible=!this.reduced&&flow>0;ring.scale.setScalar(.5+p*2.7);ring.material.opacity=(1-p)*.30;
    }
    this.renderer.render(this.world,this.camera);
    if(fresh||(!this.reduced&&(now<this.activityUntil||this.field.energy>.003)))this.request();
  }
  dispose(){
    if(this.fallback){this.fallback.dispose();this.fallbackVessel.remove();return;}
    this.disposed=true;this.observer.disconnect();if(this.frame!==null)cancelAnimationFrame(this.frame);
    document.removeEventListener('visibilitychange',this.onVisibility);this.canvas.removeEventListener('webglcontextlost',this.onLost);this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
    disposeModels(this.world);this.renderer.dispose();this.renderer.forceContextLoss();
  }
}
