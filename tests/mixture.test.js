import test from 'node:test';
import assert from 'node:assert/strict';
import { recipes, daily } from '../src/domain/recipes.js';
import { mix, addIngredient } from '../src/domain/mixture.js';
import { judge } from '../src/domain/scoring.js';
import { LiquidField } from '../src/ui/liquid.js';
test('coffee remains warm across every allowed quantity', () => {
  for (let n=0;n<=180;n++) { const [r,g,b] = mix('coffee',n); assert.ok(r>g && g>b); }
});
test('both recipes have reachable exact targets across a full year', () => {
  for (const mode of Object.keys(recipes)) for (let n=0;n<365;n++) {
    const date = new Date(Date.UTC(2026,0,n+1)).toISOString().slice(0,10), target=daily(mode,date);
    assert.equal(target%recipes[mode].portion,0); assert.equal(judge(mode,target,target).score,100); assert.equal(judge(mode,target,target).won,true);
  }
});
test('positive pours cap at maximum, subtraction and malformed inputs throw', () => {
  assert.equal(addIngredient('coffee',179,5),180);
  for (const q of [0,-1,NaN,Infinity,'5']) assert.throws(() => addIngredient('coffee',0,q));
  for (const n of [-1,181,NaN,null]) assert.throws(() => mix('coffee',n));
});
test('visual liquid stays bounded and settles without changing mixture truth', () => {
  const field = new LiquidField(32); field.inject();
  for (let n=0;n<500;n++) field.step(.05,n<30?2:0);
  assert.ok([...field.dye].every(x => x>=0 && x<=1)); assert.ok(field.energy<.001);
});
