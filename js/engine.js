// =============================================================
//  VALDORA - Motor del juego (lógica sin interfaz)
// =============================================================

const R = {
  rand: () => Math.random(),
  between: (a, b) => a + Math.random() * (b - a),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  gauss: () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
};
const fmt = (n, d = 1) => Number(n).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });

let S = null; // estado global de la partida

const SEMANAS_CAMPANA = 12;
const SEMANA_INTERNA = 4;
const MESES_CAMPANA = SEMANAS_CAMPANA / 2; // cada turno de campaña es un mes (dos semanas del modelo)
const AP_MES = 6;
function mesDeSemana(s) { return Math.ceil(s / 2); }
const TRIMESTRES_MANDATO = 16;
const MESES_MANDATO = 48;
// paso de tiempo: el modelo está calibrado por trimestre; un turno mensual es un tercio
function pasoT() { return (S && S.paso) || 1; }
function suav(x, obj, a) { const k = Math.pow(a, pasoT()); return x * k + obj * (1 - k); }
function ruido(s) { return R.gauss() * s * Math.sqrt(pasoT()); }
function finDeTrimestre() { return !S.mes || S.mes % 3 === 0; }
function etiquetaMes(m) { const a = Math.ceil(m / 12), mm = ((m - 1) % 12) + 1; return `Año ${a}, mes ${mm}`; }

// ---------- Creación de partida ----------

function nuevoCandidato(id, nombre, partido, ideo, attrs, esJugador) {
  const know = {};
  PROVINCIAS.forEach(p => know[p.id] = esJugador ? 0.18 : 0.35);
  const sym = {};
  GRUPOS.forEach(g => sym[g.id] = 0);
  return {
    id, nombre, partido, ideo, ...attrs, esJugador: !!esJugador,
    know, sym, local: Object.fromEntries(PROVINCIAS.map(p => [p.id, 0])),
    imagen: esJugador ? 0 : 2, plata: 0, militantes: 0, fiscales: 0.5,
    activo: true,
  };
}

function iniciarPartida(cfg) {
  // cfg: {nombre, ideo, carisma, oratoria, gestion, negociacion, objetivo, camino, partido, nombrePartido}
  S = {
    fase: "campana", semana: 1, cfg,
    log: [], titulares: [], favores: [], pactos: [], riesgo: 0,
    avales: 0, lealtad: 30, apoyoInterno: 0,
    encuestadora: 0, encuestas: [],
    pasoHecha: false, internaGanada: false, balotaje: false,
    eventosUsados: [],
  };
  const attrs = { carisma: cfg.carisma, oratoria: cfg.oratoria, gestion: cfg.gestion, negociacion: cfg.negociacion };
  let partidoJugador;
  if (cfg.camino === "fundar") {
    partidoJugador = "NUEVO";
    PARTIDOS.NUEVO = { id: "NUEVO", nombre: cfg.nombrePartido || "Partido Nuevo", corto: siglas(cfg.nombrePartido || "Partido Nuevo"),
      color: "#16a39a", ideo: cfg.ideo, fuerza: {}, desc: "Tu partido." };
  } else {
    partidoJugador = cfg.partido;
    delete PARTIDOS.NUEVO;
  }
  const jugador = nuevoCandidato("yo", cfg.nombre, partidoJugador, cfg.ideo, attrs, true);
  jugador.plata = cfg.camino === "fundar" ? 2 : 5;
  jugador.militantes = cfg.camino === "fundar" ? 150 : 1500;
  jugador.fiscales = cfg.camino === "fundar" ? 0.15 : 0.6;
  S.jugador = jugador;

  S.candidatos = [jugador];
  for (const pid of ["MNJ", "UR", "FC", "LY", "FT"]) {
    const P = PARTIDOS[pid], b = RIVALES_BASE[pid];
    const c = nuevoCandidato(pid, P.candidato, pid, P.ideo, b, false);
    c.plata = b.plata; c.estrategia = b.estrategia; c.militantes = 3000 * (b.plata / 5); c.fiscales = pid === "MNJ" ? 0.95 : pid === "UR" ? 0.8 : 0.55;
    if (pid === "FT") c.know = Object.fromEntries(PROVINCIAS.map(p => [p.id, 0.25]));
    if (pid === partidoJugador) { c.internoRival = true; c.know = Object.fromEntries(PROVINCIAS.map(p => [p.id, 0.26])); }
    S.candidatos.push(c);
  }
  // Tipo de interna
  if (cfg.camino === "fundar") S.tipoInterna = "avales";
  else S.tipoInterna = cfg.tipoInterna || PARTIDOS[partidoJugador].interna;
  S.avalesNecesarios = 4000;
  log(`Comienza la campaña presidencial. Faltan ${MESES_CAMPANA} meses para la elección general.`, "info");
  if (S.tipoInterna === "avales") log(`Para inscribir a ${PARTIDOS.NUEVO.nombre} necesitás ${S.avalesNecesarios.toLocaleString("es-AR")} avales antes de fin del mes ${mesDeSemana(SEMANA_INTERNA - 1)}.`, "aviso");
  if (S.tipoInterna === "PASO") log(`El ${PARTIDOS[partidoJugador].corto} define su candidato en las PASO de fin del mes ${mesDeSemana(SEMANA_INTERNA)}. Tu rival interno es ${rivalInterno().nombre}.`, "aviso");
  if (S.tipoInterna === "cerrada") log(`La Unión elige candidato en interna cerrada de afiliados a fin del mes ${mesDeSemana(SEMANA_INTERNA - 1)}. Rival: ${rivalInterno().nombre}.`, "aviso");
  if (S.tipoInterna === "dedo") log(`En el ${PARTIDOS[partidoJugador].corto} decide ${PARTIDOS[partidoJugador].lider} con el dedo a fin del mes ${mesDeSemana(SEMANA_INTERNA - 1)}. Ganate su confianza.`, "aviso");
  nuevaSemana(true);
  S.ap = AP_MES;
}

function siglas(n) { return n.split(/\s+/).filter(w => w.length > 2).map(w => w[0].toUpperCase()).join("").slice(0, 4) || "PN"; }

function rivalInterno() { return S.candidatos.find(c => c.internoRival && c.activo); }
function candidatosEnCarrera() {
  return S.candidatos.filter(c => c.activo && !(c.internoRival && !S.internaResuelta));
}
// Antes de resolver la interna, el partido del jugador "compite" con quien tenga más chances
function candidatosParaEncuesta() {
  if (S.internaResuelta) return S.candidatos.filter(c => c.activo);
  const yo = S.jugador, r = rivalInterno();
  return S.candidatos.filter(c => c.activo && c !== r && (c !== yo || true));
}

function log(txt, tipo = "") { S.log.unshift({ sem: etiquetaTiempo(), txt, tipo }); if (S.log.length > 120) S.log.pop(); }
function titular(medio, txt) { S.titulares.unshift({ medio, txt, sem: etiquetaTiempo() }); if (S.titulares.length > 30) S.titulares.pop(); }
function etiquetaTiempo() {
  if (!S) return "";
  if (S.fase === "gobierno" || S.fase === "gobiernoLocal" || S.fase === "legislador") return S.mes ? `M${S.mes}` : `T${S.trimestre}`;
  if (S.fase === "campana") return `Mes ${Math.ceil(S.semana / 2)}`;
  return `S${S.semana}`;
}

// ---------- Modelo de voto ----------

function utilidad(c, grupo, prov) {
  const perfil = PERFILES[prov.perfil];
  const ideoVotante = grupo.ideo + perfil.shift;
  const dist = (ideoVotante - c.ideo) / 22;
  const P = PARTIDOS[c.partido] || {};
  const fuerza = (P.fuerza && P.fuerza[prov.perfil]) || 0;
  let u = -dist * dist * 0.8
    + 2.2 * Math.sqrt(c.know[prov.id])
    + c.sym[grupo.id]
    + c.local[prov.id]
    + c.imagen / 12
    + fuerza * 0.8
    + (c.carisma - 5) * 0.04;
  // voto castigo/premio al oficialismo (en campaña no hay oficialismo jugable)
  if (c.partido === "LY") u += (grupo.id === "jovenes" ? 0.5 : 0);
  if (c.partido === "FT") u -= 0.6;
  return u * grupo.volatil;
}

function resultadosProvincia(prov, cands) {
  const perfil = PERFILES[prov.perfil];
  const votos = Object.fromEntries(cands.map(c => [c.id, 0]));
  let blanco = 0, total = 0;
  for (const g of GRUPOS) {
    const peso = perfil.mix[g.id] || 0;
    if (!peso) continue;
    const us = cands.map(c => Math.exp(utilidad(c, g, prov)));
    const sumU = us.reduce((a, b) => a + b, 0) + 0.35; // 0.35 = blanco / no sabe
    cands.forEach((c, i) => votos[c.id] += peso * us[i] / sumU);
    blanco += peso * 0.35 / sumU;
    total += peso;
  }
  // fiscales: sin fiscales se "pierden" votos en el escrutinio
  cands.forEach(c => votos[c.id] *= 0.95 + 0.05 * c.fiscales);
  const validos = Object.values(votos).reduce((a, b) => a + b, 0);
  const pct = {};
  cands.forEach(c => pct[c.id] = 100 * votos[c.id] / validos);
  return { pct, blanco: 100 * blanco / total };
}

