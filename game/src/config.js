// Ember Duel — shared configuration. No DOM, no network: pure constants.
export const CONFIG = {
  title: 'Ember Duel',
  subtitle: 'Asha, the Ember Mage  vs  Bram, the Tidecaller',
  width: 1280,
  height: 720,
  maxHp: 30,
  handSize: 5,
  deckSize: 36,
  healAmount: 4,
  maxRounds: 100,
};

// Element cycle: Ember beats Thorn, Thorn beats Tide, Tide beats Ember.
export const ELEMENTS = ['Ember', 'Tide', 'Thorn'];

export const ELEMENT_COLORS = {
  Ember: '#e8491d',
  Tide: '#1d7fe8',
  Thorn: '#3da53d',
};

export const ELEMENT_GLYPHS = {
  Ember: '🔥',
  Tide: '💧',
  Thorn: '🌿',
};

export const ELEMENT_BEATS = {
  Ember: 'Thorn',
  Thorn: 'Tide',
  Tide: 'Ember',
};

export const EFFECTS = {
  heal: { label: 'HEAL +4', description: 'Heals its owner +4 HP instead of dealing damage when it wins the round.' },
  shield: { label: 'SHIELD', description: 'Blocks the next damage dealt to its owner, then is consumed.' },
  surge: { label: 'SURGE x2', description: 'Power is doubled this round.' },
};
