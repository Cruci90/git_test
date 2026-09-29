/* ==========================================================================
   Nido · Capa de interfaz
   Enrutador por hash, hoja inferior (formularios), confirmaciones, avisos,
   tooltip global y temporizadores en vivo.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, Store, icon } = N;
  const UI = {};
  N.UI = UI;
  N.views = {};
  N.actions = {};

  /* ---------- Navegación ---------- */
  UI.NAV = [
    { id: 'hoy', name: 'Hoy', icon: 'home', main: true },
    { id: 'sueno', name: 'Sueño', icon: 'moon', main: true, cls: 'c-sleep' },
    { id: 'tomas', name: 'Tomas', icon: 'bottle', main: true, cls: 'c-feed' },
    { id: 'blw', name: 'BLW', icon: 'leaf', main: true, cls: 'c-blw' },
    { id: 'crecimiento', name: 'Crecimiento', icon: 'ruler', cls: 'c-growth' },
    { id: 'salud', name: 'Salud', icon: 'heart', cls: 'c-health' },
    { id: 'calendario', name: 'Calendario', icon: 'calendar' },
    { id: 'actividades', name: 'Actividades', icon: 'ball', cls: 'c-mile' },
    { id: 'hitos', name: 'Hitos y dientes', icon: 'star', cls: 'c-mile' },
    { id: 'diario', name: 'Diario', icon: 'book' },
    { id: 'informe', name: 'Informe pediatra', icon: 'file' },
    { id: 'ajustes', name: 'Ajustes', icon: 'cog' }
  ];

  UI.current = () => (location.hash || '#hoy').slice(1).split('-')[0] || 'hoy';
  UI.go = (id) => { if (location.hash !== '#' + id) location.hash = id; else UI.render(); };

  UI.renderNav = () => {
    const cur = UI.current();
    const b = N.S.baby();
    const side = document.getElementById('sidenav');
    side.innerHTML = `
      <a class="brand" href="#hoy" aria-label="Nido, inicio">${UI.logo()}<span>Nido</span></a>
      <button class="baby-chip" data-act="switch-baby" type="button">
        <span class="avatar" style="--av:${b && b.sex === 'm' ? 'var(--c-sleep)' : 'var(--c-feed)'}">${b ? U.esc(b.name[0]) : '+'}</span>
        <span class="baby-chip-txt"><b>${b ? U.esc(b.name) : 'Añadir bebé'}</b><small>${b ? U.ageText(b.birth) : ''}</small></span>
        ${icon('right', 'chev')}
      </button>
      <nav class="side-links">${UI.NAV.map((n) => `
        <a href="#${n.id}" class="side-link ${n.cls || ''} ${cur === n.id ? 'on' : ''}" ${cur === n.id ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${n.name}</span></a>`).join('')}
      </nav>
      <p class="side-foot">Registrando como <button type="button" class="link" data-act="caregiver">${U.esc(Store.state.settings.caregiver)}</button></p>`;
    const tab = document.getElementById('tabbar');
    const main = UI.NAV.filter((n) => n.main);
    const inMore = !main.some((n) => n.id === cur);
    tab.innerHTML = main.map((n) => `<a href="#${n.id}" class="tab ${n.cls || ''} ${cur === n.id ? 'on' : ''}">${icon(n.icon)}<span>${n.name}</span></a>`).join('') +
      `<button type="button" class="tab ${inMore ? 'on' : ''}" data-act="more">${icon('grid')}<span>Más</span></button>`;
  };

  UI.logo = () => `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M6 22c0 8 6.3 13 14 13s14-5 14-13" fill="none" stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M9 24c2 5 6 7.5 11 7.5s9-2.5 11-7.5" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="14.5" cy="19" rx="4.4" ry="5.4" fill="var(--c-sleep)"/><ellipse cx="25" cy="18" rx="5" ry="6.2" fill="var(--c-feed)"/>
    <ellipse cx="20" cy="21.5" rx="4.2" ry="5" fill="var(--c-blw)"/></svg>`;

  UI.render = () => {
    const id = UI.current();
    const view = N.views[id] || N.views.hoy;
    const main = document.getElementById('view');
    UI.renderNav();
    if (!N.S.baby() && id !== 'ajustes') { main.innerHTML = N.views.bienvenida.render(); return; }
    const y = window.scrollY, same = main.dataset.view === id;
    main.dataset.view = id;
    main.innerHTML = view.render();
    if (view.mount) view.mount(main);
    N.Media.hydrate(main);
    UI.tick();
    if (same) window.scrollTo(0, y); else window.scrollTo(0, 0);
    document.title = `${N.S.baby() ? N.S.baby().name + ' · ' : ''}Nido`;
  };

  /* ---------- Cabecera de vista ---------- */
  UI.head = (title, sub, actions = '') => `<header class="vhead"><div><h1>${title}</h1>${sub ? `<p class="vsub">${sub}</p>` : ''}</div><div class="vhead-act">${actions}</div></header>`;
  UI.seg = (name, options, value) => `<div class="seg" role="tablist">${options.map(([v, l]) => `<button type="button" role="tab" class="${v === value ? 'on' : ''}" aria-selected="${v === value}" data-act="seg" data-seg="${name}" data-val="${v}">${l}</button>`).join('')}</div>`;
  UI.empty = (ic, title, text, btn = '') => `<div class="empty">${icon(ic)}<b>${title}</b><p>${text}</p>${btn}</div>`;
  UI.pill = (txt, tone = '') => `<span class="pill ${tone}">${txt}</span>`;
  /* Estado local de vistas (pestañas internas, filtros, mes visible…) */
  UI.st = { seg: {}, calMonth: null, calDay: null, foodFilter: 'all', foodQuery: '', growthMetric: 'weight', sleepRange: 7 };

  /* ---------- Hoja inferior ---------- */
  const sheetRoot = () => document.getElementById('sheet');
  UI.sheet = ({ title, body, submit = 'Guardar', onSubmit, onDelete, wide, onMount, footer }) => {
    const root = sheetRoot();
    root.innerHTML = `
      <div class="scrim" data-act="close-sheet"></div>
      <form class="sheet ${wide ? 'wide' : ''}" novalidate role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet-grip" aria-hidden="true"></div>
        <header class="sheet-head"><h2 id="sheet-title">${title}</h2><button type="button" class="icon-btn" data-act="close-sheet" aria-label="Cerrar">${icon('x')}</button></header>
        <div class="sheet-body">${body}</div>
        ${footer !== false ? `<footer class="sheet-foot">
          ${onDelete ? `<button type="button" class="btn ghost danger" data-act="sheet-delete">${icon('trash')}Eliminar</button>` : '<span></span>'}
          ${onSubmit ? `<button type="submit" class="btn primary">${submit}</button>` : ''}
        </footer>` : ''}
      </form>`;
    root.hidden = false;
    document.body.classList.add('locked');
    const form = root.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = UI.formData(form);
      const ok = onSubmit && onSubmit(data, form);
      if (ok !== false) UI.closeSheet();
    });
    UI._onDelete = onDelete;
    if (onMount) onMount(form);
    const first = form.querySelector('.sheet-body input:not([type=hidden]):not([type=radio]):not([type=checkbox]), .sheet-body textarea');
    if (first && window.matchMedia('(pointer:fine)').matches) setTimeout(() => first.focus(), 60);
    return form;
  };
  UI.closeSheet = () => { const r = sheetRoot(); r.hidden = true; r.innerHTML = ''; document.body.classList.remove('locked'); };
  UI.formData = (form) => {
    const out = {};
    new FormData(form).forEach((v, k) => {
      if (k.endsWith('[]')) { const kk = k.slice(0, -2); (out[kk] = out[kk] || []).push(v); } else out[k] = v;
    });
    return out;
  };
  UI.confirm = (title, text, yes, onYes) => {
    UI.sheet({ title, body: `<p class="confirm-text">${text}</p>`, submit: yes, onSubmit: () => { onYes(); } });
    sheetRoot().querySelector('button[type=submit]').classList.add('danger-solid');
  };

  /* ---------- Campos de formulario ---------- */
  const fid = (n) => 'f-' + n.replace(/\W/g, '');
  UI.f = {
    text: (name, label, val = '', attrs = '') => `<label class="fld"><span>${label}</span><input id="${fid(name)}" name="${name}" value="${U.esc(val)}" ${attrs}></label>`,
    num: (name, label, val = '', attrs = '', unit = '') => `<label class="fld"><span>${label}</span><span class="unit-wrap"><input id="${fid(name)}" name="${name}" type="number" inputmode="decimal" value="${val == null ? '' : val}" ${attrs}>${unit ? `<i>${unit}</i>` : ''}</span></label>`,
    date: (name, label, val) => `<label class="fld"><span>${label}</span><input id="${fid(name)}" name="${name}" type="date" value="${val || U.today()}" required></label>`,
    time: (name, label, val) => `<label class="fld"><span>${label}</span><input id="${fid(name)}" name="${name}" type="time" value="${val || U.time(Date.now())}" required></label>`,
    area: (name, label, val = '', ph = '') => `<label class="fld full"><span>${label}</span><textarea id="${fid(name)}" name="${name}" rows="3" placeholder="${ph}">${U.esc(val)}</textarea></label>`,
    select: (name, label, opts, val) => `<label class="fld"><span>${label}</span><select id="${fid(name)}" name="${name}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`,
    chips: (name, label, opts, val, multi) => `<fieldset class="fld full"><legend>${label}</legend><div class="chips">${opts.map(([v, l]) => {
      const on = multi ? (val || []).includes(v) : String(v) === String(val);
      return `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}${multi ? '[]' : ''}" value="${v}" ${on ? 'checked' : ''}><span>${l}</span></label>`;
    }).join('')}</div></fieldset>`,
    row: (...f) => `<div class="frow">${f.join('')}</div>`
  };

  /* ---------- Avisos ---------- */
  let toastT;
  UI.toast = (msg, undo, label = 'Deshacer') => {
    const el = document.getElementById('toast');
    el.innerHTML = `<span>${msg}</span>${undo ? `<button type="button" class="link" data-act="undo">${label}</button>` : ''}`;
    el.hidden = false; el.classList.remove('out');
    UI._undo = undo;
    clearTimeout(toastT);
    toastT = setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.hidden = true; }, 250); }, undo ? 5000 : 2600);
  };
  /* Borrado con deshacer en lugar de un diálogo de confirmación. */
  UI.removeWithUndo = (col, id, label = 'Registro eliminado') => {
    const rec = Store.get(col, id); if (!rec) return;
    const idx = Store.state[col].indexOf(rec);
    Store.remove(col, id);
    UI.toast(label, () => { Store.state[col].splice(idx, 0, rec); Store.commit(); });
  };

  /* ---------- Tooltip global ---------- */
  UI.initTooltip = () => {
    const tip = document.getElementById('tip');
    const show = (el, x, y) => {
      const [h, ...rest] = el.dataset.tip.split('|');
      tip.innerHTML = `<b>${U.esc(h)}</b>${rest.map((r) => `<span>${U.esc(r)}</span>`).join('')}`;
      tip.hidden = false;
      const w = tip.offsetWidth, hh = tip.offsetHeight;
      tip.style.left = U.clamp(x - w / 2, 8, window.innerWidth - w - 8) + 'px';
      tip.style.top = (y - hh - 14 < 8 ? y + 18 : y - hh - 14) + 'px';
    };
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (el) show(el, e.clientX, e.clientY); else tip.hidden = true;
    });
    document.addEventListener('pointerdown', (e) => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (el && e.pointerType !== 'mouse') show(el, e.clientX, e.clientY);
    });
    window.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });
  };

  /* ---------- Temporizadores en vivo ---------- */
  UI.tick = () => {
    document.querySelectorAll('[data-since]').forEach((el) => { el.textContent = U.clock(Date.now() - Number(el.dataset.since)); });
    document.querySelectorAll('[data-until]').forEach((el) => { el.textContent = U.clock(Number(el.dataset.until) - Date.now()); });
    document.querySelectorAll('[data-ago]').forEach((el) => { el.textContent = U.ago(Number(el.dataset.ago)); });
    const b = N.S.activeBreast();
    if (b) document.querySelectorAll('[data-breast]').forEach((el) => {
      const side = el.dataset.breast;
      const acc = (side === 'L' ? b.accL : b.accR) + (b.side === side && b.running ? Date.now() - b.since : 0);
      el.textContent = U.clock(acc);
    });
  };

  /* ---------- Tema ---------- */
  UI.applyTheme = () => {
    const t = Store.state.settings.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  };
})(window.Nido = window.Nido || {});
