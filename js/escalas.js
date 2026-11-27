// =============================================================
//  VALDORA - Escalas subnacionales: gobernador e intendente
//  La campaña usa el mismo motor con un mapa local; el gobierno
//  es provincial o municipal, con Legislatura o Concejo, plata
//  que depende de la Nación y dilemas propios de cada nivel.
// =============================================================

const PROVINCIAS_NACION = PROVINCIAS.slice();

// Las 24 jurisdicciones son jugables como gobernador, con sus departamentos reales
// (Buenos Aires se juega por secciones electorales, que agrupan sus 135 partidos)
const PROVINCIAS_JUGABLES = Object.fromEntries(GEO_AR.nacion.provincias.map(p => [p.id, {
  nombre: p.nombre, bancas: p.legBancas,
  distritos: p.id === "buenosaires" ? GEO_AR.deptos[p.id].secciones : GEO_AR.deptos[p.id].deptos,
  w: GEO_AR.deptos[p.id].w, h: GEO_AR.deptos[p.id].h,
  nDeptos: GEO_AR.deptos[p.id].deptos.length,
}]));
// Municipios jugables como intendente (zonas de barrios esquemáticas dentro del límite real)
const CIUDADES_JUGABLES = Object.fromEntries(CIUDADES_AR.map(c => [c.id, c]));
function ciudadActual() { return CIUDADES_JUGABLES[(S && S.cfg && S.cfg.ciudad) || CIUDAD_DEFECTO] || CIUDADES_AR[0]; }

function mapaGeo(lista, w, h, nivel) {
  const tot = lista.reduce((a, d) => a + (d.hab || d.pob || 0), 0);
  MAPA_META = { w, h, nivel };
  return lista.map(d => ({ id: d.id, nombre: d.nombre, pob: Math.round((d.hab || d.pob || 0) / tot * 1000) / 10, perfil: d.perfil, path: d.path, cx: d.cx, cy: d.cy, dip: 1 }));
}
function mapaDeCfg(cfg) {
  if (cfg.objetivo === "gobernador" || cfg.objetivo === "legislador") {
    const P = PROVINCIAS_JUGABLES[cfg.objetivo === "legislador" ? PROV_LEG : (cfg.provincia || PROV_DEFECTO)] || PROVINCIAS_JUGABLES[PROV_DEFECTO];
    return mapaGeo(P.distritos, P.w, P.h, "provincia");
  }
  if (cfg.objetivo === "intendente") { const C = CIUDADES_JUGABLES[cfg.ciudad || CIUDAD_DEFECTO] || CIUDADES_AR[0]; return mapaGeo(C.barrios, C.w, C.h, "ciudad"); }
  MAPA_META = { w: GEO_AR.nacion.w, h: GEO_AR.nacion.h, nivel: "nacion" };
  return PROVINCIAS_NACION;
}
function esLocal() { return S && S.cfg && (S.cfg.objetivo === "gobernador" || S.cfg.objetivo === "intendente"); }
function mapaNoNacional() { return !!(S && S.cfg && S.cfg.objetivo && S.cfg.objetivo !== "presidente"); }
function nombreCargo() { return !S ? "" : S.cfg.objetivo === "gobernador" ? "gobernador" : S.cfg.objetivo === "intendente" ? "intendente" : S.cfg.objetivo === "legislador" ? (S.cfg.camaraLeg === "sen" ? "senador nacional" : "diputado nacional") : "presidente"; }
function nombreTerritorio() { return S.cfg.objetivo === "gobernador" ? PROVINCIAS_JUGABLES[S.cfg.provincia || PROV_DEFECTO].nombre : S.cfg.objetivo === "intendente" ? ciudadActual().nombre : S.cfg.objetivo === "legislador" ? PROVINCIAS_JUGABLES[PROV_LEG].nombre : "la Argentina"; }

const _iniciarPartidaEsc = iniciarPartida;
iniciarPartida = function (cfg) {
  // restaurar el mapa nacional antes de cada partida
  PROVINCIAS.splice(0, PROVINCIAS.length, ...mapaDeCfg(cfg));
  _iniciarPartidaEsc(cfg);
  S.mapaReal = true;
  if (mapaNoNacional()) {
    S.log = S.log.map(l => ({ ...l, txt: l.txt.replace("campaña presidencial", `campaña para ${nombreCargo()} ${S.cfg.objetivo === "legislador" ? "por" : "de"} ${nombreTerritorio()}`) }));
    // los partidos chicos casi no compiten en lo local; los rivales arrancan más conocidos
    for (const c of S.candidatos) if (!c.esJugador) for (const p of PROVINCIAS) c.know[p.id] = Math.min(1, c.know[p.id] + 0.05);
    S.avalesNecesarios = cfg.objetivo === "intendente" ? 1500 : cfg.objetivo === "legislador" ? 2000 : 2500;
  }
};

const _eleccionGeneralEsc = eleccionGeneral;
eleccionGeneral = function () {
  if (!esLocal()) return _eleccionGeneralEsc();
  const cands = S.candidatos.filter(c => c.activo);
  const res = resultadosNacionales(cands);
  S.resultadoGeneral = res;
  const orden = Object.entries(res.nac).sort((a, b) => b[1] - a[1]);
  const texto = orden.map(([id, v]) => `${S.candidatos.find(c => c.id === id).nombre} ${fmt(v)}%`).join(" · ");
  // en la mayoría de las provincias y municipios gana el que saca más votos, sin balotaje
  return finElecciones(orden[0][0], `Elección para ${nombreCargo()} de ${nombreTerritorio()}: ${texto}. Gana el más votado, sin segunda vuelta.`);
};

const _finEleccionesEsc = finElecciones;
finElecciones = function (ganadorId, texto) {
  if (!esLocal() || ganadorId !== "yo") return _finEleccionesEsc(ganadorId, texto);
  log(texto + ` ¡Sos ${nombreCargo()} electo!`, "bueno");
  iniciarGobiernoLocal();
  return { titulo: `¡Ganaste! Sos ${nombreCargo()} de ${nombreTerritorio()}`, texto: texto + " Ahora tenés que gobernar con la plata que hay y con la Nación mirando.", tipo: "bueno" };
};

