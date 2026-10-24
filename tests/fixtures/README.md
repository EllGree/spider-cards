# Fixtures for the autopilot

Positions from reported games, in the text format `position()` in `../load.mjs`
reads (and `loadPosition()` in the page console): one line per column, face-down
cards in brackets, T for ten.

- `stall-collect-spades.txt` - where the autopilot stopped.
- `wander-three-empty.txt` - later in the same game; the autopilot wanders.
- `game-2026-10-24.json` - the whole game up to the second position, one
  snapshot per move (`[...history, state]` from the page): `done`, `stock`
  rows and `cols`, each as text in the same notation.

## The line a human played

From near the stall (snapshot 99) to spades home is 16 moves, and until the
last one almost none of them raises `worth()` - which is why a forward search
with a horizon of six cannot see it at any budget:

1. 100-104: the hearts in pieces go onto 9H in one column; a column empties.
2. 105-108: JH onto QH, QH JH onto KH; QS..5S onto KS, and KS..5S into the
   empty column.
3. 109-115: QH off, a second column empties. Column 6 (4S 3S 2S AH KH 2H JS)
   is taken apart piece by piece, each to its place; 4S 3S 2S onto 5S, and
   spades go home.
4. 116-126: the same for hearts, QH..7H onto KH, hearts go home.

The player works from the goal: spades K..5 are nearly together, 4-3-2-A sit
under four cards in column 6, so each of those four needs a place - a card
one rank up, or an empty column. That is the first pattern to try: "collect
a suit" as a goal, with its blockers and their destinations, searched over
goals rather than moves.
