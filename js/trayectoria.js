// =============================================================
//  VALDORA - Trayectoria política del personaje
//  Cada partida deja hitos (internas, elecciones, cargos, leyes,
//  obras, escándalos, cambios de partido). Los hitos se guardan
//  con la partida y en un legajo que sobrevive entre partidas,
//  para seguir la carrera con el mismo personaje en otro cargo.
//  De la trayectoria salen tres cosas que pesan en las elecciones:
//   - reconocimiento: cuánta gente te conoce, por territorio
//     (lo bueno y lo malo te hacen conocido);
//   - prestigio: el saldo entre logros y escándalos o fracasos;
//   - efecto por grupo social: cada grupo pesa distinto la
//     experiencia, las obras, las leyes y los escándalos.
//  Los rivales de la IA también tienen currículum.
// =============================================================

const CLAVE_CARRERAS = "valdora_carreras";
let _carrerasMem = null;

function _lsTray() { try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; } }
function leerCarreras() {
  if (_carrerasMem) return _carrerasMem;
  let arr = [];
  try { const ls = _lsTray(), raw = ls && ls.getItem(CLAVE_CARRERAS); if (raw) arr = JSON.parse(raw); } catch (e) { arr = []; }
  _carrerasMem = Array.isArray(arr) ? arr : [];
  return _carrerasMem;
}
function escribirCarreras(arr) {
  _carrerasMem = arr;
  try { const ls = _lsTray(); if (ls) ls.setItem(CLAVE_CARRERAS, JSON.stringify(arr)); } catch (e) {}
}
function legajoPorId(id) { return leerCarreras().find(l => l.id === id) || null; }
function borrarLegajo(id) { escribirCarreras(leerCarreras().filter(l => l.id !== id)); }

// ---------- Cómo pesa cada tipo de hito en cada grupo social ----------
// multiplicadores del prestigio por grupo (1 = promedio)
const MULT_TRAY = {
  gestion:     { jovenes: 0.6, jubilados: 1.25, trabajadores: 1, informales: 0.9, media: 1.1, campo: 1, empresarios: 1.25, estatales: 1 },
  legislativo: { jovenes: 0.7, jubilados: 1, trabajadores: 0.9, informales: 0.6, media: 1.15, campo: 0.9, empresarios: 1, estatales: 0.9 },
  obras:       { jovenes: 0.5, jubilados: 0.8, trabajadores: 1.2, informales: 1.4, media: 0.7, campo: 0.7, empresarios: 1, estatales: 1.1 },
  electoral:   { jovenes: 1, jubilados: 1, trabajadores: 1, informales: 1, media: 1, campo: 1, empresarios: 1, estatales: 1 },
  escandalo:   { jovenes: 0.9, jubilados: 0.8, trabajadores: 0.7, informales: 0.4, media: 1.45, campo: 0.9, empresarios: 0.8, estatales: 0.5 },
  panqueque:   { jovenes: 0.3, jubilados: 0.8, trabajadores: 0.8, informales: 0.5, media: 1.3, campo: 0.9, empresarios: 0.6, estatales: 0.9 },
  novedad:     { jovenes: 1.6, jubilados: 0.4, trabajadores: 0.6, informales: 0.6, media: 1.1, campo: 0.6, empresarios: 0.7, estatales: 0.4 },
};
const ICONO_TRAY = { cargo: "🏛", inconcluso: "⚠", eleccion: "🗳", derrota: "🗳", interna: "✔", internaPerdida: "✖", precampana: "🚶", debate: "🎙", ley: "📜", obra: "🏗", escandalo: "⚠", causa: "⚖", partido: "🚩", cambio: "↔", medio: "🗳", juicio: "⚖" };
const FACTOR_CARGO = { presidente: 1.6, gobernador: 1.2, legislador: 0.9, intendente: 0.8 };

