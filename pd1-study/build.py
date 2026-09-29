#!/usr/bin/env python3
"""Genera index.html autocontenido (CSS, JS y preguntas embebidos) a partir de src/.

Uso: python3 build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'


def inline_css(match):
    css = (SRC / match.group(1)).read_text(encoding='utf-8')
    return '<style>\n' + css + '\n</style>'


def inline_js(match):
    js = (SRC / match.group(1)).read_text(encoding='utf-8')
    js = js.replace('</script', '<\\/script')
    return '<script>\n' + js + '\n</script>'


html = (SRC / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)
html = html.replace('<head>', '<head>\n  <!-- Archivo generado por build.py a partir de src/. No editar a mano. -->', 1)
(ROOT / 'index.html').write_text(html, encoding='utf-8')
print(f'index.html generado ({len(html) // 1024} KB)')
