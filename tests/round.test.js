import test from 'node:test';
import assert from 'node:assert/strict';
import { serveAttempt } from '../src/domain/round.js';
test('a missed serving uses one try and gives a fresh cup', () => {
  const r=serveAttempt('coffee',0,100,0); assert.equal(r.finished,false); assert.equal(r.nextAmount,0); assert.equal(r.result.won,false);
});
test('a win retains its final amount', () => {
  const r=serveAttempt('coffee',100,100,0); assert.equal(r.finished,true); assert.equal(r.nextAmount,100);
});
test('the fifth miss ends the round; a sixth attempt is invalid', () => {
  assert.equal(serveAttempt('eggs',0,20,4).finished,true);
  for (const used of [5,6,-1,NaN,1.2]) assert.throws(() => serveAttempt('eggs',0,20,used));
});