function provDeCiudad(c) {
  const C = typeof CIUDADES_JUGABLES !== "undefined" ? CIUDADES_JUGABLES[c] : null;
  if (!C) return null;
  const p = GEO_AR.nacion.provincias.find(x => x.nombre === C.provincia);
  return p ? p.id : null;
}
function nombreProvId(id) { const p = GEO_AR.nacion.provincias.find(x => x.id === id); return p ? p.nombre : id; }
function ambitoActual(cfg) {
  cfg = cfg || (S && S.cfg) || {};
  if (cfg.objetivo === "gobernador") return { nivel: "provincia", prov: cfg.provincia || "buenosaires" };
  if (cfg.objetivo === "intendente") { const ci = cfg.ciudad || "lamatanza"; return { nivel: "ciudad", ciudad: ci, prov: provDeCiudad(ci) }; }
  if (cfg.objetivo === "legislador") return { nivel: "nacion", prov: "buenosaires" };
  return { nivel: "nacion" };
}
function objetivoActual() { return (S && S.cfg && S.cfg.objetivo) || "presidente"; }

// ---------- Estado de la trayectoria dentro de la partida ----------
function asegurarTray() {
  if (!S) return null;
  if (!S.tray) S.tray = { legajoId: null, partida: 1, hitos: [], obrasAcum: 0, obrasMeses: 0, leyesPartida: 0, cerrada: false, base: null };
  return S.tray;
}
function cuandoHito() {
  const T = asegurarTray();
  return `Partida ${T.partida} · ${typeof etiquetaTiempo === "function" ? etiquetaTiempo() : ""}`;
}
function registrarHito(h) {
  const T = asegurarTray(); if (!T) return null;
  const amb = ambitoActual();
  const hito = { mult: "electoral", peso: 1, valor: 0, ...amb, ...h, partida: T.partida, cuando: cuandoHito(), era: S.cfg && S.cfg.era };
  // no duplicar el mismo hito en el mismo mes
  if (T.hitos.some(x => x.tipo === hito.tipo && x.cuando === hito.cuando && x.txt === hito.txt)) return null;
  T.hitos.push(hito);
  return hito;
}

// ---------- Perfil: reconocimiento, prestigio y efecto por grupo ----------
const satur = (x, k) => 1 - Math.exp(-Math.max(0, x) / k);
function perfilDe(hitos, partidaActual) {
  const not = { nac: 0, prov: {}, ciudad: {} };
  const grupos = Object.fromEntries(GRUPOS.map(g => [g.id, 0]));
  let prest = 0, pos = 0, neg = 0, cargos = 0, completos = 0;
  for (const h of hitos || []) {
    const dt = Math.max(0, (partidaActual || 1) - (h.partida || 1));
    const n = (h.peso || 0) * Math.pow(0.9, dt);           // la fama se apaga despacio
    const dec = (h.valor || 0) >= 0 ? Math.pow(0.85, dt) : Math.pow(0.7, dt); // los escándalos se olvidan más rápido
    if (h.nivel === "ciudad") { not.ciudad[h.ciudad] = (not.ciudad[h.ciudad] || 0) + n; if (h.prov) not.prov[h.prov] = (not.prov[h.prov] || 0) + n * 0.4; not.nac += n * 0.05; }
    else if (h.nivel === "provincia") { not.prov[h.prov] = (not.prov[h.prov] || 0) + n; not.nac += n * 0.2; }
    else { not.nac += n; if (h.prov) not.prov[h.prov] = (not.prov[h.prov] || 0) + n * 0.5; }
    const v = (h.valor || 0) * dec;
    prest += v; if (v > 0) pos += v; else neg -= v;
    const m = MULT_TRAY[h.mult] || MULT_TRAY.electoral;
    for (const g in grupos) grupos[g] += v * (m[g] || 1) * 0.025 + ((h.extra && h.extra[g]) || 0) * dec;
    if (h.tipo === "cargo" || h.tipo === "inconcluso") cargos++;
    if (h.tipo === "cargo") completos++;
  }
  // a los jóvenes les cansan las caras de siempre
  if (completos >= 3) grupos.jovenes -= 0.06 * (completos - 2);
  for (const g in grupos) grupos[g] = R.clamp(grupos[g], -0.7, 0.7);
  const maxProv = Math.max(0, ...Object.values(not.prov));
  const reconocimiento = Math.round(100 * satur(not.nac + maxProv * 0.5, 15));
  const prestigio = Math.round(100 * Math.tanh(prest / 14));
  return { not, grupos, prest, pos, neg, prestigio, reconocimiento, cargos, completos, n: (hitos || []).length };
}
function perfilActual() { const T = asegurarTray(); return T ? perfilDe(T.hitos, T.partida) : perfilDe([], 1); }

