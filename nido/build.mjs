// Genera dist/nido.html: la app entera en un solo archivo (CSS y JS en línea),
// útil para abrirla sin servidor o compartirla. Uso: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
let html = readFileSync(dir + 'index.html', 'utf8');
html = html.replace(/<link rel="stylesheet" href="css\/nido.css">/, () => `<style>\n${readFileSync(dir + 'css/nido.css', 'utf8')}\n</style>`);
html = html.replace(/<script src="(js\/[\w-]+\.js)"><\/script>/g, (_, p) => `<script>\n${readFileSync(dir + p, 'utf8')}\n</script>`);
// En un solo archivo no hay manifiesto, iconos ni service worker.
html = html.replace(/\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>/g, '');
mkdirSync(dir + 'dist', { recursive: true });
writeFileSync(dir + 'dist/nido.html', html);
console.log('dist/nido.html', (html.length / 1024).toFixed(0) + ' KB');
