// =============================================================
//  VALDORA - Datos del juego
//  Todo lo que es "contenido" vive acá: provincias, grupos,
//  partidos, medios, aportantes, medidas y eventos.
//  Se puede ampliar sin tocar la lógica (engine.js).
// =============================================================

const GRUPOS = [
  { id: "jovenes",      nombre: "Jóvenes",               ideo: 52, volatil: 1.4, prioridades: "Empleo, redes, libertad, educación" },
  { id: "jubilados",    nombre: "Jubilados",             ideo: 45, volatil: 0.7, prioridades: "Haberes, salud, medicamentos" },
  { id: "trabajadores", nombre: "Trabajadores formales", ideo: 40, volatil: 0.9, prioridades: "Salario real, paritarias" },
  { id: "informales",   nombre: "Informales",            ideo: 36, volatil: 1.1, prioridades: "Planes sociales, precios, seguridad" },
  { id: "media",        nombre: "Clase media",           ideo: 58, volatil: 1.1, prioridades: "Inflación, impuestos, corrupción" },
  { id: "campo",        nombre: "Campo",                 ideo: 72, volatil: 0.8, prioridades: "Retenciones, tipo de cambio" },
  { id: "empresarios",  nombre: "Empresarios",           ideo: 70, volatil: 0.8, prioridades: "Reglas claras, cepo, impuestos" },
  { id: "estatales",    nombre: "Estatales",             ideo: 38, volatil: 0.8, prioridades: "Salarios públicos, estabilidad" },
];

// Mezcla de grupos por perfil de provincia (suma ~100) y corrimiento ideológico
const PERFILES = {
  conurbano: { mix: { jovenes: 18, jubilados: 13, trabajadores: 18, informales: 24, media: 12, campo: 1, empresarios: 2, estatales: 12 }, shift: -6 },
  capital:   { mix: { jovenes: 20, jubilados: 17, trabajadores: 14, informales: 6,  media: 28, campo: 0, empresarios: 6, estatales: 9 },  shift: +8 },
  agro:      { mix: { jovenes: 17, jubilados: 14, trabajadores: 17, informales: 12, media: 20, campo: 10, empresarios: 3, estatales: 7 }, shift: +7 },
  cuyo:      { mix: { jovenes: 18, jubilados: 13, trabajadores: 16, informales: 14, media: 18, campo: 8, empresarios: 3, estatales: 10 }, shift: +5 },
  norte:     { mix: { jovenes: 20, jubilados: 11, trabajadores: 11, informales: 26, media: 9,  campo: 5, empresarios: 1, estatales: 17 }, shift: -8 },
  patagonia: { mix: { jovenes: 19, jubilados: 10, trabajadores: 22, informales: 10, media: 14, campo: 3, empresarios: 2, estatales: 20 }, shift: -2 },
};