// cuánto te conoce de entrada cada distrito del mapa de esta partida, por la trayectoria
function bonoConocimiento(perfil, distritoId) {
  const amb = ambitoActual(), N = perfil.not, R10 = x => satur(x, 10);
  if (amb.nivel === "ciudad") return 0.25 * R10(N.nac) + 0.25 * R10(N.prov[amb.prov] || 0) + 0.5 * R10(N.ciudad[amb.ciudad] || 0);
  if (amb.nivel === "provincia" || objetivoActual() === "legislador") {
    const P = amb.prov;
    const ciudades = Object.entries(N.ciudad).filter(([c]) => provDeCiudad(c) === P).reduce((a, [, v]) => a + v, 0);
    return 0.35 * R10(N.nac) + 0.45 * R10(N.prov[P] || 0) + 0.15 * R10(ciudades);
  }
  // mapa nacional: cada distrito es una provincia
  const ciudades = Object.entries(N.ciudad).filter(([c]) => provDeCiudad(c) === distritoId).reduce((a, [, v]) => a + v, 0);
  return 0.35 * R10(N.nac) + 0.3 * R10((N.prov[distritoId] || 0) + ciudades * 0.6);
}

// mandatos completos dan puntos extra de atributos al crear el personaje
function puntosExtraLegajo(leg) { return leg ? Math.min(4, (leg.hitos || []).filter(h => h.tipo === "cargo").length) : 0; }

// ---------- Currículum de los rivales de la IA ----------
const CV_RIVALES = {
  nacion: [
    ["Gobernador de {prov} durante dos mandatos", 10, 5, "gestion", "provincia"],
    ["Intendente de {ciudad}", 5, 3, "gestion", "ciudad"],
    ["Senador nacional por {prov}", 4, 1.5, "legislativo", "provincia"],
    ["Ministro de Economía de la Nación", 6, 1, "gestion", "nacion"],
    ["Diputado nacional, jefe de bloque", 4, 2, "legislativo", "nacion"],
    ["Jefe de Gabinete de la Nación", 5, 1.5, "gestion", "nacion"],
  ],
  provincia: [
    ["Intendente de la capital provincial", 6, 3.5, "gestion", "provincia"],
    ["Vicegobernador de {terr}", 5, 1.5, "gestion", "provincia"],
    ["Senador nacional por {terr}", 4, 1.5, "legislativo", "provincia"],
    ["Ministro de Gobierno de la provincia", 4, 1, "gestion", "provincia"],
    ["Diputado provincial, presidente de la Legislatura", 3, 1.5, "legislativo", "provincia"],
  ],
  ciudad: [
    ["Concejal de {terr} durante dos períodos", 4, 1.5, "legislativo", "ciudad"],
    ["Secretario de Obras Públicas del municipio", 4, 2.5, "obras", "ciudad"],
    ["Diputado provincial por la sección", 3, 1, "legislativo", "ciudad"],
    ["Presidente del Concejo Deliberante de {terr}", 4, 1.5, "legislativo", "ciudad"],
    ["Dirigente barrial y de un club de la ciudad", 3, 2, "obras", "ciudad"],
  ],
};
const PROB_ESCANDALO_RIVAL = { MNJ: 0.4, UR: 0.25, FC: 0.35, LY: 0.15, FT: 0.05 };
function generarCVRival(c) {
  const amb = ambitoActual();
  const pool = CV_RIVALES[amb.nivel === "nacion" ? "nacion" : amb.nivel].slice();
  const terr = typeof nombreTerritorio === "function" ? nombreTerritorio() : "";
  const provs = GEO_AR.nacion.provincias, ciuds = typeof CIUDADES_AR !== "undefined" ? CIUDADES_AR : [];
  const hitos = [];
  const n = c.partido === "LY" || c.partido === "FT" ? 1 : 2 + (R.rand() < 0.4 ? 1 : 0);
  for (let i = 0; i < n && pool.length; i++) {
    const [tpl, peso, valor, mult, nivel] = pool.splice(Math.floor(R.rand() * pool.length), 1)[0];
    const pr = R.pick(provs), ci = ciuds.length ? R.pick(ciuds) : null;
    const txt = tpl.replace("{prov}", pr.nombre).replace("{ciudad}", ci ? ci.nombre : "una gran ciudad").replace("{terr}", terr).replace("Gobernador de Ciudad Autónoma de Buenos Aires", "Jefe de Gobierno porteño").replace("Senador nacional por Ciudad Autónoma de Buenos Aires", "Senador nacional por la Ciudad");
    hitos.push({ tipo: "cargo", txt, peso, valor, mult, nivel: amb.nivel === "nacion" ? nivel : amb.nivel, prov: amb.nivel === "nacion" ? pr.id : amb.prov, ciudad: amb.ciudad || (ci && ci.id), partida: 1 });
  }
  if (c.partido === "LY") hitos.push({ tipo: "partido", txt: "Economista de los canales de noticias; llegó a la política desde afuera", peso: 5, valor: 1.5, mult: "novedad", nivel: "nacion", partida: 1 });
  if (c.partido === "FT") hitos.push({ tipo: "partido", txt: "Dirigente sindical y de las asambleas de desocupados", peso: 3, valor: 1, mult: "obras", nivel: amb.nivel === "nacion" ? "nacion" : amb.nivel, prov: amb.prov, ciudad: amb.ciudad, partida: 1 });
  if (R.rand() < 0.25) hitos.push({ tipo: "derrota", txt: "Perdió una elección anterior por pocos votos", peso: 3, valor: -0.5, mult: "electoral", nivel: amb.nivel === "nacion" ? "nacion" : amb.nivel, prov: amb.prov, ciudad: amb.ciudad, partida: 1 });
  if (R.rand() < 0.2) hitos.push({ tipo: "cambio", txt: "Llegó al partido desde otra fuerza", peso: 1.5, valor: -1.5, mult: "panqueque", nivel: "nacion", partida: 1 });
  if (R.rand() < (PROB_ESCANDALO_RIVAL[c.partido] || 0.2)) hitos.push({ tipo: "causa", txt: R.pick(["Causa por enriquecimiento ilícito, todavía abierta", "Investigado por sobreprecios en la obra pública", "Lo acusaron de financiar la campaña con aportantes truchos"]), peso: 2.5, valor: -4, mult: "escandalo", nivel: "nacion", partida: 1 });
  return hitos;
}

