import { dayKey } from './domain/recipes.js';
import { createGameEngine } from './game/gameEngine.js';
import { createIntentBus } from './game/intentBus.js';
import { browserSensorEnvironment } from './motion/sensorSource.js';
import { createMotionSession } from './motion/motionSession.js';
import { observeVisibility } from './platform/visibility.js';
import { createOrientationGuard } from './platform/orientationGuard.js';
import { createApp } from './ui/app.js';
import { GameAudio } from './audio/sound.js';
import { diagnosticsRequested, createDiagnosticsPanel } from './ui/diagnosticsPanel.js';

const now = () => performance.now();
const engine = createGameEngine({now}), bus = createIntentBus(engine.accept);
const audio = new GameAudio();
const guard = createOrientationGuard(reason => session.stop(reason));
const session = createMotionSession({ engine, bus, env: browserSensorEnvironment(), guard,
  isVisible: () => document.visibilityState === 'visible', now });
const stop = reason => session.stop(reason);
const app = createApp(document.querySelector('#app'), {
  home() { stop(); location.hash = 'home'; },
  graphicsInterrupted() { stop(); },
  // Keep both calls inside the tap: permission and audio unlock need the user gesture.
  motion() { if (session.enable()) audio.unlock(); },
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
observeVisibility(reason => { audio.setVisible(false); session.interrupt(reason); });
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

// Development only: ?diagnostics=1 shows a read-only motion panel. Off in normal play.
if (diagnosticsRequested(location.search)) {
  const panel = createDiagnosticsPanel(document);
  const frame = () => { panel.render(session.diagnostics()); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