// ---------- Gobierno local ----------
const AREAS_LOCAL = {
  gobernador: [["educacion", "Educación (docentes y escuelas)"], ["salud", "Salud (hospitales provinciales)"], ["seguridad", "Policía provincial"], ["obras", "Obra pública y rutas"], ["social", "Desarrollo social"], ["estatales", "Salarios de estatales"]],
  intendente: [["recoleccion", "Recolección de residuos"], ["alumbrado", "Alumbrado y bacheo"], ["obras", "Obras: cloacas, asfalto, plazas"], ["seguridad", "Seguridad local y cámaras"], ["social", "Comedores y salud primaria"], ["transporte", "Subsidio al transporte"]],
};

function iniciarGobiernoLocal() {
  S.fase = "gobiernoLocal";
  S.trimestre = 1; S.mes = 1; S.paso = 1 / 3;
  const yo = S.jugador, gob = S.cfg.objetivo === "gobernador";
  // Legislatura provincial o Concejo Deliberante: mitad elegida ahora, mitad heredada
  const total = gob ? PROVINCIAS_JUGABLES[S.cfg.provincia || PROV_DEFECTO].bancas : ciudadActual().bancas;
  const votos = {};
  for (const cid in S.resultadoGeneral.nac) { const c = S.candidatos.find(x => x.id === cid); votos[c.partido] = (votos[c.partido] || 0) + S.resultadoGeneral.nac[cid]; }
  const nuevas = dHondt(votos, Math.ceil(total / 2));
  const heredadas = dHondt({ MNJ: 42, UR: 18, FC: 22, LY: 8, PROV: gob ? 10 : 0 }, Math.floor(total / 2));
  S.leg = {}; for (const k in nuevas) S.leg[k] = (S.leg[k] || 0) + nuevas[k]; for (const k in heredadas) if (heredadas[k]) S.leg[k] = (S.leg[k] || 0) + heredadas[k];
  if (!PARTIDOS.PROV) PARTIDOS.PROV = { id: "PROV", nombre: "Vecinalistas y provinciales", corto: "Prov.", color: "#4caf50", ideo: 45 };
  S.legTotal = total;
  S.legRel = {}; for (const k in S.leg) S.legRel[k] = k === yo.partido ? 70 : -15 - Math.abs((PARTIDOS[k] ? PARTIDOS[k].ideo : 50) - yo.ideo) / 3;
  // Gobierno nacional (exógeno): partido del presidente y relación con él
  S.presidente = { partido: R.pick(["MNJ", "FC", "LY", "UR"].filter(p => PARTIDOS[p])), relacion: 0 };
  S.presidente.relacion = S.presidente.partido === yo.partido ? 40 : -10;
  const era = typeof eraActual === "function" ? eraActual() : null;
  S.inflNacional = era && era.ind ? era.ind.inflacion : 4;
  S.ind = gob
    ? { caja: 100, desempleo: 8, pobreza: 38, inseguridad: 55, servicios: 50, deuda: 30, imagen: 58, legitimidad: 70, tension: 30 }
    : { caja: 100, desempleo: 8, pobreza: 35, inseguridad: 55, servicios: 45, deuda: 10, imagen: 60, legitimidad: 70, tension: 25 };
  S.hist = [{ t: 0, ...S.ind }];
  S.presLocal = Object.fromEntries(AREAS_LOCAL[S.cfg.objetivo].map(([id]) => [id, 0]));
  S.tasa = 0;
  S.sueldosImpagos = 0;
  S.expedientesLocal = [];
  S.historialLocal = [];
  S.diferidosLocal = [];
  S.adhesiones = [];
  S.flagsLocal = {};
  S.medidasEsteTrimestre = 0;
  generarExpLocal();
  log(`Asumiste como ${nombreCargo()} de ${nombreTerritorio()}. Tu bloque tiene ${S.leg[yo.partido] || 0} de ${total} bancas en ${gob ? "la Legislatura" : "el Concejo Deliberante"}. El presidente es del ${PARTIDOS[S.presidente.partido].corto}.`, "info");
}

function votarLegislatura(propuesta, extra = 0, dosTercios = false) {
  const yo = S.jugador;
  let si = 0, no = 0;
  const detalle = [];
  for (const k in S.leg) {
    const n = S.leg[k];
    const P = PARTIDOS[k] || { ideo: 50 };
    let p = k === yo.partido ? 0.92 : R.clamp(0.15 + (1 - Math.abs((propuesta.ideo || 50) - P.ideo) / 60) * 0.4 + S.legRel[k] / 200 + (S.ind.imagen - 50) / 200 + extra / 100 + (yo.negociacion - 5) * 0.02, 0.02, 0.95);
    const postura = R.rand() < p;
    const disc = k === "PROV" ? 0.5 : 0.8;
    const siguen = Math.round(n * disc), resto = n - siguen;
    const bSi = (postura ? siguen : 0) + Math.round(resto * p);
    si += bSi; no += n - bSi;
    detalle.push({ bloque: k, si: bSi, no: n - bSi, aus: 0 });
  }
  const necesario = dosTercios ? Math.ceil(S.legTotal * 2 / 3) : Math.floor(S.legTotal / 2) + 1;
  return { camara: S.cfg.objetivo === "gobernador" ? "leg" : "concejo", si, no, aus: 0, quorum: true, necesario, aprobado: si >= necesario, detalle };
}

