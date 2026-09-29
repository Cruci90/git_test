// Información del examen y guía de estudio por sección
window.PD1_EXAM = {
  name: 'Salesforce Certified Platform Developer (antes "Platform Developer I")',
  code: 'Plat-Dev-201',
  facts: [
    ['Preguntas', '60 puntuables (opción múltiple / selección múltiple) + hasta 5 no puntuables'],
    ['Duración', '105 minutos'],
    ['Nota de corte', '68 % (≈ 41 de 60 correctas)'],
    ['Precio', '200 USD + impuestos'],
    ['Repetición', '100 USD + impuestos'],
    ['Requisitos previos', 'Ninguno obligatorio (se recomienda experiencia con Apex, LWC y Flow)'],
    ['Formato', 'Supervisado: online (Kryterion/Webassessor) o en centro de examen'],
    ['Material permitido', 'Ninguno'],
    ['Mantenimiento', 'Módulo anual de mantenimiento en Trailhead para conservar la certificación']
  ],
  notes: [
    'En 2025 Salesforce renombró la credencial a "Salesforce Certified Platform Developer" y la gestión de certificaciones pasó a Trailhead Academy. El contenido y los pesos publicados desde agosto de 2022 se mantienen: 23 / 30 / 25 / 22.',
    'Las preguntas de selección múltiple indican cuántas respuestas elegir ("Choose 2"). No hay puntuación parcial.',
    'Consulta siempre la guía oficial en Trailhead Academy antes de presentarte por si hay una actualización de release.'
  ],
  resources: [
    ['Guía oficial del examen (Trailhead Academy)', 'https://trailheadacademy.salesforce.com/certificate/exam-platform-dev1---Plat-Dev-201'],
    ['Credencial en Trailhead', 'https://trailhead.salesforce.com/credentials/platformdeveloperi'],
    ['Trailmix oficial: Prepare for your Platform Developer Credential', 'https://trailhead.salesforce.com/content/learn/trails/platform-developer-i-certification-study-guide'],
    ['Apex Developer Guide', 'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/'],
    ['Execution Governors and Limits', 'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm'],
    ['Triggers and Order of Execution', 'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers_order_of_execution.htm'],
    ['Lightning Web Components Developer Guide', 'https://developer.salesforce.com/docs/platform/lwc/guide'],
    ['Visualforce Developer Guide', 'https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/'],
    ['Superbadge: Apex Specialist', 'https://trailhead.salesforce.com/content/learn/superbadges/superbadge_apex']
  ]
};

