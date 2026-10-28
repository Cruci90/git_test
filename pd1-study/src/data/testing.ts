import { makeFactory } from './helper';

const q = makeFactory('testing', 'TST');

export const testing = [
  q(
    'What is the minimum overall Apex code coverage required to deploy to a production org?',
    ['50%', '65%', '75%', '90%'],
    2,
    'Se requiere un 75% de cobertura global de las clases y triggers de Apex, y cada trigger debe tener al menos algo de cobertura (>0%). Las clases de test no cuentan en el cálculo.'
  ),
  q(
    'Which annotation marks an Apex class or method as containing test code?',
    ['@testMethod', '@isTest', '@TestSetup only', '@Test'],
    1,
    '@isTest se aplica a clases y métodos de prueba. Los métodos de test deben ser static void y sin parámetros. @testSetup marca un método que crea datos comunes.'
  ),
  q(
    'What is the purpose of Test.startTest() and Test.stopTest()?',
    [
      'They reset governor limits for the code between them and force asynchronous code to complete at stopTest()',
      'They disable validation rules during the test',
      'They enable SeeAllData for the test',
      'They measure code coverage'
    ],
    0,
    'Entre startTest y stopTest el código tiene límites nuevos (separados del setup de datos), y los procesos asíncronos (future, queueable, batch) se ejecutan de forma síncrona al llegar a stopTest().'
  ),
  q(
    'By default, can an Apex test class see the existing data in the org?',
    [
      'Yes, tests always see org data.',
      'No, tests only see data they create themselves (SeeAllData=false), except setup objects.',
      'Only data created in the last 24 hours.',
      'Only data owned by the running user.'
    ],
    1,
    'Desde la API 24 los tests no ven los datos de la org salvo que se use @isTest(SeeAllData=true). Por buena práctica los tests deben crear sus propios datos.'
  ),
  q(
    'A developer needs to create the same test data once and use it in all test methods of a class. What should be used?',
    ['A method annotated with @testSetup', 'A static initializer block', 'SeeAllData=true', 'A custom setting'],
    0,
    '@testSetup se ejecuta una vez antes de los métodos de test; los datos se restauran (rollback) para cada método, lo que acelera la ejecución.'
  ),
  q(
    'Which method best verifies that two values are equal in modern Apex unit tests?',
    ['System.assertEquals(expected, actual)', 'System.debug(expected == actual)', 'System.verify(expected)', 'Test.equals(a, b)'],
    0,
    'System.assertEquals (o la clase Assert: Assert.areEqual) valida resultados esperados. Un test sin aserciones puede dar cobertura pero no verifica nada.'
  ),
  q(
    'How can a unit test of a class that makes HTTP callouts avoid real callouts?',
    [
      'Implement HttpCalloutMock and use Test.setMock()',
      'Use @future in the test',
      'Use SeeAllData=true',
      'Annotate with @isTest(callout=false)'
    ],
    0,
    'Los tests no pueden realizar callouts reales. Se implementa HttpCalloutMock (método respond) y se registra con Test.setMock(HttpCalloutMock.class, new Mock()).'
  ),
  q(
    'What does System.runAs(user) allow in a test?',
    [
      'Execute a block of code as a specific user to test sharing behavior',
      'Bypass all sharing and CRUD/FLS permissions',
      'Run the code asynchronously',
      'Change the running user permanently'
    ],
    0,
    'System.runAs permite probar con distintos usuarios y comprobar reglas de compartición. Aplica la compartición del usuario pero NO sus permisos CRUD/FLS. Además es la forma de evitar errores MIXED_DML al crear usuarios en un test.'
  ),
  q(
    'A developer receives a MIXED_DML_OPERATION error in a test. What is the likely cause and fix?',
    [
      'Setup objects (such as User) and non-setup objects were modified in the same transaction; wrap the setup object DML in System.runAs()',
      'The test has too many assertions',
      'The test class is private',
      'SeeAllData=true is missing'
    ],
    0,
    'No se pueden mezclar DML de objetos de configuración (User, Group, etc.) con objetos normales en la misma transacción; se soluciona separando una de las operaciones con System.runAs() o en un contexto asíncrono.'
  ),
  q(
    'How is Apex code coverage calculated?',
    [
      'Number of lines executed by tests divided by the number of lines in classes and triggers',
      'Number of test methods divided by number of classes',
      'Number of assertions divided by number of methods',
      'Number of classes with a test class divided by total classes'
    ],
    0,
    'La cobertura es líneas ejecutadas / líneas ejecutables totales en clases y triggers (sin contar clases de test ni comentarios). Cobertura alta no implica calidad si no hay aserciones.'
  ),
  q(
    'Which tool allows a developer to inspect variable values at a point in time of a past execution using a debug log?',
    ['Apex Replay Debugger', 'Schema Builder', 'Workbench', 'Process Builder'],
    0,
    'Apex Replay Debugger (VS Code) permite revisar la ejecución a partir de un debug log: pasos, variables y breakpoints, sin necesidad de ejecutar de nuevo.'
  ),
  q(
    'Which is required to generate a debug log for a specific user?',
    [
      'A trace flag with a debug level for the user',
      'Making the user a system administrator',
      'Setting SeeAllData=true',
      'Enabling a validation rule'
    ],
    0,
    'Los debug logs se generan configurando un trace flag (usuario, clase o trigger) con un nivel de depuración que define las categorías y detalle de los logs.'
  ),
  q(
    'Which section of a debug log summarizes how many SOQL queries, DML statements and how much CPU time a transaction used?',
    ['CUMULATIVE_LIMIT_USAGE', 'USER_INFO', 'CODE_UNIT_STARTED', 'VARIABLE_ASSIGNMENT'],
    0,
    'CUMULATIVE_LIMIT_USAGE (que aparece al final de cada unidad de código, con nivel Profiling) resume el consumo de governor limits: consultas SOQL, DML, tiempo de CPU, heap, callouts, etc.'
  ),
  q(
    'Which sandbox type includes a copy of all production data and metadata and has the longest refresh interval?',
    ['Developer sandbox', 'Developer Pro sandbox', 'Partial Copy sandbox', 'Full sandbox'],
    3,
    'Full sandbox: copia completa de metadatos y datos, ideal para pruebas de rendimiento/UAT; intervalo de actualización de 29 días. Partial Copy: muestra de datos (5 días). Developer/Dev Pro: solo metadatos (1 día).'
  ),
  q(
    'A team needs a sandbox only for individual development with metadata only and refreshable daily. Which type fits?',
    ['Developer sandbox', 'Full sandbox', 'Partial Copy sandbox', 'Production org'],
    0,
    'Developer y Developer Pro sandboxes copian solo la configuración (metadatos) y pueden refrescarse cada día. Developer Pro ofrece más almacenamiento.'
  ),
  q(
    'Which deployment tool relies on an inbound and outbound connection between authorized orgs and is configured through the UI?',
    ['Change sets', 'Salesforce CLI', 'Unlocked packages', 'Ant Migration Tool'],
    0,
    'Los Change Sets se crean en la org origen (outbound) y se suben a otra org conectada (inbound). No permiten control de versiones y solo funcionan entre orgs relacionadas (sandbox↔producción).'
  ),
  q(
    'Which file lists the metadata components to retrieve or deploy using Metadata API or the CLI?',
    ['package.xml (manifest)', 'sfdx-project.json only', '.forceignore', 'config/project-scratch-def.json'],
    0,
    'package.xml es el manifiesto que indica tipos de metadatos y miembros. sfdx-project.json define el proyecto y .forceignore excluye archivos.'
  ),
  q(
    'What is a scratch org?',
    [
      'A temporary, source-driven, configurable Salesforce environment defined by a definition file',
      'A copy of production data',
      'A permanent testing sandbox',
      'A special production org for backups'
    ],
    0,
    'Las scratch orgs son efímeras (hasta 30 días), se crean desde un archivo de definición (project-scratch-def.json) y favorecen el desarrollo basado en código fuente y CI/CD.'
  ),
  q(
    'Which CLI command creates a scratch org?',
    ['sf org create scratch', 'sf project deploy start', 'sf apex run test', 'sf org login web'],
    0,
    'sf org create scratch (antes sfdx force:org:create) crea la org efímera. sf project deploy start despliega el código; sf apex run test lanza pruebas.'
  ),
  q(
    'Which test level can be used when deploying to production to run all tests in the org except those in managed packages?',
    ['RunLocalTests', 'RunAllTestsInOrg', 'NoTestRun', 'RunSpecifiedTests'],
    0,
    'RunLocalTests ejecuta todos los tests locales (excluye los de paquetes gestionados instalados) y es el nivel por defecto en producción. RunAllTestsInOrg ejecuta absolutamente todos.'
  ),
  q(
    'What does a validation-only (check-only) deployment do?',
    [
      'Runs the deployment checks and tests without saving changes, enabling a later quick deploy',
      'Deploys the changes but skips tests',
      'Rolls back the last deployment',
      'Copies data between orgs'
    ],
    0,
    'Una validación simula el despliegue y ejecuta tests sin guardar cambios. Si resulta exitosa se puede hacer un "quick deploy" (dentro de 10 días) sin repetir las pruebas.'
  ),
  q(
    'Which statement about the test method signature is correct?',
    [
      'A test method must be static, return void and take no parameters.',
      'A test method can return a Boolean.',
      'A test method must be global.',
      'A test method must take a Test.Context parameter.'
    ],
    0,
    'Los métodos de test deben ser static void sin parámetros y estar anotados con @isTest (o "testMethod"). La visibilidad puede ser private o public.'
  ),
  q(
    'A developer wants to test the exception path of a method. Which pattern is correct?',
    [
      'Wrap the call in try/catch, set a flag in the catch, and assert the exception was thrown',
      'Do not test exceptions',
      'Use Test.exception()',
      'Use Database.rollback()'
    ],
    0,
    'Se prueba el camino negativo capturando la excepción esperada y validando tipo/mensaje. Además conviene hacer Assert.fail() si no se lanza la excepción.'
  ),
  q(
    'Which is a best practice for test data creation across tests?',
    [
      'Use a test data factory class annotated with @isTest',
      'Hard-code Ids of production records',
      'Query existing data with SeeAllData=true',
      'Load data manually before each deployment'
    ],
    0,
    'Una test data factory (@isTest) centraliza la creación de datos y evita duplicación. Nunca se deben codificar Ids de producción, que difieren entre orgs.'
  ),
  q(
    'Which TWO tools help a developer analyze the performance and selectivity of a SOQL query? (Choose 2.)',
    ['Query Plan tool in the Developer Console', 'Execute Anonymous window', 'Debug log analysis', 'Schema Builder'],
    [0, 2],
    'La herramienta Query Plan (Developer Console) muestra el coste y si se usa un índice; los debug logs muestran filas y tiempos reales de ejecución. Schema Builder es para el modelo de datos.'
  ),
  q(
    'A test inserts 201 Accounts to validate trigger bulk behavior. What should the developer verify?',
    [
      'That the trigger works for more than 200 records and does not hit governor limits',
      'That the trigger only processes 100 records',
      'That the trigger is asynchronous',
      'That no assertions are needed'
    ],
    0,
    'Se debe verificar que el código es bulk-safe: Salesforce procesa en lotes de 200, así que 201 registros ejercitan dos ejecuciones del trigger y comprueban el uso correcto de límites.'
  ),
  q(
    'In the Developer Console, which action runs a snippet of Apex without saving it to the org?',
    ['Execute Anonymous', 'Run All Tests', 'Open Log', 'Query Editor'],
    0,
    'Debug → Open Execute Anonymous Apex permite ejecutar código ad-hoc y ver el log; no guarda la clase en la org.'
  ),

  q(
    'A helper class TestDataFactory creates Accounts for unit tests and must never be callable from production code. What should the developer add?',
    [
      '@IsTest on the class declaration',
      'The private modifier on every method',
      '@TestVisible on the class',
      'The static keyword on every method'
    ],
    0,
    'Una clase anotada con @IsTest solo puede usarse desde código de prueba y además no cuenta para el límite de tamaño de código Apex de la org. Los métodos deben seguir siendo public/global para que otras clases de test los usen.'
  ),
  q(
    'Which TWO tools can run a script that automatically deploys metadata to a sandbox? (Choose 2.)',
    [
      'Salesforce CLI',
      'Ant Migration Tool',
      'Change sets',
      'Developer Console'
    ],
    [0, 1],
    'Salesforce CLI y la Ant Migration Tool (Metadata API) se pueden invocar desde scripts y pipelines de CI/CD. Los change sets se crean manualmente en la interfaz y la Developer Console no despliega metadatos.'
  ),

  q(
    'Which class, introduced in recent releases, provides methods such as areEqual, isTrue and fail for test assertions?',
    ['Assert', 'Limits', 'Schema', 'Messaging'],
    0,
    'La clase Assert (Assert.areEqual, Assert.isTrue, Assert.fail...) es la forma moderna de hacer aserciones y ofrece mensajes más claros que System.assert.'
  ),
  q(
    'How can a test load records from a CSV file stored as a static resource?',
    [
      "Test.loadData(Account.sObjectType, 'accountsCsv')",
      "Database.loadCsv('accountsCsv')",
      "Test.importFile('accountsCsv')",
      "StaticResource.insertRecords('accountsCsv')"
    ],
    0,
    'Test.loadData(sObjectType, nombreRecursoEstatico) inserta los registros del CSV y devuelve la lista, útil para grandes conjuntos de datos de prueba.'
  ),
  q(
    'Which interface and method allow a developer to create a mock (stub) of an Apex class for unit tests?',
    ['System.StubProvider with Test.createStub()', 'HttpCalloutMock with Test.setMock()', 'Schedulable with System.schedule()', 'Comparable with sort()'],
    0,
    'Apex Stub API: se implementa System.StubProvider y se crea el stub con Test.createStub(Clase.class, proveedor). HttpCalloutMock es específico para callouts.'
  ),
  q(
    'SOSL queries in test methods return no results by default. Which method defines the results they return?',
    ['Test.setFixedSearchResults()', 'Test.setSearchResults()', 'Database.setSearch()', 'Test.mockSosl()'],
    0,
    'Test.setFixedSearchResults(List<Id>) fija los Ids que devolverán las consultas SOSL durante el test, porque los índices de búsqueda no se actualizan en pruebas.'
  ),
  q(
    'What happens to records created in a test method when the test finishes?',
    [
      'They are rolled back and never committed to the database',
      'They are committed to the org',
      'They remain until the next deployment',
      'They are kept only if the test passed'
    ],
    0,
    'Los datos creados en una prueba se revierten automáticamente al terminar (no se confirman en la base de datos), tanto si pasa como si falla.'
  ),
  q(
    'How can a test access custom metadata type records?',
    [
      'It can query them directly; they are available without SeeAllData',
      'It must create them with DML in the test',
      'It requires @isTest(SeeAllData=true)',
      'They cannot be used in tests'
    ],
    0,
    'Los registros de custom metadata son metadatos: las pruebas pueden consultarlos directamente, aunque no pueden crearse con DML en un test.'
  ),
  q(
    'Which package type is typically used by ISVs to distribute IP-protected apps through AppExchange?',
    ['Managed package', 'Unlocked package', 'Change set', 'Unmanaged package'],
    0,
    'Los managed packages ofrecen protección de código, namespace y control de versiones/actualizaciones, y se usan para distribuir en AppExchange. Los unlocked packages son para modularizar proyectos propios.'
  ),
  q(
    'What is the default email deliverability setting in a newly created or refreshed sandbox?',
    ['System email only', 'All email', 'No access', 'Only email to administrators'],
    0,
    'En los sandboxes el acceso al envío de correo se establece en "System email" por defecto para evitar enviar correos a clientes reales.'
  ),
  q(
    'What is the minimum Apex Code log level needed for System.debug() messages to appear in a debug log?',
    ['ERROR', 'WARN', 'INFO', 'DEBUG'],
    3,
    'System.debug escribe por defecto en nivel DEBUG, por lo que la categoría Apex Code debe estar en DEBUG o superior (FINE, FINER, FINEST) para verlos.'
  ),
  q(
    'In a source-driven development model, what is considered the source of truth?',
    ['The version control repository', 'The production org', 'The most recent sandbox', 'A change set'],
    0,
    'En el desarrollo basado en código fuente, el repositorio de control de versiones es la fuente de verdad; las orgs (scratch, sandbox, producción) se despliegan desde él.'
  ),
  q(
    'Which Salesforce CLI command runs Apex tests and can return code coverage?',
    ['sf apex run test --code-coverage', 'sf project deploy start --tests', 'sf org create scratch', 'sf apex log tail'],
    0,
    'sf apex run test ejecuta pruebas Apex; la opción --code-coverage incluye la cobertura. sf apex log tail muestra logs en vivo.'
  ),
  q(
    'What does a checkpoint in the Developer Console capture?',
    [
      'A snapshot of the heap at a specific line when the code runs',
      'The result of every SOQL query',
      'A copy of the database',
      'The list of failing tests'
    ],
    0,
    'Los checkpoints toman una captura del heap en la línea marcada durante la ejecución y se inspeccionan en la pestaña Checkpoints (hasta 5 a la vez).'
  ),
  q(
    'A deployment to production contains only custom fields and page layouts, with no Apex classes or triggers. Are Apex tests required?',
    [
      'No, Apex tests are only required when the deployment includes Apex classes or triggers',
      'Yes, always at least RunLocalTests',
      'Yes, 75% coverage of the whole org must be verified',
      'Yes, but only in a Full sandbox'
    ],
    0,
    'Las pruebas Apex son obligatorias en producción cuando se despliegan clases o triggers. Un despliegue solo de metadatos declarativos (campos, layouts) no ejecuta pruebas.'
  )
];
