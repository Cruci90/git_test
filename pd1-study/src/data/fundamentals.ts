import { makeFactory } from './helper';

const q = makeFactory('fundamentals', 'FUN');

export const fundamentals = [
  q(
    'Which statement best describes the multi-tenant architecture of the Salesforce platform?',
    [
      'Each customer runs on a dedicated server with its own copy of the Apex runtime.',
      'Many customers share the same infrastructure and code base, and the platform enforces limits so no tenant can monopolize resources.',
      'Customers share data but each one runs a different version of the platform.',
      'Every customer must host their own database but share the user interface layer.'
    ],
    1,
    'Multi-tenancy significa que muchos clientes (orgs) comparten la misma infraestructura y código, con los datos aislados lógicamente. Por eso existen los governor limits: evitan que un tenant monopolice recursos compartidos.'
  ),
  q(
    'In the Salesforce implementation of the MVC pattern, which component acts as the Controller?',
    [
      'Custom objects and fields',
      'Visualforce pages and Lightning components',
      'Apex classes and standard controller logic',
      'Page layouts and record types'
    ],
    2,
    'Model = objetos/campos (esquema de datos). View = Visualforce, Lightning Web/Aura components. Controller = clases Apex y la lógica de los controladores estándar que conecta vista y datos.'
  ),
  q(
    'Which relationship type must be used if the business needs a roll-up summary field on the parent object (without using code or additional tools)?',
    ['Lookup', 'Master-detail', 'External lookup', 'Hierarchical'],
    1,
    'Los campos Roll-Up Summary solo se pueden crear en el objeto maestro de una relación Master-Detail. Los lookups no los soportan de forma nativa (requieren código, Flow o herramientas de terceros).'
  ),
  q(
    'A company needs to model a many-to-many relationship between Student__c and Course__c. What is the correct approach?',
    [
      'Add a lookup field to Student__c that points to Course__c.',
      'Create a junction object with two master-detail relationships, one to each object.',
      'Create a formula field on both objects that references the other object.',
      'Create a roll-up summary field on both objects.'
    ],
    1,
    'La relación muchos-a-muchos se implementa con un objeto de unión (junction object) que tiene dos relaciones Master-Detail, una hacia cada objeto.'
  ),
  q(
    'What is the maximum number of master-detail relationships that a custom object can have?',
    ['1', '2', '3', '5'],
    1,
    'Un objeto personalizado puede tener como máximo 2 relaciones Master-Detail (por eso un junction object conecta exactamente dos padres).'
  ),
  q(
    'A record in the detail side of a master-detail relationship exists. What happens to it when its master record is deleted?',
    [
      'The detail record is orphaned and its master field is cleared.',
      'The detail record is deleted as well (cascade delete).',
      'The deletion of the master record is blocked.',
      'The detail record is reassigned to the record owner of the master.'
    ],
    1,
    'En Master-Detail el borrado es en cascada: al eliminar el maestro se eliminan sus detalles. En un lookup se podría limpiar el campo o bloquear el borrado según la configuración.'
  ),
  q(
    'What is the maximum number of SOQL queries allowed in a single synchronous Apex transaction?',
    ['20', '50', '100', '200'],
    2,
    'El límite es 100 consultas SOQL en transacciones síncronas y 200 en asíncronas. Por eso nunca se debe poner SOQL dentro de un bucle.'
  ),
  q(
    'What is the maximum number of DML statements that can be issued in a single Apex transaction?',
    ['100', '150', '200', '10,000'],
    1,
    'Se permiten 150 sentencias DML por transacción (y hasta 10,000 registros procesados por DML en total). Las operaciones sobre listas cuentan como una sola sentencia.'
  ),
  q(
    'What is the maximum number of records that SOQL queries can return in total in one Apex transaction?',
    ['1,000', '10,000', '50,000', '2,000,000'],
    2,
    'El total de registros recuperados por todas las consultas SOQL en una transacción es de 50,000.'
  ),
  q(
    'A developer wrote the following method and it throws "Too many SOQL queries: 101" when 200 Contacts are passed. What is the best fix?',
    [
      'Move the query outside the loop, collect the AccountIds in a Set and query once.',
      'Add the @future annotation to the method.',
      'Wrap the query in a try/catch block.',
      'Use Database.query instead of inline SOQL.'
    ],
    0,
    'El problema es una consulta SOQL dentro de un bucle. La solución es "bulkificar": recopilar los Ids en un Set, hacer una única consulta fuera del bucle y usar un Map para acceder a los resultados.',
    `public static void process(List<Contact> contacts) {
    for (Contact c : contacts) {
        Account a = [SELECT Id, Name FROM Account WHERE Id = :c.AccountId];
        c.Description = a.Name;
    }
}`
  ),
  q(
    'Which keyword makes a class respect the record-level sharing rules of the running user?',
    ['with sharing', 'without sharing', 'global', 'virtual'],
    0,
    '"with sharing" hace que Apex aplique las reglas de compartición (record-level) del usuario que ejecuta. Nota: no aplica CRUD ni FLS; eso hay que forzarlo aparte.'
  ),
  q(
    'What does the keyword "inherited sharing" do on an Apex class?',
    [
      'The class always runs without sharing.',
      'The class uses the sharing mode of the class that calls it; if it is the entry point it runs with sharing.',
      'The class inherits sharing from its parent object in the data model.',
      'The class bypasses field-level security of the caller.'
    ],
    1,
    '"inherited sharing" hereda el modo de la clase que lo invoca; si es el punto de entrada (por ejemplo, una llamada desde Visualforce o un controlador Aura/LWC) se ejecuta como "with sharing", que es la opción segura por defecto.'
  ),
  q(
    'Apex runs in system mode by default. Which TWO approaches help enforce the running user\'s object and field permissions? (Choose 2.)',
    [
      'Declaring the class as "with sharing"',
      'Adding WITH SECURITY_ENFORCED to the SOQL query',
      'Using Security.stripInaccessible() on the records',
      'Annotating the method with @AuraEnabled'
    ],
    [1, 2],
    'WITH SECURITY_ENFORCED lanza una excepción si el usuario no tiene acceso a algún campo/objeto de la consulta, y Security.stripInaccessible() elimina los campos inaccesibles. "with sharing" solo controla compartición de registros, y @AuraEnabled solo expone el método.'
  ),
  q(
    'In which Apex trigger context is the Trigger.new collection read-only?',
    ['before insert', 'before update', 'after insert/after update', 'before delete'],
    2,
    'En los triggers "after", Trigger.new es de solo lectura; para modificar los registros disparadores hay que usar un trigger "before" (donde además no hace falta DML). En "before delete" Trigger.new ni siquiera existe.'
  ),
  q(
    'In which trigger event is Trigger.old NOT available?',
    ['before update', 'after update', 'before delete', 'before insert'],
    3,
    'En insert no existe un valor anterior, por lo que Trigger.old es null. Está disponible en update, delete y (solo Trigger.old) en after delete; en undelete solo hay Trigger.new.'
  ),
  q(
    'Which of the following happens FIRST in the Salesforce order of execution when a record is saved?',
    [
      'After-save record-triggered flows',
      'Custom validation rules',
      'Before-save record-triggered flows and before triggers',
      'Workflow rule field updates'
    ],
    2,
    'Orden simplificado: validaciones del sistema → before-save flows → before triggers → validaciones personalizadas → duplicate rules → guardado (sin commit) → after triggers → assignment/auto-response/workflow → after-save flows → roll-ups → commit.'
  ),
  q(
    'Which SOQL query correctly retrieves each Contact together with the name of its parent Account?',
    [
      'SELECT Name, Accounts.Name FROM Contact',
      'SELECT Name, Account.Name FROM Contact',
      'SELECT Name, (SELECT Name FROM Account) FROM Contact',
      'SELECT Name FROM Contact JOIN Account'
    ],
    1,
    'En consultas hijo→padre se usa la notación con punto y el nombre de la relación en singular: Account.Name. Apex SOQL no usa JOIN.'
  ),
  q(
    'Which SOQL query returns each Account along with its related Contacts?',
    [
      'SELECT Name, Contact.LastName FROM Account',
      'SELECT Name, (SELECT LastName FROM Contacts) FROM Account',
      'SELECT Name, (SELECT LastName FROM Contact) FROM Account',
      'SELECT Name, Contacts.LastName FROM Account'
    ],
    1,
    'En una subconsulta padre→hijo se usa el nombre de la relación hija, que normalmente es el plural (Contacts). La subconsulta va entre paréntesis en el SELECT.'
  ),
  q(
    'When should a developer use SOSL instead of SOQL?',
    [
      'To search for a text term across several objects in a single query',
      'To retrieve all fields of one object by Id',
      'To perform aggregate calculations like SUM and COUNT',
      'To return records sorted by a numeric field'
    ],
    0,
    'SOSL (Salesforce Object Search Language) hace búsquedas de texto sobre múltiples objetos a la vez y devuelve una lista de listas. SOQL consulta un objeto (y sus relaciones) y soporta agregaciones.'
  ),
  q(
    'What is the effect of calling Database.insert(accounts, false)?',
    [
      'All records are inserted or none is inserted.',
      'Valid records are inserted and failures are reported in the SaveResult array instead of throwing an exception.',
      'The insert runs asynchronously.',
      'Validation rules are bypassed.'
    ],
    1,
    'El segundo parámetro es allOrNone. Con false se permite éxito parcial: los registros válidos se guardan y los errores se devuelven en los objetos Database.SaveResult sin lanzar excepción.'
  ),
  q(
    'A developer needs a collection that does not allow duplicate values and has no guaranteed order. Which should be used?',
    ['List', 'Set', 'Map', 'Array'],
    1,
    'Un Set contiene elementos únicos sin orden garantizado. Un List permite duplicados y mantiene el orden; un Map almacena pares clave-valor con claves únicas.'
  ),
  q(
    'What is the most efficient way to build a Map of Accounts keyed by Id from a SOQL result?',
    [
      'Loop through the list and call put() for each record only.',
      'Map<Id, Account> m = new Map<Id, Account>([SELECT Id, Name FROM Account]);',
      'Map<Id, Account> m = Account.getMap();',
      'Map<Id, Account> m = new Map<Id, Account>().putAll(accounts);'
    ],
    1,
    'El constructor de Map<Id, SObject> acepta una lista de sObjects (o el resultado de un SOQL) y crea el mapa con el Id como clave automáticamente.'
  ),
  q(
    'A developer wants to prevent a trigger from running recursively in the same transaction. Which technique is commonly used?',
    [
      'A static Boolean variable in a helper class',
      'A non-static member variable in the trigger',
      'A custom setting of type List',
      'A final instance variable'
    ],
    0,
    'Las variables estáticas conservan su valor durante toda la transacción, por lo que sirven como bandera de control de recursión. Las variables de instancia se reinician en cada ejecución del trigger.'
  ),
  q(
    'What is a key advantage of custom metadata types over custom settings?',
    [
      'Custom metadata records can be deployed with change sets and packages.',
      'Custom metadata can only be read by administrators.',
      'Custom metadata uses no storage.',
      'Custom metadata supports hierarchy by user and profile.'
    ],
    0,
    'Los registros de custom metadata son metadatos: se despliegan con change sets, paquetes y Metadata API. Los datos de custom settings no se despliegan (solo su definición). La jerarquía por usuario/perfil es de los hierarchy custom settings.'
  ),
  q(
    'Which keyword must be used on a method so that a subclass is allowed to override it?',
    ['abstract only', 'virtual (or abstract)', 'static', 'final'],
    1,
    'Para poder sobrescribir un método en una subclase, la clase y el método deben ser "virtual" (con implementación) o "abstract" (sin implementación). La subclase usa "override".'
  ),
  q(
    'What is the output of the following code?',
    ['3.14', '3.1', '3.15', '3.14159'],
    0,
    'setScale(2) redondea a 2 decimales usando el modo de redondeo HALF_EVEN por defecto: 3.14159 → 3.14.',
    `Decimal d = 3.14159;
System.debug(d.setScale(2));`
  ),
  q(
    'What do record types allow an administrator to do?',
    [
      'Offer different business processes, picklist values and page layouts for the same object to different profiles',
      'Create a separate database table for each record',
      'Assign different sharing rules to each field',
      'Enforce unique values on a field'
    ],
    0,
    'Los record types permiten distintos procesos de negocio, valores de picklist y page layouts para el mismo objeto según el perfil/permission set del usuario.'
  ),
  q(
    'A user already has a profile that grants access to the Account object. Which tool can add Delete permission for just a few users without changing the profile?',
    ['Another profile', 'A permission set', 'A page layout', 'A validation rule'],
    1,
    'Los permission sets amplían (nunca restringen) los permisos de los usuarios sin cambiar su perfil. Ideal para dar acceso adicional a un subconjunto de usuarios.'
  ),
  q(
    'A developer needs to access object and field metadata dynamically in Apex without hard-coding API names. Which feature should be used?',
    ['Schema describe methods', 'Custom metadata types', 'The Tooling API only', 'Static resources'],
    0,
    'Las clases Schema (Schema.getGlobalDescribe(), DescribeSObjectResult, DescribeFieldResult) permiten conocer objetos, campos, picklists y permisos dinámicamente desde Apex.'
  )
];
