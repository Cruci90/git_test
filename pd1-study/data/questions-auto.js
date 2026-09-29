// Sección 2: Process Automation and Logic (30 %)
window.PD1_QUESTIONS = window.PD1_QUESTIONS || [];
window.PD1_QUESTIONS.push(
  {
    s: 'auto', t: 'Triggers',
    q: 'Un trigger debe rellenar el campo Region__c de un Account a partir de BillingState antes de guardar. ¿Qué evento es el más eficiente?',
    o: ['before insert, before update', 'after insert, after update', 'after update únicamente', 'before delete'],
    a: [0],
    e: 'En before triggers se pueden modificar los registros de Trigger.new directamente, sin DML adicional. En after triggers Trigger.new es de solo lectura.'
  },
  {
    s: 'auto', t: 'Triggers',
    q: 'Al insertar un Account se debe crear automáticamente un Contact relacionado. ¿En qué evento del trigger debe hacerse?',
    o: ['before insert, porque aún no se ha guardado', 'after insert, porque el Account ya tiene Id', 'before update', 'Da igual'],
    a: [1],
    e: 'Para crear registros relacionados se necesita el Id del padre, que solo existe en el contexto after insert.'
  },
  {
    s: 'auto', t: 'Triggers',
    q: '¿Qué variables de contexto NO están disponibles en un trigger before insert? (Elige 2)',
    o: ['Trigger.new', 'Trigger.old', 'Trigger.newMap', 'Trigger.isBefore'],
    a: [1, 2],
    e: 'En insert no hay versión anterior (Trigger.old/oldMap = null) y en before insert los registros aún no tienen Id, así que Trigger.newMap es null.'
  },
  {
    s: 'auto', t: 'Triggers',
    q: '¿Qué evento de trigger NO existe?',
    o: ['after undelete', 'before undelete', 'before delete', 'after delete'],
    a: [1],
    e: 'Eventos válidos: before/after insert, before/after update, before/after delete y after undelete. No hay before undelete.'
  },
  {
    s: 'auto', t: 'Triggers',
    q: '¿Cuál es el problema de este trigger?',
    c: 'trigger OppTrigger on Opportunity (before insert) {\n  for (Opportunity o : Trigger.new) {\n    Account a = [SELECT Industry FROM Account WHERE Id = :o.AccountId];\n    o.Description = a.Industry;\n  }\n}',
    o: [
      'No hay problema',
      'Una SOQL dentro del bucle: con más de 100 registros supera el límite de consultas',
      'No se puede consultar Account desde un trigger de Opportunity',
      'Debería ser after insert'
    ],
    a: [1],
    e: 'Los triggers reciben hasta 200 registros por lote. Hay que bulkificar: recoger los AccountId en un Set, hacer una sola consulta a un Map<Id, Account> y luego recorrer Trigger.new.'
  },
  {
    s: 'auto', t: 'Triggers',
    q: '¿Cómo se impide que un registro se guarde desde un trigger, mostrando un mensaje al usuario?',
    o: ['throw new Exception()', 'record.addError(\'mensaje\')', 'Trigger.new.clear()', 'return false;'],
    a: [1],
    e: 'addError() marca el registro con un error, la operación DML sobre ese registro falla y el mensaje se muestra en la UI. Se puede usar también sobre un campo: rec.Campo__c.addError().'
  },
  {
    s: 'auto', t: 'Triggers',
    q: '¿Cuáles son dos buenas prácticas en el diseño de triggers? (Elige 2)',
    o: [
      'Un solo trigger por objeto que delega la lógica en una clase handler',
      'Hacer consultas y DML sobre colecciones, fuera de los bucles',
      'Un trigger distinto para cada evento para controlar el orden',
      'Usar @future en todos los triggers para evitar límites'
    ],
    a: [0, 1],
    e: 'El orden de ejecución entre varios triggers del mismo objeto no está garantizado, por eso se usa un trigger por objeto + handler. Además, siempre bulkificar.'
  },
  {
    s: 'auto', t: 'Triggers',
    q: 'Un trigger after update en Account actualiza los Accounts, lo que provoca recursión. ¿Cuál es la forma habitual de evitarlo?',
    o: [
      'Una variable static (Boolean o Set<Id>) en una clase helper que registre lo ya procesado',
      'Una variable de instancia en el trigger',
      'Un custom setting que se actualiza en cada ejecución',
      'Usar Trigger.isExecuting'
    ],
    a: [0],
    e: 'Las variables static persisten durante toda la transacción. Un Set<Id> de registros ya procesados es más robusto que un simple Boolean (que falla con más de 200 registros).'
  },
  {
    s: 'auto', t: 'Order of execution',
    q: 'Al guardar un registro, ¿qué se ejecuta primero?',
    o: ['Before triggers de Apex', 'Record-triggered flows "fast field updates" (before-save)', 'Validation rules personalizadas', 'After triggers'],
    a: [1],
    e: 'Orden resumido: validaciones del sistema → before-save flows → before triggers → validaciones del sistema y validation rules personalizadas → duplicate rules → guardado (sin commit) → after triggers → assignment/auto-response rules → workflow → after-save flows → roll-ups → commit → post-commit (emails, async).'
  },
  {
    s: 'auto', t: 'Order of execution',
    q: 'Un before trigger rellena un campo que una validation rule personalizada comprueba. ¿La validation rule ve el valor puesto por el trigger?',
    o: [
      'Sí, las validation rules personalizadas se ejecutan después de los before triggers',
      'No, las validation rules se ejecutan antes que los before triggers',
      'Solo si el trigger hace un update explícito',
      'Solo en inserciones, no en actualizaciones'
    ],
    a: [0],
    e: 'Las validation rules personalizadas se evalúan después de los before triggers, así que ven los valores modificados en before.'
  },
  {
    s: 'auto', t: 'Order of execution',
    q: 'Una workflow rule con field update modifica un registro. ¿Qué ocurre con los triggers de update?',
    o: [
      'No se vuelven a ejecutar',
      'Los before y after update se ejecutan una vez más',
      'Se ejecutan en bucle infinito',
      'Solo se ejecuta el after update'
    ],
    a: [1],
    e: 'Un field update de workflow provoca que se vuelvan a disparar los triggers before y after update (una única vez adicional). Las validation rules personalizadas no se re-evalúan.'
  },
  {
    s: 'auto', t: 'Order of execution',
    q: '¿Cuándo se envían los emails generados durante una transacción?',
    o: ['Inmediatamente al llamar a Messaging.sendEmail', 'Después del commit a la base de datos', 'Antes de los after triggers', 'Nunca si hay triggers'],
    a: [1],
    e: 'La lógica post-commit (envío de emails, ejecución de trabajos asíncronos encolados, publicación de platform events "after commit") ocurre después de confirmar la transacción.'
  },
  {
    s: 'auto', t: 'DML',
    q: 'Se insertan 200 registros y algunos pueden fallar por validaciones. Se quiere guardar los válidos y registrar los errores. ¿Qué usar?',
    o: ['insert registros;', 'Database.insert(registros, false);', 'Database.insert(registros, true);', 'upsert registros;'],
    a: [1],
    e: 'Database.insert(lista, false) (allOrNone = false) permite éxito parcial y devuelve List<Database.SaveResult> para revisar isSuccess() y getErrors(). La sentencia insert es "todo o nada" y lanza DmlException.'
  },
  {
    s: 'auto', t: 'DML',
    q: '¿Qué ocurre con una excepción no controlada en mitad de una transacción que ya hizo varias operaciones DML?',
    o: ['Se confirman las DML previas', 'Se hace rollback de toda la transacción', 'Solo se deshace la última DML', 'Se confirman los registros de objetos estándar'],
    a: [1],
    e: 'Una excepción no controlada revierte todos los cambios de la transacción. Para control fino se usan Database.setSavepoint() y Database.rollback(sp).'
  },
  {
    s: 'auto', t: 'DML',
    q: '¿Cuál es la sintaxis correcta para hacer upsert por un External ID?',
    o: [
      'upsert cuentas Account.Fields.Ext_Id__c;',
      'upsert cuentas WHERE Ext_Id__c;',
      'upsert(cuentas, \'Ext_Id__c\');',
      'Database.upsert(cuentas).by(Ext_Id__c);'
    ],
    a: [0],
    e: 'upsert lista CampoExterno; o Database.upsert(lista, Account.Fields.Ext_Id__c, allOrNone). Sin campo, usa el Id.'
  },
  {
    s: 'auto', t: 'DML',
    q: 'En una misma transacción se actualiza un User (setup object) y se inserta un Account. Se produce MIXED_DML_OPERATION. ¿Cómo se resuelve?',
    o: [
      'Mover una de las operaciones a un método asíncrono (@future o Queueable)',
      'Usar Database.insert con allOrNone = false',
      'Hacer las dos DML en la misma sentencia',
      'Declarar la clase without sharing'
    ],
    a: [0],
    e: 'No se pueden mezclar DML de objetos de configuración (User, Group, PermissionSetAssignment…) con objetos normales en la misma transacción. Se separa con @future/Queueable. En tests se puede usar System.runAs().'
  },
  {
    s: 'auto', t: 'Excepciones',
    q: '¿Qué excepción lanza este código si no existe ningún Account con ese nombre?',
    c: "Account a = [SELECT Id FROM Account WHERE Name = 'NoExiste'];",
    o: ['NullPointerException', 'QueryException: List has no rows for assignment to SObject', 'DmlException', 'No lanza excepción; a vale null'],
    a: [1],
    e: 'Asignar una consulta a un único sObject exige exactamente una fila. Con 0 filas (o más de 1) lanza QueryException. Asignarla a una List evita el problema.'
  },
  {
    s: 'auto', t: 'Excepciones',
    q: '¿Qué tipo de excepción NO se puede capturar con try/catch?',
    o: ['DmlException', 'LimitException (System.LimitException)', 'NullPointerException', 'Una excepción personalizada'],
    a: [1],
    e: 'Superar un governor limit lanza LimitException, que no se puede capturar: la transacción termina. Hay que prevenirla (Limits.getQueries(), etc.).'
  },
  {
    s: 'auto', t: 'Excepciones',
    q: '¿Cuál es una declaración válida de excepción personalizada?',
    o: [
      'public class MiError extends Exception {}',
      'public class MiErrorException extends Exception {}',
      'public class MiErrorException implements Exception {}',
      'public exception MiErrorException {}'
    ],
    a: [1],
    e: 'Las excepciones personalizadas deben extender Exception y su nombre debe terminar en "Exception".'
  },
  {
    s: 'auto', t: 'Excepciones',
    q: '¿Qué afirmación sobre el bloque finally es correcta?',
    o: [
      'Solo se ejecuta si no hay excepción',
      'Se ejecuta siempre, haya o no excepción capturada',
      'Solo se ejecuta si hay excepción',
      'No existe en Apex'
    ],
    a: [1],
    e: 'finally se ejecuta siempre tras try/catch y se usa para limpieza. (Excepción: si se supera un governor limit la transacción se aborta.)'
  },
  {
    s: 'auto', t: 'Asíncrono',
    q: 'Un trigger debe llamar a un servicio web externo cuando se crea un registro. ¿Qué opción es válida?',
    o: [
      'Hacer la callout directamente en el trigger',
      'Llamar a un método @future(callout=true) o a un Queueable con Database.AllowsCallouts desde el trigger',
      'Usar un Visualforce page',
      'No es posible hacer callouts relacionadas con triggers'
    ],
    a: [1],
    e: 'No se permiten callouts síncronas desde triggers (la transacción tiene trabajo pendiente). Se delega a un proceso asíncrono con permiso de callout.'
  },
  {
    s: 'auto', t: 'Asíncrono',
    q: '¿Qué afirmaciones sobre los métodos @future son correctas? (Elige 2)',
    o: [
      'Deben ser static y devolver void',
      'Solo aceptan tipos primitivos, arrays o colecciones de primitivos como parámetros',
      'Aceptan sObjects como parámetros',
      'Devuelven un Id de trabajo para monitorizarlos'
    ],
    a: [0, 1],
    e: 'Los @future son static void y solo reciben primitivos (p. ej. Set<Id>): el sObject podría cambiar antes de que se ejecute. Queueable sí acepta sObjects y devuelve un Job Id.'
  },
  {
    s: 'auto', t: 'Asíncrono',
    q: 'Se necesita un proceso asíncrono que reciba una lista de sObjects, devuelva un Id para monitorizarlo y encadene un segundo trabajo al terminar. ¿Qué usar?',
    o: ['@future', 'Queueable Apex', 'Schedulable Apex', 'Un trigger after insert'],
    a: [1],
    e: 'Queueable (implements Queueable, System.enqueueJob) admite tipos complejos, devuelve un AsyncApexJob Id y permite encadenar otro Queueable desde execute().'
  },
  {
    s: 'auto', t: 'Asíncrono',
    q: 'Hay que recalcular un campo en 3 millones de registros cada noche. ¿Qué combinación es la adecuada?',
    o: [
      'Batch Apex programado con Schedulable',
      'Un trigger con @future',
      'Queueable encadenado 3 millones de veces',
      'Un Flow de pantalla'
    ],
    a: [0],
    e: 'Batch Apex procesa grandes volúmenes en lotes (start → execute → finish), cada lote con sus propios límites. Una clase Schedulable lanza el batch con System.schedule y una expresión cron.'
  },
  {
    s: 'auto', t: 'Asíncrono',
    q: 'Un Batch Apex debe acumular el total de registros procesados en todos los execute() para enviarlo por email en finish(). ¿Qué se necesita?',
    o: ['Implementar Database.Stateful', 'Declarar la variable static', 'Usar Database.AllowsCallouts', 'Nada, las variables de instancia se conservan siempre'],
    a: [0],
    e: 'Por defecto cada execute() se ejecuta con un estado nuevo. Database.Stateful conserva las variables de instancia entre lotes. Las variables static se reinician.'
  },
  {
    s: 'auto', t: 'Asíncrono',
    q: '¿Cuál es el tamaño de lote por defecto y el máximo de Database.executeBatch?',
    o: ['100 y 1.000', '200 y 2.000', '200 y 10.000', '2.000 y 50.000'],
    a: [1],
    e: 'Por defecto 200 registros por execute(); se puede indicar un tamaño de 1 a 2.000: Database.executeBatch(new MiBatch(), 500);'
  },
  {
    s: 'auto', t: 'Platform Events',
    q: '¿Cómo se publica un platform event desde Apex y cómo se suscribe un trigger a él?',
    o: [
      'insert evento; y un trigger before insert',
      'EventBus.publish(evento); y un trigger after insert sobre el evento (__e)',
      'Database.publish(evento); y un trigger after update',
      'System.enqueueJob(evento); y un Flow de pantalla'
    ],
    a: [1],
    e: 'Los platform events (__e) se publican con EventBus.publish() y los triggers sobre eventos solo soportan after insert. También pueden suscribirse Flows, LWC (empApi) y sistemas externos (CometD/Pub/Sub API).'
  },
  {
    s: 'auto', t: 'Platform Events',
    q: 'Se quiere registrar en un log un error mediante un platform event aunque la transacción haga rollback. ¿Qué configuración del evento se necesita?',
    o: ['Publish After Commit', 'Publish Immediately', 'High Volume desactivado', 'Un trigger before insert'],
    a: [1],
    e: 'Con "Publish Immediately" el evento se publica aunque la transacción falle; con "Publish After Commit" solo si la transacción se confirma.'
  },
  {
    s: 'auto', t: 'Flow',
    q: 'Un Flow necesita ejecutar lógica compleja en Apex. ¿Cómo se expone un método para Flow?',
    o: ['@AuraEnabled', '@InvocableMethod en un método static', '@RemoteAction', '@future'],
    a: [1],
    e: '@InvocableMethod permite llamar al método desde Flow (acción Apex). Solo puede haber uno por clase, debe ser static y recibe/devuelve una List (bulkificado). Las variables de clases de entrada/salida usan @InvocableVariable.'
  },
  {
    s: 'auto', t: 'Flow',
    q: '¿Qué tipo de Flow es el adecuado para actualizar campos del MISMO registro al guardarlo, con el mejor rendimiento?',
    o: ['Screen Flow', 'Record-triggered Flow optimizado para "Fast Field Updates" (before-save)', 'Scheduled-triggered Flow', 'Autolaunched Flow llamado desde un botón'],
    a: [1],
    e: 'Los before-save flows (Fast Field Updates) modifican el registro sin DML extra y son mucho más rápidos que los after-save.'
  },
  {
    s: 'auto', t: 'Flow',
    q: '¿Qué tipo de Flow requiere interacción del usuario?',
    o: ['Record-triggered Flow', 'Screen Flow', 'Platform event-triggered Flow', 'Schedule-triggered Flow'],
    a: [1],
    e: 'Solo las Screen Flows muestran pantallas. Pueden lanzarse desde Lightning pages, quick actions, botones, sitios de Experience Cloud, etc.'
  },
  {
    s: 'auto', t: 'Declarativo vs programático',
    q: '¿En qué dos escenarios es preferible Apex frente a Flow? (Elige 2)',
    o: [
      'Procesar millones de registros con lógica compleja',
      'Actualizar un campo del registro cuando cambia otro',
      'Operaciones que requieren control transaccional fino (savepoints, reintentos) o callouts complejas',
      'Enviar un email de alerta cuando se crea un caso'
    ],
    a: [0, 2],
    e: 'Flow cubre la mayoría de automatizaciones sencillas. Apex se prefiere para gran volumen, lógica compleja, control de transacciones o integraciones avanzadas.'
  },
  {
    s: 'auto', t: 'Lógica Apex',
    q: '¿Qué imprime este código?',
    c: "String a = 'Hola';\nString b = 'HOLA';\nSystem.debug(a == b);",
    o: ['true', 'false', 'Error de compilación', 'null'],
    a: [0],
    e: 'En Apex el operador == entre Strings NO distingue mayúsculas. Para comparación exacta se usa a.equals(b) (sensible a mayúsculas).'
  },
  {
    s: 'auto', t: 'Lógica Apex',
    q: '¿Qué valor tiene x?',
    c: 'Integer x = 7 / 2;',
    o: ['3.5', '3', '4', 'Error de compilación'],
    a: [1],
    e: 'La división entre Integers trunca el resultado. Para decimales: Decimal x = 7.0 / 2;'
  },
  {
    s: 'auto', t: 'Lógica Apex',
    q: '¿Qué imprime este código?',
    c: "Map<String, Integer> m = new Map<String, Integer>();\nm.put('a', 1);\nm.put('A', 2);\nm.put('a', 3);\nSystem.debug(m.size() + ' ' + m.get('a'));",
    o: ['2 3', '3 3', '1 3', '2 1'],
    a: [0],
    e: 'Las claves String de un Map distinguen mayúsculas: "a" y "A" son distintas (tamaño 2). put con una clave existente sobrescribe el valor → 3.'
  },
  {
    s: 'auto', t: 'Lógica Apex',
    q: '¿Cuál es la sintaxis de un SOQL for loop que procesa los registros en lotes de 200?',
    o: [
      'for (List<Account> lote : [SELECT Id FROM Account]) { }',
      'for (Account a : Database.batch([SELECT Id FROM Account], 200)) { }',
      'while ([SELECT Id FROM Account].hasNext()) { }',
      'for (Integer i = 0; i < [SELECT COUNT() FROM Account]; i += 200) { }'
    ],
    a: [0],
    e: 'Con una variable de tipo List el SOQL for loop entrega lotes de 200 registros. Con una variable sObject individual (for (Account a : [...])) también usa chunks internamente.'
  },
  {
    s: 'auto', t: 'Lógica Apex',
    q: '¿Qué sentencia permite ramificar la lógica según el tipo concreto de un sObject?',
    c: "switch on registro {\n  when Account a { /* ... */ }\n  when Contact c { /* ... */ }\n  when else { /* ... */ }\n}",
    o: ['if/else con instanceof únicamente', 'switch on con when <Tipo> variable', 'Un enum', 'No es posible'],
    a: [1],
    e: 'switch on admite enteros, Long, String, enums y tipos sObject (when Account a). También se puede usar instanceof.'
  },
  {
    s: 'auto', t: 'Lógica Apex',
    q: '¿Cuánto dura el valor de una variable static en Apex?',
    o: ['Toda la vida de la org', 'La sesión del usuario', 'La transacción actual', 'Solo la ejecución del método'],
    a: [2],
    e: 'Las variables static se inicializan una vez por transacción y se comparten entre todos los triggers y clases de esa transacción. No persisten entre transacciones.'
  },
  {
    s: 'auto', t: 'Lógica Apex',
    q: 'Una consulta agregada con GROUP BY devuelve resultados. ¿De qué tipo son?',
    c: 'SELECT StageName, SUM(Amount) total FROM Opportunity GROUP BY StageName',
    o: ['List<Opportunity>', 'List<AggregateResult>', 'Map<String, Decimal>', 'Integer'],
    a: [1],
    e: 'Las funciones agregadas con GROUP BY devuelven List<AggregateResult>; los valores se leen con ar.get(\'total\'). SELECT COUNT() sin campos devuelve un Integer.'
  },
  {
    s: 'auto', t: 'Governor limits',
    q: '¿Cómo se aplican los governor limits en un Batch Apex?',
    o: [
      'Comparte un único conjunto de límites para todo el batch',
      'Cada ejecución de execute() es una transacción con sus propios límites (asíncronos)',
      'No tiene governor limits',
      'Tiene los límites síncronos multiplicados por 10'
    ],
    a: [1],
    e: 'Cada lote de execute() es una transacción independiente con límites asíncronos (200 SOQL, 60 s CPU, 12 MB heap). Si un lote falla, los demás no se revierten.'
  }
);
