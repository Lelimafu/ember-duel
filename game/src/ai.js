// Opponent logic for Bram, the Tidecaller. Pure logic: safe to import in Node tests.
// Bram scores every card in his hand by expected value against a uniform random
// opposing card (all 3 elements, powers 1-9), then plays the best, with small
// seeded jitter so he is not perfectly predictable. Always returns a legal card.
import { ELEMENTS, ELEMENT_BEATS } from './config.js';
import { effectivePower } from './deck.js';

function winChance(card, oppElement, oppPower) {
  if (ELEMENT_BEATS[card.element] === oppElement) return 1;
  if (ELEMENT_BEATS[oppElement] === card.element) return 0;
  const p = effectivePower(card);
  if (p > oppPower) return 1;
  if (p < oppPower) return 0;
  return 0.5; // clash
}

export function scoreCard(card, ownHp, oppHp) {
  let expected = 0;
  for (const el of ELEMENTS) {
    for (let power = 1; power <= 9; power += 1) {
      const w = winChance(card, el, power);
      // Expected damage dealt minus expected damage taken.
      expected += w * effectivePower(card) - (1 - w) * power;
    }
  }
  expected /= 27;
  // Desperation: heal when hurt, shield when hurt.
  if (card.effect === 'heal' && ownHp <= 14) expected += 6;
  if (card.effect === 'heal' && ownHp <= 22) expected += 2;
  if (card.effect === 'shield' && ownHp <= 14) expected += 5;
  if (card.effect === 'shield' && ownHp <= 22) expected += 1.5;
  // Surge cards are worth a little extra: they swing the round.
  if (card.effect === 'surge') expected += 1;
  // Finishing instinct: a card that can end the duel now is priceless.
  if (card.effect !== 'heal' && effectivePower(card) >= oppHp) expected += 50;
  return expected;
}

export function chooseCard(hand, ownHp, oppHp, rng) {
  if (!hand || hand.length === 0) return -1;
  let bestIndex = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < hand.length; i += 1) {
    const score = scoreCard(hand[i], ownHp, oppHp) + rng.next() * 1.5;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}
