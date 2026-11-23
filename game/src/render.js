// Canvas renderer for Ember Duel. All art is drawn here — no images, no network.
// Exports draw(ctx, game, ui) and layout(game) so main.js can hit-test clicks.
import { CONFIG, ELEMENT_COLORS, ELEMENT_GLYPHS, EFFECTS } from './config.js';
import { effectivePower } from './deck.js';

const W = CONFIG.width;
const H = CONFIG.height;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hpBar(ctx, x, y, w, h, hp, maxHp, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, x - 2, y - 2, w + 4, h + 4, 6);
  ctx.fill();
  ctx.fillStyle = '#3a2a2a';
  rr(ctx, x, y, w, h, 5);
  ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  if (frac > 0) {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#ffd166');
    ctx.fillStyle = grad;
    rr(ctx, x, y, Math.max(8, w * frac), h, 5);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${hp} / ${maxHp}`, x + w / 2, y + h / 2 + 0.5);
}

export function cardRect(index, count, y, cardW, cardH, lift = 0) {
  const gap = 14;
  const total = count * cardW + (count - 1) * gap;
  const x0 = (W - total) / 2;
  return { x: x0 + index * (cardW + gap), y: y - lift, w: cardW, h: cardH };
}

export function layout(game) {
  const L = { buttons: {}, playerCards: [], aiCards: [], played: {} };
  const pc = game.player.hand.length;
  const ac = game.ai.hand.length;
  for (let i = 0; i < pc; i += 1) L.playerCards.push(cardRect(i, pc, 470, 150, 205));
  for (let i = 0; i < ac; i += 1) L.aiCards.push(cardRect(i, ac, 96, 104, 142));
  L.played.player = { x: 430, y: 262, w: 150, h: 205 };
  L.played.ai = { x: 700, y: 262, w: 150, h: 205 };
  L.buttons.mute = { x: W - 118, y: 14, w: 104, h: 34 };
  L.buttons.restart = { x: W - 232, y: 14, w: 104, h: 34 };
  L.buttons.start = { x: W / 2 - 130, y: 560, w: 260, h: 56 };
  L.buttons.next = { x: 1060, y: 486, w: 200, h: 44 };
  L.buttons.again = { x: W / 2 - 130, y: 520, w: 260, h: 56 };
  return L;
}

function drawCardBack(ctx, r) {
  ctx.fillStyle = '#2b2118';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 2;
  rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 9);
  ctx.stroke();
  ctx.fillStyle = '#e8491d';
  ctx.beginPath();
  ctx.arc(r.x + r.w / 2, r.y + r.h / 2 - 6, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', r.x + r.w / 2, r.y + r.h / 2 - 5);
  ctx.fillStyle = '#d8c9a3';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('EMBER DUEL', r.x + r.w / 2, r.y + r.h - 22);
}

function drawCard(ctx, card, r, opts = {}) {
  const color = ELEMENT_COLORS[card.element];
  ctx.save();
  if (opts.lift) {
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
  }
  ctx.fillStyle = opts.dim ? '#3a3a3a' : '#fdf6e3';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = opts.selected ? '#ffd166' : color;
  ctx.lineWidth = opts.selected ? 5 : 3;
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.stroke();

  // Element band.
  ctx.fillStyle = color;
  rr(ctx, r.x, r.y, r.w, 44, 12);
  ctx.fill();
  ctx.fillRect(r.x, r.y + 30, r.w, 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${ELEMENT_GLYPHS[card.element]} ${card.element.toUpperCase()}`, r.x + r.w / 2, r.y + 22);

  // Power.
  ctx.fillStyle = '#241a12';
  ctx.font = `bold ${r.w > 130 ? 64 : 44}px system-ui, sans-serif`;
  ctx.fillText(String(effectivePower(card)), r.x + r.w / 2, r.y + r.h / 2 - 8);
  if (card.effect === 'surge') {
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(`base ${card.power} × 2`, r.x + r.w / 2, r.y + r.h / 2 + 32);
  } else {
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#6b5b45';
    ctx.fillText('power', r.x + r.w / 2, r.y + r.h / 2 + 32);
  }

  // Name.
  ctx.fillStyle = '#241a12';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(card.name, r.x + r.w / 2, r.y + r.h - 52);

  // Effect badge.
  if (card.effect) {
    ctx.fillStyle = card.effect === 'heal' ? '#2e7d32' : card.effect === 'shield' ? '#1565c0' : '#b26a00';
    rr(ctx, r.x + 12, r.y + r.h - 38, r.w - 24, 26, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(EFFECTS[card.effect].label, r.x + r.w / 2, r.y + r.h - 24);
  }
  // Key hint.
  if (opts.key) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(r.x + r.w - 16, r.y + 58, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(String(opts.key), r.x + r.w - 16, r.y + 58);
  }
}

