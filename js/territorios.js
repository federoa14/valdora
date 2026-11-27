// =============================================================
//  VALDORA - Territorios: las 24 provincias y los municipios jugables
//  Cada territorio tiene su Legislatura o Concejo (unicameral o
//  bicameral, bancas, renovación, sistema electoral, premio de
//  mayoría) y su dificultad de gobierno (dependencia de la Nación,
//  regalías, deuda, pobreza, conflictividad, intendentes, gremios).
//
//  Los números son APROXIMACIONES inspiradas en las legislaturas
//  y estadísticas reales recientes (2023-2025). Las fuerzas se
//  traducen a las familias ficticias del juego:
//    MNJ  peronismo nacional       UR  radicalismo y aliados
//    FC   centroderecha            LY  libertarios
//    FT   izquierda                PROV partidos provinciales
//    (oficialismos provinciales propios, vecinalismos)
// =============================================================

// ---------- Legislaturas provinciales ----------
// tipo: "uni" o "bi" · dip: bancas de la cámara única o de Diputados · sen: bancas del Senado
// ren / renSen: "total" (cada 4 años, con el gobernador) · "mitades" (cada 2) · "tercios"
// senUni: senadores uninominales por departamento (el aparato territorial barre el interior)
// premio: bancas que se lleva la lista ganadora en la renovación (cláusula de gobernabilidad)
const LEG_PROV = {
  caba:        { tipo: "uni", dip: 60, ren: "mitades", sistema: "D'Hondt en distrito único." },
  buenosaires: { tipo: "bi", dip: 92, sen: 46, ren: "mitades", renSen: "mitades", sistema: "Listas por las 8 secciones electorales, con cociente (piso alto para los partidos chicos)." },
  catamarca:   { tipo: "bi", dip: 41, sen: 16, ren: "mitades", renSen: "mitades", senUni: true, sistema: "Diputados por distrito único; un senador por cada departamento." },
  cordoba:     { tipo: "uni", dip: 70, ren: "total", sistema: "Sistema mixto: 44 bancas por distrito único y 26 uninominales, una por departamento." },
  corrientes:  { tipo: "bi", dip: 26, sen: 15, ren: "mitades", renSen: "tercios", sistema: "D'Hondt en distrito único para ambas cámaras." },
  chaco:       { tipo: "uni", dip: 32, ren: "mitades", sistema: "D'Hondt en distrito único." },
  chubut:      { tipo: "uni", dip: 27, ren: "total", premio: 16, sistema: "Cláusula de gobernabilidad: la lista ganadora se lleva 16 de 27 bancas; las otras 11 se reparten entre el resto." },
  entrerios:   { tipo: "bi", dip: 34, sen: 17, ren: "total", renSen: "total", premio: 18, senUni: true, sistema: "La lista ganadora tiene asegurada la mayoría absoluta de Diputados (18 de 34); un senador por departamento." },
  formosa:     { tipo: "uni", dip: 30, ren: "mitades", reeleccion: "indefinida", sistema: "D'Hondt en distrito único. Reelección indefinida del gobernador." },
  jujuy:       { tipo: "uni", dip: 48, ren: "mitades", sistema: "D'Hondt en distrito único con piso del 5% del padrón." },
  lapampa:     { tipo: "uni", dip: 30, ren: "total", sistema: "D'Hondt en distrito único." },
  larioja:     { tipo: "uni", dip: 36, ren: "mitades", sistema: "Por departamentos: la capital y los departamentos grandes eligen varias bancas." },
  mendoza:     { tipo: "bi", dip: 48, sen: 38, ren: "mitades", renSen: "mitades", reeleccion: "no inmediata", sistema: "Ambas cámaras por cuatro secciones electorales. El gobernador no tiene reelección inmediata." },
  misiones:    { tipo: "uni", dip: 40, ren: "mitades", sistema: "D'Hondt en distrito único, con sublemas históricamente." },
  neuquen:     { tipo: "uni", dip: 35, ren: "total", sistema: "D'Hondt en distrito único." },
  rionegro:    { tipo: "uni", dip: 46, ren: "total", sistema: "Mixto: 22 bancas por población (distrito único) y 24 regionales, 3 por cada circuito." },
  salta:       { tipo: "bi", dip: 60, sen: 23, ren: "mitades", renSen: "mitades", senUni: true, sistema: "Diputados por departamento; un senador por cada uno de los 23 departamentos." },
  sanjuan:     { tipo: "uni", dip: 36, ren: "total", sistema: "Mixto: 19 diputados departamentales y 17 proporcionales." },
  sanluis:     { tipo: "bi", dip: 43, sen: 9, ren: "mitades", renSen: "mitades", senUni: true, sistema: "Diputados por departamento; un senador por cada uno de los 9 departamentos." },
  santacruz:   { tipo: "uni", dip: 24, ren: "total", sistema: "Mixto: 14 diputados por municipio y 10 por distrito único. Usó ley de lemas durante décadas." },
  santafe:     { tipo: "bi", dip: 50, sen: 19, ren: "total", renSen: "total", premio: 28, premioHasta: "2015", senUni: true, reeleccion: "una (desde 2025)", sistema: "Un senador por departamento. Durante décadas la lista ganadora se llevó 28 de 50 diputados; la reforma constitucional de 2025 cambió el sistema." },
  santiago:    { tipo: "uni", dip: 40, ren: "total", sistema: "D'Hondt en distrito único." },
  tucuman:     { tipo: "uni", dip: 49, ren: "total", sistema: "Por tres secciones electorales, con acoples (listas colgadas de un mismo candidato a gobernador)." },
  tdf:         { tipo: "uni", dip: 15, ren: "total", sistema: "D'Hondt en distrito único, con piso alto." },
};

