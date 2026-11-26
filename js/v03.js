// =============================================================
//  VALDORA v0.3 - Justicia, prensa, proyectos de ley propios,
//  derogaciones, adhesión de provincias y eras históricas.
// =============================================================

// ---------- Eras históricas ----------
const ERAS = [
  { id: "1983", nombre: "1983: el retorno de la democracia", desc: "Difícil. Deuda externa enorme, inflación alta, militares inquietos y juicios por la dictadura. No existen las PASO ni los partidos nuevos de hoy.",
    ind: { inflacion: 14, desempleo: 5, crecimiento: 1, pobreza: 22, deficit: 6, deuda: 60, reservas: 3000, inseguridad: 35, imagen: 70, legitimidad: 85, tension: 30 },
    sinPartidos: ["LY", "FC"], sinPASO: true, guerraFria: true, dilemasExtra: { carapintadas: 4, vencimiento: 2 } },
  { id: "1989", nombre: "1989: la hiperinflación", desc: "Muy difícil. Precios que suben 100% por mes, saqueos y un gobierno que entrega el poder antes de tiempo. El Consenso de Washington ofrece crédito a cambio de privatizar.",
    ind: { inflacion: 40, desempleo: 8, crecimiento: -5, pobreza: 45, deficit: 8, deuda: 90, reservas: 1500, inseguridad: 45, imagen: 60, legitimidad: 60, tension: 70 },
    sinPartidos: ["LY", "FC"], sinPASO: true, dilemasExtra: { carapintadas: 2, corrida: 3 } },
  { id: "2001", nombre: "2001: el estallido", desc: "Extrema. Corralito, default, cinco presidentes en una semana y \"que se vayan todos\". Asumís un país en ruinas.",
    ind: { inflacion: 3, desempleo: 21, crecimiento: -10, pobreza: 55, deficit: 4, deuda: 150, reservas: 10000, inseguridad: 65, imagen: 45, legitimidad: 40, tension: 75 },
    sinPartidos: ["LY", "FC"], sinPASO: true, dilemasExtra: { vencimiento: 3, acampe: 3, provinciaQuiebra: 3 } },
  { id: "2015", nombre: "2015: cepo y grieta", desc: "Normal. Cepo cambiario, inflación del 25% anual, fallo de los holdouts sin resolver y una sociedad partida en dos.",
    ind: { inflacion: 2.2, desempleo: 6.5, crecimiento: 0.5, pobreza: 30, deficit: 5, deuda: 55, reservas: 25000, inseguridad: 60, imagen: 55, legitimidad: 70, tension: 35 },
    sinPartidos: ["LY"], dilemasExtra: { fondosBuitre: 5, tarifas: 3 } },
  { id: "hoy", nombre: "Hoy: inflación, deuda y antisistema", desc: "Normal. La situación por defecto: inflación alta, deuda con el Fondo, partidos nuevos antisistema y redes sociales que mandan.",
    ind: null, sinPartidos: [], dilemasExtra: {} },
];
function eraActual() { return ERAS.find(e => e.id === (S && S.cfg && S.cfg.era || "hoy")) || ERAS[ERAS.length - 1]; }

const _iniciarPartidaV3 = iniciarPartida;
iniciarPartida = function (cfg) {
  const era = ERAS.find(e => e.id === (cfg.era || "hoy"));
  if (era.sinPASO && (cfg.tipoInterna === "PASO" || (!cfg.tipoInterna && cfg.camino === "sumarse" && PARTIDOS[cfg.partido].interna === "PASO"))) cfg.tipoInterna = "cerrada";
  _iniciarPartidaV3(cfg);
  for (const pid of era.sinPartidos) {
    const c = S.candidatos.find(x => x.id === pid);
    if (c && !c.esJugador && !(cfg.partido === pid)) c.activo = false;
  }
  if (era.id !== "hoy") log(`Era: ${era.nombre}.${era.sinPASO ? " Todavía no existen las PASO: las internas son cerradas o a dedo." : ""}`, "info");
};

