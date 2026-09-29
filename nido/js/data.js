/* ==========================================================================
   Nido · Datos de referencia
   Tablas estáticas: curvas OMS, catálogo BLW, alérgenos, vacunas, hitos,
   dientes y ventanas de sueño. Nada de aquí depende del estado de la app.
   ========================================================================== */
(function (N) {
  'use strict';

  /* ---------- Patrones de crecimiento OMS (0–24 meses) ------------------
     Cada fila: [L, M, S] por mes cumplido. Fuente: WHO Child Growth
     Standards (2006), tablas LMS mensuales. Longitud y perímetro tienen L=1. */
  const L1 = (rows) => rows.map(([m, s]) => [1, m, s]);

  N.WHO = {
    weight: {
      f: [
        [0.3809, 3.2322, 0.14171], [0.1714, 4.1873, 0.13724], [0.0962, 5.1282, 0.13000],
        [0.0402, 5.8458, 0.12619], [-0.0050, 6.4237, 0.12402], [-0.0430, 6.8985, 0.12274],
        [-0.0756, 7.2970, 0.12204], [-0.1039, 7.6422, 0.12178], [-0.1288, 7.9487, 0.12181],
        [-0.1507, 8.2254, 0.12199], [-0.1700, 8.4800, 0.12223], [-0.1872, 8.7192, 0.12247],
        [-0.2024, 8.9481, 0.12268], [-0.2158, 9.1699, 0.12283], [-0.2278, 9.3870, 0.12294],
        [-0.2384, 9.6008, 0.12299], [-0.2478, 9.8124, 0.12303], [-0.2562, 10.0226, 0.12306],
        [-0.2637, 10.2315, 0.12309], [-0.2703, 10.4393, 0.12315], [-0.2762, 10.6464, 0.12323],
        [-0.2815, 10.8534, 0.12335], [-0.2862, 11.0608, 0.12350], [-0.2903, 11.2688, 0.12369],
        [-0.2941, 11.4775, 0.12390]
      ],
      m: [
        [0.3487, 3.3464, 0.14602], [0.2297, 4.4709, 0.13395], [0.1970, 5.5675, 0.12385],
        [0.1738, 6.3762, 0.11727], [0.1553, 7.0023, 0.11316], [0.1395, 7.5105, 0.11080],
        [0.1257, 7.9340, 0.10958], [0.1134, 8.2970, 0.10902], [0.1021, 8.6151, 0.10882],
        [0.0917, 8.9014, 0.10881], [0.0820, 9.1649, 0.10891], [0.0730, 9.4122, 0.10906],
        [0.0644, 9.6479, 0.10925], [0.0563, 9.8749, 0.10949], [0.0487, 10.0953, 0.10976],
        [0.0413, 10.3108, 0.11007], [0.0343, 10.5228, 0.11041], [0.0275, 10.7319, 0.11079],
        [0.0211, 10.9385, 0.11119], [0.0148, 11.1430, 0.11164], [0.0087, 11.3462, 0.11211],
        [0.0029, 11.5486, 0.11261], [-0.0028, 11.7504, 0.11314], [-0.0083, 11.9514, 0.11369],
        [-0.0137, 12.1515, 0.11426]
      ]
    },
    length: {
      f: L1([
        [49.1477, 0.03790], [53.6872, 0.03640], [57.0673, 0.03568], [59.8029, 0.03520],
        [62.0899, 0.03486], [64.0301, 0.03463], [65.7311, 0.03448], [67.2873, 0.03441],
        [68.7498, 0.03440], [70.1435, 0.03444], [71.4818, 0.03452], [72.7710, 0.03464],
        [74.0150, 0.03479], [75.2176, 0.03496], [76.3817, 0.03514], [77.5099, 0.03534],
        [78.6055, 0.03555], [79.6710, 0.03576], [80.7079, 0.03598], [81.7182, 0.03620],
        [82.7036, 0.03643], [83.6654, 0.03666], [84.6040, 0.03688], [85.5202, 0.03711],
        [86.4153, 0.03734]
      ]),
      m: L1([
        [49.8842, 0.03795], [54.7244, 0.03557], [58.4249, 0.03424], [61.4292, 0.03328],
        [63.8860, 0.03257], [65.9026, 0.03204], [67.6236, 0.03165], [69.1645, 0.03139],
        [70.5994, 0.03124], [71.9687, 0.03117], [73.2812, 0.03118], [74.5388, 0.03125],
        [75.7488, 0.03137], [76.9186, 0.03154], [78.0497, 0.03174], [79.1458, 0.03197],
        [80.2113, 0.03222], [81.2487, 0.03250], [82.2587, 0.03279], [83.2418, 0.03310],
        [84.1996, 0.03342], [85.1348, 0.03376], [86.0477, 0.03410], [86.9410, 0.03445],
        [87.8161, 0.03479]
      ])
    },
    head: {
      f: L1([
        [33.8787, 0.03496], [36.5463, 0.03210], [38.2521, 0.03168], [39.5328, 0.03140],
        [40.5817, 0.03119], [41.4590, 0.03102], [42.1995, 0.03087], [42.8290, 0.03075],
        [43.3671, 0.03063], [43.8300, 0.03053], [44.2319, 0.03044], [44.5844, 0.03035],
        [44.8965, 0.03027], [45.1752, 0.03019], [45.4265, 0.03012], [45.6551, 0.03006],
        [45.8650, 0.02999], [46.0598, 0.02993], [46.2424, 0.02987], [46.4152, 0.02982],
        [46.5801, 0.02977], [46.7384, 0.02972], [46.8913, 0.02967], [47.0391, 0.02962],
        [47.1822, 0.02957]
      ]),
      m: L1([
        [34.4618, 0.03686], [37.2759, 0.03133], [39.1285, 0.02997], [40.5135, 0.02918],
        [41.6317, 0.02868], [42.5576, 0.02837], [43.3306, 0.02817], [43.9803, 0.02804],
        [44.5300, 0.02796], [44.9998, 0.02792], [45.4051, 0.02790], [45.7573, 0.02789],
        [46.0661, 0.02789], [46.3395, 0.02789], [46.5844, 0.02791], [46.8060, 0.02792],
        [47.0088, 0.02795], [47.1962, 0.02797], [47.3711, 0.02800], [47.5357, 0.02803],
        [47.6919, 0.02806], [47.8408, 0.02810], [47.9833, 0.02813], [48.1201, 0.02817],
        [48.2515, 0.02821]
      ])
    }
  };

  N.METRICS = {
    weight: { label: 'Peso', unit: 'kg', short: 'Peso', digits: 2 },
    length: { label: 'Longitud', unit: 'cm', short: 'Talla', digits: 1 },
    head: { label: 'Perímetro craneal', unit: 'cm', short: 'P. craneal', digits: 1 }
  };

  /* ---------- Alérgenos (los 14 de declaración obligatoria en la UE,
     reducidos a los relevantes en alimentación complementaria) ---------- */
  N.ALLERGENS = [
    { id: 'huevo', name: 'Huevo', emoji: '🥚' },
    { id: 'leche', name: 'Leche de vaca', emoji: '🥛' },
    { id: 'gluten', name: 'Gluten (trigo)', emoji: '🌾' },
    { id: 'cacahuete', name: 'Cacahuete', emoji: '🥜' },
    { id: 'frutos_secos', name: 'Frutos secos', emoji: '🌰' },
    { id: 'pescado', name: 'Pescado', emoji: '🐟' },
    { id: 'marisco', name: 'Marisco', emoji: '🦐' },
    { id: 'soja', name: 'Soja', emoji: '🫘' },
    { id: 'sesamo', name: 'Sésamo', emoji: '⚪' }
  ];

  /* ---------- Catálogo BLW -----------------------------------------------
     c: categoría · col: color (arcoíris semanal) · a: alérgeno
     r: riesgo de atragantamiento (requiere preparación) · s6/s9: cómo ofrecerlo
     fe: fuente de hierro (2 = hierro hemo, muy absorbible; 1 = vegetal)
     vc: rico en vitamina C (ayuda a absorber el hierro vegetal) */
  const F = (id, name, emoji, c, col, s6, s9, extra) =>
    Object.assign({ id, name, emoji, c, col, s6, s9 }, extra || {});

  N.FOOD_CATS = {
    fruta: { name: 'Frutas', color: 'var(--c-feed)' },
    verdura: { name: 'Verduras', color: 'var(--c-blw)' },
    proteina: { name: 'Proteínas', color: 'var(--c-health)' },
    cereal: { name: 'Cereales', color: 'var(--c-mile)' },
    legumbre: { name: 'Legumbres', color: 'var(--c-growth)' },
    lacteo: { name: 'Lácteos', color: 'var(--c-sleep)' },
    grasa: { name: 'Grasas y semillas', color: 'var(--ink-3)' }
  };

  N.RAINBOW = {
    rojo: { name: 'Rojo', hex: '#E2504A' },
    naranja: { name: 'Naranja', hex: '#F2913D' },
    amarillo: { name: 'Amarillo', hex: '#EFC23A' },
    verde: { name: 'Verde', hex: '#57A85A' },
    morado: { name: 'Morado', hex: '#7E57C2' },
    blanco: { name: 'Blanco / beige', hex: '#D9CBB5' },
    marron: { name: 'Marrón', hex: '#8D6748' }
  };

  N.FOODS = [
    // Frutas
    F('platano', 'Plátano', '🍌', 'fruta', 'amarillo', 'Medio plátano con parte de piel como mango', 'Rodajas o trozos pequeños para pinza'),
    F('aguacate', 'Aguacate', '🥑', 'fruta', 'verde', 'Tiras gruesas, rebozadas en coco o avena si resbala', 'Dados blandos'),
    F('manzana', 'Manzana', '🍎', 'fruta', 'rojo', 'Solo cocida o asada en gajos (cruda es de riesgo)', 'Rallada cruda o cocida en dados', { r: true }),
    F('pera', 'Pera', '🍐', 'fruta', 'verde', 'Madura en gajos gruesos; si está dura, cocida', 'Dados blandos'),
    F('mango', 'Mango', '🥭', 'fruta', 'naranja', 'Hueso con algo de pulpa o tiras gruesas', 'Dados', { vc: true }),
    F('fresa', 'Fresa', '🍓', 'fruta', 'rojo', 'Grande entera o aplastada', 'Cortada en cuartos', { vc: true }),
    F('arandanos', 'Arándanos', '🫐', 'fruta', 'morado', 'Aplastados con el dedo', 'Aplastados o cortados por la mitad', { r: true }),
    F('uva', 'Uva', '🍇', 'fruta', 'morado', 'Cortada a lo largo en cuartos, sin pepitas', 'Siempre en cuartos a lo largo', { r: true }),
    F('sandia', 'Sandía', '🍉', 'fruta', 'rojo', 'Triángulos gruesos sin pepitas', 'Dados sin pepitas', { vc: true }),
    F('melon', 'Melón', '🍈', 'fruta', 'verde', 'Tiras gruesas con piel como mango', 'Dados', { vc: true }),
    F('melocoton', 'Melocotón', '🍑', 'fruta', 'naranja', 'Mitad sin hueso, muy madura', 'Gajos finos', { vc: true }),
    F('kiwi', 'Kiwi', '🥝', 'fruta', 'verde', 'Mitad pelada o gajos gruesos', 'Dados', { vc: true }),
    F('naranja', 'Naranja', '🍊', 'fruta', 'naranja', 'Gajo sin membrana ni pepitas', 'Trocitos de gajo', { vc: true }),
    F('ciruela', 'Ciruela', '🟣', 'fruta', 'morado', 'Mitad sin hueso, madura', 'Cuartos'),
    F('higo', 'Higo', '🟤', 'fruta', 'morado', 'Abierto por la mitad', 'Trozos'),
    F('papaya', 'Papaya', '🧡', 'fruta', 'naranja', 'Tiras gruesas', 'Dados', { vc: true }),
    F('frambuesa', 'Frambuesa', '🔴', 'fruta', 'rojo', 'Aplastada', 'Entera o a mitades', { vc: true }),
    F('cereza', 'Cereza', '🍒', 'fruta', 'rojo', 'Sin hueso y en cuartos', 'Sin hueso y en cuartos', { r: true }),
    // Verduras
    F('brocoli', 'Brócoli', '🥦', 'verdura', 'verde', 'Arbolito al vapor con tallo como mango', 'Ramilletes pequeños', { vc: true }),
    F('zanahoria', 'Zanahoria', '🥕', 'verdura', 'naranja', 'Bastones cocidos muy blandos (cruda no)', 'Rodajas cocidas o rallada', { r: true }),
    F('boniato', 'Boniato', '🍠', 'verdura', 'naranja', 'Bastones asados', 'Dados asados o puré'),
    F('calabacin', 'Calabacín', '🥒', 'verdura', 'verde', 'Bastones al vapor con piel', 'Medias lunas', { vc: true }),
    F('calabaza', 'Calabaza', '🎃', 'verdura', 'naranja', 'Gajos asados', 'Dados asados'),
    F('patata', 'Patata', '🥔', 'verdura', 'blanco', 'Gajos cocidos o asados', 'Dados'),
    F('coliflor', 'Coliflor', '🤍', 'verdura', 'blanco', 'Ramillete grande al vapor', 'Ramilletes pequeños', { vc: true }),
    F('judia_verde', 'Judía verde', '🫛', 'verdura', 'verde', 'Enteras, cocidas muy tiernas', 'Trocitos'),
    F('guisantes', 'Guisantes', '🟢', 'verdura', 'verde', 'Aplastados', 'Aplastados o enteros para pinza', { r: true }),
    F('tomate', 'Tomate', '🍅', 'verdura', 'rojo', 'Gajos grandes sin piel dura', 'Cherry en cuartos', { r: true, vc: true }),
    F('pimiento', 'Pimiento rojo', '🫑', 'verdura', 'rojo', 'Tiras asadas sin piel', 'Tiras finas asadas', { vc: true }),
    F('berenjena', 'Berenjena', '🍆', 'verdura', 'morado', 'Tiras asadas', 'Dados asados'),
    F('remolacha', 'Remolacha', '🟥', 'verdura', 'morado', 'Gajos cocidos', 'Dados o rallada'),
    F('espinaca', 'Espinaca', '🌿', 'verdura', 'verde', 'Cocida, mezclada en tortilla o croqueta', 'Salteada picada', { note: 'Nitratos: evitar grandes cantidades antes de 1 año', fe: 1 }),
    F('champinon', 'Champiñón', '🍄', 'verdura', 'marron', 'Laminado grueso y salteado', 'Picado'),
    F('puerro', 'Puerro', '🧅', 'verdura', 'blanco', 'En cremas o guisos', 'Picado'),
    F('maiz', 'Maíz', '🌽', 'verdura', 'amarillo', 'Mazorca cocida para roer', 'Granos aplastados', { r: true }),
    F('esparrago', 'Espárrago', '🌱', 'verdura', 'verde', 'Enteros al vapor', 'Trozos', { vc: true }),
    // Proteínas
    F('huevo', 'Huevo', '🥚', 'proteina', 'amarillo', 'Tortilla en tiras o huevo duro en cuartos', 'Revuelto', { a: 'huevo', fe: 1 }),
    F('pollo', 'Pollo', '🍗', 'proteina', 'blanco', 'Muslo en tiras o hueso grande con carne', 'Desmenuzado', { fe: 2 }),
    F('pavo', 'Pavo', '🦃', 'proteina', 'blanco', 'Albóndigas o tiras', 'Desmenuzado', { fe: 2 }),
    F('ternera', 'Ternera', '🥩', 'proteina', 'marron', 'Tira grande para chupar o albóndigas', 'Picada', { fe: 2 }),
    F('cerdo', 'Cerdo (lomo)', '🐖', 'proteina', 'blanco', 'Tiras tiernas', 'Desmenuzado', { fe: 2 }),
    F('cordero', 'Cordero', '🐑', 'proteina', 'marron', 'Costilla para roer', 'Desmenuzado', { fe: 2 }),
    F('merluza', 'Merluza', '🐟', 'proteina', 'blanco', 'Lomos sin espinas en láminas', 'Desmigada', { a: 'pescado', fe: 2 }),
    F('salmon', 'Salmón', '🍣', 'proteina', 'naranja', 'Láminas sin espinas', 'Desmigado', { a: 'pescado', fe: 2 }),
    F('sardina', 'Sardina', '🐠', 'proteina', 'marron', 'Sin espinas en tostada', 'Aplastada', { a: 'pescado', fe: 2 }),
    F('bacalao', 'Bacalao', '🎣', 'proteina', 'blanco', 'Desalado, en láminas', 'Desmigado', { a: 'pescado', fe: 2 }),
    F('gamba', 'Gamba', '🦐', 'proteina', 'rojo', 'Picada en tortilla', 'Trocitos', { a: 'marisco', fe: 2 }),
    F('tofu', 'Tofu', '🧊', 'proteina', 'blanco', 'Bastones firmes a la plancha', 'Dados', { a: 'soja', fe: 1 }),
    // Legumbres
    F('lentejas', 'Lentejas', '🟫', 'legumbre', 'marron', 'Hamburguesita o bien cocidas para cuchara precargada', 'Guiso con pinza', { fe: 1 }),
    F('garbanzos', 'Garbanzos', '🟡', 'legumbre', 'amarillo', 'Hummus en tostada o aplastados', 'Aplastados', { r: true, fe: 1 }),
    F('alubias', 'Alubias', '⚫', 'legumbre', 'blanco', 'Aplastadas', 'Enteras blandas', { fe: 1 }),
    F('edamame', 'Edamame', '🫛', 'legumbre', 'verde', 'Aplastado', 'Aplastado', { a: 'soja', r: true, fe: 1 }),
    F('hummus', 'Hummus', '🥣', 'legumbre', 'blanco', 'Untado en tostada o palito', 'Para mojar', { a: 'sesamo', fe: 1 }),
    // Cereales
    F('pan', 'Pan', '🍞', 'cereal', 'marron', 'Tostada en tiras con untable', 'Trozos', { a: 'gluten' }),
    F('pasta', 'Pasta', '🍝', 'cereal', 'blanco', 'Fusilli o macarrón grande', 'Formas pequeñas', { a: 'gluten' }),
    F('arroz', 'Arroz', '🍚', 'cereal', 'blanco', 'Bolitas de arroz pegajoso', 'Suelto con cuchara'),
    F('avena', 'Avena', '🥣', 'cereal', 'blanco', 'Porridge espeso o tortitas', 'Porridge con fruta', { a: 'gluten', note: 'Puede contener trazas de gluten', fe: 1 }),
    F('quinoa', 'Quinoa', '🌾', 'cereal', 'blanco', 'Bolitas o mezclada con aguacate', 'Suelta', { fe: 1 }),
    F('cuscus', 'Cuscús', '🫓', 'cereal', 'amarillo', 'Bolitas', 'Suelto', { a: 'gluten' }),
    F('mijo', 'Mijo', '🌻', 'cereal', 'amarillo', 'Croquetitas', 'Suelto', { fe: 1 }),
    F('tortita_maiz', 'Tortita de maíz', '🫔', 'cereal', 'amarillo', 'En tiras', 'Trozos'),
    // Lácteos
    F('yogur', 'Yogur natural', '🥛', 'lacteo', 'blanco', 'Cuchara precargada, entero sin azúcar', 'Con fruta', { a: 'leche' }),
    F('queso_fresco', 'Queso fresco', '🧀', 'lacteo', 'blanco', 'Bastones de queso pasteurizado', 'Dados', { a: 'leche' }),
    F('requeson', 'Requesón', '🍶', 'lacteo', 'blanco', 'Cuchara precargada', 'Untado', { a: 'leche' }),
    F('mantequilla', 'Mantequilla', '🧈', 'lacteo', 'amarillo', 'Para cocinar o untar', 'Para cocinar o untar', { a: 'leche' }),
    // Grasas y semillas
    F('aceite_oliva', 'Aceite de oliva', '🫒', 'grasa', 'verde', 'En crudo sobre cualquier plato', 'En crudo'),
    F('cacahuete', 'Crema de cacahuete', '🥜', 'grasa', 'marron', 'Muy fina, diluida en yogur o fruta (nunca entero)', 'Untada fina', { a: 'cacahuete', r: true, fe: 1 }),
    F('almendra', 'Almendra molida', '🌰', 'grasa', 'marron', 'Molida en porridge o crema (nunca entera)', 'Molida', { a: 'frutos_secos', r: true, fe: 1 }),
    F('nuez', 'Nuez molida', '🥮', 'grasa', 'marron', 'Molida (nunca entera)', 'Molida', { a: 'frutos_secos', r: true }),
    F('tahini', 'Tahini', '⚪', 'grasa', 'blanco', 'Diluido en yogur o hummus', 'Untado', { a: 'sesamo', fe: 1 }),
    F('chia', 'Chía', '⚫', 'grasa', 'marron', 'Hidratada, en porridge', 'En yogur', { fe: 1 })
  ];
  N.FOOD_BY_ID = Object.fromEntries(N.FOODS.map((f) => [f.id, f]));

  N.MEAL_TYPES = [
    { id: 'desayuno', name: 'Desayuno' },
    { id: 'comida', name: 'Comida' },
    { id: 'merienda', name: 'Merienda' },
    { id: 'cena', name: 'Cena' }
  ];

  N.EAT_AMOUNT = ['Solo jugó', 'Probó', 'Comió algo', 'Comió bien'];
  N.REACTIONS = {
    none: { name: 'Sin reacción', tone: 'good' },
    mild: { name: 'Leve (rojez, sarpullido)', tone: 'warn' },
    strong: { name: 'Importante (vómito, habones, hinchazón)', tone: 'crit' }
  };

  /* ---------- Calendario vacunal ----------------------------------------
     Calendario común de vacunación a lo largo de toda la vida, España 2025
     (Consejo Interterritorial del SNS). Orientativo: cada comunidad
     autónoma puede introducir variaciones. */
  N.VACCINES = [
    { id: 'vrs', m: 0, name: 'Nirsevimab (VRS)', detail: 'Anticuerpo contra el virus respiratorio sincitial. Al nacer o al inicio de la temporada.' },
    { id: 'hexa1', m: 2, name: 'Hexavalente · 1ª dosis', detail: 'Difteria, tétanos, tosferina, polio, Hib y hepatitis B.' },
    { id: 'vnc1', m: 2, name: 'Neumococo · 1ª dosis', detail: 'Vacuna conjugada frente a neumococo.' },
    { id: 'menb1', m: 2, name: 'Meningococo B · 1ª dosis', detail: '' },
    { id: 'rota1', m: 2, name: 'Rotavirus · 1ª dosis', detail: 'Oral.' },
    { id: 'hexa2', m: 4, name: 'Hexavalente · 2ª dosis', detail: '' },
    { id: 'vnc2', m: 4, name: 'Neumococo · 2ª dosis', detail: '' },
    { id: 'menb2', m: 4, name: 'Meningococo B · 2ª dosis', detail: '' },
    { id: 'menc1', m: 4, name: 'Meningococo C · 1ª dosis', detail: 'Algunas comunidades usan MenACWY.' },
    { id: 'rota2', m: 4, name: 'Rotavirus · 2ª dosis', detail: 'Oral.' },
    { id: 'gripe', m: 6, name: 'Gripe (campaña)', detail: 'De 6 a 59 meses, en temporada de otoño‑invierno.' },
    { id: 'hexa3', m: 11, name: 'Hexavalente · 3ª dosis', detail: '' },
    { id: 'vnc3', m: 11, name: 'Neumococo · 3ª dosis', detail: '' },
    { id: 'srp1', m: 12, name: 'Triple vírica · 1ª dosis', detail: 'Sarampión, rubeola y parotiditis.' },
    { id: 'menacwy', m: 12, name: 'Meningococo ACWY', detail: '' },
    { id: 'menb3', m: 12, name: 'Meningococo B · 3ª dosis', detail: '' },
    { id: 'var1', m: 15, name: 'Varicela · 1ª dosis', detail: '' },
    { id: 'srpv', m: 36, name: 'Triple vírica + varicela', detail: 'Entre los 3 y 4 años.' }
  ];

  /* ---------- Revisiones del Programa de Salud Infantil (orientativo) --- */
  N.CHECKUPS = [
    { m: 0.25, name: 'Primera visita (3‑5 días)' }, { m: 0.5, name: 'Revisión 15 días' },
    { m: 1, name: 'Revisión 1 mes' }, { m: 2, name: 'Revisión 2 meses' },
    { m: 4, name: 'Revisión 4 meses' }, { m: 6, name: 'Revisión 6 meses' },
    { m: 9, name: 'Revisión 9 meses' }, { m: 12, name: 'Revisión 12 meses' },
    { m: 15, name: 'Revisión 15 meses' }, { m: 18, name: 'Revisión 18 meses' },
    { m: 24, name: 'Revisión 2 años' }
  ];

  N.APPT_TYPES = {
    revision: { name: 'Revisión', color: 'var(--c-growth)' },
    vacuna: { name: 'Vacunación', color: 'var(--c-health)' },
    especialista: { name: 'Especialista', color: 'var(--c-sleep)' },
    urgencia: { name: 'Urgencias', color: 'var(--crit)' },
    otro: { name: 'Otro', color: 'var(--ink-3)' }
  };

  /* ---------- Hitos del desarrollo (rango típico en meses) -------------- */
  N.MILESTONES = [
    { id: 'mira', area: 'social', name: 'Fija la mirada en caras', from: 0, to: 2 },
    { id: 'sonrisa', area: 'social', name: 'Sonrisa social', from: 1, to: 3 },
    { id: 'cabeza', area: 'motor', name: 'Sostiene la cabeza', from: 2, to: 4 },
    { id: 'gorjeo', area: 'lenguaje', name: 'Gorjea y hace sonidos', from: 2, to: 4 },
    { id: 'manos', area: 'motor', name: 'Se lleva las manos a la boca', from: 2, to: 4 },
    { id: 'risa', area: 'social', name: 'Se ríe a carcajadas', from: 3, to: 5 },
    { id: 'agarra', area: 'motor', name: 'Agarra objetos', from: 3, to: 5 },
    { id: 'volteo', area: 'motor', name: 'Se da la vuelta', from: 4, to: 6 },
    { id: 'sentado_apoyo', area: 'motor', name: 'Se sienta con apoyo', from: 4, to: 6 },
    { id: 'balbuceo', area: 'lenguaje', name: 'Balbucea (ba‑ba, ma‑ma)', from: 5, to: 8 },
    { id: 'nombre', area: 'social', name: 'Responde a su nombre', from: 5, to: 9 },
    { id: 'sentado', area: 'motor', name: 'Se sienta sin apoyo', from: 5, to: 9 },
    { id: 'cambia_mano', area: 'motor', name: 'Pasa objetos de una mano a otra', from: 5, to: 8 },
    { id: 'extranos', area: 'social', name: 'Reconoce a extraños', from: 6, to: 9 },
    { id: 'gateo', area: 'motor', name: 'Gatea o se arrastra', from: 7, to: 11 },
    { id: 'pinza', area: 'motor', name: 'Hace la pinza', from: 8, to: 11 },
    { id: 'de_pie', area: 'motor', name: 'Se pone de pie con apoyo', from: 8, to: 12 },
    { id: 'adios', area: 'social', name: 'Dice adiós con la mano', from: 9, to: 13 },
    { id: 'palabra', area: 'lenguaje', name: 'Primera palabra con sentido', from: 10, to: 15 },
    { id: 'pasos', area: 'motor', name: 'Primeros pasos solo', from: 11, to: 16 },
    { id: 'senala', area: 'lenguaje', name: 'Señala lo que quiere', from: 12, to: 16 },
    { id: 'cuchara', area: 'motor', name: 'Come solo con cuchara', from: 15, to: 20 },
    { id: 'frases', area: 'lenguaje', name: 'Frases de dos palabras', from: 18, to: 26 }
  ];
  N.MILESTONE_AREAS = {
    motor: { name: 'Motor', color: 'var(--c-growth)' },
    social: { name: 'Social', color: 'var(--c-feed)' },
    lenguaje: { name: 'Lenguaje', color: 'var(--c-sleep)' }
  };

  /* ---------- Dientes de leche (notación FDI) ---------------------------
     Orden de la arcada de derecha a izquierda del bebé, tal y como se ve
     al mirarle de frente. m: erupción típica en meses. */
  N.TEETH = {
    upper: [
      { id: '55', name: '2º molar sup. dcho.', m: '25‑33' }, { id: '54', name: '1er molar sup. dcho.', m: '13‑19' },
      { id: '53', name: 'Canino sup. dcho.', m: '16‑22' }, { id: '52', name: 'Incisivo lateral sup. dcho.', m: '9‑13' },
      { id: '51', name: 'Incisivo central sup. dcho.', m: '8‑12' }, { id: '61', name: 'Incisivo central sup. izq.', m: '8‑12' },
      { id: '62', name: 'Incisivo lateral sup. izq.', m: '9‑13' }, { id: '63', name: 'Canino sup. izq.', m: '16‑22' },
      { id: '64', name: '1er molar sup. izq.', m: '13‑19' }, { id: '65', name: '2º molar sup. izq.', m: '25‑33' }
    ],
    lower: [
      { id: '85', name: '2º molar inf. dcho.', m: '23‑31' }, { id: '84', name: '1er molar inf. dcho.', m: '14‑18' },
      { id: '83', name: 'Canino inf. dcho.', m: '17‑23' }, { id: '82', name: 'Incisivo lateral inf. dcho.', m: '10‑16' },
      { id: '81', name: 'Incisivo central inf. dcho.', m: '6‑10' }, { id: '71', name: 'Incisivo central inf. izq.', m: '6‑10' },
      { id: '72', name: 'Incisivo lateral inf. izq.', m: '10‑16' }, { id: '73', name: 'Canino inf. izq.', m: '17‑23' },
      { id: '74', name: '1er molar inf. izq.', m: '14‑18' }, { id: '75', name: '2º molar inf. izq.', m: '23‑31' }
    ]
  };

  /* ---------- Sueño por edad --------------------------------------------
     Ventanas de vigilia (min), siestas esperadas y sueño total recomendado
     (h, AASM/AAP). Rangos orientativos para calcular predicciones. */
  N.SLEEP_BY_AGE = [
    { upTo: 1, ww: [35, 60], naps: [4, 6], total: [14, 17] },
    { upTo: 2, ww: [50, 80], naps: [4, 5], total: [14, 17] },
    { upTo: 3, ww: [60, 90], naps: [4, 5], total: [14, 17] },
    { upTo: 4, ww: [75, 120], naps: [3, 4], total: [12, 16] },
    { upTo: 6, ww: [105, 150], naps: [3, 3], total: [12, 16] },
    { upTo: 8, ww: [120, 180], naps: [2, 3], total: [12, 16] },
    { upTo: 10, ww: [150, 210], naps: [2, 2], total: [12, 16] },
    { upTo: 13, ww: [180, 240], naps: [2, 2], total: [12, 16] },
    { upTo: 18, ww: [240, 330], naps: [1, 2], total: [11, 14] },
    { upTo: 99, ww: [300, 360], naps: [1, 1], total: [11, 14] }
  ];

  N.SLEEP_PLACES = ['Cuna', 'Colecho', 'Brazos', 'Carrito', 'Coche', 'Fular'];
  N.DIAPER_COLORS = [
    { id: 'amarillo', name: 'Amarillo mostaza', hex: '#D9A92B', ok: true },
    { id: 'verde', name: 'Verde', hex: '#6E8B3D', ok: true },
    { id: 'marron', name: 'Marrón', hex: '#7A5230', ok: true },
    { id: 'negro', name: 'Negro (no meconio)', hex: '#222', ok: false },
    { id: 'blanco', name: 'Blanco / gris', hex: '#CFCFCF', ok: false },
    { id: 'rojo', name: 'Con sangre', hex: '#B3261E', ok: false }
  ];
  N.MOODS = [
    { id: 'feliz', name: 'Feliz', emoji: '😊' }, { id: 'tranquilo', name: 'Tranquilo', emoji: '😌' },
    { id: 'cansado', name: 'Cansado', emoji: '🥱' }, { id: 'molesto', name: 'Molesto', emoji: '😣' },
    { id: 'malito', name: 'Malito', emoji: '🤒' }
  ];

  /* ---------- Actividades ----------------------------------------------
     timer: se puede cronometrar · goal: minutos diarios recomendados.
     Boca abajo: la OMS recomienda al menos 30 min al día repartidos
     mientras el bebé aún no gatea. */
  N.ACTIVITIES = [
    { id: 'tummy', name: 'Boca abajo', emoji: '🐢', timer: true, hint: 'Fortalece cuello, espalda y hombros' },
    { id: 'bath', name: 'Baño', emoji: '🛁', hint: 'Parte de la rutina de noche' },
    { id: 'walk', name: 'Paseo', emoji: '🌳', timer: true, hint: 'Aire libre y luz natural' },
    { id: 'play', name: 'Juego en el suelo', emoji: '🧸', timer: true, hint: 'Alcanzar, girar, explorar' },
    { id: 'reading', name: 'Cuento', emoji: '📖', hint: 'Lenguaje y vínculo' },
    { id: 'massage', name: 'Masaje', emoji: '🤲', hint: 'Relaja antes de dormir' },
    { id: 'music', name: 'Música y canciones', emoji: '🎶', hint: '' },
    { id: 'other', name: 'Otra', emoji: '✨', hint: '' }
  ];
  N.TUMMY_GOAL = 30;

  /* ---------- Avisos por defecto ---------- */
  N.REMINDER_DEFAULTS = {
    nap: { on: true, before: 10 },        // minutos antes de la siesta prevista
    bed: { on: true, before: 20 },        // minutos antes de la hora de dormir
    feed: { on: false, hours: 3 },        // si no hay toma en X horas (de día)
    appt: { on: true },                   // día anterior 20:00 y 1 h antes
    vitd: { on: true, time: '10:00' },    // si toma vitamina D y aún no se ha dado
    allergen: { on: true, time: '10:30' },// alérgeno en curso o a mantener
    meds: { on: true }                    // próxima dosis pedida al registrar
  };
})(window.Nido = window.Nido || {});