// ---------- Perfil político, fiscal y social ----------
// ofi: familia que gobierna (aprox. 2024-2025) · base: composición heredada aproximada (%)
// dep: % de los recursos que vienen de la Nación · copa: coeficiente de coparticipación (%)
// fisc: holgura fiscal (-3 a +3) · reg: regalías (0-3) · deuda (0-3) · pob: pobreza (%) · des: desempleo (%)
// inseg: inseguridad (0-100) · conf: conflictividad (0-3) · intend: peso de los intendentes (0-3)
// sind: peso de los gremios (0-3) · emp: empleo público (0-3)
const PERFIL_PROV = {
  caba:        { ofi: "FC", base: { FC: 35, MNJ: 30, LY: 15, UR: 10, FT: 5, PROV: 5 }, dep: 20, copa: 1.4, fisc: 3, reg: 0, deuda: 1, pob: 17, des: 7, inseg: 50, conf: 1, intend: 0, sind: 2, emp: 1,
    rasgos: ["La jurisdicción más rica y menos dependiente de la Nación.", "Legislatura fragmentada: nadie tiene mayoría propia.", "Prensa nacional encima de cada decisión."] },
  buenosaires: { ofi: "MNJ", base: { MNJ: 45, FC: 20, LY: 15, UR: 12, FT: 3, PROV: 5 }, dep: 45, copa: 21.9, fisc: -2, reg: 0, deuda: 3, pob: 40, des: 8.5, inseg: 65, conf: 3, intend: 3, sind: 3, emp: 1,
    rasgos: ["El 38% del padrón: la provincia que define la elección nacional.", "Los intendentes del conurbano controlan legisladores y territorio.", "Recibe menos coparticipación por habitante que el resto: la caja nunca alcanza."] },
  catamarca:   { ofi: "MNJ", base: { MNJ: 60, UR: 25, LY: 10, PROV: 5 }, dep: 85, copa: 2.86, fisc: 0, reg: 2, deuda: 1, pob: 37, des: 6, inseg: 40, conf: 1, intend: 1, sind: 1, emp: 3,
    rasgos: ["Litio y minería: regalías y conflictos por el agua.", "El Estado provincial es el gran empleador.", "Senado por departamentos dominado por el aparato oficialista."] },
  cordoba:     { ofi: "PROV", base: { PROV: 50, UR: 20, FC: 15, LY: 8, MNJ: 4, FT: 3 }, dep: 55, copa: 9.22, fisc: 0, reg: 0, deuda: 2, pob: 34, des: 8, inseg: 55, conf: 2, intend: 2, sind: 3, emp: 1,
    rasgos: ["Un peronismo provincial propio, distante de la Nación, gobierna hace décadas.", "Unicameral con bancas por departamento: el interior pesa.", "Gremios fuertes (mecánicos, Luz y Fuerza, estatales)."] },
  corrientes:  { ofi: "UR", base: { UR: 60, MNJ: 30, LY: 7, PROV: 3 }, dep: 80, copa: 3.86, fisc: 1, reg: 0, deuda: 0, pob: 42, des: 5, inseg: 40, conf: 1, intend: 1, sind: 1, emp: 2,
    rasgos: ["Un frente radical gobierna con mayorías cómodas en ambas cámaras.", "Poca deuda, mucha pobreza y dependencia de la coparticipación."] },
  chaco:       { ofi: "UR", base: { MNJ: 42, UR: 40, LY: 10, PROV: 5, FT: 3 }, dep: 82, copa: 5.18, fisc: -2, reg: 0, deuda: 3, pob: 50, des: 6, inseg: 50, conf: 2, intend: 1, sind: 1, emp: 2,
    rasgos: ["Legislatura partida casi a la mitad.", "Una de las pobrezas más altas del país y movimientos sociales organizados.", "Deuda alta y poca recaudación propia."] },
  chubut:      { ofi: "FC", base: { FC: 45, MNJ: 40, LY: 8, PROV: 5, FT: 2 }, dep: 45, copa: 1.64, fisc: -2, reg: 3, deuda: 3, pob: 30, des: 6, inseg: 45, conf: 3, intend: 1, sind: 3, emp: 2,
    rasgos: ["Petróleo y pesca: regalías que suben y bajan con el barril.", "Historia de sueldos estatales atrasados y paros docentes largos.", "Cláusula de gobernabilidad: si ganás, tenés mayoría propia."] },
  entrerios:   { ofi: "FC", base: { MNJ: 40, FC: 30, UR: 20, LY: 7, PROV: 3 }, dep: 70, copa: 5.07, fisc: -1, reg: 0, deuda: 2, pob: 35, des: 6, inseg: 45, conf: 2, intend: 2, sind: 2, emp: 2,
    rasgos: ["Quien gana se asegura la mayoría en Diputados.", "La caja de jubilaciones provincial es un agujero permanente.", "Senado de 17 departamentos con caudillos propios."] },
  formosa:     { ofi: "MNJ", base: { MNJ: 75, UR: 15, FC: 5, LY: 5 }, dep: 90, copa: 3.78, fisc: -1, reg: 0, deuda: 1, pob: 45, des: 4, inseg: 35, conf: 0, intend: 0, sind: 1, emp: 3,
    rasgos: ["El oficialismo controla casi toda la Legislatura.", "Nueve de cada diez pesos vienen de la Nación.", "Poca conflictividad visible: el Estado lo ocupa todo."] },
  jujuy:       { ofi: "UR", base: { UR: 55, MNJ: 25, FT: 10, LY: 8, PROV: 2 }, dep: 80, copa: 2.95, fisc: -1, reg: 2, deuda: 2, pob: 40, des: 5, inseg: 45, conf: 3, intend: 1, sind: 2, emp: 3,
    rasgos: ["Litio, tabaco y azúcar.", "La izquierda tiene aquí una de sus bancadas más grandes.", "Cortes de ruta y protestas por la reforma constitucional de 2023."] },
  lapampa:     { ofi: "MNJ", base: { MNJ: 50, UR: 35, FC: 8, LY: 7 }, dep: 65, copa: 1.95, fisc: 2, reg: 1, deuda: 0, pob: 30, des: 4, inseg: 35, conf: 1, intend: 1, sind: 1, emp: 2,
    rasgos: ["Cuentas ordenadas y casi sin deuda.", "Bipartidismo clásico: peronismo contra radicalismo.", "Provincia chica y tranquila: buena para empezar."] },
  larioja:     { ofi: "MNJ", base: { MNJ: 75, UR: 12, LY: 8, FC: 5 }, dep: 88, copa: 2.15, fisc: -2, reg: 1, deuda: 3, pob: 40, des: 5, inseg: 35, conf: 1, intend: 0, sind: 1, emp: 3,
    rasgos: ["Oficialismo hegemónico en la Legislatura.", "Cayó en default de su deuda en dólares.", "Muy dependiente de los fondos discrecionales de la Nación."] },
  mendoza:     { ofi: "UR", base: { UR: 50, MNJ: 22, LY: 12, FC: 10, PROV: 4, FT: 2 }, dep: 55, copa: 4.33, fisc: 1, reg: 2, deuda: 1, pob: 37, des: 5, inseg: 50, conf: 1, intend: 2, sind: 2, emp: 1,
    rasgos: ["Un frente radical con mayoría en las dos cámaras.", "Gobernador sin reelección inmediata: el sucesor se cocina temprano.", "Petróleo, vino y conflictos por el agua y la minería."] },
  misiones:    { ofi: "PROV", base: { PROV: 65, FC: 15, LY: 8, UR: 5, MNJ: 5, FT: 2 }, dep: 75, copa: 3.43, fisc: 0, reg: 0, deuda: 2, pob: 38, des: 3, inseg: 40, conf: 2, intend: 1, sind: 1, emp: 2,
    rasgos: ["Un frente provincial que negocia con cualquier gobierno nacional.", "Policías y docentes protagonizaron acampes masivos en 2024.", "Yerba, té y turismo."] },
  neuquen:     { ofi: "PROV", base: { PROV: 50, LY: 12, MNJ: 15, UR: 10, FC: 8, FT: 5 }, dep: 35, copa: 1.80, fisc: 3, reg: 3, deuda: 1, pob: 28, des: 6, inseg: 45, conf: 2, intend: 1, sind: 3, emp: 2,
    rasgos: ["Vaca Muerta: la provincia con más regalías del país.", "Los partidos provinciales gobiernan desde los años sesenta.", "Gremios petroleros y docentes muy poderosos."] },
  rionegro:    { ofi: "PROV", base: { PROV: 50, MNJ: 25, LY: 8, UR: 8, FC: 7, FT: 2 }, dep: 60, copa: 2.62, fisc: 0, reg: 2, deuda: 2, pob: 32, des: 5, inseg: 45, conf: 2, intend: 1, sind: 2, emp: 2,
    rasgos: ["Un partido provincial gobierna con mayoría propia.", "Bancas regionales: el Alto Valle, la costa y la cordillera tiran para su lado.", "Petróleo, fruta y turismo en Bariloche."] },
  salta:       { ofi: "PROV", base: { PROV: 45, MNJ: 20, LY: 15, UR: 8, FC: 7, FT: 5 }, dep: 70, copa: 3.98, fisc: 0, reg: 2, deuda: 1, pob: 42, des: 6, inseg: 50, conf: 2, intend: 2, sind: 1, emp: 2,
    rasgos: ["Senado de 23 departamentos con caudillos que negocian voto a voto.", "Litio, gas y tabaco.", "Pueblos originarios y frontera con conflictos propios."] },
  sanjuan:     { ofi: "FC", base: { MNJ: 45, FC: 35, LY: 10, PROV: 10 }, dep: 75, copa: 3.51, fisc: 1, reg: 2, deuda: 0, pob: 35, des: 6, inseg: 40, conf: 1, intend: 1, sind: 1, emp: 2,
    rasgos: ["La oposición tiene la mayoría de la Cámara: hay que negociar todo.", "Minería metalífera: regalías y controversia ambiental."] },
  sanluis:     { ofi: "UR", base: { MNJ: 45, UR: 40, LY: 10, PROV: 5 }, dep: 70, copa: 2.37, fisc: 2, reg: 0, deuda: 0, pob: 33, des: 4, inseg: 40, conf: 1, intend: 0, sind: 1, emp: 2,
    rasgos: ["Cuentas en orden y sin deuda.", "Cuatro décadas de una misma familia en el poder terminaron en 2023.", "Senado de 9 departamentos: el viejo aparato todavía pesa."] },
  santacruz:   { ofi: "PROV", base: { PROV: 50, MNJ: 30, UR: 12, LY: 8 }, dep: 50, copa: 1.64, fisc: 1, reg: 3, deuda: 1, pob: 30, des: 4, inseg: 35, conf: 3, intend: 1, sind: 3, emp: 3,
    rasgos: ["Petróleo, oro y pesca para pocos habitantes.", "Los docentes y estatales protagonizan los paros más largos del país.", "Casi la mitad de los trabajadores son empleados públicos."] },
  santafe:     { ofi: "UR", base: { UR: 50, MNJ: 30, LY: 10, FC: 5, FT: 5 }, dep: 55, copa: 9.28, fisc: 1, reg: 0, deuda: 1, pob: 35, des: 7, inseg: 70, conf: 2, intend: 2, sind: 3, emp: 1,
    rasgos: ["Rosario: el narcotráfico y la violencia son el problema número uno.", "Senado de 19 departamentos donde el peronismo del interior resiste.", "Agroexportación, puertos y gremios aceiteros."] },
  santiago:    { ofi: "MNJ", base: { MNJ: 75, UR: 15, LY: 7, FC: 3 }, dep: 85, copa: 4.29, fisc: 2, reg: 0, deuda: 0, pob: 45, des: 4, inseg: 40, conf: 0, intend: 1, sind: 1, emp: 3,
    rasgos: ["Un frente oficialista con casi toda la Legislatura.", "Superávit y obra pública con fondos nacionales.", "Pobreza alta y oposición casi inexistente."] },
  tucuman:     { ofi: "MNJ", base: { MNJ: 65, UR: 15, LY: 10, FC: 8, FT: 2 }, dep: 75, copa: 4.94, fisc: 0, reg: 0, deuda: 1, pob: 42, des: 7, inseg: 55, conf: 2, intend: 2, sind: 2, emp: 2,
    rasgos: ["Los acoples suman cientos de listas detrás del oficialismo.", "La provincia más densa: azúcar, limón y crisis cíclicas.", "Los delegados comunales y los legisladores manejan territorio propio."] },
  tdf:         { ofi: "MNJ", base: { MNJ: 50, PROV: 15, UR: 12, FC: 10, LY: 10, FT: 3 }, dep: 60, copa: 1.24, fisc: -1, reg: 2, deuda: 2, pob: 28, des: 7, inseg: 30, conf: 3, intend: 1, sind: 2, emp: 3,
    rasgos: ["Legislatura de solo 15 bancas: cada voto cuenta.", "El régimen industrial de la isla depende de la Nación.", "Estatales combativos y caja previsional en rojo."] },
};

