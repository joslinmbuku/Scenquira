import assert from 'node:assert/strict';

// Run against npm run dev or npm start. This only controls the isolated simulator.
const base = 'http://localhost:4000';
const origin = 'http://localhost:3000';
const response = await fetch(`${base}/session`, { method: 'POST', headers: { Origin: origin } });
assert.equal(response.status, 200);
const { csrf } = await response.json();
const cookie = response.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie && csrf);
const headers = { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json', 'X-Scenquira-CSRF': csrf };
async function command(body) {
  const r = await fetch(`${base}/command`, { method: 'POST', headers, body: JSON.stringify(body) });
  assert.ok(r.ok, `Command ${body.action} returned ${r.status}`);
  return r.json();
}
async function state() { const r = await fetch(`${base}/state`, { headers }); assert.equal(r.status, 200); return r.json(); }
assert.equal((await fetch(`${base}/command`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
assert.equal((await fetch(`${base}/session`, { method: 'POST', headers: { Origin: 'https://foreign.example' } })).status, 403);
assert.equal((await fetch(`${base}/command`, { method: 'POST', headers: { ...headers, Origin: 'https://foreign.example' }, body: '{}' })).status, 403);
assert.equal((await fetch(`${base}/command`, { method: 'POST', headers, body: JSON.stringify({ action: 'configure', target: 'REAL', value: { intensity: 99 } }) })).status, 400);
await command({ action: 'simulate', scenario: 'reset' });
const initial = await state();
assert.equal(initial.simulation.mode, 'Observe');
await command({ action: 'simulate', scenario: 'raid' });
assert.equal((await state()).simulation.active, undefined);
await command({ action: 'configure', target: 'SIMULATION', value: { mode: 'Auto', authorized: ['Hype', 'Raid Welcome', 'Suspense'] } });
await command({ action: 'simulate', scenario: 'warm' });
await command({ action: 'simulate', scenario: 'hype' });
let current = await state();
assert.equal(current.simulation.active.kind, 'Hype');
assert.equal(current.simOverlay.origin, 'SIMULATION');
assert.equal((await (await fetch(`${base}/overlay/state`)).json()).overlay, null);
await command({ action: 'restore', target: 'SIMULATION' });
current = await state();
assert.equal(current.simulation.paused, true);
assert.equal(current.simulation.active, undefined);
await command({ action: 'configure', target: 'SIMULATION', value: { paused: false, mode: 'Suggest' } });
await command({ action: 'simulate', scenario: 'raid' });
current = await state();
assert.equal(current.simulation.proposals.length, 1);
await command({ action: 'approve', target: 'SIMULATION', id: current.simulation.proposals[0].id });
assert.equal((await state()).simScene, 'Welcome');
await command({ action: 'simulate', scenario: 'manual' });
assert.equal((await state()).simScene, 'Manual scene');
await command({ action: 'configure', target: 'SIMULATION', value: { dnd: true } });
await command({ action: 'suspense', target: 'SIMULATION' });
assert.equal((await state()).simulation.history[0].reason, 'Blocked: Do Not Disturb is enabled');
await command({ action: 'simulate', scenario: 'reset' });
assert.equal((await state()).real.mode, initial.real.mode);
const overlayHtml = await (await fetch(`${base}/overlay`)).text();
assert.ok(overlayHtml.includes('lang="en"'));
const page = await fetch(origin);
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes('Scenquira') && html.includes('lang="en"'));
console.log('HTTP smoke passed: session/origin/CSRF boundary, validation, simulator sequences, approval, takeover, DND, overlay isolation, and English web page.');