function resultadosNacionales(cands) {
  cands = cands || candidatosParaEncuesta();
  const totPob = PROVINCIAS.reduce((a, p) => a + p.pob, 0);
  const nac = Object.fromEntries(cands.map(c => [c.id, 0]));
  const porProv = {};
  for (const p of PROVINCIAS) {
    const r = resultadosProvincia(p, cands);
    porProv[p.id] = r.pct;
    cands.forEach(c => nac[c.id] += r.pct[c.id] * p.pob / totPob);
  }
  return { nac, porProv };
}

function ganadorProvincia(pct) {
  let best = null, bv = -1;
  for (const k in pct) if (pct[k] > bv) { bv = pct[k]; best = k; }
  return best;
}

function encuesta() {
  const enc = ENCUESTADORAS[S.encuestadora];
  const { nac } = resultadosNacionales();
  const out = {};
  let tot = 0;
  for (const id in nac) {
    const c = S.candidatos.find(x => x.id === id);
    const v = Math.max(0.5, nac[id] + (enc.sesgo[c.partido] || 0) + R.gauss() * enc.error / 2);
    out[id] = v; tot += v;
  }
  for (const id in out) out[id] = out[id] * 100 / tot;
  return out;
}

// ---------- Acciones de campaña ----------

const ACCIONES = {
  recorrida: { nombre: "Recorrida", ap: 1, plata: 0.2, necesitaProv: true, desc: "Caminar barrios y pueblos de la provincia elegida." },
  acto:      { nombre: "Acto masivo", ap: 2, plata: 1, necesitaProv: true, desc: "Gran acto con militancia y micros. Mucha cobertura." },
  spot:      { nombre: "Spot de TV", ap: 1, plata: 3, necesitaGrupo: true, desc: "Campaña nacional dirigida a un grupo social." },
  redes:     { nombre: "Campaña en redes", ap: 1, plata: 0.5, desc: "Videos, streamers y memes. Fuerte en jóvenes." },
  entrevista:{ nombre: "Entrevista", ap: 1, plata: 0, necesitaMedio: true, desc: "Depende de tu oratoria y de la línea del medio." },
  pacto:     { nombre: "Pacto sectorial", ap: 1, plata: 0, necesitaSector: true, desc: "Acuerdo con un sector. Te compromete en el gobierno." },
  recaudar:  { nombre: "Cena de recaudación", ap: 1, plata: 0, desc: "Juntar fondos limpios con empresarios amigos." },
  militantes:{ nombre: "Sumar militantes y fiscales", ap: 1, plata: 0.3, desc: "Abrir locales, formar fiscales de mesa." },
  operacion: { nombre: "Operación de prensa", ap: 1, plata: 1.5, necesitaRival: true, desc: "Filtrar una carpeta contra un rival. Puede salir mal." },
  avales:    { nombre: "Juntar avales", ap: 1, plata: 0.2, soloInterna: "avales", desc: "Mesas en la calle para juntar firmas." },
  lealtad:   { nombre: "Acompañar al líder", ap: 1, plata: 0, soloInterna: "dedo", desc: "Mostrar lealtad, defenderlo en los medios." },
  comites:   { nombre: "Recorrer comités", ap: 1, plata: 0.2, soloInterna: "cerrada", desc: "Ganar a los delegados y afiliados." },
};

function accionDisponible(id) {
  const a = ACCIONES[id];
  if (a.soloInterna && (S.tipoInterna !== a.soloInterna || S.internaResuelta)) return false;
  return true;
}

function ejecutarAccion(id, opt = {}) {
  const a = ACCIONES[id], yo = S.jugador;
  if (S.ap < a.ap) return { ok: false, msg: "No te quedan acciones este mes." };
  if (yo.plata < a.plata) return { ok: false, msg: "No te alcanza la plata. Recaudá o aceptá un aporte." };
  S.ap -= a.ap; yo.plata -= a.plata;
  const car = yo.carisma / 10, ora = yo.oratoria / 10, neg = yo.negociacion / 10;
  let msg = "";
  switch (id) {
    case "recorrida": {
      const p = PROVINCIAS.find(x => x.id === opt.prov);
      yo.know[p.id] = Math.min(1, yo.know[p.id] + 0.07 + 0.06 * car);
      yo.local[p.id] += 0.12 + 0.1 * car;
      msg = `Recorriste ${p.nombre}. Te conocen más y la gente te para en la calle.`;
      break;
    }
    case "acto": {
      const p = PROVINCIAS.find(x => x.id === opt.prov);
      const lleno = yo.militantes > 800 || R.rand() < 0.4;
      if (lleno) {
        yo.know[p.id] = Math.min(1, yo.know[p.id] + 0.12 + 0.05 * car);
        yo.local[p.id] += 0.25 + 0.1 * ora;
        yo.militantes += 250; yo.imagen += 0.5;
        msg = `Acto multitudinario en ${p.nombre}. Las fotos aéreas recorren los canales.`;
      } else {
        yo.know[p.id] = Math.min(1, yo.know[p.id] + 0.05);
        yo.imagen -= 1.5;
        msg = `El acto en ${p.nombre} se vio vacío. La prensa opositora publica la foto.`;
        titular("Diario El Faro", `Acto con poca gente para ${yo.nombre}`);
      }
      break;
    }
    case "spot": {
      const g = GRUPOS.find(x => x.id === opt.grupo);
      PROVINCIAS.forEach(p => yo.know[p.id] = Math.min(1, yo.know[p.id] + 0.04));
      const exito = R.rand() < 0.75 + 0.15 * car;
      yo.sym[g.id] += exito ? 0.22 + 0.1 * car : -0.08;
      msg = exito ? `El spot dirigido a ${g.nombre.toLowerCase()} pega bien.` : `El spot para ${g.nombre.toLowerCase()} fue criticado por oportunista.`;
      break;
    }
    case "redes": {
      PROVINCIAS.forEach(p => yo.know[p.id] = Math.min(1, yo.know[p.id] + 0.02));
      if (R.rand() < 0.12) { yo.imagen -= 2; msg = "Un video tuyo viejo se viraliza en tu contra. Escrache en redes."; titular("La Posta", `Furor por un video viejo de ${yo.nombre}`); }
      else { yo.sym.jovenes += 0.2 + 0.1 * ora; yo.sym.media += 0.08; msg = "Tu campaña en redes es tendencia."; }
      break;
    }
    case "entrevista": {
      const m = MEDIOS.find(x => x.id === opt.medio);
      const afin = (100 - Math.abs(m.afinidad - yo.ideo)) / 100; // 0..1
      const res = (ora - 0.5) * 2 + (afin - 0.6) * 1.5 + R.gauss() * 0.5;
      for (const g in m.alcance) yo.sym[g] += res * 0.12 * m.alcance[g];
      PROVINCIAS.forEach(p => yo.know[p.id] = Math.min(1, yo.know[p.id] + 0.025));
      yo.imagen += res;
      msg = res > 0.3 ? `Gran entrevista en ${m.nombre}. Respondiste con soltura.` : res < -0.3 ? `Te incomodaron en ${m.nombre}. Un clip de tu respuesta circula como burla.` : `Entrevista correcta en ${m.nombre}, sin grandes titulares.`;
      if (res < -0.3) titular(m.nombre, `${yo.nombre} trastabilló ante una pregunta incómoda`);
      break;
    }
    case "pacto": {
      const sec = SECTORES[opt.sector];
      if (S.pactos.includes(opt.sector)) { S.ap += a.ap; return { ok: false, msg: "Ya tenés un pacto con ese sector." }; }
      for (const g in sec.efectos) yo.sym[g] += sec.efectos[g] * (0.7 + 0.6 * neg);
      if (sec.plata) yo.plata += sec.plata;
      S.pactos.push(opt.sector);
      msg = `Firmaste un acuerdo con ${sec.nombre}. Compromiso: ${sec.compromiso}.`;
      break;
    }
    case "recaudar": {
      const m = 0.6 + 1.2 * neg + (yo.partido === "NUEVO" ? -0.2 : 0.3);
      yo.plata += m; msg = `La cena de recaudación dejó $${fmt(m)} millones.`;
      break;
    }
    case "militantes": {
      const n = Math.round(200 + 350 * car);
      yo.militantes += n; yo.fiscales = Math.min(1, yo.fiscales + 0.08 + 0.05 * car);
      msg = `Sumaste ${n} militantes. Cobertura de fiscales: ${Math.round(yo.fiscales * 100)}%.`;
      break;
    }
    case "operacion": {
      const r = S.candidatos.find(c => c.id === opt.rival);
      if (R.rand() < 0.25) {
        yo.imagen -= 4; S.riesgo += 5;
        msg = `Se descubrió que la carpeta contra ${r.nombre} salió de tu equipo. Escándalo.`;
        titular("Página Sur", `La operación contra ${r.nombre} tiene la firma de ${yo.nombre}`);
      } else {
        r.imagen -= 3 + R.rand() * 2;
        msg = `La denuncia contra ${r.nombre} es tapa de los diarios.`;
        titular("Diario El Faro", `Denuncian a ${r.nombre} por enriquecimiento`);
      }
      break;
    }
    case "avales": {
      const n = Math.round(600 + 900 * car + yo.militantes * 0.4);
      S.avales += n; msg = `Juntaste ${n.toLocaleString("es-AR")} avales. Total: ${S.avales.toLocaleString("es-AR")} de ${S.avalesNecesarios.toLocaleString("es-AR")}.`;
      break;
    }
    case "lealtad": {
      const n = 8 + 10 * neg;
      S.lealtad = Math.min(100, S.lealtad + n);
      msg = `Defendiste a ${PARTIDOS[yo.partido].lider} en todos los canales. Lealtad: ${Math.round(S.lealtad)}.`;
      break;
    }
    case "comites": {
      const n = 8 + 8 * neg + 4 * car;
      S.apoyoInterno += n; yo.militantes += 100;
      msg = `Recorriste comités y sumaste delegados. Apoyo interno: ${Math.round(S.apoyoInterno)}.`;
      break;
    }
  }
  log(msg, "accion");
  return { ok: true, msg };
}

