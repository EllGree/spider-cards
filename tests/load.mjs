// Loads the game's pure logic - sections 1 to 4 of index.html (model, rules,
// moves, scoring) - into a sandbox, so it can be tested without a browser.
// The game stays one self-contained file; this only reads it.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

export function loadGame(path = new URL('../index.html', import.meta.url)){
  const html = readFileSync(path, 'utf8');
  const from = html.lastIndexOf('/*', html.indexOf('1. MODEL'));
  const to = html.lastIndexOf('/*', html.indexOf('5. ICONS'));
  if (from < 0 || to <= from) throw new Error('section markers not found in index.html');
  const code = html.slice(from, to) + `
    ;({
      get state(){ return state; }, set state(s){ state = s; },
      get history(){ return history; }, set history(h){ history = h; },
      get serial(){ return serial; }, set serial(v){ serial = v; },
      get lastMove(){ return lastMove; }, set lastMove(m){ lastMove = m; },
      fns: (n) => eval(n),
    })`;
  const ctx = {
    structuredClone, Math: Object.create(Math), console,
    // dealStock() notes where the stock sits for the animation; nothing to animate here
    $stock: {getBoundingClientRect: () => ({left: 0, top: 0})}, spawnAt: null,
  };
  vm.createContext(ctx);
  const api = vm.runInContext(code, ctx);
  api.ctx = ctx;
  return api;
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