// Mapa esquemático: col, fila, ancho, alto (en celdas)
const PROVINCIAS = [
  { id: "puna",       nombre: "Puna",                  x: 1, y: 0, pob: 1.7,  dip: 6,  perfil: "norte" },
  { id: "salinas",    nombre: "Salinas",               x: 2, y: 0, pob: 3.1,  dip: 7,  perfil: "norte" },
  { id: "banados",    nombre: "Bañados",               x: 3, y: 0, pob: 1.3,  dip: 5,  perfil: "norte" },
  { id: "ambato",     nombre: "Ambato",                x: 0, y: 1, pob: 0.9,  dip: 5,  perfil: "norte" },
  { id: "canaveral",  nombre: "Cañaveral",             x: 1, y: 1, pob: 3.7,  dip: 9,  perfil: "norte" },
  { id: "quebracho",  nombre: "Quebracho",             x: 2, y: 1, pob: 2.2,  dip: 7,  perfil: "norte" },
  { id: "montaraz",   nombre: "Montaraz",              x: 3, y: 1, pob: 2.6,  dip: 7,  perfil: "norte" },
  { id: "esteros",    nombre: "Esteros",               x: 4, y: 1, pob: 2.7,  dip: 7,  perfil: "norte" },
  { id: "yerbales",   nombre: "Yerbales",              x: 5, y: 1, pob: 2.8,  dip: 7,  perfil: "norte" },
  { id: "famatina",   nombre: "Famatina",              x: 0, y: 2, pob: 0.8,  dip: 5,  perfil: "norte" },
  { id: "sierras",    nombre: "Sierras Centrales",     x: 1, y: 2, w: 2, pob: 8.2, dip: 18, perfil: "agro" },
  { id: "litoral",    nombre: "Litoral",               x: 3, y: 2, pob: 7.8,  dip: 19, perfil: "agro" },
  { id: "islas",      nombre: "Islas del Paraná",      x: 4, y: 2, pob: 3.1,  dip: 9,  perfil: "agro" },
  { id: "zonda",      nombre: "Zonda",                 x: 0, y: 3, pob: 1.8,  dip: 6,  perfil: "cuyo" },
  { id: "cuyoseco",   nombre: "Cuyo Seco",             x: 1, y: 3, pob: 1.2,  dip: 5,  perfil: "cuyo" },
  { id: "granribera", nombre: "Gran Ribera",           x: 2, y: 3, w: 2, h: 2, pob: 38, dip: 70, perfil: "conurbano" },
  { id: "capital",    nombre: "Capital Federal",       x: 4, y: 3, pob: 6.8,  dip: 25, perfil: "capital" },
  { id: "cordillera", nombre: "Cordillera",            x: 0, y: 4, pob: 4.3,  dip: 10, perfil: "cuyo" },
  { id: "pampaseca",  nombre: "Pampa Seca",            x: 1, y: 4, pob: 0.8,  dip: 5,  perfil: "agro" },
  { id: "confluencia",nombre: "Confluencia",           x: 0, y: 5, pob: 1.5,  dip: 5,  perfil: "patagonia" },
  { id: "valle",      nombre: "Valle del Río",         x: 1, y: 5, pob: 1.6,  dip: 5,  perfil: "patagonia" },
  { id: "meseta",     nombre: "Meseta",                x: 1, y: 6, pob: 1.3,  dip: 5,  perfil: "patagonia" },
  { id: "glaciares",  nombre: "Glaciares",             x: 1, y: 7, pob: 0.8,  dip: 5,  perfil: "patagonia" },
  { id: "findelmundo",nombre: "Fin del Mundo",         x: 2, y: 8, pob: 0.4,  dip: 5,  perfil: "patagonia" },
];

// Partidos nacionales. "fuerza" = bonus territorial por perfil.
const PARTIDOS = {
  MNJ: { id: "MNJ", nombre: "Movimiento Nacional Justicialista", corto: "MNJ", color: "#2f7fd6", ideo: 35,
         fuerza: { conurbano: 0.6, norte: 0.55, patagonia: 0.3, capital: -0.4, agro: -0.1, cuyo: 0 },
         interna: "PASO", lider: "Doña Estela Arancibia", candidato: "Ramiro Echeverry",
         desc: "Movimiento popular con sindicatos, intendentes y gobernadores." },
  UR:  { id: "UR", nombre: "Unión Republicana", corto: "UR", color: "#d93a3a", ideo: 50,
         fuerza: { conurbano: -0.1, norte: 0, patagonia: 0, capital: 0.2, agro: 0.35, cuyo: 0.3 },
         interna: "cerrada", lider: "Convención Nacional", candidato: "Aníbal Ferreyra",
         desc: "Partido centenario de clase media, comités en todo el país." },
  FC:  { id: "FC", nombre: "Frente por el Cambio", corto: "FC", color: "#e6b800", ideo: 64,
         fuerza: { conurbano: -0.1, norte: -0.3, patagonia: -0.1, capital: 0.6, agro: 0.35, cuyo: 0.25 },
         interna: "dedo", lider: "El Ingeniero Bruno Castell", candidato: "Lucía Barrientos",
         desc: "Coalición de centroderecha nacida en la Capital." },
  LY:  { id: "LY", nombre: "Libertad Ya", corto: "LY", color: "#7b3fb8", ideo: 82,
         fuerza: { conurbano: 0, norte: 0.1, patagonia: 0, capital: 0.15, agro: 0.1, cuyo: 0.2 },
         interna: "dedo", lider: "El Profesor Gaspar Vilches", candidato: "Tomás Iriarte",
         desc: "Partido nuevo antisistema, liberal en economía, fuerte en redes." },
  FT:  { id: "FT", nombre: "Frente de Trabajadores", corto: "FT", color: "#8b1a1a", ideo: 10,
         fuerza: { conurbano: 0.05, norte: 0.1, patagonia: 0.1, capital: 0.05, agro: -0.2, cuyo: 0 },
         interna: "PASO", lider: "Mesa de dirección", candidato: "Elena Quiroga",
         desc: "Izquierda trotskista con piso fijo y movilización callejera." },
  PROV:{ id: "PROV", nombre: "Partidos provinciales", corto: "Prov.", color: "#4caf50", ideo: 45,
         fuerza: {}, desc: "Fuerzas locales que negocian con quien gobierne." },
};

