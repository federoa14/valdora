// =============================================================
//  VALDORA - Debate televisado interactivo
//  El debate de la campaña deja de resolverse solo: es una escena
//  por rondas en un estudio de TV. El moderador hace preguntas
//  sorteadas de un banco filtrado por escala (nación, provincia o
//  municipio) y por el contexto (inflación, inseguridad, pobreza,
//  tensión social, escándalos). El jugador elige entre 3 respuestas;
//  cada una le habla a distintos grupos sociales y pone a prueba un
//  atributo. Los rivales actúan con su propia "personalidad": se
//  lucen, cometen furcios, atacan (y a veces les sale mal).
//  Sin interfaz (pruebas), el debate se juega en piloto automático.
// =============================================================

// ---------- Banco de preguntas ----------
// esc: N = nacional (presidente, diputado), P = provincial, M = municipal
// respuestas: t texto, e estilo, i ideología (0 izq · 100 der), a atributo que se pone a prueba,
// d dificultad (0 segura · 2 arriesgada), g efecto por grupo (−3..+3), fx efecto especial
const DEBATE_PREGUNTAS = [
  // --- Nación ---
  { id: "inflacion", tema: "economia", esc: "N", q: "La inflación se come los sueldos mes a mes. ¿Qué hace en sus primeros cien días para bajarla?", r: [
    { t: "Acuerdo de precios y salarios con empresas y sindicatos, y control a los formadores de precios.", e: "consenso", i: 30, a: "negociacion", d: 1, g: { trabajadores: 2, estatales: 1, informales: 1, empresarios: -2, media: -1 } },
    { t: "Déficit cero, Banco Central independiente y no se emite un peso más para financiar al Tesoro.", e: "tecnica", i: 72, a: "gestion", d: 2, g: { empresarios: 2, media: 2, campo: 1, estatales: -2, jubilados: -1 } },
    { t: "Le hablo a la señora que no llega a fin de mes: la inflación la causó la política y la política la tiene que pagar.", e: "emotiva", i: 50, a: "carisma", d: 1, g: { jubilados: 1, informales: 1, jovenes: 1, empresarios: -1 } } ] },
  { id: "dolar", tema: "economia", esc: "N", q: "Hay brecha cambiaria y la gente corre al dólar. ¿Mantiene el cepo, lo levanta o dolariza?", r: [
    { t: "Cepo administrado: los dólares son para producir, no para fugar.", e: "tecnica", i: 25, a: "gestion", d: 1, g: { trabajadores: 1, estatales: 1, media: -2, empresarios: -1, campo: -1 } },
    { t: "Levanto el cepo en forma ordenada, con un programa serio y respaldo del Fondo Monetario Mundial.", e: "tecnica", i: 62, a: "gestion", d: 2, g: { empresarios: 2, campo: 2, media: 1, trabajadores: -1 } },
    { t: "Dolarizo. Que ningún político pueda volver a imprimir un solo peso.", e: "populista", i: 88, a: "oratoria", d: 2, g: { jovenes: 2, media: 1, jubilados: -2, estatales: -2, trabajadores: -1 } } ] },
  { id: "empleo", tema: "empleo", esc: "N", q: "Uno de cada tres trabajadores está en negro. ¿Cómo se crea empleo formal?", r: [
    { t: "Obra pública y crédito barato a las pymes: el Estado pone primera.", e: "propuesta", i: 28, a: "gestion", d: 1, g: { trabajadores: 2, informales: 1, estatales: 1, empresarios: -1 } },
    { t: "Reforma laboral: bajar cargas e indemnizaciones para que contratar no sea un castigo.", e: "tecnica", i: 75, a: "oratoria", d: 2, g: { empresarios: 2, campo: 1, jovenes: 1, trabajadores: -2, estatales: -1 } },
    { t: "Blanqueo laboral sin multas y un monotributo simple para el que hoy changuea.", e: "consenso", i: 50, a: "negociacion", d: 1, g: { informales: 2, jovenes: 1, media: 1 } } ] },
  { id: "jubilados", tema: "jubilaciones", esc: "N", q: "Los jubilados cobran la mínima y no les alcanza para los remedios. ¿Qué les dice esta noche?", r: [
    { t: "Aumento por decreto y remedios gratis para quien cobre la mínima. Que lo pague el que más tiene.", e: "populista", i: 25, a: "carisma", d: 0, g: { jubilados: 3, informales: 1, empresarios: -1, media: -1 } },
    { t: "Movilidad atada a la inflación y una auditoría de las jubilaciones de privilegio.", e: "tecnica", i: 55, a: "gestion", d: 1, g: { jubilados: 2, media: 1, estatales: -1 } },
    { t: "Sistema mixto con cuentas individuales para los jóvenes, sin tocar a los jubilados actuales.", e: "tecnica", i: 80, a: "oratoria", d: 2, g: { jovenes: 1, empresarios: 2, jubilados: -2, trabajadores: -1 } } ] },
  { id: "narco", tema: "seguridad", esc: "N", q: "El narcotráfico avanza en los puertos y en los barrios. ¿Qué va a hacer?", r: [
    { t: "Fuerzas federales en los barrios tomados y baja de la edad de imputabilidad.", e: "ataque", i: 78, a: "oratoria", d: 1, g: { media: 2, jubilados: 2, informales: 1, jovenes: -2, estatales: -1 } },
    { t: "Seguir la ruta del dinero: lavado, contadores y jueces cómplices. Al narco se le pega en la plata.", e: "tecnica", i: 45, a: "gestion", d: 2, g: { media: 2, empresarios: 1, trabajadores: 1 } },
    { t: "Llegar antes que el narco: club, escuela y trabajo en cada barrio.", e: "emotiva", i: 22, a: "carisma", d: 1, g: { informales: 2, jovenes: 2, estatales: 1, media: -1, jubilados: -1 } } ] },
  { id: "litio", tema: "ambiente", esc: "N", q: "Hay petróleo y litio para exportar, pero también protestas ambientales. ¿Explota o protege?", r: [
    { t: "Exploto todo lo que se pueda con reglas claras: dólares, empleo y regalías.", e: "tecnica", i: 72, a: "gestion", d: 1, g: { empresarios: 2, trabajadores: 1, campo: 1, jovenes: -1 } },
    { t: "Desarrollo con licencia social: consulta a las comunidades y control ambiental estricto.", e: "consenso", i: 40, a: "negociacion", d: 1, g: { jovenes: 2, media: 1, empresarios: -1 } },
    { t: "Que el litio lo industrialice una empresa estatal. No se lo van a llevar en bruto.", e: "populista", i: 20, a: "carisma", d: 1, g: { estatales: 2, trabajadores: 1, empresarios: -2, media: -1 } } ] },
  { id: "mundo", tema: "exterior", esc: "N", q: "¿Con quién se alía Valdora en el mundo?", r: [
    { t: "Con las democracias del Norte: inversiones, tecnología y seguridad.", e: "propuesta", i: 75, a: "oratoria", d: 1, g: { empresarios: 2, media: 1, estatales: -1 } },
    { t: "Con todos los que nos compren: el comercio no tiene ideología.", e: "tecnica", i: 50, a: "negociacion", d: 1, g: { campo: 2, empresarios: 1 } },
    { t: "Unidad con los vecinos de la región y soberanía frente a los organismos de crédito.", e: "emotiva", i: 22, a: "carisma", d: 1, g: { estatales: 1, trabajadores: 1, jovenes: 1, empresarios: -1 } } ] },
  { id: "deuda", tema: "economia", esc: "N", q: "Valdora le debe una fortuna al Fondo Monetario Mundial. ¿Paga, renegocia o deja de pagar?", r: [
    { t: "No vamos a pagar con el hambre del pueblo: auditoría de la deuda y suspensión de pagos.", e: "populista", i: 12, a: "oratoria", d: 1, g: { informales: 1, estatales: 1, trabajadores: 1, empresarios: -3, media: -2 } },
    { t: "Renegociamos plazos, sin ajuste sobre los jubilados.", e: "consenso", i: 40, a: "negociacion", d: 1, g: { jubilados: 1, trabajadores: 1, media: 1 } },
    { t: "Se paga. Un país que no honra su deuda no recibe una inversión más.", e: "tecnica", i: 75, a: "gestion", d: 1, g: { empresarios: 2, campo: 1, media: 1, informales: -1, estatales: -1 } } ] },
  { id: "pobreza", tema: "social", esc: "N", q: "La pobreza llega al {pobreza}%. ¿Mantiene los planes sociales?", r: [
    { t: "Se mantienen y se amplían: en este país nadie se va a quedar con hambre.", e: "emotiva", i: 20, a: "carisma", d: 0, g: { informales: 3, estatales: 1, media: -2, campo: -1 } },
    { t: "Los planes se convierten en trabajo: el que cobra, trabaja o estudia.", e: "propuesta", i: 55, a: "oratoria", d: 1, g: { media: 2, trabajadores: 1, informales: -1 } },
    { t: "Fin de los intermediarios: la ayuda va directo a la gente, sin punteros ni organizaciones.", e: "ataque", i: 68, a: "oratoria", d: 1, g: { media: 2, jovenes: 1, estatales: -1 } } ] },
  { id: "impuestos", tema: "economia", esc: "N", q: "Valdora tiene una de las presiones impositivas más altas del mundo. ¿Va a bajar impuestos?", r: [
    { t: "Bajo las retenciones al campo y elimino los impuestos distorsivos en cuatro años.", e: "tecnica", i: 72, a: "gestion", d: 1, g: { campo: 3, empresarios: 2, estatales: -1, informales: -1 } },
    { t: "Que pague más el que más tiene: impuesto a las grandes fortunas y menos IVA en los alimentos.", e: "populista", i: 22, a: "oratoria", d: 1, g: { informales: 2, trabajadores: 1, jubilados: 1, empresarios: -2, campo: -1 } },
    { t: "Simplificación: un solo impuesto para las pymes y fin de las mil ventanillas.", e: "propuesta", i: 55, a: "negociacion", d: 1, g: { media: 2, empresarios: 1 } } ] },
  { id: "piquetes", tema: "protesta", esc: "N", q: "Hay cortes de ruta y piquetes todos los días. ¿Qué hace?", r: [
    { t: "Protocolo antipiquetes: la calle no se corta, y el que corta pierde el plan.", e: "ataque", i: 80, a: "oratoria", d: 1, g: { media: 2, jubilados: 1, campo: 1, informales: -2, jovenes: -1 } },
    { t: "Diálogo con todos los sectores, pero sin chantajes: mesa de trabajo y respuestas.", e: "consenso", i: 45, a: "negociacion", d: 1, g: { trabajadores: 1, media: 1, informales: 1 } },
    { t: "La protesta es un derecho. Yo no voy a reprimir al que tiene hambre.", e: "emotiva", i: 18, a: "carisma", d: 1, g: { informales: 2, estatales: 1, jovenes: 1, media: -2, campo: -1 } } ] },
  { id: "estado", tema: "estado", esc: "N", q: "¿Hay que achicar el Estado? ¿Sobran empleados públicos?", r: [
    { t: "Sí: auditoría de cada contrato y fin de los ñoquis. Menos ministerios, más eficiencia.", e: "ataque", i: 80, a: "oratoria", d: 1, g: { media: 2, empresarios: 2, campo: 1, estatales: -3 } },
    { t: "No se trata de achicar sino de que funcione: trámites digitales y evaluación de desempeño.", e: "tecnica", i: 55, a: "gestion", d: 2, g: { media: 1, jovenes: 1, empresarios: 1 } },
    { t: "El Estado es el que te cuida cuando nadie lo hace. No voy a echar a nadie.", e: "emotiva", i: 22, a: "carisma", d: 0, g: { estatales: 3, informales: 1, media: -1, empresarios: -1 } } ] },
  // --- Nación y provincia ---
  { id: "hospitales", tema: "salud", esc: "NP", q: "Los hospitales de {T} están colapsados y faltan médicos. ¿Cómo lo resuelve?", r: [
    { t: "Más presupuesto: sueldos dignos para residentes y enfermeras, y hospitales nuevos.", e: "propuesta", i: 25, a: "carisma", d: 1, g: { estatales: 2, informales: 1, jubilados: 1, empresarios: -1 } },
    { t: "Turnos digitales, historia clínica única y que las prepagas paguen cuando usan el hospital público.", e: "tecnica", i: 62, a: "gestion", d: 2, g: { media: 2, jovenes: 1, empresarios: 1, estatales: -1 } },
    { t: "Un acuerdo entre hospitales públicos, obras sociales y prepagas para coordinar las camas.", e: "consenso", i: 50, a: "negociacion", d: 1, g: { trabajadores: 1, media: 1, jubilados: 1 } } ] },
  { id: "lectura", tema: "educacion", esc: "NP", q: "Siete de cada diez chicos no entienden lo que leen. ¿Qué propone?", r: [
    { t: "Educación como servicio esencial: las escuelas no cierran nunca más por paros.", e: "ataque", i: 72, a: "oratoria", d: 1, g: { media: 2, empresarios: 1, jubilados: 1, estatales: -2 } },
    { t: "Aumento a los docentes, jornada extendida y una computadora por alumno.", e: "propuesta", i: 30, a: "carisma", d: 1, g: { estatales: 2, jovenes: 1, informales: 1, empresarios: -1 } },
    { t: "Evaluaciones públicas por escuela y un premio a los docentes que mejoren los resultados.", e: "tecnica", i: 60, a: "gestion", d: 2, g: { media: 2, empresarios: 1, estatales: -1 } } ] },
  // --- Todas las escalas ---
  { id: "corrupcion", tema: "corrupcion", esc: "NPM", q: "La gente cree que todos los políticos roban. ¿Por qué deberían creerle a usted?", r: [
    { t: "Presento hoy mi declaración jurada completa. El que no tiene nada que esconder, la muestra.", e: "emotiva", i: 50, a: "carisma", d: 1, g: { media: 2, jovenes: 1 }, fx: "djj" },
    { t: "Ficha limpia: ningún condenado en segunda instancia puede ser candidato.", e: "propuesta", i: 62, a: "oratoria", d: 1, g: { media: 2, jubilados: 1, empresarios: 1, estatales: -1 } },
    { t: "Acá hay candidatos sentados con causas abiertas. Que expliquen ellos.", e: "ataque", i: 50, a: "oratoria", d: 2, g: { media: 1, jovenes: 1 } } ] },
  { id: "vivienda", tema: "vivienda", esc: "NPM", q: "Alquilar es imposible y no hay crédito hipotecario. ¿Qué propone?", r: [
    { t: "Un plan de viviendas sociales construidas por cooperativas.", e: "propuesta", i: 25, a: "carisma", d: 1, g: { informales: 2, trabajadores: 1, estatales: 1, empresarios: -1 } },
    { t: "Libertad de contratos y créditos a treinta años: que vuelva la oferta.", e: "tecnica", i: 72, a: "gestion", d: 1, g: { media: 2, jovenes: 1, empresarios: 1, informales: -1 } },
    { t: "Lotes con servicios para que cada familia pueda construir su casa.", e: "consenso", i: 48, a: "negociacion", d: 1, g: { trabajadores: 2, informales: 1, jovenes: 1 } } ] },
  { id: "jovenes", tema: "jovenes", esc: "NPM", q: "Los jóvenes se quieren ir. ¿Qué les ofrece para que se queden en {T}?", r: [
    { t: "Primer empleo sin cargas por dos años y créditos para alquilar.", e: "propuesta", i: 55, a: "gestion", d: 1, g: { jovenes: 3, empresarios: 1 } },
    { t: "Libertad: menos Estado, menos impuestos y que cada uno pueda emprender.", e: "populista", i: 82, a: "oratoria", d: 1, g: { jovenes: 2, empresarios: 1, estatales: -2, jubilados: -1 } },
    { t: "Universidad pública y gratuita, becas y ciencia: el futuro se construye acá.", e: "emotiva", i: 28, a: "carisma", d: 1, g: { jovenes: 2, estatales: 1, media: 1, empresarios: -1 } } ] },
  // --- Provincia ---
  { id: "policia", tema: "seguridad", esc: "P", q: "En {T} la policía está desbordada y mal paga. ¿Qué hace con la fuerza?", r: [
    { t: "Aumento de sueldos policiales, patrulleros nuevos y más agentes en la calle.", e: "propuesta", i: 60, a: "gestion", d: 1, g: { jubilados: 2, media: 1, estatales: 1 } },
    { t: "Depuración de la cúpula: con la policía que arregla con el delito no se combate el delito.", e: "ataque", i: 40, a: "oratoria", d: 2, g: { media: 2, jovenes: 1, estatales: -1 } },
    { t: "Prevención: cámaras, luminarias y policía de proximidad en cada barrio.", e: "tecnica", i: 48, a: "negociacion", d: 1, g: { informales: 1, media: 1, trabajadores: 1 } } ] },
  { id: "copa", tema: "federalismo", esc: "P", q: "{T} recibe de la Nación menos de lo que aporta. ¿Cómo va a pelear por los fondos?", r: [
    { t: "Me planto ante el gobierno nacional: si no llegan los fondos, vamos a la Corte Suprema.", e: "ataque", i: 50, a: "oratoria", d: 1, g: { media: 2, campo: 1, empresarios: 1 } },
    { t: "Con diálogo: el gobernador que se pelea con la Nación se queda sin obras.", e: "consenso", i: 42, a: "negociacion", d: 1, g: { estatales: 2, trabajadores: 1 } },
    { t: "Primero ordeno la casa: no voy a pedir plata para financiar un Estado provincial que gasta mal.", e: "tecnica", i: 68, a: "gestion", d: 2, g: { empresarios: 2, media: 1, estatales: -2 } } ] },
  { id: "paro", tema: "educacion", esc: "P", q: "Los docentes de {T} están de paro hace tres semanas. ¿Qué les dice?", r: [
    { t: "Aumento ya, aunque haya que endeudar a la provincia: sin docentes no hay futuro.", e: "emotiva", i: 25, a: "carisma", d: 0, g: { estatales: 3, jovenes: 1, empresarios: -1, media: -1 } },
    { t: "Descuento los días de paro: los chicos tienen derecho a tener clases.", e: "ataque", i: 75, a: "oratoria", d: 1, g: { media: 2, jubilados: 1, estatales: -3 } },
    { t: "Paritaria trimestral atada a la inflación y clases garantizadas.", e: "consenso", i: 50, a: "negociacion", d: 1, g: { estatales: 1, media: 1, trabajadores: 1 } } ] },
  { id: "privado", tema: "empleo", esc: "P", q: "En {T} casi todo el empleo es público. ¿Cómo genera trabajo privado?", r: [
    { t: "Exención de Ingresos Brutos por diez años a la industria que se radique.", e: "tecnica", i: 65, a: "gestion", d: 1, g: { empresarios: 2, trabajadores: 1, estatales: -1 } },
    { t: "Un banco provincial con créditos para cooperativas y economías regionales.", e: "propuesta", i: 32, a: "negociacion", d: 1, g: { trabajadores: 1, informales: 1, campo: 1 } },
    { t: "Turismo, energía y producción: {T} tiene todo para crecer si deja de pedir permiso.", e: "emotiva", i: 58, a: "carisma", d: 1, g: { jovenes: 1, empresarios: 1, media: 1 } } ] },
  { id: "rutas", tema: "infraestructura", esc: "P", q: "Las rutas de {T} son un peligro y hay pueblos sin agua potable. ¿Qué obras prioriza?", r: [
    { t: "Agua y cloacas primero: la obra que no se ve es la que salva vidas.", e: "propuesta", i: 40, a: "gestion", d: 1, g: { informales: 2, trabajadores: 1, jubilados: 1 } },
    { t: "Rutas productivas para sacar la cosecha: si no sale la producción, no hay trabajo.", e: "tecnica", i: 62, a: "negociacion", d: 1, g: { campo: 3, empresarios: 1 } },
    { t: "Obras por iniciativa privada con peaje: que el Estado no ponga un peso.", e: "tecnica", i: 78, a: "oratoria", d: 2, g: { empresarios: 2, media: 1, trabajadores: -1, informales: -1 } } ] },
  { id: "minera", tema: "ambiente", esc: "P", q: "Una minera quiere instalarse en {T}. ¿La aprueba?", r: [
    { t: "Sí, con regalías altas y empleo local obligatorio.", e: "consenso", i: 55, a: "negociacion", d: 1, g: { trabajadores: 2, empresarios: 1, jovenes: -1 } },
    { t: "Con consulta popular: que decida la gente que vive ahí.", e: "emotiva", i: 38, a: "carisma", d: 1, g: { jovenes: 2, media: 1, empresarios: -1 } },
    { t: "Sí, sin vueltas: la provincia necesita inversión y no puede darse el lujo de decir que no.", e: "tecnica", i: 75, a: "oratoria", d: 1, g: { empresarios: 2, campo: 1, jovenes: -2 } } ] },
  { id: "fueros", tema: "corrupcion", esc: "P", q: "¿Va a terminar con la reelección indefinida y los fueros en {T}?", r: [
    { t: "Sí: una sola reelección y fin de los fueros para los delitos comunes.", e: "propuesta", i: 58, a: "oratoria", d: 1, g: { media: 2, jovenes: 1 } },
    { t: "Los fueros protegen de la persecución política; lo que hay que cambiar es la Justicia.", e: "evasiva", i: 40, a: "negociacion", d: 2, g: { estatales: 1, media: -2 } },
    { t: "Que decida la gente en una consulta, no los políticos.", e: "emotiva", i: 50, a: "carisma", d: 1, g: { jovenes: 1, media: 1, informales: 1 } } ] },
  // --- Municipio ---
  { id: "basura", tema: "servicios", esc: "M", q: "En {T} la basura se acumula en las esquinas. ¿Cómo resuelve la recolección?", r: [
    { t: "Nueva licitación con multas reales a la empresa que no cumpla.", e: "tecnica", i: 60, a: "gestion", d: 1, g: { media: 2, jubilados: 1 } },
    { t: "Cooperativas de recicladores: barrios limpios y trabajo para los vecinos.", e: "propuesta", i: 28, a: "negociacion", d: 1, g: { informales: 2, jovenes: 1 } },
    { t: "Que el municipio vuelva a hacerse cargo con camiones propios.", e: "populista", i: 30, a: "carisma", d: 1, g: { estatales: 2, trabajadores: 1, empresarios: -1, media: -1 } } ] },
  { id: "calles", tema: "infraestructura", esc: "M", q: "Calles rotas, colectivos que no pasan y barrios sin asfalto. ¿Por dónde empieza?", r: [
    { t: "Asfalto y luminarias en los barrios que nunca vieron una obra.", e: "propuesta", i: 40, a: "carisma", d: 0, g: { informales: 2, trabajadores: 1 } },
    { t: "Bacheo con aplicación: el vecino denuncia y la cuadrilla llega en 48 horas.", e: "tecnica", i: 60, a: "gestion", d: 1, g: { media: 2, jovenes: 1 } },
    { t: "Carriles exclusivos y boleto con descuento para estudiantes y jubilados.", e: "consenso", i: 42, a: "negociacion", d: 1, g: { jovenes: 1, jubilados: 2 } } ] },
  { id: "barrio", tema: "seguridad", esc: "M", q: "Los vecinos de {T} tienen miedo de salir de noche. ¿Qué puede hacer un intendente?", r: [
    { t: "Guardia urbana municipal y botón antipánico para cada comercio.", e: "propuesta", i: 62, a: "gestion", d: 1, g: { media: 2, jubilados: 2, empresarios: 1 } },
    { t: "Un intendente no maneja la policía, pero le voy a exigir a la provincia más patrulleros.", e: "evasiva", i: 45, a: "oratoria", d: 1, g: { jubilados: 1, media: -1 } },
    { t: "Luz, poda y polideportivos abiertos de noche para los pibes.", e: "emotiva", i: 32, a: "carisma", d: 1, g: { jovenes: 2, informales: 1 } } ] },
  { id: "tasas", tema: "economia", esc: "M", q: "Las tasas municipales subieron más que la inflación. ¿Las baja?", r: [
    { t: "Congelo las tasas y recorto el gasto político del municipio.", e: "ataque", i: 70, a: "oratoria", d: 1, g: { media: 2, jubilados: 1, empresarios: 1, estatales: -2 } },
    { t: "Tasa diferenciada: que paguen más los barrios cerrados y los hipermercados.", e: "populista", i: 28, a: "carisma", d: 1, g: { informales: 1, trabajadores: 1, jubilados: 1, empresarios: -2 } },
    { t: "Descuento por pago digital y deuda cero para el jubilado de la mínima.", e: "consenso", i: 50, a: "gestion", d: 1, g: { jubilados: 2, media: 1 } } ] },
  { id: "inundacion", tema: "infraestructura", esc: "M", q: "Cada vez que llueve fuerte se inundan los mismos barrios de {T}. ¿Qué va a hacer?", r: [
    { t: "Plan hidráulico con fondos nacionales: entubar arroyos y limpiar sumideros.", e: "tecnica", i: 45, a: "negociacion", d: 1, g: { informales: 2, trabajadores: 1, media: 1 } },
    { t: "No se construye un barrio cerrado más sobre los humedales.", e: "ataque", i: 30, a: "oratoria", d: 2, g: { jovenes: 1, informales: 1, empresarios: -2 } },
    { t: "Pido perdón en nombre de la política y me comprometo: ni una inundación más.", e: "emotiva", i: 50, a: "carisma", d: 2, g: { informales: 1, jubilados: 1 } } ] },
  { id: "comercios", tema: "empleo", esc: "M", q: "Los comercios del centro de {T} cierran uno tras otro. ¿Qué hace?", r: [
    { t: "Dos años sin tasas para los comercios que abran.", e: "tecnica", i: 64, a: "gestion", d: 1, g: { empresarios: 2, media: 1 } },
    { t: "Ferias municipales y compre local en todas las compras del municipio.", e: "propuesta", i: 40, a: "negociacion", d: 1, g: { informales: 1, trabajadores: 1, empresarios: 1 } },
    { t: "Afuera los manteros y la venta ilegal: es competencia desleal.", e: "ataque", i: 75, a: "oratoria", d: 1, g: { empresarios: 1, media: 1, informales: -2 } } ] },
  { id: "salitas", tema: "salud", esc: "M", q: "Las salitas de los barrios de {T} no tienen médicos a la tarde. ¿Qué propone?", r: [
    { t: "Centros de salud abiertos las 24 horas en cada barrio grande.", e: "propuesta", i: 35, a: "gestion", d: 1, g: { informales: 2, jubilados: 1, estatales: 1 } },
    { t: "Telemedicina y turnos por mensaje para no hacer fila a las cinco de la mañana.", e: "tecnica", i: 58, a: "gestion", d: 1, g: { jovenes: 1, media: 1, jubilados: 1 } },
    { t: "Convenios con clínicas privadas para atender a los vecinos sin cobertura.", e: "consenso", i: 62, a: "negociacion", d: 1, g: { media: 1, empresarios: 1, estatales: -1 } } ] },
];

