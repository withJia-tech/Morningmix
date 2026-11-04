import { dayKey } from './domain/recipes.js';
import { createGameEngine } from './game/gameEngine.js';
import { createIntentBus } from './game/intentBus.js';
import { SensorSource, browserSensorEnvironment } from './motion/sensorSource.js';
import { Calibration } from './motion/calibration.js';
import { MotionFilter } from './motion/motionFilter.js';
import { TiltPour } from './motion/tiltPour.js';
import { ACTIVE_STATES } from './motion/motionErrors.js';
import { observeVisibility } from './platform/visibility.js';
import { createOrientationGuard } from './platform/orientationGuard.js';
import { createApp } from './ui/app.js';
import { GameAudio } from './audio/sound.js';

const now = () => performance.now();
const engine = createGameEngine({now}), bus = createIntentBus(engine.accept);
const calibration = new Calibration(), filter = new MotionFilter(), tilt = new TiltPour(), audio = new GameAudio();
let token = null, startedAt = 0;
const motionStatus = state => token === null ? {accepted:false} : bus.publish({type:'MOTION_STATUS',state,epoch:token,at:now(),source:'sensor'});
const clearControls = () => { calibration.reset(); filter.reset(); tilt.reset(); };
const guard = createOrientationGuard(reason => stop(reason));
const source = new SensorSource(browserSensorEnvironment(), {
  canRead: () => token === engine.snapshot().epoch && engine.snapshot().view === 'round' && !!engine.snapshot().round && !engine.snapshot().round.finished && document.visibilityState === 'visible' && guard.check(),
  onState(state) {
    if (ACTIVE_STATES.includes(state)) {
      if (state === 'waiting') startedAt = now();
      motionStatus(state);
    }
    else { guard.disarm(); clearControls(); motionStatus(state); token = null; }
  },
  onSample(sample) {
    const result = calibration.sample(sample);
    if (result.error) { stop(result.error); return; }
    if (result.calibrating) {
      if (now() - startedAt >= 15000) { stop('unstable'); return; }
      motionStatus('calibrating'); return;
    }
    if (result.calibrated) { motionStatus('active'); return; }
    const filtered = filter.sample(result.pitch,result.roll,result.at);
    if (!filtered) { stop('invalid_readings'); return; }
    for (const intent of tilt.sample(engine.snapshot().round.mode,filtered,token)) bus.publish(intent);
  }
});
function stop(reason = 'paused') { guard.disarm(); source.stop(reason); }
function enable() {
  const state = engine.snapshot();
  if (!state.round || state.round.finished || document.visibilityState !== 'visible') return;
  if (ACTIVE_STATES.includes(state.motion)) { stop(); return; }
  stop();
  if (!guard.arm()) { engine.pause('portrait_required'); return; }
  clearControls(); token = engine.beginMotion(); startedAt = now();
  // Permission remains directly inside this button gesture. No awaited audio/setup work.
  source.start(); audio.unlock();
}
const app = createApp(document.querySelector('#app'), {
  home() { stop(); location.hash = 'home'; },
  graphicsInterrupted() { stop(); },
  motion: enable,
  submit() { stop(); engine.submit(); }
});
engine.subscribe((state,event) => {
  app.render(state,event);
  for (const link of document.querySelectorAll('.recipe-nav a')) {
    if (state.view === 'round' && link.dataset.order === state.round.mode) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  audio.setMusicActive(state.view === 'round' && !state.round.finished);
  if (event.type === 'POUR_ACCEPTED') audio.pour(state.round.mode,event.flow);
  if (event.type === 'SERVED') audio.finish(event.result.won);
});
observeVisibility(reason => { audio.setVisible(false); if (ACTIVE_STATES.includes(engine.snapshot().motion)) stop(reason); });
document.addEventListener('visibilitychange', () => audio.setVisible(document.visibilityState === 'visible'));
window.addEventListener('pageshow', () => audio.setVisible(document.visibilityState === 'visible'));
const sound = document.querySelector('#soundToggle');
sound.onclick = () => {
  audio.setEnabled(!audio.enabled);
  sound.textContent = audio.enabled ? 'Sound on' : 'Sound off'; sound.setAttribute('aria-pressed',String(audio.enabled));
};

// URL navigation selects an order, never adds ingredient. Back/forward use the same stop path.
function openRoute() {
  stop();
  const mode = location.hash.slice(1);
  if (mode === 'coffee' || mode === 'eggs') engine.startRound(mode,dayKey());
  else engine.home();
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-order],a.brand');
  if (link && link.hash !== location.hash) stop();
  if (link?.dataset.order) audio.unlock();
});
window.addEventListener('hashchange',openRoute);
openRoute();
