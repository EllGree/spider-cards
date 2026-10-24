// Auto-move target choice and the single click.  Run:  node --test tests/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadGame, cards} from './load.mjs';

const g = loadGame();
const [clickTarget, scoreMove, isClickGesture, move, findHints] =
  ['clickTarget', 'scoreMove', 'isClickGesture', 'move', 'findHints'].map(n => g.fns(n));

/** A table from ten column specs, 1-based in the comments as in the bug report.
    Unlisted columns get a lone king of clubs: nothing goes onto it and it goes
    nowhere useful, so it stays out of the way. */
function table(cols){
  const tableau = Array.from({length: 10}, (_, i) =>
    cards(cols[i] ?? '-KC KC'));
  return {suits: 4, tableau, stock: [], done: []};
}
const at = (st, p, rank) => st.tableau[p].findIndex(c => c.up && c.r === rank);

function setup(st){ g.state = st; g.history = []; g.lastMove = null; }

// Columns 4, 8, 10 of the report (indices 3, 7, 9).
const repro = () => table({
  3: '-KD JD TS 9S 8S',
  7: '-KD JD TS 9H 8H',
  9: '-KD 9H 8H 7H 6H 5H',
});

test('repro: 7H-6H-5H goes onto 8H (col 8), not onto 8S (col 4)', () => {
  const st = repro();
  assert.equal(clickTarget(st, 9, at(st, 9, 7), null), 7);
  // the off-suit target takes the hearts apart: ranked out entirely
  assert.equal(scoreMove(st, 9, at(st, 9, 7), 3), null);
  assert.ok(scoreMove(st, 9, at(st, 9, 7), 7) > 0);
});

test('the hint ranks the same: col 8 above col 4 for the same run', () => {
  setup(repro());
  const runs = findHints().filter(h => h.from === 9 && h.idx === at(g.state, 9, 7));
  assert.equal(runs[0].to, 7);
  assert.ok(!runs.some(h => h.to === 3));
});

test('ping-pong: after the move, clicking 7H again does nothing', () => {
  setup(repro());
  const i = at(g.state, 9, 7);
  assert.ok(move(9, i, 7));
  const back = at(g.state, 7, 7);
  // without the guard the way back scores exactly the same, so it would bounce
  assert.ok(scoreMove(g.state, 7, back, 9) > 0);
  assert.equal(clickTarget(g.state, 7, back, g.lastMove), null);
});

test('empty column vs off-suit target: the occupied column wins', () => {
  const st = table({0: '-KC 7H', 1: '-KD 8S', 2: ''});
  assert.equal(clickTarget(st, 0, 1, null), 1);
});

test('source break vs no break: the move that keeps the suited join wins', () => {
  // 7H sits on 8H. Col 2 offers 8S (breaks it), col 3 offers 8H on 9H (keeps it).
  const st = table({0: '-KC 8H 7H', 2: '-KD 8S', 3: '-KD TH 9H 8H'});
  assert.equal(clickTarget(st, 0, 2, null), 3);
  assert.equal(scoreMove(st, 0, 2, 2), null);
});

test('a break is never played by click, even when it is the only legal move', () => {
  const st = table({0: '-KC 8H 7H', 2: '-KD 8S'});
  assert.equal(clickTarget(st, 0, 2, null), null);
});

test('set-up: J-10-9 of spades into the empty column frees the 6 for 5-4-3', () => {
  // From a reported game: the move costs on its own, the follow-up pays more
  const st = table({0: '-KD 6S JS TS 9S', 3: '', 7: '', 8: '5S 4S 3S'});
  assert.ok(scoreMove(st, 0, 2, 3) < 0);
  assert.equal(clickTarget(st, 0, 2, null), 3);         // the nearer empty column
});

test('set-up: 8H off 8S into the empty column lets 8S onto 9S', () => {
  const st = table({0: '-KD 6S JS TS 9S', 3: '', 7: '', 9: '-KD JH TH 9H 8S 8H'});
  assert.equal(clickTarget(st, 9, 5, null), 7);
});

test('a set-up needs its own follow-up: a good move elsewhere does not count', () => {
  // 8S onto 9S in cols 1/2 is a fine move, but parking 7H does not enable it
  const st = table({0: '-KC 2C 7H', 1: '-KD 9S', 2: '8S', 3: ''});
  assert.equal(clickTarget(st, 0, 2, null), null);
});

test('a move that gains nothing is not played by click', () => {
  // 7H off a lone face-up 2C onto 8S: no join, no reveal, no column freed
  const st = table({0: '-KC 2C 7H', 1: '-KD 8S'});
  assert.ok(scoreMove(st, 0, 2, 1) <= 0);
  assert.equal(clickTarget(st, 0, 2, null), null);
});

test('longest own-suit run wins over the nearer column, even past the cap', () => {
  // 7H on a face-down card; 8H ends a run of five in col 6 and a run of
  // seven in col 1 - both past the four the main score counts, and col 6 is
  // nearer. The longer run must still win.
  const st = table({4: '-KC 7H', 5: '-KD QH JH TH 9H 8H', 0: '-KD AC KH QH JH TH 9H 8H'});
  assert.equal(clickTarget(st, 4, 1, null), 0);
});

test('ties: nearest column first, then the leftmost', () => {
  // 7H on a face-down card; 8S in columns 2, 6 and 8 - all score the same
  const st = table({4: '-KC 7H', 1: '-KD 8S', 5: '-KD 8S', 7: '-KD 8S'});
  assert.equal(clickTarget(st, 4, 1, null), 5);
  const st2 = table({4: '-KC 7H', 2: '-KD 8S', 6: '-KD 8S'});
  assert.equal(clickTarget(st2, 4, 1, null), 2);
});

test('scoreMove is pure: it reads the position it is given, not the live one', () => {
  setup(table({}));
  const st = repro();
  assert.ok(scoreMove(st, 9, at(st, 9, 7), 7) > 0);
});

test('click vs drag: under 5 px is a click, 5 px and more is a drag', () => {
  assert.equal(isClickGesture(0, 0), true);
  assert.equal(isClickGesture(3, 3), true);      // 4.24 px
  assert.equal(isClickGesture(0, 4.9), true);
  assert.equal(isClickGesture(3, 4), false);     // 5 px
  assert.equal(isClickGesture(40, 0), false);
});