const _iniciarGobiernoV3 = iniciarGobierno;
iniciarGobierno = function () {
  _iniciarGobiernoV3();
  const era = eraActual();
  if (era.ind) { Object.assign(S.ind, era.ind); S.hist = [{ t: 0, ...S.ind }]; }
  S.causasJ = [];
  S.causasContadas = 0;
  S.periodistas = PERIODISTAS.map(p => ({ ...p, progreso: R.rand() * 20 }));
  S.pauta = 0;
  S.cadenas = 0;
  S.conferencia = false;
  S.tapas = [];
  S.medidasDinamicas = [];
  S.consejo = { oficialistas: Math.round(13 * Math.min(0.6, (S.dip[S.jugador.partido] || 0) / 257 + 0.1)) };
  if (era.ind) { S.escalaRes = Math.max(0.25, era.ind.reservas / 20000); S.desempleoInicial = era.ind.desempleo; }
  if (era.ind) S.ancla = { inflacion: era.ind.inflacion * 0.9, desempleo: era.ind.desempleo - 1, pobreza: era.ind.pobreza - 3 };
  S.convertibilidad = false;
  generarTapas();
};

// Planes de estabilización: efectos especiales
const _tomarMedidaV3 = tomarMedida;
tomarMedida = function (id, inst, extra) {
  const r = _tomarMedidaV3(id, inst, extra);
  S.ind.inflacion = Math.max(0.3, S.ind.inflacion);
  const m = MEDIDAS.find(x => x.id === id);
  if (r.ok && r.aprobada && m && m.especial === "convertibilidad") {
    S.convertibilidad = true;
    if (S.ancla) S.ancla.inflacion = 1;
    r.msg += " Rige la convertibilidad: la inflación se desploma, pero ya no podés emitir ni devaluar. Si las reservas se agotan, el sistema estalla.";
  }
  if (r.ok && r.aprobada && m && m.especial === "austral") {
    S.diferidos.push({ t: S.trimestre + 4, cond: "deficit", texto: "El plan de estabilización se agota: sin bajar el déficit, la inflación vuelve.", ind: { inflacion: 6, imagen: -5 }, origen: m.nombre });
    if (S.ancla) S.ancla.inflacion = Math.max(2, S.ancla.inflacion * 0.5);
  }
  return r;
};

// Las eras cambian el peso de algunos expedientes
const _generarExpedientesV3 = generarExpedientes;
generarExpedientes = function () {
  const extra = eraActual().dilemasExtra || {};
  const orig = {};
  for (const id in extra) { const d = DILEMAS.find(x => x.id === id); if (d) { orig[id] = d.peso; d.peso += extra[id]; } }
  _generarExpedientesV3();
  for (const id in orig) DILEMAS.find(x => x.id === id).peso = orig[id];
};

// ---------- Justicia ----------
const JUECES = [
  { nombre: "Dr. Claudio Benavídez", afinidad: -0.5, estilo: "implacable con los gobiernos" },
  { nombre: "Dra. Marta Sarmiento Ocampo", afinidad: 0.1, estilo: "lee hacia dónde sopla el viento" },
  { nombre: "Dr. Norberto Oyola", afinidad: 0.6, estilo: "famoso por cajonear causas" },
  { nombre: "Dr. Ariel Landaburu", afinidad: 0, estilo: "negociador con todos" },
  { nombre: "Dr. Julián Etcheverría", afinidad: -0.3, estilo: "riguroso y lento" },
  { nombre: "Dra. Sandra Alvear", afinidad: -0.2, estilo: "independiente" },
];
const ETAPAS = ["Denuncia", "Instrucción e indagatorias", "Procesamiento", "Elevación a juicio oral", "Sentencia"];
const TEMAS_CAUSA = ["sobreprecios en obra pública", "sobornos en la compra de trenes", "cuadernos de un chofer con pagos ilegales", "contratos de seguros con el Estado", "lavado de dinero en una financiera", "compra de vacunas con sobreprecio", "uso de aviones oficiales", "subsidios a empresas de transporte"];

