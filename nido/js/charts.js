/* ==========================================================================
   Nido · Gráficos SVG
   Gráficos pequeños y sin dependencias. Todo el texto usa tokens de tinta;
   las marcas llevan `data-tip` para el tooltip global.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U } = N;
  const C = {};
  N.Charts = C;

  const r1 = (v) => Math.round(v * 10) / 10;
  const svg = (w, h, body, cls = '') => `<svg class="chart ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img">${body}</svg>`;
  /* Barra con extremo superior redondeado (4px) anclada a la base. */
  const bar = (x, y, w, h, rad = 4) => {
    if (h <= 0) return '';
    const r = Math.min(rad, w / 2, h);
    return `M${r1(x)},${r1(y + h)}V${r1(y + r)}Q${r1(x)},${r1(y)} ${r1(x + r)},${r1(y)}H${r1(x + w - r)}Q${r1(x + w)},${r1(y)} ${r1(x + w)},${r1(y + r)}V${r1(y + h)}Z`;
  };
  const niceMax = (v, step) => Math.max(step, Math.ceil(v / step) * step);

  /* ---------- Sueño diario: noche + siestas apiladas, con banda recomendada ---------- */
  C.sleepBars = (days, rec) => {
    const W = 640, H = 220, pl = 34, pr = 8, pt = 12, pb = 26;
    const max = niceMax(Math.max(rec[1], ...days.map((d) => (d.night + d.day) / 60)), 4);
    const y = (h) => pt + (H - pt - pb) * (1 - h / max);
    const bw = (W - pl - pr) / days.length;
    let g = '';
    for (let h = 0; h <= max; h += 4) g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(h)}" y2="${y(h)}"/><text class="ax" x="${pl - 6}" y="${y(h) + 4}" text-anchor="end">${h}h</text>`;
    g += `<rect class="band" x="${pl}" width="${W - pl - pr}" y="${y(rec[1])}" height="${y(rec[0]) - y(rec[1])}"/>`;
    g += `<text class="ax band-label" x="${W - pr - 4}" y="${y(rec[1]) + 12}" text-anchor="end">recomendado ${rec[0]}–${rec[1]} h</text>`;
    days.forEach((d, i) => {
      const x = pl + i * bw + bw * 0.2, w = bw * 0.6;
      const nh = d.night / 60, dh = d.day / 60;
      const tip = `${U.dateLong(d.key)}|Noche ${U.dur(d.night)} · Siestas ${U.dur(d.day)} (${d.naps})|Total ${U.dur(d.night + d.day)}`;
      // Noche abajo; siestas encima con 2px de separación
      const y0 = y(0), y1 = y(nh), y2 = y(nh + dh);
      g += `<g class="hit" data-tip="${U.esc(tip)}"><rect x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}" fill="transparent"/>`;
      if (nh > 0) g += `<path class="m-night" d="${bar(x, y1, w, y0 - y1, dh > 0 ? 0 : 4)}"/>`;
      if (dh > 0) g += `<path class="m-nap" d="${bar(x, y2, w, Math.max(0, y1 - y2 - 2))}"/>`;
      g += '</g>';
      if (days.length <= 14 || i % 2 === (days.length - 1) % 2) {
        const dt = new Date(U.parseDay(d.key));
        g += `<text class="ax ${d.key === U.today() ? 'ax-strong' : ''}" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${days.length <= 7 ? U.WEEKDAYS[dt.getDay()] : dt.getDate()}</text>`;
      }
    });
    return svg(W, H, g);
  };

  /* ---------- Patrón de 24 h: una fila por día, bloques de sueño y marcas de toma ---------- */
  C.pattern = (rows, opts = {}) => {
    const W = 640, rowH = 16, gap = 5, pl = 58, pr = 8, pt = 22;
    const H = pt + rows.length * (rowH + gap) + 4;
    const x = (hour) => pl + (W - pl - pr) * (hour / 24);
    let g = '';
    [0, 3, 6, 9, 12, 15, 18, 21, 24].forEach((h) => {
      g += `<line class="grid" x1="${x(h)}" x2="${x(h)}" y1="${pt - 4}" y2="${H}"/><text class="ax" x="${x(h)}" y="${pt - 9}" text-anchor="middle">${String(h % 24).padStart(2, '0')}</text>`;
    });
    rows.forEach((r, i) => {
      const y = pt + i * (rowH + gap);
      const day0 = U.parseDay(r.key);
      const dt = new Date(day0);
      g += `<text class="ax ${r.key === U.today() ? 'ax-strong' : ''}" x="${pl - 8}" y="${y + rowH - 4}" text-anchor="end">${U.WEEKDAYS[dt.getDay()]} ${dt.getDate()}</text>`;
      g += `<rect class="track" x="${pl}" y="${y}" width="${W - pl - pr}" height="${rowH}" rx="4"/>`;
      r.blocks.forEach((b) => {
        const a = (b.a - day0) / U.HOUR, e = (b.b - day0) / U.HOUR;
        const w = Math.max(1.5, x(e) - x(a) - 1);
        g += `<rect class="${b.type === 'nap' ? 'm-nap' : 'm-night'}" x="${r1(x(a))}" y="${y}" width="${r1(w)}" height="${rowH}" rx="3" data-tip="${U.esc(`${b.type === 'nap' ? 'Siesta' : 'Noche'}|${U.time(b.a)} – ${U.time(b.b)} · ${U.dur((b.b - b.a) / U.MIN)}`)}"/>`;
      });
      if (opts.feeds) (r.feeds || []).forEach((t) => {
        const h = (t - day0) / U.HOUR;
        g += `<circle class="m-feed" cx="${r1(x(h))}" cy="${y + rowH / 2}" r="3.2" data-tip="Toma|${U.time(t)}"/>`;
      });
    });
    return svg(W, H, g, 'pattern');
  };

  /* ---------- Curva de crecimiento OMS ---------- */
  C.growth = (metric, sex, points, opts = {}) => {
    const W = 640, H = 300, pl = 40, pr = 40, pt = 12, pb = 30;
    const maxAge = opts.maxAge || 12;
    const S = N.S;
    const zs = [-1.881, -1.036, 0, 1.036, 1.881]; // P3, P15, P50, P85, P97
    const vals = []; for (let m = 0; m <= maxAge; m += 0.25) vals.push(m);
    const curve = (z) => vals.map((m) => [m, S.valueAtZ(metric, sex, m, z)]);
    const curves = zs.map(curve);
    const lo = Math.min(...curves[0].map((p) => p[1]), ...points.map((p) => p.v));
    const hi = Math.max(...curves[4].map((p) => p[1]), ...points.map((p) => p.v));
    const step = metric === 'weight' ? 1 : 2;
    const yMin = Math.floor(lo / step) * step, yMax = Math.ceil(hi / step) * step;
    const X = (m) => pl + (W - pl - pr) * (m / maxAge);
    const Y = (v) => pt + (H - pt - pb) * (1 - (v - yMin) / (yMax - yMin));
    const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${r1(X(p[0]))},${r1(Y(p[1]))}`).join('');
    const area = (a, b) => path(a) + b.slice().reverse().map((p) => `L${r1(X(p[0]))},${r1(Y(p[1]))}`).join('') + 'Z';
    let g = '';
    const ystep = (yMax - yMin) / step > 10 ? step * 2 : step;
    for (let v = yMin; v <= yMax + 1e-9; v += ystep) g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    const xstep = maxAge > 12 ? 3 : maxAge > 6 ? 2 : 1;
    for (let m = 0; m <= maxAge; m += xstep) g += `<text class="ax" x="${X(m)}" y="${H - 10}" text-anchor="middle">${m}m</text>`;
    g += `<path class="p-band-out" d="${area(curves[0], curves[4])}"/><path class="p-band-in" d="${area(curves[1], curves[3])}"/>`;
    ['P3', 'P15', 'P50', 'P85', 'P97'].forEach((lbl, i) => {
      g += `<path class="${i === 2 ? 'p-median' : 'p-line'}" d="${path(curves[i])}"/>`;
      const last = curves[i][curves[i].length - 1];
      g += `<text class="ax p-lbl" x="${W - pr + 4}" y="${Y(last[1]) + 4}">${lbl}</text>`;
    });
    if (points.length) {
      g += `<path class="m-line" d="${path(points.map((p) => [p.age, p.v]))}"/>`;
      points.forEach((p, i) => {
        const pc = S.percentile(metric, sex, p.age, p.v);
        const tip = `${U.date(p.date, true)} · ${U.ageShort(N.S.baby().birth, U.parseDay(p.date))}|${U.num(p.v, N.METRICS[metric].digits)} ${N.METRICS[metric].unit}|Percentil ${Math.round(pc)}`;
        g += `<circle class="m-dot ${i === points.length - 1 ? 'last' : ''}" cx="${r1(X(p.age))}" cy="${r1(Y(p.v))}" r="${i === points.length - 1 ? 6 : 4.5}" data-tip="${U.esc(tip)}"/>`;
      });
    }
    if (opts.now != null) g += `<line class="now-line" x1="${X(opts.now)}" x2="${X(opts.now)}" y1="${pt}" y2="${H - pb}"/>`;
    return svg(W, H, g, 'growth');
  };

  /* ---------- Anillo de progreso ---------- */
  C.ring = (value, max, size = 120, stroke = 12, cls = '') => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = U.clamp(value / max, 0, 1);
    return `<svg class="ring ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"/>
      <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
        stroke-dasharray="${r1(c * p)} ${r1(c)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  };

  /* ---------- Barras simples (tomas/pañales por día) ---------- */
  C.miniBars = (items, cls = 'm-feed') => {
    const W = 320, H = 90, pb = 18, pt = 14;
    const max = Math.max(1, ...items.map((d) => d.v));
    const bw = W / items.length;
    let g = '';
    items.forEach((d, i) => {
      const h = (H - pb - pt) * (d.v / max);
      const x = i * bw + bw * 0.22, w = bw * 0.56;
      g += `<g data-tip="${U.esc(d.tip)}"><rect x="${i * bw}" y="0" width="${bw}" height="${H}" fill="transparent"/><path class="${cls}" d="${bar(x, H - pb - h, w, h, 3)}"/></g>`;
      if (i === items.length - 1) g += `<text class="ax ax-strong" x="${x + w / 2}" y="${H - pb - h - 4}" text-anchor="middle">${d.v}</text>`;
      g += `<text class="ax" x="${x + w / 2}" y="${H - 4}" text-anchor="middle">${d.label}</text>`;
    });
    return svg(W, H, g, 'mini');
  };

  /* ---------- Reloj de 24 h del día de hoy ---------- */
  C.dayClock = (blocks, feeds, now) => {
    const S = 220, c = S / 2, R = 92, w = 16;
    const day0 = U.dayStart(now);
    const ang = (t) => ((t - day0) / U.DAY) * Math.PI * 2 - Math.PI / 2;
    const arc = (a, b, r) => {
      const a0 = ang(a), a1 = ang(b), large = a1 - a0 > Math.PI ? 1 : 0;
      return `M${r1(c + r * Math.cos(a0))},${r1(c + r * Math.sin(a0))}A${r},${r} 0 ${large} 1 ${r1(c + r * Math.cos(a1))},${r1(c + r * Math.sin(a1))}`;
    };
    let g = `<circle class="clock-track" cx="${c}" cy="${c}" r="${R}" stroke-width="${w}" fill="none"/>`;
    for (let h = 0; h < 24; h++) {
      const a = (h / 24) * Math.PI * 2 - Math.PI / 2, major = h % 6 === 0;
      const r0 = R - w / 2 - (major ? 9 : 5), r2 = R - w / 2 - 3;
      g += `<line class="${major ? 'tick-major' : 'tick'}" x1="${r1(c + r0 * Math.cos(a))}" y1="${r1(c + r0 * Math.sin(a))}" x2="${r1(c + r2 * Math.cos(a))}" y2="${r1(c + r2 * Math.sin(a))}"/>`;
      if (major) g += `<text class="ax" x="${r1(c + (R - 34) * Math.cos(a))}" y="${r1(c + (R - 34) * Math.sin(a) + 4)}" text-anchor="middle">${String(h).padStart(2, '0')}</text>`;
    }
    blocks.forEach((b) => { if (b.b - b.a > 60000) g += `<path class="${b.type === 'nap' ? 'arc-nap' : 'arc-night'}" d="${arc(b.a, b.b, R)}" stroke-width="${w}" fill="none" data-tip="${U.esc(`${b.type === 'nap' ? 'Siesta' : 'Noche'}|${U.time(b.a)} – ${U.time(b.b)}`)}"/>`; });
    feeds.forEach((t) => { const a = ang(t); g += `<circle class="m-feed" cx="${r1(c + (R + w / 2 + 7) * Math.cos(a))}" cy="${r1(c + (R + w / 2 + 7) * Math.sin(a))}" r="3.4" data-tip="Toma|${U.time(t)}"/>`; });
    const a = ang(now);
    g += `<line class="clock-hand" x1="${c}" y1="${c}" x2="${r1(c + (R + 2) * Math.cos(a))}" y2="${r1(c + (R + 2) * Math.sin(a))}"/><circle class="clock-hub" cx="${c}" cy="${c}" r="4"/>`;
    return svg(S + 24, S + 24, `<g transform="translate(12 12)">${g}</g>`, 'clock');
  };
})(window.Nido = window.Nido || {});