// Atributos de los candidatos de la IA
const RIVALES_BASE = {
  MNJ: { carisma: 7, oratoria: 6, gestion: 5, negociacion: 8, estrategia: "territorial", plata: 9 },
  UR:  { carisma: 4, oratoria: 6, gestion: 7, negociacion: 6, estrategia: "territorial", plata: 4 },
  FC:  { carisma: 6, oratoria: 5, gestion: 7, negociacion: 6, estrategia: "mediatica",   plata: 10 },
  LY:  { carisma: 8, oratoria: 8, gestion: 3, negociacion: 3, estrategia: "antisistema", plata: 4 },
  FT:  { carisma: 5, oratoria: 7, gestion: 4, negociacion: 2, estrategia: "calle",       plata: 1.5 },
};

const MEDIOS = [
  { id: "faro",      nombre: "Diario El Faro",        afinidad: 60, alcance: { media: 1, empresarios: 1, campo: 0.8, jubilados: 0.8 } },
  { id: "canal9",    nombre: "Canal Federal Noticias",      afinidad: 50, alcance: { jubilados: 1, informales: 0.8, trabajadores: 0.8, media: 0.7 } },
  { id: "paginasur", nombre: "Página Sur",            afinidad: 30, alcance: { estatales: 1, media: 0.6, jovenes: 0.5 } },
  { id: "continental",nombre: "Radio Pampa",    afinidad: 48, alcance: { trabajadores: 0.9, jubilados: 0.9, campo: 0.6 } },
  { id: "stream",    nombre: "Canal de streaming La Posta", afinidad: 75, alcance: { jovenes: 1.3, media: 0.5 } },
  { id: "agro",      nombre: "Revista Tranquera",     afinidad: 70, alcance: { campo: 1.4, empresarios: 0.6 } },
];

const ENCUESTADORAS = [
  { nombre: "Consultora Delfos", sesgo: { FC: 1.5, LY: 1 }, error: 2.5 },
  { nombre: "Opinión Federal",   sesgo: { MNJ: 1.5 },        error: 3 },
  { nombre: "Zubiría & Asoc.",     sesgo: {},                  error: 2 },
  { nombre: "Encuesta Rápida Online", sesgo: { LY: 3 },      error: 4.5 },
];