// ---------- Municipios jugables ----------
// dep: % de los recursos que vienen de la provincia y la Nación; serv: calidad de servicios inicial
const PERFIL_CIUDAD = {
  lamatanza:   { pobAbs: 1.84, ofi: "MNJ", ren: "mitades", base: { MNJ: 62, FC: 12, LY: 12, UR: 5, FT: 9 }, dep: 70, fisc: -2, deuda: 1, pob: 47, des: 10, inseg: 70, serv: 35, conf: 3, sind: 1, emp: 2,
    rasgos: ["El municipio más poblado del país: más habitantes que 20 provincias.", "Bastión peronista desde 1983: el Concejo es casi todo propio.", "Movimientos sociales organizados, villas y barrios sin cloacas."] },
  laplata:     { pobAbs: 0.77, ofi: "MNJ", ren: "mitades", base: { MNJ: 40, FC: 30, LY: 12, UR: 10, FT: 8 }, dep: 45, fisc: 0, deuda: 1, pob: 30, des: 7, inseg: 55, serv: 50, conf: 2, sind: 2, emp: 3,
    rasgos: ["Capital provincial: estatales, universidad y marchas todas las semanas.", "Concejo partido en dos: hay que negociar.", "Inundaciones y basurales pendientes."] },
  mardelplata: { pobAbs: 0.68, ofi: "FC", ren: "mitades", base: { FC: 40, MNJ: 28, LY: 14, UR: 15, FT: 3 }, dep: 40, fisc: -1, deuda: 2, pob: 32, des: 10, inseg: 50, serv: 45, conf: 2, sind: 2, emp: 2,
    rasgos: ["Desempleo de los más altos del país fuera de temporada.", "La ciudad se triplica en verano: basura, agua y tránsito.", "Puerto pesquero con conflictos gremiales."] },
  bahiablanca: { pobAbs: 0.34, ofi: "MNJ", ren: "mitades", base: { MNJ: 35, FC: 30, LY: 18, UR: 12, FT: 5 }, dep: 40, fisc: 1, deuda: 1, pob: 28, des: 7, inseg: 45, serv: 55, conf: 1, sind: 2, emp: 2,
    rasgos: ["Polo petroquímico y puerto: recursos propios importantes.", "Concejo muy fragmentado.", "Vulnerable a temporales e inundaciones."] },
  quilmes:     { pobAbs: 0.64, ofi: "MNJ", ren: "mitades", base: { MNJ: 50, FC: 25, LY: 13, UR: 7, FT: 5 }, dep: 65, fisc: -1, deuda: 1, pob: 42, des: 9, inseg: 65, serv: 40, conf: 2, sind: 1, emp: 2,
    rasgos: ["Conurbano sur: la intendencia cambia de manos seguido.", "Ribera, asentamientos y una fuerte demanda de seguridad."] },
  cordoba:     { pobAbs: 1.5, ofi: "PROV", ren: "total", premio: 16, base: { PROV: 45, UR: 25, FC: 12, LY: 10, MNJ: 5, FT: 3 }, dep: 40, fisc: -1, deuda: 2, pob: 36, des: 9, inseg: 55, serv: 45, conf: 3, sind: 3, emp: 3,
    rasgos: ["Premio de mayoría: la lista ganadora se lleva 16 de 31 bancas.", "El gremio municipal es de los más fuertes del país.", "Transporte urbano en crisis permanente."] },
  mendoza:     { pobAbs: 0.12, ofi: "UR", ren: "mitades", base: { UR: 60, LY: 15, MNJ: 15, FC: 5, PROV: 5 }, dep: 35, fisc: 2, deuda: 0, pob: 20, des: 5, inseg: 40, serv: 60, conf: 0, sind: 1, emp: 1,
    rasgos: ["Ciudad chica, ordenada y con recursos propios.", "Concejo de 12 bancas con mayoría oficialista.", "Ideal para empezar."] },
  tucuman:     { pobAbs: 0.6, ofi: "MNJ", ren: "total", base: { MNJ: 50, UR: 25, LY: 12, FC: 10, FT: 3 }, dep: 70, fisc: -1, deuda: 1, pob: 40, des: 8, inseg: 55, serv: 40, conf: 2, sind: 2, emp: 2,
    rasgos: ["Depende de que la provincia gire los fondos a tiempo.", "La relación con el gobernador decide la obra pública.", "Basura y transporte: los reclamos de siempre."] },
};

