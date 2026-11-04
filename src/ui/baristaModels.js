// Original, reusable 3D mesh assets. No downloads, model loaders or remote textures.
import * as T from '../../assets/vendor/three/three.module.min.js';
const ceramic = colour => new T.MeshPhongMaterial({color:colour,shininess:90,specular:0x777777});
const lathe = (points,material) => new T.Mesh(new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),48),material);
function mesh(parent,geometry,material,position=[0,0,0]) {
  const m=new T.Mesh(geometry,material);m.position.set(...position);parent.add(m);return m;
}
function label(parent,text,y,radius,colour='#375d54',taper=0) {
  const c=document.createElement('canvas');c.width=256;c.height=128;
  const x=c.getContext('2d');x.fillStyle='#fff8df';x.fillRect(0,0,256,128);
  x.strokeStyle=colour;x.lineWidth=6;x.strokeRect(9,9,238,110);
  x.fillStyle=colour;x.font='bold 46px sans-serif';x.textAlign='center';x.fillText(text,128,81);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  return mesh(parent,new T.CylinderGeometry(radius-taper,radius+taper,.37,24,1,true,-.65,1.3),new T.MeshBasicMaterial({map}),[0,y,0]);
}
function handle(parent,x,y,size,material) {
  const h=mesh(parent,new T.TorusGeometry(size,.075,12,36,Math.PI*1.55),material,[x,y,0]);
  h.rotation.z=-Math.PI*.775;h.scale.set(.8,1,1);return h;
}
export function createCup() {
  const group=new T.Group(),white=ceramic(0xfff9e9),mint=ceramic(0x7cc8ae);
  group.add(lathe([[0,.01],[1.22,.01],[1.4,.08],[1.44,.13],[1.4,.17],[1.15,.12],[0,.1]],white));
  group.add(lathe([[0,.14],[.62,.14],[.70,.23],[.80,.48],[.88,1.07],[.87,1.13],[.81,1.14],[.79,1.06],[.72,.38],[0,.30]],white));
  mesh(group,new T.CylinderGeometry(.858,.847,.09,48,1,true),mint,[0,.94,0]);
  handle(group,.94,.69,.34,white);
  return {group,surfaceY:1.065,radius:.785};
}
export function createMilkJug() {
  const group=new T.Group(),enamel=ceramic(0xafdce0),inside=ceramic(0xe9f4ed);
  group.add(lathe([[0,0],[.40,0],[.48,.08],[.48,.35],[.43,.95],[.40,1.06],[.35,1.06],[.37,.90],[.40,.20],[0,.17]],enamel));
  const vertices=new Float32Array([-.39,1.04,-.19,-.75,1.06,0,-.39,1.04,.19,-.39,.82,-.12,-.75,1.06,0,-.39,.82,.12]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(vertices,3));geo.setIndex([0,1,3,1,4,3,1,2,5,1,5,4,0,2,1]);geo.computeVertexNormals();
  group.add(new T.Mesh(geo,new T.MeshPhongMaterial({color:0xbedfe1,side:T.DoubleSide,shininess:90})));
  handle(group,.54,.61,.34,enamel);
  mesh(group,new T.CylinderGeometry(.36,.36,.015,40),inside,[0,.85,0]);
  label(group,'MILK',.55,.474,'#375d54',.015);
  const spout=new T.Object3D();spout.position.set(-.74,1.055,0);group.add(spout);
  return {group,spout};
}
export function createEggBowl() {
  const group=new T.Group(),cream=ceramic(0xfff5dc);
  group.add(lathe([[0,.04],[.64,.04],[.76,.12],[.95,.28],[1.16,.61],[1.19,.72],[1.16,.78],[1.09,.76],[.96,.49],[.72,.28],[0,.22]],cream));
  mesh(group,new T.CylinderGeometry(1.161,1.13,.06,48,1,true),ceramic(0xe6a56d),[0,.67,0]);
  return {group,surfaceY:.68,radius:1.09};
}
export function createSoyBottle() {
  const group=new T.Group(),amber=ceramic(0x4b271a),red=ceramic(0xd9503d);
  group.add(lathe([[0,0],[.31,0],[.38,.08],[.38,.78],[.33,.96],[.16,1.1],[.15,1.35],[0,1.35]],amber));
  mesh(group,new T.CylinderGeometry(.23,.23,.19,32),red,[0,1.31,0]);
  const cap=mesh(group,new T.SphereGeometry(.23,32,16),red,[0,1.4,0]);cap.scale.y=.30;
  const nozzle=mesh(group,new T.CylinderGeometry(.065,.075,.28,20),red,[-.29,1.31,0]);nozzle.rotation.z=Math.PI/2;
  label(group,'SOY',.56,.388,'#944635');
  const spout=new T.Object3D();spout.position.set(-.44,1.31,0);group.add(spout);
  return {group,spout};
}
export function createShadow() {
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#42250e70');g.addColorStop(.5,'#42250e32');g.addColorStop(1,'#42250e00');x.fillStyle=g;x.fillRect(0,0,64,64);
  const shadow=new T.Mesh(new T.PlaneGeometry(3.4,2.9),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.015;return shadow;
}
export function disposeModels(scene) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);if(m.map)textures.add(m.map);}});
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