// ---------- IA de los rivales ----------

function turnoIA() {
  for (const c of S.candidatos) {
    if (c.esJugador || !c.activo) continue;
    c.plata += 0.6 + c.negociacion * 0.1;
    let ap = 4;
    while (ap > 0) {
      ap--;
      const roll = R.rand();
      if (c.estrategia === "mediatica" && c.plata > 3 && roll < 0.4) {
        c.plata -= 3; const g = R.pick(GRUPOS);
        c.sym[g.id] += 0.15; PROVINCIAS.forEach(p => c.know[p.id] = Math.min(1, c.know[p.id] + 0.03));
      } else if (c.estrategia === "antisistema" && roll < 0.45) {
        c.sym.jovenes += 0.12; c.sym.media += 0.05; c.imagen += R.gauss() * 0.8;
        PROVINCIAS.forEach(p => c.know[p.id] = Math.min(1, c.know[p.id] + 0.02));
      } else if (c.estrategia === "calle" && roll < 0.4) {
        c.sym.estatales += 0.08; c.sym.trabajadores += 0.05;
      } else {
        // recorrida en la provincia con más votos por ganar
        let best = PROVINCIAS[0], bv = -1;
        for (const p of PROVINCIAS) { const v = p.pob * (1 - c.know[p.id]) * (0.5 + R.rand()); if (v > bv) { bv = v; best = p; } }
        c.know[best.id] = Math.min(1, c.know[best.id] + 0.08); c.local[best.id] += 0.12;
      }
    }
    // operación de prensa ocasional contra el puntero
    if (R.rand() < 0.08) {
      const objetivo = R.rand() < 0.5 ? S.jugador : R.pick(S.candidatos.filter(x => x !== c && x.activo));
      objetivo.imagen -= 2.5;
      if (objetivo === S.jugador) {
        log(`Operación de prensa: una carpeta contra vos aparece en los diarios. Todos sospechan del entorno de ${c.nombre}.`, "malo");
        titular(R.pick(MEDIOS).nombre, `Polémica por los negocios de ${S.jugador.nombre}`);
      }
    }
  }
}

// ---------- Ciclo semanal ----------

function nuevaSemana(primera) {
  S.ap = 5;
  S.ofertaAporte = null;
  if (!primera && R.rand() < 0.45) {
    const a = R.pick(APORTANTES);
    S.ofertaAporte = { ...a, monto: +(a.monto * R.between(0.8, 1.2)).toFixed(1) };
  }
  S.ultimaEncuesta = encuesta();
  S.encuestas.push({ sem: S.semana, datos: S.ultimaEncuesta });
}

function aceptarAporte() {
  const a = S.ofertaAporte; if (!a) return;
  S.jugador.plata += a.monto; S.riesgo += a.riesgo;
  S.favores.push({ aportante: a.nombre, favor: a.favor, cumplido: false });
  log(`Aceptaste $${fmt(a.monto)} M de ${a.nombre}. A cambio: ${a.favor}.`, "aviso");
  S.ofertaAporte = null;
}
function rechazarAporte() { if (S.ofertaAporte) log(`Rechazaste el aporte de ${S.ofertaAporte.nombre}.`); S.ofertaAporte = null; }

function terminarSemana() {
  turnoIA();
  // decaimiento leve de efectos locales e imagen hacia cero
  for (const c of S.candidatos) {
    for (const p in c.local) c.local[p] *= 0.97;
    c.imagen *= 0.95;
  }
  // escándalos por aportes
  if (S.riesgo > 0 && R.rand() < S.riesgo / 220) {
    const f = S.favores.length ? R.pick(S.favores) : null;
    const golpe = 3 + R.rand() * 6;
    S.jugador.imagen -= golpe;
    const txt = f ? `Un periodista revela que ${f.aportante} financió tu campaña a cambio de "${f.favor}".` : "Investigan el financiamiento de tu campaña.";
    log(`ESCÁNDALO: ${txt}`, "malo");
    titular(R.pick(MEDIOS).nombre, txt);
    S.riesgo *= 0.6;
  }
  const eventos = [];
  // Interna
  if (!S.internaResuelta && S.semana === SEMANA_INTERNA - 1 && S.tipoInterna !== "PASO") eventos.push(resolverInterna());
  if (S.semana === SEMANA_INTERNA) eventos.push(resolverPASO());
  if (S.semana === 9) eventos.push(debate());
  S.semana++;
  if (S.perdio) return eventos;
  if (!S.balotaje && S.semana > SEMANAS_CAMPANA) { eventos.push(eleccionGeneral()); return eventos; }
  if (S.balotaje && S.semana > S.semanaBalotaje) { eventos.push(eleccionBalotaje()); return eventos; }
  nuevaSemana();
  return eventos;
}

// Turno mensual de campaña: corre dos semanas del modelo (la IA, los escándalos y las encuestas avanzan dos veces)
const _terminarSemanaSimple = terminarSemana;
terminarSemana = function () {
  const balPrev = S.balotaje;
  const ev = _terminarSemanaSimple();
  if (S.perdio || S.fase !== "campana" || S.balotaje !== balPrev) { if (S.fase === "campana") S.ap = AP_MES; return ev; }
  const oferta = S.ofertaAporte;
  const ev2 = _terminarSemanaSimple();
  if (S.fase === "campana") { S.ap = AP_MES; if (!S.ofertaAporte && oferta) S.ofertaAporte = oferta; }
  return [...ev, ...ev2];
};

function resolverInterna() {
  const yo = S.jugador, r = rivalInterno();
  let gano = false, detalle = "";
  if (S.tipoInterna === "avales") {
    gano = S.avales >= S.avalesNecesarios;
    detalle = gano ? `La Justicia Electoral reconoce a ${PARTIDOS.NUEVO.nombre}. Podés competir.` : `No llegaste a los avales (${S.avales.toLocaleString("es-AR")} de ${S.avalesNecesarios.toLocaleString("es-AR")}). La Justicia Electoral rechaza la inscripción.`;
  } else if (S.tipoInterna === "dedo") {
    const rivalLealtad = 55 + R.rand() * 20;
    const encYo = S.ultimaEncuesta[yo.id] || 0;
    const puntosYo = S.lealtad + encYo * 1.5, puntosR = rivalLealtad + 12;
    gano = puntosYo > puntosR;
    detalle = gano ? `${PARTIDOS[yo.partido].lider} te bendice con el dedo: sos el candidato.` : `${PARTIDOS[yo.partido].lider} eligió a ${r.nombre}. Te quedaste afuera.`;
  } else if (S.tipoInterna === "cerrada") {
    const pYo = S.apoyoInterno + yo.militantes / 120 + R.gauss() * 6;
    const pR = 40 + R.rand() * 15;
    const pct = 100 * pYo / (pYo + pR);
    gano = pYo > pR;
    detalle = `Interna cerrada: ${yo.nombre} ${fmt(pct)}% contra ${r.nombre} ${fmt(100 - pct)}%. ` + (gano ? "Ganaste la candidatura." : "Perdiste la interna.");
  }
  S.internaResuelta = true;
  if (gano) {
    if (r) { r.activo = false; yo.know = Object.fromEntries(Object.entries(yo.know).map(([k, v]) => [k, Math.max(v, r.know[k] * 0.8)])); yo.militantes += r.militantes * 0.6; yo.fiscales = Math.max(yo.fiscales, r.fiscales * 0.9); yo.plata += 2; }
    log(detalle, "bueno");
  } else {
    S.perdio = true; S.motivoDerrota = detalle; log(detalle, "malo");
  }
  return { titulo: "Definición de candidaturas", texto: detalle, tipo: gano ? "bueno" : "malo" };
}