// Dilemas de gestión local
const DILEMAS_LOCAL = {
  gobernador: [
    { id: "paritariaProv", titulo: "Paritaria docente y estatal", texto: "Los gremios estatales piden un aumento del 30%. Si no, paro por tiempo indeterminado y las escuelas cerradas.",
      opciones: [{ t: "Dar el aumento completo", pista: "La caja sufre", ind: { caja: -15, tension: -5, imagen: 2 } },
                 { t: "Ofrecer la mitad en cuotas", pista: "Paro de dos semanas", ind: { caja: -6, tension: 4, servicios: -3 } },
                 { t: "Pedir fondos a la Nación para pagarlo", pista: "Depende de tu relación con el presidente", fx: "pedirNacion" }] },
    { id: "policiaAcuart", titulo: "La policía provincial se acuartela", texto: "Los policías reclaman aumento y se quedan en las comisarías. Hay saqueos en el conurbano de la capital provincial.",
      opciones: [{ t: "Dar el aumento esta misma noche", pista: "Caro y contagioso", ind: { caja: -8, inseguridad: -2 }, dif: [{ en: 1, texto: "Otros estatales reclaman lo mismo que la policía.", ind: { tension: 4 } }] },
                 { t: "Pedir Gendarmería a la Nación", pista: "Necesitás al presidente", fx: "gendarmeria" },
                 { t: "No ceder ante la extorsión", pista: "Autoridad, riesgo de caos", ind: { inseguridad: 8, tension: 8, legitimidad: 2 } }] },
    { id: "inundacionProv", titulo: "Inundaciones en el interior provincial", texto: "Desbordan dos ríos: hay 8.000 evacuados y rutas cortadas. Se necesitan obras de emergencia.",
      opciones: [{ t: "Declarar emergencia y endeudarse para obras", pista: "Más deuda, gente agradecida", ind: { deuda: 6, imagen: 3, servicios: 2 } },
                 { t: "Pedir el fondo de emergencia nacional", pista: "Depende de la Nación", fx: "pedirNacion" },
                 { t: "Asistencia mínima con fondos propios", pista: "Barato y criticado", ind: { caja: -3, imagen: -4 } }] },
    { id: "desdoblar", titulo: "¿Desdoblar las elecciones?", texto: "Tu equipo propone separar la elección provincial de la nacional para que no te arrastre la boleta del presidente.",
      opciones: [{ t: "Desdoblar", pista: "Independencia; la Casa Rosada se enoja si es aliada", fx: "desdoblar" },
                 { t: "Ir en la misma boleta que la Nación", pista: "Dependés de cómo le vaya al presidente", fx: "pegarse" },
                 { t: "Decidir más adelante", pista: "Sin efecto" }] },
    { id: "bonos", titulo: "No alcanza para los sueldos", cond: s => s.ind.caja < 40, texto: "La tesorería no llega a pagar los sueldos de fin de mes.",
      opciones: [{ t: "Emitir bonos provinciales (cuasimoneda)", pista: "Pagás, pero con papelitos", ind: { caja: 25, legitimidad: -5, tension: 3 }, dif: [{ en: 2, texto: "Los bonos provinciales cotizan con descuento: los comercios no los quieren.", ind: { imagen: -4, pobreza: 1 } }] },
                 { t: "Tomar deuda en dólares", pista: "Alivio hoy, vencimientos mañana", ind: { caja: 30, deuda: 10 } },
                 { t: "Pagar en cuotas", pista: "Furia estatal", ind: { tension: 8, imagen: -5 }, fx: "impagos" }] },
    { id: "adherirRigi", titulo: "Adhesión al régimen nacional de grandes inversiones", texto: "La Nación aprobó un régimen de beneficios para grandes inversiones. Las provincias deben adherir por ley para que rija en su territorio.",
      opciones: [{ t: "Enviar la ley de adhesión a la Legislatura", pista: "Inversiones si aprueba", fx: "adherir:rigi" },
                 { t: "No adherir y defender las regalías", pista: "Soberanía provincial; la Nación toma nota", ind: { legitimidad: 1 }, fx: "relNacion:-10" },
                 { t: "Adherir con condiciones de empleo local", pista: "Intermedio", fx: "adherir:rigiCond" }] },
    { id: "reeleccion", titulo: "Reforma constitucional para la reelección", texto: "Tus legisladores proponen reformar la Constitución provincial para permitir la reelección indefinida.",
      opciones: [{ t: "Impulsar la reforma", pista: "Necesitás dos tercios; la oposición grita autoritarismo", fx: "reforma" },
                 { t: "Descartarla públicamente", pista: "Gana legitimidad", ind: { legitimidad: 5, imagen: 2 } },
                 { t: "Dejar correr el rumor", pista: "Nada cambia", ind: { legitimidad: -1 } }] },
    { id: "mineria", titulo: "Proyecto minero en la provincia", texto: "Una minera quiere abrir una mina a cielo abierto. Promete 2.000 empleos; los vecinos temen por el agua.",
      opciones: [{ t: "Aprobarlo", pista: "Empleo y regalías; protestas ambientales", ind: { desempleo: -1, caja: 10, tension: 4 } },
                 { t: "Prohibir la minería a cielo abierto por ley", pista: "Popular en las ciudades", ind: { imagen: 3 }, fx: "relNacion:-5" },
                 { t: "Consulta popular", pista: "La gente decide", fx: "consulta" }] },
    { id: "regalias", titulo: "Caen las regalías petroleras", texto: "El precio internacional del crudo se derrumba y la recaudación por regalías cae a la mitad.",
      opciones: [{ t: "Recortar obra pública", pista: "Equilibrás la caja, frenás empleo", ind: { caja: 6, desempleo: 0.5, servicios: -2 } },
                 { t: "Pedir un adelanto de coparticipación", pista: "Depende de la Nación", fx: "pedirNacion" },
                 { t: "Subsidiar a las petroleras para sostener pozos", pista: "Empleo hoy, caja vacía", ind: { caja: -8, desempleo: -0.5 } }] },
    { id: "hospital", titulo: "Colapsa la guardia del hospital provincial", texto: "Faltan médicos e insumos: hay pacientes esperando 12 horas. Los residentes paran.",
      opciones: [{ t: "Plan de emergencia sanitaria", pista: "Caro, necesario", ind: { caja: -9, servicios: 5, imagen: 2 } },
                 { t: "Contratar médicos por monotributo", pista: "Parche barato", ind: { caja: -3, servicios: 2 }, dif: [{ en: 2, texto: "Los médicos contratados se van a la actividad privada.", ind: { servicios: -3 } }] },
                 { t: "Culpar a la Nación por el recorte de fondos", pista: "Imagen local, nada se arregla", ind: { imagen: 1, servicios: -3 }, fx: "relNacion:-6" }] },
    { id: "intendentes", titulo: "Los intendentes reclaman su parte", texto: "Los intendentes del conurbano provincial amenazan con romper si no les giran fondos para pagar aguinaldos.",
      opciones: [{ t: "Adelantarles fondos", pista: "Lealtad territorial", ind: { caja: -7, legitimidad: 1 } },
                 { t: "Negarse", pista: "Te hacen la guerra en la Legislatura", ind: { caja: 2 }, fx: "relLeg:-15" },
                 { t: "Fondos solo para los aliados", pista: "Clásico; la oposición denuncia discrecionalidad", ind: { caja: -3, legitimidad: -2 } }] },
    { id: "sequia", titulo: "Sequía en la zona agrícola", texto: "La peor sequía en 50 años: los productores piden emergencia agropecuaria y exención de impuestos.",
      opciones: [{ t: "Declarar la emergencia y eximir impuestos", pista: "El campo te banca, la caja sufre", ind: { caja: -6, imagen: 2 } },
                 { t: "Créditos blandos del banco provincial", pista: "Intermedio", ind: { caja: -3, deuda: 3 } },
                 { t: "No hacer nada", pista: "Tractorazo en la capital", ind: { tension: 4, imagen: -3 } }] },
  ],
  intendente: [
    { id: "basura", titulo: "Paro de recolectores", texto: "El gremio de camioneros para la recolección: la basura se acumula en las veredas.",
      opciones: [{ t: "Aceptar el aumento", pista: "La caja sufre", ind: { caja: -10, servicios: 2 } },
                 { t: "Contratar otra empresa", pista: "Conflicto con el gremio", ind: { caja: -4, tension: 5 }, dif: [{ en: 1, texto: "La nueva empresa recoge mejor y más barato.", ind: { servicios: 5, caja: 4 } }] },
                 { t: "Esperar a que se cansen", pista: "La ciudad huele mal", ind: { servicios: -8, imagen: -5 } }] },
    { id: "tasas", titulo: "Actualizar la tasa municipal", texto: "La inflación licuó la tasa de alumbrado, barrido y limpieza. Hay que subirla o recortar servicios.",
      opciones: [{ t: "Subirla 50% (vota el Concejo)", pista: "Recaudás; enojo vecinal", fx: "subirTasa" },
                 { t: "Recortar servicios", pista: "Barrios a oscuras", ind: { servicios: -6, caja: 6 } },
                 { t: "Pedir fondos al gobernador", pista: "Te deja en deuda política", ind: { caja: 8, legitimidad: -1 } }] },
    { id: "colectivos", titulo: "Las empresas de colectivos amenazan con cortar el servicio", texto: "Dicen que sin más subsidio no pueden pagar el combustible ni los sueldos.",
      opciones: [{ t: "Aumentar el subsidio", pista: "Caro", ind: { caja: -8, imagen: 1 } },
                 { t: "Autorizar suba del boleto", pista: "Pagan los pasajeros", ind: { tension: 4, imagen: -3 } },
                 { t: "Municipalizar una línea", pista: "Control propio; riesgo de déficit eterno", ind: { caja: -5, servicios: 3 }, dif: [{ en: 3, texto: "La línea municipal pierde plata todos los meses.", ind: { caja: -5 } }] }] },
    { id: "bache", titulo: "El cráter de la avenida principal", texto: "Un bache gigante en la avenida se volvió viral: le pusieron nombre y torta de cumpleaños.",
      opciones: [{ t: "Plan de bacheo con cuadrillas propias", pista: "Lento pero sirve", ind: { caja: -4, servicios: 4, imagen: 2 } },
                 { t: "Tomarlo con humor en redes", pista: "Popular si tu carisma acompaña", fx: "humor" },
                 { t: "Culpar a la gestión anterior", pista: "Funciona poco", ind: { imagen: -1 } }] },
    { id: "narcomenudeo", titulo: "Búnker de drogas en Villa Obrera", texto: "Los vecinos denuncian un búnker de venta de drogas a metros de una escuela. La policía es provincial.",
      opciones: [{ t: "Pedir al gobernador un operativo", pista: "Depende de tu relación", fx: "pedirNacion" },
                 { t: "Demoler el búnker con orden municipal", pista: "Gesto fuerte, riesgo legal", ind: { inseguridad: -4, imagen: 4, legitimidad: -2 } },
                 { t: "Cámaras y alumbrado en la zona", pista: "Prevención", ind: { caja: -4, inseguridad: -2, servicios: 2 } }] },
    { id: "tomaPredio", titulo: "Toma de un predio municipal", texto: "Trescientas familias ocupan un terreno donde estaba proyectado un parque.",
      opciones: [{ t: "Urbanizar con lotes con servicios", pista: "Caro, solución social", ind: { caja: -8, pobreza: -1, tension: -3 } },
                 { t: "Pedir el desalojo", pista: "Conflicto", ind: { tension: 5, inseguridad: -1 } },
                 { t: "Relocalizar con ayuda de la provincia", pista: "Negociación larga", dif: [{ en: 2, texto: "Las familias se relocalizan en un barrio nuevo.", ind: { tension: -3, imagen: 2 } }] }] },
    { id: "aportanteObra", titulo: "Un empresario amigo quiere la obra de cloacas", texto: "El empresario que financió tu campaña pide que le adjudiques la obra de cloacas sin licitación.",
      opciones: [{ t: "Adjudicarle la obra", pista: "Cumplís el favor; riesgo de causa", ind: { servicios: 4, legitimidad: -3 }, fx: "riesgo:20" },
                 { t: "Licitación abierta", pista: "Transparencia; el empresario se ofende", ind: { legitimidad: 3, caja: -2 } },
                 { t: "Licitación con pliego a medida", pista: "Clásico", ind: { servicios: 3 }, fx: "riesgo:10" }] },
    { id: "adherirNac", titulo: "Adhesión a la ley nacional de seguridad", texto: "La Nación ofrece fondos para cámaras y patrulleros a los municipios que adhieran a su plan.",
      opciones: [{ t: "Adherir por ordenanza", pista: "Fondos si aprueba el Concejo", fx: "adherir:seguridad" },
                 { t: "No adherir", pista: "Autonomía municipal", fx: "relNacion:-8" },
                 { t: "Adherir parcialmente", pista: "Menos fondos", ind: { inseguridad: -1 }, fx: "relNacion:3" }] },
    { id: "inundacionMun", titulo: "Se inunda el barrio ferroviario", texto: "Una tormenta deja el Barrio Ferroviario bajo el agua. Los desagües no dan abasto.",
      opciones: [{ t: "Obra de desagües con deuda", pista: "Solución de fondo", ind: { deuda: 6, servicios: 4, imagen: 2 } },
                 { t: "Asistencia inmediata con colchones y comida", pista: "Paliativo", ind: { caja: -3, tension: -2 } },
                 { t: "Pedir fondos de emergencia al gobernador", pista: "Depende de la relación", fx: "pedirNacion" }] },
    { id: "naftas", titulo: "Una estación de servicio quiere instalarse en la plaza", texto: "Una empresa ofrece pagar una fortuna por un terreno municipal frente a la plaza principal.",
      opciones: [{ t: "Vender el terreno", pista: "Caja; vecinos furiosos", ind: { caja: 10, imagen: -4 } },
                 { t: "Rechazar la oferta y hacer un espacio verde", pista: "Popular, cuesta", ind: { caja: -2, imagen: 3, servicios: 1 } },
                 { t: "Audiencia pública", pista: "Legitimidad", ind: { legitimidad: 3 } }] },
    { id: "cuidacoches", titulo: "Mafia de cuidacoches en el centro", texto: "Comerciantes denuncian que cuidacoches cobran tarifas abusivas y amenazan a los clientes.",
      opciones: [{ t: "Estacionamiento medido digital", pista: "Recaudás y ordenás", ind: { caja: 4, inseguridad: -1, imagen: 1 } },
                 { t: "Registrar y capacitar a los cuidacoches", pista: "Inclusión, lento", ind: { caja: -2, tension: -1 } },
                 { t: "Operativos de la guardia urbana", pista: "Mano dura municipal", ind: { inseguridad: -2, tension: 2 } }] },
    { id: "empleoMun", titulo: "Presión para pasar a planta a los contratados", texto: "Cuatrocientos contratados municipales reclaman el pase a planta permanente antes de fin de año.",
      opciones: [{ t: "Pasarlos a todos", pista: "Gremio contento, caja comprometida", ind: { caja: -8, tension: -3 } },
                 { t: "Pase por concurso, de a poco", pista: "Prolijo", ind: { caja: -3, legitimidad: 2 } },
                 { t: "Rechazar el pedido", pista: "Toma del palacio municipal", ind: { tension: 5, imagen: -2 } }] },
  ],
};

