/* ==========================================================================
   Nido · Sonidos para dormir
   Todos los sonidos se sintetizan en el navegador con Web Audio: no hay
   archivos que descargar y funcionan sin conexión. Temporizador con
   apagado gradual y reproductor flotante mientras suenan.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, icon } = N;

  /* Ruido base: blanco, rosa (Voss‑McCartney aproximado) o marrón (paseo aleatorio). */
  function noise(ctx, seconds, kind) {
    const len = Math.floor(seconds * ctx.sampleRate), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else d[i] = w * 0.5;
    }
    return buf;
  }
  function loop(ctx, buf, out, filter) {
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    if (filter) { const f = ctx.createBiquadFilter(); Object.assign(f, { type: filter.type }); f.frequency.value = filter.f; if (filter.q) f.Q.value = filter.q; src.connect(f); f.connect(out); }
    else src.connect(out);
    src.start(); return src;
  }
  /* Modula un buffer con una envolvente t → [0,1]. */
  function shaped(ctx, seconds, kind, env) {
    const buf = noise(ctx, seconds, kind), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] *= env(i / ctx.sampleRate);
    return buf;
  }
  function beat(t, bpm, amp) {
    const p = t % (60 / bpm); let v = 0;
    if (p < 0.08) v = Math.sin(2 * Math.PI * 55 * p) * Math.exp(-p * 30);
    else if (p > 0.15 && p < 0.23) { const q = p - 0.15; v = Math.sin(2 * Math.PI * 48 * q) * Math.exp(-q * 25) * 0.7; }
    return v * amp;
  }

  const GEN = {
    white: (ctx, out) => loop(ctx, noise(ctx, 3, 'white'), out, { type: 'lowpass', f: 5000 }),
    pink: (ctx, out) => loop(ctx, noise(ctx, 3, 'pink'), out, { type: 'lowpass', f: 2200 }),
    brown: (ctx, out) => loop(ctx, noise(ctx, 3, 'brown'), out, { type: 'lowpass', f: 900 }),
    rain: (ctx, out) => {
      const buf = noise(ctx, 4, 'pink'), d = buf.getChannelData(0);
      for (let k = 0; k < 900; k++) { const at = Math.floor(Math.random() * (d.length - 400)); for (let i = 0; i < 300; i++) d[at + i] += (Math.random() * 2 - 1) * Math.exp(-i / 40) * 0.5; }
      return loop(ctx, buf, out, { type: 'bandpass', f: 1800, q: 0.4 });
    },
    ocean: (ctx, out) => loop(ctx, shaped(ctx, 10, 'brown', (t) => 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * t / 10), 2)), out, { type: 'lowpass', f: 1100 }),
    shush: (ctx, out) => loop(ctx, shaped(ctx, 1.6, 'white', (t) => (t < 1.1 ? Math.sin(Math.PI * t / 1.1) : 0)), out, { type: 'bandpass', f: 3200, q: 0.9 }),
    heart: (ctx, out) => {
      const len = Math.floor(60 / 70 * 4 * ctx.sampleRate), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = beat(i / ctx.sampleRate, 70, 0.9);
      return loop(ctx, buf, out);
    },
    womb: (ctx, out) => {
      const len = Math.floor(60 / 75 * 6 * ctx.sampleRate), buf = noise(ctx, len / ctx.sampleRate, 'brown'), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = d[i] * 1.2 + beat(i / ctx.sampleRate, 75, 0.45);
      return loop(ctx, buf, out, { type: 'lowpass', f: 380 });
    },
    lullaby: (ctx, out) => {
      // Nana de Brahms (Do mayor), notas en Hz y duración en pulsos.
      const E4 = 329.6, G4 = 392, C5 = 523.3, B4 = 493.9, A4 = 440, D4 = 293.7, F4 = 349.2;
      const song = [[E4, .5], [E4, .5], [G4, 2], [E4, .5], [E4, .5], [G4, 2], [E4, .5], [G4, .5], [C5, 1], [B4, 1.5], [A4, .5], [A4, 1], [G4, 1],
        [D4, .5], [E4, .5], [F4, 1], [D4, 1], [D4, .5], [E4, .5], [F4, 2], [D4, .5], [F4, .5], [B4, .5], [A4, .5], [G4, 1], [B4, 1], [C5, 2.5]];
      const beatS = 0.62, total = U.sum(song, (n) => n[1]) * beatS + 1.5;
      const len = Math.floor(total * ctx.sampleRate), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let t0 = 0;
      song.forEach(([f, b]) => {
        const s = Math.floor(t0 * ctx.sampleRate), n = Math.floor((b * beatS + 0.8) * ctx.sampleRate);
        for (let i = 0; i < n && s + i < len; i++) {
          const t = i / ctx.sampleRate, env = Math.min(1, t * 30) * Math.exp(-t * 1.6);
          d[s + i] += (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t) + 0.1 * Math.sin(6 * Math.PI * f * t)) * env * 0.18;
        }
        t0 += b * beatS;
      });
      return loop(ctx, buf, out, { type: 'lowpass', f: 2500 });
    }
  };

  const Sounds = {
    list: [
      { id: 'white', name: 'Ruido blanco', emoji: '〰️', hint: 'Clásico, tapa ruidos' },
      { id: 'pink', name: 'Ruido rosa', emoji: '🌬️', hint: 'Más suave, como un ventilador' },
      { id: 'brown', name: 'Ruido marrón', emoji: '🌊', hint: 'Grave y envolvente' },
      { id: 'shush', name: 'Shhh', emoji: '🤫', hint: 'Para calmar en brazos' },
      { id: 'womb', name: 'Útero', emoji: '🫧', hint: 'Recién nacidos' },
      { id: 'heart', name: 'Latido', emoji: '💗', hint: '70 pulsaciones' },
      { id: 'rain', name: 'Lluvia', emoji: '🌧️', hint: 'Lluvia constante' },
      { id: 'ocean', name: 'Olas', emoji: '🐚', hint: 'Vaivén lento' },
      { id: 'lullaby', name: 'Nana de Brahms', emoji: '🎵', hint: 'Caja de música' }
    ],
    state: { key: null, until: null, volume: 0.45, minutes: 30 },
    _ctx: null, _src: null, _gain: null, _timer: null,

    play(key) {
      if (this.state.key === key) { this.stop(); return; }
      this.stop(true);
      try {
        const ctx = this._ctx || (this._ctx = new (window.AudioContext || window.webkitAudioContext)());
        if (ctx.state === 'suspended') ctx.resume();
        const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(this.state.volume, ctx.currentTime + 1.5); g.connect(ctx.destination);
        this._gain = g; this._src = GEN[key](ctx, g); this.state.key = key;
        this.setTimer(this.state.minutes, true);
      } catch (e) { N.UI.toast('Este navegador no puede reproducir sonidos'); this.stop(); }
      this.changed();
    },
    /* Apagado con fundido de 12 s (o inmediato). */
    stop(quiet) {
      clearTimeout(this._timer); this._timer = null;
      const src = this._src, g = this._gain, ctx = this._ctx;
      if (src && g && ctx && !quiet) {
        g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        setTimeout(() => { try { src.stop(); src.disconnect(); } catch (e) { /* ya parado */ } }, 700);
      } else if (src) { try { src.stop(); src.disconnect(); } catch (e) { /* ya parado */ } }
      this._src = null; this._gain = null;
      this.state.key = null; this.state.until = null;
      if (!quiet) this.changed();
    },
    fadeOut() {
      const g = this._gain, ctx = this._ctx, src = this._src; if (!g) return;
      g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 12);
      this._timer = setTimeout(() => { try { src.stop(); } catch (e) { /* ya parado */ } this._src = null; this._gain = null; this.state.key = null; this.state.until = null; this.changed(); }, 12000);
    },
    setTimer(min, silent) {
      this.state.minutes = min;
      clearTimeout(this._timer);
      if (this.state.key && min) { this.state.until = Date.now() + min * U.MIN; this._timer = setTimeout(() => this.fadeOut(), min * U.MIN - 12000); }
      else this.state.until = null;
      if (!silent) this.changed();
    },
    setVolume(v) {
      this.state.volume = v;
      if (this._gain && this._ctx) { this._gain.gain.cancelScheduledValues(this._ctx.currentTime); this._gain.gain.setTargetAtTime(v, this._ctx.currentTime, 0.1); }
    },
    changed() { this.renderPlayer(); if (N.UI.current() === 'sueno') N.UI.render(); },
    renderPlayer() {
      const el = document.getElementById('player'); if (!el) return;
      const s = this.list.find((x) => x.id === this.state.key);
      el.hidden = !s;
      if (s) el.innerHTML = `<span class="pl-e" aria-hidden="true">${s.emoji}</span><a href="#sueno" class="pl-t"><b>${s.name}</b><small>${this.state.until ? `se apaga en <span data-until="${this.state.until}"></span>` : 'sin temporizador'}</small></a><button type="button" class="icon-btn sm" data-act="sound-stop" aria-label="Parar sonido">${icon('stop')}</button>`;
      N.UI.tick();
    }
  };
  N.Sounds = Sounds;
  N.actions.sound = (el) => Sounds.play(el.dataset.key);
  N.actions['sound-stop'] = () => Sounds.stop();
})(window.Nido = window.Nido || {});
