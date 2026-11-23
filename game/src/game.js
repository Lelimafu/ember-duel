// Ember Duel — state machine and round resolution. Pure logic: safe to import in
// Node tests (no DOM, no canvas, no audio). The renderer reads this state only.
import { CONFIG } from './config.js';
import { compareCards, createDeckState, deckSize, drawFromDeck, effectivePower } from './deck.js';
import { chooseCard } from './ai.js';
import { makeRng } from './random.js';

export function createGame(seed = 1) {
  const rng = makeRng(seed);
  const deckState = createDeckState(rng);
  const game = {
    seed,
    rng,
    deckState,
    phase: 'title', // title | play | reveal | roundEnd | win | loss
    round: 1,
    wins: { player: 0, ai: 0 },
    player: { name: 'Asha', title: 'the Ember Mage', hp: CONFIG.maxHp, hand: [], shield: false },
    ai: { name: 'Bram', title: 'the Tidecaller', hp: CONFIG.maxHp, hand: [], shield: false },
    played: { player: null, ai: null },
    lastResult: null, // { winner, damage, blocked, healed, clash, text }
    log: [],
    revealAt: 0,
    message: '',
  };
  for (let i = 0; i < CONFIG.handSize; i += 1) {
    game.player.hand.push(drawFromDeck(deckState, rng));
    game.ai.hand.push(drawFromDeck(deckState, rng));
  }
  game.log.push('The duel begins. Asha vs Bram — first to 0 HP loses.');
  return game;
}

export function pushLog(game, text) {
  game.log.push(text);
  if (game.log.length > 6) game.log.shift();
}

function drawUp(game, side) {
  const hand = game[side].hand;
  while (hand.length < CONFIG.handSize) {
    const card = drawFromDeck(game.deckState, game.rng);
    if (!card) break;
    hand.push(card);
  }
}

function applyDamage(game, targetSide, amount) {
  const target = game[targetSide];
  if (target.shield) {
    target.shield = false;
    return { blocked: true, damage: 0 };
  }
  target.hp = Math.max(0, target.hp - amount);
  return { blocked: false, damage: amount };
}

function applyHeal(game, side, amount) {
  const target = game[side];
  const healed = Math.min(amount, CONFIG.maxHp - target.hp);
  target.hp += healed;
  return healed;
}

// Play one round. playerIndex is the index into the player's hand.
// Returns the result object, or null if the play was illegal.
export function playRound(game, playerIndex) {
  if (game.phase !== 'play') return null;
  if (playerIndex < 0 || playerIndex >= game.player.hand.length) return null;

  const playerCard = game.player.hand.splice(playerIndex, 1)[0];
  const aiIndex = chooseCard(game.ai.hand, game.ai.hp, game.player.hp, game.rng);
  const aiCard = game.ai.hand.splice(aiIndex, 1)[0];
  game.played = { player: playerCard, ai: aiCard };
  game.phase = 'reveal';
  game.revealAt = Date.now();

  // Shield cards grant their shield the moment they are played.
  if (playerCard.effect === 'shield') game.player.shield = true;
  if (aiCard.effect === 'shield') game.ai.shield = true;

  const outcome = compareCards(playerCard, aiCard);
  let result;
  if (outcome === 'clash') {
    result = {
      winner: null, clash: true, damage: 0, blocked: false, healed: 0,
      text: `CLASH! ${playerCard.name} (${effectivePower(playerCard)}) meets ${aiCard.name} (${effectivePower(aiCard)}) — no damage. Both draw a card.`,
    };
  } else {
    const winnerSide = outcome;
    const loserSide = outcome === 'player' ? 'ai' : 'player';
    const winnerCard = game.played[winnerSide];
    const winnerName = game[winnerSide].name;
    const loserName = game[loserSide].name;
    if (winnerCard.effect === 'heal') {
      const healed = applyHeal(game, winnerSide, CONFIG.healAmount);
      result = {
        winner: winnerSide, clash: false, damage: 0, blocked: false, healed,
        text: `${winnerName}'s ${winnerCard.name} wins the round and heals +${healed} HP instead of dealing damage.`,
      };
    } else {
      const power = effectivePower(winnerCard);
      const dealt = applyDamage(game, loserSide, Math.max(1, power));
      result = {
        winner: winnerSide, clash: false, damage: dealt.damage, blocked: dealt.blocked, healed: 0,
        text: dealt.blocked
          ? `${winnerName}'s ${winnerCard.name} (${power}) wins — but ${loserName}'s Shield blocks the damage!`
          : `${winnerName}'s ${winnerCard.name} (${power}) wins the round and deals ${dealt.damage} damage to ${loserName}.`,
      };
    }
    game.wins[winnerSide] += 1;
  }

  game.lastResult = result;
  pushLog(game, `Round ${game.round}: ${result.text}`);
  game.deckState.discard.push(playerCard, aiCard);

  // Draw back up; a clash grants one extra card to each side.
  drawUp(game, 'player');
  drawUp(game, 'ai');
  if (outcome === 'clash') {
    for (const side of ['player', 'ai']) {
      const extra = drawFromDeck(game.deckState, game.rng);
      if (extra) game[side].hand.push(extra);
    }
  }
  return result;
}

// Advance after the reveal has been shown. Returns the new phase.
export function advanceAfterReveal(game) {
  if (game.phase !== 'reveal' && game.phase !== 'roundEnd') return game.phase;
  if (game.player.hp <= 0 || game.ai.hp <= 0) {
    game.phase = game.ai.hp <= 0 && game.player.hp > 0 ? 'win' : 'loss';
    if (game.player.hp <= 0 && game.ai.hp <= 0) game.phase = 'loss';
    pushLog(game, game.phase === 'win'
      ? 'Asha wins the duel! The embers prevail.'
      : 'Bram wins the duel. The tide takes the embers.');
    game.played = { player: null, ai: null };
    return game.phase;
  }
  if (game.round >= CONFIG.maxRounds) {
    game.phase = game.player.hp >= game.ai.hp ? 'win' : 'loss';
    game.played = { player: null, ai: null };
    return game.phase;
  }
  game.round += 1;
  game.played = { player: null, ai: null };
  game.phase = 'play';
  return game.phase;
}

export function startGame(game) {
  game.phase = 'play';
  game.message = '';
}

export function restartGame(game) {
  const fresh = createGame(game.seed);
  // Keep the same object identity so the renderer keeps its reference.
  for (const key of Object.keys(fresh)) game[key] = fresh[key];
  game.phase = 'play';
}

export function deckCount(game) {
  return deckSize(game.deckState);
}