function generarExpLocal() {
  const lista = DILEMAS_LOCAL[S.cfg.objetivo];
  const recientes = S.historialLocal.slice(-5);
  let pos = lista.filter(d => (!d.cond || d.cond(S)) && !recientes.includes(d.id));
  const n = Math.min(1, pos.length), el = [];
  for (let i = 0; i < n; i++) { const d = R.pick(pos); el.push(d.id); pos = pos.filter(x => x !== d); }
  S.expedientesLocal = el.map(id => ({ id, resuelto: false }));
  S.historialLocal.push(...el);
}

function aplicarLocal(ef) { if (ef) for (const k in ef) if (k in S.ind) S.ind[k] += ef[k]; }

function resolverExpLocal(idx, opIdx) {
  const e = S.expedientesLocal[idx]; if (!e || e.resuelto) return { msg: "" };
  const d = DILEMAS_LOCAL[S.cfg.objetivo].find(x => x.id === e.id);
  const op = d.opciones[opIdx];
  e.resuelto = true; e.eleccion = opIdx;
  aplicarLocal(op.ind);
  if (op.dif) for (const df of op.dif) S.diferidosLocal.push({ t: S.trimestre + df.en, texto: df.texto, ind: df.ind, origen: d.titulo });
  let r = { msg: "", pasos: [], tipo: "info" };
  if (op.fx) r = { ...r, ...fxLocal(op.fx) };
  log(`${d.titulo}: ${op.t}. ${r.msg || ""}`.trim(), r.tipo);
  return r;
}

