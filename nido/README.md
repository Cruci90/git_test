# Nido · cuaderno del bebé

Aplicación web para que madres y padres registren y sigan todo lo del bebé en un solo sitio: sueño, tomas, pañales, alimentación complementaria (BLW), crecimiento con curvas de la OMS, citas médicas, vacunas, medicación, hitos, dientes, diario con fotos y un informe listo para el pediatra.

Funciona sin servidor, sin cuenta y sin dependencias. Los datos se quedan en el navegador del dispositivo.

## Cómo abrirla

- Abre `index.html` en el navegador (doble clic vale), o sírvela con cualquier servidor estático: `npx serve nido`.
- Servida por http(s) se puede **instalar** en el móvil (Añadir a pantalla de inicio) y funciona **sin conexión** gracias a `sw.js`. Al publicar una versión nueva, sube `VERSION` en `sw.js`.
- Para tener un único archivo portable: `node build.mjs` genera `dist/nido.html` con todo en línea.
- La primera vez se carga una demo: Lucía, 6 meses y medio, tres semanas de registros y dos semanas de BLW. Desde **Ajustes** puedes borrar la demo y añadir a tu bebé.

## Qué incluye

| Sección | Qué hace |
|---|---|
| **Hoy** | Edad exacta, estado en vivo (durmiendo, dando el pecho o despierta con la ventana de vigilia), predicción de próxima siesta y hora de dormir, resumen del día, reloj de 24 h, pendientes (citas, vacunas, alérgenos que mantener, vitamina D, fiebre) e idea de alimento para hoy. |
| **Sueño** | Cronómetro, **plan del día** (siestas hechas y previstas con la hora de dormir, aprendido de sus últimos 7 días), **sonidos para dormir** sintetizados (ruido blanco, rosa y marrón, shhh, útero, latido, lluvia, olas y nana de Brahms) con temporizador y apagado suave, registro manual, horas por día frente al rango recomendado, patrón de 14 días con tomas superpuestas, medias (despertares, tramo más largo, hora de acostarse y despertar) y guía por edad. |
| **Tomas** | Cronómetro de pecho con cambio de lado y pausa, sugerencia del lado que toca, biberón (materna, fórmula, mixta), extracciones y pañales con color de la caca y avisos. |
| **BLW** | Cuatro pestañas. **Plan semanal** generado a partir de lo que ya ha probado: hierro en cada comida (con vitamina C si es vegetal), como mucho un alimento nuevo al día, alérgenos de uno en uno por la mañana hasta 3 exposiciones y mantenimiento de los ya introducidos, y alimentos rechazados que vuelven a salir; con lista de la compra y registro de la comida con un toque. **Hierro de la semana** y **volver a ofrecer** (8–15 exposiciones). Reto de 100 alimentos, catálogo de 71 alimentos con cómo ofrecerlos a los 6 y 9 meses, marcas de alérgeno y riesgo de atragantamiento, seguimiento de los 9 alérgenos (3 exposiciones y mantenimiento), arcoíris semanal, registro de comidas con cantidad, gusto, reacciones, arcadas y guía de seguridad. |
| **Crecimiento** | Peso, longitud y perímetro craneal con percentil calculado por el método LMS de la OMS (0‑24 meses), curva con bandas P3–P97 y P15–P85, ganancia de peso en g/día y tabla histórica. |
| **Salud** | Citas con preguntas para la consulta y lo que dijo el pediatra, sugerencia de la próxima revisión del programa de salud infantil, calendario vacunal (España 2025) con fecha y lote, medicación, temperatura y ficha médica con teléfonos de urgencia. |
| **Actividades** | Tiempo boca abajo con cronómetro y objetivo de 30 min diarios (hasta que gatea), paseo, juego, baño, cuento, masaje y música. |
| **Avisos** | Antes de cada siesta prevista y de la hora de dormir, si pasa tiempo sin toma, citas (víspera y 1 h antes), vitamina D, alérgeno del plan y próxima dosis de un medicamento. Como notificación del sistema si se da permiso y siempre dentro de la app. Funcionan con Nido abierta (también en segundo plano); con la app cerrada no, porque eso exige un servidor de notificaciones push. |
| **Importar desde Napper** | Lee `napper_events.csv`, `all_events.json` o `sleep_logs_full.json` de la herramienta comunitaria [napper-export](https://github.com/brittraee/napper-export). Convierte BED_TIME + NIGHT_WAKING + WOKE_UP en tramos de noche, siestas, tomas, biberones y medicación; salta duplicados, así que se puede importar varias veces. |
| **Calendario** | Vista mensual con citas, vacunas previstas, hitos, eventos y el "cumplemés". |
| **Hitos y dientes** | 23 hitos del desarrollo con su rango habitual frente a la edad actual, y odontograma de los 20 dientes de leche (notación FDI). |
| **Diario** | Recuerdos con estado de ánimo y foto. Las fotos se reducen a 1000 px y se guardan en IndexedDB, sin el límite de ~5 MB de localStorage. |
| **Informe** | Resumen de crecimiento, sueño, tomas, BLW, vacunas, fiebre, desarrollo y preguntas pendientes, que se copia como texto. |
| **Ajustes** | Tema claro/noche/automático, varios bebés con semanas de gestación, quién registra (mamá, papá, abuela…), copia de seguridad con fotos, espacio usado e instalación en el móvil. |

**Prematuros:** si el bebé nació antes de la semana 37, Nido usa su **edad corregida** (descontando lo que faltó hasta la semana 40) para percentiles, curvas, hitos y sueño hasta los 2 años. Vacunas y revisiones siguen la edad cronológica.

## Arquitectura

JavaScript sin framework ni paso de compilación, organizado en capas. Cada archivo es un módulo que cuelga del espacio de nombres `window.Nido`:

```
index.html          Estructura: barra lateral, vista, barra inferior, hoja, aviso, tooltip
css/nido.css        Sistema visual: tokens claro/oscuro, componentes y gráficos
js/data.js          Datos de referencia estáticos: tablas LMS de la OMS, catálogo BLW,
                    alérgenos, vacunas, revisiones, hitos, dientes, sueño por edad
js/core.js          Utilidades (fechas, edad, formato), Store (localStorage + suscripción),
                    selectores de dominio (S.*) e iconos SVG
js/media.js         Fotos en IndexedDB: guardar, cargar, migrar, limpiar y exportar
js/sounds.js        Sonidos para dormir sintetizados con Web Audio y temporizador
js/blwplan.js       Generador del plan semanal de BLW y lista de la compra
js/activities.js    Actividades y cronómetro de tiempo boca abajo
js/reminders.js     Motor de avisos y notificaciones
js/importers.js     Importador de Napper (CSV y JSON de napper-export)
js/charts.js        Gráficos SVG propios: barras de sueño, patrón 24 h, curva OMS,
                    anillo de progreso, mini barras y reloj del día
js/ui.js            Enrutador por hash, navegación, hoja inferior, campos de formulario,
                    avisos con deshacer, tooltip y temporizadores en vivo
js/actions.js       Formularios y acciones (data-act) de cada tipo de registro
js/views-*.js       Vistas: daily (Hoy, Sueño, Tomas), care (BLW, Crecimiento, Salud),
                    more (Calendario, Hitos, Diario, Informe, Ajustes, Bienvenida)
js/demo.js          Generador determinista de datos de ejemplo relativos a hoy
js/app.js           Arranque, delegación de eventos, instalación y service worker
sw.js               Caché para uso sin conexión
tests/              Tests de los cálculos (node --test, sin dependencias)
```

Decisiones principales:

- **Un único estado serializable.** Colecciones planas (`sleeps`, `feeds`, `meals`…) donde cada registro lleva `babyId`. Así varios bebés comparten el mismo esquema y exportar es un `JSON.stringify`.
- **Lo derivado no se guarda.** El estado de cada alimento, los alérgenos, los percentiles, las predicciones de sueño y el calendario vacunal se calculan desde los registros. No hay datos duplicados que se desincronicen.
- **Render declarativo simple.** Cada vista es una función que devuelve HTML; cualquier cambio en el Store vuelve a pintar la vista actual. Los eventos se gestionan por delegación con `data-act`.
- **Plan de siestas.** Reconstruye cada uno de los últimos 7 días (despertar, siestas y hora de acostarse) y aprende, por posición, la ventana de vigilia antes de cada siesta, la de antes de dormir y la duración de cada siesta. Mezcla 70 % real y 30 % tabla por edad, limitado a un rango saludable, y replanifica el resto del día con cada registro. La hora de dormir se mantiene entre 18:30 y 21:00.
- **Percentiles.** Método LMS de la OMS con interpolación mensual: `z = ((X/M)^L − 1) / (L·S)`.

## Tests

```
cd nido
npm test
```

Cubren el plan semanal de BLW (un nuevo al día, un alérgeno cada vez, nada con reacción, hierro), el importador de Napper (noches partidas por despertares, duplicados, CSV con comillas), hierro, volver a ofrecer, avisos, la edad en meses de calendario, la edad corregida, los percentiles OMS (contrastados con valores publicados de la tabla de puntuaciones z), el reparto del sueño entre días, el plan de siestas, el estado de alimentos y alérgenos y la coherencia de la demo.

## Aviso

Nido es una herramienta de registro y no sustituye el consejo de tu pediatra. El calendario vacunal es orientativo; cada comunidad autónoma puede tener variaciones.
