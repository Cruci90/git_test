import { makeFactory } from './helper';

const q = makeFactory('automation', 'AUT');

export const automation = [
  q(
    'A developer needs to update a field on the triggering record before it is saved, with the best performance and no extra DML. Which declarative option fits best?',
    [
      'After-save record-triggered flow',
      'Before-save record-triggered flow',
      'Screen flow',
      'Scheduled-triggered flow'
    ],
    1,
    'Los flows record-triggered "before save" actualizan los campos del propio registro sin DML adicional y son el más rápido. Los "after save" son necesarios para tocar registros relacionados o hacer acciones externas.'
  ),
  q(
    'Which flow type should be used to guide a user through a multi-step process with input forms?',
    ['Autolaunched flow', 'Screen flow', 'Record-triggered flow', 'Platform event-triggered flow'],
    1,
    'Los Screen Flows muestran pantallas e interactúan con el usuario. Los autolaunched no tienen UI y los record-triggered se disparan por cambios de datos.'
  ),
  q(
    'What is required to make an Apex method callable from a Flow as an action?',
    [
      'Annotate it with @InvocableMethod and make it static',
      'Annotate it with @future',
      'Declare the class as global',
      'Annotate it with @AuraEnabled(cacheable=true)'
    ],
    0,
    '@InvocableMethod en un método estático permite invocarlo desde Flow o Process Builder. Recibe y devuelve listas, y solo puede haber un método invocable por clase.'
  ),
  q(
    'What should be configured in a flow so that a failed DML element does not show a generic error to the user and the failure can be handled gracefully?',
    ['A fault path (fault connector)', 'A decision element', 'A loop element', 'A wait element'],
    0,
    'El fault connector enruta el flujo cuando falla un elemento (DML, acción, etc.) para registrar el error, avisar al usuario o revertir.'
  ),
  q(
    'Which restriction applies to a method annotated with @future?',
    [
      'It must be static, return void and accept only primitive types or collections of primitives',
      'It can accept sObjects as parameters',
      'It can return a value to the caller',
      'It can be chained to another @future method'
    ],
    0,
    'Los métodos @future deben ser static void y solo aceptan tipos primitivos (o colecciones de primitivos), no sObjects. No se pueden encadenar con otro @future (para eso se usa Queueable).'
  ),
  q(
    'Which advantage does Queueable Apex have over @future methods? (Choose 2.)',
    [
      'It accepts non-primitive types such as sObjects and custom Apex types',
      'It returns a job Id that can be monitored',
      'It runs synchronously',
      'It has no governor limits'
    ],
    [0, 1],
    'Queueable admite parámetros complejos (sObjects, clases propias), devuelve un Id de trabajo (System.enqueueJob) para seguimiento y permite encadenar jobs. Sigue estando sujeto a governor limits asíncronos.'
  ),
  q(
    'Which interface must an Apex class implement to be run as a batch job?',
    ['Schedulable', 'Database.Batchable<SObject>', 'Queueable', 'Database.AllowsCallouts'],
    1,
    'Database.Batchable requiere los métodos start(), execute() y finish(). Se lanza con Database.executeBatch(instancia, tamañoLote).'
  ),
  q(
    'What is the default batch size when calling Database.executeBatch(new MyBatch()) without a scope parameter?',
    ['10', '100', '200', '2000'],
    2,
    'El tamaño de lote por defecto es 200 registros por invocación de execute(). Se puede ajustar de 1 a 2000.'
  ),
  q(
    'A batch class must keep a running total across all executed batches. What must the class implement in addition to Database.Batchable?',
    ['Database.Stateful', 'Database.AllowsCallouts', 'Schedulable', 'Comparable'],
    0,
    'Sin Database.Stateful las variables de instancia se reinician entre cada execute(). Con Stateful el estado se conserva durante todo el trabajo.'
  ),
  q(
    'How can a developer run a class named NightlyJob every day at 2:00 AM?',
    [
      'Implement Schedulable and call System.schedule with a CRON expression',
      'Annotate the class with @future(schedule=true)',
      'Use Database.executeBatch with a delay parameter',
      'Create a time-based validation rule'
    ],
    0,
    'La clase implementa Schedulable (método execute(SchedulableContext)) y se programa con System.schedule(nombre, cronExp, instancia) o desde Setup → Apex Classes → Schedule Apex. Ejemplo CRON: "0 0 2 * * ?".'
  ),
  q(
    'Which method is used to publish a platform event from Apex?',
    ['EventBus.publish()', 'Database.insertImmediate()', 'System.publishEvent()', 'Messaging.sendEvent()'],
    0,
    'EventBus.publish(evento) publica eventos de plataforma. Los objetos de evento terminan en __e y los triggers sobre ellos solo soportan "after insert".'
  ),
  q(
    'Which trigger event is supported for platform events?',
    ['before insert', 'after insert', 'after update', 'before delete'],
    1,
    'Los triggers de eventos de plataforma solo admiten "after insert", porque los eventos no se actualizan ni se eliminan como registros normales.'
  ),
  q(
    'A developer wants to block a save and show a custom message on the Name field of an Account from an Apex trigger. What should be used?',
    [
      'throw new DmlException() outside the trigger',
      'record.Name.addError("Message")',
      'System.debug("Message")',
      'Database.rollback()'
    ],
    1,
    'El método addError() del campo (o del registro) añade un error de validación y evita el guardado, mostrando el mensaje junto al campo. Funciona en triggers before y after.'
  ),
  q(
    'What is the recommended practice for Apex triggers on an object?',
    [
      'Write several triggers per object, one per business rule',
      'Use one trigger per object and delegate logic to a handler class',
      'Put all logic directly in the trigger body to reduce class count',
      'Use a trigger only for after events'
    ],
    1,
    'Un trigger por objeto asegura un orden de ejecución predecible (con varios triggers el orden no está garantizado) y la lógica en una clase handler facilita pruebas y reutilización.'
  ),
  q(
    'Which code correctly defines a custom exception?',
    [
      'public class MyException extends Exception {}',
      'public class MyException implements Exception {}',
      'public exception MyException {}',
      'public class MyError extends System.Error {}'
    ],
    0,
    'Las excepciones personalizadas extienden Exception y su nombre debe terminar en "Exception".'
  ),
  q(
    'What is the behavior of a "finally" block in Apex?',
    [
      'It runs only if an exception is thrown.',
      'It always runs, whether or not an exception occurred.',
      'It runs only when the try block succeeds.',
      'It runs asynchronously after the transaction.'
    ],
    1,
    'El bloque finally se ejecuta siempre, haya excepción o no, y es ideal para liberar recursos o limpiar estado.'
  ),
  q(
    'A callout to an external service is required from Apex. Which TWO items are needed before the callout will work? (Choose 2.)',
    [
      'The endpoint is registered in Remote Site Settings or a Named Credential',
      'The class uses HttpRequest and Http to send the request',
      'The method is annotated with @TestVisible',
      'The class is declared as "without sharing"'
    ],
    [0, 1],
    'Hay que autorizar el endpoint (Remote Site Settings o, mejor, Named Credential) y usar las clases Http/HttpRequest/HttpResponse. Un Named Credential además gestiona la autenticación sin hardcodear secretos.'
  ),
  q(
    'A callout fails with "You have uncommitted work pending". What is the most likely cause?',
    [
      'A DML operation was performed earlier in the same transaction before the callout.',
      'The endpoint URL is wrong.',
      'The debug log level is too high.',
      'The class is not marked as global.'
    ],
    0,
    'No se pueden hacer callouts después de DML pendiente de commit en la misma transacción. Se soluciona haciendo el callout antes del DML o moviendo uno de los dos a un contexto asíncrono (Queueable/@future(callout=true)).'
  ),
  q(
    'Which approach is correct to allow a @future method to perform a callout?',
    ['@future(callout=true)', '@future(allowCallouts)', '@future with Http in the same class', '@future(external=true)'],
    0,
    'Los métodos @future que hacen callouts deben declararse como @future(callout=true).'
  ),
  q(
    'How do you expose an Apex class as a custom REST web service?',
    [
      'Annotate the class with @RestResource(urlMapping=\'/myservice/*\') and the methods with @HttpGet, @HttpPost, etc.',
      'Annotate the class with @WebService',
      'Annotate the class with @AuraEnabled',
      'Declare the class as "rest"'
    ],
    0,
    '@RestResource con urlMapping define el endpoint y los métodos usan @HttpGet, @HttpPost, @HttpPut, @HttpDelete o @HttpPatch. La clase debe ser global.'
  ),
  q(
    'A developer needs to guarantee that no other process modifies a set of records while they are being processed in a transaction. Which SOQL clause should be used?',
    ['FOR VIEW', 'FOR UPDATE', 'WITH LOCK', 'ALL ROWS'],
    1,
    'FOR UPDATE bloquea los registros devueltos hasta el fin de la transacción, evitando conflictos de edición concurrente.'
  ),
  q(
    'Which Apex construct lets a developer undo DML operations to a specific point within a transaction?',
    [
      'Savepoint and Database.rollback()',
      'try/catch only',
      'Database.undo()',
      'System.revert()'
    ],
    0,
    'Savepoint sp = Database.setSavepoint(); ... Database.rollback(sp); Los savepoints cuentan contra los límites de DML.'
  ),
  q(
    'Which SOQL query returns the number of Opportunities per Account?',
    [
      'SELECT AccountId, COUNT(Id) FROM Opportunity GROUP BY AccountId',
      'SELECT AccountId, SUM(Id) FROM Opportunity',
      'SELECT AccountId FROM Opportunity COUNT BY AccountId',
      'SELECT COUNT() FROM Opportunity ORDER BY AccountId'
    ],
    0,
    'Las agregaciones usan COUNT/SUM/etc. con GROUP BY. El resultado se obtiene como List<AggregateResult> usando get(\'expr0\') o alias.'
  ),
  q(
    'What is the advantage of using a SOQL "for" loop such as for (Account a : [SELECT Id FROM Account]) instead of assigning the query to a List?',
    [
      'It retrieves records in chunks of 200, reducing heap usage for large result sets',
      'It bypasses the 50,000 row limit',
      'It runs the query asynchronously',
      'It automatically enforces field-level security'
    ],
    0,
    'El SOQL for-loop recupera los registros en lotes de 200, evitando agotar el heap con grandes volúmenes. No elimina el límite de 50,000 filas.'
  ),
  q(
    'Which declarative tool can a business use to require sequential manager approvals for an Opportunity discount?',
    ['Validation rule', 'Approval process', 'Assignment rule', 'Escalation rule'],
    1,
    'Los Approval Processes automatizan solicitudes de aprobación multinivel con aprobadores, acciones de aprobación/rechazo y bloqueo de registro.'
  ),
  q(
    'A validation rule must prevent saving an Opportunity when Amount is negative. Which formula is correct?',
    ['Amount >= 0', 'Amount < 0', 'ISBLANK(Amount)', 'NOT(Amount > 0)'],
    1,
    'Una validation rule bloquea el guardado cuando la fórmula devuelve TRUE. Por eso se escribe la condición de error: Amount < 0.'
  ),
  q(
    'Which statement about Process Builder and Workflow Rules is accurate today?',
    [
      'They are the recommended tools for all new automation.',
      'They are legacy tools; Flow is the recommended declarative automation tool for new development.',
      'They can run Apex triggers directly.',
      'They are the only tools that can update related records.'
    ],
    1,
    'Salesforce recomienda Flow Builder para nueva automatización declarativa; Workflow Rules y Process Builder están en retiro (no se pueden crear nuevos en org recientes) y se migran a Flow.'
  ),
  q(
    'What is the maximum number of jobs that can be added to the queue with System.enqueueJob from a single synchronous transaction?',
    ['1', '10', '50', '100'],
    2,
    'Se pueden encolar hasta 50 trabajos Queueable en una transacción síncrona. En una transacción asíncrona (por ejemplo, desde otro Queueable) solo 1 job hijo.'
  ),
  q(
    'A trigger needs to update Contacts whenever the related Account\'s Phone changes. Which approach follows best practices?',
    [
      'Query Contacts inside a for loop over Trigger.new',
      'Collect Account Ids, query Contacts once with WHERE AccountId IN :ids, update them in a list outside the loop',
      'Use an @future method per Account',
      'Update each Contact with a separate DML inside the loop'
    ],
    1,
    'Bulkificación: una consulta con IN y una sola DML sobre la lista completa. Hacerlo por registro dentro de un bucle rompe los límites con cargas masivas.'
  ),
  q(
    'What does the following trigger do when 200 Accounts are inserted at once?',
    [
      'It works: the trigger runs once with all 200 records in Trigger.new',
      'It runs 200 separate times',
      'It fails because triggers cannot handle more than 100 records',
      'It runs asynchronously'
    ],
    0,
    'Los triggers procesan registros en bloques de hasta 200: Trigger.new contiene hasta 200 registros por ejecución. Por eso el código debe iterar sobre Trigger.new.',
    `trigger AccountTrigger on Account (before insert) {
    for (Account a : Trigger.new) {
        a.Description = 'Created ' + System.today();
    }
}`
  ),
  q(
    'What type of Flow can run on a schedule to process a batch of records (for example every night)?',
    ['Screen flow', 'Schedule-triggered flow', 'Platform event-triggered flow', 'Record-triggered flow only'],
    1,
    'Los Schedule-Triggered Flows se ejecutan a intervalos definidos (una vez, diaria o semanalmente) sobre un conjunto de registros que cumple unas condiciones.'
  ),
  q(
    'Which Apex method allows a Queueable job to make a callout?',
    [
      'Implement Database.AllowsCallouts on the Queueable class',
      'Add @future(callout=true) to execute()',
      'Queueable jobs cannot make callouts',
      'Use Http.setAsync(true)'
    ],
    0,
    'Los Queueable pueden hacer callouts si implementan Database.AllowsCallouts. Es la alternativa moderna a @future(callout=true).'
  ),
  q(
    'In a before insert trigger, which code correctly prevents inserts of Accounts with no Industry?',
    [
      'for (Account a : Trigger.new) { if (a.Industry == null) a.addError(\'Industry required\'); }',
      'if (Trigger.new.Industry == null) throw new Exception();',
      'delete Trigger.new;',
      'Trigger.stop();'
    ],
    0,
    'Se itera sobre Trigger.new y se llama a addError() en los registros que incumplen la regla; no hace falta DML y evita el guardado de esos registros.'
  ),
  q(
    'A record-triggered flow and an Apex before trigger both update the same field on the same object. What is true about execution?',
    [
      'Before-save flows run before before-triggers, so the trigger may overwrite the flow\'s value',
      'Apex always runs first',
      'Flows are never executed when triggers exist',
      'They run in parallel'
    ],
    0,
    'El orden de ejecución coloca los before-save flows antes de los before triggers. Si ambos tocan el mismo campo, el valor final es el que establece el último en ejecutarse (el trigger).'
  ),
  q(
    'Which Apex method returns the number of SOQL queries already issued in the current transaction?',
    ['Limits.getQueries()', 'System.getQueries()', 'Limits.getSoqlCount()', 'Database.queryCount()'],
    0,
    'La clase Limits expone el uso actual (getQueries()) y el máximo (getLimitQueries()) de cada governor limit para monitorear el consumo.'
  )
];