function fxLocal(fx) {
  const [tipo, arg] = fx.split(":");
  const P = S.presidente, yo = S.jugador;
  switch (tipo) {
    case "pedirNacion": {
      const p = 0.3 + P.relacion / 150 + (P.partido === yo.partido ? 0.2 : 0);
      if (R.rand() < p) { aplicarLocal({ caja: 15, tension: -3 }); P.relacion -= 5; return { msg: "La Casa Rosada giró fondos. Te los va a cobrar en votos en el Congreso.", tipo: "bueno" }; }
      aplicarLocal({ imagen: -2 }); return { msg: "La Nación te dejó sin respuesta. Tenés que arreglarte solo.", tipo: "malo" };
    }
    case "gendarmeria": {
      if (P.relacion > -20) { aplicarLocal({ inseguridad: -4, legitimidad: -2 }); return { msg: "Llegan gendarmes. Los saqueos paran, pero tu policía queda humillada.", tipo: "info" }; }
      aplicarLocal({ inseguridad: 6, tension: 6 }); return { msg: "El ministerio de Seguridad nacional se niega a mandar fuerzas. El caos sigue.", tipo: "malo" };
    }
    case "relNacion": P.relacion = R.clamp(P.relacion + Number(arg), -100, 100); return { msg: `Relación con el presidente: ${Math.round(P.relacion)}.` };
    case "desdoblar": S.flagsLocal.desdoblado = true; if (P.partido === yo.partido) P.relacion -= 10; return { msg: "Tu elección queda separada de la nacional." };
    case "pegarse": S.flagsLocal.pegado = true; P.relacion += 10; return { msg: "Vas en la boleta del presidente: su suerte será la tuya." };
    case "impagos": S.sueldosImpagos++; return { msg: "Los estatales cobran en cuotas." };
    case "adherir": {
      const v = votarLegislatura({ ideo: 65 });
      if (v.aprobado) {
        S.adhesiones.push(arg);
        if (arg === "rigi") aplicarLocal({ desempleo: -1.5, caja: 8 });
        if (arg === "rigiCond") aplicarLocal({ desempleo: -1, caja: 5, imagen: 1 });
        if (arg === "seguridad") aplicarLocal({ inseguridad: -4, caja: 3 });
        P.relacion += 10;
        return { msg: "Se aprobó la adhesión a la ley nacional. Ahora rige en tu territorio.", pasos: [v], tipo: "bueno" };
      }
      return { msg: "La adhesión no consiguió los votos.", pasos: [v], tipo: "malo" };
    }
    case "reforma": {
      const v = votarLegislatura({ ideo: S.jugador.ideo }, -10, true);
      if (v.aprobado) { S.flagsLocal.reeleccion = true; aplicarLocal({ legitimidad: -8 }); return { msg: "La Legislatura convocó a Convención Constituyente: tendrás reelección indefinida.", pasos: [v], tipo: "aviso" }; }
      aplicarLocal({ legitimidad: -3, imagen: -2 }); return { msg: "No llegaste a los dos tercios. La oposición celebra.", pasos: [v], tipo: "malo" };
    }
    case "consulta": {
      const si = R.rand() < 0.45;
      aplicarLocal({ legitimidad: 4 });
      if (si) { aplicarLocal({ desempleo: -0.8, caja: 6 }); return { msg: "La consulta aprobó la mina por poco.", tipo: "info" }; }
      return { msg: "La consulta rechazó la mina. Acatás el resultado.", tipo: "info" };
    }
    case "subirTasa": {
      const v = votarLegislatura({ ideo: 50 });
      if (v.aprobado) { S.tasa += 1; aplicarLocal({ caja: 12, imagen: -4 }); return { msg: S.cfg.objetivo === "gobernador" ? "La Legislatura aprobó la suba de ingresos brutos e inmobiliario." : "El Concejo aprobó la suba de la tasa.", pasos: [v], tipo: "info" }; }
      return { msg: S.cfg.objetivo === "gobernador" ? "La Legislatura rechazó la suba de impuestos provinciales." : "El Concejo rechazó la suba de la tasa.", pasos: [v], tipo: "malo" };
    }
    case "humor": {
      const ok = R.rand() < S.jugador.carisma / 10;
      aplicarLocal(ok ? { imagen: 5 } : { imagen: -4 });
      return { msg: ok ? "Tu video con el bache fue un éxito: te ganaste a la ciudad." : "El chiste cayó mal: \"se ríe de nosotros\".", tipo: ok ? "bueno" : "malo" };
    }
    case "riesgo": S.riesgo += Number(arg); return { msg: "" };
    case "relLeg": for (const k in S.legRel) if (k !== S.jugador.partido) S.legRel[k] += Number(arg); return { msg: "Los bloques de la Legislatura toman nota." };
  }
  return {};
}