function nuevaCausa(origen) {
  const yo = S.jugador;
  const sospechoso = R.rand() < 0.15 + (S.riesgo > 40 ? 0.15 : 0) ? { tipo: "presidente", nombre: yo.nombre } : (() => { const m = R.pick(S.gabinete); return { tipo: "ministro", nombre: m.nombre, cargo: m.cargo }; })();
  const juez = { ...R.pick(JUECES) };
  const c = { id: Date.now() + "" + Math.floor(R.rand() * 1000), tema: R.pick(TEMAS_CAUSA), imputado: sospechoso, juez, etapa: 0, avance: 0, origen, accionTrimestre: false, cerrada: false };
  S.causasJ.push(c);
  const quien = sospechoso.tipo === "presidente" ? "a vos" : `a ${sospechoso.nombre} (${sospechoso.cargo})`;
  log(`Se abre una causa por ${c.tema} que apunta ${quien}. Juez: ${juez.nombre}, ${juez.estilo}.`, "malo");
  titular(R.pick(MEDIOS).nombre, `Investigan ${c.tema}: la causa salpica al gobierno`);
  return c;
}

function avanzarCausas() {
  const ev = [];
  const hostil = (50 - relActor("prensa")) / 100;
  for (const c of S.causasJ.filter(x => !x.cerrada)) {
    c.accionTrimestre = false;
    const velocidad = 0.32 + hostil * 0.3 + S.riesgo / 250 - c.juez.afinidad * 0.25 - (S.corte.afines >= 3 ? 0.08 : 0) + (S.ind.imagen < 35 ? 0.12 : 0);
    c.avance += Math.max(0.05, velocidad + R.gauss() * 0.1);
    if (c.avance >= 1) {
      c.avance = 0; c.etapa++;
      const golpe = c.imputado.tipo === "presidente" ? 2 : 1;
      const efectos = [null, { imagen: -2 * golpe }, { imagen: -3 * golpe, legitimidad: -3 * golpe }, { imagen: -3 * golpe, legitimidad: -3 * golpe }, { imagen: -5 * golpe, legitimidad: -5 * golpe }][c.etapa];
      if (efectos) aplicarEfectos(efectos);
      let texto = `La causa por ${c.tema} pasa a la etapa: ${ETAPAS[c.etapa]}.`;
      if (c.etapa === 2 && c.imputado.tipo === "ministro" && S.gabinete.some(m => m.nombre === c.imputado.nombre)) texto += ` ${c.imputado.nombre} queda procesado. La oposición exige su renuncia.`;
      if (c.etapa === 4) {
        c.cerrada = true;
        const condena = R.rand() < 0.6 - c.juez.afinidad * 0.3;
        if (condena) {
          texto = `Sentencia en la causa por ${c.tema}: ${c.imputado.nombre} es condenado.`;
          if (c.imputado.tipo === "ministro") { const m = S.gabinete.find(x => x.nombre === c.imputado.nombre); if (m) { m.nombre = R.pick(["Agustín Roldán", "Luciana Olmedo", "Guillermo Funes", "Mariana Lombardi"]); m.desgaste = 0; texto += " Tuviste que reemplazarlo."; } }
          else { aplicarEfectos({ legitimidad: -10 }); texto += " Un presidente condenado: la oposición pide el juicio político."; S.forzarJuicio = true; }
        } else { texto = `Sentencia en la causa por ${c.tema}: absolución. El gobierno respira.`; aplicarEfectos({ imagen: 3, legitimidad: 3 }); }
      }
      ev.push({ titulo: "Justicia federal", texto, tipo: c.etapa === 4 && texto.includes("absolución") ? "bueno" : "malo" });
      log(texto, "malo");
    }
  }
  if (S.forzarJuicio && typeof juicioPolitico === "function") { S.forzarJuicio = false; ev.push(juicioPolitico()); }
  return ev;
}

