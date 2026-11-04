import { recipes } from '../domain/recipes.js';
import { mix } from '../domain/mixture.js';
export function renderHud(root, state) {
  const r = state.round;
  if (!r) return;
  const recipe = recipes[r.mode];
  root.querySelector('#amount').textContent = `${r.amount} ${recipe.unit} added`;
  root.querySelector('#tries').textContent = r.finished ? 'ROUND COMPLETE' : `${r.allowance - r.attempts.length} TRIES LEFT`;
  root.querySelector('#target').style.backgroundColor = `rgb(${mix(r.mode,r.target).join(',')})`;
  root.querySelector('#serve').disabled = r.finished;
  root.querySelector('#attempts').textContent = r.attempts.map((a,i) => `${i+1}: ${a.score}%`).join(' · ');
  const last = r.attempts.at(-1);
  root.querySelector('#result').textContent = !last ? '' : r.finished
    ? last.won ? `A match! ${last.score}% · ${r.attempts.length} ${r.attempts.length === 1 ? 'try' : 'tries'}.` : `Five tries complete. Best match: ${Math.max(...r.attempts.map(a => a.score))}%.`
    : `Fresh ${r.mode === 'coffee' ? 'cup' : 'bowl'}. Last match: ${last.score}%. Aim for ${last.direction === 'more' ? 'more' : 'less'} ${recipe.ingredient}.`;
}
