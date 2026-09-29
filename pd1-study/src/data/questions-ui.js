// Sección 3: User Interface (25 %)
window.PD1_QUESTIONS = window.PD1_QUESTIONS || [];
window.PD1_QUESTIONS.push(
  {
    s: 'ui', t: 'LWC + Apex',
    q: 'Un LWC usa @wire para llamar a un método Apex. ¿Qué anotación necesita el método?',
    o: ['@AuraEnabled', '@AuraEnabled(cacheable=true)', '@RemoteAction', '@InvocableMethod'],
    a: [1],
    e: 'Para @wire el método debe ser static y @AuraEnabled(cacheable=true). Los métodos cacheables no pueden hacer DML.'
  },
  {
    s: 'ui', t: 'LWC + Apex',
    q: 'Un LWC debe guardar un registro llamando a un método Apex que hace un insert al pulsar un botón. ¿Cómo debe invocarse?',
    o: [
      'Con @wire y cacheable=true',
      'De forma imperativa (import del método y llamada que devuelve una Promise), con @AuraEnabled sin cacheable',
      'Con un Visualforce remoting',
      'Con un evento de aplicación Aura'
    ],
    a: [1],
    e: 'Las operaciones que modifican datos se llaman imperativamente: guardar({ datos }).then(...).catch(...). Un método cacheable=true no puede hacer DML.'
  },
  {
    s: 'ui', t: 'LWC + Apex',
    q: '¿Qué dos requisitos debe cumplir un método Apex para ser llamado desde un LWC? (Elige 2)',
    o: ['Ser static', 'Estar anotado con @AuraEnabled', 'Ser global', 'Devolver siempre un String'],
    a: [0, 1],
    e: 'Los métodos deben ser static y @AuraEnabled, y public o global. Pueden devolver primitivos, sObjects, colecciones o clases con propiedades @AuraEnabled.'
  },
  {
    s: 'ui', t: 'LWC + Apex',
    q: '¿Cómo debe lanzar Apex un error para que el LWC reciba un mensaje personalizado legible?',
    o: ['throw new AuraHandledException(\'mensaje\');', 'System.debug(\'mensaje\');', 'return null;', 'ApexPages.addMessage()'],
    a: [0],
    e: 'AuraHandledException envía el mensaje al cliente (error.body.message). Otras excepciones llegan con un mensaje genérico.'
  },
  {
    s: 'ui', t: 'LWC',
    q: 'Un componente hijo debe exponer una propiedad que el padre pueda establecer. ¿Qué decorador se usa?',
    o: ['@track', '@api', '@wire', '@public'],
    a: [1],
    e: '@api hace pública una propiedad o método. El hijo no debe modificar una propiedad @api que recibe del padre (flujo de datos unidireccional).'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Cómo obtiene un LWC colocado en una Record Page el Id del registro actual?',
    o: ['Con getRecordId() de lightning/navigation', 'Declarando @api recordId;', 'Leyendo window.location', 'Con @wire(CurrentPageReference) exclusivamente'],
    a: [1],
    e: 'En una record page, el framework rellena automáticamente las propiedades públicas recordId y objectApiName.'
  },
  {
    s: 'ui', t: 'LWC',
    q: 'Un componente hijo debe notificar al padre que el usuario ha seleccionado un elemento. ¿Qué mecanismo es el adecuado?',
    o: [
      'this.dispatchEvent(new CustomEvent(\'seleccion\', { detail: id }))',
      'Lightning Message Service',
      'Un evento de aplicación Aura',
      'Modificar una propiedad @api del padre'
    ],
    a: [0],
    e: 'Hijo → padre: CustomEvent. El padre lo escucha con onseleccion={handler} (nombre del evento en minúsculas, sin guiones). Padre → hijo: propiedades o métodos @api.'
  },
  {
    s: 'ui', t: 'LWC',
    q: 'Dos LWC sin relación jerárquica en la misma página (uno de ellos en la utility bar) deben comunicarse. ¿Qué usar?',
    o: ['CustomEvent con bubbles', 'Lightning Message Service (LMS)', 'Propiedades @api', 'Variables static de Apex'],
    a: [1],
    e: 'LMS (lightning/messageService + un Message Channel) comunica componentes no relacionados, incluso entre LWC, Aura y Visualforce.'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Qué hay que configurar en el archivo .js-meta.xml para que un LWC aparezca en el Lightning App Builder en páginas de registro? (Elige 2)',
    o: [
      '<isExposed>true</isExposed>',
      '<target>lightning__RecordPage</target> dentro de <targets>',
      '<apiVersion>0</apiVersion>',
      'Anotar la clase JS con @api'
    ],
    a: [0, 1],
    e: 'isExposed=true y los targets deseados (lightning__AppPage, lightning__RecordPage, lightning__HomePage, lightning__RecordAction, lightning__FlowScreen, etc.).'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Qué hook del ciclo de vida de LWC se ejecuta cuando el componente se inserta en el DOM y es adecuado para inicializar datos?',
    o: ['constructor()', 'connectedCallback()', 'renderedCallback()', 'disconnectedCallback()'],
    a: [1],
    e: 'connectedCallback se ejecuta al insertarse en el DOM (padre → hijo). En el constructor no se deben leer atributos ni acceder a elementos. renderedCallback se ejecuta tras cada render.'
  },
  {
    s: 'ui', t: 'LWC',
    q: 'Un componente tiene la propiedad items = [] (sin decorador) y hace this.items.push(nuevo). La plantilla no se actualiza. ¿Qué dos soluciones funcionan? (Elige 2)',
    o: [
      'Reasignar el array: this.items = [...this.items, nuevo];',
      'Decorar la propiedad con @track',
      'Decorar la propiedad con @api',
      'Llamar a this.render()'
    ],
    a: [0, 1],
    e: 'Todas las propiedades son reactivas ante reasignación, pero las mutaciones internas de objetos/arrays solo se observan si la propiedad tiene @track.'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Qué es obligatorio al iterar una lista con for:each en una plantilla LWC?',
    o: ['Un atributo key único en el primer elemento dentro de la iteración', 'Un atributo index', 'Usar @track en la lista', 'Envolver en un <template lwc:if>'],
    a: [0],
    e: 'Cada elemento iterado necesita key={item.Id} (u otro valor único) para que el motor de render identifique los cambios.'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Cómo se accede a un elemento de la propia plantilla de un LWC desde JavaScript?',
    o: ['document.querySelector(\'.miClase\')', 'this.template.querySelector(\'.miClase\')', 'this.querySelector(\'.miClase\')', 'window.find(\'.miClase\')'],
    a: [1],
    e: 'Por el Shadow DOM, los elementos de la plantilla se consultan con this.template.querySelector(). document no alcanza el DOM encapsulado.'
  },
  {
    s: 'ui', t: 'Lightning Data Service',
    q: 'Se necesita un formulario para crear y editar un Contact con pocos campos, respetando FLS, sin escribir Apex. ¿Qué es lo más sencillo?',
    o: ['lightning-record-form', 'Un método Apex @AuraEnabled', 'Un Visualforce con controlador personalizado', 'Una Screen Flow con Apex'],
    a: [0],
    e: 'lightning-record-form, lightning-record-edit-form y lightning-record-view-form usan Lightning Data Service: caché compartida, FLS y sharing aplicados, sin Apex.'
  },
  {
    s: 'ui', t: 'Lightning Data Service',
    q: 'Un LWC quiere leer los campos Name e Industry de un Account sin Apex. ¿Qué wire adapter usar?',
    o: ['getRecord de lightning/uiRecordApi', 'getListUi de lightning/navigation', 'refreshApex', 'getObjectInfo de lightning/platformShowToastEvent'],
    a: [0],
    e: '@wire(getRecord, { recordId: \'$recordId\', fields: [NAME_FIELD, INDUSTRY_FIELD] }). Para leer valores: getFieldValue(). El prefijo $ hace reactivo el parámetro.'
  },
  {
    s: 'ui', t: 'LWC',
    q: 'Tras actualizar un registro con Apex imperativo, los datos obtenidos por @wire de un método Apex cacheable siguen mostrando valores antiguos. ¿Qué hacer?',
    o: ['Llamar a refreshApex(this.wiredResult)', 'Recargar la página con location.reload()', 'Quitar cacheable=true', 'Usar @track en el resultado'],
    a: [0],
    e: 'refreshApex() refresca el valor cacheado de un wire de Apex (se debe guardar el objeto completo que entrega el wire). Para registros de LDS también existe notifyRecordUpdateAvailable().'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Cómo se muestra un mensaje toast desde un LWC?',
    o: [
      "this.dispatchEvent(new ShowToastEvent({ title, message, variant: 'success' }))",
      'alert(mensaje)',
      "ApexPages.addMessage(mensaje)",
      "$A.get('e.force:showToast')"
    ],
    a: [0],
    e: 'Se importa ShowToastEvent de lightning/platformShowToastEvent. $A.get(\'e.force:showToast\') es la forma en Aura.'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Qué módulo se usa para navegar a una página de registro desde un LWC?',
    o: ['NavigationMixin de lightning/navigation', 'window.open siempre', 'lightning/uiRecordApi', 'lightning/messageService'],
    a: [0],
    e: 'La clase extiende NavigationMixin(LightningElement) y llama a this[NavigationMixin.Navigate]({ type: \'standard__recordPage\', attributes: {...} }).'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Cómo se importa en un LWC una custom label y un static resource?',
    o: [
      "import etiqueta from '@salesforce/label/c.MiEtiqueta'; import recurso from '@salesforce/resourceUrl/MiRecurso';",
      "import etiqueta from 'c/labels'; import recurso from 'c/resources';",
      "$Label.c.MiEtiqueta y $Resource.MiRecurso",
      'No se pueden importar; hay que usar Apex'
    ],
    a: [0],
    e: 'Los módulos @salesforce/* dan acceso a labels, resourceUrl, schema (campos/objetos), user, apex, etc. $Label/$Resource son sintaxis de Visualforce/Aura.'
  },
  {
    s: 'ui', t: 'Aura vs LWC',
    q: '¿Qué afirmación sobre la composición entre Aura y LWC es correcta?',
    o: [
      'Un LWC puede contener componentes Aura',
      'Un componente Aura puede contener LWC, pero no al revés',
      'No pueden coexistir en la misma página',
      'Ambos pueden contenerse mutuamente'
    ],
    a: [1],
    e: 'Aura puede envolver LWC; un LWC no puede contener componentes Aura. Sí pueden coexistir en la misma página y comunicarse con eventos o LMS.'
  },
  {
    s: 'ui', t: 'Aura',
    q: 'En Aura, ¿qué tipo de evento se usa para comunicar un componente con su contenedor/padre en la jerarquía?',
    o: ['Application event', 'Component event', 'Platform event', 'Change event'],
    a: [1],
    e: 'Component events se propagan por la jerarquía de contención. Application events usan un modelo publish-subscribe global (hoy se recomienda LMS).'
  },
  {
    s: 'ui', t: 'Aura',
    q: '¿Qué ficheros forman parte de un bundle de componente Aura? (Elige 2)',
    o: ['miComponente.cmp', 'miComponenteController.js y miComponenteHelper.js', 'miComponente.js-meta.xml con targets obligatorios', 'miComponente.page'],
    a: [0, 1],
    e: 'Un bundle Aura contiene .cmp (marcado), Controller.js, Helper.js, Renderer.js, .css, .design, .svg, .auradoc. .page es Visualforce.'
  },
  {
    s: 'ui', t: 'Visualforce',
    q: '¿Cuál es el constructor correcto de una extensión de controlador para una página con standardController="Account"?',
    o: [
      'public MiExt(ApexPages.StandardController stdController) { }',
      'public MiExt(Account acc) { }',
      'public MiExt() { }',
      'public MiExt(ApexPages.StandardSetController ctrl) { } siempre'
    ],
    a: [0],
    e: 'Una extensión recibe el controlador estándar en su constructor; con stdController.getRecord() obtiene el registro. Para páginas de listas se usa StandardSetController.'
  },
  {
    s: 'ui', t: 'Visualforce',
    q: 'Una página Visualforce debe mostrar una lista paginada de Accounts y permitir acciones masivas, reutilizando funcionalidad estándar. ¿Qué usar?',
    o: ['StandardSetController (recordSetVar)', 'Un controlador personalizado sin paginación', 'Un trigger', 'Un LWC dentro de <apex:page> sin controlador'],
    a: [0],
    e: 'StandardSetController (standardController + recordSetVar) incluye paginación (next, previous, setPageSize) y acciones sobre listas.'
  },
  {
    s: 'ui', t: 'Visualforce',
    q: '¿Qué debe devolver un método de acción de Visualforce para redirigir al usuario a otra página?',
    o: ['Un String con la URL', 'Un objeto PageReference', 'void', 'Un Boolean'],
    a: [1],
    e: 'Los métodos de acción devuelven PageReference (null para quedarse en la página). Ej.: return new PageReference(\'/\' + acc.Id); o Page.MiPagina.'
  },
  {
    s: 'ui', t: 'Visualforce',
    q: 'Una página Visualforce tiene un view state demasiado grande. ¿Qué técnica reduce su tamaño?',
    o: ['Declarar variables que no necesitan persistir como transient', 'Declarar todas las variables static', 'Usar with sharing', 'Aumentar el límite desde Setup'],
    a: [0],
    e: 'Las variables transient no se serializan en el view state (límite de 170 KB). También ayuda reducir los datos consultados.'
  },
  {
    s: 'ui', t: 'Visualforce',
    q: '¿Qué atributo hace que una página Visualforce adopte el estilo de Lightning Experience?',
    o: ['lightningStylesheets="true"', 'showHeader="false"', 'standardStylesheets="lightning"', 'applyLightning="true"'],
    a: [0],
    e: '<apex:page lightningStylesheets="true"> aplica estilos SLDS a los componentes estándar de Visualforce.'
  },
  {
    s: 'ui', t: 'Seguridad UI',
    q: '¿Qué práctica en Visualforce crea riesgo de Cross-Site Scripting (XSS)?',
    o: [
      '<apex:outputText value="{!entradaUsuario}" escape="false"/>',
      '<apex:outputText value="{!entradaUsuario}"/>',
      'Usar {!HTMLENCODE(entradaUsuario)}',
      'Usar {!JSENCODE(entradaUsuario)} dentro de un script'
    ],
    a: [0],
    e: 'escape="false" desactiva el escapado automático y permite inyectar HTML/JS. Las funciones HTMLENCODE, JSENCODE, JSINHTMLENCODE y URLENCODE ayudan a prevenir XSS.'
  },
  {
    s: 'ui', t: 'Seguridad UI',
    q: 'Un controlador Visualforce construye una consulta concatenando un parámetro de la URL. ¿Qué riesgo existe y cómo se mitiga?',
    c: "String nombre = ApexPages.currentPage().getParameters().get('n');\nList<Account> r = Database.query('SELECT Id FROM Account WHERE Name = \\'' + nombre + '\\'');",
    o: [
      'SOQL injection; usar variables bind o String.escapeSingleQuotes()',
      'XSS; usar HTMLENCODE',
      'CSRF; añadir un token',
      'No hay riesgo porque la consulta es de solo lectura'
    ],
    a: [0],
    e: 'Concatenar entradas del usuario en SOQL dinámico permite modificar la consulta. Se mitiga con binds (:nombre), escapeSingleQuotes o whitelisting.'
  },
  {
    s: 'ui', t: 'LWC',
    q: 'Un LWC debe ejecutarse como acción rápida (quick action) en la página de un registro. ¿Qué target se configura?',
    o: ['lightning__RecordAction', 'lightning__AppPage', 'lightning__Tab', 'lightningCommunity__Page'],
    a: [0],
    e: 'lightning__RecordAction (con actionType ScreenAction o Action) permite usar el LWC como quick action. Para componentes en Flow: lightning__FlowScreen.'
  },
  {
    s: 'ui', t: 'LWC',
    q: '¿Qué directivas condicionales se recomiendan actualmente en plantillas LWC?',
    o: ['lwc:if, lwc:elseif, lwc:else', 'aura:if', 'v-if', 'ng-if'],
    a: [0],
    e: 'lwc:if / lwc:elseif / lwc:else sustituyen a los antiguos if:true / if:false (que siguen funcionando pero no se recomiendan).'
  },
  {
    s: 'ui', t: 'Declarativo UI',
    q: 'Un administrador quiere mostrar u ocultar un componente en una Lightning record page según el valor de un campo, sin código. ¿Qué usar?',
    o: ['Component Visibility (filtros) en Lightning App Builder', 'Un trigger', 'Un Visualforce con rendered', 'Un LWC con lwc:if'],
    a: [0],
    e: 'Lightning App Builder permite reglas de visibilidad por campo, dispositivo o permiso. Dynamic Forms también permite visibilidad a nivel de campo.'
  }
);
