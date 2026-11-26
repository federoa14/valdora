// =============================================================
//  VALDORA - Presión social e incertidumbre
//  Conflictos que nacen de tus decisiones y de la economía
//  (paros, cortes, lockouts, marchas, corridas, campañas de
//  prensa, gobernadores), escalan si los ignorás y se responden
//  con agenda. Encuestas con error y sesgo, datos oficiales con
//  rezago, rumores y filtraciones, intenciones aproximadas.
// =============================================================

const relA = id => (S.actoresRel && id in S.actoresRel) ? S.actoresRel[id] : 50;
const promGob = () => { const g = Object.values(S.gobernadores || {}); return g.length ? g.reduce((a, x) => a + x.relacion, 0) / g.length : 0; };
const CONFLICTOS = [
  { id: "paroGeneral", nombre: "Paro general de la CGT", actor: "cgt", min: "Jefe de Gabinete", nac: true,
    gatillo: () => (relA("cgt") < 38 ? 0.12 : 0) + (S.eco && S.eco.salarioReal < 94 ? 0.1 : 0) + (S.eco && S.eco.pauta === "baja" ? 0.08 : 0),
    ef: { crecimiento: -0.25, tension: 1, imagen: -0.4 }, conceder: { deficit: 0.25, act: { cgt: 15 } }, txt: "La CGT anuncia un paro general de 36 horas con movilización a Plaza de Mayo." },
  { id: "docentes", nombre: "Paro docente nacional", actor: "cgt", min: "Educación", nac: true,
    gatillo: () => (S.presupuesto && S.presupuesto.educacion < 0 ? 0.1 : 0) + (S.ministerios && S.ministerios.educacion.palancas.paritaria === "baja" ? 0.18 : 0) + (S.ministerios && !S.ministerios.educacion.activos.includes("fonid") ? 0.12 : 0),
    ef: { tension: 0.7, imagen: -0.4 }, conceder: { deficit: 0.15 }, txt: "Los gremios docentes paran en todo el país: los chicos pierden días de clase.", dias: 3 },
  { id: "cortes", nombre: "Cortes de rutas y accesos", actor: "movimientos", min: "Desarrollo Social", nac: true, local: true, reprimible: true,
    gatillo: () => (relA("movimientos") < 38 ? 0.12 : 0) + (S.presupuesto && S.presupuesto.social < 0 ? 0.1 : 0) + (S.ministerios && S.ministerios.desarrollo.palancas.planes === "directa" ? 0.1 : 0) + (S.ministerios && S.ministerios.seguridad.palancas.protocolo === "dialogo" ? 0.05 : 0) + Math.max(0, S.ind.pobreza - 40) * 0.004,
    ef: { tension: 0.9, inseguridad: 0.6, imagen: -0.3, crecimiento: -0.05 }, conceder: { deficit: 0.12, caja: -5, act: { movimientos: 12 } }, txt: "Organizaciones sociales cortan el Puente Pueyrredón y los accesos a la Capital. Piden alimentos y trabajo." },
  { id: "lockout", nombre: "Paro agropecuario", actor: "campo", min: "Economía", nac: true,
    gatillo: () => (relA("campo") < 35 ? 0.14 : 0) + (S.eco && S.eco.ret > S.eco.ret0 + 3 ? 0.15 : 0),
    ef: { reservas: -350, crecimiento: -0.1, tension: 0.4 }, conceder: { deficit: 0.2, act: { campo: 15 }, eco: { ret: -3 } }, txt: "Las entidades del campo declaran un paro de comercialización de granos y hacienda. Tractorazos en las rutas." },
  { id: "universidades", nombre: "Marcha federal universitaria", actor: "movimientos", min: "Educación", nac: true,
    gatillo: () => (S.presupuesto && (S.presupuesto.educacion < -10 || S.presupuesto.ciencia < -10) ? 0.2 : 0),
    ef: { imagen: -0.9, legitimidad: -0.4, tension: 0.5 }, conceder: { deficit: 0.08 }, txt: "Estudiantes, docentes y rectores marchan en todo el país en defensa de la universidad pública." },
  { id: "jubilados", nombre: "Protesta de jubilados frente al Congreso", actor: "cgt", min: "Desarrollo Social", nac: true, reprimible: true,
    gatillo: () => (S.ind.inflacion > 4 ? 0.08 : 0) + (S.ministerios && !S.ministerios.salud.activos.includes("remedios") ? 0.15 : 0),
    ef: { imagen: -0.6, tension: 0.4 }, conceder: { deficit: 0.2 }, txt: "Cada miércoles, más jubilados y barras de fútbol se suman a la marcha frente al Congreso." },
  { id: "corrida", nombre: "Corrida cambiaria", actor: "mercados", min: "Economía", nac: true, corrida: true,
    gatillo: () => (S.eco ? (S.eco.brecha > 45 ? 0.15 : 0) + (S.eco.riesgo > 1400 ? 0.12 : 0) : 0) + (S.ind.reservas < 6000 * (S.escalaRes || 1) ? 0.12 : 0) + (relA("mercados") < 30 ? 0.08 : 0),
    ef: { reservas: -700, inflacion: 0.25, imagen: -0.5 }, txt: "El dólar paralelo se dispara, los depósitos en dólares caen y hay colas en las casas de cambio." },
  { id: "prensa", nombre: "Campaña de los grandes medios", actor: "prensa", min: "Jefe de Gabinete", nac: true, local: true,
    gatillo: () => (relA("prensa") < 33 ? 0.14 : 0) + (S.riesgo > 40 ? 0.05 : 0),
    ef: { imagen: -0.7 }, conceder: { deficit: 0.05, caja: -3, act: { prensa: 12 } }, txt: "Tapas, editoriales y denuncias en cadena: los grandes medios salen contra el gobierno." },
  { id: "policial", nombre: "Protesta policial por salarios", actor: "fuerzas", min: "Seguridad", nac: true, local: true,
    gatillo: () => (relA("fuerzas") < 32 ? 0.12 : 0) + (S.presupuesto && S.presupuesto.seguridad < -10 ? 0.12 : 0),
    ef: { inseguridad: 2, legitimidad: -0.5 }, conceder: { deficit: 0.1, caja: -6, act: { fuerzas: 15 } }, txt: "Policías se autoacuartelan y patrulleros rodean la sede del ministerio. Crecen los saqueos en el conurbano." },
  { id: "gobernadores", nombre: "Rebelión de gobernadores", actor: null, min: "Interior", nac: true,
    gatillo: () => (promGob() < -15 ? 0.15 : 0),
    ef: { legitimidad: -0.4 }, conceder: { deficit: 0.3, gob: 15 }, txt: "Una liga de gobernadores retiene a sus legisladores y exige fondos y obras para votar cualquier ley." },
  // locales
  { id: "estatales", nombre: "Paro de estatales y docentes", actor: null, min: null, local: true,
    gatillo: () => (S.ind.caja != null && S.ind.caja < 30 ? 0.2 : 0) + (S.sueldosImpagos ? 0.25 : 0),
    ef: { tension: 1, imagen: -0.6, servicios: -1 }, conceder: { caja: -8 }, txt: "Los gremios estatales paran por salarios: escuelas y hospitales con servicios mínimos." },
  { id: "vecinos", nombre: "Protesta vecinal por servicios", actor: null, min: null, local: true,
    gatillo: () => (S.ind.servicios != null && S.ind.servicios < 40 ? 0.18 : 0),
    ef: { imagen: -0.7, tension: 0.5 }, conceder: { caja: -5, servicios: 3 }, txt: "Vecinos cortan avenidas por la basura, el alumbrado y la inseguridad." },
];
const NIVELES = ["", "Latente", "En la calle", "Escalando", "Grave", "Desborde"];