function resolverPASO() {
  const yo = S.jugador;
  // Todos los candidatos compiten; dentro del partido del jugador hay dos listas
  const cands = S.candidatos.filter(c => c.activo);
  const { nac } = resultadosNacionales(cands);
  let texto = "", tipo = "info";
  if (S.tipoInterna === "PASO" && !S.internaResuelta) {
    const r = rivalInterno();
    // el jugador y su rival interno reparten el voto del partido
    const total = nac[yo.id] + nac[r.id];
    const fuerzaYo = nac[yo.id] * (1 + yo.imagen / 30) * (0.8 + yo.fiscales * 0.4);
    const fuerzaR = nac[r.id] * (1 + r.imagen / 30) * (0.8 + r.fiscales * 0.4) * 0.8;
    const sYo = total * fuerzaYo / (fuerzaYo + fuerzaR), sR = total - sYo;
    S.internaResuelta = true;
    if (sYo > sR) {
      r.activo = false; yo.know = Object.fromEntries(Object.entries(yo.know).map(([k, v]) => [k, Math.max(v, r.know[k] * 0.85)]));
      yo.militantes += r.militantes * 0.6; yo.fiscales = Math.max(yo.fiscales, r.fiscales * 0.9);
      texto = `PASO del ${PARTIDOS[yo.partido].corto}: ganaste ${fmt(sYo)}% a ${fmt(sR)}% sobre ${r.nombre}. El partido se ordena detrás tuyo.`;
      tipo = "bueno";
    } else {
      S.perdio = true; S.motivoDerrota = `Perdiste las PASO del ${PARTIDOS[yo.partido].corto}: ${fmt(sR)}% de ${r.nombre} contra tu ${fmt(sYo)}%.`;
      log(S.motivoDerrota, "malo");
      return { titulo: "PASO", texto: S.motivoDerrota, tipo: "malo" };
    }
  } else {
    texto = "PASO nacionales: funcionan como una gran encuesta.";
  }
  // Piso del 1,5%
  const res = resultadosNacionales();
  const elim = [];
  for (const c of S.candidatos.filter(x => x.activo)) {
    if (res.nac[c.id] < 1.5) { if (c.esJugador) { S.perdio = true; S.motivoDerrota = `No superaste el piso del 1,5% en las PASO (${fmt(res.nac[c.id])}%).`; } else { c.activo = false; elim.push(c.nombre); } }
  }
  S.pasoHecha = true; S.resultadoPASO = res.nac;
  const orden = Object.entries(res.nac).sort((a, b) => b[1] - a[1]).map(([id, v]) => `${S.candidatos.find(c => c.id === id).nombre} ${fmt(v)}%`).join(" · ");
  texto += ` Resultado: ${orden}.` + (elim.length ? ` Quedan afuera por no llegar al 1,5%: ${elim.join(", ")}.` : "");
  // efecto expectativas: el que gana suma imagen
  const ganador = Object.entries(res.nac).sort((a, b) => b[1] - a[1])[0][0];
  S.candidatos.find(c => c.id === ganador).imagen += 3;
  log(texto, tipo);
  if (S.perdio) return { titulo: "PASO", texto: S.motivoDerrota, tipo: "malo" };
  return { titulo: "Resultado de las PASO", texto, tipo };
}

function debate() {
  const cands = S.candidatos.filter(c => c.activo);
  const puntajes = cands.map(c => ({ c, p: c.oratoria * 1.2 + c.carisma * 0.5 + R.gauss() * 2.5 }));
  puntajes.sort((a, b) => b.p - a.p);
  const ganador = puntajes[0].c, perdedor = puntajes[puntajes.length - 1].c;
  ganador.imagen += 4; perdedor.imagen -= 3;
  const miPos = puntajes.findIndex(x => x.c.esJugador) + 1;
  const texto = `Debate presidencial obligatorio. Según los analistas ganó ${ganador.nombre}; el peor fue ${perdedor.nombre}. Vos quedaste ${miPos}º de ${cands.length}.`;
  log(texto, miPos === 1 ? "bueno" : miPos === cands.length ? "malo" : "info");
  return { titulo: "Debate presidencial", texto, tipo: miPos === 1 ? "bueno" : "info" };
}

function eleccionGeneral() {
  const cands = S.candidatos.filter(c => c.activo);
  const res = resultadosNacionales(cands);
  S.resultadoGeneral = res;
  const orden = Object.entries(res.nac).sort((a, b) => b[1] - a[1]);
  const [p1, v1] = orden[0], [p2, v2] = orden[1];
  const texto = orden.map(([id, v]) => `${S.candidatos.find(c => c.id === id).nombre} (${PARTIDOS[S.candidatos.find(c => c.id === id).partido].corto}) ${fmt(v)}%`).join(" · ");
  const ganaPrimera = v1 >= 45 || (v1 >= 40 && v1 - v2 >= 10);
  if (ganaPrimera) {
    return finElecciones(p1, `Elección general: ${texto}. ${S.candidatos.find(c => c.id === p1).nombre} gana en primera vuelta.`);
  }
  const enBalotaje = [p1, p2];
  if (!enBalotaje.includes("yo")) {
    S.perdio = true; S.motivoDerrota = `Quedaste afuera del balotaje. Resultado: ${texto}.`;
    log(S.motivoDerrota, "malo");
    return { titulo: "Elección general", texto: S.motivoDerrota, tipo: "malo" };
  }
  S.balotaje = true; S.semanaBalotaje = S.semana + 1;
  cands.forEach(c => { if (!enBalotaje.includes(c.id)) c.activo = false; });
  const t = `Elección general: ${texto}. Nadie llegó al 45% ni al 40% con 10 puntos de diferencia: hay balotaje en un mes.`;
  log(t, "aviso");
  nuevaSemana();
  return { titulo: "¡Balotaje!", texto: t, tipo: "aviso" };
}

function eleccionBalotaje() {
  const cands = S.candidatos.filter(c => c.activo);
  const res = resultadosNacionales(cands);
  S.resultadoBalotaje = res;
  const orden = Object.entries(res.nac).sort((a, b) => b[1] - a[1]);
  const texto = orden.map(([id, v]) => `${S.candidatos.find(c => c.id === id).nombre} ${fmt(v)}%`).join(" contra ");
  return finElecciones(orden[0][0], `Balotaje: ${texto}.`);
}

function finElecciones(ganadorId, texto) {
  if (ganadorId !== "yo") {
    S.perdio = true; S.motivoDerrota = texto + " Perdiste la elección.";
    log(S.motivoDerrota, "malo");
    return { titulo: "Resultado electoral", texto: S.motivoDerrota, tipo: "malo" };
  }
  log(texto + " ¡Sos presidente electo de la Nación!", "bueno");
  iniciarGobierno();
  return { titulo: "¡Ganaste la presidencia!", texto: texto + " Asumís el 10 de diciembre. Ahora empieza lo difícil.", tipo: "bueno" };
}

// =============================================================
//  GOBIERNO
// =============================================================

function dHondt(votosPorPartido, bancas) {
  const res = Object.fromEntries(Object.keys(votosPorPartido).map(k => [k, 0]));
  for (let i = 0; i < bancas; i++) {
    let best = null, bv = -1;
    for (const k in votosPorPartido) { const q = votosPorPartido[k] / (res[k] + 1); if (q > bv) { bv = q; best = k; } }
    res[best]++;
  }
  return res;
}

function votosLegislativos(prov) {
  // Se usan los resultados de la primera vuelta (todos los partidos), con partidos provinciales
  const pct = S.resultadoGeneral.porProv[prov.id];
  const vp = {};
  for (const cid in pct) { const c = S.candidatos.find(x => x.id === cid); vp[c.partido] = (vp[c.partido] || 0) + pct[cid]; }
  const provincial = { norte: 22, patagonia: 25, cuyo: 8, agro: 5, conurbano: 0, capital: 0 }[prov.perfil];
  if (provincial) { for (const k in vp) vp[k] *= (100 - provincial) / 100; vp.PROV = provincial; }
  // piso del 3%
  for (const k in vp) if (vp[k] < 3) delete vp[k];
  return vp;
}