// Pregunta personalizada cuando hay aportes comprometedores
const DEBATE_PREGUNTA_APORTE = { id: "aporte", tema: "corrupcion", esc: "NPM", q: "Se publicó que {AP} puso plata en su campaña. ¿Qué le prometió a cambio?", r: [
  { t: "Todos los aportes están declarados ante la Justicia Electoral. No prometí nada.", e: "evasiva", i: 50, a: "oratoria", d: 2, g: { media: -1 } },
  { t: "Sí, recibí aportes, como todos. Esta semana los publico uno por uno.", e: "emotiva", i: 50, a: "carisma", d: 1, g: { media: 1, jovenes: 1, empresarios: -1 }, fx: "transparencia" },
  { t: "Qué casualidad: a este canal lo financia el mismo grupo que a mi rival.", e: "ataque", i: 50, a: "oratoria", d: 2, g: { jovenes: 1, media: -2 } } ] };

const DEBATE_CIERRE = { id: "cierre", tema: "cierre", esc: "NPM", q: "Minuto final. Mire a cámara: ¿por qué tienen que votar por usted?", r: [
  { t: "\"No te pido que me creas: te pido que me des la oportunidad de demostrarlo.\"", e: "emotiva", i: -1, a: "carisma", d: 1, g: { jovenes: 1, media: 1, informales: 1 } },
  { t: "Repaso tres propuestas concretas, con números y plazos.", e: "tecnica", i: -1, a: "gestion", d: 1, g: { media: 2, empresarios: 1, jubilados: 1 } },
  { t: "\"Ellos ya gobernaron y ya saben cómo termina. Esta vez, algo distinto.\"", e: "ataque", i: -1, a: "oratoria", d: 2, g: { media: 1, jovenes: 1 } } ] };

