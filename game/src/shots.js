// Staged scenes for reproducible screenshots (?shot=title|play|win|loss&seed=1).
// Each scene builds a fresh seeded game and then poses it deterministically, so
// the same URL always renders the same frame. No timers advance staged scenes.
import { CONFIG } from './config.js';
import { createGame, pushLog } from './game.js';

export const SHOTS = ['title', 'play', 'win', 'loss'];

export function applyShot(game, shot, seed) {
  const fresh = createGame(seed);
  for (const key of Object.keys(fresh)) game[key] = fresh[key];

  if (shot === 'title') {
    game.phase = 'title';
    return game;
  }
  if (shot === 'play') {
    game.phase = 'play';
    game.round = 4;
    game.wins = { player: 2, ai: 1 };
    game.player.hp = 24;
    game.ai.hp = 19;
    game.log = [];
    pushLog(game, 'Round 1: Asha\'s Blaze (5) wins the round and deals 5 damage to Bram.');
    pushLog(game, 'Round 2: Bram\'s Maelstrom (7) wins the round and deals 7 damage to Asha.');
    pushLog(game, 'Round 3: Asha\'s Sunburst Surge (18) wins the round and deals 18 damage to Bram.');
    pushLog(game, 'Round 4: your move — pick a card.');
    return game;
  }
  if (shot === 'win') {
    game.phase = 'win';
    game.round = 8;
    game.wins = { player: 5, ai: 2 };
    game.player.hp = 12;
    game.ai.hp = 0;
    game.log = [];
    pushLog(game, 'Round 8: Asha\'s Inferno (6) wins the round and deals 6 damage to Bram.');
    pushLog(game, 'Asha wins the duel! The embers prevail.');
    return game;
  }
  if (shot === 'loss') {
    game.phase = 'loss';
    game.round = 7;
    game.wins = { player: 2, ai: 4 };
    game.player.hp = 0;
    game.ai.hp = 9;
    game.log = [];
    pushLog(game, 'Round 7: Bram\'s Deluge (8) wins the round and deals 8 damage to Asha.');
    pushLog(game, 'Bram wins the duel. The tide takes the embers.');
    return game;
  }
  game.phase = 'title';
  return game;
}

export { CONFIG };