// Bancas "heredadas": la mitad de Diputados y dos tercios del Senado no se renuevan
function votosHeredados(prov) {
  const base = { MNJ: 40, FC: 24, UR: 16, LY: 9, FT: 3 };
  const vp = {};
  for (const k in base) vp[k] = Math.max(1, base[k] * (1 + ((PARTIDOS[k].fuerza || {})[prov.perfil] || 0)));
  const provincial = { norte: 22, patagonia: 25, cuyo: 8, agro: 5, conurbano: 0, capital: 0 }[prov.perfil];
  if (provincial) vp.PROV = provincial;
  for (const k in vp) if (vp[k] < 3) delete vp[k];
  return vp;
}

function armarCongreso() {
  const dip = {}, sen = {};
  const gobernadores = {};
  PROVINCIAS.forEach((p, i) => {
    const vp = votosLegislativos(p), vh = votosHeredados(p);
    const nuevas = Math.ceil(p.dip / 2);
    const r1 = dHondt(vp, nuevas), r2 = dHondt(vh, p.dip - nuevas);
    for (const k in r1) dip[k] = (dip[k] || 0) + r1[k];
    for (const k in r2) dip[k] = (dip[k] || 0) + r2[k];
    // Senado: se renueva un tercio de las provincias en esta elección
    const vSen = i % 3 === 0 ? vp : vh;
    const orden = Object.entries(vSen).sort((a, b) => b[1] - a[1]);
    sen[orden[0][0]] = (sen[orden[0][0]] || 0) + 2;
    sen[orden[1][0]] = (sen[orden[1][0]] || 0) + 1;
    // gobernador: algunas provincias desdoblan y votan otra cosa
    const ordenNuevo = Object.entries(vp).sort((a, b) => b[1] - a[1]);
    let g = R.rand() < 0.55 ? ordenNuevo[0][0] : orden[0][0];
    if (p.perfil === "norte" && R.rand() < 0.35) g = "MNJ";
    if ((p.perfil === "patagonia" || p.perfil === "norte") && R.rand() < 0.25) g = "PROV";
    gobernadores[p.id] = { partido: g, relacion: g === S.jugador.partido ? 40 : g === "PROV" ? 0 : -15 };
  });
  return { dip, sen, gobernadores };
}

function iniciarGobierno() {
  S.fase = "gobierno";
  S.trimestre = 1; S.mes = 1; S.paso = 1 / 3;
  const yo = S.jugador;
  const cong = armarCongreso();
  S.dip = cong.dip; S.sen = cong.sen; S.gobernadores = cong.gobernadores;
  // relación de cada bloque con el gobierno
  S.bloques = {};
  for (const k of new Set([...Object.keys(S.dip), ...Object.keys(S.sen)])) {
    const P = PARTIDOS[k];
    S.bloques[k] = {
      relacion: k === yo.partido ? 70 : k === "PROV" ? 10 : -20 - Math.abs(P.ideo - yo.ideo) / 3,
      disciplina: { MNJ: 0.8, UR: 0.6, FC: 0.75, LY: 0.85, FT: 0.98, PROV: 0.5, NUEVO: 0.85 }[k] || 0.7,
    };
  }
  S.ind = { inflacion: 4.2, desempleo: 7.8, crecimiento: 0.8, pobreza: 38, deficit: 3, deuda: 85, reservas: 20000,
    inseguridad: 60, imagen: 55, legitimidad: 70, tension: 35 };
  S.hist = [{ t: 0, ...S.ind }];
  S.presupuesto = Object.fromEntries(AREAS.map(a => [a.id, 0])); // % de cambio sobre la base
  S.impuestos = 0;
  S.medidasActivas = []; S.dnuCount = 0; S.limitaDNU = false;
  S.corte = { miembros: 5, afines: 1 };
  S.fmi = null; S.alineamiento = "neutral";
  S.vetoPendiente = null; S.decisionPendiente = null;
  S.medidasEsteTrimestre = 0;
  S.politicaExterior = [];
  S.tensionAlta = 0;
  S.imagenInicio = S.ind.imagen;
  // favores de campaña se convierten en presión
  S.riesgo *= 0.8;
  log(`Asumiste la presidencia. Diputados: tu bloque tiene ${S.dip[yo.partido] || 0} de 257 bancas; Senado: ${S.sen[yo.partido] || 0} de 72.`, "info");
  if ((S.dip[yo.partido] || 0) < 129) log("No tenés mayoría propia en Diputados: vas a tener que negociar con gobernadores y otros bloques.", "aviso");
}

// --- votación en el Congreso ---
function probApoyo(bloque, medida, extra = 0) {
  const yo = S.jugador, b = S.bloques[bloque], P = PARTIDOS[bloque];
  if (!b) return 0;
  if (bloque === yo.partido) return R.clamp(0.75 + b.disciplina * 0.2 + extra / 200, 0, 0.99);
  const afinIdeo = 1 - Math.abs((medida ? medida.ideo : 50) - P.ideo) / 60;
  // gobernadores: los legisladores responden a su provincia
  const relGob = Object.values(S.gobernadores).filter(g => g.partido === bloque).reduce((a, g) => a + g.relacion, 0) /
    Math.max(1, Object.values(S.gobernadores).filter(g => g.partido === bloque).length);
  let p = 0.15 + afinIdeo * 0.45 + b.relacion / 250 + relGob / 300 + (S.ind.imagen - 50) / 200 + extra / 200 + (yo.negociacion - 5) * 0.02;
  if (bloque === "FT") p = medida && medida.ideo < 35 ? 0.6 : 0.03;
  return R.clamp(p, 0.01, 0.97);
}

function votarCamara(camara, medida, opt = {}) {
  const bancas = camara === "dip" ? S.dip : S.sen;
  const total = camara === "dip" ? 257 : 72;
  let si = 0, no = 0, aus = 0;
  const detalle = [];
  for (const k in bancas) {
    const n = bancas[k];
    const p = opt.contraGobierno ? 1 - probApoyo(k, medida) : probApoyo(k, medida, opt.extra || 0);
    const disc = S.bloques[k].disciplina;
    // el bloque decide su postura; la disciplina dice cuántos la siguen
    const postura = R.rand() < p ? "si" : "no";
    const siguen = Math.round(n * (disc + (1 - disc) * 0.5));
    const resto = n - siguen;
    const restoSi = Math.round(resto * p), restoAus = Math.round((resto - restoSi) * 0.4);
    const bSi = (postura === "si" ? siguen : 0) + restoSi;
    const bAus = restoAus;
    const bNo = n - bSi - bAus;
    si += bSi; no += bNo; aus += bAus;
    detalle.push({ bloque: k, si: bSi, no: bNo, aus: bAus });
  }
  const presentes = si + no;
  const quorum = presentes > total / 2;
  let necesario;
  if (opt.dosTercios) necesario = Math.ceil(presentes * 2 / 3);
  else if (opt.mayoriaAbsolutaTotal) necesario = Math.floor(total / 2) + 1;
  else necesario = Math.floor(presentes / 2) + 1;
  const aprobado = quorum && si >= necesario;
  return { camara, si, no, aus, quorum, necesario, aprobado, detalle };
}

function tratarLey(medida, extra) {
  // Cámara de origen: tributarias en Diputados (art. 52); el resto, Diputados por defecto
  const pasos = [];
  const v1 = votarCamara("dip", medida, { extra });
  pasos.push(v1);
  if (!v1.aprobado) return { aprobado: false, pasos };
  const v2 = votarCamara("sen", medida, { extra });
  pasos.push(v2);
  return { aprobado: v2.aprobado, pasos };
}

function aplicarEfectos(ef, grupos, factor = 1) {
  if (ef) for (const k in ef) {
    if (k in S.ind) S.ind[k] += ef[k] * factor * (k === "reservas" ? (S.escalaRes || 1) : 1);
  }
  if (grupos) for (const g in grupos) S.jugador.sym[g] += grupos[g] * factor;
}

