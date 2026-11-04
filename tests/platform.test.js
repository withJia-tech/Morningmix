import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrientationGuard, isPortrait } from '../src/platform/orientationGuard.js';
import { observeVisibility } from '../src/platform/visibility.js';
test('native rotation cancels before viewport values change; returning does not re-arm', () => {
  const win=new EventTarget();win.screen={orientation:new EventTarget()};Object.assign(win.screen.orientation,{type:'portrait-primary',angle:0});
  Object.assign(win,{innerWidth:390,innerHeight:844,navigator:{maxTouchPoints:1}});
  const stops=[];const g=createOrientationGuard(s=>stops.push(s),win);assert.equal(g.arm(),true);
  win.dispatchEvent(new Event('orientationchange'));win.dispatchEvent(new Event('orientationchange'));assert.deepEqual(stops,['rotated']);assert.equal(g.check(),true);g.dispose();
});
test('portrait guidance rejects landscape and upside down; browser chrome resizing is ignored', () => {
  assert.equal(isPortrait({type:'portrait-secondary'}),false);assert.equal(isPortrait({angle:90}),false);
  const win=new EventTarget();win.screen={};Object.assign(win,{innerWidth:390,innerHeight:844,navigator:{maxTouchPoints:1}});
  let n=0;const g=createOrientationGuard(()=>n++,win);g.arm();win.innerHeight=700;win.dispatchEvent(new Event('resize'));assert.equal(n,0);
  win.innerWidth=844;win.dispatchEvent(new Event('resize'));assert.equal(n,1);g.dispose();
});
test('pagehide and hidden stop input; prompt blur does not cancel permission', () => {
  const doc=new EventTarget(),win=new EventTarget();doc.visibilityState='visible';const reasons=[];
  const dispose=observeVisibility(x=>reasons.push(x),doc,win);doc.visibilityState='hidden';doc.dispatchEvent(new Event('visibilitychange'));
  win.dispatchEvent(new Event('pagehide'));win.dispatchEvent(new Event('blur'));doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(reasons.length,2);dispose();win.dispatchEvent(new Event('pagehide'));assert.equal(reasons.length,2);
});
