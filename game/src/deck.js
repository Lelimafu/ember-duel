// Deck construction and card rules. Pure logic: safe to import in Node tests.
// A 36-card deck: for each of the 3 elements, powers 1-9 (27 plain cards) plus one
// Heal, one Shield and one Surge card per element (9 effect cards). Every card unique.
import { CONFIG, ELEMENTS, ELEMENT_BEATS } from './config.js';

const FLAVOR = {
  Ember: ['Spark', 'Kindle', 'Cinder', 'Flare', 'Blaze', 'Inferno', 'Wildfire', 'Pyre', 'Sunburst'],
  Tide: ['Droplet', 'Ripple', 'Stream', 'Current', 'Wave', 'Surge Tide', 'Maelstrom', 'Deluge', 'Tsunami'],
  Thorn: ['Seedling', 'Bramble', 'Vine', 'Thistle', 'Briar', 'Nettle', 'Rootbind', 'Thornstorm', 'Overgrowth'],
};

const EFFECT_POWER = { heal: 5, shield: 4, surge: 6 };

export function makeCard(element, power, effect = null) {
  const name = effect
    ? `${FLAVOR[element][power - 1]} ${effect[0].toUpperCase() + effect.slice(1)}`
    : FLAVOR[element][power - 1];
  return {
    id: `${element}-${power}${effect ? `-${effect}` : ''}`,
    element,
    power,
    effect,
    name,
  };
}

export function buildDeck() {
  const cards = [];
  for (const element of ELEMENTS) {
    for (let power = 1; power <= 9; power += 1) {
      cards.push(makeCard(element, power, null));
    }
    for (const effect of ['heal', 'shield', 'surge']) {
      cards.push(makeCard(element, EFFECT_POWER[effect], effect));
    }
  }
  return cards;
}

// Element advantage: returns 1 if a beats b, -1 if b beats a, 0 if same element.
export function elementAdvantage(a, b) {
  if (a === b) return 0;
  return ELEMENT_BEATS[a] === b ? 1 : -1;
}

export function effectivePower(card) {
  return card.effect === 'surge' ? card.power * 2 : card.power;
}

// Compare two played cards. Returns 'player' | 'ai' | 'clash'.
// Element advantage wins regardless of power; same element -> higher effective power;
// exact tie (same element, same effective power) -> clash.
export function compareCards(playerCard, aiCard) {
  const adv = elementAdvantage(playerCard.element, aiCard.element);
  if (adv !== 0) return adv === 1 ? 'player' : 'ai';
  const pp = effectivePower(playerCard);
  const ap = effectivePower(aiCard);
  if (pp === ap) return 'clash';
  return pp > ap ? 'player' : 'ai';
}

export function createDeckState(rng) {
  return {
    deck: rng.shuffle(buildDeck()),
    discard: [],
  };
}

export function drawFromDeck(deckState, rng) {
  if (deckState.deck.length === 0) {
    if (deckState.discard.length === 0) return null;
    deckState.deck = rng.shuffle(deckState.discard);
    deckState.discard = [];
  }
  return deckState.deck.pop();
}

export function deckSize(deckState) {
  return deckState.deck.length + deckState.discard.length;
}

export { CONFIG };