function tomarMedida(medidaId, instrumento, extraNegociacion = 0) {
  const m = MEDIDAS.find(x => x.id === medidaId);
  const yo = S.jugador;
  if (S.medidasEsteTrimestre >= 1) return { ok: false, msg: "Ya tomaste la medida grande de este mes." };
  if (!m.inst.includes(instrumento)) return { ok: false, msg: "Ese instrumento no sirve para esta medida." };
  if (S.medidasActivas.includes(m.id)) return { ok: false, msg: "Esa medida ya está vigente." };
  if (instrumento === "dnu") {
    const prohibidas = ["penal", "tributaria", "electoral", "partidos"];
    if (prohibidas.includes(m.materia)) return { ok: false, msg: `La Constitución prohíbe DNU en materia ${m.materia} (art. 99 inc. 3). Mandá un proyecto de ley.` };
    if (S.limitaDNU && S.dnuCount >= 2) return { ok: false, msg: "La ley que limita los DNU te impide firmar más decretos de necesidad y urgencia." };
  }
  if (m.materia === "tributaria" && instrumento === "decreto" && m.id !== "retenciones") return { ok: false, msg: "Los impuestos los crea el Congreso, empezando por Diputados (art. 52)." };
  S.medidasEsteTrimestre++;
  let resultado = { ok: true, aprobada: true, pasos: [], msg: "" };
  if (instrumento === "ley") {
    if (extraNegociacion > 0) { S.ind.deficit += extraNegociacion / 100; }
    const r = tratarLey(m, extraNegociacion);
    resultado.pasos = r.pasos; resultado.aprobada = r.aprobado;
    resultado.msg = r.aprobado ? `El Congreso sancionó: ${m.nombre}.` : `El Congreso rechazó: ${m.nombre}.`;
    if (!r.aprobado) { yo.imagen -= 1; S.ind.imagen -= 2; }
  } else if (instrumento === "dnu") {
    S.dnuCount++;
    S.ind.legitimidad -= 4;
    // Comisión Bicameral: cae sólo si ambas cámaras lo rechazan
    const rd = votarCamara("dip", m, { contraGobierno: true });
    const rs = votarCamara("sen", m, { contraGobierno: true });
    const cae = rd.aprobado && rs.aprobado;
    resultado.pasos = [{ ...rd, rechazoDNU: true }, { ...rs, rechazoDNU: true }];
    if (cae) { resultado.aprobada = false; resultado.msg = `Ambas cámaras rechazaron el DNU "${m.nombre}". Queda derogado (ley 26.122).`; S.ind.legitimidad -= 3; }
    else {
      resultado.msg = `Firmaste el DNU "${m.nombre}". Rige desde mañana.`;
      // control judicial
      const pCorte = (m.ideo > 70 || m.materia === "laboral" ? 0.35 : 0.15) * (S.corte.afines >= 3 ? 0.4 : 1);
      if (R.rand() < pCorte) {
        resultado.aprobada = false;
        resultado.msg += ` Pero la Justicia lo suspende con una cautelar y luego la Corte lo declara inconstitucional.`;
        S.ind.legitimidad -= 3;
        titular("Diario El Faro", `La Corte frenó el DNU de ${m.nombre.toLowerCase()}`);
      }
    }
  } else {
    // decreto o resolución: inmediato, alcance menor
    resultado.msg = `${instrumento === "decreto" ? "Decreto" : "Resolución"}: ${m.nombre}.`;
  }
  if (resultado.aprobada) {
    const factor = instrumento === "resolucion" ? 0.7 : 1;
    aplicarEfectos(m.ef, m.grupos, factor);
    S.medidasActivas.push(m.id);
    if (m.efectoCorte) { S.corte.miembros = 9; S.corte.afines += 4; }
    if (m.efectoPrensa) { MEDIOS.forEach(md => md.afinidad += md.afinidad > 50 ? 10 : -5); }
    // favores de campaña: ciertas medidas los "cumplen"
    cumplirFavores(m);
    revisarPactos(m);
  }
  log(resultado.msg, resultado.aprobada ? "bueno" : "malo");
  return resultado;
}

function cumplirFavores(m) {
  const mapa = { retenciones: "bajar retenciones", obraPublica: "obra pública adjudicada", privatizar: "extender concesiones" };
  for (const f of S.favores) if (!f.cumplido && mapa[m.id] && f.favor.includes(mapa[m.id])) { f.cumplido = true; log(`Cumpliste el favor a ${f.aportante}.`, "info"); }
}
function revisarPactos(m) {
  const romper = { reformaLaboral: "sindicatos", retMoviles: "campo", subaIVA: "empresarios", ajuste: "movimientos" };
  const sec = romper[m.id];
  if (sec && S.pactos.includes(sec)) {
    S.pactos = S.pactos.filter(p => p !== sec);
    S.ind.tension += 6; S.ind.imagen -= 3;
    log(`Rompiste tu pacto con ${SECTORES[sec].nombre}. Te acusan de traición.`, "malo");
  }
}

// --- herramientas de negociación ---
function enviarATN(provId) {
  const g = S.gobernadores[provId];
  g.relacion = Math.min(100, g.relacion + 25);
  S.ind.deficit += 0.08;
  S.riesgo += 1;
  log(`Enviaste ATN a ${PROVINCIAS.find(p => p.id === provId).nombre}. El gobernador promete votos.`, "info");
}
function negociarBloque(bloque) {
  const b = S.bloques[bloque];
  b.relacion = Math.min(100, b.relacion + 15 + S.jugador.negociacion * 2);
  S.ind.deficit += 0.05;
  log(`Negociaste con el bloque ${PARTIDOS[bloque].corto}: cargos en organismos a cambio de apoyo.`, "info");
}

// --- política exterior ---
function accionExterior(tipo) {
  const yo = S.jugador;
  let msg = "";
  switch (tipo) {
    case "fmi": {
      if (S.fmi && S.fmi.activo) return { ok: false, msg: "Ya tenés un programa vigente con el Fondo." };
      // El acuerdo con el FMI pasa por el Congreso (ley de fortalecimiento de la sostenibilidad de la deuda, 2021)
      const v = votarCamara("dip", { ideo: 60 });
      if (!v.aprobado) { msg = "Diputados rechazó el acuerdo con el Fondo."; log(msg, "malo"); return { ok: true, msg, pasos: [v] }; }
      S.fmi = { activo: true, metaDeficit: Math.max(0, S.ind.deficit - 1.5), trimestres: 8 };
      S.ind.reservas += 15000; S.ind.deuda += 4; S.ind.imagen -= 3;
      msg = `Acuerdo con el Fondo: entran 15.000 millones. Meta de déficit: ${fmt(S.fmi.metaDeficit)}% del PBI.`;
      break;
    }
    case "acuerdoUCon": {
      const v = votarCamara("sen", { ideo: 65 });
      if (!v.aprobado) { msg = "El Senado no aprobó el tratado con la Unión Continental (art. 75 inc. 22)."; log(msg, "malo"); return { ok: true, msg, pasos: [v] }; }
      S.ind.crecimiento += 0.6; yo.sym.campo += 0.3; yo.sym.trabajadores -= 0.15;
      msg = "Tratado de libre comercio con la Unión Continental aprobado por el Congreso.";
      break;
    }
    case "alinearNorte": S.alineamiento = "norte"; S.ind.reservas += 2000; yo.sym.empresarios += 0.15; yo.sym.estatales -= 0.1; msg = "Alineamiento con la Federación del Norte: llegan inversiones y apoyo en el Fondo."; break;
    case "alinearEste": S.alineamiento = "este"; S.ind.reservas += 5000; yo.sym.empresarios -= 0.1; msg = "Swap de monedas con la República Popular del Este por 5.000 millones."; break;
    case "aviones": {
      if (S.ind.reservas < 3000) return { ok: false, msg: "No hay reservas para comprar aviones." };
      S.ind.reservas -= 1500; S.ind.imagen += 1; msg = "Compra de 12 aviones de combate. Las Fuerzas Armadas celebran."; break;
    }
    case "islas": S.ind.imagen += 2; S.ind.tension -= 2; msg = "Reclamo por las islas en la Asamblea General. Amplio apoyo interno."; break;
    case "brasil": S.ind.crecimiento += 0.3; yo.sym.trabajadores += 0.05; msg = "Cumbre con Brasilia del Sur: acuerdo automotriz renovado."; break;
  }
  S.politicaExterior.push(tipo);
  log(msg, "info");
  return { ok: true, msg };
}