const DEBATE_REPLICA = [
  { t: "Responder con datos y papeles en la mano.", e: "tecnica", a: "gestion", d: 1 },
  { t: "Contraatacar con ironía.", e: "ataque", a: "oratoria", d: 2 },
  { t: "No entrar en el barro y volver a la propuesta.", e: "consenso", a: "carisma", d: 0 },
];

const DEBATE_ATR = { carisma: "Carisma", oratoria: "Oratoria", gestion: "Gestión", negociacion: "Negociación" };
const DEBATE_TEMAS = { economia: "Economía", empleo: "Trabajo", jubilaciones: "Jubilaciones", seguridad: "Seguridad", ambiente: "Ambiente y recursos", exterior: "Relaciones exteriores", social: "Pobreza", protesta: "Conflicto social", estado: "Estado", salud: "Salud", educacion: "Educación", corrupcion: "Corrupción", vivienda: "Vivienda", jovenes: "Juventud", federalismo: "Federalismo", infraestructura: "Obras", servicios: "Servicios", cierre: "Cierre" };

// Lo que puede pasarle a un rival en cada ronda
const DEBATE_FURCIOS = [
  "confunde la cifra de pobreza y el chequeo en vivo desmiente el dato en pantalla",
  "se traba y promete \"bajar la educación\" en lugar de la inflación",
  "llama al moderador por otro nombre dos veces seguidas",
  "se queda en blanco y mira el machete durante eternos segundos",
  "dice que la inflación \"es un estado de ánimo\"",
  "promete \"pobreza cero en seis meses\" y no sabe explicar cómo",
  "se olvida de su propia propuesta estrella",
  "se le escapa un insulto con el micrófono abierto",
  "cita una ley que no existe",
];
const DEBATE_LUCE = [
  "responde con datos precisos y una frase que queda picando en las redes",
  "arranca aplausos del público del estudio",
  "explica su plan con claridad y le gana el tiempo al moderador",
  "cuenta la historia de una vecina y emociona a la teleaudiencia",
];
const DEBATE_CHICANA = [
  "lanza una chicana que explota en las redes",
  "hace un gesto burlón que se vuelve meme en minutos",
  "contesta con un remate que el estudio festeja",
];

