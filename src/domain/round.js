import { COLOR_MODEL } from './recipes.js';
import { judge } from './scoring.js';
export const ROUND_RULES = 'irreversible-v1';
export const ATTEMPTS = 5;
export function serveAttempt(mode, amount, target, used, allowance = ATTEMPTS) {
  if (!Number.isInteger(used) || !Number.isInteger(allowance) || used < 0 || used >= allowance) throw new Error('No attempts remaining');
  const result = { ...judge(mode, amount, target), amount, colorModel: COLOR_MODEL, rules: ROUND_RULES };
  const finished = result.won || used + 1 >= allowance;
  return { result, finished, nextAmount: finished ? amount : 0 };
}