// --- economía trimestral ---
function simularEconomia() {
  const I = S.ind, yo = S.jugador, f = pasoT();
  const A = S.ancla || { inflacion: 2, desempleo: 7, pobreza: 30 };
  const inflPrev = I.inflacion;
  const gasto = AREAS.reduce((a, ar) => a + ar.base * S.presupuesto[ar.id] / 100, 0); // pp del PBI
  const recaudacion = S.impuestos / 100 * 22; // 22% del PBI de presión base
  const deficitObj = 3 + gasto - recaudacion + (S.medidasActivas.length ? 0 : 0);
  // el déficit "estructural" se mueve hacia su objetivo + efectos de medidas
  I.deficit = suav(I.deficit, deficitObj + (I.deficit - 3) * 0.6, 0.6);
  // inflación mensual
  const emision = Math.max(0, I.deficit - (S.fmi && S.fmi.activo ? 2 : 1)) * 0.55;
  const presionCambiaria = I.reservas < 8000 ? 1.5 : I.reservas < 15000 ? 0.5 : 0;
  const objInfl = 1.8 + emision + presionCambiaria + (S.impuestos > 5 ? 0.2 : 0) + (S.medidasActivas.includes("precios") ? -0.3 : 0);
  I.inflacion = Math.max(0.2, suav(I.inflacion, objInfl, 0.75) + ruido(0.35));
  // crecimiento
  const confianza = (I.legitimidad - 50) / 50 + (S.alineamiento !== "neutral" ? 0.2 : 0) - (I.inflacion > 6 ? 1 : 0);
  const infra = S.presupuesto.infra / 100 * 1.5 + S.presupuesto.produccion / 100 + S.presupuesto.ciencia / 200;
  const rebote = S.desempleoInicial ? Math.max(0, I.desempleo - 8) * 0.25 : 0;
  const objCrec = 1.5 + rebote + confianza + infra - (S.impuestos > 0 ? S.impuestos * 0.05 : S.impuestos * 0.03) - Math.max(0, I.inflacion - 3) * 0.4 - (I.tension > 70 ? 1.5 : 0);
  I.crecimiento = suav(I.crecimiento, objCrec, 0.55) + ruido(0.4);
  // empleo y pobreza
  I.desempleo = R.clamp(I.desempleo + (-(I.crecimiento - 1.5) * 0.25) * f + ruido(0.1), 3, 30);
  const social = S.presupuesto.social / 100;
  I.pobreza = R.clamp(I.pobreza + (Math.min(I.inflacion - 3, 8) * 0.7 + (I.desempleo - A.desempleo - 1) * 0.3 - social * 3 - (I.crecimiento - 1.5) * 0.4 + (A.pobreza + 6 - I.pobreza) * 0.06) * f, 10, 70);
  // reservas
  const export_ = 3000 + (I.crecimiento > 0 ? 500 : 0) + (S.alineamiento === "este" ? 300 : 0);
  const pagosDeuda = 3200 + I.deuda * 22;
  const fuga = Math.max(0, Math.min(I.inflacion - 3, 6) * 600 + (50 - I.legitimidad) * 40);
  const K = S.escalaRes || 1;
  I.reservas = Math.max(0, I.reservas + ((export_ - pagosDeuda + 2500 - fuga) * f + ruido(500)) * K);
  // deuda
  I.deuda = R.clamp(I.deuda + (I.deficit * 0.25 - I.crecimiento * 0.2 + (I.reservas < 5000 ? 2 : 0)) * f, 20, 200);
  // inseguridad
  I.inseguridad = R.clamp(I.inseguridad + (-S.presupuesto.seguridad / 100 * 4 + (I.pobreza - 38) * 0.15) * f + ruido(1), 10, 100);
  // tensión social
  const ajusteSocial = Math.min(0, S.presupuesto.social) + Math.min(0, S.presupuesto.salud) / 2 + Math.min(0, S.presupuesto.educacion) / 2;
  const contencion = (S.pactos.includes("sindicatos") ? 3 : 0) + (S.pactos.includes("movimientos") ? 3 : 0);
  const objTension = 24 + Math.min((I.inflacion - A.inflacion) * 5, 40) + (I.desempleo - A.desempleo) * 2 + (I.pobreza - A.pobreza) * 0.8 - ajusteSocial * 0.3 - contencion - Math.max(0, S.presupuesto.social) * 0.15;
  I.tension = R.clamp(suav(I.tension, objTension, 0.6) + ruido(2), 0, 100);
  // imagen
  const objImagen = 55 - Math.min((I.inflacion - A.inflacion - 1) * 4, 35) + (I.crecimiento - 1) * 2.5 - (I.desempleo - A.desempleo - 1) * 1.2 - (I.inseguridad - 60) * 0.25 - Math.max(0, I.tension - 50) * 0.4 + (yo.carisma - 5) * 1.5 + (yo.gestion - 5) - S.trimestre * 0.7 - (S.causas || 0) * 3;
  I.imagen = R.clamp(suav(I.imagen, objImagen, 0.65), 3, 95);
  // legitimidad: se recupera lento, baja con DNU y escándalos
  I.legitimidad = R.clamp(I.legitimidad + (1 + (yo.gestion - 5) * 0.3 - (I.tension > 70 ? 3 : 0)) * f, 0, 100);
  // los gobernadores enfrían su relación con el tiempo
  for (const g of Object.values(S.gobernadores)) g.relacion = suav(g.relacion, I.imagen - 50, 0.92);
  for (const k in S.bloques) if (k !== yo.partido) S.bloques[k].relacion = suav(S.bloques[k].relacion, -12.5, 0.92);
}

function elegirEvento() {
  const posibles = EVENTOS_GOB.filter(e => (!e.cond || e.cond(S)) && !(e.unico && S.eventosUsados.includes(e.id)));
  const tot = posibles.reduce((a, e) => a + e.peso, 0);
  let r = R.rand() * tot;
  for (const e of posibles) { r -= e.peso; if (r <= 0) return e; }
  return null;
}

function terminarTrimestre() {
  // se llama una vez por mes: la economía avanza un tercio de trimestre
  const eventos = [];
  const I = S.ind;
  if (!S.mes) S.mes = (S.trimestre - 1) * 3 + 1;
  S.paso = 1 / 3;
  const f = S.paso, cierre = finDeTrimestre();
  simularEconomia();
  // Riesgo de escándalo por favores no cumplidos
  const impagos = S.favores.filter(x => !x.cumplido).length;
  S.riesgo += impagos * 0.8 * f;
  // Evento del mes
  if (R.rand() < 0.65 * f) {
    const e = elegirEvento();
    if (e) {
      S.eventosUsados.push(e.id);
      if (e.decision === "fmi") {
        const cumple = I.deficit <= S.fmi.metaDeficit + 0.3;
        S.fmi.trimestres--;
        if (cumple) eventos.push({ titulo: e.titulo, texto: "El Fondo aprueba la revisión y gira un nuevo desembolso de 2.000 millones.", tipo: "bueno" }), I.reservas += 2000;
        else { I.reservas -= 1000; I.legitimidad -= 2; eventos.push({ titulo: e.titulo, texto: `No cumpliste la meta de déficit (${fmt(I.deficit)}% contra ${fmt(S.fmi.metaDeficit)}%). El Fondo frena el desembolso y exige un waiver.`, tipo: "malo" }); }
        if (S.fmi.trimestres <= 0) S.fmi.activo = false;
      } else if (e.decision) {
        S.decisionPendiente = e.decision;
        eventos.push({ titulo: e.titulo, texto: e.texto, tipo: "aviso", decision: e.decision });
        if (e.ef) aplicarEfectos(e.ef);
      } else {
        aplicarEfectos(e.ef);
        if (e.causa) { S.causas = (S.causas || 0) + 1; S.riesgo *= 0.7; }
        eventos.push({ titulo: e.titulo, texto: e.texto, tipo: (e.ef && (e.ef.imagen < 0 || e.ef.reservas < 0 || e.ef.crecimiento < 0)) ? "malo" : "info" });
      }
      log(`${e.titulo}. ${e.texto || ""}`, "aviso");
    }
  }
  // Escándalo por aportes de campaña
  if (R.rand() < S.riesgo / 250 * f) {
    const txt = "Una investigación periodística vincula a tu gobierno con los aportantes de campaña. Un fiscal pide indagatorias.";
    I.imagen -= 6; I.legitimidad -= 5; S.riesgo *= 0.5;
    eventos.push({ titulo: "Escándalo de corrupción", texto: txt, tipo: "malo" });
    titular("Página Sur", txt);
    log(txt, "malo");
  }
  // La oposición aprueba una ley: el presidente puede vetar
  if (R.rand() < 0.3 * f && !S.vetoPendiente) {
    const ley = R.pick(LEYES_OPOSICION);
    const v = votarCamara("dip", { ideo: 40 }, { contraGobierno: true });
    if (v.aprobado) {
      S.vetoPendiente = ley;
      eventos.push({ titulo: "El Congreso sancionó una ley opositora", texto: `${ley.nombre}. Podés promulgarla o vetarla.`, tipo: "aviso", decision: "veto" });
    }
  }
  // Elecciones de medio término (trimestre 8)
  if (cierre && S.trimestre === 8) eventos.push(medioTermino());
  // Tensión social extrema (se evalúa al cierre de cada trimestre; avisa antes)
  if (!cierre && I.tension >= 85 && S.tensionAlta >= 1) eventos.push({ titulo: "La calle hierve", texto: "La tensión social sigue arriba de 85. Si no baja antes del cierre del trimestre, tu gobierno cae.", tipo: "malo" });
  if (!cierre) { /* nada */ } else if (I.tension >= 85) {
    S.tensionAlta++;
    if (S.tensionAlta >= 2) {
      S.perdio = true; S.motivoDerrota = "Estallido social. Con saqueos, represión y la Plaza llena al grito de \"que se vayan todos\", presentás la renuncia. La Asamblea Legislativa elige un presidente provisional.";
      eventos.push({ titulo: "Estallido social", texto: S.motivoDerrota, tipo: "malo" });
      return eventos;
    }
    eventos.push({ titulo: "Al borde del estallido", texto: "La tensión social supera 85. Si no baja el próximo trimestre, tu gobierno cae.", tipo: "malo" });
  } else S.tensionAlta = 0;
  // Juicio político
  if (I.legitimidad < 22 && R.rand() < 0.5 * f) eventos.push(juicioPolitico());
  if (S.perdio) return eventos;
  const prevT = S.hist[Math.max(0, S.hist.length - 3)] || I;
  // Hiperinflación
  if (cierre && I.inflacion > 15 && I.inflacion > prevT.inflacion * 0.92) {
    I.tension += 10; I.imagen -= 8;
    eventos.push({ titulo: "Hiperinflación", texto: "Los precios cambian varias veces por día. Los supermercados remarcan en las góndolas.", tipo: "malo" });
  }
  const resPrev = prevT.reservas;
  if (cierre && I.reservas < 2000 * (S.escalaRes || 1) && I.reservas <= resPrev) {
    I.inflacion += 3; I.tension += 6;
    eventos.push({ titulo: "Corrida cambiaria", texto: "Se agotan las reservas. El dólar se dispara y hay cola en los bancos.", tipo: "malo" });
  }
  // normalización
  for (const k of ["imagen", "legitimidad", "tension", "inseguridad"]) I[k] = R.clamp(I[k], 0, 100);
  I.reservas = Math.max(0, I.reservas);
  // las expectativas se normalizan: lo que al principio se tolera, después se reclama
  if (cierre && S.ancla) { S.ancla.inflacion += (2 - S.ancla.inflacion) * 0.1; S.ancla.desempleo += (7 - S.ancla.desempleo) * 0.1; S.ancla.pobreza += (30 - S.ancla.pobreza) * 0.1; }
  S.hist.push({ t: S.mes, ...I });
  S.mes++;
  S.trimestre = Math.ceil(S.mes / 3);
  S.medidasEsteTrimestre = 0;
  if (S.mes > MESES_MANDATO) { S.terminoMandato = true; S.trimestre = TRIMESTRES_MANDATO + 1; }
  return eventos;
}

