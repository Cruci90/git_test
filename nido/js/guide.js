/* ==========================================================================
   Nido · Guía de sueño
   Fichas breves según la edad y lo que está pasando ahora (transición,
   dientes, cambio de hora, despertares, siestas cortas, madrugones…).
   Son orientaciones generales basadas en recomendaciones habituales de
   pediatría (AEP, AAP); no sustituyen al pediatra.
   Formato del cuerpo: un elemento por párrafo; los que empiezan por "- "
   son viñetas.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, S, UI, icon } = N;

  N.GUIDE = [
    {
      id: 'seguro', emoji: '🛏️', title: 'Sueño seguro', ages: [0, 12], tags: ['safe'],
      summary: 'Boca arriba, en su cuna y sin nada suelto alrededor.',
      body: [
        'La mayoría de las recomendaciones para reducir el riesgo de muerte súbita del lactante coinciden en lo básico:',
        '- Siempre boca arriba, también en las siestas. Cuando ya se gira sola en ambos sentidos, puede quedarse en la postura que elija.',
        '- Colchón firme y plano, con sábana ajustable. Nada más en la cuna: ni almohadas, ni protectores, ni peluches, ni mantas sueltas. Un saco de dormir es buena alternativa a la manta.',
        '- Lo ideal es que duerma en vuestra habitación, en su cuna o en una cuna adosada, al menos los primeros 6 meses.',
        '- Sin tabaco en casa ni en el embarazo, y sin abrigarla de más: la habitación fresca.',
        '- El chupete al dormir se asocia a menos riesgo. Si da el pecho, mejor cuando la lactancia esté bien establecida.',
        '- Si compartís cama: nunca en sofá o sillón, sin alcohol, tabaco ni medicamentos que den sueño, y con colchón firme. En menores de 3 meses o prematuros es más seguro la cuna junto a vuestra cama.',
        '- Si se duerme en la silla del coche o en un columpio, pásala a una superficie plana en cuanto podáis.'
      ]
    },
    {
      id: 'ventanas', emoji: '⏱️', title: 'Ventanas de vigilia y señales de sueño', ages: [0, 24], tags: ['windows'],
      summary: 'Cuánto aguanta despierta y cómo saber que le toca dormir.',
      body: [
        'La ventana de vigilia es el tiempo que aguanta despierta entre dos sueños sin cansarse de más. Crece con la edad y a lo largo del día: la primera suele ser la más corta y la de antes de la noche, la más larga.',
        'Las señales llegan antes que el llanto:',
        '- Mirada perdida, menos interés por jugar, movimientos más lentos.',
        '- Frotarse los ojos o las orejas, bostezos, ojeras rojizas.',
        '- Más tarde: irritabilidad, arquearse, llanto.',
        'Si espera a las señales tardías, puede costarle más dormirse: el cansancio acumulado activa al bebé. El plan de Nido os da una hora orientativa, pero manda lo que veis.'
      ]
    },
    {
      id: 'rutina', emoji: '🌙', title: 'La rutina de dormir', ages: [2, 24], tags: ['routine'],
      summary: '20–45 minutos, siempre en el mismo orden.',
      body: [
        'Una rutina corta y repetida ayuda a que el cuerpo anticipe la noche. No hace falta que sea larga ni perfecta, sino parecida cada día.',
        '- Entre 20 y 45 minutos. Por ejemplo: baño, masaje, pijama, toma, cuento y canción.',
        '- Luz tenue y voz tranquila desde el principio; sin pantallas.',
        '- El último paso, en su habitación, y que sea siempre el mismo.',
        'Con la rutina de Nido podéis ver si con ella tarda menos en dormirse.'
      ]
    },
    {
      id: 'regresion4', emoji: '🌀', title: 'La «regresión» de los 4 meses', ages: [3, 5.5], tags: ['regression', 'wakes', 'shortnaps'],
      summary: 'No es un paso atrás: su sueño empieza a parecerse al nuestro.',
      body: [
        'Hacia los 3–5 meses el sueño cambia de forma: aparecen ciclos más parecidos a los del adulto, con despertares breves entre ellos. Por eso muchos bebés que dormían tramos largos empiezan a despertarse más y a hacer siestas de 30–45 minutos.',
        'Es un cambio de maduración, no un problema, y no vuelve atrás. Suele ayudar:',
        '- Respetar ventanas de vigilia adecuadas para su edad.',
        '- Habitación oscura y ruido blanco suave para enlazar ciclos.',
        '- Darle alguna oportunidad de dormirse con algo menos de ayuda, sin forzar.',
        'Si además hay fiebre, rechazo de tomas o mucho malestar, consultad con vuestra pediatra.'
      ]
    },
    {
      id: 'siestas-cortas', emoji: '⏳', title: 'Siestas cortas', ages: [2, 8], tags: ['shortnaps'],
      summary: 'Siestas de 30–45 minutos: normales hasta los 5–6 meses.',
      body: [
        'Hasta los 5–6 meses es habitual que las siestas duren un ciclo (30–45 min). Con el tiempo se alargan solas, sobre todo la del mediodía.',
        '- Revisad la ventana anterior: tanto si es corta (aún sin sueño) como si es larga (pasada de sueño), las siestas se acortan.',
        '- Oscuridad y ruido blanco ayudan a enlazar ciclos.',
        '- Si se despierta a los 30–40 min sin llorar mucho, esperad un par de minutos antes de entrar: a veces vuelve a dormirse.',
        'Nido ya tiene en cuenta una siesta corta: adelanta la siguiente.'
      ]
    },
    {
      id: 'despertares', emoji: '🌛', title: 'Despertares nocturnos', ages: [0, 24], tags: ['wakes'],
      summary: 'Qué es normal y qué puede ayudar.',
      body: [
        'Despertarse de noche es normal durante todo el primer año, y muchos bebés siguen necesitando tomas nocturnas. La lactancia a demanda incluye la noche.',
        'Mirad qué dice vuestra tarjeta «Cómo se duerme»:',
        '- Si casi todos son por hambre, es lo esperable: suelen ir bajando solos.',
        '- Si son por consuelo, a veces ayuda que la forma de dormirse al principio de la noche se parezca a lo que encuentra al despertarse.',
        '- Muchos despertares seguidos después de una época tranquila suelen coincidir con dientes, enfermedad o un salto de desarrollo: marcad un «día difícil».',
        '- Una hora de dormir demasiado tardía también puede aumentar los despertares.',
        'Si os preocupa el número de despertares o no descansáis, comentadlo en la revisión: existen enfoques respetuosos y no hay uno solo válido.'
      ]
    },
    {
      id: 'madrugones', emoji: '🌅', title: 'Madrugones (antes de las 6:00)', ages: [4, 24], tags: ['early'],
      summary: 'Lo más habitual: luz, una noche demasiado temprana o tardía, o la última ventana.',
      body: [
        'Despertarse a las 5 y pico listo para empezar el día es frecuente y suele tener varias causas juntas:',
        '- Luz que entra al amanecer: oscurecer bien la habitación ayuda mucho.',
        '- Una hora de acostarse demasiado tardía (pasada de sueño) o demasiado temprana para su edad.',
        '- Una última ventana demasiado corta (no llega cansada) o una siesta de la tarde muy larga.',
        '- Ruidos de la calle o de casa: el ruido blanco puede taparlos.',
        'Mientras tanto, si se despierta antes de las 6:00, tratad ese rato como noche: luz apagada y poca estimulación. Cambiad una cosa cada vez y dadle unos días.'
      ]
    },
    {
      id: 'tres-dos', emoji: '🔁', title: 'Pasar de 3 a 2 siestas', ages: [6, 9.5], tags: ['transition3'],
      summary: 'Suele ocurrir entre los 6 y los 9 meses.',
      body: [
        'Señales de que puede estar lista: la tercera siesta se acorta o la rechaza, le cuesta mucho dormirse en ella, la noche empieza muy tarde o empieza a madrugar.',
        'Cómo hacerlo con suavidad:',
        '- Alargad las ventanas unos 15 minutos cada 2–3 días.',
        '- En los días de transición, adelantad la hora de dormir hasta 30 minutos para compensar.',
        '- Si algún día está muy cansada, una siesta corta de rescate a media tarde está bien.',
        'La transición dura una o dos semanas, con días mejores y peores. En Nido podéis activarla desde el aviso del plan.'
      ]
    },
    {
      id: 'dos-una', emoji: '🔂', title: 'Pasar de 2 a 1 siesta', ages: [12, 18.5], tags: ['transition2'],
      summary: 'Lo habitual es entre los 13 y los 18 meses.',
      body: [
        'Las señales se parecen: rechaza una de las dos siestas varios días, tarda mucho en dormirse o la noche se retrasa.',
        '- Id retrasando la siesta de la mañana 15 minutos cada pocos días hasta acercarla al mediodía.',
        '- Adelantad la comida si hace falta para que no llegue con hambre a la siesta.',
        '- Durante la transición, acostadla antes por la noche.',
        'Si empieza la escuela infantil, allí suelen hacer una sola siesta: avisad de cómo va en casa.'
      ]
    },
    {
      id: 'saltos', emoji: '🧗', title: 'Saltos de desarrollo y ansiedad por separación', ages: [7, 19], tags: ['regression', 'wakes'],
      summary: 'Gatear, ponerse de pie, caminar… y no querer que os vayáis.',
      body: [
        'Entre los 8 y 10 meses, y de nuevo hacia el año y los 18 meses, muchos bebés duermen peor durante unas semanas. Coinciden con nuevas habilidades (gatear, ponerse de pie en la cuna, caminar, hablar) y con la ansiedad por separación.',
        '- Practicad la habilidad nueva de día, mucho rato: llega a la noche con menos ganas de ensayar.',
        '- Si se pone de pie en la cuna y no sabe bajar, enseñadle de día a agacharse.',
        '- Para la ansiedad por separación: despedidas cortas y previsibles, y mucha presencia antes de dormir.',
        'Suele pasar en 2–6 semanas. Si coincide con malestar, marcad un «día difícil» para que el plan no aprenda de esos días.'
      ]
    },
    {
      id: 'dientes', emoji: '🦷', title: 'Dientes y sueño', ages: [4, 30], tags: ['teeth'],
      summary: 'Molestan unos días alrededor de la salida de cada diente.',
      body: [
        'La erupción de un diente puede alterar el sueño unos pocos días: más despertares, babeo, encías inflamadas, ganas de morder. La fiebre alta, la diarrea o un malestar que dura muchos días no se deben a los dientes: consultad.',
        '- Mordedores fríos de la nevera (no congelados) y masaje en la encía con el dedo limpio.',
        '- Más brazos y paciencia esas noches; no pasa nada por volver a dar más ayuda unos días.',
        '- Si necesita analgésico, la dosis según su peso os la indica la pediatra o la farmacia.',
        'Marcad «día difícil: dientes» para que el plan sea más suave y no aprenda de esas noches.'
      ]
    },
    {
      id: 'metodos', emoji: '🤲', title: 'Ayudarle a dormirse: opciones', ages: [4, 24], tags: ['methods'],
      summary: 'No hay un único método. Lo importante es que os encaje y ser constantes.',
      body: [
        'Dormirse al pecho, en brazos o meciendo es normal y no es un problema si os funciona. Si queréis que gane autonomía, hay caminos graduales y respetuosos:',
        '- Dejarla en la cuna somnolienta pero despierta, empezando por la primera siesta del día, que suele ser la más fácil.',
        '- Acompañar con la mano o la voz e ir reduciendo la ayuda poco a poco a lo largo de días o semanas.',
        '- Una silla junto a la cuna que se va alejando cada pocas noches.',
        '- Separar la última toma del momento de dormirse (toma, luego cuento, luego cuna).',
        'Elegid lo que os encaje, cambiad una cosa cada vez y sed constantes al menos una semana. Ante dudas, comentadlo en la revisión.'
      ]
    },
    {
      id: 'cambio-hora', emoji: '🕒', title: 'El cambio de hora', ages: [0, 36], tags: ['dst'],
      summary: 'Gradual en los días previos o de golpe: las dos opciones funcionan.',
      body: [
        'Dos veces al año el reloj se mueve una hora y el bebé no lo sabe.',
        '- Gradual: los 4 días anteriores, desplazad su horario 15 minutos al día. El domingo ya cuadra con la hora nueva. Nido puede hacerlo por vosotros.',
        '- De golpe: el domingo seguid el horario nuevo. Suele ajustarse en 3–7 días.',
        '- En los dos casos ayuda la luz natural por la mañana y la habitación muy oscura por la noche.',
        'En otoño (se atrasa la hora) el riesgo son los madrugones: si se despierta antes, mantened la habitación a oscuras hasta la hora de levantarse.'
      ]
    },
    {
      id: 'viajes', emoji: '🧳', title: 'Viajes y cambios de rutina', ages: [0, 36], tags: ['travel'],
      summary: 'Llevad lo que le dice «es hora de dormir».',
      body: [
        '- Llevad su saco, un objeto familiar y el ruido blanco (en Nido funciona sin conexión).',
        '- Mantened los pasos de la rutina aunque sean más cortos.',
        '- Oscurecer la habitación con lo que tengáis: toallas, papel de aluminio en la ventana.',
        '- Si cambiáis de huso horario, adaptaos al horario local desde el primer día y buscad luz natural por la mañana.',
        'Marcad los días de viaje como «día difícil» para que no cuenten en su ritmo habitual.'
      ]
    }
  ];

  /* Fichas más útiles ahora: edad + lo que está pasando. Devuelve [{ a, why }]. */
  S.guideFor = (now = Date.now()) => {
    const age = S.ageMonths(now), out = [];
    const hard = S.hardDay(U.today()), tr = S.napTransition(now), prefs = S.prefs(), dst = S.dstUpcoming(now);
    const nights = []; for (let i = 1; i <= 7; i++) { const n = S.nightOf(U.dayKey(U.addDays(now, -i))); if (n) nights.push(n); }
    const naps = S.sleeps().filter((s) => s.type === 'nap' && s.start > now - 7 * U.DAY);
    const early = nights.filter((n) => new Date(n.end).getHours() < 6).length;
    const routineNights = nights.filter((n) => n.blocks[0].routine).length;
    N.GUIDE.forEach((a) => {
      let score = age >= a.ages[0] && age <= a.ages[1] ? 1 : -10, why = '';
      const has = (t) => a.tags.includes(t);
      const bump = (n, w) => { if (n > 0) { score += n; if (!why) why = w; } };
      if (tr && (has('transition3') && tr.from === 3 || has('transition2') && tr.from === 2)) bump(tr.ready || prefs.targetNaps ? 6 : 1, tr.ready ? 'Tiene señales de estar lista' : '');
      if (hard && has('teeth') && hard.reason === 'dientes') bump(6, 'Hoy: dientes');
      if (hard && has('travel') && hard.reason === 'viaje') bump(6, 'Hoy: viaje o cambio de rutina');
      if (hard && has('regression') && hard.reason === 'regresion') bump(5, 'Hoy: regresión o salto');
      if (dst && has('dst')) bump(6, dst.days > 0 ? `Cambio de hora en ${dst.days} días` : 'Acaba de cambiar la hora');
      if (nights.length >= 3 && U.avg(nights, (n) => n.wakes) >= 2.5 && has('wakes')) bump(3, `${U.num(U.avg(nights, (n) => n.wakes), 1)} despertares por noche esta semana`);
      if (naps.length >= 5 && U.avg(naps, S.sleepMin) < 45 && has('shortnaps')) bump(3, 'Sus siestas son cortas esta semana');
      if (early >= 3 && has('early')) bump(5, `Se ha despertado antes de las 6 ${early} días`);
      if (has('routine') && nights.length >= 3 && routineNights === 0) bump(1, '');
      if (has('safe') && age < 12) bump(1, '');
      if (score > 0) out.push({ a, score, why });
    });
    return out.sort((x, y) => y.score - x.score);
  };

  const renderBody = (body) => {
    let html = '', list = [];
    const flush = () => { if (list.length) { html += `<ul>${list.map((x) => `<li>${U.esc(x)}</li>`).join('')}</ul>`; list = []; } };
    body.forEach((p) => { if (p.startsWith('- ')) list.push(p.slice(2)); else { flush(); html += `<p>${U.esc(p)}</p>`; } });
    flush();
    return html;
  };

  N.W.guide = () => {
    const top = S.guideFor().slice(0, 3);
    return N.W.card('Guía para su edad', `<ul class="guide-list">${top.map(({ a, why }) => `<li><button type="button" class="guide-it" data-act="guide-open" data-id="${a.id}">
        <span class="g-e" aria-hidden="true">${a.emoji}</span><span><b>${a.title}</b><small>${a.summary}</small>${why ? `<em>${U.esc(why)}</em>` : ''}</span>${icon('right', 'sm')}</button></li>`).join('')}</ul>
      <button type="button" class="link" data-act="guide-all">Ver todas las fichas (${N.GUIDE.length})</button>`, { cls: 'c-sleep' });
  };
  N.actions['guide-open'] = (el) => {
    const a = N.GUIDE.find((x) => x.id === el.dataset.id); if (!a) return;
    UI.sheet({
      title: `${a.emoji} ${a.title}`, footer: false,
      body: `<article class="guide-art">${renderBody(a.body)}</article><p class="muted small">Orientaciones generales basadas en recomendaciones habituales de pediatría. No sustituyen la valoración de vuestra pediatra.</p>`
    });
  };
  N.actions['guide-all'] = () => {
    const age = S.ageMonths();
    const fmt = (m) => (m >= 12 ? `${Math.round((m / 12) * 10) / 10} años` : `${m} meses`).replace('.', ',');
    UI.sheet({
      title: 'Fichas de sueño', footer: false,
      body: `<ul class="guide-list">${N.GUIDE.map((a) => `<li><button type="button" class="guide-it ${age < a.ages[0] || age > a.ages[1] ? 'is-off' : ''}" data-act="guide-open" data-id="${a.id}">
        <span class="g-e" aria-hidden="true">${a.emoji}</span><span><b>${a.title}</b><small>${a.summary}</small><em class="g-age">${a.ages[0] === 0 ? `hasta ${fmt(a.ages[1])}` : `${fmt(a.ages[0])} – ${fmt(a.ages[1])}`}</em></span>${icon('right', 'sm')}</button></li>`).join('')}</ul>`
    });
  };
})(window.Nido = window.Nido || {});