function accionCausa(idCausa, accion) {
  const c = S.causasJ.find(x => x.id === idCausa);
  if (!c || c.cerrada || c.accionTrimestre) return { msg: "Ya actuaste sobre esta causa este trimestre." };
  c.accionTrimestre = true;
  switch (accion) {
    case "respetar":
      aplicarEfectos({ legitimidad: 2 }); moverActor("corte", 3);
      return { msg: "Dijiste que la Justicia debe actuar con libertad. Los jueces lo valoran.", tipo: "info" };
    case "renuncia": {
      if (c.imputado.tipo === "presidente") return { msg: "No podés pedirte la renuncia a vos mismo." };
      const m = S.gabinete.find(x => x.nombre === c.imputado.nombre);
      if (m) { m.nombre = R.pick(["Agustín Roldán", "Luciana Olmedo", "Guillermo Funes", "Mariana Lombardi", "Juan Medina Arce"]); m.desgaste = 0; m.comp = R.clamp(m.comp - 1, 3, 9); }
      c.imputado = { ...c.imputado, tipo: "exfuncionario" };
      aplicarEfectos({ imagen: 1, legitimidad: 2 });
      return { msg: "Le pediste la renuncia. La causa sigue, pero ya no es contra un funcionario en ejercicio y te pega menos.", tipo: "info" };
    }
    case "operar": {
      if (R.rand() < 0.35) {
        aplicarEfectos({ legitimidad: -7, imagen: -4 }); moverActor("prensa", -15); moverActor("corte", -15);
        return { msg: `Se filtraron los mensajes de tu operador judicial con ${c.juez.nombre}. Escándalo institucional.`, tipo: "malo" };
      }
      c.juez.afinidad = Math.min(1, c.juez.afinidad + 0.4); c.avance = Math.max(0, c.avance - 0.3);
      S.riesgo += 5;
      return { msg: `Tu operador judicial habló con gente cercana a ${c.juez.nombre}. La causa se enfría.`, tipo: "aviso" };
    }
    case "consejo": {
      // Consejo de la Magistratura: hacen falta dos tercios para acusar a un juez
      const votos = S.consejo.oficialistas + Math.round(R.rand() * 4 + relActor("corte") / 30);
      if (votos >= 9) {
        const viejo = c.juez.nombre;
        c.juez = { ...R.pick(JUECES.filter(j => j.nombre !== viejo)) };
        aplicarEfectos({ legitimidad: -4 }); moverActor("corte", -10); moverActor("prensa", -8);
        return { msg: `El Consejo de la Magistratura acusó a ${viejo} con ${votos} de 13 votos y lo suspendió. La causa pasa a ${c.juez.nombre}. La oposición habla de persecución a jueces.`, tipo: "aviso" };
      }
      aplicarEfectos({ legitimidad: -3 }); moverActor("corte", -8);
      return { msg: `El Consejo de la Magistratura rechazó acusar al juez: ${votos} votos de 9 necesarios. El juez sale fortalecido.`, tipo: "malo" };
    }
  }
  return {};
}

// ---------- Prensa ----------
const PERIODISTAS = [
  { nombre: "Hernán Aldaburu", medio: "Diario El Faro", estilo: "investigación de largo aliento" },
  { nombre: "Irene Valdivieso", medio: "Página Sur", estilo: "denuncias sobre servicios de inteligencia y jueces" },
  { nombre: "Javier Lamberti", medio: "Canal Federal Noticias", estilo: "programa de denuncias del domingo" },
  { nombre: "Noelia Paredes", medio: "Radio Pampa", estilo: "entrevistas incisivas" },
];

function avanzarPeriodistas() {
  const ev = [];
  for (const p of S.periodistas) {
    const medio = MEDIOS.find(m => m.nombre === p.medio);
    const hostil = medio ? Math.abs(medio.afinidad - S.jugador.ideo) / 50 : 0.5;
    p.progreso += 4 + S.riesgo / 5 + hostil * 8 - S.pauta * 3 + R.rand() * 6;
    if (p.progreso >= 100) {
      p.progreso = R.rand() * 15;
      aplicarEfectos({ imagen: -3 });
      const c = nuevaCausa("periodismo");
      const t = `${p.nombre} (${p.medio}) publica una investigación sobre ${c.tema}. Un fiscal la toma y abre una causa.`;
      titular(p.medio, `Exclusivo: ${c.tema}`);
      ev.push({ titulo: "Investigación periodística", texto: t, tipo: "malo" });
      log(t, "malo");
      break; // una por trimestre
    }
  }
  return ev;
}

function setPauta(nivel) {
  S.pauta = nivel;
}
function aplicarPauta() {
  if (!S.pauta) return;
  aplicarEfectos({ deficit: S.pauta * 0.04 });
  moverActor("prensa", S.pauta * 3);
  MEDIOS.forEach(m => { m.afinidad += (S.jugador.ideo - m.afinidad) * 0.03 * S.pauta; });
  if (S.pauta >= 3) S.riesgo += 2;
}

