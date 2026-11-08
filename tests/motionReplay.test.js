import test from 'node:test';
import assert from 'node:assert/strict';
import { MOTION_RULES } from '../src/domain/motionRules.js';
import { recipes } from '../src/domain/recipes.js';
import { diagnosticsRequested, formatDiagnostics } from '../src/ui/diagnosticsPanel.js';
import { createReplay, calibrate, hold } from './motionReplay.js';

// Thresholds come from the project's own rules, never restated here.
const { deadband, maxTilt, portionsPerSecond } = MOTION_RULES;
const GRIP = 30;                                   // comfortable starting beta, any value works
const portion = recipes.coffee.portion;            // 5 ml
const expectedFlow = tilt => Math.min(1, Math.max(0, (Math.abs(tilt) - deadband) / (maxTilt - deadband)));
const last = trace => trace.at(-1);
const pours = trace => trace.filter(d => d.lastAction?.type === 'POUR' && d.lastAction.accepted);

async function calibrated(options) {
  const r = createReplay(options);
  const trace = await r.run([{ enable: true }, ...calibrate(0, GRIP)]);
  assert.equal(last(trace).motion, 'active', 'setup: calibration must finish before the scenario starts');
  return r;
}

test('1. neutral grip after calibration produces no pouring', async () => {
  const r = await calibrated();
  const trace = await r.run(hold(650, 2650, GRIP));
  assert.ok(trace.every(d => d.flow === 0 && d.amount === 0));
  assert.equal(last(trace).state, 'neutral');
  assert.equal(pours(trace).length, 0);
  assert.deepEqual(last(trace).lastAction, { type: 'MOTION_STATUS', accepted: true, reason: null, detail: 'active' });
});

test('2. tilt inside the deadband, in either direction and at its edge, produces no pouring', async () => {
  const r = await calibrated();
  const trace = await r.run([
    ...hold(650, 1650, GRIP + deadband - 0.5),
    ...hold(1700, 2700, GRIP + deadband),          // exactly on the boundary still counts as neutral
    ...hold(2750, 3750, GRIP - deadband)
  ]);
  assert.ok(trace.every(d => d.flow === 0), 'no step may report pouring intensity');
  assert.equal(last(trace).amount, 0);
  assert.equal(pours(trace).length, 0);
  assert.equal(last(trace).state, 'neutral');
  // Returning from a pour to exactly the deadband edge stops on that first reading, not after smoothing.
  const back = await calibrated();
  await back.run(hold(650, 1650, GRIP + 40));
  const edge = await back.run(hold(1700, 1700, GRIP + deadband));
  assert.equal(edge[0].flow, 0, 'first reading at the deadband edge must stop the pour');
  assert.equal(edge[0].state, 'neutral');
});

test('3. tilt beyond the threshold pours at the intensity the project rules define', async () => {
  const tilt = 31.5, flow = expectedFlow(tilt);   // (31.5 - 10) / (45 - 10) = 0.614...
  const r = await calibrated();
  const trace = await r.run(hold(650, 2650, GRIP + tilt));
  const end = last(trace);
  assert.ok(Math.abs(end.flow - flow) < 1e-3, `flow ${end.flow} should settle at ${flow}`);
  assert.equal(end.state, 'pouring');
  assert.ok(Math.abs(end.tiltFromGrip.pitch - tilt) < 1e-9, 'calibrated tilt is measured from the grip');
  // 2 s at this intensity: rate = flow x 2 portions/s; allow for the 100 ms smoothing ramp.
  const portions = end.amount / portion;
  assert.ok(portions >= Math.floor(flow * portionsPerSecond * 1.75) && portions <= Math.ceil(flow * portionsPerSecond * 2),
    `${portions} portions in 2 s at flow ${flow.toFixed(3)}`);
  assert.equal(end.lastAction.type, 'POUR');
  // Backward tilt pours at the same intensity; past full tilt the rate is capped at 1.
  const back = await calibrated();
  assert.ok(Math.abs(last(await back.run(hold(650, 1650, GRIP - tilt))).flow - flow) < 1e-3);
  const full = await calibrated();
  assert.equal(last(await full.run(hold(650, 1650, GRIP + maxTilt + 5))).flow, 1);
});

test('4. permission denial or a blocked request prevents pouring and is reported as blocked', async () => {
  for (const [permission, motion, label] of [
    [() => Promise.resolve('denied'), 'denied', 'denied'],
    [() => Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })), 'permission_blocked', 'blocked']
  ]) {
    const r = createReplay({ permission });
    const trace = await r.run([{ enable: true }, ...calibrate(0, GRIP), ...hold(650, 2650, GRIP + 40)]);
    const end = last(trace);
    assert.equal(end.motion, motion);
    assert.equal(end.permission, label);
    assert.equal(end.state, 'blocked');
    assert.equal(end.amount, 0);
    assert.equal(r.fake.listeners.size, 0, 'no sensor listener is ever attached');
  }
});

