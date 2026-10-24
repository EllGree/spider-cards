// Win rate of the demonstration itself - the held bulb, autoStep() with its
// search and retreats - on seeded deals. The yardstick for changes to the
// autopilot's policy, as measure.mjs is for the move scoring:
//   node tests/autoplay.mjs [suits] [games] [first seed] [file]
import {loadGame, seed, runAuto} from './load.mjs';

const suits = +(process.argv[2] ?? 2), games = +(process.argv[3] ?? 50);
const first = +(process.argv[4] ?? 1000);
const g = loadGame(process.argv[5], {auto: true});
const deal = g.fns('deal');

let won = 0, suitsDone = 0, moves = 0, most = 0, slowest = 0;
const t0 = Date.now();
for (let n = 0; n < games; n++){
  seed(g, first + n);
  g.state = deal(suits); g.history = []; g.lastMove = null;
  const t = Date.now();
  const m = runAuto(g);
  slowest = Math.max(slowest, Date.now() - t);
  moves += m; most = Math.max(most, m);
  suitsDone += g.state.done.length;
  if (g.state.done.length === 8) won++;
}
console.log(`${suits} suit(s), ${games} games from seed ${first}: won ${(100 * won / games).toFixed(1)}%, ` +
  `${(suitsDone / games).toFixed(2)} suits/game, ${(moves / games).toFixed(0)} moves/game, ` +
  `longest ${most} moves, slowest game ${(slowest / 1000).toFixed(1)} s, ${((Date.now() - t0) / 1000).toFixed(0)} s in all`);
