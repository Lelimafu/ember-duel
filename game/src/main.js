// Ember Duel — boot, input and render loop.
import { CONFIG } from './config.js';
import { advanceAfterReveal, createGame, playRound, restartGame, startGame } from './game.js';
import { draw, layout } from './render.js';
import { createAudio } from './audio.js';
import { applyShot, SHOTS } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio();

const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;
const staged = shotParam && SHOTS.includes(shotParam);

const game = createGame(seed);
if (staged) applyShot(game, shotParam, seed);

const ui = { hover: -1, muted: false };
let lastLayout = layout(game);

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function toCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function playCardAt(index) {
  if (game.phase !== 'play') return;
  const result = playRound(game, index);
  if (!result) return;
  audio.play();
  setTimeout(() => {
    if (!result.clash && result.healed > 0) audio.heal();
    else if (!result.clash && result.blocked) audio.clash();
    else if (!result.clash) audio.hit();
    else audio.clash();
    audio.reveal();
  }, 250);
}

function nextStep() {
  if (game.phase === 'title') {
    startGame(game);
    audio.click();
  } else if (game.phase === 'reveal' || game.phase === 'roundEnd') {
    const phase = advanceAfterReveal(game);
    if (phase === 'win') audio.win();
    else if (phase === 'loss') audio.loss();
    else audio.click();
  } else if (game.phase === 'win' || game.phase === 'loss') {
    restartGame(game);
    audio.click();
  }
}

canvas.addEventListener('mousemove', (event) => {
  const p = toCanvas(event);
  ui.hover = -1;
  if (game.phase === 'play') {
    lastLayout.playerCards.forEach((r, i) => {
      if (inRect(p.x, p.y, r)) ui.hover = i;
    });
  }
  canvas.style.cursor = ui.hover >= 0 ? 'pointer' : 'default';
});

canvas.addEventListener('click', (event) => {
  const p = toCanvas(event);
  const L = lastLayout;
  if (inRect(p.x, p.y, L.buttons.mute)) {
    ui.muted = audio.toggleMute();
    return;
  }
  if (inRect(p.x, p.y, L.buttons.restart) && game.phase !== 'title') {
    restartGame(game);
    audio.click();
    return;
  }
  if (game.phase === 'title' && inRect(p.x, p.y, L.buttons.start)) {
    nextStep();
    return;
  }
  if ((game.phase === 'win' || game.phase === 'loss') && inRect(p.x, p.y, L.buttons.again)) {
    nextStep();
    return;
  }
  if (game.phase === 'reveal' && inRect(p.x, p.y, L.buttons.next)) {
    nextStep();
    return;
  }
  if (game.phase === 'play') {
    for (let i = 0; i < L.playerCards.length; i += 1) {
      if (inRect(p.x, p.y, L.playerCards[i])) {
        playCardAt(i);
        return;
      }
    }
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key >= '1' && event.key <= '5') {
    playCardAt(Number(event.key) - 1);
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    nextStep();
    return;
  }
  if (event.key === 'r' || event.key === 'R') {
    if (game.phase !== 'title') {
      restartGame(game);
      audio.click();
    }
    return;
  }
  if (event.key === 'm' || event.key === 'M') {
    ui.muted = audio.toggleMute();
  }
});

function frame() {
  // Auto-advance the reveal in live play (not in staged screenshots).
  if (!staged && game.phase === 'reveal' && Date.now() - game.revealAt > 2200) {
    const phase = advanceAfterReveal(game);
    if (phase === 'win') audio.win();
    else if (phase === 'loss') audio.loss();
  }
  lastLayout = draw(ctx, game, ui);
  requestAnimationFrame(frame);
}

document.title = `${CONFIG.title} — Asha vs Bram`;
requestAnimationFrame(frame);