// ---------- Utilidades ----------
function debateEscala() {
  const o = S && S.cfg && S.cfg.objetivo;
  return o === "gobernador" ? "P" : o === "intendente" ? "M" : "N";
}
function debateTerritorio() {
  if (typeof nombreTerritorio === "function" && typeof mapaNoNacional === "function" && mapaNoNacional() && S.cfg.objetivo !== "legislador") return nombreTerritorio();
  return "el país";
}
function debateNombreCargo() { return typeof nombreCargo === "function" ? nombreCargo() : "presidente"; }
function debateCanal() {
  const e = debateEscala();
  return e === "N" ? "Canal Federal Noticias" : e === "P" ? `la TV pública de ${debateTerritorio()}` : `el canal de cable de ${debateTerritorio()}`;
}
function debateIndicadores() {
  const era = typeof eraActual === "function" ? eraActual() : null;
  return (era && era.ind) || { inflacion: 3, desempleo: 7, pobreza: 35, inseguridad: 55, tension: 35 };
}
// Trayectoria del personaje (si la partida la tiene): 0 = sin experiencia · 1 = mucha
function debateExperiencia() {
  const yo = S.jugador;
  const t = yo.trayectoria || S.trayectoria || yo.cargos || null;
  let n = 0;
  if (Array.isArray(t)) n = t.length;
  else if (t && typeof t === "object") n = Array.isArray(t.cargos) ? t.cargos.length : Object.keys(t).length;
  else if (typeof t === "number") n = t;
  if (!n && yo.partido !== "NUEVO") n = 1; // los partidos tradicionales tienen al menos un cargo partidario
  return R.clamp(n / 3, 0, 1);
}
function debateCand(id) { return S.candidatos.find(c => c.id === id); }
function debateTexto(s) {
  const ind = debateIndicadores();
  const ap = (S.favores && S.favores.length) ? S.favores[S.favores.length - 1].aportante : "un empresario";
  return s.replace(/\{T\}/g, debateTerritorio()).replace(/\{pobreza\}/g, Math.round(ind.pobreza)).replace(/\{AP\}/g, ap);
}
function debatePuntero() {
  const enc = S.ultimaEncuesta || {};
  const rivales = S.debate.part.filter(id => id !== S.jugador.id);
  return rivales.slice().sort((a, b) => (enc[b] || 0) - (enc[a] || 0))[0];
}
function sumarEfecto(D, id, g, v) { D.efectos[id] = D.efectos[id] || {}; D.efectos[id][g] = (D.efectos[id][g] || 0) + v; }