test('5. screen rotation pauses pouring, keeps the cup and does not use a try', async () => {
  const r = await calibrated();
  const before = last(await r.run(hold(650, 1650, GRIP + 40)));
  assert.ok(before.amount > 0 && before.triesLeft === 5);
  const after = await r.run([{ rotate: true }]);
  assert.equal(r.fake.listeners.size, 0, 'rotation detaches the sensor immediately, before any further reading');
  after.push(...await r.run(hold(1700, 2700, GRIP + 40)));
  assert.equal(after[0].motion, 'rotated');
  assert.equal(after[0].state, 'paused');
  assert.ok(after.every(d => d.amount === before.amount && d.triesLeft === 5), 'no pour and no try used after rotation');
  assert.equal(r.fake.listeners.size, 0);
});

test('6. losing page visibility stops active pouring', async () => {
  // The visibilitychange event stops motion as "background".
  const r = await calibrated();
  const before = last(await r.run(hold(650, 1650, GRIP + 40)));
  const after = await r.run([{ hide: true }]);
  assert.equal(r.fake.listeners.size, 0, 'hiding the page detaches the sensor immediately');
  after.push(...await r.run(hold(1700, 2700, GRIP + 40)));
  assert.equal(after[0].motion, 'background');
  assert.equal(after[0].state, 'paused');
  assert.equal(r.engine.snapshot().control.flow, 0);
  assert.ok(after.every(d => d.amount === before.amount));
  // A reading that arrives after the page is hidden but before the event fires cannot pour either.
  const early = await calibrated();
  const held = last(await early.run(hold(650, 1650, GRIP + 40)));
  const raced = await early.run([{ hiddenWithoutEvent: true }, ...hold(1700, 2200, GRIP + 40)]);
  assert.ok(raced.every(d => d.amount === held.amount));
  assert.equal(last(raced).state, 'paused');
});

test('7. identical inputs from identical starting conditions give identical outputs', async () => {
  const script = [
    { enable: true }, ...calibrate(0, GRIP),
    ...hold(650, 1650, GRIP + 25), ...hold(1700, 2200, GRIP), ...hold(2250, 3250, GRIP - 45, 6),
    { rotate: true }, ...hold(3300, 3600, GRIP + 40)
  ];
  const a = await createReplay().run(script), b = await createReplay().run(script);
  assert.deepEqual(a, b);
  assert.ok(pours(a).length > 0 && last(a).state === 'paused', 'the script exercises pouring and a pause');
});

test('diagnostics are a read-only copy: changing them cannot change the game', async () => {
  const r = await calibrated();
  const d = last(await r.run(hold(650, 1650, GRIP + 40)));
  assert.throws(() => { d.amount = 999; }, TypeError);
  assert.throws(() => { d.tiltFromGrip.pitch = 0; }, TypeError);
  assert.throws(() => { d.lastAction.accepted = false; }, TypeError);
  assert.equal(r.engine.snapshot().round.amount, d.amount);
});

test('diagnostics panel is off unless explicitly requested, and labels every required field', () => {
  assert.equal(diagnosticsRequested(''), false);
  assert.equal(diagnosticsRequested('?diagnostics=0'), false);
  assert.equal(diagnosticsRequested('?debug=1'), false);
  assert.equal(diagnosticsRequested('?diagnostics=1'), true);
  const rows = formatDiagnostics({ permission: 'granted', motion: 'active', state: 'pouring',
    tiltFromGrip: { pitch: 31.5, roll: -2 }, filteredPitch: 31.4, flow: 0.614,
    lastAction: { type: 'POUR', accepted: true, reason: null, detail: '5 milk' }, amount: 10, triesLeft: 5 });
  assert.deepEqual(rows.map(([label]) => label),
    ['Permission', 'State', 'Tilt from grip', 'Filtered pitch', 'Pour intensity', 'Last action', 'Cup']);
  assert.equal(rows[4][1], '61%');
  assert.equal(rows[5][1], 'POUR 5 milk · accepted');
});

// Known limitation, kept visible rather than hidden. The pipeline reads the browser's Euler
// beta/gamma. Near upright (beta ~ 90 degrees) gamma becomes extremely sensitive, so a small twist
// of the phone while tilting forward through upright reads as a huge roll and stops as "reposition".
// Fixing it means changing the motion mapping (gameplay), which is outside this change.
test('known limitation: tilting forward through upright with a slight twist should keep pouring', {
  todo: 'Euler gamma instability near upright; needs a gravity-vector mapping change'
}, async () => {
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  // Device-frame gravity for physical pitch p, then a twist t about the screen normal, converted
  // to the beta/gamma a browser reports (W3C Z-X'-Y'' Euler angles).
  const reported = (p, t) => {
    const g = [0, -Math.sin(rad(p)), -Math.cos(rad(p))];
    const x = -Math.sin(rad(t)) * g[1], z = g[2], y = Math.cos(rad(t)) * g[1];
    const cb = Math.sign(-z || 1e-12) * Math.hypot(x, z);
    return { beta: deg(Math.atan2(-y, cb)), gamma: deg(Math.atan(x / (-z || -1e-12))) };
  };
  const r = createReplay();
  const steps = [{ enable: true }, ...calibrate(0, 55)];
  for (let i = 0, at = 650; i <= 60; i++, at += 50) {
    const { beta, gamma } = reported(55 + 45 * i / 60, Math.sin(i / 6));   // ±1 degree twist
    steps.push({ at, beta, gamma });
  }
  const end = last(await r.run(steps));
  assert.notEqual(end.motion, 'reposition', `stopped as ${end.motion}`);
});