// ---------- Inicio de partida: cargar el legajo y aplicar la trayectoria ----------
const _iniciarPartidaTray = iniciarPartida;
iniciarPartida = function (cfg) {
  _iniciarPartidaTray(cfg);
  const T = asegurarTray();
  const leg = cfg.legajoId ? legajoPorId(cfg.legajoId) : null;
  if (leg) {
    T.legajoId = leg.id;
    T.partida = (leg.partidas || 0) + 1;
    T.hitos = (leg.hitos || []).map(h => ({ ...h }));
    // cambio de partido respecto de la última partida
    const ult = leg.ultimoPartido;
    const ahora = S.jugador.partido === "NUEVO" ? "NUEVO:" + (PARTIDOS.NUEVO ? PARTIDOS.NUEVO.nombre : "") : S.jugador.partido;
    if (ult && ult.id !== ahora) {
      const nomNuevo = PARTIDOS[S.jugador.partido] ? PARTIDOS[S.jugador.partido].nombre : "otro partido";
      registrarHito({ tipo: "cambio", txt: `Dejó ${ult.nombre} y se pasó a ${nomNuevo}`, peso: 1.5, valor: -2, mult: "panqueque", nivel: "nacion" });
    }
  }
  if (cfg.camino === "fundar" && PARTIDOS.NUEVO) registrarHito({ tipo: "partido", txt: `Fundó ${PARTIDOS.NUEVO.nombre}`, peso: 1.5, valor: 1, mult: "novedad" });
  // la trayectoria previa (sin el hito de esta partida) es la que te hace conocido
  const previos = T.hitos.filter(h => h.partida < T.partida);
  const P = perfilDe(previos, T.partida);
  T.base = { reconocimiento: P.reconocimiento, prestigio: P.prestigio, grupos: P.grupos };
  const yo = S.jugador;
  yo.tray = { grupos: P.grupos };
  if (previos.length) {
    let suma = 0;
    for (const d of PROVINCIAS) {
      const b = bonoConocimiento(P, d.id);
      yo.know[d.id] = Math.min(0.95, yo.know[d.id] + b * (1 - yo.know[d.id]));
      suma += b;
    }
    yo.imagen += R.clamp(P.prestigio / 15, -6, 6);
    // la experiencia trae estructura: militantes, fiscales y contactos para recaudar
    yo.plata += Math.min(4, P.completos * 1 + P.cargos * 0.3);
    yo.militantes += Math.min(3000, P.completos * 600 + P.reconocimiento * 8);
    yo.fiscales = Math.min(0.95, yo.fiscales + Math.min(0.25, P.completos * 0.08));
    // en la interna, la trayectoria también cuenta
    S.lealtad += Math.max(0, P.prestigio / 6); S.apoyoInterno += Math.max(0, P.prestigio / 5);
    T.base.bonoMedio = suma / PROVINCIAS.length;
    log(`Tu trayectoria te precede: reconocimiento ${P.reconocimiento}/100 y prestigio ${P.prestigio > 0 ? "+" : ""}${P.prestigio}. ${P.prestigio >= 0 ? "Arrancás más conocido que un recién llegado." : "Te conocen, pero no siempre por buenas razones."}`, P.prestigio >= 0 ? "bueno" : "aviso");
  }
  // currículum de los rivales de la IA
  for (const c of S.candidatos) {
    if (c.esJugador) continue;
    const hitos = generarCVRival(c), Pr = perfilDe(hitos, 1);
    c.tray = { hitos, grupos: Object.fromEntries(Object.entries(Pr.grupos).map(([g, v]) => [g, v * 0.6])), reconocimiento: Pr.reconocimiento, prestigio: Pr.prestigio };
  }
};