// Aportantes: ofrecen plata a cambio de favores. riesgo = puntos de escándalo
const APORTANTES = [
  { nombre: "Constructora Del Plata S.A.", monto: 4,   favor: "obra pública adjudicada", riesgo: 18, sector: "empresarios" },
  { nombre: "Sociedad Rural del Sur",      monto: 2.5, favor: "bajar retenciones",       riesgo: 6,  sector: "campo" },
  { nombre: "Banco Cóndor",                monto: 3,   favor: "nombrar al presidente del Banco Central", riesgo: 12, sector: "empresarios" },
  { nombre: "Sindicato de Camioneros",     monto: 2,   favor: "no tocar la ley de obras sociales", riesgo: 8,  sector: "trabajadores" },
  { nombre: "Empresario de juego Lito Báez", monto: 5, favor: "licencias de casinos", riesgo: 30, sector: "empresarios" },
  { nombre: "Grupo de medios Horizonte",   monto: 3.5, favor: "renovar licencias sin licitación", riesgo: 14, sector: "media" },
  { nombre: "Petrolera Austral",           monto: 4,   favor: "extender concesiones",    riesgo: 15, sector: "empresarios" },
  { nombre: "Aportante anónimo (\"cuevas\")", monto: 6, favor: "un favor que se cobrará después", riesgo: 40, sector: null },
  { nombre: "Cámara de la Mediana Empresa", monto: 1.5, favor: "crédito blando para pymes", riesgo: 3, sector: "empresarios" },
];

// Pactos sectoriales: efecto sobre simpatía por grupo
const SECTORES = {
  sindicatos:  { nombre: "CGT y sindicatos",      efectos: { trabajadores: 0.35, estatales: 0.3, empresarios: -0.15, media: -0.05 }, compromiso: "No reforma laboral, paritarias libres" },
  campo:       { nombre: "Mesa del campo",        efectos: { campo: 0.5, empresarios: 0.1, informales: -0.05 },               compromiso: "Bajar retenciones" },
  empresarios: { nombre: "Unión Industrial",      efectos: { empresarios: 0.4, media: 0.05, trabajadores: -0.05 },             compromiso: "Bajar impuestos y levantar el cepo", plata: 2 },
  movimientos: { nombre: "Movimientos sociales",  efectos: { informales: 0.4, jovenes: 0.05, media: -0.15 },                   compromiso: "Mantener planes sociales" },
  iglesia:     { nombre: "Obispado y parroquias", efectos: { jubilados: 0.2, informales: 0.15, jovenes: -0.1 },                compromiso: "Ayuda alimentaria y cero aborto en agenda" },
};

// =============================================================
//  GOBIERNO
// =============================================================

const AREAS = [
  { id: "educacion",  nombre: "Educación",          base: 1.2 },
  { id: "salud",      nombre: "Salud",              base: 1.0 },
  { id: "seguridad",  nombre: "Seguridad",          base: 0.6 },
  { id: "defensa",    nombre: "Defensa",            base: 0.5 },
  { id: "infra",      nombre: "Infraestructura",    base: 1.0 },
  { id: "social",     nombre: "Desarrollo social",  base: 1.6 },
  { id: "ciencia",    nombre: "Ciencia",            base: 0.3 },
  { id: "produccion", nombre: "Producción",         base: 0.5 },
];