// ---------- Armado del debate ----------
function elegirPreguntasDebate(n) {
  const esc = debateEscala(), ind = debateIndicadores();
  const riesgo = S.riesgo || 0;
  const peso = {
    economia: 1 + ind.inflacion / 6, empleo: 0.6 + ind.desempleo / 8, social: 0.4 + ind.pobreza / 30,
    seguridad: 0.6 + ind.inseguridad / 50, protesta: 0.2 + (ind.tension || 30) / 40, corrupcion: 0.8 + riesgo / 25,
  };
  const pool = DEBATE_PREGUNTAS.filter(p => p.esc.includes(esc));
  const elegidas = [];
  // si hay aportes comprometedores, el periodismo pregunta por ellos
  if ((S.favores || []).length && riesgo >= 12 && R.rand() < 0.5 + riesgo / 80) elegidas.push(DEBATE_PREGUNTA_APORTE.id);
  const temasUsados = new Set(elegidas.length ? ["corrupcion"] : []);
  let guarda = 0;
  while (elegidas.length < n && guarda++ < 200) {
    const cand = pool.filter(p => !elegidas.includes(p.id) && !temasUsados.has(p.tema));
    if (!cand.length) break;
    const tot = cand.reduce((a, p) => a + (peso[p.tema] || 1), 0);
    let x = R.rand() * tot, sel = cand[0];
    for (const p of cand) { x -= peso[p.tema] || 1; if (x <= 0) { sel = p; break; } }
    elegidas.push(sel.id); temasUsados.add(sel.tema);
  }
  // el aporte no siempre es la primera pregunta
  for (let i = elegidas.length - 1; i > 0; i--) { const j = Math.floor(R.rand() * (i + 1)); [elegidas[i], elegidas[j]] = [elegidas[j], elegidas[i]]; }
  return elegidas;
}

function crearDebate(tipo = "general") {
  const part = (tipo === "balotaje" ? S.candidatos.filter(c => c.activo) : candidatosEnCarrera()).map(c => c.id);
  const preguntas = elegirPreguntasDebate(tipo === "balotaje" ? 3 : 4);
  preguntas.push(DEBATE_CIERRE.id);
  S.debate = {
    tipo, estado: "pendiente", fase: "pregunta", ronda: 0, preguntas, part,
    pts: Object.fromEntries(part.map(id => [id, 0])), img: Object.fromEntries(part.map(id => [id, 0])),
    efectos: {}, momentos: [], replicas: 0, ultimo: null, canal: debateCanal(),
    moderador: R.pick(["Carla Montenegro", "Julián Aráoz", "Mercedes Ledesma", "Tito Barreiro"]),
  };
  return S.debate;
}
function debatePendiente() { return !!(S && S.debate && S.debate.estado === "pendiente"); }
function preguntaDebate(id) { return id === "aporte" ? DEBATE_PREGUNTA_APORTE : id === "cierre" ? DEBATE_CIERRE : DEBATE_PREGUNTAS.find(p => p.id === id); }
function debatePreguntaActual() {
  const D = S.debate; if (!D || D.fase !== "pregunta") return null;
  const p = preguntaDebate(D.preguntas[D.ronda]);
  return { ...p, q: debateTexto(p.q), r: p.r.map(r => ({ ...r, t: debateTexto(r.t) })), numero: D.ronda + 1, total: D.preguntas.length };
}

