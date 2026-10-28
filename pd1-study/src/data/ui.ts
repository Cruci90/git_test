import { makeFactory } from './helper';

const q = makeFactory('ui', 'UI');

export const ui = [
  q(
    'Which decorator exposes a property of a Lightning Web Component so that a parent component can set it?',
    ['@track', '@api', '@wire', '@public'],
    1,
    '@api convierte una propiedad o método en pública: el padre puede establecerla/llamarla. @wire conecta datos reactivos y @track hace profunda la reactividad de objetos/arrays (ya no es necesario en la mayoría de casos).'
  ),
  q(
    'In which lifecycle hook should a LWC typically fetch data or subscribe to events when it is inserted into the DOM?',
    ['constructor()', 'connectedCallback()', 'renderedCallback()', 'disconnectedCallback()'],
    1,
    'connectedCallback() se ejecuta cuando el componente se inserta en el DOM; es el sitio habitual para inicializar datos o suscripciones. disconnectedCallback() sirve para limpiar. En el constructor no se puede acceder a los hijos ni atributos.'
  ),
  q(
    'A child LWC must notify its parent that a button was clicked. What is the recommended approach?',
    [
      'Call a method on the parent directly using document.querySelector',
      'Dispatch a CustomEvent from the child and handle it in the parent',
      'Use an @api method on the child',
      'Update a static variable shared between both components'
    ],
    1,
    'La comunicación hijo→padre se hace con eventos: this.dispatchEvent(new CustomEvent(\'nombre\', { detail })). El padre lo escucha con on<nombre>. Padre→hijo se hace con propiedades/métodos @api.'
  ),
  q(
    'Which wire adapter or approach should be used so that an Apex method can be called with @wire in a LWC?',
    [
      'The method must be annotated with @AuraEnabled(cacheable=true)',
      'The method must be annotated with @future',
      'The method must be declared global',
      'The method must return void'
    ],
    0,
    'Para usar @wire con Apex el método debe ser static y @AuraEnabled(cacheable=true). Los métodos que modifican datos no pueden ser cacheable y se llaman de forma imperativa.'
  ),
  q(
    'A LWC needs to call an Apex method that inserts a record when the user clicks a button. How should the call be made?',
    [
      'Imperatively, importing the Apex method and calling it in a handler',
      'With @wire because wire supports DML',
      'Through a lightning-formatted-text component',
      'Using Visualforce remoting'
    ],
    0,
    'Los métodos con DML no pueden ser cacheable, por tanto no se pueden usar con @wire; se importan (@salesforce/apex/Clase.metodo) y se invocan imperativamente, devolviendo una Promise.'
  ),
  q(
    'Which base component displays a form to view or edit a record using Lightning Data Service with minimal code?',
    ['lightning-datatable', 'lightning-record-form', 'lightning-input-field only', 'lightning-card'],
    1,
    'lightning-record-form genera automáticamente un formulario (ver/editar/crear) con LDS sin necesidad de Apex. Para más control se usan lightning-record-edit-form y lightning-record-view-form.'
  ),
  q(
    'Which directive should be used to render a list of items in a LWC template, and what is required on each item?',
    [
      'for:each with a unique key attribute on the first element inside',
      'for:each with an id attribute on the template tag',
      'iterate with a name attribute',
      'repeat with an index attribute'
    ],
    0,
    'for:each={coleccion} for:item="item" requiere un atributo key único y estable en el primer elemento del bucle para el renderizado eficiente del DOM.'
  ),
  q(
    'What is the modern directive used to conditionally render content in a LWC template?',
    ['if:true', 'lwc:if (with lwc:elseif / lwc:else)', 'v-if', 'rendered'],
    1,
    'lwc:if, lwc:elseif y lwc:else son las directivas actuales; if:true/if:false siguen funcionando pero están obsoletas.'
  ),
  q(
    'How does a LWC access an element in its own template from JavaScript?',
    [
      'document.querySelector()',
      'this.template.querySelector()',
      'window.find()',
      'this.querySelector() always'
    ],
    1,
    'Por el Shadow DOM, los elementos del template propio se obtienen con this.template.querySelector(); document.querySelector no atraviesa los límites del shadow.'
  ),
  q(
    'Which file configures where a LWC can be used (for example App Page, Record Page, Home Page)?',
    [
      'The .js-meta.xml file',
      'The .html file',
      'The .css file',
      'The package.xml file'
    ],
    0,
    'El archivo componente.js-meta.xml contiene isExposed, apiVersion y los targets (lightning__RecordPage, lightning__AppPage, etc.) que determinan dónde se puede usar el componente.'
  ),
  q(
    'A developer needs two unrelated LWCs on the same page to communicate. Which option is appropriate?',
    ['Lightning Message Service', 'Custom setting', 'Static variable', 'A formula field'],
    0,
    'Lightning Message Service (canales de mensajes) permite comunicar componentes LWC, Aura y Visualforce que no tienen relación padre-hijo dentro de la misma página.'
  ),
  q(
    'In a LWC, how do you navigate to a record page programmatically?',
    [
      'window.location.href = "/" + recordId',
      'Use NavigationMixin.Navigate with a PageReference',
      'Call Apex and redirect',
      'Use lightning-navigation-helper'
    ],
    1,
    'NavigationMixin (lightning/navigation) con un PageReference (type standard__recordPage) es el método soportado y funciona en Lightning Experience, Experience Cloud y app móvil.'
  ),
  q(
    'After an imperative Apex call updates data, how can a component refresh the cached data provided by a @wire adapter?',
    ['refreshApex()', 'location.reload()', 'this.wire.reset()', 'Database.refresh()'],
    0,
    'refreshApex(valorWireado) invalida la caché del adaptador de Apex wire y vuelve a solicitar los datos al servidor.'
  ),
  q(
    'Which statement about the renderedCallback() hook is correct?',
    [
      'It runs once, only after the first render.',
      'It runs after every render of the component, so logic should be guarded to avoid infinite loops.',
      'It runs before connectedCallback().',
      'It is only used for server-side rendering.'
    ],
    1,
    'renderedCallback() se ejecuta tras cada renderizado; si dentro cambias estado reactivo puedes causar un bucle infinito, por eso se suele proteger con un flag (por ejemplo, hasRendered).'
  ),
  q(
    'Which tools can be used to unit test Lightning Web Components?',
    ['Jest', 'ApexUnit', 'JUnit', 'Selenium only'],
    0,
    'Los LWC se prueban con Jest (sfdx-lwc-jest). Los métodos Apex se prueban con clases @isTest.'
  ),
  q(
    'Which Visualforce attribute binds a page to the standard controller for the Account object?',
    [
      '<apex:page standardController="Account">',
      '<apex:page controller="Account">',
      '<apex:page object="Account">',
      '<apex:page extensions="Account">'
    ],
    0,
    'standardController="Account" proporciona la funcionalidad estándar (save, edit, delete...). controller se usa para un controlador Apex personalizado; extensions para añadir lógica a uno estándar.'
  ),
  q(
    'A Visualforce page needs additional logic on top of the standard controller. What should a developer do?',
    [
      'Create a controller extension class with a constructor that accepts ApexPages.StandardController',
      'Replace the standard controller with a trigger',
      'Use a static resource',
      'Create a custom setting'
    ],
    0,
    'Las controller extensions amplían un standard o custom controller. Su constructor recibe ApexPages.StandardController (o el controller personalizado) y se declara con extensions="MiClase".'
  ),
  q(
    'Which Visualforce expression displays the Name field of the record in a standard controller page?',
    ['{!Account.Name}', '{Account.Name}', '${Account.Name}', '<%= Account.Name %>'],
    0,
    'Las expresiones en Visualforce usan la sintaxis {! }. Con el standard controller de Account la variable es Account.'
  ),
  q(
    'What is the purpose of the "rendered" attribute on Visualforce components?',
    [
      'To conditionally display the component based on a Boolean expression',
      'To choose the PDF rendering engine',
      'To refresh the page automatically',
      'To bind a CSS class'
    ],
    0,
    'rendered controla si el componente se incluye en la salida HTML, según una expresión booleana. Con renderAs="pdf" en apex:page se genera un PDF.'
  ),
  q(
    'In Aura components, which type of event can be handled by any component in the application, regardless of hierarchy?',
    ['Component event', 'Application event', 'DOM event', 'Platform event'],
    1,
    'Los application events se difunden a todos los componentes que los escuchen. Los component events solo suben por la jerarquía contenedora (bubble/capture).'
  ),
  q(
    'Which Aura attribute tag declares a variable in a component?',
    ['<aura:attribute name="x" type="String"/>', '<aura:var name="x"/>', '<aura:property name="x"/>', '<aura:data name="x"/>'],
    0,
    '<aura:attribute> define los atributos (variables) con su nombre, tipo y valor por defecto. Se accede con {!v.x} en la plantilla.'
  ),
  q(
    'A security review warns about cross-site scripting (XSS) in a Visualforce page. Which practice helps prevent it?',
    [
      'Use HTMLENCODE, JSENCODE or URLENCODE functions when merging user-supplied data',
      'Disable the browser cache',
      'Use <apex:outputText escape="false"> for all fields',
      'Move the logic to a trigger'
    ],
    0,
    'Hay que escapar los datos de usuario al renderizarlos con HTMLENCODE, JSENCODE, JSINHTMLENCODE o URLENCODE. escape="false" es el error común que provoca XSS.'
  ),
  q(
    'What is the purpose of lightning-record-edit-form compared with lightning-record-form?',
    [
      'It provides more control over the layout and fields while still using Lightning Data Service',
      'It requires a custom Apex controller',
      'It can only display read-only data',
      'It replaces Visualforce pages'
    ],
    0,
    'lightning-record-edit-form permite diseñar los campos libremente con lightning-input-field y personalizar los botones, manteniendo la validación y seguridad de LDS.'
  ),
  q(
    'A user needs to reference a static resource image in a LWC. Which import is correct?',
    [
      "import LOGO from '@salesforce/resourceUrl/companyLogo';",
      "import LOGO from '@salesforce/staticResource/companyLogo';",
      "import LOGO from 'c/companyLogo';",
      "import LOGO from '@salesforce/image/companyLogo';"
    ],
    0,
    '@salesforce/resourceUrl/nombre devuelve la URL del recurso estático. Otros módulos útiles: @salesforce/label, @salesforce/schema, @salesforce/apex.'
  ),
  q(
    'Which tool lets an admin build Lightning pages and place both standard and custom components without code?',
    ['Lightning App Builder', 'Developer Console', 'Schema Builder', 'Process Builder'],
    0,
    'Lightning App Builder arrastra y suelta componentes para crear páginas de aplicación, de registro y de inicio. Los LWC deben exponerse con isExposed y targets adecuados.'
  ),
  q(
    'How can a developer let users run a custom action (for example "Convert") from the record page without leaving it?',
    ['A quick action', 'A custom tab', 'A validation rule', 'A page layout section only'],
    0,
    'Las Quick Actions (acciones globales o de objeto) pueden abrir un LWC, un flow o un formulario en un modal desde la página de registro.'
  ),
  q(
    'Which LWC feature allows a parent component to inject content into a child component\'s template?',
    ['Slots', 'Wire adapters', 'Static resources', 'Decorators'],
    0,
    '<slot> permite que el componente padre proporcione contenido HTML que el hijo renderiza en una posición definida, habilitando composición reutilizable.'
  ),
  q(
    'What does Lightning Web Security (LWS) provide?',
    [
      'A security architecture that isolates component namespaces and sandboxes JavaScript execution',
      'A replacement for sharing rules',
      'Encryption of fields at rest',
      'Login IP restrictions'
    ],
    0,
    'LWS (sucesor de Lightning Locker) aísla los componentes por namespace y limita el acceso a APIs del navegador y al DOM de otros componentes.'
  ),
  q(
    'In LWC, how do you let a custom event bubble up through the DOM and cross shadow boundaries?',
    [
      'new CustomEvent(\'x\', { bubbles: true, composed: true })',
      'new CustomEvent(\'x\', { global: true })',
      'new CustomEvent(\'x\', { cross: true })',
      'dispatchEvent(\'x\', true)'
    ],
    0,
    'bubbles: true hace que el evento suba en el DOM y composed: true le permite atravesar el límite del shadow DOM. Se recomienda usarlos con cuidado, solo cuando sea necesario.'
  ),
  q(
    'A LWC must use the current record\'s Id on a Record Page. How is it obtained?',
    [
      'Declare @api recordId; the platform sets it on record pages',
      'Call Apex to get the Id',
      'Parse window.location',
      'Use a custom setting'
    ],
    0,
    'En páginas de registro, declarar @api recordId (y opcionalmente @api objectApiName) hace que la plataforma inyecte el Id del registro actual.'
  ),

  q(
    'A Lightning web component must display data from a complex SOQL query that includes parent fields and a child subquery. How should the component obtain the data?',
    [
      'Call an Apex method annotated with @AuraEnabled (cacheable=true when read-only)',
      'Write the SOQL directly in the component JavaScript',
      'Subscribe to the Streaming API',
      'Embed a flow that runs the query'
    ],
    0,
    'Las consultas SOQL complejas viven en Apex; el LWC importa el método (@salesforce/apex/...) y lo usa con @wire (si es cacheable=true) o de forma imperativa. JavaScript no puede ejecutar SOQL directamente.'
  ),
  q(
    'Which THREE elements are needed to render a Lightning component inside a Visualforce page (Lightning Out)? (Choose 3.)',
    [
      '<apex:includeLightning />',
      '$Lightning.use() referencing a Lightning app that declares the dependency',
      '$Lightning.createComponent() to insert the component',
      '<apex:slds />',
      '$Lightning.useComponent()'
    ],
    [0, 1, 2],
    'Se necesita la librería (<apex:includeLightning/>), $Lightning.use() para cargar la app Aura con la dependencia y $Lightning.createComponent() para crear el componente en un elemento DOM. <apex:slds/> solo carga estilos.'
  ),
  q(
    'Which Visualforce markup is the most likely to introduce a cross-site scripting (XSS) vulnerability?',
    [
      '<apex:outputText value="{!$CurrentPage.parameters.q}" escape="false" />',
      '<apex:outputText value="{!$CurrentPage.parameters.q}" />',
      '<apex:outputText value="{!Account.Name}" />',
      '<apex:outputText value="{!HTMLENCODE($CurrentPage.parameters.q)}" />'
    ],
    0,
    'Mostrar un parámetro de la URL (controlado por el atacante) con escape="false" desactiva el escapado HTML y permite inyectar scripts. Por defecto outputText escapa el contenido.'
  ),
  q(
    'A flow named accountOnboarding must be shown inside an Aura component. Which markup should the developer use?',
    [
      '<lightning:flow aura:id="flow" />',
      '<aura:flow name="accountOnboarding" />',
      '<lightning-flow flow="accountOnboarding"></lightning-flow>',
      '<force:flow />'
    ],
    0,
    'En Aura se usa el componente <lightning:flow> y se inicia desde el controlador con component.find("flow").startFlow("accountOnboarding"). La sintaxis con guion (lightning-) pertenece a LWC.'
  ),
  q(
    'A team needs a custom form that validates user input in the browser before saving and can be placed on Lightning pages. Which technology is the best fit?',
    [
      'A Lightning web component using lightning-input and its validity checks',
      'A schedule-triggered flow',
      'A batch Apex class',
      'A custom setting'
    ],
    0,
    'Los LWC permiten UI personalizada, validación en cliente (reportValidity/setCustomValidity) y se pueden exponer en Lightning App Builder. Las otras opciones no tienen interfaz de usuario.'
  ),
  q(
    'A developer must override the standard Edit button for Contacts so that users get a custom UI in both Salesforce Classic and Lightning Experience. What should be used?',
    [
      'A Visualforce page for Classic and a Lightning component for Lightning Experience',
      'A Lightning component for Classic and a Visualforce page for Lightning Experience',
      'A Lightning component for both experiences',
      'A flow for both experiences'
    ],
    0,
    'Classic solo admite sobrescribir botones con páginas Visualforce; Lightning Experience permite componentes Lightning (o páginas Lightning/Visualforce). Hay que proveer una implementación para cada runtime.'
  ),
  q(
    'Sales Reps may read Commission__c; Sales Assistants may not. A single Apex method feeds an LWC and must work for both users without throwing errors. What should the developer do?',
    [
      'Query the field and then apply Security.stripInaccessible(AccessType.READABLE, records)',
      'Add WITH SECURITY_ENFORCED to the query',
      'Rely on Lightning Web Security to remove the field',
      'Check the user\'s profile name and branch the query'
    ],
    0,
    'stripInaccessible elimina de los resultados los campos a los que el usuario no tiene acceso, sin error. WITH SECURITY_ENFORCED lanza una excepción si el usuario no puede leer algún campo de la consulta; LWS no aplica FLS y comprobar nombres de perfil es frágil.'
  ),

  q(
    'Which wire adapter should a LWC use to read fields of a record via Lightning Data Service?',
    ['getRecord from lightning/uiRecordApi', 'getRecords from lightning/apex', 'queryRecord from lightning/data', 'fetchRecord from lightning/ldsApi'],
    0,
    'getRecord (lightning/uiRecordApi) es el adaptador wire estándar para leer un registro y sus campos respetando CRUD, FLS y sharing, sin Apex.'
  ),
  q(
    'A LWC must create a record in JavaScript without writing Apex. What should the developer use?',
    ['createRecord from lightning/uiRecordApi', 'insert from lightning/dml', 'Database.insert in the component', 'A SOQL query'],
    0,
    'createRecord (lightning/uiRecordApi) crea registros mediante LDS de forma imperativa; también existen updateRecord y deleteRecord.'
  ),
  q(
    'How does a LWC display a toast message?',
    [
      'Dispatch a ShowToastEvent imported from lightning/platformShowToastEvent',
      'Call alert() from the component',
      'Call System.debug() in JavaScript',
      'Use the lightning-toast Apex class'
    ],
    0,
    'Se crea new ShowToastEvent({ title, message, variant }) y se lanza con this.dispatchEvent(). alert() no se recomienda en Lightning.'
  ),
  q(
    'Which LWC lifecycle hook captures errors thrown by child components in its template?',
    ['errorCallback(error, stack)', 'catchCallback()', 'disconnectedCallback()', 'renderedCallback()'],
    0,
    'errorCallback es el "error boundary" del componente: captura errores en los hijos durante la creación, renderizado, callbacks de ciclo de vida, etc.'
  ),
  q(
    'A parent LWC must call a method on its child component. What is required?',
    [
      'Decorate the child method with @api and call it through this.template.querySelector()',
      'Make the child method static',
      'Dispatch a DOM event from the parent',
      'Import the child class into the parent JavaScript'
    ],
    0,
    'Los métodos públicos del hijo se exponen con @api y el padre los invoca sobre el elemento hijo obtenido con this.template.querySelector("c-hijo").'
  ),
  q(
    'Which THREE attributes are required by lightning-datatable? (Choose 3.)',
    ['key-field', 'columns', 'data', 'sortable-all', 'hide-checkbox-column'],
    [0, 1, 2],
    'lightning-datatable necesita key-field (identificador único de fila), columns (definición de columnas) y data (filas). sortable y hide-checkbox-column son opcionales.'
  ),
  q(
    'Which target in the .js-meta.xml file makes a LWC available as a quick action on a record page?',
    ['lightning__RecordPage', 'lightning__RecordAction', 'lightning__AppPage', 'lightning__Tab'],
    1,
    'lightning__RecordAction (con actionType Action/ScreenAction) permite usar el LWC como quick action. lightning__RecordPage lo coloca como componente en la página de registro.'
  ),
  q(
    'Which Visualforce controller provides built-in pagination and handling of record lists?',
    ['StandardController', 'StandardSetController', 'ApexPages.Message', 'A controller extension only'],
    1,
    'StandardSetController maneja listas de registros (list views, selección y paginación), usado con standardController + recordSetVar.'
  ),
  q(
    'A Visualforce controller holds a large collection that is not needed after the page loads. How can the view state size be reduced?',
    ['Declare the variable as transient', 'Declare the variable as static final', 'Mark it with @AuraEnabled', 'Move it to a trigger'],
    0,
    'Las variables "transient" no se serializan en el view state, reduciendo su tamaño (el límite es de 170 KB).'
  ),
  q(
    'Which Visualforce component lets JavaScript call a controller action with AJAX and re-render part of the page?',
    ['apex:actionFunction', 'apex:includeScript', 'apex:param', 'apex:outputPanel only'],
    0,
    'apex:actionFunction define una función JavaScript que invoca una acción del controlador por AJAX y puede refrescar áreas con rerender.'
  ),
  q(
    'Which interface must an Aura component implement to receive the current record Id on a record page?',
    ['force:hasRecordId', 'force:appHostable', 'lightning:isUrlAddressable', 'flexipage:hasPageId'],
    0,
    'force:hasRecordId añade el atributo recordId con el Id del registro actual. Para mostrarlo en App Builder además se usa flexipage:availableForRecordHome.'
  ),
  q(
    'In a LWC, which change to a class field reliably triggers a re-render?',
    [
      'this.items = [...this.items, newItem];',
      'this.items.push(newItem); on a plain array field without @track',
      'Changing an object property that is not tracked',
      'Calling this.items.length'
    ],
    0,
    'Todos los campos son reactivos, pero para valores no primitivos sin @track solo se detecta la reasignación del campo. Crear un array nuevo (spread) asegura el re-render.'
  ),
  q(
    'Which TWO are benefits of using Lightning Data Service instead of Apex for record access? (Choose 2.)',
    [
      'No Apex code or SOQL is needed for basic record operations',
      'CRUD, field-level security and sharing are enforced automatically',
      'It bypasses all governor limits',
      'It supports unrestricted aggregate queries'
    ],
    [0, 1],
    'LDS ofrece acceso a registros sin Apex, respeta automáticamente los permisos del usuario y comparte caché entre componentes. No elimina governor limits ni ejecuta consultas arbitrarias.'
  ),
  q(
    'How does a LWC reference a custom label named Welcome_Msg?',
    [
      "import WELCOME from '@salesforce/label/c.Welcome_Msg';",
      "import WELCOME from '@salesforce/customLabel/Welcome_Msg';",
      "import WELCOME from 'c/Welcome_Msg';",
      'Custom labels cannot be used in LWC.'
    ],
    0,
    'Las etiquetas personalizadas se importan con @salesforce/label/c.NombreEtiqueta (c es el namespace por defecto) y se exponen como propiedad del componente.'
  ),
  q(
    'An administrator wants to show or hide fields on a record page based on field values, without code. Which feature should be used?',
    ['Dynamic Forms with visibility filters', 'Validation rules', 'Page layout assignments only', 'Apex triggers'],
    0,
    'Dynamic Forms permite colocar campos como componentes en Lightning App Builder con filtros de visibilidad por valor de campo, perfil, etc.'
  ),
  q(
    'How does a LWC read the Id of the current user?',
    [
      "import USER_ID from '@salesforce/user/Id';",
      "import USER_ID from '@salesforce/currentUser/Id';",
      'It must call Apex UserInfo.getUserId() always',
      "import USER_ID from 'lightning/user';"
    ],
    0,
    '@salesforce/user/Id exporta el Id del usuario actual directamente en el componente, sin llamar a Apex.'
  )
];
