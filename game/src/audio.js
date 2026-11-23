// Tiny WebAudio synth: short bleeps for play / reveal / hit / win / loss.
// Everything is generated — no audio files, no network. Safe to construct in Node
// (it just no-ops without a window/AudioContext).
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (typeof window === 'undefined' || muted) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    const ac = ensure();
    if (!ac) return;
    try {
      const t0 = ac.currentTime + when;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Audio is decoration; never break the game.
    }
  }

  return {
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    play() { tone(520, 0.09, 'triangle', 0.1); tone(780, 0.07, 'triangle', 0.07, 0.05); },
    reveal() { tone(392, 0.08, 'sine', 0.1); tone(523, 0.08, 'sine', 0.1, 0.08); tone(659, 0.12, 'sine', 0.1, 0.16); },
    hit() { tone(180, 0.16, 'sawtooth', 0.12); tone(90, 0.2, 'square', 0.08, 0.02); },
    heal() { tone(660, 0.1, 'sine', 0.09); tone(880, 0.14, 'sine', 0.09, 0.09); },
    clash() { tone(300, 0.1, 'square', 0.08); tone(300, 0.1, 'square', 0.08, 0.12); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.11, i * 0.12)); },
    loss() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, i * 0.13)); },
    click() { tone(700, 0.05, 'sine', 0.06); },
  };
}
