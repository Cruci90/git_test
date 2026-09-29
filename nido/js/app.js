/* ==========================================================================
   Nido · Arranque
   ========================================================================== */
(function (N) {
  'use strict';
  const { Store, UI } = N;

  /* Instalación como app (PWA) y uso sin conexión. */
  const framed = () => { try { return window.self !== window.top; } catch (e) { return true; } };
  N.install = {
    prompt: null,
    framed,
    standalone: () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    offline: () => !!(navigator.serviceWorker && navigator.serviceWorker.controller)
  };
  N.actions.install = async () => {
    const p = N.install.prompt; if (!p) return;
    p.prompt();
    const { outcome } = await p.userChoice.catch(() => ({}));
    N.install.prompt = null;
    if (outcome === 'accepted') UI.toast('Nido se está instalando');
    UI.render();
  };

  function registerOffline() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol) || framed()) return;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      // Aviso cuando hay una versión nueva lista.
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w && w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) UI.toast('Nueva versión de Nido lista', () => { N.install.updating = true; w.postMessage('skip-waiting'); }, 'Actualizar');
        });
      });
    }).catch(() => { /* sin modo sin conexión */ });
    // Al tocar una notificación, el service worker pide abrir la sección del aviso.
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.go) UI.go(e.data.go); });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading && N.install.updating) { reloading = true; location.reload(); } });
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); N.install.prompt = e; if (UI.current() === 'ajustes') UI.render(); });
  }

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
    document.addEventListener('input', (e) => {
      if (e.target.id === 'snd-vol') N.Sounds.setVolume(e.target.value / 100);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.getElementById('sheet').hidden) UI.closeSheet();
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act][tabindex]:not(button):not(input)')) { e.preventDefault(); e.target.click(); }
    });
    window.addEventListener('hashchange', () => { UI.closeSheet(); UI.render(); });
    Store.subscribe(() => UI.render());
    setInterval(UI.tick, 1000);
    setInterval(() => N.Reminders.check(), 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) N.Reminders.check(); });
    setTimeout(() => N.Reminders.check(), 2500);
    // Refresca predicciones y "hace X min" cada minuto sin tocar formularios abiertos ni controles en uso.
    setInterval(() => { if (document.getElementById('sheet').hidden && document.activeElement?.id !== 'snd-vol') UI.render(); }, 60000);
    UI.render();

    // Fotos: mover las antiguas a IndexedDB y limpiar las huérfanas.
    N.Media.migrate().then(() => N.Media.gc()).catch(() => {});
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* opcional */ }
    registerOffline();
  }

  function localStorageFlag(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, '1'); } catch (e) { return null; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.Nido = window.Nido || {});
