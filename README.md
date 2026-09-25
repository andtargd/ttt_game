# Tic-Tac-Toe

A browser-based tic-tac-toe game written in plain HTML, CSS and JavaScript — no build step, no dependencies.

## Features

- **Two opponents:** play against a friend on the same device, or against the computer. The AI plays well (negamax with alpha-beta pruning) but occasionally makes a mistake.
- **Two game modes:**
  - **Classic** — the game ends on a win or when the board is full.
  - **Vanishing pieces** — each player can have only 3 pieces on the board; placing a new one removes that player's oldest piece. An optional highlight shows which piece will vanish next.
- Smooth animations, subtle sound effects with a volume control.
- Interface in Russian, English and Thai.

## Running locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
python -m http.server 8765
```

Then visit <http://localhost:8765>.

## Project structure

```
index.html      page markup
css/style.css   styles and animations
js/game.js      core game rules (board state, moves, win detection)
js/ai.js        computer opponent
js/sound.js     sound effects
js/i18n.js      translations
js/main.js      UI wiring
```