function conferenciaPrensa() {
  if (S.conferencia) return { msg: "Ya diste una conferencia este trimestre." };
  S.conferencia = true;
  const yo = S.jugador;
  const r = (yo.oratoria - 5) * 0.8 + (relActor("prensa") - 50) / 25 + R.gauss() * 1.5;
  aplicarEfectos({ imagen: r });
  if (r < -1) titular(R.pick(MEDIOS).nombre, `Tensión en la conferencia: ${yo.nombre} se enojó con un periodista`);
  return { msg: r > 1 ? "Conferencia sólida: respondiste todo y marcaste agenda." : r < -1 ? "La conferencia salió mal: te enojaste con un periodista y el video circula." : "Conferencia sin sobresaltos.", tipo: r > 1 ? "bueno" : r < -1 ? "malo" : "info" };
}

function cadenaNacional() {
  S.cadenas++;
  const yo = S.jugador;
  const fatiga = Math.max(0, S.cadenas - 2) * 1.5;
  const r = (yo.carisma - 5) * 0.7 + 1.5 - fatiga + R.gauss();
  aplicarEfectos({ imagen: r, tension: r > 0 ? -1 : 1 });
  moverActor("prensa", -2);
  return { msg: r > 0.5 ? "Tu cadena nacional levantó el ánimo y ordenó la agenda." : `La cadena nacional cayó mal: ${S.cadenas > 2 ? "la gente está harta de que interrumpas la novela" : "mensaje confuso"}.`, tipo: r > 0.5 ? "bueno" : "malo" };
}

function generarTapas() {
  const I = S.ind, yo = S.jugador;
  const temas = [];
  if (I.inflacion > 4) temas.push(["La inflación no da tregua: " + fmt(I.inflacion) + "% en el último mes", "Precios: el Gobierno apuesta a la desaceleración"]);
  if (I.inflacion < 2) temas.push(["La inflación baja pero el bolsillo no se recupera", "La inflación más baja en años"]);
  if (I.tension > 60) temas.push(["Clima social al rojo vivo", "El Gobierno llama al diálogo"]);
  if (I.reservas < 8000) temas.push(["Alarma por las reservas del Central", "El Central asegura que hay dólares"]);
  if (I.crecimiento > 2) temas.push(["La economía crece, pero no llega a todos", "Despega la economía"]);
  if (I.inseguridad > 65) temas.push(["Inseguridad: otro crimen conmociona al conurbano", "Seguridad anuncia más efectivos"]);
  if (S.causasJ && S.causasJ.some(c => !c.cerrada)) temas.push(["La causa que complica al Gobierno", "Operación judicial contra el Gobierno, denuncian"]);
  temas.push(["Internas en el oficialismo por el rumbo económico", "El Presidente ordena su gabinete"], ["Los gobernadores le reclaman fondos a la Casa Rosada", "Acuerdo federal con los gobernadores"], ["Crece la desconfianza en la dirigencia", "Encuesta: el Gobierno conserva apoyo"]);
  const usados = [];
  S.tapas = MEDIOS.slice(0, 4).map(m => {
    const afin = 100 - Math.abs(m.afinidad - yo.ideo) * 2.5 + (relActor("prensa") - 50) / 2;
    const libres = temas.filter(t => !usados.includes(t));
    const t = libres.length ? libres[Math.floor(R.rand() * Math.min(libres.length, 3))] : R.pick(temas);
    usados.push(t);
    const linea = afin > 72 ? "amable" : afin < 45 ? "opositora" : "neutral";
    return { medio: m.nombre, titulo: linea === "amable" ? t[1] : t[0], linea };
  });
}