// ---------- Utilidades ----------
function familiaJugador(cfg) { return cfg.camino === "fundar" ? "NUEVO" : (cfg.partido || "MNJ"); }
function premioVigente(L, era) {
  if (!L || !L.premio) return 0;
  if (L.premioHasta) { const orden = ["1983", "1989", "2001", "2015", "hoy"]; if (orden.indexOf(era || "hoy") > orden.indexOf(L.premioHasta)) return 0; }
  return L.premio;
}
function datosTerritorio(kind, id) {
  if (kind === "prov") {
    const g = GEO_AR.nacion.provincias.find(p => p.id === id);
    return { kind, id, nombre: g ? g.nombre : id, pobAbs: g ? g.pobAbs : 1, L: LEG_PROV[id], P: PERFIL_PROV[id] };
  }
  const c = CIUDADES_AR.find(x => x.id === id);
  const P = PERFIL_CIUDAD[id];
  return { kind, id, nombre: c ? c.nombre : id, prov: c ? c.provincia : "", pobAbs: P ? P.pobAbs : 0.5, L: { tipo: "uni", dip: c ? c.bancas : 20, ren: P ? P.ren : "mitades", premio: P && P.premio, sistema: P && P.premio ? `Premio de mayoría: la lista ganadora se lleva ${P.premio} de ${c.bancas} bancas.` : "D'Hondt en distrito único." }, P };
}
function territorioDeCfg(cfg) {
  if (cfg.objetivo === "gobernador") return datosTerritorio("prov", cfg.provincia || "buenosaires");
  if (cfg.objetivo === "intendente") return datosTerritorio("ciudad", cfg.ciudad || "lamatanza");
  return null;
}

