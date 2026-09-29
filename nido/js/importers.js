/* ==========================================================================
   Nido · Importar desde Napper
   Napper no tiene API pública. Este importador lee lo que produce la
   herramienta comunitaria napper-export (github.com/brittraee/napper-export):
     · napper_events.csv  → date,event_type,start,end,start_time,end_time,…
     · all_events.json    → [{ category, start, end, comment, … }]
     · sleep_logs_full.json → { "2026-09-01": [ … ], … }
   y, si Napper ofrece una exportación propia con estructura parecida
   (categoría + inicio + fin), también la acepta.
   Napper guarda la noche como hitos: BED_TIME (a la cama), NIGHT_WAKING
   (despertares con inicio y fin) y WOKE_UP (despertar). Aquí se convierten
   en tramos de sueño nocturno, igual que los registra Nido.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, icon } = N;
  const I = {};
  N.Import = I;

  /* ---------- Lectura ---------- */
  I.parseCSV = (text) => {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map((h) => h.trim());
    return rows.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
  };

  /* Marca de tiempo: ISO completo si existe; si no, fecha + HH:MM local. */
  const ts = (iso, date, hm) => {
    if (iso) { const t = Date.parse(iso); if (!isNaN(t)) return t; }
    if (date && /^\d{1,2}:\d{2}/.test(hm || '')) return U.fromInputs(date.slice(0, 10), hm.slice(0, 5));
    return null;
  };
  const truthy = (v) => v === true || /^(true|1|yes|sí|si)$/i.test(String(v || ''));

  /* Convierte cualquiera de los formatos a eventos { cat, start, end, skipped, comment, raw }. */
  I.events = (text) => {
    const t = text.trim();
    let list = [];
    if (t.startsWith('[') || t.startsWith('{')) {
      const j = JSON.parse(t);
      const arr = Array.isArray(j) ? j : Array.isArray(j.allLogs) ? j.allLogs : Array.isArray(j.events) ? j.events : Object.values(j).flat();
      list = arr.filter((e) => e && typeof e === 'object').map((e) => ({
        cat: String(e.category || e.type || e.event_type || '').toUpperCase(),
        start: ts(e.start || e.startTime || e.start_time), end: ts(e.end || e.endTime || e.end_time),
        skipped: truthy(e.skipped) || truthy(e.isSkipped), comment: e.comment || e.note || '', raw: e
      }));
    } else {
      const rows = I.parseCSV(t);
      if (!rows.length || !('event_type' in rows[0] || 'category' in rows[0])) throw new Error('formato');
      list = rows.map((r) => {
        const start = ts(r.start, r.date, r.start_time);
        let end = ts(r.end, r.date, r.end_time);
        if (start && end && end < start && !r.end) end += U.DAY; // HH:MM que cruza medianoche
        return { cat: String(r.event_type || r.category).toUpperCase(), start, end, skipped: truthy(r.skipped), comment: r.comment || '', raw: r };
      });
    }
    return list.filter((e) => e.cat && e.start).sort((a, b) => a.start - b.start);
  };

  const num = (raw, keys) => { for (const k of Object.keys(raw || {})) if (keys.test(k)) { const v = parseFloat(raw[k]); if (!isNaN(v)) return v; } return null; };
  const mins = (v) => (v == null ? null : v > 180 ? Math.round(v / 60) : Math.round(v)); // segundos o minutos

  /* ---------- Conversión a registros de Nido ---------- */
  I.convert = (events, existing = { sleeps: S.sleeps(), keys: new Set(Store.COLLECTIONS.flatMap((c) => Store.list(c).map((x) => x.src).filter(Boolean))) }) => {
    const out = { sleeps: [], feeds: [], meds: [], diapers: [], pumps: [] };
    const skipped = { dup: 0, unsupported: {}, incomplete: 0 };
    const push = (col, rec, src) => {
      rec.src = 'napper:' + src;
      if (existing.keys.has(rec.src)) { skipped.dup++; return; }
      if (col === 'sleeps' && existing.sleeps.some((s) => Math.min(s.end, rec.end) - Math.max(s.start, rec.start) > (rec.end - rec.start) / 2)) { skipped.dup++; return; }
      rec.by = 'Napper'; out[col].push(rec);
    };
    const beds = [], wakes = [], wakings = [];
    events.forEach((e) => {
      const key = `${e.cat}:${e.start}`;
      switch (e.cat) {
        case 'NAP':
          if (e.skipped) return;
          if (!e.end || e.end <= e.start) { skipped.incomplete++; return; }
          push('sleeps', { start: e.start, end: e.end, type: 'nap', place: '', quality: 3, note: e.comment }, key); return;
        case 'BED_TIME': beds.push(e.start); return;
        case 'WOKE_UP': wakes.push(e.start); return;
        case 'NIGHT_WAKING': wakings.push([e.start, e.end && e.end > e.start ? e.end : e.start + 5 * U.MIN]); return;
        case 'NURSING': case 'BREASTFEEDING': {
          const l = mins(num(e.raw, /left/i)), r = mins(num(e.raw, /right/i));
          const total = e.end ? Math.round((e.end - e.start) / U.MIN) : mins(num(e.raw, /duration/i)) || 0;
          const rec = l != null || r != null ? { durL: l || 0, durR: r || 0, lastSide: (r || 0) > (l || 0) ? 'R' : 'L' } : { durL: total, durR: 0, sideUnknown: true };
          push('feeds', Object.assign({ time: e.start, kind: 'breast', note: e.comment }, rec), key); return;
        }
        case 'BOTTLE': case 'FORMULA': {
          const ml = num(e.raw, /^(amount|amountml|volume|quantity|ml)$/i) ?? (String(e.comment).match(/(\d{2,3})\s*ml/i) || [])[1];
          push('feeds', { time: e.start, kind: 'bottle', ml: ml != null ? Number(ml) : null, milk: /f[oó]rmula/i.test(e.cat + e.comment) ? 'formula' : 'materna', note: e.comment }, key); return;
        }
        case 'MEDICINE': case 'MEDICATION':
          push('meds', { time: e.start, name: e.comment || 'Medicina (Napper)', dose: null, unit: 'ml', reason: '' }, key); return;
        case 'PUMPING': case 'PUMP':
          push('pumps', { time: e.start, ml: num(e.raw, /^(amount|amountml|volume|ml)$/i) || 0, side: 'B' }, key); return;
        default:
          if (/DIAPER|POO|PEE|NAPPY/.test(e.cat)) {
            const kind = /POO|DIRTY|SOLID/.test(e.cat + e.comment.toUpperCase()) ? (/PEE|WET/.test(e.cat + e.comment.toUpperCase()) ? 'mixed' : 'dirty') : 'wet';
            push('diapers', { time: e.start, kind, color: kind === 'wet' ? null : 'amarillo', note: e.comment }, key); return;
          }
          skipped.unsupported[e.cat] = (skipped.unsupported[e.cat] || 0) + 1;
      }
    });
    // Noches: de cada BED_TIME al siguiente WOKE_UP (máx. 16 h), partidas por los despertares.
    beds.sort((a, b) => a - b); wakes.sort((a, b) => a - b);
    beds.forEach((bed, i) => {
      const wake = wakes.find((w) => w > bed && w - bed < 16 * U.HOUR && !(beds[i + 1] && beds[i + 1] < w));
      if (!wake) { skipped.incomplete++; return; }
      const inside = wakings.filter(([a, b]) => a > bed && b < wake).sort((x, y) => x[0] - y[0]);
      let cur = bed;
      inside.forEach(([a, b], k) => { if (a > cur) push('sleeps', { start: cur, end: a, type: 'night', place: '', quality: 3 }, `NIGHT:${bed}:${k}`); cur = b; });
      if (wake > cur) push('sleeps', { start: cur, end: wake, type: 'night', place: '', quality: 3 }, `NIGHT:${bed}:end`);
    });
    const all = Object.values(out).flat(), times = all.map((r) => r.time || r.start);
    return { out, skipped, total: all.length, from: times.length ? Math.min(...times) : null, to: times.length ? Math.max(...times) : null };
  };

  I.apply = (res) => {
    const b = Store.state.activeBabyId;
    Object.entries(res.out).forEach(([col, recs]) => recs.forEach((r) => Store.state[col].push(Object.assign({ id: U.uid(), babyId: b }, r))));
    Store.commit();
  };

  /* ---------- Hoja de importación ---------- */
  const LABELS = { sleeps: 'Sueños (siestas y tramos de noche)', feeds: 'Tomas', meds: 'Medicación', diapers: 'Pañales', pumps: 'Extracciones' };
  N.actions['import-napper'] = () => {
    let res = null;
    UI.sheet({
      title: 'Importar desde Napper', submit: 'Importar', wide: true,
      body: `<p class="muted small">Napper no tiene API pública. Puedes traer tus datos con la exportación de Napper, si tu versión la tiene, o con la herramienta comunitaria <b>napper-export</b> (github.com/brittraee/napper-export). Elige <code>napper_events.csv</code>, <code>all_events.json</code> o <code>sleep_logs_full.json</code>.</p>
        <label class="photo-drop small-drop">${icon('upload')}<span>Elegir archivo .csv o .json</span><input type="file" id="f-napper" accept=".csv,.json,text/csv,application/json" hidden></label>
        <details><summary class="small">O pega el contenido</summary><textarea id="f-napper-text" class="code" rows="5" placeholder="date,event_type,start,end,…"></textarea></details>
        <div id="napper-preview"></div>
        <p class="muted small">Se importa en el perfil de <b>${U.esc(S.baby().name)}</b>. Lo que ya esté en Nido (mismo registro o un sueño que se solapa) se salta, así que puedes importar varias veces.</p>`,
      onMount: (form) => {
        const prev = form.querySelector('#napper-preview');
        const run = (text) => {
          try {
            res = I.convert(I.events(text));
            const unsup = Object.entries(res.skipped.unsupported);
            prev.innerHTML = res.total || res.skipped.dup ? `<div class="imp">
              <p><b>${res.total} registros nuevos</b>${res.from ? ` del ${U.date(res.from, true)} al ${U.date(res.to, true)}` : ''}</p>
              <ul class="rows">${Object.entries(res.out).filter(([, v]) => v.length).map(([k, v]) => `<li><div class="row"><span>${LABELS[k]}</span><b>${v.length}</b></div></li>`).join('')}</ul>
              <p class="muted small">${res.skipped.dup ? `${res.skipped.dup} ya estaban en Nido. ` : ''}${res.skipped.incomplete ? `${res.skipped.incomplete} incompletos (sin fin o noche sin despertar). ` : ''}${unsup.length ? `No se importan: ${unsup.map(([k, n]) => `${k.toLowerCase()} (${n})`).join(', ')}.` : ''}
              ${res.out.feeds.some((f) => f.sideUnknown) ? ' Las tomas de pecho sin lado se guardan sin lado.' : ''}</p></div>`
              : '<p class="alert warn">No hay registros que importar en ese archivo.</p>';
          } catch (e) { res = null; prev.innerHTML = '<p class="alert warn">No reconozco el formato. Usa napper_events.csv o los JSON de napper-export.</p>'; }
        };
        form.addEventListener('change', (e) => {
          if (e.target.id !== 'f-napper' || !e.target.files[0]) return;
          const r = new FileReader(); r.onload = () => run(String(r.result)); r.readAsText(e.target.files[0]);
        });
        form.querySelector('#f-napper-text').addEventListener('input', (e) => { if (e.target.value.trim().length > 20) run(e.target.value); });
      },
      onSubmit: () => {
        if (!res || !res.total) { UI.toast('Elige un archivo con registros nuevos'); return false; }
        I.apply(res); UI.toast(`${res.total} registros importados de Napper`); UI.go('sueno');
      }
    });
  };
})(window.Nido = window.Nido || {});