function drawButton(ctx, r, label, accent = false) {
  ctx.fillStyle = accent ? '#e8491d' : 'rgba(255,255,255,0.12)';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = accent ? '#ffd166' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${r.h > 44 ? 20 : 14}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
}

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1a2b4a');
  grad.addColorStop(0.5, '#20242e');
  grad.addColorStop(1, '#3a1c10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Table oval.
  ctx.fillStyle = 'rgba(46, 90, 60, 0.55)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2 + 10, 560, 300, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,209,102,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawTopBar(ctx, game, L, ui) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, W, 62);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥 EMBER DUEL', 18, 32);
  ctx.fillStyle = '#fff';
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Round ${game.round}    •    Rounds won — Asha ${game.wins.player} : ${game.wins.ai} Bram    •    Deck ${game.deckState.deck.length}`, W / 2, 32);
  drawButton(ctx, L.buttons.restart, '↻ Restart (R)');
  drawButton(ctx, L.buttons.mute, ui.muted ? '🔇 Muted (M)' : '🔊 Sound (M)');
}

function drawSidePanel(ctx, game, x, y, side) {
  const who = game[side];
  const isPlayer = side === 'player';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(`${who.name}, ${who.title}`, x, y);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#d8c9a3';
  const shield = who.shield ? '  🛡 Shield ready' : '';
  ctx.fillText(`HP ${who.hp}/${CONFIG.maxHp}${shield}`, x, y + 22);
  hpBar(ctx, x, y + 32, 210, 20, who.hp, CONFIG.maxHp, isPlayer ? '#e8491d' : '#1d7fe8');
}

function drawLog(ctx, game) {
  const x = 1000;
  const y = 96;
  const w = 262;
  const h = 380;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('📜 ROUND LOG', x + 14, y + 26);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#f0e6cc';
  let ly = y + 52;
  const lines = [];
  for (const entry of game.log) {
    const words = entry.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > w - 28 && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines.push('');
  }
  for (const line of lines.slice(-16)) {
    ctx.fillText(line, x + 14, ly);
    ly += 17;
  }
}

function drawTable(ctx, game, L, ui) {
  // Opponent (top): face-down hand + HP on the left.
  drawSidePanel(ctx, game, 18, 108, 'ai');
  for (let i = 0; i < L.aiCards.length; i += 1) {
    if (game.phase === 'reveal' || game.phase === 'roundEnd') {
      if (i === 0 && game.played.ai) continue; // played card is in the centre
      drawCardBack(ctx, L.aiCards[i]);
    } else {
      drawCardBack(ctx, L.aiCards[i]);
    }
  }
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${game.ai.hand.length} cards in hand`, W / 2, 252);

  // Centre: played cards.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (game.played.player || game.played.ai) {
    if (game.played.ai) drawCard(ctx, game.played.ai, L.played.ai, {});
    if (game.played.player) drawCard(ctx, game.played.player, L.played.player, {});
    ctx.fillText('VS', W / 2, 360);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#d8c9a3';
    ctx.fillText('Bram played', L.played.ai.x + 75, 248);
    ctx.fillText('Asha played', L.played.player.x + 75, 248);
  } else {
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('— your played card and Bram’s appear here —', W / 2, 360);
  }

  // Result banner: a strip just under the top bar (the player hand covers y 470+,
  // so the banner must live above the table, not below the played cards).
  if ((game.phase === 'reveal' || game.phase === 'roundEnd') && game.lastResult) {
    const r = game.lastResult;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 64, W, 32);
    ctx.fillStyle = r.clash ? '#ffd166' : r.winner === 'player' ? '#7CFC9A' : '#ff9a8a';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.text.length > 110 ? `${r.text.slice(0, 110)}…` : r.text, W / 2, 81);
    if (game.phase === 'reveal') drawButton(ctx, L.buttons.next, 'Next round ⏎', true);
  }

  // Player (bottom): HP on the left, hand centred.
  drawSidePanel(ctx, game, 18, 500, 'player');
  for (let i = 0; i < L.playerCards.length; i += 1) {
    const rect = { ...L.playerCards[i] };
    const hovered = ui.hover === i && game.phase === 'play';
    if (hovered) rect.y -= 18;
    drawCard(ctx, game.player.hand[i], rect, { lift: hovered, key: i + 1 });
  }
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Click a card or press 1–5 to play it', W / 2, 700);

  drawLog(ctx, game);
}

