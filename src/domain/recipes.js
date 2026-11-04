export const COLOR_MODEL = 'warm-food-v2';
const recipe = value => Object.freeze({ ...value, base: Object.freeze(value.base), add: Object.freeze(value.add) });
export const recipes = Object.freeze({
  eggs: recipe({ name: 'Two yolks', ingredient: 'soy sauce', base: [246,181,28], add: [62,27,7], unit: 'drops', max: 30, portion: 1 }),
  coffee: recipe({ name: 'Morning coffee', ingredient: 'milk', base: [52,24,12], add: [255,242,214], unit: 'ml', max: 180, portion: 5 })
});
export function daily(mode, date) {
  const r = recipes[mode];
  if (!r || typeof date !== 'string') throw new Error('Invalid target');
  let h = 0;
  for (const c of date + mode) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const n = 3 + h % (r.max - 5);
  return mode === 'coffee' ? Math.round(n / 5) * 5 : n;
}
export function dayKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export const dailyOrder = date => Number(date.slice(-2)) % 2 === 0 ? 'eggs' : 'coffee';