// Composición heredada aproximada en bancas
function composicionBase(T, cuerpo = "dip") {
  const n = cuerpo === "sen" ? T.L.sen : T.L.dip;
  return dHondt({ ...T.P.base }, n);
}

// ---------- Dificultad ----------
// Devuelve puntajes 0-100 (más alto = más difícil) y los motivos
function dificultadTerritorio(T, cfg) {
  const P = T.P, L = T.L, yo = familiaJugador(cfg);
  if (!P) return { total: 50, leg: 50, caja: 50, calle: 50, etiqueta: "Moderada", motivos: [], afin: 0 };
  const afin = P.base[yo] || 0;
  const premio = premioVigente(L, cfg.era);
  const motivos = [];
  let leg = 72 - afin * 1.15;
  if (L.tipo === "bi") { leg += 8; motivos.push(["−", "Dos cámaras: cada ley se vota dos veces."]); }
  if (L.senUni) { if (P.ofi === yo) { leg -= 6; motivos.push(["+", "El Senado de departamentos responde a tu aparato."]); } else { leg += 6; motivos.push(["−", "Senado por departamentos controlado por los caudillos de otro partido."]); } }
  if (premio) { leg -= 12; motivos.push(["+", `Si ganás, la lista ganadora se lleva ${premio} bancas: mayoría casi asegurada.`]); }
  if (L.ren === "mitades" && afin < 30) { leg += 5; motivos.push(["−", "Media Legislatura viene del turno anterior y no es tuya."]); }
  if (afin >= 50) motivos.push(["+", `Tu partido es mayoría en la ${T.kind === "prov" ? "Legislatura" : "Concejo"} heredada (≈${afin}%).`]);
  else if (afin === 0) motivos.push(["−", yo === "NUEVO" ? "Partido nuevo: no tenés ni una banca heredada." : "Tu partido no tiene bancas propias acá."]);
  else if (afin < 20) motivos.push(["−", `Tu partido es minoría chica (≈${afin}%).`]);
  let caja = 50 + (P.dep - 60) * 0.55 - P.fisc * 8 - (P.reg || 0) * 3 + P.deuda * 4 + P.emp * 3;
  if (P.dep >= 80) motivos.push(["−", `El ${P.dep}% de la plata viene de ${T.kind === "prov" ? "la Nación" : "la provincia y la Nación"}.`]);
  if (P.dep <= 45) motivos.push(["+", "Recursos propios fuertes: poca dependencia de afuera."]);
  if ((P.reg || 0) >= 3) motivos.push(["+", "Regalías petroleras o mineras importantes."]);
  if (P.deuda >= 3) motivos.push(["−", "Deuda pesada: los vencimientos se comen la caja."]);
  if (P.fisc >= 2) motivos.push(["+", "Cuentas ordenadas al asumir."]);
  let calle = 18 + (P.pob - 30) * 1.1 + (P.inseg - 40) * 0.4 + P.conf * 10 + P.sind * 3 + (P.intend || 0) * 3;
  if (P.conf >= 3) motivos.push(["−", "Conflictividad social alta: paros, cortes y acampes."]);
  if (P.inseg >= 65) motivos.push(["−", "La inseguridad es el reclamo número uno."]);
  if ((P.intend || 0) >= 3) motivos.push(["−", "Los intendentes tienen poder propio y lo cobran."]);
  if (P.pob >= 45) motivos.push(["−", `Pobreza cercana al ${P.pob}%.`]);
  if (P.conf === 0) motivos.push(["+", "Poca protesta en la calle."]);
  leg = R.clamp(leg, 0, 100); caja = R.clamp(caja, 0, 100); calle = R.clamp(calle, 0, 100);
  const escala = Math.min(8, T.pobAbs * (T.kind === "prov" ? 0.5 : 4));
  const total = Math.round(R.clamp(leg * 0.4 + caja * 0.3 + calle * 0.3 + escala, 0, 100));
  const etiqueta = total < 38 ? "Accesible" : total < 50 ? "Moderada" : total < 62 ? "Difícil" : "Muy difícil";
  return { total, leg: Math.round(leg), caja: Math.round(caja), calle: Math.round(calle), etiqueta, motivos, afin };
}