// la trayectoria pesa en la intención de voto de cada grupo social
const _utilidadTray = utilidad;
utilidad = function (c, grupo, prov) {
  const u = _utilidadTray(c, grupo, prov);
  const t = c.tray && c.tray.grupos;
  return t ? u + (t[grupo.id] || 0) * grupo.volatil : u;
};

// encuesta de conocimiento e imagen: cuánta gente conoce a cada candidato y qué piensa de él
function encuestaConocimiento() {
  const enc = (typeof ENCUESTADORAS !== "undefined" && ENCUESTADORAS[S.encuestadora || 0]) || { error: 2 };
  const tot = PROVINCIAS.reduce((a, p) => a + p.pob, 0) || 1;
  return S.candidatos.filter(c => c.activo || c.esJugador).map(c => {
    const conoce = R.clamp(100 * PROVINCIAS.reduce((a, p) => a + p.pob * (c.know[p.id] || 0), 0) / tot + R.gauss() * enc.error / 3, 1, 99);
    const prest = c.esJugador ? perfilActual().prestigio : (c.tray ? c.tray.prestigio : 0);
    const fav = 1 / (1 + Math.exp(-((c.imagen || 0) / 8 + prest / 40)));
    const positiva = conoce * fav * 0.75, negativa = conoce * (1 - fav) * 0.75;
    return { id: c.id, nombre: c.nombre, partido: c.partido, esJugador: c.esJugador, conoce, positiva, negativa, regular: conoce - positiva - negativa };
  });
}

// ---------- Registro de hitos durante la campaña ----------
const _debateTray = debate;
debate = function () {
  const r = _debateTray();
  const m = /quedaste (\d+)º de (\d+)/.exec((r && r.texto) || "");
  if (m) {
    const pos = +m[1], de = +m[2];
    if (pos === 1) registrarHito({ tipo: "debate", txt: "Ganó el debate según los analistas", peso: 1.5, valor: 1.5 });
    else if (pos === de) registrarHito({ tipo: "debate", txt: "Perdió el debate: quedó último", peso: 1, valor: -1.5 });
  }
  return r;
};

const _logTray = log;
log = function (txt, tipo) {
  _logTray(txt, tipo);
  if (!S || !S.jugador || typeof txt !== "string") return;
  if (txt.startsWith("ESCÁNDALO")) registrarHito({ tipo: "escandalo", txt: txt.replace(/^ESCÁNDALO:\s*/, ""), peso: 2.5, valor: -4, mult: "escandalo" });
  else if (txt.startsWith("Se abre una causa") && txt.includes("apunta a vos")) registrarHito({ tipo: "causa", txt: txt.split(". Juez")[0].replace("que apunta a vos", "en su contra"), peso: 3, valor: -6, mult: "escandalo" });
  else if (txt.includes("es condenado") && txt.includes(S.jugador.nombre)) registrarHito({ tipo: "causa", txt: "Condenado por la Justicia", peso: 5, valor: -15, mult: "escandalo" });
};

