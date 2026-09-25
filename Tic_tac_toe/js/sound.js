// Негромкие синтезированные звуки на Web Audio API — без внешних файлов.
const Sound = (() => {
  let ctx = null;
  let master = null;
  let volume = 0.6;
  let muted = false;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.connect(comp);
    comp.connect(ctx.destination);
    applyGain();
    return true;
  }

  function applyGain() {
    if (!master) return;
    // Квадратичная кривая: регулятор ощущается равномернее на слух.
    const g = muted ? 0 : volume * volume * 0.9;
    master.gain.setTargetAtTime(g, ctx.currentTime, 0.02);
  }

  function tone(freq, { type = 'sine', dur = 0.18, gain = 0.2, delay = 0, to = null, attack = 0.008 } = {}) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env);
    env.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const sounds = {
    x() {
      tone(660, { type: 'triangle', dur: 0.13, gain: 0.16, to: 560 });
      tone(1320, { dur: 0.07, gain: 0.03 });
    },
    o() {
      tone(440, { dur: 0.2, gain: 0.2, to: 500 });
      tone(880, { dur: 0.09, gain: 0.03 });
    },
    vanish() {
      tone(900, { dur: 0.42, gain: 0.05, to: 240, delay: 0.12, attack: 0.03 });
      tone(1350, { dur: 0.3, gain: 0.02, to: 500, delay: 0.14, attack: 0.03 });
    },
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(f, { type: 'triangle', dur: 0.38, gain: 0.13, delay: 0.12 + i * 0.09 }));
    },
    lose() {
      [392, 329.63, 261.63].forEach((f, i) =>
        tone(f, { dur: 0.42, gain: 0.14, delay: 0.12 + i * 0.14 }));
    },
    draw() {
      tone(440, { dur: 0.22, gain: 0.1, delay: 0.1 });
      tone(440, { dur: 0.34, gain: 0.1, delay: 0.28, to: 415 });
    },
    click() {
      tone(880, { dur: 0.05, gain: 0.05 });
    },
    error() {
      tone(190, { type: 'triangle', dur: 0.12, gain: 0.08 });
    },
  };

  function play(name) {
    if (muted || volume === 0) return;
    if (!init()) return;
    sounds[name]?.();
  }

  return {
    play,
    unlock: init,
    setVolume(v) { volume = v; applyGain(); },
    setMuted(m) { muted = m; applyGain(); },
  };
})();
