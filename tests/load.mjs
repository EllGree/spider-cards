// Loads the game's pure logic - sections 1 to 4 of index.html (model, rules,
// moves, scoring) - into a sandbox, so it can be tested without a browser.
// The game stays one self-contained file; this only reads it.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// With `auto`, the demonstration (the held bulb: autoStep() and the search
// behind it) comes along too, with its timer and the DOM stubbed out; run it
// with runAuto().
export function loadGame(path = new URL('../index.html', import.meta.url), {auto = false} = {}){
  const html = readFileSync(path, 'utf8');
  const from = html.lastIndexOf('/*', html.indexOf('1. MODEL'));
  const to = html.lastIndexOf('/*', html.indexOf('5. ICONS'));
  if (from < 0 || to <= from) throw new Error('section markers not found in index.html');
  let code = html.slice(from, to);
  if (auto){
    const a = html.indexOf('/* ── Hold the bulb'), b = html.indexOf("$hint.addEventListener('pointerdown'");
    if (a < 0 || b <= a) throw new Error('autoplay markers not found in index.html');
    code += html.slice(a, b);
  }
  code += `
    ;({
      get state(){ return state; }, set state(s){ state = s; },
      get history(){ return history; }, set history(h){ history = h; },
      get serial(){ return serial; }, set serial(v){ serial = v; },
      get lastMove(){ return lastMove; }, set lastMove(m){ lastMove = m; },
      fns: (n) => eval(n),
      set: (n, v) => eval(n + ' = v'),
    })`;
  const classes = new Set();
  const ctx = {
    structuredClone, Math: Object.create(Math), console,
    // dealStock() notes where the stock sits for the animation; nothing to animate here
    $stock: {getBoundingClientRect: () => ({left: 0, top: 0})}, spawnAt: null,
    // the demonstration's surroundings: one pending tick instead of a timer
    render(){}, clearMarks(){}, pending: null, performance,
    setTimeout(f){ ctx.pending = f; return 1; }, clearTimeout(){ ctx.pending = null; },
    $hint: {classList: {add: c => classes.add(c), remove: c => classes.delete(c),
                        contains: c => classes.has(c)}},
  };
  vm.createContext(ctx);
  const api = vm.runInContext(code, ctx);
  api.ctx = ctx;
  return api;
}

/** Holds the bulb: autoStart(), then every tick it schedules, until it stops
    or `ticks` run out. Returns how many ticks changed the position (moves,
    deals and the undos of a retreat alike). */
export function runAuto(api, ticks = 1e6){
  api.fns('autoStart')();
  let n = 0;
  while (api.ctx.pending && ticks-- > 0){
    const f = api.ctx.pending, s = api.serial;
    api.ctx.pending = null;
    f();
    if (api.serial !== s) n++;
  }
  return n;
}

/** A position from the text format bug reports use: one line per column,
    "3: (5S) (4H) QS JS TH", face-down cards in brackets, T for ten. The stock
    is empty and the collected suits are whatever the table is missing. */
export function position(text, suits = 2){
  const tableau = Array.from({length: 10}, () => []);
  for (const line of text.split('\n')){
    const m = line.match(/^\s*(\d)\s*:(.*)$/);
    if (m) tableau[+m[1]] = cards(m[2].replace(/\((\w+)\)/g, '-$1'));
  }
  const count = [0, 0, 0, 0];
  for (const p of tableau) for (const c of p) count[c.s]++;
  const done = [];
  for (let s = 0; s < suits; s++)
    for (let k = 0; k < (104 / suits - count[s]) / 13; k++) done.push(s);
  return {suits, tableau, stock: [], done};
}

/** A deterministic Math.random for the sandbox (mulberry32). */
export function seed(api, n){
  let a = n >>> 0;
  api.ctx.Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cards from a compact notation: '9H 8H 7H' -> face-up cards; a leading '-'
    makes a card face-down. Ranks A 2..9 T J Q K, suits S H D C. */
let uid = 0;   // ids must be unique across columns: the anti ping-pong rule tracks them
export function cards(spec){
  const R = {A: 1, T: 10, J: 11, Q: 12, K: 13};
  const S = {S: 0, H: 1, D: 2, C: 3};
  return spec.trim().split(/\s+/).filter(Boolean).map(t => {
    const up = !t.startsWith('-');
    const s = t.replace(/^-/, '');
    const r = R[s[0]] ?? +s.slice(0, -1);
    return {r, s: S[s.at(-1)], up, id: 't' + (++uid) + s};
  });
}