function esNacional() { return S.fase === "gobierno"; }
function conflictosActivos() { return (S.conflictos || []).filter(c => c.nivel > 0); }
function nuevoConflicto(id, eventos) {
  const C = CONFLICTOS.find(x => x.id === id);
  S.conflictos = S.conflictos || [];
  S.conflictos.push({ id, nivel: 1, desde: S.mes || 1, atendido: false, dias: 0 });
  log(`${C.nombre}: ${C.txt}`, "malo");
  titular(R.pick(["Diario El Faro", "La Posta", "Canal Federal Noticias", "Página Sur", "Radio Pampa"]), C.nombre);
  eventos.push({ titulo: "Conflicto: " + C.nombre, texto: C.txt + " Podés negociar, ceder o dejar que escale (pestaña Conflictos).", tipo: "aviso" });
}
function aplicarConflictoEf(ef, mult) {
  const out = {};
  for (const k in ef) { if (k in S.ind) out[k] = ef[k] * mult; }
  if (out.reservas) out.reservas /= (S.escalaRes || 1); // aplicarEfectos ya escala
  aplicarEfectos(out);
}
function pasoSocial(eventos) {
  const nac = esNacional();
  S.conflictos = S.conflictos || [];
  // los activos escalan si no se atendieron y bajan si se fue la causa
  for (const c of conflictosActivos()) {
    const C = CONFLICTOS.find(x => x.id === c.id);
    const causa = C.gatillo() > 0.05;
    if (!c.atendido && causa && R.rand() < 0.45) c.nivel = Math.min(5, c.nivel + 1);
    else if (!causa && R.rand() < 0.45) c.nivel -= 1;
    else if (c.atendido && R.rand() < 0.3) c.nivel -= 1;
    if (c.nivel >= 5 && !c.desbordo) {
      c.desbordo = true;
      aplicarConflictoEf(C.corrida ? { reservas: -3000, inflacion: 1.5 } : { tension: 6, imagen: -4, legitimidad: -3 }, 1);
      eventos.push({ titulo: `Desborde: ${C.nombre}`, texto: C.corrida ? "La corrida se vuelve bancaria: los ahorristas retiran depósitos y el Banco Central pierde 3.000 millones en una semana." : "El conflicto se desborda: enfrentamientos, heridos y una crisis política que domina toda la agenda.", tipo: "malo" });
    }
    if (c.nivel > 0) aplicarConflictoEf(C.ef, c.nivel / 4);
    if (C.dias) c.dias += C.dias * c.nivel;
    c.atendido = false;
  }
  S.conflictos = S.conflictos.filter(c => c.nivel > 0 || (S.mes || 1) - c.desde < 2);
  // nacen nuevos según la tensión y los gatillos
  if (conflictosActivos().length < 2) {
    const pos = CONFLICTOS.filter(C => (nac ? C.nac : C.local) && !conflictosActivos().some(c => c.id === C.id));
    const factorT = 0.6 + Math.max(0, S.ind.tension - 35) / 80;
    for (const C of pos) { if (R.rand() < C.gatillo() * factorT * 0.7) { nuevoConflicto(C.id, eventos); break; } }
  }
}
function ministroDeConflicto(C) {
  if (!C.min || !S.gabinete) return null;
  if (C.min === "Economía") return S.ministroEco ? { comp: S.ministroEco.id === "politico" ? 7 : 6, rasgo: S.ministroEco.id === "politico" ? "negociador" : "tecnico", nombre: S.ministroEco.nombre } : null;
  return S.gabinete.find(m => m.cargo === C.min);
}
function responderConflicto(idx, modo) {
  const c = conflictosActivos()[idx]; if (!c) return { ok: false, msg: "Ese conflicto ya terminó." };
  const C = CONFLICTOS.find(x => x.id === c.id), nac = esNacional();
  if (modo === "ignorar") { c.atendido = false; return { ok: true, msg: "Decidiste no intervenir. Puede escalar." }; }
  return conCasillero(1, () => {
    const m = ministroDeConflicto(C);
    if (modo === "dialogo") {
      const p = R.clamp(0.4 + (m ? (m.comp - 5) * 0.06 : 0) + (m && m.rasgo === "negociador" ? 0.15 : 0) + (m && m.rasgo === "territorio" ? 0.1 : 0) - c.nivel * 0.05 + (C.actor ? (relA(C.actor) - 40) / 200 : 0), 0.1, 0.9);
      c.atendido = true;
      if (R.rand() < p) { c.nivel = Math.max(0, c.nivel - 2); if (C.actor && typeof moverActor === "function") moverActor(C.actor, 5); const msg = `Mesa de diálogo${m ? " encabezada por " + m.nombre : ""}: hay un principio de acuerdo y el conflicto ${c.nivel ? "baja de intensidad" : "se levanta"}.`; log(msg, "bueno"); return { ok: true, msg, tipo: "bueno" }; }
      const msg = `La mesa de diálogo fracasó${m ? ": " + m.nombre + " no consiguió acercar posiciones" : ""}. El conflicto sigue.`; log(msg, "aviso"); return { ok: true, msg, tipo: "aviso" };
    }
    if (modo === "conceder") {
      if (!C.conceder) return { ok: false, msg: "No hay nada que conceder en este conflicto." };
      const k = C.conceder;
      if (nac && k.deficit) aplicarEfectos({ deficit: k.deficit });
      if (!nac && k.caja && "caja" in S.ind) aplicarEfectos({ caja: k.caja });
      if (k.servicios && "servicios" in S.ind) aplicarEfectos({ servicios: k.servicios });
      if (k.act && typeof moverActor === "function") for (const a in k.act) moverActor(a, k.act[a]);
      if (k.gob && typeof moverGobernadores === "function") moverGobernadores(k.gob);
      if (k.eco && S.eco) for (const a in k.eco) S.eco[a] += k.eco[a];
      if (typeof moverActor === "function") moverActor("mercados", -3);
      c.nivel = 0;
      const msg = `Cediste a los reclamos: se levanta el conflicto (${C.nombre}). ${nac ? "Cuesta déficit" : "Cuesta caja"} y otros sectores toman nota.`; log(msg, "aviso"); return { ok: true, msg, tipo: "aviso" };
    }
    if (modo === "reprimir") {
      if (!C.reprimible && !C.corrida) return { ok: false, msg: "Esto no se resuelve con las fuerzas de seguridad." };
      if (C.corrida) return { ok: false, msg: "Para frenar una corrida usá las herramientas del Ministerio de Economía: tasa, reservas o cepo." };
      const halcon = S.gabinete && S.gabinete.find(x => x.cargo === "Seguridad" && x.rasgo === "halcon");
      aplicarEfectos({ legitimidad: -1.5 * c.nivel, tension: c.nivel });
      if (typeof moverActor === "function") moverActor(C.actor || "movimientos", -10);
      if (R.rand() < 0.07 * c.nivel) {
        aplicarEfectos({ imagen: -8, legitimidad: -10, tension: 8 });
        const msg = "La represión deja un manifestante muerto. Conmoción nacional: la oposición pide el juicio político del ministro de Seguridad y se multiplican las marchas.";
        titular("Página Sur", "Muerte en la represión"); log(msg, "malo"); c.nivel = Math.min(5, c.nivel + 2); return { ok: true, msg, tipo: "malo" };
      }
      if (R.rand() < 0.6 + (halcon ? 0.15 : 0)) { c.nivel = Math.max(0, c.nivel - 3); const msg = "Las fuerzas federales despejan los cortes aplicando el protocolo. Hay detenidos y críticas de los organismos de derechos humanos."; log(msg, "aviso"); return { ok: true, msg, tipo: "aviso" }; }
      const msg = "El operativo fracasa: los manifestantes vuelven a cortar a las pocas horas y la imagen de los palos recorre los noticieros."; log(msg, "malo"); return { ok: true, msg, tipo: "malo" };
    }
    return { ok: false, msg: "Respuesta desconocida." };
  });
}

