# The 15-Minute Hacker

> Can you survive 15 minutes of increasingly difficult computer challenges — using **only your keyboard**?

A keyboard-only browser game. You get a 15:00 countdown and have to crack as many "nodes" as possible: binary and hex conversions, Caesar ciphers, number patterns and logic gates. The better you do, the harder it gets.

Everything is fictional and runs locally in your browser. No real systems, no real hacking.


## Features

- **Keyboard only.** The mouse is deliberately disabled; every control is shown on screen.
- **5 challenge types** generated randomly, so no two runs are the same.
- **Difficulty tiers (1–5).** Every 4 correct answers the challenges get harder and worth more.
- **Score, streak multiplier (up to ×2), time penalties** for wrong answers and skips.
- **A log with explanations** after every answer, so you learn *why* an answer was right.
- **Best score** saved in your browser.

## Controls

| Where | Key | Action |
|---|---|---|
| Menus | `↑` `↓` / `W` `S` | Move |
| Menus | `Enter` / `Space` | Select |
| Menus | `1` `2` | Jump to item |
| Anywhere (not while answering) | `?` | Help |
| Challenge | type + `Enter` | Submit answer |
| Multiple choice | `1`–`4` or `↑` `↓` + `Enter` | Choose |
| Challenge | `Tab` | Skip (−20s) |
| Challenge | `Esc` | Pause |
| Paused | `Esc` / `Q` | Resume / end the run |
| Results | `Enter` / `Esc` | Play again / menu |

## Challenge types

| Type | Easy (tier 1) | Hard (tier 5) |
|---|---|---|
| Binary | `1011` → decimal | 10-bit numbers, both directions |
| Hex | `0xB` → decimal | 4-digit hex, both directions |
| Caesar cipher | one word, shift given | a phrase, shift unknown |
| Pattern lock | `+3` sequences | alternating add/double |
| Logic gate *(from tier 2)* | `1 AND 0` | `(101100 XOR 011010) OR 110001` |

## Scoring

- Correct answer: `100 × tier × streak multiplier`
- Streak multiplier: `1 + 0.1 × streak`, max `×2.0`
- Wrong answer: **−15 seconds**, streak resets
- Skip: **−20 seconds**, streak kept

## Run it locally

Requires [Node.js](https://nodejs.org) 20+.

```bash
npm install
npm run dev      # start at http://localhost:5173
npm test         # run the unit tests
npm run build    # production build in dist/
```

## How it works

### Project structure

```
src/
├── main.js         entry point: wires everything together
├── game.js         the single state object, setState(), and every game action
├── keyboard.js     the ONE keydown listener, one small handler per screen
├── rules.js        timer, points, streak, tiers, ranks (pure functions)
├── challenges.js   seeded random numbers + the 5 challenge generators
├── ui.js           turns the state into HTML for each screen
└── style.css
tests/
├── rules.test.js
└── challenges.test.js
```

### Data flow

```
key press → keyboard.js → game.js action → setState() → ui.js render() → screen updates
```

The UI never changes the state directly. Every change goes through a function in `game.js`, which makes bugs easy to trace.

### Design

The game looks like a terminal program, not a website: square panes with the title in the border, one accent color, inverted text for the current selection, a nano-style shortcut bar, a vim-style message line, `[ OK ]`/`[FAIL]` log lines like a boot log, and a help screen written like a `man` page.

### Keyboard input
There is exactly **one** `keydown` listener (on `window`). It picks a handler based on the current screen (`menuKeys`, `playingKeys`, ...). Each handler returns `true` if it used the key, and only then is `preventDefault()` called, so typing in the answer box still works. Ctrl/Cmd/Alt shortcuts are ignored so browser shortcuts keep working, and held-down Enter is ignored so an answer can't be submitted twice.

### Focus management
Rendering replaces the page's HTML, which destroys the focused element. After every render `moveFocus()` puts focus back into the answer box. Mouse clicks are blocked (`mousedown` → `preventDefault`) and show a message, so they can't steal focus either.

### Challenges
`challenges.js` lists every type with an `id`, a `minTier` and a `generate(tier, rng)` function that returns a plain object:

```js
{ type, title, prompt, data, hint, input: 'text' | 'choice', choices?, answer, explanation }
```

Answers are compared after `normalizeAnswer()` (lowercase, trim, strip `0x`/`0b` and leading zeros), so `0x1F`, `1f` and ` 1F ` all count as correct.

### Timer
The timer stores **when** the game ends (`endsAt`), not how many seconds are left. Time left is always `endsAt - Date.now()`, so it stays accurate even when the browser slows down background tabs. Pausing stores the remaining time; resuming creates a new `endsAt`. Only the timer text is updated every 250 ms, not the whole screen, so what you're typing is never lost.

### Difficulty
`tier = min(5, 1 + floor(solved / 4))`. Each generator uses the tier to pick bigger numbers, unknown cipher shifts or harder patterns. Logic gates only unlock at tier 2.

## Testing

- `npm test` generates thousands of challenges with fixed seeds and checks every answer is correct, plus tests for scoring, tiers, answer normalization and timer math.
- Manual test: a full game from menu to results without touching the mouse.

## Future ideas

- Regex and "spot the bug" challenge types
- Daily seeded run so friends can compare scores on the same challenges
- Sound effects

