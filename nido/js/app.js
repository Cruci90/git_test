/* ==========================================================================
   Nido · Arranque
   ========================================================================== */
(function (N) {
  'use strict';
  const { Store, UI } = N;

  function start() {
    Store.load();
    // Primera visita: se abre con la demo para enseñar la app funcionando.
    if (!Store.state.babies.length && !localStorageFlag('nido.seen')) N.seedDemo();
    localStorageFlag('nido.seen', true);
    UI.applyTheme();
    UI.initTooltip();

    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const fn = N.actions[el.dataset.act];
      if (!fn) return;
      if (el.tagName !== 'INPUT') e.preventDefault();
      if (el.tagName === 'A' && el.getAttribute('href')) location.hash = el.getAttribute('href');
      fn(el, e);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.getElementById('sheet').hidden) UI.closeSheet();
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act][tabindex]:not(button):not(input)')) { e.preventDefault(); e.target.click(); }
    });
    window.addEventListener('hashchange', () => { UI.closeSheet(); UI.render(); });
    Store.subscribe(() => UI.render());
    setInterval(UI.tick, 1000);
    // Refresca predicciones y "hace X min" cada minuto sin tocar formularios abiertos.
    setInterval(() => { if (document.getElementById('sheet').hidden) UI.render(); }, 60000);
    UI.render();
  }

  function localStorageFlag(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, '1'); } catch (e) { return null; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.Nido = window.Nido || {});
