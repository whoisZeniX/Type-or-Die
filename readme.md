# Type-or-Die

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

### Keyboard input
There is exactly **one** `keydown` listener (on `window`). It picks a handler based on the current screen (`menuKeys`, `playingKeys`, ...). Each handler returns `true` if it used the key, and only then is `preventDefault()` called, so typing in the answer box still works. Ctrl/Cmd/Alt shortcuts are ignored so browser shortcuts keep working, and held-down Enter is ignored so an answer can't be submitted twice.