// materia: restricciones constitucionales del DNU (art. 99 inc. 3)
// instrumentos posibles: "resolucion", "decreto", "dnu", "ley"
// ef = efectos inmediatos; dur = efectos por trimestre durante N trimestres
const MEDIDAS = [
  { id: "aumentoJub", nombre: "Aumento extraordinario a jubilados", materia: "social", ideo: 30,
    inst: ["decreto", "dnu", "ley"], ef: { deficit: 0.4, tension: -4, imagen: 3 }, grupos: { jubilados: 0.4 } },
  { id: "auh", nombre: "Asignación universal por hijo", materia: "social", ideo: 30,
    inst: ["dnu", "ley"], ef: { deficit: 0.5, pobreza: -3, tension: -6 }, grupos: { informales: 0.5, media: -0.1 } },
  { id: "retenciones", nombre: "Bajar retenciones al campo", materia: "tributaria", ideo: 70,
    inst: ["ley", "decreto"], ef: { deficit: 0.3, reservas: 1500, crecimiento: 0.4 }, grupos: { campo: 0.6, informales: -0.1 } },
  { id: "retMoviles", nombre: "Retenciones móviles a la soja", materia: "tributaria", ideo: 30,
    inst: ["ley", "resolucion"], ef: { deficit: -0.4, crecimiento: -0.3, tension: 6 }, grupos: { campo: -0.8, media: -0.2, informales: 0.1 } },
  { id: "cepo", nombre: "Cepo cambiario", materia: "economica", ideo: 30,
    inst: ["resolucion", "decreto"], ef: { reservas: 3000, crecimiento: -0.5, inflacion: 0.3 }, grupos: { media: -0.4, empresarios: -0.3 } },
  { id: "levantarCepo", nombre: "Levantar el cepo y unificar el dólar", materia: "economica", ideo: 72,
    inst: ["resolucion", "decreto"], ef: { reservas: -4000, inflacion: 2.5, crecimiento: 0.6, tension: 5 }, grupos: { empresarios: 0.5, campo: 0.4, media: 0.1, informales: -0.3 } },
  { id: "devaluar", nombre: "Devaluación del peso", materia: "economica", ideo: 60,
    inst: ["resolucion"], ef: { reservas: 2500, inflacion: 3, pobreza: 3, tension: 8, crecimiento: 0.3 }, grupos: { campo: 0.4, trabajadores: -0.4, jubilados: -0.3 } },
  { id: "ajuste", nombre: "Ajuste fiscal (\"motosierra\")", materia: "economica", ideo: 80,
    inst: ["decreto", "dnu", "ley"], ef: { deficit: -1.5, inflacion: -1, crecimiento: -0.8, tension: 10, desempleo: 0.8 }, grupos: { estatales: -0.7, jubilados: -0.4, empresarios: 0.4, media: 0.2 } },
  { id: "reformaLaboral", nombre: "Reforma laboral", materia: "laboral", ideo: 75,
    inst: ["dnu", "ley"], ef: { crecimiento: 0.4, desempleo: -0.4, tension: 9 }, grupos: { trabajadores: -0.6, empresarios: 0.6 } },
  { id: "megaDNU", nombre: "Megadecreto de desregulación", materia: "economica", ideo: 85,
    inst: ["dnu"], ef: { crecimiento: 0.5, legitimidad: -6, tension: 6 }, grupos: { empresarios: 0.5, trabajadores: -0.3, estatales: -0.3 } },
  { id: "privatizar", nombre: "Privatizar empresas públicas", materia: "economica", ideo: 80,
    inst: ["ley"], ef: { reservas: 3000, deficit: -0.4, desempleo: 0.5, tension: 7 }, grupos: { estatales: -0.6, empresarios: 0.4 } },
  { id: "estatizar", nombre: "Estatizar la petrolera", materia: "economica", ideo: 25,
    inst: ["ley", "dnu"], ef: { reservas: -2000, crecimiento: -0.2, imagen: 4 }, grupos: { estatales: 0.3, trabajadores: 0.2, empresarios: -0.6 } },
  { id: "precios", nombre: "Acuerdo de precios cuidados", materia: "economica", ideo: 35,
    inst: ["resolucion"], ef: { inflacion: -0.6, tension: -2 }, grupos: { informales: 0.15, jubilados: 0.15, empresarios: -0.2 } },
  { id: "subaIVA", nombre: "Subir el IVA", materia: "tributaria", ideo: 55,
    inst: ["ley"], ef: { deficit: -1, inflacion: 0.6, pobreza: 1.5, tension: 7 }, grupos: { informales: -0.4, media: -0.3 } },
  { id: "bajaGanancias", nombre: "Bajar el impuesto a las Ganancias", materia: "tributaria", ideo: 55,
    inst: ["ley"], ef: { deficit: 0.5, imagen: 3 }, grupos: { trabajadores: 0.4, media: 0.3 } },
  { id: "blanqueo", nombre: "Blanqueo de capitales", materia: "tributaria", ideo: 65,
    inst: ["ley"], ef: { reservas: 4000, legitimidad: -3 }, grupos: { empresarios: 0.3, media: -0.1 } },
  { id: "codigoPenal", nombre: "Endurecer penas (reforma penal)", materia: "penal", ideo: 75,
    inst: ["ley"], ef: { inseguridad: -4, imagen: 2 }, grupos: { media: 0.3, jubilados: 0.2, jovenes: -0.2 } },
  { id: "planSeguridad", nombre: "Plan federal de seguridad", materia: "seguridad", ideo: 60,
    inst: ["resolucion", "decreto"], ef: { inseguridad: -5, deficit: 0.3 }, grupos: { media: 0.2, informales: 0.1 } },
  { id: "obraPublica", nombre: "Plan de obra pública federal", materia: "economica", ideo: 40,
    inst: ["decreto", "ley"], ef: { deficit: 0.7, crecimiento: 0.7, desempleo: -0.6 }, grupos: { trabajadores: 0.3, empresarios: 0.2 } },
  { id: "universidades", nombre: "Ley de financiamiento universitario", materia: "social", ideo: 35,
    inst: ["ley"], ef: { deficit: 0.3, imagen: 2 }, grupos: { jovenes: 0.4, media: 0.2, estatales: 0.2 } },
  { id: "leyMedios", nombre: "Ley de medios audiovisuales", materia: "comunicacion", ideo: 25,
    inst: ["ley"], ef: { legitimidad: -2, tension: 3 }, grupos: { estatales: 0.1, media: -0.3 }, efectoPrensa: true },
  { id: "boletaUnica", nombre: "Boleta única de papel", materia: "electoral", ideo: 55,
    inst: ["ley"], ef: { legitimidad: 5 }, grupos: { media: 0.2 } },
  { id: "eliminarPASO", nombre: "Suspender las PASO", materia: "electoral", ideo: 55,
    inst: ["ley"], ef: { deficit: -0.05, legitimidad: -1 }, grupos: {} },
  { id: "convertibilidad", nombre: "Convertibilidad: un peso igual a un dólar", materia: "economica", ideo: 70,
    inst: ["ley"], ef: { inflacion: -30, crecimiento: 2, imagen: 8, legitimidad: 3 }, grupos: { media: 0.4, empresarios: 0.3 }, especial: "convertibilidad" },
  { id: "planAustral", nombre: "Plan de estabilización con moneda nueva", materia: "economica", ideo: 50,
    inst: ["decreto", "dnu"], ef: { inflacion: -12, imagen: 6 }, grupos: { media: 0.2, jubilados: 0.15 }, especial: "austral" },
  { id: "planJefes", nombre: "Plan Jefas y Jefes de Hogar", materia: "social", ideo: 35,
    inst: ["decreto", "dnu", "ley"], ef: { pobreza: -5, tension: -10, deficit: 0.6, imagen: 3 }, grupos: { informales: 0.4 } },
  { id: "pesificacion", nombre: "Salida del corralito y pesificación", materia: "economica", ideo: 45,
    inst: ["dnu", "ley"], ef: { tension: -6, inflacion: 2, crecimiento: 1.5, reservas: 2000 }, grupos: { media: -0.3, empresarios: 0.2 } },
  { id: "ampliarCorte", nombre: "Ampliar la Corte Suprema a 9 miembros", materia: "judicial", ideo: 50,
    inst: ["ley"], ef: { legitimidad: -8 }, grupos: { media: -0.3 }, efectoCorte: true },
];