// ---------- Resolución de una respuesta ----------
function tiradaDebate(c, attr, dif, extra = 0) {
  const v = (c[attr] || 5) / 10;
  const s = 0.12 + v - dif * 0.15 + extra + R.gauss() * 0.25;
  return s > 0.75 ? "brillante" : s > 0.45 ? "bien" : s > 0.2 ? "flojo" : "furcio";
}
const DEBATE_PTS = { brillante: 3, bien: 1.6, flojo: 0.2, furcio: -2 };
const DEBATE_MULT = { brillante: 1.4, bien: 1, flojo: 0.4, furcio: 0 };
const DEBATE_TXT = {
  brillante: ["Fue el momento de la noche: el público del estudio aplaude y el recorte ya circula en las redes.", "Los analistas coinciden: respuesta precisa, contundente y con datos.", "Le ganaste al reloj y dejaste una frase que mañana van a repetir todos los noticieros."],
  bien: ["Respuesta sólida, sin errores.", "Se te vio con seguridad y con datos en la mano.", "Respondiste con claridad, aunque sin un gran golpe de efecto."],
  flojo: ["Te fuiste por las ramas y se te acabó el tiempo.", "Respuesta correcta, pero sin convicción: no se te entendió la idea.", "El moderador te tuvo que cortar en la mitad de la frase."],
  furcio: ["Se te trabó la lengua y dijiste exactamente lo contrario de lo que querías decir.", "Diste una cifra equivocada y el chequeo en vivo te desmintió en pantalla.", "Te quedaste en blanco unos segundos eternos. El silencio se hizo meme.", "Leíste el machete y la cámara lo tomó en primer plano."],
};

function responderDebate(i) {
  const D = S.debate; if (!D || D.estado !== "pendiente" || D.fase !== "pregunta") return null;
  const p = preguntaDebate(D.preguntas[D.ronda]);
  const r = p.r[i]; if (!r) return null;
  const yo = S.jugador, esCierre = p.id === "cierre";
  const exp = debateExperiencia();
  let extra = 0;
  if (r.e === "tecnica") extra += 0.1 * exp;              // la trayectoria da respaldo a las respuestas de gestión
  if (r.e === "ataque" && exp < 0.2) extra += 0.05;       // el outsider pega más fuerte contra "la política"
  if (r.fx === "djj" && (S.riesgo || 0) > 20) extra -= 0.35; // mostrar la declaración jurada con aportes sospechosos es jugar con fuego
  let res = tiradaDebate(yo, r.a, r.d, extra);
  const notas = [];
  let pts = DEBATE_PTS[res] * (1 + r.d * 0.1);
  let mult = DEBATE_MULT[res] * (esCierre ? 1.3 : 1);
  // coherencia ideológica
  if (r.i >= 0) {
    const dist = Math.abs(r.i - yo.ideo);
    if (dist > 40) { pts -= 1.2; mult *= 0.5; D.img[yo.id] -= 0.8; notas.push("Un rival te recuerda que hace un año decías exactamente lo contrario. La respuesta suena poco creíble."); }
    else if (dist < 15 && res !== "furcio") { pts += 0.2; }
  }
  // efectos por grupo
  const scale = 0.065;
  const efecto = {};
  for (const g in r.g) {
    const v = r.g[g] > 0 ? r.g[g] * scale * mult : r.g[g] * scale * (res === "furcio" ? 1.3 : 1);
    efecto[g] = v; sumarEfecto(D, yo.id, g, v);
  }
  if (res === "furcio") {
    GRUPOS.forEach(g => { sumarEfecto(D, yo.id, g.id, -0.03); efecto[g.id] = (efecto[g.id] || 0) - 0.03; });
    D.img[yo.id] -= 1;
    titular(R.pick(MEDIOS).nombre, `Furcio de ${yo.nombre} en el debate`);
  }
  // ataques del jugador: golpean al puntero si salen bien, y rebotan si salen mal
  const puntero = debatePuntero();
  if (r.e === "ataque" && puntero) {
    const pc = debateCand(puntero);
    if (res === "brillante" || res === "bien") { D.pts[puntero] -= res === "brillante" ? 2 : 1; D.img[puntero] -= 0.6; notas.push(`${pc.nombre} acusa el golpe y no sabe qué contestar.`); }
    else { pts -= 1; D.img[yo.id] -= 0.6; notas.push(`El ataque te sale mal: ${pc.nombre} te responde con una chicana y el estudio se ríe.`); }
  }
  // efectos especiales
  if (r.fx === "djj") {
    if ((S.riesgo || 0) > 20 && res !== "brillante") { D.img[yo.id] -= 1.5; notas.push("Un periodista en la sala recuerda tus aportantes. La promesa de transparencia se vuelve en tu contra."); }
  }
  if (r.fx === "transparencia") { S.riesgo = (S.riesgo || 0) * 0.6; notas.push("Publicar los aportes baja el riesgo de que una investigación te explote más adelante."); }
  D.pts[yo.id] += pts;
  const yoRonda = { res, texto: R.pick(DEBATE_TXT[res]), notas, efecto, respuesta: debateTexto(r.t) };
  // los rivales también responden
  const rivales = esCierre ? cierreRivales() : turnoRivalesDebate();
  D.ultimo = { ronda: D.ronda, pregunta: debateTexto(p.q), tema: p.tema, yo: yoRonda, rivales };
  D.momentos.push({ ronda: D.ronda + 1, txt: `Vos: ${yoRonda.texto}`, tipo: res === "brillante" || res === "bien" ? "bueno" : "malo" });
  // derecho a réplica si te atacaron (hasta dos por debate)
  const ataque = rivales.find(x => x.tipo === "ataqueJugador");
  if (ataque && D.replicas < 2 && !esCierre) { D.fase = "replica"; D.replicaDe = ataque.id; D.ultimo.replica = { de: ataque.id, nombre: ataque.nombre, frase: ataque.frase, pego: ataque.pego }; }
  else avanzarDebate();
  return D.ultimo;
}

function avanzarDebate() {
  const D = S.debate;
  D.ronda++;
  D.fase = D.ronda >= D.preguntas.length ? "fin" : "pregunta";
}

// ---------- IA de los rivales en el estudio ----------
function frasesAtaque(c) {
  const yo = S.jugador, f = [], usadas = S.debate.frasesUsadas || (S.debate.frasesUsadas = []);
  if ((S.favores || []).length) f.push(`"¿Por qué no le cuenta a la gente qué le prometió a ${S.favores[S.favores.length - 1].aportante}?"`);
  if (debateExperiencia() < 0.2) f.push(`"No gestionó ni un kiosco y quiere manejar ${debateTerritorio() === "el país" ? "el país" : debateTerritorio()}."`);
  if (yo.ideo < 35) f.push(`"Sus recetas ya fundieron a Valdora tres veces."`);
  if (yo.ideo > 65) f.push(`"Representa a los bancos y a los que fugan."`);
  if (yo.partido !== "NUEVO" && PARTIDOS[yo.partido]) f.push(`"Su partido gobernó y nos dejó así. ¿De qué cambio habla?"`);
  if (yo.imagen < -3) f.push(`"La gente ya conoce su historia y por eso no le cree."`);
  f.push(`"Habla mucho, pero no presentó un solo número."`, `"Cambia de opinión según el canal en el que esté."`, `"Prometer es gratis: lo difícil es explicar con qué plata."`);
  const libres = f.filter(x => !usadas.includes(x));
  const fr = R.pick(libres.length ? libres : f);
  usadas.push(fr);
  return fr;
}