function finTrimestreLocal() {
  const I = S.ind, yo = S.jugador, gob = S.cfg.objetivo === "gobernador";
  const ev = [];
  if (!S.mes) S.mes = (S.trimestre - 1) * 3 + 1;
  S.paso = 1 / 3;
  const f = S.paso, cierre = finDeTrimestre();
  // decisiones no tomadas
  for (const e of S.expedientesLocal.filter(x => !x.resuelto)) { e.resuelto = true; aplicarLocal({ imagen: -2, tension: 2 }); log("Un expediente quedó sin decisión y el problema se agravó.", "malo"); }
  // economía nacional exógena
  S.inflNacional = Math.max(0.5, suav(S.inflNacional, 2.5, 0.85) + ruido(0.6));
  const crisisNac = R.rand() < 0.08 * f;
  if (crisisNac) { S.inflNacional += 3; ev.push({ titulo: "Crisis en la economía nacional", texto: "Una devaluación nacional golpea la recaudación y los precios.", tipo: "malo" }); }
  // caja: coparticipación + recursos propios + transferencias - gastos
  const gasto = Object.values(S.presLocal).reduce((a, v) => a + v, 0) / 6; // promedio de % de cambio
  // cada territorio tiene su dependencia de la Nación, su holgura fiscal y sus regalías (ver territorios.js)
  const ff = typeof factoresFiscales === "function" ? factoresFiscales() : { dep: 0.77, fisc: 0, reg: 0, tension: 0, erosion: 0.06 };
  const ingresos = 26 + ff.fisc;
  const copa = ingresos * ff.dep * (1 - ff.erosion * S.inflNacional) + (P_rel() > 30 ? 4 : P_rel() < -30 ? -4 : 0) * ff.dep / 0.77;
  const propios = ingresos * (1 - ff.dep) * (1 - 0.015 * S.inflNacional) + S.tasa * 2;
  const gastos = 26 + gasto * 0.3 + I.deuda * 0.05;
  I.caja = R.clamp(I.caja + (copa + propios - gastos) * f, -50, 200);
  // indicadores
  const pl = S.presLocal;
  I.servicios = R.clamp(I.servicios + (((pl.obras || 0) + (pl.recoleccion || 0) + (pl.alumbrado || 0) + (pl.salud || 0) + (pl.educacion || 0)) / 40 - S.inflNacional * 0.3 + 0.5) * f, 0, 100);
  I.inseguridad = R.clamp(I.inseguridad + (-(pl.seguridad || 0) / 15 + (I.pobreza - 35) * 0.1) * f + ruido(1), 5, 100);
  I.pobreza = R.clamp(I.pobreza + ((S.inflNacional - 3) * 0.6 - (pl.social || 0) / 20) * f + ruido(0.5), 10, 70);
  I.desempleo = R.clamp(I.desempleo + ((S.inflNacional - 3) * 0.1 - (pl.obras || 0) / 40) * f + ruido(0.2), 2, 30);
  const impagos = I.caja < 0;
  if (impagos) { S.sueldosImpagos += f; I.tension += 8 * f; ev.push({ titulo: "Sueldos impagos", texto: "La caja está vacía: los estatales no cobran a tiempo.", tipo: "malo" }); } else S.sueldosImpagos = Math.max(0, S.sueldosImpagos - f);
  const objT = 20 + (S.inflNacional - 2) * 3 + (I.pobreza - 30) * 0.6 + (I.desempleo - 7) * 1.5 - (pl.social || 0) / 6 - ((pl.estatales || 0) + (pl.transporte || 0)) / 10 + S.sueldosImpagos * 6 + ff.tension;
  I.tension = R.clamp(suav(I.tension, objT, 0.6), 0, 100);
  const objI = 55 + (I.servicios - 50) * 0.4 - (I.inseguridad - 55) * 0.3 - Math.max(0, I.tension - 45) * 0.4 + (yo.carisma - 5) * 1.5 + (yo.gestion - 5) * 1.5 - S.trimestre * 0.5 - S.tasa * 1.5 - S.sueldosImpagos * 8;
  I.imagen = R.clamp(suav(I.imagen, objI, 0.65), 3, 95);
  I.legitimidad = R.clamp(I.legitimidad + (0.8 - (I.tension > 70 ? 3 : 0)) * f, 0, 100);
  // escándalo
  if (R.rand() < S.riesgo / 200 * f) { aplicarLocal({ imagen: -6, legitimidad: -6 }); S.riesgo *= 0.5; ev.push({ titulo: "Escándalo", texto: "Un medio local revela contratos con empresarios que financiaron tu campaña.", tipo: "malo" }); }
  // diferidos
  for (const d of S.diferidosLocal.filter(x => x.t <= S.trimestre)) { aplicarLocal(d.ind); ev.push({ titulo: "Consecuencia de una decisión anterior", texto: `${d.origen}: ${d.texto}`, tipo: "info" }); }
  S.diferidosLocal = S.diferidosLocal.filter(x => x.t > S.trimestre);
  // relación con la Nación
  S.presidente.relacion = R.clamp(suav(S.presidente.relacion, 0, 0.95), -100, 100);
  // derrotas
  if (cierre && S.sueldosImpagos >= 3) {
    const ok = R.rand() < 0.6;
    const mot = gob ? "Nueve meses sin pagar los sueldos en término. El Congreso nacional aprueba la intervención federal de tu provincia (art. 6) y un interventor te reemplaza."
      : "Nueve meses sin pagar los sueldos en término. La Legislatura provincial interviene el municipio y nombra un comisionado en tu lugar.";
    if (ok) { S.perdio = true; S.motivoDerrota = mot; ev.push({ titulo: gob ? "Intervención federal" : "Intervención del municipio", texto: mot, tipo: "malo" }); return ev; }
  }
  if (!cierre) { /* se evalúa al cierre del trimestre */ } else if (I.tension >= 88) {
    S.tensionAlta = (S.tensionAlta || 0) + 1;
    if (S.tensionAlta >= 2) { S.perdio = true; S.motivoDerrota = `La ${gob ? "provincia" : "ciudad"} explota: saqueos y la casa de gobierno rodeada. Renunciás.`; ev.push({ titulo: "Estallido", texto: S.motivoDerrota, tipo: "malo" }); return ev; }
  } else S.tensionAlta = 0;
  if (cierre && I.legitimidad < 20 && R.rand() < 0.5) {
    const v = votarLegislatura({ ideo: 50 }, -40, true);
    if (v.aprobado) { S.perdio = true; S.motivoDerrota = gob ? "La Legislatura te destituyó por juicio político con dos tercios." : "El Concejo Deliberante te destituyó con dos tercios."; ev.push({ titulo: "Destitución", texto: S.motivoDerrota, tipo: "malo", pasos: [v] }); return ev; }
  }
  // elección de medio término (trimestre 8)
  // (solo donde la Legislatura o el Concejo se renuevan por mitades o por tercios)
  if (cierre && S.trimestre === 8 && !(S.terr && S.terr.ren === "total" && (!S.legSen || S.terr.renSen === "total"))) {
    const arrastre = S.flagsLocal.pegado ? (R.rand() < 0.5 ? 8 : -8) : 0;
    const swing = Math.round((I.imagen - 45 + arrastre) / 100 * S.legTotal * 0.3);
    const otros = Object.keys(S.leg).filter(k => k !== yo.partido).sort((a, b) => S.leg[b] - S.leg[a]);
    const renuevaDip = !(S.terr && S.terr.ren === "total");
    for (let i = 0; renuevaDip && otros.length && i < Math.abs(swing); i++) {
      if (swing > 0 && S.leg[otros[0]] > 0) { S.leg[otros[0]]--; S.leg[yo.partido] = (S.leg[yo.partido] || 0) + 1; }
      else if (swing < 0 && (S.leg[yo.partido] || 0) > 0) { S.leg[yo.partido]--; S.leg[otros[0]]++; }
    }
    let txtSen = "";
    if (S.legSen && S.terr.renSen !== "total") {
      const sw = Math.round((I.imagen - 45 + arrastre) / 100 * S.legSenTotal * (S.terr.renSen === "tercios" ? 0.2 : 0.3));
      const os = Object.keys(S.legSen).filter(k => k !== yo.partido).sort((a, b) => S.legSen[b] - S.legSen[a]);
      for (let i = 0; i < Math.abs(sw) && os.length; i++) {
        if (sw > 0 && S.legSen[os[0]] > 0) { S.legSen[os[0]]--; S.legSen[yo.partido] = (S.legSen[yo.partido] || 0) + 1; }
        else if (sw < 0 && (S.legSen[yo.partido] || 0) > 0) { S.legSen[yo.partido]--; S.legSen[os[0]]++; }
      }
      txtSen = ` En el Senado provincial quedás con ${S.legSen[yo.partido] || 0} de ${S.legSenTotal}.`;
    }
    const swTxt = !renuevaDip ? "Diputados no se renueva" : `Tu bloque ${swing >= 0 ? "gana" : "pierde"} ${Math.abs(swing)} bancas`;
    ev.push({ titulo: "Elecciones de medio término", texto: `${swTxt}. Ahora tenés ${S.leg[yo.partido] || 0} de ${S.legTotal}.${txtSen}${S.flagsLocal.pegado ? " La boleta del presidente influyó." : ""}`, tipo: swing >= 0 ? "bueno" : "malo" });
  }
  S.hist.push({ t: S.mes, ...I });
  S.mes++;
  S.trimestre = Math.ceil(S.mes / 3);
  S.medidasEsteTrimestre = 0;
  if (S.mes > MESES_MANDATO) { S.terminoMandato = true; return ev; }
  generarExpLocal();
  return ev;
}
function P_rel() { return S.presidente ? S.presidente.relacion : 0; }

