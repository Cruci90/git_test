// Sección 3 (User Interface): componentes base de la Lightning Component Reference
window.PD1_QUESTIONS = window.PD1_QUESTIONS || [];
window.PD1_QUESTIONS.push(
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Cómo se escribe el componente base "button" en la plantilla de un Lightning Web Component?',
    o: [
      '<lightning-button label="Guardar"></lightning-button>',
      '<lightning:button label="Guardar"/>',
      '<lightningButton label="Guardar"></lightningButton>',
      '<lightning-button label="Guardar"/>'
    ],
    a: [0],
    e: 'En LWC los componentes se escriben en kebab-case (namespace-nombre) y con etiqueta de cierre: las etiquetas autocerradas no están permitidas. <lightning:button/> es la sintaxis de Aura.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: 'En la Specification de lightning-input aparece el atributo "messageWhenValueMissing". ¿Cómo se escribe en la plantilla HTML de un LWC?',
    o: ['messageWhenValueMissing="..."', 'message-when-value-missing="..."', 'message_when_value_missing="..."', 'MessageWhenValueMissing="..."'],
    a: [1],
    e: 'Las propiedades en camelCase de JavaScript se escriben en kebab-case en el HTML de LWC (maxLength → max-length).'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Qué pestañas ofrece cada componente en la Lightning Component Reference? (Elige 2)',
    o: [
      'Specification: atributos, métodos, eventos y slots',
      'Examples: código de ejemplo que se ejecuta en la propia página',
      'Apex: la clase controladora del componente',
      'Deploy: botón para instalar el componente en tu org'
    ],
    a: [0, 1],
    e: 'Cada componente tiene Documentation (descripción y uso), Specification (API pública) y Examples (ejemplos ejecutables). Además se puede filtrar entre la versión LWC y la Aura.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: 'Se necesita un formulario de edición de Account con un diseño a medida (dos columnas y un texto entre campos), respetando FLS y sin Apex. ¿Qué usar?',
    o: [
      'lightning-record-form con layout-type="Full"',
      'lightning-record-edit-form con lightning-input-field colocados en un lightning-layout',
      'lightning-input para cada campo y un método Apex para guardar',
      'lightning-datatable con inline edit'
    ],
    a: [1],
    e: 'lightning-record-form es el más rápido, pero su diseño apenas se personaliza. lightning-record-edit-form permite colocar cada lightning-input-field donde se quiera y sigue usando Lightning Data Service.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Dónde se puede usar lightning-input-field?',
    o: [
      'En cualquier LWC',
      'Solo dentro de lightning-record-edit-form',
      'Solo dentro de lightning-datatable',
      'Solo en componentes Aura'
    ],
    a: [1],
    e: 'lightning-input-field toma el tipo, la etiqueta y los permisos del campo desde el formulario padre (lightning-record-edit-form). Para mostrar valores de solo lectura se usa lightning-output-field dentro de lightning-record-view-form.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Qué atributo de lightning-datatable es obligatorio para identificar cada fila?',
    o: ['row-id', 'key-field', 'record-id', 'data-id'],
    a: [1],
    e: 'key-field indica qué propiedad de cada fila (normalmente Id) la identifica. También se pasan columns (definición de columnas) y data (las filas).'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: 'Un lightning-datatable tiene columnas editables. ¿Cómo se guardan los cambios del usuario?',
    o: [
      'Se guardan solos en la base de datos',
      'Con el evento onsave, leyendo event.detail.draftValues y guardándolos (p. ej. con updateRecord o Apex)',
      'Con el evento onrowselection',
      'Llamando a this.template.querySelector(\'lightning-datatable\').commit()'
    ],
    a: [1],
    e: 'La edición en línea genera draftValues. En el handler de onsave se guardan (updateRecord de lightning/uiRecordApi o Apex), se limpian los borradores y se refrescan los datos.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Qué estructura necesita el atributo options de lightning-combobox?',
    o: [
      'Un array de Strings',
      'Un array de objetos { label, value }',
      'Un Map<String, String> de Apex',
      'Una cadena separada por comas'
    ],
    a: [1],
    e: 'lightning-combobox, lightning-radio-group, lightning-checkbox-group y lightning-dual-listbox reciben options como [{ label: \'Texto visible\', value: \'valor\' }].'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: 'Un LWC debe validar varios lightning-input antes de enviar el formulario y mostrar los errores en cada campo. ¿Qué método se llama sobre cada input?',
    o: ['validate()', 'reportValidity()', 'showErrors()', 'submit()'],
    a: [1],
    e: 'reportValidity() comprueba las restricciones (required, pattern, min/max…) y muestra el mensaje. checkValidity() solo devuelve true/false y setCustomValidity() define un error propio.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: 'Un LWC necesita pedir confirmación al usuario antes de borrar un registro. ¿Qué opción recomienda Salesforce?',
    o: [
      'window.confirm()',
      'LightningConfirm del módulo lightning/confirm',
      'Un alert() de JavaScript',
      'ShowToastEvent con variant="warning"'
    ],
    a: [1],
    e: 'Chrome y Safari bloquean window.alert/confirm/prompt en iframes de otro origen. Los módulos lightning/alert, lightning/confirm y lightning/prompt las sustituyen y devuelven una Promise.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Cómo se abre una ventana modal propia con el módulo lightning/modal?',
    o: [
      'Se crea una clase que extiende LightningModal y se llama a MiModal.open({...}), que devuelve una Promise',
      'Se usa <lightning-modal> en cualquier plantilla con visible={true}',
      'Con window.open()',
      'Solo es posible en Aura con lightning:overlayLibrary'
    ],
    a: [0],
    e: 'El componente modal extiende LightningModal y se cierra con this.close(resultado). En Aura se usaba lightning:overlayLibrary.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: 'Se quiere cambiar el color de fondo de un lightning-button, pero el CSS del componente padre no afecta a su interior. ¿Por qué y qué hacer?',
    o: [
      'Por el Shadow DOM: se usan styling hooks (propiedades CSS --slds-c-*) o el atributo variant',
      'Hay que usar !important en el CSS',
      'Hay que modificar el código del componente base',
      'Los componentes base no admiten ningún cambio de estilo'
    ],
    a: [0],
    e: 'El estilo interno de los componentes base está encapsulado. Se personalizan con variant (brand, neutral, destructive…) y con los styling hooks de SLDS (por ejemplo --slds-c-button-brand-color-background).'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Qué componente base permite subir archivos vinculados a un registro sin escribir Apex?',
    o: ['lightning-input type="file"', 'lightning-file-upload con record-id', 'lightning-record-form', 'lightning-dual-listbox'],
    a: [1],
    e: 'lightning-file-upload sube los archivos como ContentDocument vinculados al record-id y lanza onuploadfinished. lightning-input type="file" solo lee el archivo en el cliente.'
  },
  {
    s: 'ui', t: 'Componentes base',
    q: '¿Qué valor de icon-name es correcto para lightning-icon?',
    o: ['icon-name="account"', 'icon-name="standard:account"', 'icon-name="slds-icon-account"', 'icon-name="/img/account.png"'],
    a: [1],
    e: 'Los iconos SLDS se indican como categoría:nombre (standard:account, utility:add, action:new, doctype:pdf, custom:custom1).'
  }
);