// ---------- Armado de la Legislatura al asumir ----------
function eleccionPorPartido() {
  const votos = {};
  for (const cid in (S.resultadoGeneral ? S.resultadoGeneral.nac : {})) {
    const c = S.candidatos.find(x => x.id === cid); if (!c) continue;
    votos[c.partido] = (votos[c.partido] || 0) + S.resultadoGeneral.nac[cid];
  }
  return votos;
}
function mezclarVotos(eleccion, base, pesoBase) {
  const out = {}, se = Object.values(eleccion).reduce((a, v) => a + v, 0) || 1, sb = Object.values(base).reduce((a, v) => a + v, 0) || 1;
  for (const k in eleccion) out[k] = (out[k] || 0) + eleccion[k] / se * 100 * (1 - pesoBase);
  for (const k in base) out[k] = (out[k] || 0) + base[k] / sb * 100 * pesoBase;
  for (const k in out) if (out[k] < 0.5) delete out[k];
  return out;
}
function repartoConPremio(votos, n, premio, ganador) {
  if (!premio || premio >= n) return dHondt(votos, n);
  const orden = Object.entries(votos).sort((a, b) => b[1] - a[1]);
  const gan = ganador && votos[ganador] ? ganador : orden[0][0], resto = Object.fromEntries(orden.filter(([k]) => k !== gan));
  const r = Object.keys(resto).length ? dHondt(resto, n - premio) : {};
  r[gan] = premio + (Object.keys(resto).length ? 0 : n - premio);
  return r;
}
// cada departamento elige un senador: el que tiene aparato barre (probabilidad ∝ votos²)
function repartoUninominal(votos, n) {
  const r = {}, pares = Object.entries(votos).map(([k, v]) => [k, v * v]);
  const tot = pares.reduce((a, x) => a + x[1], 0);
  for (let i = 0; i < n; i++) {
    let x = R.rand() * tot;
    for (const [k, w] of pares) { x -= w; if (x <= 0) { r[k] = (r[k] || 0) + 1; break; } }
    if (x > 0) r[pares[0][0]] = (r[pares[0][0]] || 0) + 1;
  }
  return r;
}
function sumarBancas(a, b) { const o = { ...a }; for (const k in b) if (b[k]) o[k] = (o[k] || 0) + b[k]; for (const k in o) if (!o[k]) delete o[k]; return o; }
function fraccionNueva(ren, n) { return ren === "total" ? n : ren === "tercios" ? Math.ceil(n / 3) : Math.ceil(n / 2); }

