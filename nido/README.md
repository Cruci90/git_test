# Nido · cuaderno del bebé

Aplicación web para que madres y padres registren y sigan todo lo del bebé en un solo sitio: sueño, tomas, pañales, alimentación complementaria (BLW), crecimiento con curvas de la OMS, citas médicas, vacunas, medicación, hitos, dientes, diario con fotos y un informe listo para el pediatra.

Funciona sin servidor, sin cuenta y sin dependencias. Los datos se quedan en el navegador del dispositivo.

## Cómo abrirla

- Abre `index.html` en el navegador (doble clic vale), o sírvela con cualquier servidor estático: `npx serve nido`.
- Para tener un único archivo portable: `node build.mjs` genera `dist/nido.html` con todo en línea.
- La primera vez se carga una demo: Lucía, 6 meses y medio, tres semanas de registros y dos semanas de BLW. Desde **Ajustes** puedes borrar la demo y añadir a tu bebé.

## Qué incluye

| Sección | Qué hace |
|---|---|
| **Hoy** | Edad exacta, estado en vivo (durmiendo, dando el pecho o despierta con la ventana de vigilia), predicción de próxima siesta y hora de dormir, resumen del día, reloj de 24 h, pendientes (citas, vacunas, alérgenos que mantener, vitamina D, fiebre) e idea de alimento para hoy. |
| **Sueño** | Cronómetro, registro manual, horas por día frente al rango recomendado, patrón de 14 días con tomas superpuestas, medias (despertares, tramo más largo, hora de acostarse y despertar) y guía por edad. |
| **Tomas** | Cronómetro de pecho con cambio de lado y pausa, sugerencia del lado que toca, biberón (materna, fórmula, mixta), extracciones y pañales con color de la caca y avisos. |
| **BLW** | Reto de 100 alimentos, catálogo de 71 alimentos con cómo ofrecerlos a los 6 y 9 meses, marcas de alérgeno y riesgo de atragantamiento, seguimiento de los 9 alérgenos (3 exposiciones y mantenimiento), arcoíris semanal, registro de comidas con cantidad, gusto, reacciones, arcadas y guía de seguridad. |
| **Crecimiento** | Peso, longitud y perímetro craneal con percentil calculado por el método LMS de la OMS (0‑24 meses), curva con bandas P3–P97 y P15–P85, ganancia de peso en g/día y tabla histórica. |
| **Salud** | Citas con preguntas para la consulta y lo que dijo el pediatra, sugerencia de la próxima revisión del programa de salud infantil, calendario vacunal (España 2025) con fecha y lote, medicación, temperatura y ficha médica con teléfonos de urgencia. |
| **Calendario** | Vista mensual con citas, vacunas previstas, hitos, eventos y el "cumplemés". |
| **Hitos y dientes** | 23 hitos del desarrollo con su rango habitual frente a la edad actual, y odontograma de los 20 dientes de leche (notación FDI). |
| **Diario** | Recuerdos con estado de ánimo y foto (se reduce a 1000 px para que quepa en el almacenamiento local). |
| **Informe** | Resumen de crecimiento, sueño, tomas, BLW, vacunas, fiebre, desarrollo y preguntas pendientes, que se copia como texto. |
| **Ajustes** | Tema claro/noche/automático, varios bebés, quién registra (mamá, papá, abuela…), exportar e importar copia de seguridad. |

## Arquitectura

JavaScript sin framework ni paso de compilación, organizado en capas. Cada archivo es un módulo que cuelga del espacio de nombres `window.Nido`:

```
index.html          Estructura: barra lateral, vista, barra inferior, hoja, aviso, tooltip
css/nido.css        Sistema visual: tokens claro/oscuro, componentes y gráficos
js/data.js          Datos de referencia estáticos: tablas LMS de la OMS, catálogo BLW,
                    alérgenos, vacunas, revisiones, hitos, dientes, sueño por edad
js/core.js          Utilidades (fechas, edad, formato), Store (localStorage + suscripción),
                    selectores de dominio (S.*) e iconos SVG
js/charts.js        Gráficos SVG propios: barras de sueño, patrón 24 h, curva OMS,
                    anillo de progreso, mini barras y reloj del día
js/ui.js            Enrutador por hash, navegación, hoja inferior, campos de formulario,
                    avisos con deshacer, tooltip y temporizadores en vivo
js/actions.js       Formularios y acciones (data-act) de cada tipo de registro
js/views-*.js       Vistas: daily (Hoy, Sueño, Tomas), care (BLW, Crecimiento, Salud),
                    more (Calendario, Hitos, Diario, Informe, Ajustes, Bienvenida)
js/demo.js          Generador determinista de datos de ejemplo relativos a hoy
js/app.js           Arranque y delegación de eventos
```

Decisiones principales:

- **Un único estado serializable.** Colecciones planas (`sleeps`, `feeds`, `meals`…) donde cada registro lleva `babyId`. Así varios bebés comparten el mismo esquema y exportar es un `JSON.stringify`.
- **Lo derivado no se guarda.** El estado de cada alimento, los alérgenos, los percentiles, las predicciones de sueño y el calendario vacunal se calculan desde los registros. No hay datos duplicados que se desincronicen.
- **Render declarativo simple.** Cada vista es una función que devuelve HTML; cualquier cambio en el Store vuelve a pintar la vista actual. Los eventos se gestionan por delegación con `data-act`.
- **Predicción de siestas.** Parte de la ventana de vigilia típica para la edad y la ajusta con la media real de los últimos 7 días (60 % real, 40 % tabla), limitada al rango saludable.
- **Percentiles.** Método LMS de la OMS con interpolación mensual: `z = ((X/M)^L − 1) / (L·S)`.

## Aviso

Nido es una herramienta de registro y no sustituye el consejo de tu pediatra. El calendario vacunal es orientativo; cada comunidad autónoma puede tener variaciones.
