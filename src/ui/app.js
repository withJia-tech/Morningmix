import { recipes } from '../domain/recipes.js';
import { BreakfastScene } from './scene.js';
import { renderHud } from './hud.js';
import { renderMotionStatus } from './motionStatus.js';
export function createApp(root, commands) {
  let shown = null, scene = null;
  // Decorative progress belongs to the current bowl; navigation must not unmix it.
  const mixingByRound=new Map();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function build(state) {
    if(scene)mixingByRound.set(shown,scene.mixingProgress());
    scene?.dispose(); scene = null;
    if (state.view === 'home') {
      root.innerHTML = `<section class="welcome"><span class="eyebrow">A LITTLE MORNING CHALLENGE</span><h1>Find your<br>perfect blend.</h1><p>Coffee or eggs? Both are ready every day.<br>Tilt to pour. Move side to side to swirl.</p><div class="order-choices"><a class="order-choice" href="#coffee" data-order="coffee"><span class="choice-icon" aria-hidden="true">☕</span><strong>Coffee →</strong><small>Pour milk. Find your blend.</small></a><a class="order-choice" href="#eggs" data-order="eggs"><span class="choice-icon" aria-hidden="true">🥚</span><strong>Eggs →</strong><small>Add soy. Match the yolks.</small></a></div><small class="switch-note">Switch any time. Your mixes and tries stay until reload.</small><div class="mascot-hero"><img class="welcome-mascot" src="assets/barista-chibi.png" alt="A cheerful chibi barista holding a coffee cup"></div><small>Phone motion required · 5 tries per order · No login</small><p class="session-note">Testing build. Session history clears on reload.</p><details><summary>This session’s results</summary><ul id="sessionHistory"></ul></details></section>`;
      const list = root.querySelector('#sessionHistory');
      if (!state.history.length) list.textContent = 'No servings yet.';
      for (const item of state.history) {
        const li = document.createElement('li'); li.textContent = `${recipes[item.mode].name}: ${item.attempts.map(a => `${a.score}%`).join(', ')}`; list.append(li);
      }
      return;
    }
    const mode = state.round.mode;
    root.innerHTML = `<section class="round"><div class="game-topline"><button class="quiet" id="menu">← Menu</button><span id="tries"></span></div><h1 class="round-title">${recipes[mode].name}</h1><div class="game-board"><div class="order-ticket"><span>MATCH THIS</span><div id="target" class="target-swatch"></div><small>${mode === 'coffee' ? 'Barista’s colour' : 'Target colour'}</small></div><canvas id="scene" role="img" aria-label="${mode === 'coffee' ? '3D coffee cup and milk pitcher' : '3D egg bowl and soy sauce bottle'}. Your mixture changes colour as you pour."></canvas><span class="scene-notice" role="status"></span><span id="amount" class="board-amount"></span></div><div class="controls"><button id="motionButton" class="primary" aria-describedby="motionStatus">Enable motion</button><p id="motionStatus" role="status" aria-live="polite"></p><button id="serve" class="serve">Serve this ${mode === 'coffee' ? 'cup' : 'bowl'} →</button><p id="result" role="status"></p><p id="attempts" aria-label="Scored attempts"></p><details><summary>How motion works</summary><p>Lock your phone in portrait before playing. Hold still after enabling motion. Tilt forward or back to pour; a greater angle pours faster. Return to your starting grip to stop. Gently roll to swirl.</p><p>Pouring is irreversible. A scored miss starts a fresh cup. Sensor failures keep your mix and tries.</p><p>The game cannot verify your phone’s rotation lock. If the screen rotates, motion pauses.</p></details></div></section>`;
    root.querySelector('#menu').onclick = commands.home;
    root.querySelector('#motionButton').onclick = commands.motion;
    root.querySelector('#serve').onclick = commands.submit;
    scene = new BreakfastScene(root.querySelector('#scene'),mode,state.round.amount,reduced(),commands.graphicsInterrupted);
    scene.restoreMixing(mixingByRound.get(state.round.id)??0);
  }
  return Object.freeze({ render(state,event) {
    const key = state.view === 'home' ? 'home' : state.round.id;
    if (shown !== key) { build(state); shown = key; root.scrollTop = 0; }
    if (state.view === 'home') return;
    if(event.type==='SERVED'&&!state.round.finished){mixingByRound.delete(state.round.id);scene.restoreMixing(0);}
    scene.setControl(state.control);
    scene.set(state.round.amount,event.type === 'POUR_ACCEPTED');
    if (event.type !== 'CONTROL') { renderHud(root,state); renderMotionStatus(root,state); }
    if (!reduced() && event.type === 'POUR_ACCEPTED') root.querySelector('#amount').animate([{scale:1},{scale:1.1,offset:.35},{scale:.98,offset:.7},{scale:1}],{duration:320});
    if (!reduced() && event.type === 'SERVED') root.querySelector('#result').animate([{scale:.95},{scale:1.03,offset:.55},{scale:1}],{duration:420});
  }, dispose() { scene?.dispose(); } });
}