window.PD1_SECTIONS = [
  {
    id: 'fund',
    name: 'Developer Fundamentals',
    weight: 23,
    color: 'var(--c-fund)',
    objectives: [
      'Conceptos multi-tenant y frameworks de diseño: MVC y Lightning Component Framework.',
      'Casos de uso y buenas prácticas de personalización declarativa vs programática: governor limits, campos fórmula y roll-up summary.',
      'Determinar, crear y acceder al modelo de datos adecuado: objetos, campos, relaciones y External IDs.',
      'Importar y exportar datos en entornos de desarrollo.'
    ],
    notes: [
      '<b>Multitenancy</b>: recursos compartidos ⇒ governor limits ⇒ código bulkificado.',
      '<b>MVC</b>: Model = objetos/campos · View = Visualforce, LWC, Aura, layouts · Controller = controladores estándar, Apex, JS.',
      '<b>Master-detail</b>: borrado en cascada, detalle sin Owner (hereda sharing), campo obligatorio, permite roll-up summary, máximo 2 por objeto.',
      '<b>Lookup</b>: relación débil, opcional, sin roll-up nativo (usar Flow/Apex). <b>Hierarchical</b>: solo User.',
      '<b>Junction object</b>: dos master-detail ⇒ relación muchos-a-muchos.',
      '<b>Fórmulas cross-object</b>: hasta 10 relaciones únicas por objeto; no almacenan datos.',
      '<b>External ID</b> + <b>upsert</b> para integraciones sin duplicados.',
      '<b>Data Import Wizard</b> ≤ 50.000 registros y objetos comunes · <b>Data Loader</b> ≤ 5 millones, todos los objetos, también export/delete.',
      '<b>Custom Metadata Types</b>: configuración desplegable (los registros viajan en change sets). <b>Hierarchy Custom Settings</b>: valores por org/perfil/usuario.',
      '<b>Sharing</b>: with sharing / without sharing / inherited sharing. Sin palabra clave ⇒ hereda (o without si es punto de entrada).',
      '<b>FLS/CRUD</b>: WITH USER_MODE, WITH SECURITY_ENFORCED, Security.stripInaccessible(), Describe (isAccessible/isUpdateable).',
      '<b>Apex</b>: variables sin inicializar = null; constantes static final; herencia requiere virtual/abstract + override; global para otros namespaces.'
    ]
  },
  {
    id: 'auto',
    name: 'Process Automation and Logic',
    weight: 30,
    color: 'var(--c-auto)',
    objectives: [
      'Capacidades de la automatización declarativa (Flow, approval processes, validation rules…).',
      'Declarar variables, constantes, métodos; usar modificadores e interfaces de Apex.',
      'Sentencias de control de flujo en Apex.',
      'Escribir clases y triggers de Apex siguiendo buenas prácticas.',
      'Escribir SOSL, SOQL y DML en Apex.',
      'Implicaciones de los governor limits en las transacciones.',
      'Relación entre transacciones, orden de ejecución, recursión y cascada.',
      'Manejo de excepciones, incluidas excepciones personalizadas.',
      'Técnicas programáticas para prevenir vulnerabilidades de seguridad.',
      'Combinar funcionalidad declarativa y Apex (p. ej. Invocable methods desde Flow).'
    ],
    notes: [
      '<b>Before trigger</b>: modificar el mismo registro sin DML y validar (addError). <b>After trigger</b>: necesita Id, crear/actualizar registros relacionados.',
      '<b>Contexto</b>: Trigger.old/oldMap no existen en insert; Trigger.newMap no existe en before insert; no hay before undelete.',
      '<b>Bulkificación</b>: sin SOQL/DML en bucles, usar Set&lt;Id&gt; y Map&lt;Id, sObject&gt;. Un trigger por objeto + handler. Evitar recursión con static Set&lt;Id&gt;.',
      '<b>Orden de ejecución</b>: system validation → before-save flows → before triggers → validation rules → duplicate rules → save → after triggers → assignment/auto-response → workflow (field update ⇒ triggers de update otra vez) → after-save flows → escalation → roll-ups → sharing → commit → post-commit (emails, async).',
      '<b>DML</b>: insert/update/upsert/delete/undelete/merge (todo o nada) vs Database.xxx(lista, false) con SaveResult (éxito parcial). Savepoint + rollback.',
      '<b>MIXED_DML_OPERATION</b>: setup (User, Group…) + no-setup ⇒ separar con @future/Queueable (runAs en tests).',
      '<b>Excepciones</b>: QueryException (0 filas asignadas a un sObject), NullPointerException, DmlException, ListException. LimitException no se captura. Custom: extends Exception y nombre terminado en "Exception".',
      '<b>Asíncrono</b>: @future (static void, solo primitivos, callout=true) · Queueable (sObjects, Job Id, encadenable) · Batch (start/execute/finish, 200 por defecto, máx. 2.000, Database.Stateful) · Schedulable (System.schedule + cron).',
      '<b>Platform Events</b> (__e): EventBus.publish; triggers after insert; Publish Immediately vs After Commit.',
      '<b>Flow</b>: Screen, Record-triggered (before-save = fast field updates, after-save), Schedule-triggered, Autolaunched, Platform event-triggered. Apex desde Flow: @InvocableMethod (uno por clase, static, List in/out) + @InvocableVariable.',
      '<b>Gotchas Apex</b>: String == no distingue mayúsculas; Integer/Integer trunca; claves de Map/Set de String sí distinguen mayúsculas; variables static duran la transacción.',
      '<b>SOQL</b>: agregados ⇒ List&lt;AggregateResult&gt;; SELECT COUNT() ⇒ Integer; SOQL for loop para ahorrar heap.'
    ]
  },
  {
    id: 'ui',
    name: 'User Interface',
    weight: 25,
    color: 'var(--c-ui)',
    objectives: [
      'Mostrar y usar componentes de UI personalizados: Lightning Components, Flow y Visualforce.',
      'Tipos de contenido web que se pueden incorporar en páginas Visualforce.',
      'Prevenir vulnerabilidades de seguridad en la UI y en el acceso a datos (XSS, SOQL injection).',
      'Lightning Component Framework: beneficios y tipos de contenido de un LWC.',
      'Implementar Apex para trabajar con distintos tipos de componentes de página (Visualforce, Lightning Components, Flow, Next Best Action…).'
    ],
    notes: [
      '<b>Apex desde LWC</b>: static + @AuraEnabled. @wire exige cacheable=true (sin DML). DML ⇒ llamada imperativa (Promise). Errores ⇒ AuraHandledException.',
      '<b>Decoradores</b>: @api (público, recordId/objectApiName en record pages), @track (observar mutaciones internas de objetos/arrays), @wire (datos reactivos, parámetros con $).',
      '<b>Comunicación</b>: padre→hijo @api · hijo→padre CustomEvent + dispatchEvent · no relacionados ⇒ Lightning Message Service.',
      '<b>Ciclo de vida</b>: constructor → connectedCallback → render → renderedCallback → disconnectedCallback; errorCallback captura errores de hijos.',
      '<b>LDS</b>: lightning-record-form / edit-form / view-form, getRecord, getFieldValue, createRecord, updateRecord; aplica FLS y sharing sin Apex. refreshApex / notifyRecordUpdateAvailable para refrescar.',
      '<b>Módulos</b>: lightning/platformShowToastEvent, lightning/navigation (NavigationMixin), lightning/uiRecordApi, @salesforce/label, @salesforce/resourceUrl, @salesforce/apex, @salesforce/schema.',
      '<b>Meta XML</b>: isExposed + targets (lightning__RecordPage, AppPage, HomePage, RecordAction, FlowScreen, UtilityBar, Community).',
      '<b>Plantillas</b>: lwc:if/elseif/else, for:each con key, iterator; this.template.querySelector (Shadow DOM).',
      '<b>Aura</b>: .cmp, Controller.js, Helper.js; component events (jerarquía) vs application events. Aura puede contener LWC, no al revés.',
      '<b>Visualforce</b>: standardController, extensions (constructor con ApexPages.StandardController), StandardSetController (recordSetVar, paginación), métodos de acción ⇒ PageReference, transient reduce view state (170 KB), lightningStylesheets="true".',
      '<b>Seguridad</b>: evita escape="false"; usa HTMLENCODE/JSENCODE/URLENCODE; binds o escapeSingleQuotes en SOQL dinámico; CSRF protegido en acciones estándar.'
    ]
  },
  {
    id: 'test',
    name: 'Testing, Debugging, and Deployment',
    weight: 22,
    color: 'var(--c-test)',
    objectives: [
      'Escribir y ejecutar tests para triggers, controladores, flows y procesos usando distintas fuentes de datos de test.',
      'Saber cuándo usar las herramientas de desarrollo: Salesforce DX, Salesforce CLI, Developer Console.',
      'Entornos, requisitos y proceso para desplegar código y su configuración.'
    ],
    notes: [
      '<b>Cobertura</b>: 75 % global para desplegar a producción, todos los triggers > 0 %, todos los tests en verde. Las clases @isTest no cuentan.',
      '<b>Datos</b>: aislados por defecto (se ven User, Profile, RecordType…). @testSetup (una vez por clase), Test.loadData (CSV en static resource), TestDataFactory. Evitar SeeAllData=true.',
      '<b>Test.startTest/stopTest</b>: límites nuevos y ejecución síncrona de async al hacer stopTest. Batch en test: solo un execute().',
      '<b>Mocks</b>: HttpCalloutMock + Test.setMock, StaticResourceCalloutMock, WebServiceMock, Stub API.',
      '<b>System.runAs</b>: sharing de un usuario concreto y evita MIXED_DML en tests. @TestVisible expone miembros privados.',
      '<b>Asserts</b>: Assert.areEqual / isTrue / fail (o System.assertEquals). Probar positivo, negativo, bulk (200) y usuario restringido.',
      '<b>Debug</b>: trace flags + debug levels (categorías: Database, Workflow, Validation, Callouts, Apex Code, Apex Profiling, Visualforce, System). Developer Console: Log Inspector, checkpoints, Query Editor, Execute Anonymous (confirma cambios). Apex Replay Debugger en VS Code. Clase Limits.',
      '<b>Sandboxes</b>: Developer (200 MB, metadatos, 1 día) · Developer Pro (1 GB, 1 día) · Partial Copy (5 GB + muestra de datos, 5 días) · Full (copia completa, 29 días). <b>Scratch orgs</b>: Dev Hub + CLI, efímeros (≤ 30 días).',
      '<b>Despliegue</b>: change sets (orgs conectadas, deployment connection, sin borrados ni datos), Salesforce CLI / Metadata API (destructiveChanges), paquetes (unmanaged, unlocked, managed), DevOps Center. Validación + Quick Deploy. Niveles de test: NoTestRun, RunSpecifiedTests, RunLocalTests, RunAllTestsInOrg.'
    ]
  }
];

window.PD1_LIMITS = [
  ['Consultas SOQL', '100', '200'],
  ['Filas recuperadas por SOQL', '50.000', '50.000'],
  ['Consultas SOSL', '20', '20'],
  ['Sentencias DML', '150', '150'],
  ['Filas procesadas por DML', '10.000', '10.000'],
  ['Tiempo de CPU', '10 s', '60 s'],
  ['Heap', '6 MB', '12 MB'],
  ['Callouts HTTP', '100', '100'],
  ['Llamadas @future por transacción', '50', '50 (no se permite desde batch ni desde otro @future)'],
  ['Jobs Queueable encolados', '50', '1'],
  ['Emails enviados (sendEmail)', '10', '10']
];