function drawTitle(ctx, game, L, ui) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, W, H);
  // Ember glow.
  const glow = ctx.createRadialGradient(W / 2, 210, 20, W / 2, 210, 320);
  glow.addColorStop(0, 'rgba(232,73,29,0.55)');
  glow.addColorStop(1, 'rgba(232,73,29,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.fillText('🔥 EMBER DUEL 🔥', W / 2, 150);
  ctx.fillStyle = '#fff';
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('Asha, the Ember Mage  vs  Bram, the Tidecaller', W / 2, 215);
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('A 1-vs-1 card battler. Both mages start at 30 HP. Win the round, deal damage equal to your card’s power.', W / 2, 262);

  // Element cycle.
  const cy = 330;
  const items = [
    ['🔥 Ember', 'beats', '🌿 Thorn'],
    ['🌿 Thorn', 'beats', '💧 Tide'],
    ['💧 Tide', 'beats', '🔥 Ember'],
  ];
  ctx.font = 'bold 19px system-ui, sans-serif';
  items.forEach((row, i) => {
    const x = 300 + i * 340;
    ctx.fillStyle = '#fff';
    ctx.fillText(row[0], x, cy);
    ctx.fillStyle = '#ffd166';
    ctx.fillText('›', x + 92, cy);
    ctx.fillStyle = '#fff';
    ctx.fillText(row[2], x + 180, cy);
  });
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Element advantage wins no matter the power. Same element → higher power wins. Exact tie → clash, both draw.', W / 2, 380);
  ctx.fillText('Heal +4 HP instead of dealing damage  •  Shield blocks the next damage  •  Surge doubles power this round', W / 2, 410);
  ctx.fillText('36-card deck  •  5-card hands  •  draw 1 card every round  •  first to 0 HP loses', W / 2, 440);

  drawButton(ctx, L.buttons.start, '▶  START DUEL  (Enter)', true);
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Keys: 1–5 play a card  •  Enter start / next  •  R restart  •  M mute  •  Mouse: click cards & buttons', W / 2, 650);
}

function drawEnd(ctx, game, L, won) {
  ctx.fillStyle = won ? 'rgba(16,52,22,0.97)' : 'rgba(52,16,22,0.97)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? '#7CFC9A' : '#ff9a8a';
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.fillText(won ? '🏆 ASHA WINS!' : '🌊 BRAM WINS', W / 2, 220);
  ctx.fillStyle = '#fff';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(
    won ? 'The embers prevail — Bram’s tide is spent.' : 'The tide takes the embers — Asha falls this time.',
    W / 2, 300,
  );
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Final HP — Asha ${game.player.hp}  •  Bram ${game.ai.hp}      Rounds won — Asha ${game.wins.player} : ${game.wins.ai} Bram`, W / 2, 350);
  ctx.fillText(`The duel lasted ${game.round} round${game.round === 1 ? '' : 's'}.`, W / 2, 385);
  drawButton(ctx, L.buttons.again, '↻  PLAY AGAIN  (R)', true);
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Press R or Enter, or click Play Again', W / 2, 610);
}

export function draw(ctx, game, ui) {
  ctx.clearRect(0, 0, W, H);
  const L = layout(game);
  drawBackground(ctx);
  if (game.phase === 'title') {
    drawTitle(ctx, game, L, ui);
    return L;
  }
  drawTopBar(ctx, game, L, ui);
  drawTable(ctx, game, L, ui);
  if (game.phase === 'win') drawEnd(ctx, game, L, true);
  if (game.phase === 'loss') drawEnd(ctx, game, L, false);
  return L;
}

export { W, H };
