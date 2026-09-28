/* ==========================================================================
   Nido · Fotos en IndexedDB
   localStorage tiene ~5 MB, suficiente para los registros pero no para
   fotos. Las fotos del diario se guardan aparte en IndexedDB y el registro
   solo lleva su `photoId`. Si IndexedDB no está disponible, la foto se
   guarda en línea como antes (`photo`), así nada se pierde.
   ========================================================================== */
(function (N) {
  'use strict';
  const { U, Store } = N;
  const DB = 'nido-media', STORE = 'photos';
  let dbp = null;

  const open = () => dbp || (dbp = new Promise((res) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
      req.onblocked = () => res(null);
    } catch (e) { res(null); }
  }));
  const tx = async (mode, fn) => {
    const db = await open(); if (!db) throw new Error('IndexedDB no disponible');
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), st = t.objectStore(STORE); let out;
      const r = fn(st); if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  };

  const cache = new Map();
  const Media = {
    async available() { return !!(await open()); },
    async put(dataUrl, id = 'ph_' + U.uid()) { await tx('readwrite', (s) => s.put(dataUrl, id)); cache.set(id, dataUrl); return id; },
    async get(id) { if (cache.has(id)) return cache.get(id); const v = await tx('readonly', (s) => s.get(id)); if (v) cache.set(id, v); return v || null; },
    async del(id) { cache.delete(id); await tx('readwrite', (s) => s.delete(id)); },
    async keys() { return (await tx('readonly', (s) => s.getAllKeys())) || []; },
    async clear() { cache.clear(); try { await tx('readwrite', (s) => s.clear()); } catch (e) { /* sin IndexedDB */ } },
    /* URL ya cargada (para pintar sin parpadeo) o '' si hay que esperar. */
    src(id) { return cache.get(id) || ''; },
    /* Rellena <img data-photo> tras cada render. */
    hydrate(root) {
      root.querySelectorAll('img[data-photo]').forEach(async (img) => {
        if (img.getAttribute('src')) return;
        const v = await Media.get(img.dataset.photo).catch(() => null);
        if (v) img.src = v; else img.closest('.has-photo')?.classList.remove('has-photo');
      });
    },
    /* Pasa a IndexedDB las fotos que aún estén en línea (datos antiguos o importados). */
    async migrate() {
      if (!(await this.available())) return 0;
      let n = 0;
      for (const d of Store.state.diary) {
        if (d.photo && !d.photoId) { d.photoId = await this.put(d.photo); delete d.photo; n++; }
      }
      if (n) Store.commit();
      return n;
    },
    /* Borra fotos que ya no usa ningún recuerdo (p. ej. tras eliminar uno). */
    async gc() {
      if (!(await this.available())) return;
      const used = new Set(Store.state.diary.map((d) => d.photoId).filter(Boolean));
      for (const k of await this.keys()) if (!used.has(k)) await this.del(k);
    },
    async exportAll() {
      const out = {};
      for (const d of Store.state.diary) if (d.photoId) { const v = await this.get(d.photoId).catch(() => null); if (v) out[d.photoId] = v; }
      return out;
    },
    async importAll(map) {
      if (!(await this.available())) return false;
      for (const [id, v] of Object.entries(map || {})) await this.put(v, id);
      return true;
    },
    async usage() {
      try { const e = await navigator.storage.estimate(); return e; } catch (e) { return null; }
    }
  };
  N.Media = Media;
})(window.Nido = window.Nido || {});