function gestionarNacion(accion) {
  const P = S.presidente;
  if (S.medidasEsteTrimestre >= 1) return { msg: "Ya hiciste la gestión grande de este mes." };
  S.medidasEsteTrimestre++;
  if (accion === "alinear") { P.relacion += 15; aplicarLocal({ imagen: P.partido === S.jugador.partido ? 1 : -2 }); return { msg: "Te sacaste una foto con el presidente y prometiste los votos de tus legisladores nacionales." }; }
  if (accion === "enfrentar") { P.relacion -= 20; aplicarLocal({ imagen: 3 }); return { msg: "Denunciaste discriminación en el reparto de fondos. Tu gente te aplaude; la Casa Rosada cierra la canilla." }; }
  if (accion === "atn") { const ok = R.rand() < 0.3 + P.relacion / 120; if (ok) { aplicarLocal({ caja: 12 }); P.relacion -= 3; return { msg: "Conseguiste un ATN para tu territorio." }; } return { msg: "El ministro del Interior te dio una palmada y ningún peso." }; }
  if (accion === "deuda") { aplicarLocal({ caja: 20, deuda: 8 }); return { msg: "Colocaste deuda: entra plata, crecen los vencimientos." }; }
  if (accion === "tasa") return fxLocal("subirTasa");
  return {};
}

