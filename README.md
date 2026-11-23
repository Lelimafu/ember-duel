# 🔥 Ember Duel

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Lelimafu/ember-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Lelimafu/ember-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

An original 1-vs-1 card battler built for the [make.fun "Make the best card game" bounty](https://make.fun/bounty/best-card-game-20261122-1826). Two rival spark-mages duel with a 36-card deck of Ember, Tide and Thorn cards. No clones, no external assets — every card, sound and pixel is drawn or synthesised in code.

## The duel

**Asha, the Ember Mage** (you) vs **Bram, the Tidecaller** (AI). Both start at **30 HP**. First to 0 HP loses.

- Each side holds **5 cards** and draws 1 per round from a shared **36-card deck**.
- Every card has an **element** (Ember / Tide / Thorn) and a **power 1–9**. Some cards carry an effect:
  - **Heal** — heals its owner +4 HP instead of dealing damage when it wins the round.
  - **Shield** — blocks the next damage dealt to its owner, then is consumed.
  - **Surge** — power is doubled this round.
- Each round you play 1 card and Bram plays 1, then both are revealed at once:
  - **Element advantage wins regardless of power**: Ember beats Thorn, Thorn beats Tide, Tide beats Ember.
  - Same element → higher power wins.
  - Exact tie → **clash**: no damage, both draw a card.
- The winner deals damage equal to its card's power (minimum 1). A Shield on the loser blocks it.

## How to play

- **Mouse:** click a card in your hand to play it; click buttons to start, continue, restart, mute.
- **Keyboard:** `1–5` play a card, `Enter`/`Space` start or continue, `R` restart, `M` mute.
- The table shows your hand (bottom), Bram's hand (top, face-down until reveal), the played cards in the centre, HP bars, round counter, rounds-won score and a round log. Win and loss screens offer a restart.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network requests. Desktop browser, static files under `game/` with `game/index.html` as the entry point.

Staged, reproducible screenshots via URL params:

```
?shot=title&seed=1   ?shot=play&seed=1   ?shot=win&seed=1   ?shot=loss&seed=1
```

## Files

- `game/index.html` — entry point; `game/src/` split by job: `config.js`, `random.js` (mulberry32 seeded RNG), `deck.js` (cards/deck), `ai.js` (opponent logic), `game.js` (state machine), `render.js` (canvas), `audio.js` (WebAudio synth), `shots.js` (staged scenes), `main.js` (boot/loop).
- `main.ts` — hand-in program: copies `game/` + `screenshots/` to the output dir and writes `dossier.json`.
- `serve.ts` — tiny static server for local play.
- `shots.json` — the 4 staged screenshots; `screenshots/` holds the 1280×720 JPGs.
- `LICENSE` — MIT.

## Sounds

Small WebAudio synth effects (play, reveal, hit, heal, clash, win/loss). Press `M` to mute.
