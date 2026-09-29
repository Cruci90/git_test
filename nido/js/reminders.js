/* ==========================================================================
   Nido · Avisos
   Calcula los avisos a partir de los datos (plan de siestas, última toma,
   citas, vitamina D, alérgenos del plan) y de los que pide el usuario
   (próxima dosis). Se comprueban cada 30 s mientras la app está abierta,
   también en segundo plano, y se muestran como notificación del sistema si
   hay permiso y, siempre, dentro de la app.
   Límite honesto: una web no puede despertarse sola con la app cerrada sin
   un servidor de notificaciones push, así que con Nido cerrado no avisa.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, icon } = N;
  const R = {};
  N.Reminders = R;
  const WINDOW = 30 * U.MIN; // un aviso que se pasó hace más de 30 min ya no se muestra

  R.list = (now = Date.now(), horizon = U.DAY) => {
    const b = S.baby(); if (!b) return [];
    const cfg = S.reminderSettings(), out = [], today = U.dayKey(now);
    const add = (key, at, title, body, hash, kind) => { if (at > now - WINDOW && at < now + horizon) out.push({ key, at, title, body, hash, kind }); };

    if (cfg.nap.on || cfg.bed.on) {
      const plan = S.dayPlan(now);
      plan.items.forEach((x) => {
        if (cfg.nap.on && x.kind === 'nap' && x.state === 'planned') add(`nap:${today}:${x.idx}`, x.start - cfg.nap.before * U.MIN, `Siesta ${x.idx + 1} en ${cfg.nap.before} min`, `Prevista a las ${U.time(x.start)}. Empieza a bajar el ritmo: luz tenue y calma.`, 'sueno', 'nap');
        if (cfg.bed.on && x.kind === 'bed' && x.state !== 'done') add(`bed:${today}`, x.t - cfg.bed.before * U.MIN, `A la cama en ${cfg.bed.before} min`, `Hora prevista: ${U.time(x.t)}. Buen momento para el baño o la rutina.`, 'sueno', 'bed');
      });
    }
    if (cfg.feed.on) {
      const last = S.feeds().pop();
      if (last) {
        const at = last.time + cfg.feed.hours * U.HOUR, h = new Date(at).getHours();
        if (h >= 7 && h < 21 && !S.activeSleep()) add(`feed:${last.id}`, at, 'Hora de ofrecer una toma', `La última fue a las ${U.time(last.time)}.`, 'tomas', 'feed');
      }
    }
    if (cfg.appt.on) S.upcoming().forEach((a) => {
      const t = U.fromInputs(a.date, a.time || '09:00');
      add(`appt:${a.id}:eve`, U.parseDay(a.date) - 4 * U.HOUR, `Mañana: ${a.title}`, `${a.time ? 'A las ' + a.time : ''}${a.place ? ' · ' + a.place : ''}${(a.questions || []).some((q) => !q.done) ? ' · revisa las preguntas' : ''}`, 'salud', 'appt');
      if (a.time) add(`appt:${a.id}:1h`, t - U.HOUR, `En 1 hora: ${a.title}`, a.place || '', 'salud', 'appt');
    });
    if (cfg.vitd.on) {
      const meds = Store.list('meds'), vd = meds.filter((m) => /vitamina d/i.test(m.name));
      if (vd.length && !S.onDay(meds, today).some((m) => /vitamina d/i.test(m.name))) add(`vitd:${today}`, U.fromInputs(today, cfg.vitd.time), 'Vitamina D', 'Aún no está anotada la dosis de hoy.', 'hoy', 'vitd');
    }
    if (cfg.allergen.on && S.ageMonths(now) >= 5.5 && N.BlwPlan) {
      const d = N.BlwPlan.current().days.find((x) => x.date === today);
      if (d && d.allergen && !S.onDay(S.meals(), today).some((m) => m.foods.some((f) => f.id === d.allergen.food)))
        add(`al:${today}`, U.fromInputs(today, cfg.allergen.time), `Alérgeno de hoy: ${d.allergen.name}`, 'Ofrécelo por la mañana y observa 2 horas.', 'blw', 'allergen');
    }
    if (cfg.meds.on) Store.list('reminders').forEach((r) => add(`rem:${r.id}`, r.at, r.title, r.body || '', r.hash || 'salud', 'med'));
    return out.sort((a, b) => a.at - b.at);
  };

  R.fire = (it) => {
    const b = S.baby();
    const title = `${b ? b.name + ' · ' : ''}${it.title}`;
    UI.toast(`${title}${it.body ? ' — ' + it.body : ''}`, () => UI.go(it.hash), 'Ver');
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body: it.body, tag: it.key, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { hash: it.hash } };
    // Mejor a través del service worker (funciona en móvil y al tocarla abre Nido); si no, desde la página.
    const page = () => { try { const n = new Notification(title, opts); n.onclick = () => { window.focus(); UI.go(it.hash); }; } catch (e) { /* sin notificaciones */ } };
    const sw = navigator.serviceWorker;
    if (!sw) return page();
    sw.getRegistration().then((reg) => (reg && reg.active ? reg.showNotification(title, opts) : page())).catch(page);
  };

  R.check = (now = Date.now()) => {
    const sent = Store.state.sent || (Store.state.sent = {});
    let changed = false;
    R.list(now, 0).forEach((it) => { if (it.at <= now && !sent[it.key]) { sent[it.key] = now; changed = true; R.fire(it); } });
    // Limpia avisos enviados hace más de 3 días y recordatorios de dosis ya pasados.
    Object.keys(sent).forEach((k) => { if (now - sent[k] > 3 * U.DAY) { delete sent[k]; changed = true; } });
    const old = Store.state.reminders.filter((r) => r.at < now - U.DAY);
    if (old.length) { Store.state.reminders = Store.state.reminders.filter((r) => r.at >= now - U.DAY); changed = true; }
    if (changed) Store.save();
  };

  R.permission = () => (!('Notification' in window) ? 'unsupported' : Notification.permission);

  /* ---------- Tarjeta de ajustes ---------- */
  R.card = () => {
    const cfg = S.reminderSettings(), perm = R.permission();
    const permTxt = { granted: UI.pill('Notificaciones activadas', 'good'), denied: UI.pill('Bloqueadas en el navegador', 'crit'), default: '', unsupported: UI.pill('Este navegador no las admite', 'muted') }[perm];
    const row = (k, label, param) => `<li class="rem-set"><label class="switch"><input type="checkbox" data-act="rem-toggle" data-k="${k}" ${cfg[k].on ? 'checked' : ''}><span></span></label><span class="rem-l">${label}</span>${param || ''}</li>`;
    const num = (k, p, unit, min, max) => `<span class="rem-p"><input type="number" data-rem="${k}.${p}" value="${cfg[k][p]}" min="${min}" max="${max}" aria-label="${unit}"><i>${unit}</i></span>`;
    const time = (k) => `<span class="rem-p"><input type="time" data-rem="${k}.time" value="${cfg[k].time}" aria-label="Hora"></span>`;
    const next = R.list(Date.now(), U.DAY).filter((x) => x.at > Date.now()).slice(0, 5);
    return `<p class="small">${permTxt} ${perm === 'default' ? `<button type="button" class="btn primary sm" data-act="rem-permission">${icon('bell')}Activar notificaciones</button>` : ''}</p>
      <ul class="rem-list">
        ${row('nap', 'Antes de cada siesta prevista', num('nap', 'before', 'min', 0, 60))}
        ${row('bed', 'Antes de la hora de dormir', num('bed', 'before', 'min', 0, 90))}
        ${row('feed', 'Si pasa tiempo sin toma (de día)', num('feed', 'hours', 'h', 1, 8))}
        ${row('appt', 'Citas: la víspera y 1 h antes')}
        ${row('vitd', 'Vitamina D si no está anotada', time('vitd'))}
        ${row('allergen', 'Alérgeno del plan de BLW', time('allergen'))}
        ${row('meds', 'Próxima dosis de medicación')}
      </ul>
      ${next.length ? `<h3 class="day-h">Próximos avisos</h3><ul class="rows">${next.map((x) => `<li><div class="row"><span>${U.relDay(U.dayKey(x.at))} ${U.time(x.at)}</span><b>${U.esc(x.title)}</b></div></li>`).join('')}</ul>` : ''}
      <p class="muted small pad-t">Avisa mientras Nido está abierta, aunque sea en segundo plano. Con la app cerrada del todo no puede avisar, porque eso necesitaría un servidor de notificaciones.${N.install.framed() ? ' Dentro de otra página solo se muestran dentro de la app.' : ''}</p>`;
  };

  N.actions['rem-permission'] = () => {
    try {
      Promise.resolve(Notification.requestPermission()).then((p) => { UI.render(); UI.toast(p === 'granted' ? 'Notificaciones activadas' : 'Sin permiso: los avisos se verán dentro de la app'); });
    } catch (e) { UI.toast('Este navegador no permite notificaciones'); }
  };
  const setCfg = (k, patch) => {
    const all = Store.state.settings.reminders || (Store.state.settings.reminders = {});
    all[k] = Object.assign({}, all[k], patch); Store.commit();
  };
  N.actions['rem-toggle'] = (el) => setCfg(el.dataset.k, { on: el.checked });
  document.addEventListener('change', (e) => {
    const k = e.target.dataset && e.target.dataset.rem; if (!k) return;
    const [key, p] = k.split('.');
    setCfg(key, { [p]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });
  });
})(window.Nido = window.Nido || {});
