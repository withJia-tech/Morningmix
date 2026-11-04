import { ACTIVE_STATES, MOTION_MESSAGES } from '../motion/motionErrors.js';
export function renderMotionStatus(root, state) {
  const button = root.querySelector('#motionButton'), message = root.querySelector('#motionStatus');
  if (!button || !message) return;
  const busy = ACTIVE_STATES.includes(state.motion);
  button.textContent = busy ? 'Pause motion' : ['off','calibration_required','paused','background'].includes(state.motion) ? 'Enable motion' : 'Retry motion';
  button.disabled = !state.round || state.round.finished;
  button.setAttribute('aria-pressed',String(busy));
  const text = MOTION_MESSAGES[state.motion] || MOTION_MESSAGES.error;
  if (message.textContent !== text) message.textContent = text;
  message.dataset.state = state.motion;
}