function armarLegislaturaLocal() {
  const T = territorioDeCfg(S.cfg);
  if (!T || !T.P) return false;
  const L = T.L, P = T.P, yo = S.jugador;
  const elec = eleccionPorPartido();
  // las listas legislativas no son la boleta del Ejecutivo: corte de boleta, colectoras y acoples
  const vNuevo = mezclarVotos(elec, P.base, 0.3);
  const premio = premioVigente(L, S.cfg.era);
  const nN = fraccionNueva(L.ren, L.dip);
  // el premio de mayoría va a la lista del ganador de la elección (la boleta va pegada)
  const ganador = Object.entries(elec).sort((a, b) => b[1] - a[1])[0];
  S.leg = sumarBancas(repartoConPremio(vNuevo, nN, premio, ganador && ganador[0]), nN < L.dip ? dHondt({ ...P.base }, L.dip - nN) : {});
  S.legTotal = L.dip;
  if (L.tipo === "bi") {
    const sN = fraccionNueva(L.renSen || L.ren, L.sen);
    const vSen = mezclarVotos(elec, P.base, 0.45);
    const nuevo = L.senUni ? repartoUninominal(vSen, sN) : dHondt(vSen, sN);
    const viejo = sN < L.sen ? (L.senUni ? repartoUninominal({ ...P.base }, L.sen - sN) : dHondt({ ...P.base }, L.sen - sN)) : {};
    S.legSen = sumarBancas(nuevo, viejo);
    S.legSenTotal = L.sen;
  } else { delete S.legSen; delete S.legSenTotal; }
  for (const k of Object.keys({ ...S.leg, ...(S.legSen || {}) })) if (!PARTIDOS[k]) { delete S.leg[k]; if (S.legSen) delete S.legSen[k]; }
  S.legRel = {};
  for (const k of Object.keys({ ...S.leg, ...(S.legSen || {}) })) S.legRel[k] = k === yo.partido ? 70 : -15 - Math.abs((PARTIDOS[k] ? PARTIDOS[k].ideo : 50) - yo.ideo) / 3 + (k === "PROV" ? 8 : 0);
  S.terr = { kind: T.kind, id: T.id, ren: L.ren, renSen: L.renSen || null, bicameral: L.tipo === "bi", premio, senUni: !!L.senUni };
  return true;
}

// Indicadores iniciales según el territorio
function indicadoresIniciales(T) {
  const P = T.P;
  const I = S.ind;
  I.pobreza = P.pob; I.desempleo = P.des; I.inseguridad = P.inseg;
  I.deuda = T.kind === "prov" ? 10 + P.deuda * 15 : 4 + P.deuda * 6;
  I.caja = 100 + P.fisc * 10;
  I.servicios = R.clamp(P.serv != null ? P.serv : 50 + P.fisc * 3 - (P.pob - 35) * 0.3, 10, 90);
  I.tension = R.clamp(18 + P.conf * 6 + (P.pob - 35) * 0.3, 5, 70);
}

// Factores fiscales usados por finTrimestreLocal (con valores neutros para partidas viejas)
function factoresFiscales() {
  const T = S && S.terr && territorioDeCfg(S.cfg);
  const P = T && T.P;
  if (!P) return { dep: 0.77, fisc: 0, tension: 0, reg: 0, erosion: 0.06 };
  return { erosion: T.kind === "prov" ? 0.06 : 0.04, dep: P.dep / 100, fisc: P.fisc, reg: P.reg || 0, tension: P.conf * 2 + P.sind * 0.8 - 3.5 };
}

// ---------- Ganchos sobre el motor ----------
const _iniciarGobiernoLocalTerr = iniciarGobiernoLocal;
iniciarGobiernoLocal = function () {
  _iniciarGobiernoLocalTerr();
  const T = territorioDeCfg(S.cfg);
  if (!T || !T.P) return;
  armarLegislaturaLocal();
  indicadoresIniciales(T);
  S.hist = [{ t: 0, ...S.ind }];
  const yo = S.jugador, gob = S.cfg.objetivo === "gobernador";
  const txtSen = S.legSen ? ` y ${S.legSen[yo.partido] || 0} de ${S.legSenTotal} en el Senado provincial` : "";
  const i = S.log.findIndex(l => /^Asumiste/.test(l.txt));
  const txt = `Asumiste como ${nombreCargo()} de ${nombreTerritorio()}. Tu bloque tiene ${S.leg[yo.partido] || 0} de ${S.legTotal} bancas en ${gob ? (S.legSen ? "Diputados" : "la Legislatura") : "el Concejo Deliberante"}${txtSen}. El presidente es del ${PARTIDOS[S.presidente.partido].corto}.`;
  if (i >= 0) S.log[i].txt = txt; else log(txt, "info");
  if (S.terr.premio) log(`Por el premio de mayoría, la lista ganadora se quedó con ${S.terr.premio} bancas.`, "info");
};