// ---------- Proyectos de ley propios y derogaciones ----------
const IMPUESTOS = [
  { id: "iva", nombre: "IVA", ideoSube: 55, sube: { deficit: -0.9, inflacion: 0.5, pobreza: 1.2 }, grp: { informales: -0.3, media: -0.2 } },
  { id: "ganancias", nombre: "Ganancias de los trabajadores", ideoSube: 40, sube: { deficit: -0.5 }, grp: { trabajadores: -0.35, media: -0.2 } },
  { id: "bienes", nombre: "Bienes Personales (grandes patrimonios)", ideoSube: 25, sube: { deficit: -0.3, reservas: -500 }, grp: { empresarios: -0.3, media: -0.1, informales: 0.05 } },
  { id: "retenciones", nombre: "Retenciones a las exportaciones", ideoSube: 30, sube: { deficit: -0.6, crecimiento: -0.3, reservas: -800 }, grp: { campo: -0.6 } },
  { id: "dolar", nombre: "Impuesto a la compra de dólares", ideoSube: 30, sube: { deficit: -0.3, reservas: 1200 }, grp: { media: -0.35 } },
  { id: "cheque", nombre: "Impuesto al cheque", ideoSube: 50, sube: { deficit: -0.4, crecimiento: -0.15 }, grp: { empresarios: -0.2 } },
];
const PROGRAMAS = [
  { id: "obras", nombre: "Plan de viviendas sociales", area: "infra", ef: { deficit: 0.5, desempleo: -0.4, crecimiento: 0.3 }, grp: { informales: 0.25, trabajadores: 0.15 }, ideo: 35 },
  { id: "becas", nombre: "Becas universitarias y de ciencia", area: "educacion", ef: { deficit: 0.15 }, grp: { jovenes: 0.3, media: 0.1 }, ideo: 40 },
  { id: "hospitales", nombre: "Red federal de hospitales", area: "salud", ef: { deficit: 0.35, imagen: 2 }, grp: { jubilados: 0.2, informales: 0.15 }, ideo: 40, adhesion: true },
  { id: "policia", nombre: "Ley de policía federal de proximidad", area: "seguridad", ef: { deficit: 0.2, inseguridad: -5 }, grp: { media: 0.25 }, ideo: 62, adhesion: true },
  { id: "pymes", nombre: "Régimen de promoción pyme", area: "produccion", ef: { deficit: 0.2, desempleo: -0.4, crecimiento: 0.2 }, grp: { empresarios: 0.2, trabajadores: 0.1 }, ideo: 50, adhesion: true },
  { id: "respFiscal", nombre: "Ley de responsabilidad fiscal", area: null, ef: { deficit: -0.4, legitimidad: 2 }, grp: { empresarios: 0.15 }, ideo: 65, adhesion: true },
  { id: "alquileres", nombre: "Ley de alquileres", area: null, ef: { imagen: 1 }, grp: { jovenes: 0.25, media: 0.05 }, ideo: 40 },
  { id: "teletrabajo", nombre: "Ley de teletrabajo", area: null, ef: {}, grp: { jovenes: 0.15, empresarios: -0.1 }, ideo: 40 },
];

function redactarProyecto(tipo, id, direccion) {
  // devuelve una medida dinámica con efectos calculados
  if (tipo === "impuesto") {
    const imp = IMPUESTOS.find(x => x.id === id);
    const s = direccion === "sube" ? 1 : -1;
    const ef = {}; for (const k in imp.sube) ef[k] = imp.sube[k] * s;
    const grp = {}; for (const k in imp.grp) grp[k] = imp.grp[k] * s;
    return { id: `din_${tipo}_${id}_${direccion}`, nombre: `${s > 0 ? "Aumento" : "Baja"} del ${imp.nombre}`, materia: "tributaria", ideo: s > 0 ? imp.ideoSube : 100 - imp.ideoSube, inst: ["ley"], ef, grupos: grp, dinamica: true };
  }
  const p = PROGRAMAS.find(x => x.id === id);
  return { id: `din_${tipo}_${id}`, nombre: p.nombre, materia: p.area ? "social" : "economica", ideo: p.ideo, inst: ["ley"], ef: { ...p.ef }, grupos: { ...p.grp }, dinamica: true, adhesion: p.adhesion };
}

function enviarProyecto(medida, extra = 0) {
  if (S.medidasEsteTrimestre >= 1) return { ok: false, msg: "Ya tomaste la medida grande de este mes." };
  if (S.medidasActivas.includes(medida.id)) return { ok: false, msg: "Ya rige una ley igual." };
  // la registramos para que el resto del motor la encuentre
  if (!MEDIDAS.find(m => m.id === medida.id)) MEDIDAS.push(medida);
  if (!S.medidasDinamicas.find(m => m.id === medida.id)) S.medidasDinamicas.push(medida);
  const r = tomarMedida(medida.id, "ley", extra);
  if (r.ok && r.aprobada && medida.adhesion) r.msg += " " + adhesiones(medida);
  return r;
}