function pctJugador(res) { return res && res.nac && res.nac.yo != null ? res.nac.yo : null; }
function cargoTexto() {
  const o = objetivoActual();
  return o === "gobernador" ? `gobernador de ${nombreTerritorio()}` : o === "intendente" ? `intendente de ${nombreTerritorio()}` : o === "legislador" ? "diputado nacional por Buenos Aires" : "presidente de la Nación";
}
const NOMBRE_INTERNA = { avales: "la inscripción del partido", dedo: "el dedo del líder", cerrada: "la interna cerrada", PASO: "las PASO" };

const _terminarSemanaTray = terminarSemana;
terminarSemana = function (...a) {
  if (!S || S.fase !== "campana") return _terminarSemanaTray.apply(this, a);
  asegurarTray();
  const antes = { interna: !!S.internaResuelta, perdio: !!S.perdio, fase: S.fase, know: conocimientoMedio(S.jugador) };
  const ev = _terminarSemanaTray.apply(this, a);
  const yo = S.jugador, P = PARTIDOS[yo.partido] || {};
  if (!antes.interna && S.internaResuelta) {
    const pre = S.precampana;
    if (pre && pre.meses > 0 && !pre.hito) {
      pre.hito = true;
      const ganado = Math.max(0, conocimientoMedio(yo) - (pre.knowInicio || 0));
      registrarHito({ tipo: "precampana", txt: `Precampaña de ${pre.meses} meses: lo conoce ${Math.round(ganado * 100)} puntos más de gente que al arrancar`, peso: 1 + ganado * 12, valor: 0.5 + ganado * 3 - (pre.desgaste || 0) / 4 });
    }
    if (!S.perdio) {
      const txt = S.tipoInterna === "avales" ? `Juntó ${Math.round(S.avales).toLocaleString("es-AR")} avales e inscribió ${P.nombre}` :
        S.tipoInterna === "dedo" ? `${P.lider || "El líder"} lo eligió con el dedo como candidato de ${P.nombre}` :
        S.tipoInterna === "PASO" ? `Ganó las PASO de ${P.nombre}` : `Ganó la interna cerrada de ${P.nombre}`;
      registrarHito({ tipo: "interna", txt, peso: S.tipoInterna === "PASO" ? 3 : 2, valor: 1.5 });
    } else {
      registrarHito({ tipo: "internaPerdida", txt: `Perdió ${NOMBRE_INTERNA[S.tipoInterna] || "la interna"} en ${P.nombre || "su partido"}`, peso: S.tipoInterna === "PASO" ? 2.5 : 1.5, valor: -1.5 });
    }
  } else if (!antes.perdio && S.perdio) {
    const pct = pctJugador(S.resultadoBalotaje) != null && S.balotaje ? pctJugador(S.resultadoBalotaje) : pctJugador(S.resultadoGeneral || (S.resultadoPASO ? { nac: S.resultadoPASO } : null));
    const p = pct != null ? pct : 5;
    registrarHito({ tipo: "derrota", txt: `Perdió la elección a ${cargoTexto()}${pct != null ? ` con ${fmt(pct)}%` : ""}`, peso: Math.min(5, 1 + p / 8) * (FACTOR_CARGO[objetivoActual()] || 1), valor: p >= 30 ? 1 : p >= 18 ? -0.5 : -2 });
  }
  if (antes.fase === "campana" && S.fase !== "campana" && !S.perdio) {
    const res = S.balotaje && S.resultadoBalotaje ? S.resultadoBalotaje : S.resultadoGeneral;
    const pct = pctJugador(res);
    const extra = objetivoActual() === "legislador" && S.bancasLista ? `: su lista metió ${S.bancasLista.yo || 0} bancas` : S.balotaje ? " en el balotaje" : "";
    registrarHito({ tipo: "eleccion", txt: `Ganó la elección a ${cargoTexto()}${pct != null ? ` con ${fmt(pct)}%` : ""}${extra}`, peso: 5 * (FACTOR_CARGO[objetivoActual()] || 1), valor: 3 });
  }
  return ev;
};
function conocimientoMedio(c) {
  const tot = PROVINCIAS.reduce((a, p) => a + p.pob, 0) || 1;
  return PROVINCIAS.reduce((a, p) => a + p.pob * (c.know[p.id] || 0), 0) / tot;
}