// ---------- Incertidumbre ----------
const CONSULTORAS_GOB = [{ nombre: "Consultora Delfos", sesgo: 3, error: 2.5 }, { nombre: "Opina Sur", sesgo: -4, error: 3 }, { nombre: "Datos del Plata", sesgo: 0, error: 2 }, { nombre: "Federal Research", sesgo: 1.5, error: 3.5 }];
function encuestasGobierno() {
  const I = S.ind;
  S.encGob = CONSULTORAS_GOB.map(c => ({ nombre: c.nombre, imagen: R.clamp(I.imagen + c.sesgo + R.gauss() * c.error, 1, 99), error: c.error }));
  S.imagenEncuestas = S.encGob.reduce((a, e) => a + e.imagen, 0) / S.encGob.length;
}
function imagenPublicada() { return S.imagenEncuestas != null ? S.imagenEncuestas : S.ind.imagen; }
// cifras oficiales: la inflación tiene un dato preliminar con error que se corrige al mes siguiente
function publicarDatos() {
  const H = S.hist; if (!H || !H.length) return;
  const ult = H[H.length - 1];
  if (ult.inflacionPub == null) ult.inflacionPub = Math.max(0.1, ult.inflacion + R.gauss() * 0.15);
  if (H.length > 1) { const prev = H[H.length - 2]; prev.inflacionRev = prev.inflacion; }
}
// lo que tus asesores creen saber de cada factor de poder
function percibirActores() {
  if (!S.actoresRel) return;
  const int = S.gabinete && S.gabinete.find(m => m.cargo === "Interior");
  const sd = 14 - (int ? int.comp : 5);
  S.percepcion = {};
  for (const k in S.actoresRel) S.percepcion[k] = { v: R.clamp(S.actoresRel[k] + R.gauss() * sd * 0.6, 0, 100), sd };
}
const RUMORES = [
  { cond: () => relA("cgt") < 40, falso: 0.25, txt: () => "En la CGT preparan un paro general para el mes próximo." },
  { cond: () => relA("campo") < 40, falso: 0.3, txt: () => "Las entidades del campo evalúan un paro de comercialización." },
  { cond: () => S.gabinete && S.gabinete.some(m => m.lealtad < 30), falso: 0.2, txt: () => { const m = S.gabinete.slice().sort((a, b) => a.lealtad - b.lealtad)[0]; return `${m.nombre} (${m.cargo}) se queja en privado del rumbo y negocia su salida.`; } },
  { cond: () => S.ind.legitimidad < 35, falso: 0.35, txt: () => "Diputados de la oposición sondean votos para un juicio político." },
  { cond: () => S.eco && S.eco.brecha > 30, falso: 0.4, txt: () => "Versiones de devaluación inminente recorren las mesas de dinero." },
  { cond: () => S.mundo && S.mundo.secretos.some(s => !s.filtrado), falso: 0.1, txt: () => "Un periodista de investigación pregunta en la Cancillería por un acuerdo que no figura en ningún registro." },
  { cond: () => true, falso: 0.7, txt: () => R.pick(["El Presidente estaría por echar a medio gabinete.", "La Federación del Norte condicionaría su apoyo en el Fondo a un voto en la ONF.", "Un gobernador aliado negocia en secreto con la oposición.", "Habría un faltante de reservas mayor al informado."]) },
  { cond: () => S.mundo && S.mundo.petroleo > S.mundo.base.petroleo * 1.2, falso: 0.4, txt: () => "Las petroleras presionan para liberar el precio de los combustibles." },
];
function generarRumor() {
  if (R.rand() > 0.4) return;
  const pos = RUMORES.filter(r => r.cond()); if (!pos.length) return;
  const r = R.pick(pos);
  S.rumores = S.rumores || [];
  S.rumores.unshift({ mes: S.mes || 1, txt: r.txt(), veraz: R.rand() > r.falso, fuente: R.pick(["un funcionario que pidió reserva", "fuentes parlamentarias", "operadores del mercado", "un dirigente sindical", "un diplomático", "una consultora privada"]), confianza: R.pick(["baja", "media", "media", "alta"]) });
  if (S.rumores.length > 8) S.rumores.pop();
}

