(() => {
  'use strict';

  const SECTIONS = window.PD1_SECTIONS;
  const EXAM = window.PD1_EXAM;
  const LIMITS = window.PD1_LIMITS;
  const COMP = window.PD1_COMPONENTS;
  const SEC = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
  const PASS_PCT = 68;
  const STORE_KEY = 'pd1-study-v1';
  const app = document.getElementById('app');

  // ---------- Utilidades ----------
  const esc = str => String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const hash = str => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  };

  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const pct = (c, t) => (t ? Math.round((c / t) * 100) : 0);
  const fmtTime = s => {
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };
  const fmtDate = ts => new Date(ts).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

  // Diálogos propios: alert/confirm nativos están bloqueados en vistas previas con sandbox.
  const dialog = (msg, withCancel) => new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">
      <p>${esc(msg)}</p>
      <div class="row right-row">
        ${withCancel ? '<button class="btn ghost" data-r="0">Cancelar</button>' : ''}
        <button class="btn primary" data-r="1">Aceptar</button>
      </div></div>`;
    const close = r => { wrap.remove(); document.removeEventListener('keydown', onKey, true); resolve(r); };
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(false); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(true); }
    };
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-r]');
      if (b) close(b.dataset.r === '1');
      else if (e.target === wrap && withCancel) close(false);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    wrap.querySelector('[data-r="1"]').focus();
  });
  const notify = msg => dialog(msg, false);
  const ask = msg => dialog(msg, true);

  // ---------- Persistencia ----------
  const defaultStore = () => ({ stats: {}, history: [], active: null, custom: [] });
  let store;
  try {
    store = Object.assign(defaultStore(), JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
  } catch (e) {
    store = defaultStore();
  }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* sin almacenamiento */ }
  };

  // ---------- Banco de preguntas ----------
  let BANK = [];
  let BY_ID = {};
  const buildBank = () => {
    const all = (window.PD1_QUESTIONS || []).concat(store.custom || []);
    const seen = new Set();
    BANK = [];
    for (const q of all) {
      if (!q || !SEC[q.s] || !Array.isArray(q.o) || !Array.isArray(q.a)) continue;
      const id = q.s + '-' + hash(q.q + '|' + q.o.join('|'));
      if (seen.has(id)) continue;
      seen.add(id);
      BANK.push(Object.assign({}, q, { id }));
    }
    BY_ID = Object.fromEntries(BANK.map(q => [q.id, q]));
  };
  buildBank();

  const bankBySection = sid => BANK.filter(q => q.s === sid);
  const statOf = id => store.stats[id] || { seen: 0, correct: 0, lastWrong: false };

  // Prioriza preguntas no vistas y falladas, con algo de aleatoriedad.
  const priority = q => {
    const st = statOf(q.id);
    let p = Math.random();
    if (st.seen === 0) p += 1.2;
    if (st.lastWrong) p += 1.6;
    if (st.seen) p += (1 - st.correct / st.seen);
    return p;
  };
  const pickSmart = (pool, n) => pool
    .map(q => ({ q, p: priority(q) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, n)
    .map(x => x.q);

  // Reparte n preguntas por pesos (método del mayor resto).
  const distribute = n => {
    const raw = SECTIONS.map(s => ({ id: s.id, v: (n * s.weight) / 100 }));
    const out = Object.fromEntries(raw.map(r => [r.id, Math.floor(r.v)]));
    let rest = n - Object.values(out).reduce((a, b) => a + b, 0);
    raw.sort((a, b) => (b.v % 1) - (a.v % 1));
    for (let i = 0; rest > 0; i = (i + 1) % raw.length, rest--) out[raw[i].id]++;
    return out;
  };

  const makeItems = qs => qs.map(q => ({ id: q.id, order: shuffle(q.o.map((_, i) => i)) }));

  // ---------- Sesiones ----------
  const newSession = (mode, questions, opts = {}) => {
    store.active = {
      mode,
      title: opts.title || (mode === 'exam' ? 'Examen simulado' : 'Práctica'),
      items: makeItems(questions),
      answers: {},
      checked: {},
      flags: [],
      current: 0,
      immediate: !!opts.immediate,
      startedAt: Date.now(),
      duration: opts.duration || 0,
      submitted: false
    };
    save();
    go('session');
  };

  const startExam = n => {
    const dist = distribute(n);
    let qs = [];
    for (const s of SECTIONS) qs = qs.concat(pickSmart(bankBySection(s.id), dist[s.id]));
    const minutes = Math.round((105 * n) / 60);
    newSession('exam', shuffle(qs), {
      title: n === 60 ? 'Examen completo (60 preguntas)' : `Mini examen (${n} preguntas)`,
      duration: minutes * 60
    });
  };

  const startPractice = ({ sections, count, source, immediate, topic }) => {
    let pool = BANK.filter(q => sections.includes(q.s));
    if (topic) pool = pool.filter(q => q.t === topic);
    if (source === 'unseen') pool = pool.filter(q => statOf(q.id).seen === 0);
    if (source === 'wrong') pool = pool.filter(q => statOf(q.id).lastWrong);
    if (!pool.length) {
      notify('No hay preguntas que cumplan esos filtros.');
      return;
    }
    const n = count === 'all' ? pool.length : Math.min(Number(count), pool.length);
    newSession('practice', shuffle(pickSmart(pool, n)), {
      immediate,
      title: topic ? `Práctica: ${topic}` : source === 'wrong' ? 'Repaso de falladas' : 'Práctica'
    });
  };

  const isCorrect = (q, sel) => {
    if (!sel || sel.length !== q.a.length) return false;
    const s = new Set(sel);
    return q.a.every(i => s.has(i));
  };

  const recordAnswer = (q, correct) => {
    const st = statOf(q.id);
    st.seen++;
    if (correct) st.correct++;
    st.lastWrong = !correct;
    st.last = Date.now();
    store.stats[q.id] = st;
  };

  const submitSession = () => {
    const S = store.active;
    if (!S || S.submitted) return;
    const bySection = {};
    let correct = 0;
    S.items.forEach((it, idx) => {
      const q = BY_ID[it.id];
      if (!q) return;
      const ok = isCorrect(q, S.answers[idx]);
      if (!S.checked[idx]) recordAnswer(q, ok);
      bySection[q.s] = bySection[q.s] || { c: 0, t: 0 };
      bySection[q.s].t++;
      if (ok) { bySection[q.s].c++; correct++; }
    });
    S.submitted = true;
    S.finishedAt = Date.now();
    S.result = { correct, total: S.items.length, bySection };
    store.history.unshift({
      date: S.finishedAt,
      mode: S.mode,
      title: S.title,
      correct,
      total: S.items.length,
      pct: pct(correct, S.items.length),
      bySection,
      seconds: Math.round((S.finishedAt - S.startedAt) / 1000)
    });
    store.history = store.history.slice(0, 200);
    save();
    go('results');
  };

  // ---------- Navegación ----------
  let view = 'home';
  let timer = null;
  const go = v => {
    view = v;
    clearInterval(timer);
    document.querySelectorAll('#tabs button').forEach(b => {
      const tab = b.dataset.view;
      const active = tab === v || (v === 'session' || v === 'results') && store.active &&
        tab === (store.active.mode === 'exam' ? 'exam' : 'practice');
      b.classList.toggle('active', !!active);
    });
    render();
    window.scrollTo(0, 0);
  };
  document.getElementById('tabs').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) go(b.dataset.view);
  });

  const render = () => {
    const views = { home, guide, practice, exam, history, session, results };
    app.innerHTML = (views[view] || home)();
    after[view] && after[view]();
  };
  const after = {};

  // ---------- Componentes ----------
  const sectionAccuracy = sid => {
    let seen = 0, correct = 0, answered = 0;
    for (const q of bankBySection(sid)) {
      const st = statOf(q.id);
      if (st.seen) answered++;
      seen += st.seen; correct += st.correct;
    }
    return { acc: pct(correct, seen), seen, answered, total: bankBySection(sid).length };
  };

  const weightBar = () => `
    <div class="weightbar">
      ${SECTIONS.map(s => `<div style="flex:${s.weight};background:${s.color}" title="${esc(s.name)} ${s.weight}%"><span>${s.weight}%</span></div>`).join('')}
    </div>
    <ul class="legend">
      ${SECTIONS.map(s => `<li><i style="background:${s.color}"></i>${esc(s.name)} <b>${s.weight}%</b> · ~${distribute(60)[s.id]} preguntas</li>`).join('')}
    </ul>`;

  const continueBanner = () => {
    const S = store.active;
    if (!S || S.submitted) return '';
    const done = Object.keys(S.answers).length;
    return `<div class="card banner">
      <div><b>Sesión en curso:</b> ${esc(S.title)} · ${done}/${S.items.length} respondidas</div>
      <div class="row">
        <button class="btn primary" data-act="resume">Continuar</button>
        <button class="btn ghost" data-act="discard">Descartar</button>
      </div>
    </div>`;
  };

  const bindCommon = () => {
    app.querySelectorAll('[data-act="resume"]').forEach(b => b.onclick = () => go('session'));
    app.querySelectorAll('[data-act="discard"]').forEach(b => b.onclick = () => {
      ask('¿Descartar la sesión en curso?').then(ok => { if (ok) { store.active = null; save(); render(); } });
    });
    app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    app.querySelectorAll('[data-exam]').forEach(b => b.onclick = () => startExam(Number(b.dataset.exam)));
    app.querySelectorAll('[data-practice-sec]').forEach(b => b.onclick = () =>
      startPractice({ sections: [b.dataset.practiceSec], count: 15, source: 'all', immediate: true }));
    app.querySelectorAll('[data-practice-topic]').forEach(b => b.onclick = () =>
      startPractice({ sections: SECTIONS.map(s => s.id), count: 'all', source: 'all', immediate: true, topic: b.dataset.practiceTopic }));
    app.querySelectorAll('[data-wrong]').forEach(b => b.onclick = () =>
      startPractice({ sections: SECTIONS.map(s => s.id), count: 'all', source: 'wrong', immediate: true }));
  };

  // ---------- Vista: Inicio ----------
  function home() {
    const last = store.history.filter(h => h.mode === 'exam').slice(0, 5);
    const wrong = BANK.filter(q => statOf(q.id).lastWrong).length;
    const answered = BANK.filter(q => statOf(q.id).seen).length;
    return `
      ${continueBanner()}
      <section class="hero card">
        <div>
          <p class="eyebrow">${esc(EXAM.code)}</p>
          <h1>${esc(EXAM.name)}</h1>
          <p class="muted">60 preguntas · 105 minutos · aprobado con ${PASS_PCT}%. Estudia por secciones y genera exámenes ponderados como el real.</p>
          <div class="row wrap">
            <button class="btn primary" data-exam="60">Examen completo</button>
            <button class="btn" data-exam="30">Mini examen (30)</button>
            <button class="btn" data-go="practice">Practicar</button>
            ${wrong ? `<button class="btn warn" data-wrong>Repasar ${wrong} falladas</button>` : ''}
          </div>
        </div>
        <div class="hero-stats">
          <div><b>${BANK.length}</b><span>preguntas</span></div>
          <div><b>${answered}</b><span>vistas</span></div>
          <div><b>${store.history.filter(h => h.mode === 'exam').length}</b><span>exámenes</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Pesos del examen</h2>
        ${weightBar()}
      </section>

      <section class="grid4">
        ${SECTIONS.map(s => {
          const a = sectionAccuracy(s.id);
          return `<div class="card sec" style="--sc:${s.color}">
            <div class="sec-head"><span class="pill">${s.weight}%</span><h3>${esc(s.name)}</h3></div>
            <div class="meter"><div style="width:${a.seen ? a.acc : 0}%"></div></div>
            <p class="muted small">${a.seen ? `Acierto ${a.acc}% · ` : ''}${a.answered}/${a.total} preguntas vistas</p>
            <button class="btn small" data-practice-sec="${s.id}">Practicar sección</button>
          </div>`;
        }).join('')}
      </section>

      <section class="card">
        <h2>Datos del examen</h2>
        <dl class="facts">
          ${EXAM.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
        </dl>
        <ul class="notes">${EXAM.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
      </section>

      ${last.length ? `<section class="card">
        <h2>Últimos exámenes</h2>
        <table class="tbl"><tbody>
          ${last.map(h => `<tr><td>${fmtDate(h.date)}</td><td>${esc(h.title)}</td><td class="num ${h.pct >= PASS_PCT ? 'ok' : 'bad'}">${h.pct}%</td></tr>`).join('')}
        </tbody></table>
      </section>` : ''}
    `;
  }
  after.home = bindCommon;

  // ---------- Vista: Guía ----------
  function guide() {
    const topics = {};
    BANK.forEach(q => { (topics[q.s] = topics[q.s] || {})[q.t] = (topics[q.s][q.t] || 0) + 1; });
    return `
      <section class="card">
        <h1>Guía de estudio</h1>
        <p class="muted">Objetivos oficiales resumidos, apuntes clave y temas del banco de preguntas por sección.</p>
        ${weightBar()}
      </section>
      ${SECTIONS.map(s => `
        <section class="card sec-guide" style="--sc:${s.color}">
          <div class="sec-head">
            <span class="pill">${s.weight}%</span>
            <h2>${esc(s.name)}</h2>
            <button class="btn small right" data-practice-sec="${s.id}">Practicar</button>
          </div>
          <details open>
            <summary>Objetivos del examen</summary>
            <ol>${s.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ol>
          </details>
          <details open>
            <summary>Apuntes clave</summary>
            <ul class="keynotes">${s.notes.map(n => `<li>${n}</li>`).join('')}</ul>
          </details>
          <details>
            <summary>Temas (${Object.keys(topics[s.id] || {}).length})</summary>
            <div class="chips">
              ${Object.entries(topics[s.id] || {}).map(([t, n]) =>
                `<button class="chip" data-practice-topic="${esc(t)}">${esc(t)} <small>${n}</small></button>`).join('')}
            </div>
          </details>
        </section>`).join('')}
      ${COMP ? `<section class="card sec-guide" style="--sc:${SEC.ui.color}">
        <div class="sec-head">
          <span class="pill">UI</span>
          <h2>Componentes base (Lightning Component Reference)</h2>
          <button class="btn small right" data-practice-topic="Componentes base">Practicar</button>
        </div>
        <ul class="keynotes">${COMP.intro.map(n => `<li>${n}</li>`).join('')}</ul>
        <details open>
          <summary>Sintaxis LWC vs Aura</summary>
          <table class="tbl">
            <thead><tr><th></th><th>Ejemplo</th><th>Regla</th></tr></thead>
            <tbody>${COMP.syntax.map(([k, ex, rule]) => `<tr><td><b>${esc(k)}</b></td><td><code>${esc(ex)}</code></td><td>${esc(rule)}</td></tr>`).join('')}</tbody>
          </table>
        </details>
        ${COMP.groups.map(g => `<details>
          <summary>${esc(g.name)} (${g.items.length})</summary>
          <dl class="comp-list">${g.items.map(([n, d]) => `<dt><code>${esc(n)}</code></dt><dd>${esc(d)}</dd>`).join('')}</dl>
        </details>`).join('')}
        <details open>
          <summary>Consejos para el examen</summary>
          <ul class="keynotes">${COMP.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </details>
        <p class="small muted">Fuente: <a href="${esc(COMP.url)}" target="_blank" rel="noopener">Lightning Component Reference</a></p>
      </section>` : ''}
      <section class="card">
        <h2>Governor limits principales</h2>
        <table class="tbl">
          <thead><tr><th>Límite (por transacción)</th><th>Síncrono</th><th>Asíncrono</th></tr></thead>
          <tbody>${LIMITS.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </section>
      <section class="card">
        <h2>Recursos oficiales</h2>
        <ul class="links">${EXAM.resources.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>
      </section>
    `;
  }
  after.guide = bindCommon;

  // ---------- Vista: Práctica ----------
  function practice() {
    return `
      ${continueBanner()}
      <section class="card">
        <h1>Práctica</h1>
        <p class="muted">Elige secciones y recibe la corrección al instante con la explicación. Se priorizan las preguntas que no has visto o que fallaste.</p>
        <form id="pform" class="form">
          <fieldset>
            <legend>Secciones</legend>
            ${SECTIONS.map(s => `<label class="check"><input type="checkbox" name="sec" value="${s.id}" checked>
              <i style="background:${s.color}"></i>${esc(s.name)} <small class="muted">(${bankBySection(s.id).length})</small></label>`).join('')}
          </fieldset>
          <fieldset>
            <legend>Número de preguntas</legend>
            <div class="seg">
              ${[10, 20, 30, 'all'].map((n, i) => `<label><input type="radio" name="count" value="${n}" ${i === 0 ? 'checked' : ''}><span>${n === 'all' ? 'Todas' : n}</span></label>`).join('')}
            </div>
          </fieldset>
          <fieldset>
            <legend>Origen</legend>
            <div class="seg">
              <label><input type="radio" name="source" value="all" checked><span>Todas</span></label>
              <label><input type="radio" name="source" value="unseen"><span>No vistas</span></label>
              <label><input type="radio" name="source" value="wrong"><span>Falladas</span></label>
            </div>
          </fieldset>
          <label class="check"><input type="checkbox" name="immediate" checked> Corregir cada pregunta al responder</label>
          <div class="row"><button class="btn primary" type="button" id="pstart">Empezar práctica</button></div>
        </form>
      </section>
    `;
  }
  after.practice = () => {
    bindCommon();
    // Botón normal en vez de submit: las vistas previas con sandbox bloquean el envío de formularios.
    const form = document.getElementById('pform');
    form.onsubmit = e => e.preventDefault();
    document.getElementById('pstart').onclick = () => {
      const f = new FormData(form);
      const sections = f.getAll('sec');
      if (!sections.length) { notify('Elige al menos una sección.'); return; }
      startPractice({ sections, count: f.get('count'), source: f.get('source'), immediate: f.get('immediate') === 'on' });
    };
  };

  // ---------- Vista: Examen ----------
  function exam() {
    const d = distribute(60);
    return `
      ${continueBanner()}
      <section class="card">
        <h1>Simulador de examen</h1>
        <p class="muted">Preguntas repartidas según los pesos oficiales, sin corrección hasta el final, con cronómetro y opción de marcar preguntas para revisar. El tiempo se ajusta proporcionalmente (105 min / 60 preguntas).</p>
        <div class="grid3">
          ${[[60, 'Completo', 'Igual que el real'], [30, 'Medio', 'Media sesión'], [15, 'Rápido', 'Calentamiento']].map(([n, t, sub]) => `
            <div class="card inner exam-opt">
              <h3>${t}</h3>
              <p class="big">${n} <small>preguntas</small></p>
              <p class="muted small">${sub} · ${Math.round((105 * n) / 60)} min</p>
              <button class="btn primary" data-exam="${n}">Empezar</button>
            </div>`).join('')}
        </div>
        <h3>Reparto en el examen completo</h3>
        <table class="tbl">
          <thead><tr><th>Sección</th><th>Peso</th><th>Preguntas</th><th>En el banco</th></tr></thead>
          <tbody>${SECTIONS.map(s => `<tr><td><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</td><td>${s.weight}%</td><td>${d[s.id]}</td><td>${bankBySection(s.id).length}</td></tr>`).join('')}</tbody>
        </table>
      </section>
    `;
  }
  after.exam = bindCommon;

  // ---------- Vista: Sesión ----------
  function session() {
    const S = store.active;
    if (!S) return `<section class="card"><p>No hay ninguna sesión activa.</p><button class="btn" data-go="home">Volver</button></section>`;
    if (S.submitted) { view = 'results'; return results(); }
    const idx = S.current;
    const it = S.items[idx];
    const q = BY_ID[it.id];
    const sel = S.answers[idx] || [];
    const multi = q.a.length > 1;
    const checked = S.immediate && S.checked[idx];
    const answeredCount = Object.keys(S.answers).filter(k => (S.answers[k] || []).length).length;
    const flagged = S.flags.includes(idx);

    const opts = it.order.map((oi, pos) => {
      const isSel = sel.includes(oi);
      let cls = isSel ? 'sel' : '';
      if (checked) {
        if (q.a.includes(oi)) cls += ' right';
        else if (isSel) cls += ' wrong';
      }
      return `<button class="opt ${cls}" data-oi="${oi}" ${checked ? 'disabled' : ''}>
        <span class="key">${String.fromCharCode(65 + pos)}</span>
        <span class="otext">${esc(q.o[oi])}</span>
      </button>`;
    }).join('');

    let feedback = '';
    if (checked) {
      const ok = isCorrect(q, sel);
      feedback = `<div class="feedback ${ok ? 'ok' : 'bad'}">
        <b>${ok ? '¡Correcto!' : 'Incorrecto'}</b>
        ${ok ? '' : `<div class="small">Respuesta correcta: ${it.order.map((oi, p) => q.a.includes(oi) ? String.fromCharCode(65 + p) : null).filter(Boolean).join(', ')}</div>`}
        <p>${esc(q.e)}</p>
      </div>`;
    }

    const nav = S.items.map((_, i) => {
      const a = (S.answers[i] || []).length;
      let c = a ? 'done' : '';
      if (S.immediate && S.checked[i]) c = isCorrect(BY_ID[S.items[i].id], S.answers[i]) ? 'ok' : 'bad';
      if (S.flags.includes(i)) c += ' flag';
      if (i === idx) c += ' cur';
      return `<button class="navq ${c}" data-jump="${i}">${i + 1}</button>`;
    }).join('');

    const remaining = S.duration ? S.duration - (Date.now() - S.startedAt) / 1000 : 0;

    return `
      <section class="session">
        <div class="sbar card">
          <div><b>${esc(S.title)}</b><div class="muted small">${answeredCount}/${S.items.length} respondidas</div></div>
          <div class="progress"><div style="width:${pct(answeredCount, S.items.length)}%"></div></div>
          ${S.duration ? `<div class="timer ${remaining < 300 ? 'low' : ''}" id="timer">${fmtTime(remaining)}</div>` : `<div class="timer" id="timer">${fmtTime((Date.now() - S.startedAt) / 1000)}</div>`}
        </div>

        <article class="card qcard" style="--sc:${SEC[q.s].color}">
          <div class="qmeta">
            <span>Pregunta ${idx + 1} de ${S.items.length}</span>
            <span class="tag">${esc(SEC[q.s].name)} · ${esc(q.t)}</span>
          </div>
          <h2 class="qtext">${esc(q.q)}</h2>
          ${q.c ? `<pre class="code"><code>${esc(q.c)}</code></pre>` : ''}
          ${multi ? `<p class="choose">Elige ${q.a.length} respuestas</p>` : ''}
          <div class="opts" id="opts">${opts}</div>
          ${feedback}
          <div class="row between qactions">
            <div class="row">
              <button class="btn ghost" id="prev" ${idx === 0 ? 'disabled' : ''}>← Anterior</button>
              <button class="btn ghost ${flagged ? 'flagged' : ''}" id="flag">${flagged ? '★ Marcada' : '☆ Marcar'}</button>
            </div>
            <div class="row">
              ${S.immediate && !checked ? `<button class="btn primary" id="check" ${sel.length ? '' : 'disabled'}>Comprobar</button>` : ''}
              ${idx < S.items.length - 1
                ? `<button class="btn ${S.immediate && !checked ? '' : 'primary'}" id="next">Siguiente →</button>`
                : `<button class="btn primary" id="finish">Terminar</button>`}
            </div>
          </div>
        </article>

        <div class="card">
          <div class="row between"><h3>Navegador</h3><button class="btn small danger" id="finish2">Entregar ${S.mode === 'exam' ? 'examen' : 'práctica'}</button></div>
          <div class="navgrid">${nav}</div>
          <p class="muted small">Teclas: A–E seleccionar · Enter comprobar/siguiente · ←/→ navegar · M marcar</p>
        </div>
      </section>`;
  }

  after.session = () => {
    const S = store.active;
    if (!S) return bindCommon();
    if (S.submitted) return;
    const idx = S.current;
    const q = BY_ID[S.items[idx].id];
    const multi = q.a.length > 1;

    const select = oi => {
      if (S.immediate && S.checked[idx]) return;
      let sel = (S.answers[idx] || []).slice();
      if (multi) {
        sel = sel.includes(oi) ? sel.filter(x => x !== oi) : sel.concat(oi);
      } else {
        sel = [oi];
      }
      S.answers[idx] = sel;
      save();
      render();
    };
    const move = d => {
      const n = S.current + d;
      if (n >= 0 && n < S.items.length) { S.current = n; save(); render(); }
    };
    const check = () => {
      if (!(S.answers[idx] || []).length) return;
      S.checked[idx] = true;
      recordAnswer(q, isCorrect(q, S.answers[idx]));
      save();
      render();
    };
    const finish = () => {
      const unanswered = S.items.length - Object.keys(S.answers).filter(k => (S.answers[k] || []).length).length;
      const msg = unanswered ? `Tienes ${unanswered} preguntas sin responder. ¿Entregar de todas formas?` : '¿Entregar y ver resultados?';
      ask(msg).then(ok => ok && submitSession());
    };

    app.querySelectorAll('.opt').forEach(b => b.onclick = () => select(Number(b.dataset.oi)));
    app.querySelectorAll('[data-jump]').forEach(b => b.onclick = () => { S.current = Number(b.dataset.jump); save(); render(); });
    const $ = id => document.getElementById(id);
    $('prev') && ($('prev').onclick = () => move(-1));
    $('next') && ($('next').onclick = () => move(1));
    $('check') && ($('check').onclick = check);
    $('finish') && ($('finish').onclick = finish);
    $('finish2').onclick = finish;
    $('flag').onclick = () => {
      S.flags = S.flags.includes(idx) ? S.flags.filter(x => x !== idx) : S.flags.concat(idx);
      save(); render();
    };

    document.onkeydown = e => {
      if (view !== 'session' || e.target.tagName === 'INPUT' || document.querySelector('.modal')) return;
      const k = e.key.toLowerCase();
      const S2 = store.active;
      if (!S2 || S2.submitted) return;
      if (k >= 'a' && k <= 'e') {
        const pos = k.charCodeAt(0) - 97;
        const oi = S2.items[S2.current].order[pos];
        if (oi !== undefined) select(oi);
      } else if (k === 'enter') {
        e.preventDefault();
        if (S2.immediate && !S2.checked[S2.current] && (S2.answers[S2.current] || []).length) check();
        else if (S2.current < S2.items.length - 1) move(1);
      } else if (k === 'arrowright') move(1);
      else if (k === 'arrowleft') move(-1);
      else if (k === 'm') $('flag').click();
    };

    const t = $('timer');
    timer = setInterval(() => {
      if (!store.active || store.active.submitted) return clearInterval(timer);
      const el = (Date.now() - S.startedAt) / 1000;
      if (S.duration) {
        const rem = S.duration - el;
        t.textContent = fmtTime(rem);
        t.classList.toggle('low', rem < 300);
        if (rem <= 0) {
          clearInterval(timer);
          submitSession();
          notify('¡Se acabó el tiempo! Se ha entregado el examen.');
        }
      } else {
        t.textContent = fmtTime(el);
      }
    }, 1000);
  };

  // ---------- Vista: Resultados ----------
  let resultsFilter = 'all';
  function results() {
    const S = store.active;
    if (!S || !S.submitted) return `<section class="card"><p>No hay resultados.</p><button class="btn" data-go="home">Volver</button></section>`;
    const r = S.result;
    const p = pct(r.correct, r.total);
    const pass = p >= PASS_PCT;
    const secs = Math.round((S.finishedAt - S.startedAt) / 1000);

    const list = S.items.map((it, i) => {
      const q = BY_ID[it.id];
      if (!q) return '';
      const sel = S.answers[i] || [];
      const ok = isCorrect(q, sel);
      if (resultsFilter === 'wrong' && ok) return '';
      if (resultsFilter === 'flag' && !S.flags.includes(i)) return '';
      return `<details class="review ${ok ? 'ok' : 'bad'}">
        <summary><span class="badge">${ok ? '✓' : '✗'}</span> <b>${i + 1}.</b> ${esc(q.q)} <span class="tag">${esc(q.t)}</span></summary>
        ${q.c ? `<pre class="code"><code>${esc(q.c)}</code></pre>` : ''}
        <ul class="ropts">
          ${it.order.map((oi, pos) => {
            const c = q.a.includes(oi) ? 'right' : sel.includes(oi) ? 'wrong' : '';
            return `<li class="${c}"><span class="key">${String.fromCharCode(65 + pos)}</span>${esc(q.o[oi])}${sel.includes(oi) ? ' <small>(tu respuesta)</small>' : ''}</li>`;
          }).join('')}
        </ul>
        <p class="expl">${esc(q.e)}</p>
      </details>`;
    }).join('');

    return `
      <section class="card result-head ${pass ? 'pass' : 'fail'}">
        <div class="score">
          <div class="ring" style="--p:${p}"><span>${p}%</span></div>
          <div>
            <p class="eyebrow">${esc(S.title)}</p>
            <h1>${S.mode === 'exam' ? (pass ? 'APROBADO' : 'NO APROBADO') : 'Práctica terminada'}</h1>
            <p class="muted">${r.correct} de ${r.total} correctas · nota de corte ${PASS_PCT}% · tiempo ${fmtTime(secs)}</p>
          </div>
        </div>
        <div class="row wrap">
          ${S.mode === 'exam' ? `<button class="btn primary" data-exam="${r.total}">Nuevo examen</button>` : `<button class="btn primary" data-go="practice">Nueva práctica</button>`}
          <button class="btn" data-wrong>Repasar falladas</button>
          <button class="btn ghost" data-go="home">Inicio</button>
        </div>
      </section>

      <section class="card">
        <h2>Resultado por sección</h2>
        ${SECTIONS.filter(s => r.bySection[s.id]).map(s => {
          const b = r.bySection[s.id];
          const sp = pct(b.c, b.t);
          return `<div class="secres">
            <div class="row between"><span><i class="dot" style="background:${s.color}"></i>${esc(s.name)} <small class="muted">(${s.weight}%)</small></span><b>${b.c}/${b.t} · ${sp}%</b></div>
            <div class="meter" style="--sc:${s.color}"><div style="width:${sp}%"></div><em style="left:${PASS_PCT}%"></em></div>
          </div>`;
        }).join('')}
      </section>

      <section class="card">
        <div class="row between wrap">
          <h2>Revisión</h2>
          <div class="seg" id="rfilter">
            ${[['all', 'Todas'], ['wrong', 'Falladas'], ['flag', 'Marcadas']].map(([v, l]) => `<label><input type="radio" name="rf" value="${v}" ${resultsFilter === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
          </div>
        </div>
        <div class="reviews">${list || '<p class="muted">Nada que mostrar con este filtro.</p>'}</div>
      </section>`;
  }
  after.results = () => {
    bindCommon();
    const f = document.getElementById('rfilter');
    f && f.addEventListener('change', e => { resultsFilter = e.target.value; render(); });
  };

  // ---------- Vista: Progreso ----------
  function history() {
    const H = store.history;
    const exams = H.filter(h => h.mode === 'exam').slice(0, 20).reverse();
    const topics = {};
    BANK.forEach(q => {
      const st = statOf(q.id);
      const k = q.s + '|' + q.t;
      topics[k] = topics[k] || { s: q.s, t: q.t, seen: 0, correct: 0, n: 0 };
      topics[k].n++;
      topics[k].seen += st.seen;
      topics[k].correct += st.correct;
    });
    const trows = Object.values(topics).filter(t => t.seen).sort((a, b) => pct(a.correct, a.seen) - pct(b.correct, b.seen));

    let chart = '';
    if (exams.length > 1) {
      const W = 600, Hh = 180, pad = 28;
      const x = i => pad + (i * (W - 2 * pad)) / (exams.length - 1);
      const y = v => Hh - pad - (v / 100) * (Hh - 2 * pad);
      const pts = exams.map((e, i) => `${x(i)},${y(e.pct)}`).join(' ');
      chart = `<svg viewBox="0 0 ${W} ${Hh}" class="chart" role="img" aria-label="Evolución de notas">
        <line x1="${pad}" x2="${W - pad}" y1="${y(PASS_PCT)}" y2="${y(PASS_PCT)}" class="passline"/>
        <text x="${W - pad}" y="${y(PASS_PCT) - 6}" text-anchor="end" class="axis">${PASS_PCT}%</text>
        <polyline points="${pts}" class="line"/>
        ${exams.map((e, i) => `<circle cx="${x(i)}" cy="${y(e.pct)}" r="4" class="${e.pct >= PASS_PCT ? 'ok' : 'bad'}"><title>${fmtDate(e.date)}: ${e.pct}%</title></circle>`).join('')}
      </svg>`;
    }

    return `
      <section class="card">
        <h1>Progreso</h1>
        ${chart || '<p class="muted">Haz al menos dos exámenes para ver la evolución.</p>'}
      </section>

      <section class="card">
        <h2>Temas más débiles</h2>
        ${trows.length ? `<table class="tbl">
          <thead><tr><th>Tema</th><th>Sección</th><th>Acierto</th><th></th></tr></thead>
          <tbody>${trows.map(t => {
            const p = pct(t.correct, t.seen);
            return `<tr><td>${esc(t.t)}</td><td><i class="dot" style="background:${SEC[t.s].color}"></i>${esc(SEC[t.s].name)}</td>
              <td class="num ${p >= PASS_PCT ? 'ok' : 'bad'}">${p}% <small class="muted">(${t.correct}/${t.seen})</small></td>
              <td><button class="btn small" data-practice-topic="${esc(t.t)}">Practicar</button></td></tr>`;
          }).join('')}</tbody></table>` : '<p class="muted">Aún no hay respuestas registradas.</p>'}
      </section>

      <section class="card">
        <h2>Historial</h2>
        ${H.length ? `<table class="tbl">
          <thead><tr><th>Fecha</th><th>Sesión</th><th>Resultado</th><th>Tiempo</th></tr></thead>
          <tbody>${H.slice(0, 50).map(h => `<tr><td>${fmtDate(h.date)}</td><td>${esc(h.title)}</td>
            <td class="num ${h.pct >= PASS_PCT ? 'ok' : 'bad'}">${h.correct}/${h.total} · ${h.pct}%</td><td>${fmtTime(h.seconds)}</td></tr>`).join('')}</tbody>
        </table>` : '<p class="muted">Sin sesiones todavía.</p>'}
      </section>

      <section class="card">
        <h2>Datos</h2>
        <p class="muted small">El progreso se guarda en este navegador. Puedes exportarlo, importarlo o añadir tus propias preguntas en JSON
        (formato: <code>[{"s":"fund|auto|ui|test","t":"Tema","q":"Pregunta","o":["A","B","C","D"],"a":[1],"e":"Explicación","c":"código opcional"}]</code>).</p>
        <div class="row wrap">
          <button class="btn" id="exp">Exportar progreso</button>
          <label class="btn">Importar progreso<input type="file" id="imp" accept="application/json" hidden></label>
          <label class="btn">Añadir preguntas (JSON)<input type="file" id="impq" accept="application/json" hidden></label>
          <button class="btn danger" id="reset">Borrar progreso</button>
        </div>
        <p class="muted small">Preguntas propias cargadas: ${(store.custom || []).length}</p>
      </section>`;
  }
  after.history = () => {
    bindCommon();
    const readJson = (input, cb) => {
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = () => {
          try { cb(JSON.parse(r.result)); } catch (e) { notify('JSON no válido: ' + e.message); }
        };
        r.readAsText(file);
      };
    };
    document.getElementById('exp').onclick = () => {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pd1-progreso.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };
    readJson(document.getElementById('imp'), data => {
      store = Object.assign(defaultStore(), data);
      save(); buildBank(); render();
    });
    readJson(document.getElementById('impq'), data => {
      const list = Array.isArray(data) ? data : [data];
      const valid = list.filter(q => q && SEC[q.s] && typeof q.q === 'string' && Array.isArray(q.o) && Array.isArray(q.a) && q.a.length);
      store.custom = (store.custom || []).concat(valid);
      save(); buildBank(); render();
      notify(`${valid.length} preguntas añadidas (${list.length - valid.length} descartadas).`);
    });
    document.getElementById('reset').onclick = () => {
      ask('¿Borrar estadísticas, historial y sesión en curso? (Las preguntas propias se conservan)').then(ok => {
        if (!ok) return;
        store = Object.assign(defaultStore(), { custom: store.custom });
        save(); render();
      });
    };
  };

  // Inicio: si hay una sesión a medias, se ofrece continuar desde Inicio.
  render();
})();
