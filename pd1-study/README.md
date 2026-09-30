# PD1 Study: Salesforce Platform Developer (PD1)

App web estática para preparar el examen **Salesforce Certified Platform Developer** (antes *Platform Developer I*, código **Plat-Dev-201**). Incluye una guía de estudio y un generador de exámenes ponderados según los pesos oficiales.

## Cómo usarla

Abre `index.html` en el navegador. Es un **único archivo autocontenido** (CSS, JS y preguntas embebidos), así que funciona aunque lo descargues suelto o lo abras desde una vista previa. No necesita instalación ni servidor. El progreso se guarda en `localStorage` si el navegador lo permite.

`index.html` se **genera** a partir de `src/`. Para editar la app o añadir preguntas, modifica los archivos de `src/` y vuelve a generarlo:

```bash
cd pd1-study && python3 build.py
```

## Funcionalidades

- **Inicio**: datos del examen, pesos, porcentaje de acierto por sección y accesos rápidos.
- **Guía**: objetivos oficiales resumidos, apuntes clave por sección, temas del banco, tabla de governor limits y enlaces oficiales.
- **Componentes base**: resumen de la [Lightning Component Reference](https://developer.salesforce.com/docs/platform/lightning-component-reference/guide/get-started.html) (sintaxis LWC frente a Aura, componentes por categoría, módulos y consejos para el examen) con preguntas propias.
- **Práctica**: por secciones o temas, con corrección y explicación inmediatas. Puedes filtrar por preguntas *no vistas* o *falladas*.
- **Examen simulado**: 60, 30 o 15 preguntas repartidas según los pesos oficiales, con cronómetro (105 min para 60 preguntas) y la opción de marcar preguntas para revisarlas. Da un resultado de aprobado o suspenso (68 %), un desglose por sección y la revisión con explicaciones.
- **Selección inteligente**: se priorizan las preguntas que aún no has visto y las que fallaste.
- **Progreso**: evolución de las notas, temas más débiles, historial, exportación e importación del progreso y carga de **preguntas propias en JSON**.
- Atajos de teclado: `A–E` para responder, `Enter` para comprobar o pasar a la siguiente, `←/→` para moverte y `M` para marcar.

Formato de las preguntas propias:

```json
[{ "s": "fund|auto|ui|test", "t": "Tema", "q": "Pregunta", "o": ["A", "B", "C", "D"], "a": [1], "e": "Explicación", "c": "código opcional" }]
```

## Resumen del examen

| Dato | Valor |
|---|---|
| Preguntas | 60 puntuables + hasta 5 no puntuables (opción múltiple / selección múltiple) |
| Duración | 105 minutos |
| Nota de corte | 68 % |
| Precio | 200 USD (repetición 100 USD) + impuestos |
| Requisitos | Ninguno obligatorio |
| Entrega | Supervisado online o en centro de examen, sin material de consulta |
| Mantenimiento | Módulo anual en Trailhead |

### Pesos por sección

| Sección | Peso | Preguntas (de 60) |
|---|---|---|
| Developer Fundamentals | 23 % | ~14 |
| Process Automation and Logic | 30 % | ~18 |
| User Interface | 25 % | ~15 |
| Testing, Debugging, and Deployment | 22 % | ~13 |

Estos pesos están vigentes desde la actualización de agosto de 2022. En 2025 Salesforce renombró la credencial y trasladó la gestión de certificaciones a Trailhead Academy. **Comprueba la guía oficial antes de examinarte.**

### Objetivos por sección

**Developer Fundamentals (23 %)**
- Conceptos multi-tenant, arquitectura MVC y Lightning Component Framework.
- Personalización declarativa frente a programática: governor limits, fórmulas y roll-up summaries.
- Modelo de datos: objetos, campos, relaciones y External IDs.
- Importación y exportación de datos.

**Process Automation and Logic (30 %)**
- Automatización declarativa (Flow).
- Variables, constantes, métodos, modificadores e interfaces de Apex. Control de flujo.
- Clases y triggers con buenas prácticas. SOQL, SOSL y DML.
- Governor limits, orden de ejecución, recursión y cascada.
- Excepciones (también las personalizadas), seguridad programática y combinación de Flow con Apex.

**User Interface (25 %)**
- Visualforce, Lightning Components (Aura y LWC) y Flow en la UI.
- Contenido web en Visualforce. Prevención de XSS y SOQL injection.
- Apex para componentes de página (LWC, Aura, Visualforce, Flow).

**Testing, Debugging, and Deployment (22 %)**
- Tests de triggers, controladores y flows con distintas fuentes de datos de test.
- Herramientas: Salesforce DX, Salesforce CLI, Developer Console.
- Entornos (sandboxes, scratch orgs), requisitos y proceso de despliegue.

## Estructura

```
pd1-study/
├── index.html                  # GENERADO: app autocontenida (abrir este)
├── build.py                    # empaqueta src/ en index.html
└── src/
    ├── index.html
    ├── styles.css
    ├── app.js                  # lógica: sesiones, generación de exámenes, progreso
    └── data/
        ├── guide.js            # datos del examen, objetivos, apuntes, límites, recursos
        ├── questions-fund.js   # Developer Fundamentals
        ├── questions-auto.js   # Process Automation and Logic
        ├── questions-ui.js     # User Interface
        ├── questions-test.js   # Testing, Debugging, and Deployment
        └── questions-components.js  # componentes base (sección User Interface)
```

Para añadir preguntas al banco, agrega objetos al archivo de la sección que corresponda en `src/data/` y ejecuta `python3 build.py`.

## Fuentes

- [Guía oficial: Trailhead Academy (Plat-Dev-201)](https://trailheadacademy.salesforce.com/certificate/exam-platform-dev1---Plat-Dev-201)
- [Credencial en Trailhead](https://trailhead.salesforce.com/credentials/platformdeveloperi)
- [Trailmix de preparación](https://trailhead.salesforce.com/content/learn/trails/platform-developer-i-certification-study-guide)
- [Cambios de nombre de las certificaciones en 2025 (Mason Frank)](https://www.masonfrank.com/insights/salesforce-certification-name-changes-2025/)

*Material de estudio no oficial. Las preguntas son originales y no proceden de ningún volcado del examen.*