// ---------- Registro de hitos durante el mandato ----------
const _aplicarLeyEfectosTray = typeof aplicarLeyEfectos === "function" ? aplicarLeyEfectos : null;
if (_aplicarLeyEfectosTray) aplicarLeyEfectos = function (ley, fac) {
  const r = _aplicarLeyEfectosTray(ley, fac);
  if (fac > 0 && ley && ley.propia && S && S.fase !== "campana") {
    const T = asegurarTray();
    T.leyesPartida++;
    const rinde = 1 / (1 + (T.leyesPartida - 1) / 5); // cada ley nueva suma menos a la trayectoria
    const extra = {}; for (const g in (ley.grupos || {})) extra[g] = ley.grupos[g] * 0.15 * rinde;
    const tipoNorma = objetivoActual() === "intendente" ? "la ordenanza" : "la ley";
    registrarHito({ tipo: "ley", txt: `Impulsó ${tipoNorma} "${ley.nombre}"`, peso: 1.2 * rinde, valor: R.clamp(1 + (ley.pop || 0) / 4, -1, 2) * rinde, mult: "legislativo", extra });
  }
  return r;
};

function revisarEventosTray(ev) {
  for (const e of ev || []) {
    if (!e || !e.titulo) continue;
    const t = e.titulo;
    if (/^Escándalo en el ministerio/.test(t)) registrarHito({ tipo: "escandalo", txt: t + ": " + (e.texto || "").slice(0, 120), peso: 1.5, valor: -2.5, mult: "escandalo" });
    else if (/^Escándalo/.test(t)) registrarHito({ tipo: "escandalo", txt: e.texto || t, peso: 2.5, valor: -4, mult: "escandalo" });
    else if (/^Filtración/.test(t)) registrarHito({ tipo: "escandalo", txt: "Se filtró un acuerdo secreto de su gobierno", peso: 2, valor: -3, mult: "escandalo" });
    else if (/medio término/i.test(t)) registrarHito({ tipo: "medio", txt: `${e.tipo === "bueno" ? "Ganó" : "Perdió"} las legislativas de medio término`, peso: 2, valor: e.tipo === "bueno" ? 2 : -2 });
    else if (/^(Juicio político|Pedido de juicio político)$/.test(t)) registrarHito({ tipo: "juicio", txt: e.tipo === "aviso" && /Sobreviviste|no reunió/.test(e.texto || "") ? "Sobrevivió a un pedido de juicio político" : t, peso: 2.5, valor: -1 });
  }
}
function acumularObras() {
  const T = asegurarTray();
  let pct = 0;
  if (S.fase === "gobiernoLocal" && S.presLocal) pct = S.presLocal.obras || 0;
  else if (S.fase === "gobierno" && S.presupuesto) pct = S.presupuesto.infraestructura || 0;
  else if (S.fase === "legislador" && S.leg2) pct = (S.leg2.recursos || 0) > 3 ? 4 : 0; // obras conseguidas para la provincia
  T.obrasAcum += pct; T.obrasMeses++;
  if (T.obrasMeses >= 12) {
    const prom = T.obrasAcum / T.obrasMeses;
    if (prom >= 4) {
      const txt = S.fase === "legislador" ? "Consiguió obras para Buenos Aires negociando con la Casa Rosada" : S.fase === "gobiernoLocal" ? (objetivoActual() === "intendente" ? "Plan de obras: cloacas, asfalto y plazas en los barrios" : "Plan de obra pública: rutas, escuelas y hospitales") : "Plan nacional de obra pública e infraestructura";
      registrarHito({ tipo: "obra", txt: `${txt} (+${Math.round(prom)}% de presupuesto en obras)`, peso: 1.5 + prom / 10, valor: 1 + Math.min(3, prom / 8), mult: "obras" });
    }
    T.obrasAcum = 0; T.obrasMeses = 0;
  }
}