function accionRival(c, D, soloDos) {
  const ora = c.oratoria || 5;
  const pesos = {
    luce: ora * 0.3, correcta: 2.2, evasiva: 1, furcio: (11 - ora) * 0.22, chicana: 0.6,
    ataqueJugador: soloDos ? 2.2 : 0.9, ataqueRival: soloDos ? 0 : 0.7, enojo: 0.4, datoFalso: 0.5,
  };
  if (c.estrategia === "antisistema") { pesos.chicana += 2; pesos.ataqueJugador += 0.8; pesos.ataqueRival += 1; pesos.enojo += 1; }
  if (c.estrategia === "mediatica") { pesos.correcta += 1; pesos.luce += 0.8; }
  if (c.estrategia === "territorial") { pesos.correcta += 1; pesos.evasiva += 1; }
  if (c.estrategia === "calle") { pesos.ataqueRival += 1; pesos.chicana += 0.6; }
  // el que lidera las encuestas recibe más ataques
  const enc = S.ultimaEncuesta || {};
  const lider = Object.keys(enc).filter(id => D.part.includes(id)).sort((a, b) => enc[b] - enc[a])[0];
  if (lider === S.jugador.id) pesos.ataqueJugador += 1;
  const tot = Object.values(pesos).reduce((a, b) => a + b, 0);
  let x = R.rand() * tot;
  for (const k in pesos) { x -= pesos[k]; if (x <= 0) return k; }
  return "correcta";
}

function aplicarRival(c, tipo, D) {
  const yo = S.jugador, out = { id: c.id, nombre: c.nombre, partido: c.partido, tipo, texto: "", bueno: null };
  const cercanos = GRUPOS.filter(g => Math.abs(g.ideo - c.ideo) < 20);
  switch (tipo) {
    case "luce":
      D.pts[c.id] += 3; D.img[c.id] += 0.5; cercanos.forEach(g => sumarEfecto(D, c.id, g.id, 0.08));
      out.texto = R.pick(DEBATE_LUCE); out.bueno = true; break;
    case "correcta":
      D.pts[c.id] += 1.8; cercanos.forEach(g => sumarEfecto(D, c.id, g.id, 0.03));
      out.texto = "da una respuesta correcta, sin sobresaltos"; out.bueno = true; break;
    case "evasiva":
      D.pts[c.id] -= 0.5; out.texto = "esquiva la pregunta y habla de otra cosa"; out.bueno = false; break;
    case "furcio": {
      const f = R.pick(DEBATE_FURCIOS);
      D.pts[c.id] -= 2.5; D.img[c.id] -= 1; GRUPOS.forEach(g => sumarEfecto(D, c.id, g.id, -0.04));
      out.texto = f; out.bueno = false;
      titular(R.pick(MEDIOS).nombre, `Furcio de ${c.nombre} en el debate: ${f}`);
      break;
    }
    case "chicana":
      D.pts[c.id] += R.rand() < 0.6 ? 1.5 : -0.5;
      sumarEfecto(D, c.id, "jovenes", 0.12); sumarEfecto(D, c.id, "jubilados", -0.06); sumarEfecto(D, c.id, "media", -0.04);
      out.texto = R.pick(DEBATE_CHICANA); out.bueno = true; break;
    case "enojo":
      D.pts[c.id] -= 1.5; D.img[c.id] -= 0.5;
      if (c.estrategia === "antisistema") sumarEfecto(D, c.id, "jovenes", 0.08);
      out.texto = "pierde los estribos y le grita al moderador"; out.bueno = false; break;
    case "datoFalso":
      D.pts[c.id] -= 1.5; D.img[c.id] -= 0.5;
      out.texto = "tira un dato falso y el chequeo en vivo lo marca en rojo"; out.bueno = false; break;
    case "ataqueJugador": {
      const pego = R.rand() < 0.35 + (c.oratoria || 5) * 0.04 - (yo.oratoria || 5) * 0.025;
      out.frase = frasesAtaque(c); out.pego = pego;
      if (pego) { D.pts[c.id] += 1; D.pts[yo.id] -= 1.5; D.img[yo.id] -= 0.6; out.texto = `te ataca: ${out.frase} El golpe entra.`; out.bueno = true; }
      else { D.pts[c.id] -= 1.5; D.img[c.id] -= 0.5; sumarEfecto(D, c.id, "media", -0.05); out.texto = `te ataca: ${out.frase} Pero le sale mal: suena agresivo y el público abuchea.`; out.bueno = false; }
      break;
    }
    case "ataqueRival": {
      const otros = D.part.filter(id => id !== c.id && id !== yo.id);
      if (!otros.length) return aplicarRival(c, "correcta", D);
      const enc = S.ultimaEncuesta || {};
      const obj = R.rand() < 0.6 ? otros.slice().sort((a, b) => (enc[b] || 0) - (enc[a] || 0))[0] : R.pick(otros);
      const oc = debateCand(obj);
      if (R.rand() < 0.4 + (c.oratoria || 5) * 0.04) { D.pts[c.id] += 1; D.pts[obj] -= 1.5; D.img[obj] -= 0.5; out.texto = `acorrala a ${oc.nombre} con una pregunta incómoda`; out.bueno = true; }
      else { D.pts[c.id] -= 1.5; D.img[c.id] -= 0.5; out.texto = `ataca a ${oc.nombre}, pero el tiro le sale por la culata`; out.bueno = false; }
      break;
    }
  }
  return out;
}

function turnoRivalesDebate() {
  const D = S.debate, soloDos = D.part.length === 2;
  return D.part.filter(id => id !== S.jugador.id).map(id => {
    const c = debateCand(id);
    const out = aplicarRival(c, accionRival(c, D, soloDos), D);
    if (out.tipo === "furcio" || out.tipo === "luce" || (out.tipo === "ataqueJugador")) D.momentos.push({ ronda: D.ronda + 1, txt: `${c.nombre} ${out.texto}`, tipo: out.bueno ? "info" : "malo" });
    return out;
  });
}
function cierreRivales() {
  const D = S.debate;
  return D.part.filter(id => id !== S.jugador.id).map(id => {
    const c = debateCand(id);
    const res = tiradaDebate(c, "carisma", 1);
    D.pts[id] += DEBATE_PTS[res];
    if (res === "furcio") D.img[id] -= 0.5;
    return { id, nombre: c.nombre, partido: c.partido, tipo: "cierre" + res, bueno: res === "brillante" || res === "bien",
      texto: { brillante: "cierra con un mensaje que emociona", bien: "cierra con un mensaje correcto", flojo: "se queda sin tiempo en el cierre", furcio: "se equivoca de cámara en el minuto final" }[res] };
  });
}

