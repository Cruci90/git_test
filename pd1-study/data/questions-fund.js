// Sección 1: Developer Fundamentals (23 %)
window.PD1_QUESTIONS = window.PD1_QUESTIONS || [];
window.PD1_QUESTIONS.push(
  {
    s: 'fund', t: 'Multitenancy',
    q: '¿Cuál es la principal consecuencia de la arquitectura multi-tenant de Salesforce para un desarrollador de Apex?',
    o: [
      'Cada org dispone de un servidor dedicado, así que el rendimiento depende solo del código propio',
      'Se aplican governor limits para que ningún tenant monopolice los recursos compartidos',
      'El código Apex se compila a Java y puede usar cualquier librería Java',
      'Las consultas SOQL no tienen límite de filas porque la base de datos se escala automáticamente'
    ],
    a: [1],
    e: 'En multitenancy todas las orgs comparten infraestructura. Los governor limits (SOQL, DML, CPU, heap…) garantizan que ningún código acapare recursos. Por eso hay que escribir código bulkificado y eficiente.'
  },
  {
    s: 'fund', t: 'MVC',
    q: 'En el patrón MVC aplicado a Salesforce, ¿qué elemento corresponde al "Controller"?',
    o: ['Un objeto personalizado y sus campos', 'Una página Visualforce', 'Una clase Apex de controlador o extensión', 'Un layout de página'],
    a: [2],
    e: 'Model = sObjects/objetos y campos; View = páginas Visualforce, componentes Lightning, layouts; Controller = controladores estándar, clases Apex (controladores/extensiones) y la lógica JS de los componentes.'
  },
  {
    s: 'fund', t: 'MVC',
    q: '¿Qué dos elementos forman parte de la capa "View" en el modelo MVC de la plataforma? (Elige 2)',
    o: ['Lightning Web Components (HTML)', 'Objetos personalizados', 'Páginas Visualforce', 'Triggers de Apex'],
    a: [0, 2],
    e: 'La vista es la capa de presentación: Visualforce, plantillas de LWC/Aura, page layouts, Lightning pages. Los objetos son el Modelo y los triggers forman parte de la lógica (Controller).'
  },
  {
    s: 'fund', t: 'Modelado de datos',
    q: 'Un desarrollador necesita un campo en Account que sume el importe de todas sus Opportunities cerradas-ganadas sin escribir código. ¿Qué se necesita?',
    o: [
      'Un campo fórmula en Account',
      'Un campo roll-up summary en Account (la relación Account–Opportunity admite roll-ups)',
      'Un trigger after insert en Opportunity',
      'No es posible sin código porque Opportunity no es un objeto personalizado'
    ],
    a: [1],
    e: 'Aunque Account–Opportunity no es un master-detail personalizado, Salesforce permite roll-up summaries de Opportunity en Account (no así de Contact). Los roll-up summary son declarativos y admiten filtros (StageName = Closed Won).'
  },
  {
    s: 'fund', t: 'Modelado de datos',
    q: 'Se necesita un roll-up summary en un objeto padre, pero la relación con el hijo es de tipo lookup. ¿Cuáles son dos soluciones válidas? (Elige 2)',
    o: [
      'Convertir la relación a master-detail si todos los hijos tienen valor en el campo lookup',
      'Crear el roll-up summary directamente sobre el lookup',
      'Usar un record-triggered Flow o un trigger de Apex que calcule el total',
      'Crear un campo fórmula cross-object en el padre que sume los hijos'
    ],
    a: [0, 2],
    e: 'Los roll-up summary solo existen en master-detail. Si todos los registros hijos tienen padre se puede convertir; si no, hay que calcularlo con Flow o Apex. Las fórmulas no agregan registros hijos.'
  },
  {
    s: 'fund', t: 'Modelado de datos',
    q: '¿Qué ocurre con los registros detalle cuando se elimina el registro maestro en una relación master-detail?',
    o: ['Se quedan huérfanos con el campo vacío', 'Se eliminan en cascada', 'La eliminación del maestro falla', 'Se reasignan al propietario del maestro'],
    a: [1],
    e: 'En master-detail el borrado es en cascada. En un lookup, por defecto se limpia el valor (o se puede configurar para impedir el borrado o, en lookups personalizados, borrar en cascada con soporte).'
  },
  {
    s: 'fund', t: 'Modelado de datos',
    q: 'Se requiere una relación muchos-a-muchos entre Curso__c y Alumno__c, con roll-up summaries en ambos lados. ¿Qué diseño es el correcto?',
    o: [
      'Un lookup de Curso__c a Alumno__c',
      'Un objeto junction con dos relaciones master-detail (una a cada objeto)',
      'Un campo multi-select picklist en Alumno__c',
      'Un objeto junction con dos lookups'
    ],
    a: [1],
    e: 'El patrón estándar es un objeto junction con dos master-detail. Así ambos padres pueden tener roll-up summaries y el acceso del junction depende de los dos padres.'
  },
  {
    s: 'fund', t: 'Modelado de datos',
    q: '¿Cuántas relaciones master-detail puede tener como máximo un objeto personalizado?',
    o: ['1', '2', '5', '40'],
    a: [1],
    e: 'Un objeto puede tener hasta 2 relaciones master-detail (y hasta 40 relaciones en total). Por eso un junction object tiene exactamente dos.'
  },
  {
    s: 'fund', t: 'Modelado de datos',
    q: '¿Qué afirmación sobre el objeto detalle en una relación master-detail es cierta?',
    o: [
      'Tiene su propio campo Owner y su propio modelo de sharing',
      'Hereda la seguridad y el propietario del registro maestro; no tiene campo Owner',
      'Puede existir sin registro maestro',
      'Solo puede relacionarse con objetos estándar'
    ],
    a: [1],
    e: 'El detalle no tiene Owner: su acceso lo controla el maestro (Controlled by Parent). El campo master-detail es siempre obligatorio.'
  },
  {
    s: 'fund', t: 'Modelado de datos',
    q: '¿Qué tipo de relación solo está disponible en el objeto User?',
    o: ['Lookup', 'Master-detail', 'Hierarchical', 'External lookup'],
    a: [2],
    e: 'La relación jerárquica (hierarchical) es un lookup especial solo para User, por ejemplo para relacionar un usuario con su manager.'
  },
  {
    s: 'fund', t: 'Importación de datos',
    q: 'Hay que importar 250.000 registros de un objeto personalizado. ¿Qué herramienta es la adecuada?',
    o: ['Data Import Wizard', 'Data Loader', 'Schema Builder', 'Una Screen Flow'],
    a: [1],
    e: 'Data Import Wizard admite hasta 50.000 registros y solo algunos objetos. Data Loader (o Bulk API) admite hasta 5 millones de registros y todos los objetos.'
  },
  {
    s: 'fund', t: 'Importación de datos',
    q: 'Un sistema externo envía periódicamente clientes; unos ya existen en Salesforce y otros no. ¿Qué dos elementos permiten evitar duplicados al cargarlos? (Elige 2)',
    o: [
      'Un campo marcado como External ID (y Unique) con el identificador del sistema externo',
      'La operación upsert usando ese External ID',
      'La operación insert con allOrNone = false',
      'Un campo fórmula con el Id del sistema externo'
    ],
    a: [0, 1],
    e: 'Upsert con un External ID crea los registros que no existen y actualiza los que coinciden. En Apex: upsert lista Cuenta__c.Fields.Ext_Id__c;'
  },
  {
    s: 'fund', t: 'Declarativo vs programático',
    q: 'Se debe impedir guardar una Opportunity si Amount está vacío cuando Stage = "Negotiation". ¿Cuál es la solución recomendada?',
    o: ['Un trigger before update con addError()', 'Una validation rule', 'Una clase batch nocturna', 'Un componente LWC con validación en el cliente'],
    a: [1],
    e: 'Salesforce recomienda "clicks before code": una validation rule resuelve el requisito sin código, aplica a todos los canales (UI, API, importaciones) y no requiere tests.'
  },
  {
    s: 'fund', t: 'Declarativo vs programático',
    q: 'Se necesita mostrar en Contact el campo Industry de su Account, sin necesidad de reportar sobre él de forma independiente ni de almacenarlo. ¿Qué opción es la mejor?',
    o: ['Un trigger que copie el valor', 'Un campo fórmula cross-object: Account.Industry', 'Un roll-up summary', 'Un Flow programado'],
    a: [1],
    e: 'Las fórmulas cross-object leen campos de registros relacionados (hasta 10 relaciones distintas por objeto) sin almacenar el dato ni requerir sincronización.'
  },
  {
    s: 'fund', t: 'Configuración',
    q: 'Una empresa quiere guardar reglas de negocio configurables (por ejemplo tasas por país) que se puedan desplegar entre orgs con change sets junto con sus registros. ¿Qué usar?',
    o: ['Custom settings de tipo lista', 'Custom metadata types', 'Un objeto personalizado', 'Custom labels'],
    a: [1],
    e: 'Los registros de Custom Metadata Types son metadatos: se despliegan con change sets/paquetes/CLI y se consultan sin consumir límites de SOQL (métodos getAll/getInstance).'
  },
  {
    s: 'fund', t: 'Configuración',
    q: 'Se necesita un valor de configuración que pueda variar por organización, perfil o usuario (por ejemplo desactivar un trigger para un usuario de integración). ¿Qué es lo más apropiado?',
    o: ['Custom setting de tipo Hierarchy', 'Custom setting de tipo List', 'Custom metadata type', 'Un campo en el objeto User'],
    a: [0],
    e: 'Los Hierarchy custom settings devuelven el valor más específico: usuario > perfil > org. Se leen con MiSetting__c.getInstance().'
  },
  {
    s: 'fund', t: 'Tipos de datos Apex',
    q: '¿Qué valor tiene una variable Integer declarada pero no inicializada en Apex?',
    c: 'Integer contador;\nSystem.debug(contador);',
    o: ['0', 'null', 'undefined', 'Error de compilación'],
    a: [1],
    e: 'En Apex todas las variables no inicializadas (incluidas las primitivas) valen null. Operar con ellas (contador++) lanza NullPointerException.'
  },
  {
    s: 'fund', t: 'Tipos de datos Apex',
    q: '¿Cómo se declara una constante en Apex?',
    o: ['const Integer MAX = 10;', 'static final Integer MAX = 10;', 'final static const MAX = 10;', 'readonly Integer MAX = 10;'],
    a: [1],
    e: 'Las constantes se declaran con static final. Una variable final solo puede asignarse una vez (en la declaración, en un bloque estático o en el constructor).'
  },
  {
    s: 'fund', t: 'Colecciones',
    q: '¿Cuál es la forma más eficiente de obtener un Map<Id, Account> a partir de una consulta?',
    o: [
      'Recorrer la lista y hacer put de cada registro',
      'Map<Id, Account> m = new Map<Id, Account>([SELECT Id, Name FROM Account]);',
      'Map<Id, Account> m = [SELECT Id, Name FROM Account].toMap();',
      'No se puede crear un mapa desde una consulta'
    ],
    a: [1],
    e: 'El constructor de Map acepta una List<sObject> y usa el Id como clave automáticamente.'
  },
  {
    s: 'fund', t: 'Colecciones',
    q: '¿Qué imprime este código?',
    c: "Set<String> s = new Set<String>{'a', 'b', 'a', 'A'};\nSystem.debug(s.size());",
    o: ['2', '3', '4', 'Error: elementos duplicados'],
    a: [1],
    e: "Un Set no admite duplicados y los Strings en un Set son sensibles a mayúsculas: {'a','b','A'} → 3."
  },
  {
    s: 'fund', t: 'Clases e interfaces',
    q: 'Una clase hija necesita sobrescribir un método de la clase padre. ¿Qué debe cumplirse? (Elige 2)',
    o: [
      'El método del padre debe ser virtual o abstract',
      'El método de la hija debe declararse con override',
      'La clase hija debe ser global',
      'El método del padre debe ser static'
    ],
    a: [0, 1],
    e: 'En Apex las clases y métodos son "final" por defecto. Para heredar la clase debe ser virtual/abstract, el método virtual/abstract, y la hija usa la palabra clave override.'
  },
  {
    s: 'fund', t: 'Clases e interfaces',
    q: '¿Qué modificador de acceso se requiere para que un método sea visible fuera del namespace de un paquete gestionado?',
    o: ['public', 'protected', 'global', 'private'],
    a: [2],
    e: 'public = visible dentro del mismo namespace/aplicación. global = visible en cualquier código Apex, incluidos otros namespaces (paquetes gestionados, web services).'
  },
  {
    s: 'fund', t: 'Sharing',
    q: 'Una clase Apex se declara sin palabra clave de sharing y la llama otra clase "with sharing". ¿Qué comportamiento es cierto?',
    o: [
      'Siempre se ejecuta without sharing',
      'Se ejecuta con el modo de sharing de la clase que la llama (inherited), salvo que sea el punto de entrada',
      'Genera un error de compilación',
      'Siempre se ejecuta with sharing'
    ],
    a: [1],
    e: 'Una clase sin declaración hereda el contexto de quien la llama. Si es el punto de entrada de la transacción, se comporta como without sharing. Usar "inherited sharing" explícitamente es la buena práctica.'
  },
  {
    s: 'fund', t: 'Sharing',
    q: '¿Qué palabra clave garantiza que una clase Apex respeta las reglas de sharing del usuario actual?',
    o: ['with sharing', 'inherited sharing', 'without sharing', 'global sharing'],
    a: [0],
    e: 'with sharing aplica las reglas de visibilidad de registros del usuario. Ojo: NO aplica FLS ni permisos de objeto; para eso se usa WITH USER_MODE, WITH SECURITY_ENFORCED o Security.stripInaccessible.'
  },
  {
    s: 'fund', t: 'Seguridad',
    q: '¿Cuáles dos opciones hacen que una consulta SOQL respete la seguridad a nivel de campo y objeto (FLS/CRUD)? (Elige 2)',
    o: [
      '[SELECT Name FROM Account WITH USER_MODE]',
      '[SELECT Name FROM Account WITH SECURITY_ENFORCED]',
      'Declarar la clase "with sharing"',
      '[SELECT Name FROM Account FOR VIEW]'
    ],
    a: [0, 1],
    e: 'WITH USER_MODE (recomendado actualmente) y WITH SECURITY_ENFORCED aplican FLS/CRUD. with sharing solo afecta a la visibilidad de registros. Security.stripInaccessible() elimina campos inaccesibles de los resultados.'
  },
  {
    s: 'fund', t: 'SOQL/SOSL',
    q: 'Se necesita buscar el texto "Acme" en Account, Contact y Lead en una sola consulta. ¿Qué usar?',
    o: ['SOQL con OR', 'SOSL: FIND \'Acme\' IN ALL FIELDS RETURNING Account, Contact, Lead', 'Tres consultas SOQL con LIKE', 'Database.query con UNION'],
    a: [1],
    e: 'SOSL busca texto en múltiples objetos a la vez y devuelve List<List<sObject>>. SOQL consulta un objeto (y sus relaciones).'
  },
  {
    s: 'fund', t: 'SOQL/SOSL',
    q: '¿Cuál es la sintaxis correcta para obtener cuentas con sus contactos en una consulta?',
    o: [
      'SELECT Name, (SELECT LastName FROM Contacts) FROM Account',
      'SELECT Name, (SELECT LastName FROM Contact) FROM Account',
      'SELECT Name, Contact.LastName FROM Account',
      'SELECT Name, (SELECT LastName FROM Contacts__r) FROM Account'
    ],
    a: [0],
    e: 'Las subconsultas padre→hijo usan el nombre de relación en plural (Contacts). Para relaciones personalizadas se usa el sufijo __r (p. ej. Facturas__r).'
  },
  {
    s: 'fund', t: 'SOQL/SOSL',
    q: 'Una consulta hijo→padre sobre un lookup personalizado Proyecto__c en Tarea__c. ¿Cómo se accede al nombre del proyecto?',
    o: ['SELECT Proyecto__c.Name FROM Tarea__c', 'SELECT Proyecto__r.Name FROM Tarea__c', 'SELECT Proyectos__r.Name FROM Tarea__c', 'SELECT Name FROM Proyecto__c WHERE Tarea__c != null'],
    a: [1],
    e: 'En relaciones personalizadas, __c es el campo con el Id y __r es la relación que permite navegar a los campos del padre.'
  },
  {
    s: 'fund', t: 'SOQL/SOSL',
    q: 'Un desarrollador construye una consulta dinámica con un valor introducido por el usuario. ¿Cuáles dos técnicas previenen SOQL injection? (Elige 2)',
    o: [
      'Usar variables bind (:variable) en la consulta',
      'Usar String.escapeSingleQuotes() sobre la entrada',
      'Declarar la clase with sharing',
      'Convertir la entrada a mayúsculas'
    ],
    a: [0, 1],
    e: 'Las variables bind son la mejor defensa (Database.query también las admite, y Database.queryWithBinds). escapeSingleQuotes evita que el usuario cierre la cadena. Mejor aún: whitelisting de valores permitidos.'
  },
  {
    s: 'fund', t: 'Governor limits',
    q: '¿Cuántas consultas SOQL se pueden ejecutar en una transacción síncrona?',
    o: ['50', '100', '150', '200'],
    a: [1],
    e: 'Síncrono: 100 SOQL, 150 sentencias DML, 50.000 filas recuperadas, 10.000 filas DML, 10 s de CPU, 6 MB de heap. Asíncrono: 200 SOQL, 60 s de CPU y 12 MB de heap.'
  },
  {
    s: 'fund', t: 'Governor limits',
    q: '¿Cuántas sentencias DML se pueden ejecutar en una transacción?',
    o: ['100', '150', '200', '10.000'],
    a: [1],
    e: '150 sentencias DML por transacción (y 10.000 registros procesados por DML en total).'
  },
  {
    s: 'fund', t: 'Governor limits',
    q: 'Una consulta puede devolver más de 50.000 filas y además se quiere reducir el uso de heap. ¿Qué técnica ayuda con el heap pero NO evita el límite de filas?',
    o: ['SOQL for loop', 'Batch Apex', 'Añadir LIMIT 50000', 'Usar un Set en vez de un List'],
    a: [0],
    e: 'El SOQL for loop procesa en bloques de 200 y reduce el heap, pero las filas siguen contando para el límite de 50.000. Para procesar millones de registros se usa Batch Apex (QueryLocator admite hasta 50 millones).'
  },
  {
    s: 'fund', t: 'Tipos de datos Apex',
    q: 'Un método recibe un sObject genérico que sabemos que es un Account. ¿Cómo se accede a su campo Name de forma tipada?',
    o: ['Account a = sobj;', 'Account a = (Account) sobj;', 'Account a = sobj.toAccount();', 'Account a = new Account(sobj);'],
    a: [1],
    e: 'Se hace un cast explícito. Alternativamente, con el sObject genérico se puede usar sobj.get(\'Name\') y sobj.put().'
  },
  {
    s: 'fund', t: 'Tipos de datos Apex',
    q: '¿Qué afirmación sobre los enums de Apex es correcta?',
    o: [
      'Sus valores son Strings y se comparan con equalsIgnoreCase',
      'Tienen métodos como values(), name() y ordinal()',
      'No pueden usarse en sentencias switch',
      'Deben declararse siempre como global'
    ],
    a: [1],
    e: 'Los enums tienen values() (lista de valores), name() y ordinal(). Pueden usarse en switch on. Ejemplo: public enum Estado { ABIERTO, CERRADO }.'
  },
  {
    s: 'fund', t: 'Schema/Describe',
    q: 'Un desarrollador necesita saber en tiempo de ejecución si el usuario puede actualizar el campo Account.Rating. ¿Qué usar?',
    o: [
      'Schema.sObjectType.Account.fields.Rating.isUpdateable()',
      'Account.Rating.canEdit()',
      'UserInfo.canUpdate(\'Account.Rating\')',
      'No es posible desde Apex'
    ],
    a: [0],
    e: 'Los métodos Describe (DescribeFieldResult) exponen isAccessible(), isCreateable(), isUpdateable(). Útil para comprobaciones manuales de FLS.'
  }
);
