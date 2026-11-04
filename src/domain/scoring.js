import { mix } from './mixture.js';
export function score(a, b) {
  if (![a,b].every(c => Array.isArray(c) && c.length === 3 && c.every(v => Number.isFinite(v) && v >= 0 && v <= 255))) throw new Error('Invalid colour');
  return Math.max(0, Math.round(100 * (1 - Math.hypot(...a.map((v,i) => v - b[i])) / (Math.sqrt(3) * 255))));
}
export function judge(mode, amount, target) {
  const c = mix(mode, amount), t = mix(mode, target);
  return { score: score(c,t), won: Math.hypot(...c.map((v,i) => v - t[i])) <= 6,
    direction: amount < target ? 'more' : amount > target ? 'less' : 'exact', rgb: c };
}