// ---------- Réplica ----------
function replicarDebate(i) {
  const D = S.debate; if (!D || D.fase !== "replica") return null;
  const op = DEBATE_REPLICA[i]; if (!op) return null;
  const yo = S.jugador, c = debateCand(D.replicaDe);
  const res = tiradaDebate(yo, op.a, op.d, op.e === "tecnica" ? 0.08 * debateExperiencia() : 0);
  let texto;
  if (op.e === "tecnica") {
    if (res === "brillante" || res === "bien") { D.pts[yo.id] += 2; D.pts[c.id] -= 1; texto = `Mostrás los números y desarmás la acusación de ${c.nombre}.`; }
    else { D.pts[yo.id] -= 0.5; texto = "Buscás el papel, no lo encontrás y se te va el tiempo."; }
  } else if (op.e === "ataque") {
    if (res === "brillante") { D.pts[yo.id] += 3; D.pts[c.id] -= 2; D.img[c.id] -= 0.8; sumarEfecto(D, yo.id, "jovenes", 0.1); texto = `Tu respuesta es demoledora: ${c.nombre} se queda sin palabras y el clip es lo más visto de la noche.`; }
    else if (res === "bien") { D.pts[yo.id] += 1.5; D.pts[c.id] -= 1; texto = `Le devolvés el golpe a ${c.nombre} con ironía. El estudio se ríe.`; }
    else { D.pts[yo.id] -= 2; D.img[yo.id] -= 0.8; sumarEfecto(D, yo.id, "jubilados", -0.05); sumarEfecto(D, yo.id, "media", -0.05); texto = "La ironía no funciona: quedás a la defensiva y se arma un griterío."; }
  } else {
    if (res !== "furcio") { D.pts[yo.id] += 1; sumarEfecto(D, yo.id, "media", 0.05); sumarEfecto(D, yo.id, "jubilados", 0.04); texto = "Te mostrás por encima de la pelea. Los indecisos lo valoran."; }
    else { D.pts[yo.id] -= 0.5; texto = "Intentás no responder, pero parece que no tenés qué decir."; }
  }
  D.replicas++;
  D.momentos.push({ ronda: D.ronda + 1, txt: `Réplica: ${texto}`, tipo: res === "furcio" || res === "flojo" ? "malo" : "bueno" });
  D.ultimo.replicaRes = { res, texto };
  avanzarDebate();
  return D.ultimo.replicaRes;
}

// ---------- Cierre y repercusiones ----------
function cerrarDebate() {
  const D = S.debate; if (!D || D.estado !== "pendiente") return null;
  const yo = S.jugador;
  const orden = D.part.slice().sort((a, b) => D.pts[b] - D.pts[a]);
  // encuesta flash: quién ganó el debate
  const ex = orden.map(id => Math.exp(D.pts[id] / 3));
  const tot = ex.reduce((a, b) => a + b, 0);
  const flash = Object.fromEntries(orden.map((id, k) => [id, 100 * ex[k] / tot]));
  // efectos en los candidatos
  const n = orden.length;
  orden.forEach((id, k) => {
    const c = debateCand(id);
    const bonus = k === 0 ? 3 : k === 1 && n > 2 ? 1 : k === n - 1 ? -2 : 0;
    c.imagen += bonus + D.img[id];
    for (const g in (D.efectos[id] || {})) c.sym[g] = (c.sym[g] || 0) + D.efectos[id][g];
    const vis = c.esJugador ? 0.04 : 0.025;
    for (const p of PROVINCIAS) c.know[p.id] = Math.min(1, (c.know[p.id] || 0) + vis);
  });
  // la prensa: cada medio ve el debate según su línea editorial
  const medios = MEDIOS.slice().sort(() => R.rand() - 0.5).slice(0, 3);
  const titulares = medios.map(m => {
    const ganador = D.part.slice().sort((a, b) => (D.pts[b] + (100 - Math.abs(m.afinidad - debateCand(b).ideo)) / 25) - (D.pts[a] + (100 - Math.abs(m.afinidad - debateCand(a).ideo)) / 25))[0];
    const gc = debateCand(ganador);
    const txt = R.pick([`Para ${m.nombre}, ${gc.nombre} ganó el debate`, `${gc.nombre} se impuso en el debate`, `Debate: ${gc.nombre} tuvo la noche más sólida`]);
    titular(m.nombre, txt);
    return { medio: m.nombre, txt, ganador };
  });
  const miPos = orden.indexOf(yo.id) + 1;
  const titulo = D.tipo === "balotaje" ? "Debate del balotaje" : `Debate de candidatos a ${debateNombreCargo()}`;
  const texto = `${titulo}: según la encuesta flash ganó ${debateCand(orden[0]).nombre} (${fmt(flash[orden[0]], 0)}%). Vos quedaste ${miPos}º de ${n}.`;
  log(texto, miPos === 1 ? "bueno" : miPos === n ? "malo" : "info");
  D.estado = "cerrado"; D.fase = "fin";
  D.resultado = { orden, flash, titulares, miPos, efectoYo: D.efectos[yo.id] || {}, imagenYo: (miPos === 1 ? 3 : miPos === 2 && n > 2 ? 1 : miPos === n ? -2 : 0) + D.img[yo.id] };
  S.debatesJugados = (S.debatesJugados || 0) + 1;
  if (S.fase === "campana") S.ultimaEncuesta = encuesta();
  return { titulo, texto, tipo: miPos === 1 ? "bueno" : miPos === n ? "malo" : "info" };
}

// Faltar al debate: silla vacía
function faltarDebate() {
  const D = S.debate; if (!D || D.estado !== "pendiente") return null;
  const yo = S.jugador;
  D.pts[yo.id] = -6; D.img[yo.id] -= 2;
  D.part.filter(id => id !== yo.id).forEach(id => { D.pts[id] += 1.5 + R.rand() * 2; });
  GRUPOS.forEach(g => sumarEfecto(D, yo.id, g.id, -0.04));
  titular(R.pick(MEDIOS).nombre, `Silla vacía: ${yo.nombre} faltó al debate`);
  D.momentos.push({ ronda: 1, txt: "Faltaste al debate. Los rivales le hablan a tu silla vacía toda la noche.", tipo: "malo" });
  return cerrarDebate();
}

// Sin interfaz: el jugador responde en piloto automático (lo que mejor le sale)
function resolverDebateAuto() {
  const D = S.debate; let g = 0;
  while (D && D.estado === "pendiente" && g++ < 30) {
    if (D.fase === "pregunta") {
      const p = preguntaDebate(D.preguntas[D.ronda]);
      let best = 0, bv = -99;
      p.r.forEach((r, k) => { const v = (S.jugador[r.a] || 5) - r.d * 1.5 - (r.i >= 0 ? Math.abs(r.i - S.jugador.ideo) / 15 : 0) + R.rand(); if (v > bv) { bv = v; best = k; } });
      responderDebate(best);
    } else if (D.fase === "replica") replicarDebate(2);
    else return cerrarDebate();
  }
  return null;
}

// ---------- Enganche con la campaña ----------
// El debate de la semana 9 (y el del balotaje) se juegan como escena interactiva
debate = function () {
  crearDebate("general");
  const t = `Esta noche se transmite por ${S.debate.canal} el debate de candidatos a ${debateNombreCargo()}${debateTerritorio() !== "el país" ? ` de ${debateTerritorio()}` : ""}. Modera ${S.debate.moderador}. ${S.debate.part.length} candidatos, ${S.debate.preguntas.length - 1} preguntas sorteadas y un minuto final.`;
  log("Se viene el debate televisado.", "aviso");
  return { titulo: "Debate televisado", texto: t, tipo: "aviso", debate: true };
};

const _terminarSemanaDebate = terminarSemana;
terminarSemana = function () {
  // si el debate quedó sin jugar (partida sin interfaz o recargada), se juega solo antes de seguir
  if (debatePendiente()) resolverDebateAuto();
  const ev = _terminarSemanaDebate.apply(this, arguments);
  if (S.fase === "campana" && S.balotaje && !S.perdio && !S.debateBalotaje) {
    S.debateBalotaje = true;
    crearDebate("balotaje");
    const [a, b] = S.debate.part.map(debateCand);
    ev.push({ titulo: "Debate del balotaje", texto: `Mano a mano: ${a.nombre} y ${b.nombre} se ven las caras por ${S.debate.canal}. Es el último gran momento de la campaña.`, tipo: "aviso", debate: true });
  }
  return ev;
};
