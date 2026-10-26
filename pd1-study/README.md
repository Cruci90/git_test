# PD1 Study — Salesforce Platform Developer I

Aplicación web (React + TypeScript + Vite, PWA) para preparar el examen **Salesforce Platform Developer I**.

- **121 preguntas originales** en inglés con explicaciones en español, en los 4 temas oficiales:
  Developer Fundamentals (23 %), Process Automation & Logic (30 %), User Interface (25 %), Testing, Debugging & Deployment (22 %).
- **Modo práctica**: elige temas, cantidad y filtro (todas / sin ver / falladas); feedback inmediato con explicación.
- **Modo examen**: 60 preguntas, 105 minutos, distribución según los pesos oficiales, aprobado con 68 %. Temporizador, marcar para revisar, navegación libre; el examen en curso sobrevive a recargas y el reloj sigue corriendo.
- **Resultados** con nota por tema y revisión de cada pregunta.
- **Repaso de falladas**: preguntas cuya última respuesta fue incorrecta; dejan de aparecer cuando las aciertas.
- **Estadísticas** por tema, historial de exámenes, exportar/importar/borrar progreso.
- **Datos locales** (`localStorage`), sin servidor ni cuentas. **PWA** instalable que funciona sin conexión. Diseño responsive con modo oscuro.

> Las preguntas son material propio de estudio; no son preguntas reales del examen ni de "dumps".

## Requisitos

Node.js 20 o superior (incluye npm).

### Fedora

```bash
sudo dnf install nodejs npm git
git clone https://github.com/Cruci90/git_test.git
cd git_test
git checkout claude/zealous-babbage-59xysg   # rama con la app
cd pd1-study
npm install
npm run dev          # desarrollo: http://localhost:5173
```

### Windows (PowerShell)

```powershell
winget install OpenJS.NodeJS.LTS
git clone https://github.com/Cruci90/git_test.git
cd git_test
git checkout claude/zealous-babbage-59xysg
cd pd1-study
npm install
npm run dev
```

(Cierra y reabre la terminal tras instalar Node para que `npm` esté en el PATH.)

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprueba tipos y genera `dist/` (con service worker) |
| `npm run preview` | Sirve `dist/` en http://localhost:4173 (úsalo para probar la PWA) |
| `npm test` | Tests unitarios (selección y puntuación de examen, almacenamiento, validación del banco) |

## Instalar como app / usar offline

Ejecuta `npm run build && npm run preview`, abre http://localhost:4173 en Chrome o Edge y pulsa el icono *Instalar* de la barra de direcciones.
Para publicarla, sube el contenido de `dist/` a cualquier hosting estático (GitHub Pages, Netlify…). Usa rutas relativas (`base: './'`) y navegación por hash, así que no necesita configuración de servidor. La PWA requiere HTTPS (o `localhost`).

## Estructura

```
src/data/        banco de preguntas (un archivo por tema) y su test de validación
src/lib/         lógica pura: selección de examen, puntuación, almacenamiento
src/views/       Home, Practice (también repaso de falladas), Exam, Stats
src/components/  QuestionCard, Bar
```

Para añadir preguntas edita el archivo del tema en `src/data/` con `q(texto, opciones, índiceCorrecto | [índices], explicaciónES, código?)`. `npm test` valida el formato (ids únicos, respuestas válidas, "Choose N" en las de respuesta múltiple).