// al cargar una partida guardada, restaurar el mapa que corresponde
const _cargarEsc = cargar;
cargar = function () {
  const ok = _cargarEsc();
  // partidas guardadas con turnos trimestrales: se pasan a meses
  if (ok && S && S.fase !== "campana" && S.trimestre && !S.mes) { S.mes = (S.trimestre - 1) * 3 + 1; S.paso = 1 / 3; }
  if (ok && S && S.cfg) {
    migrarMapaReal();
    PROVINCIAS.splice(0, PROVINCIAS.length, ...mapaDeCfg(S.cfg));
    if (S.cfg.objetivo === "gobernador" || S.cfg.objetivo === "intendente") { if (!PARTIDOS.PROV) PARTIDOS.PROV = { id: "PROV", nombre: "Vecinalistas y provinciales", corto: "Prov.", color: "#4caf50", ideo: 45 }; }
  }
  return ok;
};

// Partidas de versiones anteriores (mapa ficticio): se pasan a las jurisdicciones reales
const VIEJAS_A_REALES = { puna: "jujuy", salinas: "salta", banados: "formosa", ambato: "catamarca", canaveral: "tucuman", quebracho: "santiago", montaraz: "chaco", esteros: "corrientes", yerbales: "misiones", famatina: "larioja", sierras: "cordoba", litoral: "santafe", islas: "entrerios", zonda: "sanjuan", cuyoseco: "sanluis", granribera: "buenosaires", capital: "caba", cordillera: "mendoza", pampaseca: "lapampa", confluencia: "neuquen", valle: "rionegro", meseta: "chubut", glaciares: "santacruz", findelmundo: "tdf" };
function migrarMapaReal() {
  if (S.mapaReal) return;
  S.mapaReal = true;
  if (S.cfg.provincia && VIEJAS_A_REALES[S.cfg.provincia]) S.cfg.provincia = VIEJAS_A_REALES[S.cfg.provincia];
  const nuevos = mapaDeCfg(S.cfg).map(p => p.id);
  const ren = obj => {
    if (!obj || typeof obj !== "object") return obj;
    const out = {};
    for (const k in obj) {
      let nk = VIEJAS_A_REALES[k] || k;
      const m = /^d(\d+)$/.exec(k); if (m && +m[1] < 60) nk = nuevos[+m[1]] || k; // distritos locales viejos: por orden
      out[nk] = obj[k];
    }
    if (mapaNoNacional()) for (const id of nuevos) if (!(id in out)) out[id] = Object.values(obj)[0] || 0;
    return out;
  };
  if (S.gobernadores) S.gobernadores = ren(S.gobernadores);
  for (const c of S.candidatos || []) { c.know = ren(c.know); c.local = ren(c.local); }
  if (S.jugador && S.jugador !== (S.candidatos || []).find(c => c.esJugador)) { S.jugador.know = ren(S.jugador.know); S.jugador.local = ren(S.jugador.local); }
  if (S.resultadoGeneral && S.resultadoGeneral.porProv) S.resultadoGeneral.porProv = ren(S.resultadoGeneral.porProv);
}