// Eventos de gobierno (por trimestre)
const EVENTOS_GOB = [
  { id: "paroCGT", titulo: "Paro general de la CGT", cond: s => s.ind.tension > 45, peso: 3,
    texto: "La CGT para el país contra el plan económico.", ef: { crecimiento: -0.2, imagen: -2, tension: 3 } },
  { id: "sequia", titulo: "Sequía histórica en la llanura", peso: 1.5,
    texto: "La cosecha cae un 30%. Menos dólares y menos recaudación.", ef: { reservas: -3000, crecimiento: -1, deficit: 0.3 } },
  { id: "tasas", titulo: "La Federación del Norte sube sus tasas", peso: 1.5,
    texto: "Los capitales vuelven al Norte. Sube el riesgo país.", ef: { reservas: -2000, inflacion: 0.5 } },
  { id: "soja", titulo: "La soja vuela en Chicago", peso: 1.2,
    texto: "Los precios internacionales disparan las exportaciones.", ef: { reservas: 3500, crecimiento: 0.6, deficit: -0.2 } },
  { id: "causa", titulo: "Un juez federal abre una causa por sobreprecios", cond: s => s.riesgo > 20, peso: 3,
    texto: "La causa apunta a funcionarios cercanos. La prensa opositora la pone en tapa.", ef: { imagen: -6, legitimidad: -5 }, causa: true },
  { id: "cacerolazo", titulo: "Cacerolazo en la Capital", cond: s => s.ind.inflacion > 5 || s.ind.inseguridad > 70, peso: 2,
    texto: "Miles de vecinos golpean cacerolas en las esquinas.", ef: { imagen: -3, tension: 4 } },
  { id: "saqueos", titulo: "Saqueos en el conurbano", cond: s => s.ind.tension > 72, peso: 4,
    texto: "Supermercados saqueados en Gran Ribera. El gobierno debe responder.", ef: { tension: 6, imagen: -5, legitimidad: -4 }, decision: "saqueos" },
  { id: "inversion", titulo: "La República Popular del Este ofrece inversiones", peso: 1,
    texto: "Ofrece financiar represas a cambio de una base de observación espacial.", decision: "este" },
  { id: "campoPara", titulo: "Paro y cortes del campo", cond: s => s.medidasActivas.includes("retMoviles"), peso: 5,
    texto: "Tractorazo y cortes de ruta. El conflicto escala como en 2008.", ef: { crecimiento: -0.4, tension: 5, imagen: -4 } },
  { id: "fmiRevision", titulo: "Revisión trimestral del Fondo", cond: s => s.fmi && s.fmi.activo, peso: 6, decision: "fmi" },
  { id: "pandemia", titulo: "Llega una pandemia global", peso: 0.3, unico: true,
    texto: "El mundo entra en cuarentena. El PBI se desploma.", ef: { crecimiento: -4, deficit: 3, desempleo: 3, imagen: 6 } },
  { id: "inundacion", titulo: "Inundaciones en el Litoral", peso: 1,
    texto: "Miles de evacuados. Se pide ayuda del Estado nacional.", ef: { deficit: 0.2, imagen: -1 } },
  { id: "gasNC", titulo: "Récord de producción de gas no convencional", peso: 1,
    texto: "Confluencia exporta gas por primera vez en décadas.", ef: { reservas: 2500, crecimiento: 0.4 } },
  { id: "mundial", titulo: "¡Valdora campeón del Mundial!", peso: 0.3, unico: true,
    texto: "Millones festejan en las calles. Por unos días nadie habla de la economía.", ef: { imagen: 5, tension: -8 } },
];

// Leyes que la oposición puede aprobar (para el veto)
const LEYES_OPOSICION = [
  { nombre: "Ley de movilidad jubilatoria", ef: { deficit: 0.6, tension: -3 }, grupos: { jubilados: 0.3 } },
  { nombre: "Ley de financiamiento universitario", ef: { deficit: 0.3 }, grupos: { jovenes: 0.3, estatales: 0.2 } },
  { nombre: "Emergencia en discapacidad", ef: { deficit: 0.2 }, grupos: { jubilados: 0.1 } },
  { nombre: "Reparto automático de ATN a las provincias", ef: { deficit: 0.3 }, grupos: {}, gobernadores: 15 },
  { nombre: "Ley que limita los DNU", ef: { legitimidad: 3 }, grupos: { media: 0.1 }, limitaDNU: true },
];

const POTENCIAS = [
  { id: "norte", nombre: "Federación del Norte" },
  { id: "este",  nombre: "República Popular del Este" },
  { id: "ucon",  nombre: "Unión Continental" },
  { id: "brasil",nombre: "Brasilia del Sur" },
];
