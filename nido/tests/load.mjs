// Carga los scripts del navegador en un contexto aislado de Node con un
// localStorage en memoria, sin DOM. Solo lo necesario para la lógica.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const dir = new URL('../js/', import.meta.url);
export function loadNido(files = ['data.js', 'core.js', 'demo.js']) {
  const mem = new Map();
  const ctx = {
    console, Math, Date, JSON, Intl,
    document: { addEventListener() {}, getElementById: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(readFileSync(new URL(f, dir), 'utf8'), ctx, { filename: f });
  return ctx.Nido;
}

/* Bebé vacío con fecha de nacimiento dada. */
export function withBaby(N, baby) {
  N.Store.replace({ babies: [Object.assign({ id: 'b1', name: 'Test', sex: 'f' }, baby)], activeBabyId: 'b1' });
  return N;
}