// ---------- Orquestación del mes ----------
function normalizarInd() {
  const I = S.ind;
  for (const k of ["imagen", "legitimidad", "tension", "inseguridad", "servicios"]) if (k in I) I[k] = R.clamp(I[k], 0, 100);
  if ("reservas" in I) I.reservas = Math.max(0, I.reservas);
  if ("caja" in I) I.caja = Math.max(-200, I.caja);
}
function inyectarExpedientes() {
  if (!S.mundo || !S.mundo.colaExp || !S.mundo.colaExp.length) return;
  S.expedientes = S.expedientes || [];
  for (const id of S.mundo.colaExp) if (!S.expedientes.some(e => e.id === id && !e.resuelto)) S.expedientes.push({ id, resuelto: false });
  S.mundo.colaExp = [];
}
terminarTrimestre = (orig => function () {
  if (!S || S.fase !== "gobierno") return orig();
  S._eventosMes = [];
  const ev = orig() || [];
  if (S.perdio || S.terminoMandato) { S._eventosMes = []; return ev; }
  const extra = S._eventosMes;
  try {
    pasoGabinete(extra); pasoCancilleria(extra); pasoSocial(extra);
    encuestasGobierno(); publicarDatos(); percibirActores(); generarRumor(); inyectarExpedientes();
  } catch (e) { if (typeof console !== "undefined") console.error(e); }
  S._eventosMes = [];
  normalizarInd();
  return ev.concat(extra);
})(terminarTrimestre);
if (typeof finTrimestreLocal === "function") finTrimestreLocal = (orig => function () {
  const ev = orig() || [];
  if (!S || S.perdio || S.terminoMandato) return ev;
  const extra = [];
  try { pasoSocial(extra); encuestasGobierno(); generarRumor(); } catch (e) { if (typeof console !== "undefined") console.error(e); }
  normalizarInd();
  return ev.concat(extra);
})(finTrimestreLocal);
iniciarGobierno = (orig => function () { orig(); if (typeof asegurarGabinete === "function") asegurarGabinete(); mundo(); eco(); encuestasGobierno(); percibirActores(); })(iniciarGobierno);