function resolverDecision(tipo, opcion) {
  const I = S.ind;
  let msg = "";
  if (tipo === "veto") {
    const ley = S.vetoPendiente; S.vetoPendiente = null;
    if (opcion === "promulgar") {
      aplicarEfectos(ley.ef, ley.grupos);
      if (ley.limitaDNU) S.limitaDNU = true;
      if (ley.gobernadores) Object.values(S.gobernadores).forEach(g => g.relacion += ley.gobernadores);
      msg = `Promulgaste: ${ley.nombre}.`;
    } else {
      // insistencia: dos tercios en ambas cámaras (art. 83)
      const d = votarCamara("dip", { ideo: 40 }, { contraGobierno: true, dosTercios: true });
      const s = votarCamara("sen", { ideo: 40 }, { contraGobierno: true, dosTercios: true });
      if (d.aprobado && s.aprobado) {
        aplicarEfectos(ley.ef, ley.grupos); I.legitimidad -= 4; I.imagen -= 3;
        if (ley.limitaDNU) S.limitaDNU = true;
        msg = `Vetaste "${ley.nombre}", pero el Congreso insistió con dos tercios. Derrota política.`;
      } else {
        I.imagen -= 1;
        msg = `Vetaste "${ley.nombre}". La oposición no consiguió los dos tercios para insistir.`;
      }
      log(msg, "info");
      return { msg, pasos: [d, s] };
    }
  } else if (tipo === "saqueos") {
    if (opcion === "reprimir") { I.tension -= 4; I.legitimidad -= 10; I.imagen -= 4; msg = "Ordenaste reprimir. Hay muertos y la oposición pide juicio político."; }
    else if (opcion === "asistencia") { I.tension -= 10; I.deficit += 0.5; msg = "Lanzaste un plan de emergencia alimentaria con los intendentes y las parroquias."; }
    else { I.tension -= 6; I.legitimidad -= 3; I.imagen -= 1; msg = "Declaraste el estado de sitio en el conurbano bonaerense (art. 23)."; }
  } else if (tipo === "este") {
    if (opcion === "aceptar") { I.reservas += 4000; I.crecimiento += 0.4; S.alineamiento = "este"; I.imagen -= 1; msg = "Aceptaste la inversión. La Federación del Norte expresa \"preocupación\"."; }
    else { msg = "Rechazaste la oferta. La Federación del Norte lo celebra."; }
  }
  S.decisionPendiente = null;
  log(msg, "info");
  return { msg };
}

function medioTermino() {
  const yo = S.jugador, I = S.ind;
  // se renueva la mitad de Diputados y un tercio del Senado
  const swing = (I.imagen - 45) / 100; // positivo = gana bancas el oficialismo
  const cambioDip = Math.round(128 * swing * 0.6);
  const cambioSen = Math.round(24 * swing * 0.5);
  const mover = (camara, n) => {
    const otros = Object.keys(camara).filter(k => k !== yo.partido);
    for (let i = 0; i < Math.abs(n); i++) {
      if (n > 0) { const k = otros.filter(o => camara[o] > 0).sort((a, b) => camara[b] - camara[a])[0]; if (!k) break; camara[k]--; camara[yo.partido] = (camara[yo.partido] || 0) + 1; }
      else { if ((camara[yo.partido] || 0) <= 0) break; camara[yo.partido]--; const k = (I.imagen < 35 ? "LY" in camara ? "LY" : otros[0] : otros[0]); const destino = otros.sort((a, b) => camara[b] - camara[a])[0] || k; camara[destino]++; }
    }
  };
  mover(S.dip, cambioDip); mover(S.sen, cambioSen);
  const texto = `Elecciones de medio término. Con una imagen de ${Math.round(I.imagen)}%, tu bloque ${cambioDip >= 0 ? "gana" : "pierde"} ${Math.abs(cambioDip)} bancas en Diputados y ${Math.abs(cambioSen)} en el Senado. Ahora tenés ${S.dip[yo.partido] || 0} diputados y ${S.sen[yo.partido] || 0} senadores.`;
  log(texto, cambioDip >= 0 ? "bueno" : "malo");
  return { titulo: "Elecciones legislativas de medio término", texto, tipo: cambioDip >= 0 ? "bueno" : "malo" };
}

function juicioPolitico() {
  const d = votarCamara("dip", null, { contraGobierno: true, dosTercios: true });
  if (!d.aprobado) {
    const t = `La oposición pidió tu juicio político, pero no reunió los dos tercios en Diputados (${d.si} votos de ${d.necesario} necesarios).`;
    log(t, "aviso"); return { titulo: "Pedido de juicio político", texto: t, tipo: "aviso" };
  }
  const s = votarCamara("sen", null, { contraGobierno: true, dosTercios: true });
  if (s.aprobado) {
    S.perdio = true; S.motivoDerrota = `Diputados te acusó y el Senado te destituyó por mal desempeño con ${s.si} votos (art. 59).`;
    return { titulo: "Destituido por juicio político", texto: S.motivoDerrota, tipo: "malo" };
  }
  S.ind.legitimidad += 5;
  const t = `Diputados aprobó la acusación, pero el Senado te absolvió: ${s.si} votos, faltaban ${s.necesario}. Sobreviviste.`;
  log(t, "aviso"); return { titulo: "Juicio político", texto: t, tipo: "aviso" };
}

function puntajeFinal() {
  const I = S.ind, H = S.hist[0];
  let p = 0;
  p += (H.inflacion - I.inflacion) * 8;
  p += (H.pobreza - I.pobreza) * 3;
  p += (I.crecimiento) * 5;
  p += (H.desempleo - I.desempleo) * 4;
  p += (I.imagen - 50) * 1.5;
  p += (I.legitimidad - 50);
  p += (I.reservas - H.reservas) / 1000;
  p -= Math.max(0, I.tension - 50);
  return Math.round(p + 100);
}

// --- Guardado ---
function guardar() {
  try { localStorage.setItem("valdora_partida", JSON.stringify({ S, NUEVO: PARTIDOS.NUEVO || null })); return true; } catch (e) { return false; }
}
let _rawCarga = null; // si está definido, cargar() lee de acá (ranuras, autoguardado, archivo)
function cargar() {
  try {
    const raw = _rawCarga || localStorage.getItem("valdora_partida"); if (!raw) return false;
    const d = JSON.parse(raw); S = d.S; if (d.NUEVO) PARTIDOS.NUEVO = d.NUEVO;
    S.jugador = S.candidatos.find(c => c.esJugador);
    (S.medidasDinamicas || []).forEach(m => { if (!MEDIDAS.find(x => x.id === m.id)) MEDIDAS.push(m); });
    return true;
  } catch (e) { return false; }
}
function hayPartidaGuardada() { try { return !!localStorage.getItem("valdora_partida"); } catch (e) { return false; } }
