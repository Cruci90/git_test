// Sección 4: Testing, Debugging, and Deployment (22 %)
window.PD1_QUESTIONS = window.PD1_QUESTIONS || [];
window.PD1_QUESTIONS.push(
  {
    s: 'test', t: 'Cobertura',
    q: '¿Qué requisitos de cobertura de código hay para desplegar Apex en producción? (Elige 2)',
    o: [
      'Al menos un 75 % de cobertura global del código Apex',
      'Cada trigger debe tener algo de cobertura (> 0 %)',
      'Cada clase debe tener al menos un 75 %',
      'Un 100 % de cobertura en triggers'
    ],
    a: [0, 1],
    e: 'Se exige un 75 % global y que todos los triggers tengan cobertura mayor que 0. Además todos los tests deben pasar. El objetivo real debería ser probar comportamientos con asserts, no solo cubrir líneas.'
  },
  {
    s: 'test', t: 'Datos de test',
    q: 'Por defecto, ¿qué datos de la org puede ver un método de test?',
    o: [
      'Todos los registros de la org',
      'Solo los datos creados en el test, más algunos objetos de configuración como User, Profile u Organization',
      'Ningún dato, ni siquiera usuarios',
      'Solo los registros creados en las últimas 24 horas'
    ],
    a: [1],
    e: 'Desde API 24 los tests están aislados de los datos de la org. Se pueden ver objetos de setup (User, Profile, RecordType, etc.). @isTest(SeeAllData=true) da acceso a todo, pero es mala práctica.'
  },
  {
    s: 'test', t: 'Datos de test',
    q: 'Varios métodos de una clase de test necesitan los mismos registros. ¿Cuál es la forma más eficiente de crearlos?',
    o: ['Un método anotado con @testSetup', 'Un constructor en la clase de test', 'Un bloque static', 'SeeAllData=true'],
    a: [0],
    e: '@testSetup se ejecuta una vez por clase; cada método de test recibe una copia limpia de esos datos (los cambios se revierten entre métodos). No está disponible con SeeAllData=true.'
  },
  {
    s: 'test', t: 'Datos de test',
    q: 'Se quiere cargar datos de test desde un CSV. ¿Qué método se usa?',
    o: ['Test.loadData(Account.sObjectType, \'NombreStaticResource\')', 'Database.load(\'archivo.csv\')', 'Test.importCsv()', 'No es posible'],
    a: [0],
    e: 'Test.loadData lee un CSV almacenado como static resource e inserta los registros, devolviendo una List<sObject>.'
  },
  {
    s: 'test', t: 'Test.startTest',
    q: '¿Cuáles son dos efectos de Test.startTest() y Test.stopTest()? (Elige 2)',
    o: [
      'El código entre ambos obtiene un nuevo conjunto de governor limits',
      'Los procesos asíncronos (future, queueable, batch) se ejecutan de forma síncrona al llamar a stopTest()',
      'Los datos se confirman en la base de datos',
      'Desactivan los triggers'
    ],
    a: [0, 1],
    e: 'startTest/stopTest separan la preparación de datos de la ejecución bajo prueba con límites nuevos, y stopTest fuerza la finalización del trabajo asíncrono para poder hacer asserts.'
  },
  {
    s: 'test', t: 'Test async',
    q: 'Se prueba un Batch Apex llamando a Database.executeBatch entre startTest y stopTest. ¿Qué hay que tener en cuenta?',
    o: [
      'Solo se ejecuta un execute(), así que los datos de test no deben superar el tamaño de un lote',
      'Se ejecutan todos los lotes en paralelo',
      'El batch no se ejecuta en tests',
      'Hay que usar SeeAllData=true'
    ],
    a: [0],
    e: 'En tests solo se puede ejecutar un lote (execute) del batch; se deben crear como máximo tantos registros como el tamaño de lote (p. ej. ≤ 200).'
  },
  {
    s: 'test', t: 'Callouts',
    q: '¿Cómo se prueba una clase que hace callouts HTTP?',
    o: [
      'Implementando HttpCalloutMock y registrándolo con Test.setMock(HttpCalloutMock.class, new MiMock())',
      'Los tests hacen callouts reales al servicio',
      'Con SeeAllData=true',
      'Con Test.isRunningTest() devolviendo un valor fijo en la clase de producción'
    ],
    a: [0],
    e: 'Los tests no pueden hacer callouts reales. Se usa HttpCalloutMock (o StaticResourceCalloutMock / MultiStaticResourceCalloutMock). Para SOAP: WebServiceMock.'
  },
  {
    s: 'test', t: 'runAs',
    q: '¿Para qué se usa System.runAs() en un test? (Elige 2)',
    o: [
      'Probar el código con el contexto de sharing de un usuario concreto',
      'Evitar el error MIXED_DML_OPERATION al crear usuarios y otros registros en el test',
      'Aplicar automáticamente los permisos de FLS en cualquier consulta',
      'Obtener nuevos governor limits'
    ],
    a: [0, 1],
    e: 'runAs aplica el sharing de registros del usuario (no FLS ni permisos de perfil) y permite mezclar DML de setup y no-setup en tests. Solo puede usarse en tests.'
  },
  {
    s: 'test', t: 'Visibilidad',
    q: 'Un método private de una clase debe ser accesible desde su clase de test sin hacerlo public. ¿Qué anotación usar?',
    o: ['@TestVisible', '@isTest', '@TestSetup', '@AuraEnabled'],
    a: [0],
    e: '@TestVisible permite que los tests accedan a métodos y variables private o protected.'
  },
  {
    s: 'test', t: 'Asserts',
    q: '¿Cuál es la forma recomendada de verificar resultados en un test moderno de Apex?',
    o: ['Assert.areEqual(esperado, real, mensaje)', 'System.debug(real)', 'if (real != esperado) return;', 'Test.verify(real)'],
    a: [0],
    e: 'La clase Assert (areEqual, isTrue, isNotNull, fail...) es la opción moderna; System.assertEquals sigue siendo válida. Un test sin asserts no verifica nada.'
  },
  {
    s: 'test', t: 'Asserts',
    q: 'Se quiere probar que un método lanza una excepción con datos inválidos. ¿Qué patrón es correcto?',
    c: "try {\n  Servicio.procesar(null);\n  Assert.fail('Se esperaba una excepción');\n} catch (Servicio.DatosException e) {\n  Assert.isTrue(e.getMessage().contains('inválido'));\n}",
    o: [
      'Es correcto: falla si no se lanza la excepción y comprueba el mensaje',
      'Es incorrecto: no se pueden capturar excepciones en tests',
      'Es incorrecto: hay que usar @isTest(expected=Exception.class)',
      'Es incorrecto: Assert.fail no existe'
    ],
    a: [0],
    e: 'Probar escenarios negativos es una buena práctica: positivo, negativo, bulk (200 registros) y de usuario restringido.'
  },
  {
    s: 'test', t: 'Clases de test',
    q: '¿Qué afirmaciones sobre las clases anotadas con @isTest son correctas? (Elige 2)',
    o: [
      'No cuentan para el límite de tamaño de código Apex de la org',
      'Pueden ser private o public',
      'Cuentan como código a cubrir para el 75 %',
      'Deben declararse global'
    ],
    a: [0, 1],
    e: 'Las clases @isTest no cuentan para el límite de 6 MB de código ni para la cobertura. Una clase "TestDataFactory" pública con @isTest puede reutilizarse desde otros tests.'
  },
  {
    s: 'test', t: 'Test',
    q: '¿Qué ocurre con los registros creados durante la ejecución de un test?',
    o: ['Se confirman en la org', 'Se revierten automáticamente al terminar el test', 'Se envían a la papelera', 'Se quedan hasta que se ejecuta otro test'],
    a: [1],
    e: 'Los tests no confirman cambios: todo se revierte al finalizar, por eso no hace falta limpiar los datos.'
  },
  {
    s: 'test', t: 'Debug',
    q: 'Un desarrollador necesita capturar logs de un usuario de integración durante las próximas horas. ¿Qué debe configurar?',
    o: ['Un trace flag para ese usuario con un debug level', 'Un checkpoint en el Developer Console', 'Un email de excepción', 'Nada, los logs se guardan siempre'],
    a: [0],
    e: 'En Setup > Debug Logs se crea un trace flag (usuario, clase o trigger) con un debug level y una fecha de caducidad. Los logs solo se generan mientras el trace flag está activo.'
  },
  {
    s: 'test', t: 'Debug',
    q: '¿Qué herramienta del Developer Console permite ver qué parte de la transacción consumió más tiempo?',
    o: ['Log Inspector: Execution Overview / Timeline', 'Query Editor', 'Checkpoints Inspector solo', 'Anonymous Apex'],
    a: [0],
    e: 'El Log Inspector muestra el Execution Tree, Stack, Execution Overview (tiempos por unidad, límites) y Timeline.'
  },
  {
    s: 'test', t: 'Debug',
    q: '¿Qué categorías de log se pueden ajustar en un debug level? (Elige 2)',
    o: ['Apex Code y Database', 'Workflow y Validation', 'CSS y HTML', 'Network y Browser'],
    a: [0, 1],
    e: 'Categorías: Database, Workflow, NBA, Validation, Callouts, Apex Code, Apex Profiling, Visualforce, System y Wave. Niveles: NONE, ERROR, WARN, INFO, DEBUG, FINE, FINER, FINEST.'
  },
  {
    s: 'test', t: 'Debug',
    q: 'Se quiere inspeccionar el estado de variables en un punto concreto de la ejecución sin añadir System.debug. ¿Qué herramienta ofrece esto desde VS Code usando un log?',
    o: ['Apex Replay Debugger', 'Data Loader', 'Workbench REST Explorer', 'Schema Builder'],
    a: [0],
    e: 'Apex Replay Debugger (extensión de Salesforce para VS Code) reproduce un debug log con breakpoints e inspección de variables. En Developer Console existen los checkpoints (hasta 5).'
  },
  {
    s: 'test', t: 'Debug',
    q: '¿Qué afirmación sobre Execute Anonymous Apex es correcta?',
    o: [
      'Las DML se confirman si la ejecución termina sin errores',
      'Siempre hace rollback de los cambios',
      'Se ejecuta como usuario de sistema ignorando todos los permisos',
      'Solo puede ejecutarse en sandboxes'
    ],
    a: [0],
    e: 'Anonymous Apex se ejecuta como el usuario actual y sus cambios se confirman. Útil para scripts puntuales y para probar código, con cuidado en producción.'
  },
  {
    s: 'test', t: 'Debug',
    q: '¿Cómo puede el código comprobar cuántas consultas SOQL lleva consumidas en la transacción?',
    o: ['Limits.getQueries() y Limits.getLimitQueries()', 'System.getQueryCount()', 'Database.countQueries()', 'No es posible'],
    a: [0],
    e: 'La clase Limits expone el consumo actual (getX) y el máximo (getLimitX) de SOQL, DML, CPU, heap, etc.'
  },
  {
    s: 'test', t: 'Entornos',
    q: 'Un equipo necesita un sandbox con una copia completa de datos y metadatos de producción para pruebas de rendimiento. ¿Cuál elegir?',
    o: ['Developer', 'Developer Pro', 'Partial Copy', 'Full'],
    a: [3],
    e: 'Full: todos los datos y metadatos (refresh cada 29 días). Partial Copy: metadatos + muestra de datos (5 GB, refresh 5 días). Developer (200 MB) y Developer Pro (1 GB): solo metadatos, refresh diario.'
  },
  {
    s: 'test', t: 'Entornos',
    q: '¿Qué afirmaciones sobre los scratch orgs son correctas? (Elige 2)',
    o: [
      'Se crean desde una Dev Hub con Salesforce CLI',
      'Son temporales (hasta 30 días) y orientados a desarrollo basado en código fuente',
      'Contienen una copia de los datos de producción',
      'Se crean con change sets'
    ],
    a: [0, 1],
    e: 'Los scratch orgs son entornos efímeros, configurables por un fichero de definición, ideales para CI y package development. No copian datos de producción.'
  },
  {
    s: 'test', t: 'Despliegue',
    q: '¿Qué requisito tienen los change sets?',
    o: [
      'Solo se usan entre orgs relacionadas (p. ej. producción y sus sandboxes) con una deployment connection autorizada',
      'Funcionan entre cualquier par de orgs',
      'Permiten eliminar componentes en el destino',
      'Despliegan también los datos'
    ],
    a: [0],
    e: 'Los change sets requieren orgs conectadas y una conexión de despliegue que permita inbound changes. No despliegan datos ni permiten borrar componentes (para eso: Metadata API/CLI con destructiveChanges).'
  },
  {
    s: 'test', t: 'Despliegue',
    q: '¿Qué herramientas permiten desplegar metadatos entre orgs NO relacionadas? (Elige 2)',
    o: ['Salesforce CLI (Metadata API)', 'Paquetes (unmanaged/unlocked/managed)', 'Change sets', 'Data Loader'],
    a: [0, 1],
    e: 'Salesforce CLI (sf project deploy), el Metadata API y los paquetes funcionan entre cualquier org. Data Loader mueve datos, no metadatos.'
  },
  {
    s: 'test', t: 'Despliegue',
    q: 'Un despliegue a producción se validó con éxito ayer (tests incluidos). ¿Qué opción permite desplegarlo sin volver a ejecutar los tests?',
    o: ['Quick Deploy', 'Run All Tests', 'Deploy con SeeAllData', 'Un nuevo change set'],
    a: [0],
    e: 'Quick Deploy usa una validación reciente (últimos 10 días) con tests exitosos para desplegar sin ejecutarlos de nuevo.'
  },
  {
    s: 'test', t: 'Despliegue',
    q: 'Al desplegar a producción se quiere ejecutar solo un subconjunto de tests. ¿Qué nivel de test se usa y qué debe cumplirse?',
    o: [
      'RunSpecifiedTests; los tests indicados deben cubrir al menos el 75 % de cada clase y trigger desplegado',
      'NoTestRun; sin requisitos',
      'RunLocalTests; solo se ejecutan los tests del paquete',
      'RunAllTestsInOrg; es obligatorio siempre'
    ],
    a: [0],
    e: 'Con RunSpecifiedTests la cobertura se calcula por componente desplegado (≥ 75 % cada uno). Por defecto en producción se usa RunLocalTests cuando hay Apex.'
  },
  {
    s: 'test', t: 'Despliegue',
    q: '¿Qué herramienta de Salesforce ofrece una interfaz declarativa para gestionar cambios con control de versiones (GitHub) y pipelines?',
    o: ['DevOps Center', 'Schema Builder', 'Data Import Wizard', 'Setup Audit Trail'],
    a: [0],
    e: 'DevOps Center gestiona work items, rastrea cambios en metadatos y los promueve por un pipeline apoyado en un repositorio de control de versiones.'
  },
  {
    s: 'test', t: 'Test',
    q: 'Un trigger debe probarse correctamente. ¿Qué escenario es imprescindible además del caso positivo?',
    o: [
      'Un caso bulk que inserte/actualice 200 registros para validar la bulkificación',
      'Un test que use SeeAllData=true',
      'Un test sin asserts para aumentar la cobertura',
      'Un test que desactive el trigger'
    ],
    a: [0],
    e: 'Probar con 200 registros verifica que el trigger no supera límites (SOQL/DML en bucles). También conviene probar casos negativos y usuarios con permisos restringidos.'
  },
  {
    s: 'test', t: 'Test',
    q: '¿Qué método permite saber si el código se está ejecutando en un contexto de test?',
    o: ['Test.isRunningTest()', 'System.isTest()', 'UserInfo.isTest()', 'Limits.isTest()'],
    a: [0],
    e: 'Test.isRunningTest() devuelve true dentro de tests. Se debe usar con moderación: los mocks (HttpCalloutMock, Stub API) son preferibles.'
  }
);
