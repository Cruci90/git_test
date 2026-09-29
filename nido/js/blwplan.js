/* ==========================================================================
   Nido · Plan semanal de BLW y lista de la compra
   Genera una semana de comidas a partir de lo que el bebé ya ha probado:
   - cada comida lleva una fuente de hierro (y vitamina C si es vegetal);
   - como mucho un alimento nuevo al día, en la comida del mediodía;
   - alérgenos de uno en uno, por la mañana, hasta 3 exposiciones seguidas,
     y los ya introducidos se mantienen 2 veces por semana;
   - los alimentos rechazados vuelven a aparecer junto a otros que le gustan.
   El plan se guarda por semana para que no cambie al volver a abrirlo.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, Store, UI, icon } = N;
  const P = {};
  N.BlwPlan = P;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  P.weekStart = (t = Date.now()) => { const d = new Date(U.dayStart(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return U.dayKey(d.getTime()); };
  P.mealsFor = (age) => (age < 7 ? ['comida', 'merienda'] : age < 9 ? ['desayuno', 'comida', 'cena'] : ['desayuno', 'comida', 'merienda', 'cena']);

  /* Genera el plan. Pura respecto al estado: se puede probar con datos fijos. */
  P.build = (week, seed = 1) => {
    const r = rng(seed * 7919 + U.parseDay(week) / 86400000);
    const age = S.ageMonths(U.parseDay(week));
    const stats = S.foodStats();
    const als = S.allergenStatus(stats);
    const reacted = new Set(Object.keys(stats).filter((id) => stats[id].reaction !== 'none'));
    const blockedAl = new Set(als.filter((a) => a.state === 'reaction').map((a) => a.id));
    const introducedAl = new Set(als.filter((a) => a.state === 'done' || a.state === 'maintain').map((a) => a.id));
    const okFood = (f) => !reacted.has(f.id) && !(f.a && blockedAl.has(f.a)) && !(age < 12 && f.id === 'miel');
    // Base: probados sin reacción, cuyo alérgeno (si lo tiene) ya está introducido.
    const base = N.FOODS.filter((f) => stats[f.id] && okFood(f) && (!f.a || introducedAl.has(f.a)));
    const untried = N.FOODS.filter((f) => !stats[f.id] && okFood(f) && !f.a);
    const retry = S.retryFoods(stats).slice(0, 3).map((x) => x.id);
    const used = {};
    const meals = P.mealsFor(age);

    // Calendario de alérgenos: primero termina el que está en curso, luego uno nuevo cada 3‑4 días.
    const alDays = {};
    const inProgress = als.filter((a) => a.state === 'progress');
    const pending = als.filter((a) => a.state === 'pending');
    let day = 0;
    inProgress.forEach((a) => { for (let k = a.exposures; k < 3 && day < 7; k++) alDays[day++] = { al: a, food: pickAlFood(a) }; });
    // Tras cerrar uno, un día de descanso y el siguiente alérgeno durante 3 días.
    if (day > 0) day++;
    pending.forEach((a) => { if (day + 2 < 7) { const food = pickAlFood(a); for (let k = 0; k < 3; k++) alDays[day++] = { al: a, food }; day++; } });
    function pickAlFood(a) {
      const opts = a.foods.filter(okFood);
      return (opts.find((f) => stats[f.id]) || opts.sort((x, y) => (x.r ? 1 : 0) - (y.r ? 1 : 0))[0] || {}).id;
    }
    // Alérgenos ya introducidos: mantener dos veces en la semana.
    const maintain = [];
    als.filter((a) => a.state === 'done' || a.state === 'maintain').forEach((a) => {
      const f = a.foods.find((x) => stats[x.id] && okFood(x)); if (!f) return;
      const d1 = Math.floor(r() * 3), d2 = 3 + Math.floor(r() * 4);
      maintain.push([d1, f.id], [d2, f.id]);
    });

    const pick = (pool, extra = () => 0) => {
      if (!pool.length) return null;
      let best = null, bestScore = -1e9;
      pool.forEach((f) => {
        const st = stats[f.id];
        const score = r() * 2 - (used[f.id] || 0) * 1.4 + (st && st.status === 'liked' ? 0.8 : 0) + extra(f);
        if (score > bestScore) { bestScore = score; best = f; }
      });
      used[best.id] = (used[best.id] || 0) + 1;
      return best;
    };
    const is = (cats) => (f) => cats.includes(f.c);

    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = U.dayKey(U.addDays(U.parseDay(week), d));
      const al = alDays[d];
      const newFood = !al && untried.length ? pick(untried.filter((f) => !(age < 9 && f.r) && !(used[f.id])), (f) => (f.fe ? 0.8 : 0) + (f.vc ? 0.3 : 0)) : null;
      if (newFood) untried.splice(untried.indexOf(newFood), 1);
      const dayMeals = meals.map((type) => ({ type, items: [] }));
      const add = (mi, f, tag) => { if (f && !dayMeals[mi].items.some((x) => x.id === f.id)) dayMeals[mi].items.push({ id: f.id, tag: tag || null }); };
      // El alérgeno o el alimento nuevo, en la primera comida del día que no sea la cena.
      const morning = 0;
      if (al && al.food) add(morning, N.FOOD_BY_ID[al.food], 'allergen');
      if (newFood) add(meals.indexOf('comida'), newFood, 'new');
      maintain.filter(([md]) => md === d).forEach(([, id], k) => add((k + 1) % meals.length, N.FOOD_BY_ID[id], 'maintain'));

      dayMeals.forEach((m, mi) => {
        const has = () => m.items.map((x) => N.FOOD_BY_ID[x.id]);
        // 1) Hierro: en la comida principal, preferiblemente hemo.
        if (!has().some((f) => f.fe)) add(mi, pick(base.filter((f) => f.fe), (f) => (m.type === 'comida' || m.type === 'cena') && f.fe === 2 ? 0.9 : 0));
        // 2) Verdura o fruta; con vitamina C si el hierro es vegetal.
        const needVc = has().some((f) => f.fe === 1) && !has().some((f) => f.fe === 2 || f.vc);
        const vegCat = m.type === 'comida' || m.type === 'cena' ? ['verdura'] : ['fruta'];
        add(mi, pick(base.filter(is(needVc ? ['verdura', 'fruta'] : vegCat)).filter((f) => !needVc || f.vc), () => 0) || pick(base.filter(is(vegCat))));
        // 3) Energía: cereal, lácteo o grasa, según la comida.
        const eCat = m.type === 'desayuno' ? ['cereal', 'lacteo'] : m.type === 'merienda' ? ['lacteo', 'grasa'] : ['cereal', 'legumbre'];
        if (has().length < 3) add(mi, pick(base.filter(is(eCat))));
      });
      // 4) Volver a ofrecer: uno al día, por turnos (cada uno sale 2‑3 veces por semana),
      //    en la comida que le corresponde y junto a alimentos que ya le gustan.
      if (retry.length) {
        const rf = N.FOOD_BY_ID[retry[d % retry.length]];
        const savory = ['verdura', 'proteina', 'legumbre', 'cereal'].includes(rf.c);
        const want = savory ? ['comida', 'cena'] : ['merienda', 'desayuno'];
        let mi = meals.findIndex((t) => want.includes(t)); if (mi < 0) mi = meals.indexOf('comida');
        const m = dayMeals[mi];
        // Si ya va lleno, sustituye el acompañante de su misma categoría.
        const same = m.items.findIndex((x) => !x.tag && N.FOOD_BY_ID[x.id].c === rf.c && !N.FOOD_BY_ID[x.id].fe);
        if (same >= 0 && m.items.length >= 3) m.items.splice(same, 1);
        if (m.items.length < 4) add(mi, rf, 'retry');
      }
      dayMeals.forEach((m) => { m.iron = S.mealIron({ foods: m.items }); });
      days.push({ date, meals: dayMeals, allergen: al ? { name: al.al.name, food: al.food } : null, newFood: newFood ? newFood.id : null });
    }
    return { week, seed, age, days, created: Date.now() };
  };

  /* Plan guardado de la semana (se genera la primera vez). */
  P.current = (regen) => {
    const b = Store.state.activeBabyId, week = P.weekStart();
    const all = Store.state.blwPlans || (Store.state.blwPlans = {});
    let plan = all[b];
    if (!plan || plan.week !== week || regen) {
      plan = P.build(week, regen ? (plan && plan.week === week ? plan.seed + 1 : 2) : 1);
      all[b] = plan; Store.save();
    }
    return plan;
  };

  /* Comidas registradas que corresponden a una comida del plan. */
  const logged = (date, type) => S.meals().find((m) => U.dayKey(m.time) === date && m.mealType === type);

  const TAG = { new: ['Nuevo', 'soft'], allergen: ['Alérgeno', 'warn'], retry: ['Otra vez', 'muted'], maintain: ['Mantener', 'good'] };

  P.render = () => {
    const plan = P.current();
    const today = U.today();
    const days = plan.days.map((d) => {
      const dt = new Date(U.parseDay(d.date));
      const past = d.date < today;
      return `<article class="pday ${d.date === today ? 'is-today' : ''} ${past ? 'is-past' : ''}">
        <header><b>${U.WEEKDAYS_LONG[dt.getDay()]}</b><span>${dt.getDate()} ${U.MONTHS[dt.getMonth()]}</span>
          ${d.allergen ? UI.pill(`${d.allergen.name}`, 'warn') : ''}${d.newFood ? UI.pill('1 nuevo', 'soft') : ''}</header>
        ${d.meals.map((m, mi) => {
          const lg = logged(d.date, m.type);
          return `<div class="pmeal ${lg ? 'is-logged' : ''}">
            <div class="pmeal-h"><span>${N.MEAL_TYPES.find((t) => t.id === m.type).name}</span>
              ${m.iron.iron ? `<i class="iron ${m.iron.heme ? 'heme' : ''}" title="${m.iron.heme ? 'Hierro hemo' : 'Hierro vegetal'}${m.iron.boosted ? ' + vitamina C' : ''}">${icon('drop')}</i>` : ''}
              ${lg ? `<button type="button" class="link sm" data-act="edit" data-col="meals" data-id="${lg.id}">${icon('check', 'sm')}Hecha</button>` : past ? '' : `<button type="button" class="link sm" data-act="plan-log" data-day="${d.date}" data-meal="${mi}">Registrar</button>`}</div>
            <ul>${m.items.map((x) => { const f = N.FOOD_BY_ID[x.id]; return `<li><span class="fe">${f.emoji}</span><span>${f.name}</span>${x.tag ? UI.pill(TAG[x.tag][0], TAG[x.tag][1]) : ''}</li>`; }).join('')}</ul>
          </div>`;
        }).join('')}
      </article>`;
    }).join('');
    const ironMeals = U.sum(plan.days, (d) => d.meals.filter((m) => m.iron.iron).length), allMeals = U.sum(plan.days, (d) => d.meals.length);
    return `<div class="plan-top"><p class="muted small">Semana del ${U.date(plan.week)} · ${plan.days[0].meals.length} comidas al día para su edad · ${ironMeals}/${allMeals} con hierro.
        Nuevo, alérgeno y "otra vez" están marcados; los alérgenos van por la mañana para poder vigilar 2 horas.</p>
        <div class="btn-row"><button type="button" class="btn soft sm" data-act="plan-regen">${icon('repeat')}Otra propuesta</button><button type="button" class="btn soft sm" data-act="go-shop">${icon('cart')}Lista de la compra</button></div></div>
      <div class="pweek">${days}</div>`;
  };

  P.shopping = () => {
    const plan = P.current(), today = U.today();
    const key = Store.state.activeBabyId + ':' + plan.week;
    const done = (Store.state.shopping || {})[key] || {};
    const count = {};
    plan.days.filter((d) => d.date >= today).forEach((d) => d.meals.forEach((m) => m.items.forEach((x) => { count[x.id] = (count[x.id] || 0) + 1; })));
    const groups = Object.entries(N.FOOD_CATS).map(([cat, c]) => ({ cat, name: c.name, items: Object.keys(count).filter((id) => N.FOOD_BY_ID[id].c === cat) })).filter((g) => g.items.length);
    if (!groups.length) return '<p class="muted">No quedan comidas en el plan de esta semana.</p>';
    return `<div class="shop">${groups.map((g) => `<section><h3 class="day-h">${g.name}</h3><ul>${g.items.map((id) => { const f = N.FOOD_BY_ID[id]; return `<li><label><input type="checkbox" data-act="shop-toggle" data-id="${id}" ${done[id] ? 'checked' : ''}><span class="fe">${f.emoji}</span><span>${f.name}</span><small>×${count[id]}</small></label></li>`; }).join('')}</ul></section>`).join('')}</div>
      <div class="btn-row"><button type="button" class="btn soft sm" data-act="shop-copy">${icon('copy')}Copiar lista</button></div>
      <textarea id="shop-text" class="sr-only" readonly aria-hidden="true" tabindex="-1">${U.esc(groups.map((g) => `${g.name}:\n` + g.items.filter((id) => !done[id]).map((id) => `- ${N.FOOD_BY_ID[id].name}`).join('\n')).join('\n\n'))}</textarea>`;
  };

  N.actions['plan-regen'] = () => { P.current(true); UI.render(); UI.toast('Nueva propuesta para la semana'); };
  N.actions['plan-log'] = (el) => {
    const plan = P.current(); const d = plan.days.find((x) => x.date === el.dataset.day); const m = d.meals[+el.dataset.meal];
    N.Forms.meal(null, { foods: m.items.map((x) => x.id), mealType: m.type, date: d.date });
  };
  N.actions['go-shop'] = () => { UI.st.seg.blw = 'plan'; UI.render(); setTimeout(() => { const el = document.getElementById('compra'); el && el.scrollIntoView({ behavior: 'smooth' }); }, 60); };
  N.actions['shop-toggle'] = (el) => {
    const plan = P.current(); const key = Store.state.activeBabyId + ':' + plan.week;
    const all = Store.state.shopping || (Store.state.shopping = {});
    const m = all[key] || (all[key] = {}); m[el.dataset.id] = !m[el.dataset.id]; Store.commit();
  };
  N.actions['shop-copy'] = () => {
    const ta = document.getElementById('shop-text');
    try { navigator.clipboard.writeText(ta.value).then(() => UI.toast('Lista copiada'), () => { ta.select(); }); } catch (e) { ta.select(); }
  };
})(window.Nido = window.Nido || {});