// Votaciones simples de la Legislatura (tasas, juicio político): en las bicamerales votan las dos cámaras
const _votarLegislaturaTerr = votarLegislatura;
votarLegislatura = function (propuesta, extra = 0, dosTercios = false) {
  const v = _votarLegislaturaTerr(propuesta, extra, dosTercios);
  v.total = S.legTotal;
  if (!S.legSen) return v;
  v.camaraOk = v.aprobado;
  if (!v.aprobado) return v;
  const guard = [S.leg, S.legTotal];
  S.leg = S.legSen; S.legTotal = S.legSenTotal;
  let s;
  try { s = _votarLegislaturaTerr(propuesta, extra, dosTercios); } finally { S.leg = guard[0]; S.legTotal = guard[1]; }
  s.camara = "legsen"; s.total = S.legSenTotal;
  v.siguiente = s; v.aprobado = s.aprobado;
  return v;
};

// Motor de leyes: Legislaturas bicamerales provinciales
const _ctxLeyTerr = ctxLey;
ctxLey = function () {
  const c = _ctxLeyTerr();
  if (c.modo === "local") {
    const T = S.terr && territorioDeCfg(S.cfg);
    const intend = T && T.P ? (T.P.intend || 0) : 0;
    const disc0 = c.disc;
    // donde los intendentes mandan, tus propios legisladores responden también a ellos
    c.disc = k => k === S.jugador.partido ? Math.max(0.6, disc0(k) - intend * 0.04) : disc0(k);
    if (S.legSen) { c.bicameral = true; c.sen = S.legSen; c.tot = { dip: S.legTotal, sen: S.legSenTotal }; }
  }
  return c;
};
const _camaraOrigenTerr = camaraOrigen;
camaraOrigen = function (ley, ctx) {
  if (ctx.modo === "local" && ctx.bicameral) return ley.materia === "tributaria" ? { c: "dip", txt: "Los impuestos provinciales empiezan en Diputados." } : { c: "dip", txt: "Entra por Diputados de la provincia." };
  return _camaraOrigenTerr(ley, ctx);
};
const _nombreCuerpoTerr = nombreCuerpo;
nombreCuerpo = function (c, ctx) {
  if (ctx && ctx.modo === "local" && ctx.bicameral) return c === "sen" ? "Senado provincial" : "Diputados provinciales";
  return _nombreCuerpoTerr(c, ctx);
};
const _votarCuerpoLeyTerr = votarCuerpoLey;
votarCuerpoLey = function (c, ley, ctx, opt = {}) {
  const r = _votarCuerpoLeyTerr(c, ley, ctx, opt);
  r.total = ctx.tot[c];
  if (ctx.modo === "local" && ctx.bicameral) r.camara = c === "sen" ? "legsen" : "legdip";
  return r;
};

// Los dilemas típicos de cada provincia aparecen más seguido
const _generarExpLocalTerr = generarExpLocal;
generarExpLocal = function () {
  _generarExpLocalTerr();
  const T = S.terr && territorioDeCfg(S.cfg);
  if (!T || !T.P) return;
  const P = T.P, fav = [], gob = S.cfg.objetivo === "gobernador";
  if (gob) {
    if ((P.intend || 0) >= 2) fav.push("intendentes");
    if (P.sind >= 2) fav.push("paritariaProv");
    if ((P.reg || 0) >= 2) fav.push("mineria", "regalias");
    if (P.conf >= 2) fav.push("policiaAcuart");
    if (P.dep >= 80) fav.push("bonos");
  } else {
    if (P.sind >= 2) fav.push("basura", "empleoMun");
    if (P.inseg >= 60) fav.push("narcomenudeo");
    if (P.conf >= 2) fav.push("tomaPredio");
    if (P.dep >= 60) fav.push("colectivos");
  }
  if (!fav.length || R.rand() > 0.3) return;
  const rec = S.historialLocal.slice(-6);
  const ops = fav.filter(id => !rec.includes(id) && DILEMAS_LOCAL[S.cfg.objetivo].some(d => d.id === id && (!d.cond || d.cond(S))));
  if (!ops.length) return;
  const id = R.pick(ops);
  S.historialLocal.pop(); S.historialLocal.push(id);
  S.expedientesLocal = [{ id, resuelto: false }];
};

// Como presidente: los gobernadores tienden a ser del oficialismo histórico de cada provincia
if (typeof armarCongreso === "function") {
  const _armarCongresoTerr = armarCongreso;
  armarCongreso = function () {
    const r = _armarCongresoTerr();
    for (const id in r.gobernadores) {
      const P = PERFIL_PROV[id];
      if (P && PARTIDOS[P.ofi] && R.rand() < 0.55) r.gobernadores[id] = { partido: P.ofi, relacion: P.ofi === S.jugador.partido ? 40 : P.ofi === "PROV" ? 0 : -15 };
    }
    return r;
  };
}