// cierre: mandato completo o interrumpido, y guardar el legajo
function calificacionMandato() {
  const o = objetivoActual();
  if (o === "legislador") { const p = typeof puntajeLeg === "function" ? puntajeLeg() : 200; return { p, nota: p > 380 ? 3 : p > 270 ? 2 : p > 170 ? 1 : 0 }; }
  if (o === "gobernador" || o === "intendente") { const p = typeof puntajeLocal === "function" ? puntajeLocal() : 100; return { p, nota: p > 150 ? 3 : p > 105 ? 2 : p > 70 ? 1 : 0 }; }
  const p = typeof puntajeFinal === "function" ? puntajeFinal() : 100; return { p, nota: p > 160 ? 3 : p > 110 ? 2 : p > 70 ? 1 : 0 };
}
const NOTA_TXT = ["mala", "regular", "buena", "excelente"];
const NOTA_VALOR = [-5, 2, 6, 10];
function cerrarTrayectoria() {
  const T = asegurarTray(); if (!T || T.cerrada) return;
  T.cerrada = true;
  const o = objetivoActual(), f = FACTOR_CARGO[o] || 1;
  const cargo = cargoTexto();
  if (S.fase !== "campana") {
    if (S.terminoMandato && !S.perdio) {
      const c = calificacionMandato();
      registrarHito({ tipo: "cargo", cargo: o, txt: `${cargo[0].toUpperCase() + cargo.slice(1)}: mandato completo, gestión ${NOTA_TXT[c.nota]} (puntaje ${c.p})`, peso: 10 * f, valor: NOTA_VALOR[c.nota] * (0.8 + f / 5), mult: o === "legislador" ? "legislativo" : "gestion", nota: c.nota });
    } else if (S.perdio) {
      registrarHito({ tipo: "inconcluso", cargo: o, txt: `${cargo[0].toUpperCase() + cargo.slice(1)}: no terminó el mandato. ${S.motivoDerrota || ""}`.trim(), peso: 6 * f, valor: -8, mult: "gestion" });
    }
  }
  guardarLegajo();
}
function guardarLegajo() {
  const T = asegurarTray(); if (!T || !S || !S.jugador) return null;
  const yo = S.jugador, arr = leerCarreras().slice();
  let leg = T.legajoId ? arr.find(l => l.id === T.legajoId) : null;
  if (!leg) { leg = { id: "car_" + Date.now().toString(36) + Math.floor(R.rand() * 1e4).toString(36), creado: new Date().toISOString() }; arr.push(leg); T.legajoId = leg.id; }
  Object.assign(leg, {
    nombre: yo.nombre, ideo: yo.ideo,
    attrs: { carisma: yo.carisma, oratoria: yo.oratoria, gestion: yo.gestion, negociacion: yo.negociacion },
    partidas: T.partida, hitos: T.hitos.map(h => ({ ...h })), actualizado: new Date().toISOString(),
    ultimoPartido: yo.partido === "NUEVO" ? { id: "NUEVO:" + (PARTIDOS.NUEVO ? PARTIDOS.NUEVO.nombre : ""), nombre: PARTIDOS.NUEVO ? PARTIDOS.NUEVO.nombre : "su partido", fundado: true } : { id: yo.partido, nombre: PARTIDOS[yo.partido] ? PARTIDOS[yo.partido].nombre : yo.partido },
    ultimoCargo: cargoTexto(), ultimaEra: S.cfg.era,
  });
  escribirCarreras(arr);
  return leg;
}

function envolverMesTray(n) {
  const orig = globalThis[n];
  if (typeof orig !== "function") return;
  globalThis[n] = function (...a) {
    const enGobierno = S && S.fase !== "campana";
    const ev = orig.apply(this, a);
    if (!S) return ev;
    if (enGobierno && S.fase !== "campana") { revisarEventosTray(ev); if (!S.perdio && !S.terminoMandato) acumularObras(); }
    if (S.perdio || S.terminoMandato) cerrarTrayectoria();
    return ev;
  };
}
// en el vm de las pruebas y en el navegador, las funciones globales se reemplazan por nombre
for (const n of ["terminarSemana", "terminarTrimestre", "finTrimestreLocal", "finTrimestreLeg"]) envolverMesTray(n);

// partidas guardadas antes de esta versión: sin trayectoria, arrancan con una vacía
const _cargarTray = cargar;
cargar = function () {
  const ok = _cargarTray();
  if (ok && S) {
    asegurarTray();
    if (S.jugador && !S.jugador.tray) S.jugador.tray = { grupos: (S.tray.base && S.tray.base.grupos) || {} };
  }
  return ok;
};
