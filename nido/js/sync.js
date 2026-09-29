/* ==========================================================================
   Nido · Sincronización entre cuidadores, cifrada de extremo a extremo
   ----------------------------------------------------------------------
   · Una "familia" es un espacio en el relé (nido/server/relay.mjs) con un
     id aleatorio y una clave AES‑256 que solo tienen los dispositivos.
   · Cada cambio se envía como {k, v, t, d}: clave del registro, valor (o
     null si se borró), hora y dispositivo, cifrado con AES‑GCM (IV
     aleatorio, id de la familia como datos asociados). El servidor solo ve
     bloques opacos numerados.
   · El relé autoriza con un token derivado de la clave (SHA‑256 con
     prefijo): quien no tenga el código no puede leer ni escribir.
   · Los cambios se detectan comparando cada registro con la huella de lo
     último sincronizado, así que da igual qué parte de la app lo cambie.
   · Conflictos: por registro, gana el cambio más reciente.
   · No se sincronizan las preferencias del dispositivo (tema, quién
     registra, avisos enviados) ni el bebé seleccionado.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, Store } = N;
  const LS = 'nido.sync.v1';
  const MAPS = ['milestones', 'teeth', 'blwPlans'];
  const enc = new TextEncoder(), dec = new TextDecoder();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const b64u = {
    enc: (buf) => { let s = ''; new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
    dec: (str) => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)); return Uint8Array.from(s, (c) => c.charCodeAt(0)); }
  };
  /* Huella rápida (cyrb53) para saber si un registro cambió. */
  const hash = (str) => {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };

  const Sync = {
    cfg: null, status: 'off', error: '', lastOk: 0, busy: false, _pushing: null,
    _key: null, _token: null, _timer: null, _running: false, _wake: null,

    /* ---------- Configuración persistente ---------- */
    load() { try { this.cfg = JSON.parse(localStorage.getItem(LS)) || null; } catch (e) { this.cfg = null; } return this.cfg; },
    save() { try { if (this.cfg) localStorage.setItem(LS, JSON.stringify(this.cfg)); else localStorage.removeItem(LS); } catch (e) { /* sin almacenamiento */ } },
    get enabled() { return !!(this.cfg && this.cfg.space); },
    invite() { return this.cfg ? `${this.cfg.server}#nido1.${this.cfg.space}.${this.cfg.key}` : ''; },
    parseInvite(code) {
      const m = /^\s*(https?:\/\/[^#\s]+)#nido1\.([A-Za-z0-9_-]{16,64})\.([A-Za-z0-9_-]{40,50})\s*$/.exec(code || '');
      return m ? { server: m[1].replace(/\/+$/, ''), space: m[2], key: m[3] } : null;
    },

    /* ---------- Criptografía ---------- */
    async keys() {
      if (this._key) return;
      const raw = b64u.dec(this.cfg.key);
      this._key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
      const tok = new Uint8Array([...enc.encode('nido-auth:'), ...raw]);
      this._token = b64u.enc(await crypto.subtle.digest('SHA-256', tok));
    },
    async seal(obj) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(this.cfg.space) }, this._key, enc.encode(JSON.stringify(obj)));
      return { iv: b64u.enc(iv), ct: b64u.enc(ct) };
    },
    async open(op) {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64u.dec(op.iv), additionalData: enc.encode(this.cfg.space) }, this._key, b64u.dec(op.ct));
      return JSON.parse(dec.decode(pt));
    },

    /* ---------- Red ---------- */
    async http(method, path, body) {
      const res = await fetch(this.cfg.server + path, {
        method, headers: Object.assign({ Authorization: 'Bearer ' + this._token }, body ? { 'Content-Type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined, cache: 'no-store'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || `Error ${res.status}`), { status: res.status });
      return data;
    },
    async health(server) {
      const res = await fetch(server.replace(/\/+$/, '') + '/v1/health', { cache: 'no-store' });
      const j = await res.json(); if (!j.ok || j.service !== 'nido-relay') throw new Error('No es un servidor de Nido');
    },

    /* ---------- Estado → registros sincronizables ---------- */
    snapshot() {
      const s = Store.state, out = new Map();
      s.babies.forEach((b) => out.set(`babies/${b.id}`, b));
      Store.COLLECTIONS.forEach((c) => (s[c] || []).forEach((r) => out.set(`${c}/${r.id}`, r)));
      MAPS.forEach((m) => Object.entries(s[m] || {}).forEach(([id, v]) => out.set(`${m}/${id}`, v)));
      Object.entries(s.shopping || {}).forEach(([id, v]) => out.set(`shopping/${id}`, v));
      out.set('timers', s.timers || {});
      return out;
    },
    diff() {
      const meta = this.cfg.meta, ops = [], snap = this.snapshot();
      snap.forEach((v, k) => { const h = hash(JSON.stringify(v)); if (!meta[k] || meta[k].h !== h) ops.push({ k, v, h }); });
      Object.keys(meta).forEach((k) => { if (!snap.has(k) && meta[k].h !== 'x') ops.push({ k, v: null, h: 'x' }); });
      return ops;
    },
    setValue(k, v) {
      const s = Store.state;
      if (k === 'timers') { s.timers = v || {}; return; }
      const i = k.indexOf('/'), col = k.slice(0, i), id = k.slice(i + 1);
      if (col === 'babies' || Store.COLLECTIONS.includes(col)) {
        const arr = col === 'babies' ? s.babies : (s[col] = s[col] || []);
        const at = arr.findIndex((r) => r.id === id);
        if (v == null) { if (at >= 0) arr.splice(at, 1); } else if (at >= 0) arr[at] = v; else arr.push(v);
      } else if (MAPS.includes(col) || col === 'shopping') {
        const map = s[col] || (s[col] = {});
        if (v == null) delete map[id]; else map[id] = v;
      }
    },

    /* ---------- Enviar y recibir ---------- */
    /* Un solo envío a la vez: si llega otro, espera y vuelve a mirar. */
    async push() {
      while (this._pushing) await this._pushing;
      this._pushing = this._push().finally(() => { this._pushing = null; });
      return this._pushing;
    },
    async _push() {
      const ops = this.diff();
      const media = [];
      if (N.Media) for (const d of Store.state.diary) if (d.photoId && !this.cfg.media[d.photoId]) media.push(d.photoId);
      if (!ops.length && !media.length) return 0;
      const t = Date.now(), d = this.cfg.device;
      for (let i = 0; i < ops.length; i += 100) {
        const chunk = ops.slice(i, i + 100);
        const sealed = await Promise.all(chunk.map((o) => this.seal({ k: o.k, v: o.v, t, d })));
        await this.http('POST', `/v1/spaces/${this.cfg.space}/ops`, { ops: sealed });
        chunk.forEach((o) => { this.cfg.meta[o.k] = { h: o.h, t }; });
        this.save();
      }
      for (const id of media) {
        const url = await N.Media.get(id).catch(() => null); if (!url) continue;
        await this.http('POST', `/v1/spaces/${this.cfg.space}/ops`, { ops: [await this.seal({ k: `media/${id}`, v: url, t, d })] });
        this.cfg.media[id] = 1; this.save();
      }
      return ops.length + media.length;
    },
    async pull(wait = 0) {
      let applied = 0, more = true;
      while (more) {
        const res = await this.http('GET', `/v1/spaces/${this.cfg.space}/ops?after=${this.cfg.lastSeq}&limit=500${wait ? '&wait=' + wait : ''}`);
        wait = 0;
        for (const op of res.ops) {
          let o; try { o = await this.open(op); } catch (e) { this.cfg.lastSeq = op.seq; continue; } // no es de esta clave: se ignora
          this.cfg.lastSeq = op.seq;
          if (o.d === this.cfg.device) continue; // eco de lo que envió este dispositivo
          if (o.k.startsWith('media/')) { const id = o.k.slice(6); if (N.Media) await N.Media.put(o.v, id).catch(() => {}); this.cfg.media[id] = 1; applied++; continue; }
          const cur = this.cfg.meta[o.k];
          if (cur && cur.t > o.t) continue; // lo de aquí es más reciente
          this.setValue(o.k, o.v);
          this.cfg.meta[o.k] = { h: o.v == null ? 'x' : hash(JSON.stringify(o.v)), t: o.t };
          applied++;
        }
        more = res.ops.length === 500;
      }
      this.save();
      if (applied) {
        if (!Store.state.babies.some((b) => b.id === Store.state.activeBabyId)) Store.state.activeBabyId = (Store.state.babies[0] || {}).id || null;
        Store.commit();
      }
      return applied;
    },
    async syncNow() {
      if (!this.enabled || this.busy) return;
      this.busy = true; this.setStatus('syncing');
      try { await this.keys(); await this.push(); await this.pull(); this.lastOk = Date.now(); this.setStatus('ok'); }
      catch (e) { this.fail(e); }
      finally { this.busy = false; }
    },
    schedule() { if (!this.enabled) return; clearTimeout(this._timer); this._timer = setTimeout(() => this.syncNow(), 1200); },
    fail(e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      this.error = offline ? '' : e.status === 410 ? 'Esta familia se cerró o cambió de clave: pide el código nuevo' : e.status === 401 ? 'El código de la familia ya no es válido' : e.message === 'Failed to fetch' ? 'No se puede conectar con el servidor' : e.message;
      this.setStatus(offline ? 'offline' : 'error');
    },
    setStatus(s) { if (this.status === s) return; this.status = s; if (N.UI && N.UI.current && typeof document !== 'undefined' && document.getElementById('sidenav')) { N.UI.renderNav(); if (N.UI.current() === 'ajustes') N.UI.render(); } },

    /* Bucle en segundo plano: espera cambios del servidor (long‑poll) y reintenta con pausas crecientes. */
    async run() {
      if (this._running) return; this._running = true;
      let backoff = 2000;
      while (this.enabled) {
        const hidden = typeof document !== 'undefined' && document.hidden;
        if ((typeof navigator !== 'undefined' && navigator.onLine === false)) { this.setStatus('offline'); await sleep(5000); continue; }
        // Si hay una sincronización manual en curso, cede el turno (sin esto el bucle
        // giraría sin pausa y bloquearía la página).
        if (this.busy) { await sleep(300); continue; }
        try {
          await this.keys();
          await this.push();
          await this.pull(hidden ? 0 : 25);
          await this.push();
          this.lastOk = Date.now(); this.setStatus('ok'); backoff = 2000;
          if (hidden) await sleep(60000);
        } catch (e) { this.fail(e); await sleep(backoff); backoff = Math.min(backoff * 2, 60000); }
      }
      this._running = false;
    },

    /* ---------- Crear, unirse, salir ---------- */
    newCfg(server, space, key) {
      return { server: server.replace(/\/+$/, ''), space, key, device: 'd_' + U.uid(), lastSeq: 0, meta: {}, media: {}, since: Date.now() };
    },
    async create(server) {
      await this.health(server);
      this.cfg = this.newCfg(server, b64u.enc(crypto.getRandomValues(new Uint8Array(16))), b64u.enc(crypto.getRandomValues(new Uint8Array(32))));
      this._key = null; await this.keys(); this.save();
      await this.push(); this.lastOk = Date.now(); this.setStatus('ok');
      if (this.autoRun !== false) this.run();
      return this.invite();
    },
    /* mode 'replace': este dispositivo adopta los datos de la familia.
       mode 'merge': además sube lo que tenía (gana lo más reciente). */
    async join(code, mode = 'replace') {
      const inv = this.parseInvite(code); if (!inv) throw new Error('El código no es válido');
      await this.health(inv.server);
      this.cfg = this.newCfg(inv.server, inv.space, inv.key);
      this._key = null; await this.keys();
      const probe = await this.http('GET', `/v1/spaces/${inv.space}/ops?after=0&limit=1`);
      if (!probe.last) { this.cfg = null; throw new Error('Esa familia no existe o aún no tiene datos'); }
      if (mode === 'replace') {
        const keep = { settings: Store.state.settings, sent: Store.state.sent };
        Store.state = Object.assign(Store.state, { babies: [], milestones: {}, teeth: {}, timers: {}, blwPlans: {}, shopping: {}, activeBabyId: null }, keep);
        Store.COLLECTIONS.forEach((c) => { Store.state[c] = []; });
        if (N.Media) await N.Media.clear();
      }
      this.save();
      await this.pull();
      if (mode === 'merge') await this.push();
      Store.commit(); this.lastOk = Date.now(); this.setStatus('ok');
      if (this.autoRun !== false) this.run();
    },
    leave() { this.cfg = null; this._key = null; this._token = null; this.save(); this.setStatus('off'); },
    async destroy() { await this.keys(); await this.http('DELETE', `/v1/spaces/${this.cfg.space}`); this.leave(); },
    /* Nueva clave: nueva familia con los mismos datos; la anterior se borra del servidor. */
    async rotate() {
      const old = { ...this.cfg }, oldToken = this._token;
      this.cfg = this.newCfg(old.server, b64u.enc(crypto.getRandomValues(new Uint8Array(16))), b64u.enc(crypto.getRandomValues(new Uint8Array(32))));
      this.cfg.device = old.device; this._key = null; await this.keys(); this.save();
      await this.push();
      try { await fetch(`${old.server}/v1/spaces/${old.space}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + oldToken } }); } catch (e) { /* se queda huérfana */ }
      return this.invite();
    },

    start() {
      this.load();
      Store.subscribe(() => this.schedule());
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', () => this.syncNow());
        document.addEventListener('visibilitychange', () => { if (!document.hidden) this.syncNow(); });
      }
      if (!this.enabled) return;
      this.status = 'syncing';
      this.run();
    }
  };
  Sync._hash = hash; Sync._b64u = b64u;
  N.Sync = Sync;
})(window.Nido = window.Nido || {});

/* ==========================================================================
   Nido · Pantalla "Compartir con otro cuidador"
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, Store, UI, icon } = N;
  if (!UI) return; // en los tests solo se carga la lógica
  const Sync = N.Sync;
  const STATUS = {
    ok: ['Sincronizado', 'good'], syncing: ['Sincronizando…', 'soft'], offline: ['Sin conexión: se enviará al volver', 'warn'],
    error: ['Error', 'crit'], off: ['Solo en este dispositivo', 'muted']
  };

  Sync.pill = () => {
    const [txt, tone] = STATUS[Sync.status] || STATUS.off;
    return UI.pill(txt, tone);
  };
  Sync.navLine = () => (Sync.enabled ? `<span class="sync-dot is-${Sync.status}" title="${(STATUS[Sync.status] || STATUS.off)[0]}"></span>${Sync.status === 'ok' ? 'Compartido' : (STATUS[Sync.status] || STATUS.off)[0].split(':')[0]}` : '');

  Sync.card = () => {
    if (!Sync.enabled) {
      const last = (() => { try { return localStorage.getItem('nido.sync.server') || ''; } catch (e) { return ''; } })();
      return `${N.install.framed() ? '<p class="alert warn">Dentro de esta página de demostración no se puede conectar con un servidor externo. Abre Nido desde tu propia instalación para compartir.</p>' : ''}<p class="muted small">Comparte los datos de forma segura con tu pareja u otros cuidadores. Todo se cifra en este dispositivo antes de salir: el servidor solo guarda datos ilegibles y no puede ver nombres, fechas ni fotos.</p>
        <div class="sync-grid">
          <section><h3 class="sec-h">Crear la familia</h3>
            <label class="fld"><span>Dirección de tu servidor de Nido</span><input id="f-sync-server" type="url" inputmode="url" placeholder="https://nido-relay.tu-dominio.com" value="${U.esc(last)}"></label>
            <p class="hint">Es el relé de <code>nido/server</code>. Mira el README para ponerlo en marcha.</p>
            <button type="button" class="btn primary" data-act="sync-create">${icon('users')}Crear y obtener código</button></section>
          <section><h3 class="sec-h">Unirme con un código</h3>
            <label class="fld"><span>Código de invitación</span><textarea id="f-sync-code" rows="3" class="code" placeholder="https://…#nido1.…"></textarea></label>
            <fieldset class="fld"><legend>Los datos que ya hay en este móvil</legend><div class="chips">
              <label class="chip"><input type="radio" name="sync-mode" value="replace" checked><span>Sustituirlos por los de la familia</span></label>
              <label class="chip"><input type="radio" name="sync-mode" value="merge"><span>Juntarlos con los de la familia</span></label></div></fieldset>
            <button type="button" class="btn soft" data-act="sync-join">${icon('download')}Unirme</button></section>
        </div>`;
    }
    const c = Sync.cfg;
    return `<p>${Sync.pill()} ${Sync.lastOk ? `<span class="muted small">última vez ${U.ago(Sync.lastOk)}</span>` : ''}</p>
      ${Sync.status === 'error' && Sync.error ? `<p class="alert warn">${icon('alert')}<span>${U.esc(Sync.error)}</span></p>` : ''}
      <dl class="facts"><div><dt>Servidor</dt><dd>${U.esc(c.server)}</dd></div><div><dt>Desde</dt><dd>${U.date(c.since, true)}</dd></div><div><dt>Cambios recibidos</dt><dd>${c.lastSeq}</dd></div></dl>
      <div class="btn-row"><button type="button" class="btn primary" data-act="sync-show">${icon('users')}Invitar a otro cuidador</button><button type="button" class="btn soft" data-act="sync-now">${icon('repeat')}Sincronizar ahora</button></div>
      <details class="pad-t"><summary class="small">Seguridad y opciones</summary>
        <p class="muted small">El código de invitación lleva la clave: quien lo tenga puede ver y cambiar los datos. Si lo compartiste por error o alguien deja de cuidar al bebé, cambia la clave.</p>
        <div class="btn-row"><button type="button" class="btn soft sm" data-act="sync-rotate">${icon('repeat')}Cambiar la clave</button><button type="button" class="btn ghost sm" data-act="sync-leave">Dejar de compartir en este móvil</button><button type="button" class="btn ghost danger sm" data-act="sync-destroy">${icon('trash')}Borrar la familia del servidor</button></div></details>`;
  };

  const busy = (el, txt) => { el.disabled = true; el.dataset.txt = el.innerHTML; el.textContent = txt; };
  N.actions['sync-create'] = async (el) => {
    const server = (document.getElementById('f-sync-server').value || '').trim();
    if (!/^https?:\/\/\S+$/.test(server)) { UI.toast('Escribe la dirección del servidor (https://…)'); return; }
    try { localStorage.setItem('nido.sync.server', server); } catch (e) { /* opcional */ }
    busy(el, 'Creando y cifrando…');
    try { await Sync.create(server); UI.render(); N.actions['sync-show'](); }
    catch (e) { UI.toast(e.message === 'Failed to fetch' ? 'No se puede conectar con ese servidor' : e.message); Sync.leave(); UI.render(); }
  };
  N.actions['sync-join'] = async (el) => {
    const code = document.getElementById('f-sync-code').value;
    const mode = (document.querySelector('[name=sync-mode]:checked') || {}).value || 'replace';
    if (!Sync.parseInvite(code)) { UI.toast('Ese código no es válido. Cópialo completo, empieza por https://'); return; }
    busy(el, 'Descargando y descifrando…');
    try { await Sync.join(code, mode); UI.go('hoy'); UI.toast('Unido a la familia. Los cambios se comparten al momento'); }
    catch (e) { UI.toast(e.message === 'Failed to fetch' ? 'No se puede conectar con el servidor' : e.message); UI.render(); }
  };
  N.actions['sync-show'] = () => {
    UI.sheet({
      title: 'Invitar a otro cuidador', footer: false,
      body: `<p class="muted small">En el otro móvil, abre Nido → Ajustes → Compartir → <b>Unirme con un código</b> y pega este código. Envíalo por un canal privado: es como una contraseña.</p>
        <textarea id="f-invite" class="code" rows="3" readonly>${U.esc(Sync.invite())}</textarea>
        <div class="btn-row"><button type="button" class="btn primary" data-act="sync-copy">${icon('copy')}Copiar código</button>${navigator.share && !N.install.framed() ? `<button type="button" class="btn soft" data-act="sync-share">Compartir…</button>` : ''}</div>`
    });
  };
  N.actions['sync-copy'] = () => { const ta = document.getElementById('f-invite'); try { navigator.clipboard.writeText(ta.value).then(() => UI.toast('Código copiado'), () => { ta.select(); UI.toast('Código seleccionado: cópialo'); }); } catch (e) { ta.select(); } };
  N.actions['sync-share'] = () => { navigator.share({ title: 'Nido', text: 'Código para compartir Nido: ' + Sync.invite() }).catch(() => {}); };
  N.actions['sync-now'] = async () => { await Sync.syncNow(); UI.toast(Sync.status === 'ok' ? 'Todo al día' : Sync.error || 'Sin conexión'); UI.render(); };
  N.actions['sync-leave'] = () => UI.confirm('¿Dejar de compartir en este móvil?', 'Los datos se quedan aquí, pero dejarán de recibir y enviar cambios. Los demás cuidadores siguen igual.', 'Dejar de compartir', () => { Sync.leave(); UI.render(); });
  N.actions['sync-destroy'] = () => UI.confirm('¿Borrar la familia del servidor?', 'Se borran del servidor todos los datos cifrados y el código deja de funcionar en todos los móviles. Cada móvil conserva su copia local.', 'Borrar del servidor', async () => {
    try { await Sync.destroy(); UI.toast('Familia borrada del servidor'); } catch (e) { UI.toast(e.message); } UI.render();
  });
  N.actions['sync-rotate'] = () => UI.confirm('¿Cambiar la clave?', 'Se crea un código nuevo y el anterior deja de funcionar. Tendrás que enviar el nuevo código a los demás cuidadores.', 'Cambiar la clave', async () => {
    try { await Sync.rotate(); UI.render(); N.actions['sync-show'](); } catch (e) { UI.toast(e.message); }
  });
})(window.Nido = window.Nido || {});
