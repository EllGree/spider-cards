// The demonstration's decisions, on reported positions.  Run:  node --test tests/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadGame, position} from './load.mjs';
import {REPRO} from './repro.mjs';

test('stalled with every hint already seen, it searches harder instead of stopping', () => {
  const g = loadGame(undefined, {auto: true});
  const f = n => g.fns(n);
  g.state = position(REPRO); g.history = []; g.lastMove = null;
  assert.equal(g.state.done.length, 3);
  f('autoStart')();

  // As it was in the reported game: all three hints lead somewhere it has
  // been, and the table has been worth more than it is now.
  const seen = f('autoSeen'), snap = structuredClone(g.state);
  for (const x of f('findHints')()){
    f('applyMove')(x.from, x.idx, x.to);
    seen.add(f('posHash')());
    g.state = structuredClone(snap);
  }
  g.set('autoBest', 2877);

  // It thinks in slices until it has a plan, then plays the plan out. At
  // every pause the real table is in place, so a render() in between draws
  // the game and not a position deep in the search.
  const tick = () => { const t = g.ctx.pending; g.ctx.pending = null; t(); };
  const before = JSON.stringify(g.state), serial = g.serial;
  let pauses = 0;
  tick();
  while (g.ctx.pending && !f('autoQueue').length){
    assert.equal(JSON.stringify(g.state), before);
    assert.equal(g.serial, serial);
    pauses++;
    tick();
  }
  assert.ok(pauses > 10, `thought in one piece (${pauses} pauses)`);
  assert.ok(g.ctx.pending, 'the autopilot stopped');
  while (f('autoQueue').length) tick();

  const empties = g.state.tableau.filter(p => !p.length).length;
  assert.ok(empties >= 2, `expected two empty columns, got ${empties}`);
  assert.ok(f('worth')() > 2877);
  assert.ok(g.ctx.pending, 'the autopilot stopped after the plan');
});
