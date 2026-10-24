// Win rate of "always play the top hint", the policy the scoring comments
// were measured with. Not a test - run it before and after touching
// scoreMove() and compare:  node tests/measure.mjs [suits] [games] [file]
import {loadGame, seed} from './load.mjs';

const suits = +(process.argv[2] ?? 1), games = +(process.argv[3] ?? 300);
const g = loadGame(process.argv[4]);
const [deal, findHints, move, dealStock, canDealStock] =
  ['deal', 'findHints', 'move', 'dealStock', 'canDealStock'].map(n => g.fns(n));
const key = () => g.state.done.length + '|' + g.state.stock.length + '|' +
  g.state.tableau.map(p => p.map(c => (c.up ? '' : '-') + c.r + ':' + c.s).join(',')).join('/');

let won = 0, suitsDone = 0, moves = 0;
for (let n = 0; n < games; n++){
  seed(g, 1000 + n);
  g.state = deal(suits); g.history = [];
  const seen = new Set([key()]);
  for (let step = 0; step < 800 && g.state.done.length < 8; step++){
    const snap = structuredClone(g.state);
    let next = null;
    for (const x of findHints()){
      move(x.from, x.idx, x.to);
      const fresh = !seen.has(key());
      g.state = structuredClone(snap); g.history.pop();
      if (fresh){ next = x; break; }
    }
    if (next && next.total > 0) move(next.from, next.idx, next.to);
    else if (canDealStock(g.state)) dealStock();
    else if (next) move(next.from, next.idx, next.to);
    else break;
    seen.add(key()); moves++;
  }
  suitsDone += g.state.done.length;
  if (g.state.done.length === 8) won++;
}
console.log(`${suits} suit(s), ${games} games: won ${(100 * won / games).toFixed(1)}%, ` +
  `${(suitsDone / games).toFixed(2)} suits/game, ${(moves / games).toFixed(0)} moves/game`);