function adhesiones(medida) {
  const adh = Object.entries(S.gobernadores).filter(([, g]) => g.relacion + (R.rand() * 40 - 20) > -5);
  const pob = adh.reduce((a, [pid]) => a + PROVINCIAS.find(p => p.id === pid).pob, 0);
  const tot = PROVINCIAS.reduce((a, p) => a + p.pob, 0);
  const frac = pob / tot;
  // la parte de las provincias que no adhieren no se aplica
  const falta = 1 - frac;
  const ef = {}; for (const k in medida.ef) ef[k] = -medida.ef[k] * falta * 0.5;
  aplicarEfectos(ef);
  return `Adhirieron ${adh.length} de 24 provincias (${Math.round(frac * 100)}% de la población). Donde no adhieren, la ley no se aplica.`;
}

function derogarMedida(id) {
  const m = MEDIDAS.find(x => x.id === id);
  if (!m || !S.medidasActivas.includes(id)) return { ok: false, msg: "Esa medida no está vigente." };
  if (S.medidasEsteTrimestre >= 1) return { ok: false, msg: "Ya tomaste la medida grande de este mes." };
  // lo que se hizo por ley se deroga por ley; lo demás, con otro decreto
  const porLey = !m.inst.some(i => i === "resolucion" || i === "decreto" || i === "dnu") || m.dinamica;
  S.medidasEsteTrimestre++;
  let pasos = [], ok = true;
  if (porLey) {
    const contra = { ...m, ideo: 100 - m.ideo };
    const r = tratarLey(contra, 0); pasos = r.pasos; ok = r.aprobado;
  }
  if (ok) {
    const ef = {}; for (const k in (m.ef || {})) ef[k] = -m.ef[k] * 0.7;
    const gr = {}; for (const k in (m.grupos || {})) gr[k] = -m.grupos[k] * 0.7;
    aplicarEfectos(ef, gr);
    S.medidasActivas = S.medidasActivas.filter(x => x !== id);
    log(`Derogaste: ${m.nombre}.`, "info");
    return { ok: true, aprobada: true, pasos, msg: `${porLey ? "El Congreso derogó" : "Derogaste por decreto"}: ${m.nombre}. Sus efectos se revierten en parte.` };
  }
  return { ok: true, aprobada: false, pasos, msg: `El Congreso no aprobó la derogación de ${m.nombre}.` };
}

// ---------- Integración con el ciclo trimestral ----------
const _terminarTrimestreV3 = terminarTrimestre;
terminarTrimestre = function () {
  const cierre = finDeTrimestre();
  if (cierre) aplicarPauta();
  // el plan austral sólo fracasa si el déficit sigue alto
  S.diferidos = (S.diferidos || []).filter(d => !(d.cond === "deficit" && d.t <= S.trimestre && S.ind.deficit < 2));
  const ev = _terminarTrimestreV3();
  if (S.convertibilidad && !S.perdio) {
    S.ind.inflacion = Math.min(S.ind.inflacion, 0.6);
    S.ind.reservas -= (Math.max(0, S.ind.deficit - 1) * 900 + (S.ind.crecimiento < 0 ? 800 : 0)) / 3;
    S.ind.desempleo += 0.25 / 3;
    if (S.ind.reservas < 3000) {
      S.convertibilidad = false;
      aplicarEfectos({ inflacion: 6, pobreza: 12, tension: 20, imagen: -15, crecimiento: -4, legitimidad: -10 });
      ev.push({ titulo: "Estalla la convertibilidad", texto: "Sin reservas, el uno a uno se vuelve imposible. Corralito, devaluación y bronca en las calles.", tipo: "malo" });
    }
  }
  if (S.perdio || S.terminoMandato) return ev;
  if (!cierre) { generarTapas(); return ev; }
  // causas nuevas: escándalos del motor y riesgo acumulado
  const nuevasMotor = (S.causas || 0) - S.causasContadas;
  for (let i = 0; i < nuevasMotor; i++) nuevaCausa("escándalo");
  S.causasContadas = S.causas || 0;
  if (S.riesgo > 25 && R.rand() < S.riesgo / 300 && S.causasJ.filter(c => !c.cerrada).length < 3) nuevaCausa("denuncia");
  const evJ = avanzarCausas();
  const evP = avanzarPeriodistas();
  S.conferencia = false;
  S.cadenas = Math.max(0, S.cadenas - 1);
  generarTapas();
  return [...ev, ...evJ, ...evP];
};
