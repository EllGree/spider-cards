# Spider

Spider solitaire in a single HTML file. No build step, no dependencies, no network.

**[Play it here](https://ellgree.github.io/spider-cards/)** — or download the file
and open it, which works just as well.

![The table mid-game](screenshot.webp)

## Play

Download `index.html` and double-click it. That is the whole installation
procedure — the file carries its own card artwork, so it works from a USB stick,
an e-mail attachment or a `file://` URL with nothing beside it.

(The file is named `index.html` rather than `spider.html` so that GitHub Pages
serves it at the address above. Rename it to anything you like once it is on your
disk; nothing inside depends on the name.)

## Rules

Two full decks, 104 cards, dealt into ten columns.

- **Take** a descending run of a *single* suit — `♠9 ♠8 ♠7` moves as one, `♠9 ♥8 ♠7`
  does not. This is the rule everyone trips over, including people who have played
  Klondike for years: there, suits alternate; here, taking needs one suit and
  putting ignores suit entirely.
- **Put** it on any card one rank higher, *suit ignored*, or into an empty column.
- **Deal** a row of ten from the stock — but only while every column has a card in
  it. This rule is the one people forget, and skipping it makes deals unwinnable.
- A complete `K → A` run of one suit leaves the table. Clear all eight and you win.

The suit picker chooses the difficulty: one suit is a gentle puzzle, four suits is
the real game. Start at one suit — every descending run is then a single suit by
definition, so runs always move and the rule above never gets in the way.

You do not have to hold any of this in your head, though. Pick a run up and every
column it may legally land in lights up; if nothing lights up, that run has
nowhere to go in this position. The **?** button draws the two rules above as
cards — the same amber and green the table uses, so it is a still frame of the
game rather than a diagram of it.

## Controls

Mouse and keyboard share one selection, so you can switch between them mid-move.

| Key | Does |
| --- | --- |
| `←` `→` | move across the columns, and onto the stock past the last one |
| `↑` `↓` | move up and down inside a column |
| `Enter` | pick up the run under the cursor, or put down what you are holding; on the stock, deal |
| `Esc` | drop what you are holding |
| `Space` | deal a row from the stock |
| `H` | hint — press again to walk through the ranked alternatives |
| `Ctrl`+`Z` | undo (all the way back to the deal) |
| `F2` | new game |
| `F1` | show this key map |

The **?** button in the toolbar shows the rules: the three things people get
wrong, drawn as cards in the table's own colours, with a line of text under each.
Words are allowed on that one sheet and nowhere else — two testers in a row read
the pictures alone and still guessed at the rule.

With a pointer: drag a run where it should go, or click once to pick it up and once
again to drop it. Double-click plays the best available move for that run.

## Reading the table

The interface has no words in it, so here is what the marks mean.

| Mark | Meaning |
| --- | --- |
| amber fill | the run you are holding |
| green fill, solid outline | the hint's suggested move |
| green fill, dashed outline | where it wants to go |
| violet fill | a legal move that gains you nothing |
| green dashed outline, faint fill | every column the run in your hand may go to |
| a card shaking its head | the move was refused, not lost |
| blue ring | where the keyboard cursor is |

The cloth and the light on the cards are drawn in CSS - an SVG turbulence
filter in a data URI for the nap of the baize, a multiplied gradient for the
sheen on the faces - so there is still nothing to fetch but the one file.

The hint ranks every legal move by a one-move heuristic and shows the best. At two
moments it looks further instead: when the best move would fill the last empty
column, and when no move on offer gains anything. Then it searches a few moves ahead
for a combination that leaves the table better off - a run parked in the empty column
so the card under it can move, a suit completed in three moves - and if it finds one,
the first move of that combination is the hint. It takes about a third of a second.

The hint button is also the state light: a bulb with a counter while moves exist, an
arrow-into-a-stack when the only thing left to do is deal, a crossed circle at a dead
end, a tick when the game is won. When the deal is waiting on an empty column, the
deal icon comes with the plug marked in violet: the run to park there so the stock
unlocks. It scores as a shuffle, and it is also the only way forward.

Both endings announce themselves without being asked. Winning covers the table with a
tick. Running out of moves covers it with a crossed circle and two ways on — undo,
because a dead end in spider is rarely the first wrong move, and a fresh deal. Tap the
background to put that away and look the position over.

## On phones

Landscape is the way to play it — ten columns across a portrait screen leaves the
cards barely legible — so held upright the game asks you to turn the device. That
prompt can always be tapped away, though, and then it plays in portrait, cramped:
some in-app browsers (Telegram's on iOS) never report a rotation and may not permit
one, and a prompt only a rotation can clear would be a dead end with the game
locked behind it. It also tries to go fullscreen and lock the orientation on first
tap; browsers that refuse (iOS Safari has no orientation lock at all) simply keep
the prompt. Pull-to-refresh,
double-tap zoom and the long-press menu are all turned off, because every one of
them fires on gestures this game needs.

## How it is built

One file, on purpose. About 580 KB of it is the card artwork, inlined as
percent-encoded `data:` URIs in a generated `<style id="deck">` block — that is the
price of a game you can send to someone as a single attachment, and it seemed worth
paying. The hand-written part is the ~150 lines of CSS above it and ~950 lines of
JavaScript below.

The stock keeps a lane of clear width on the right, but only while a column can
actually grow down beside it — held upright, the columns finish near the top and
the stock sits alone at the bottom, so the lane is dropped and the cards get the
width instead.

The layout has one hard promise: **the table always fits the window.** No scrolling,
no column running off the bottom edge, whatever the deal and whatever the window
size. A single function, `fit()`, is allowed two dials and pulls them in order —
first it squeezes the cascade steps down to a readable floor, and only then does it
shrink the card itself. Steps go first because a tighter step costs nothing but the
blank middle of a card, while a smaller card costs the artwork.

State lives in one object that the DOM is drawn from and never read back into, which
is what makes undo a snapshot instead of an inverse operation per move type.

Cards move by FLIP: since every render throws the board away and builds a new one,
each card carries an id from the deal, and the animation measures where each id was,
lets the rebuild happen, measures again, and plays the difference. Only transforms
are animated, never layout. `prefers-reduced-motion` turns the whole thing off.

## Credits

Card faces and backs are the **SVG playing cards by Adrian Kennard (RevK)**, released
into the public domain under CC0 — <https://www.me.uk/cards>, source at
<https://codeberg.org/RevK/SVG-playing-cards>. The author asks for no credit and
requires none; this note is here because the deck deserves it. The link he embeds in
the ace of spades has been removed from this copy, which CC0 permits.

Everything else — the icons included — is drawn for this project.

## Licence

MIT, see [LICENSE](LICENSE). The bundled card deck is public domain and is
credited separately in [NOTICE](NOTICE).
