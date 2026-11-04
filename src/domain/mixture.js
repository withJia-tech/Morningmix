import { recipes } from './recipes.js';
// Authored food-colour ramps, not chemistry or a perceptual colour model.
const palettes = {
  eggs: [[0,[246,181,28]],[5,[220,144,30]],[10,[193,112,23]],[20,[151,78,18]],[30,[117,55,14]]],
  coffee: [[0,[52,24,12]],[5,[74,36,18]],[15,[103,55,29]],[30,[131,77,43]],[50,[156,100,59]],[80,[178,127,81]],[120,[196,150,103]],[180,[215,177,131]]]
};
export function mix(mode, amount) {
  const r = recipes[mode];
  if (!r || !Number.isFinite(amount) || amount < 0 || amount > r.max) throw new Error('Invalid mixture');
  const ramp = palettes[mode];
  for (let i = 1; i < ramp.length; i++) {
    const [end, b] = ramp[i], [start, a] = ramp[i - 1];
    if (amount <= end) return a.map((v, c) => Math.round(v + (b[c] - v) * (amount - start) / (end - start)));
  }
  return [...ramp.at(-1)[1]];
}
export function addIngredient(mode, current, quantity) {
  const r = recipes[mode];
  if (!r || !Number.isFinite(current) || current < 0 || current > r.max || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Only positive pours are allowed');
  return Math.min(r.max, current + quantity);
}
