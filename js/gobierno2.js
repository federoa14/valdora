// =============================================================
//  VALDORA - Gobierno profundo (v0.2)
//  Extiende el motor: factores de poder, gabinete, vicepresidente,
//  expedientes con dilemas, consecuencias diferidas, comisiones,
//  ley de Presupuesto anual y vacantes en la Corte.
// =============================================================

const _iniciarGobierno = iniciarGobierno;
iniciarGobierno = function () {
  _iniciarGobierno();
  const yo = S.jugador;
  S.actoresRel = {};
  S.actoresBase = {};
  for (const a of ACTORES) {
    let base = 62 - Math.abs(a.ideo - yo.ideo) * 0.7;
    if (a.id === "corte") base = 50;
    base = R.clamp(base, 15, 80);
    S.actoresBase[a.id] = base;
    S.actoresRel[a.id] = base;
  }
  // los pactos de campaña arrancan con mejor relación
  const pactoActor = { sindicatos: "cgt", campo: "campo", empresarios: "industria", movimientos: "movimientos", iglesia: "iglesia" };
  for (const p of S.pactos) if (pactoActor[p]) S.actoresRel[pactoActor[p]] += 15;
  S.flags = {};
  S.diferidos = [];
  S.gabinete = GABINETE_BASE.map(m => ({ ...m, comp: R.clamp(m.comp + Math.round(R.gauss()), 3, 9), desgaste: 0 }));
  S.ministroEco = null;
  S.vice = { nombre: R.pick(["Cristina Albarracín", "Julio Cobián", "Gabriela Mendiondo", "Carlos Aráoz"]), lealtad: 65 };
  S.presupuestoAprobado = { ...S.presupuesto };
  S.delegacion = 0;
  S.enDefault = false;
  S.expedientes = [];
  S.historialExp = [];
  S.ultimasReacciones = [];
  S.decisionInicial = "ministroEco";
  log(`Tu vicepresidente es ${S.vice.nombre}. Preside el Senado y desempata.`, "info");
};

function relActor(id) { return S.actoresRel ? S.actoresRel[id] : 50; }
function moverActor(id, d) {
  if (!S.actoresRel || !(id in S.actoresRel)) return;
  S.actoresRel[id] = R.clamp(S.actoresRel[id] + d, 0, 100);
}
function moverGobernadores(d) { for (const g of Object.values(S.gobernadores)) g.relacion = R.clamp(g.relacion + d, -100, 100); }

function elegirMinistroEco(perfilId) {
  const P = PERFILES_ECONOMIA.find(p => p.id === perfilId);
  const anterior = S.ministroEco;
  S.ministroEco = { ...P };
  for (const k in P.act) moverActor(k, P.act[k]);
  if (P.gob) moverGobernadores(P.gob);
  S.decisionInicial = null;
  if (!S.expedientes.length) generarExpedientes();
  const t = anterior ? `Asume ${P.nombre} (${P.titulo}) en Economía, en reemplazo de ${anterior.nombre}.` : `Designaste a ${P.nombre} (${P.titulo}) como ministro de Economía.`;
  log(t, "info");
  return t;
}

// ---------- Expedientes ----------
function generarExpedientes() {
  const n = !S.mes || S.mes === 1 ? 2 : 1; // un expediente por mes
  const recientes = S.historialExp.slice(-6);
  const usados = new Set(S.historialExp);
  let posibles = DILEMAS.filter(d => (!d.cond || d.cond(S)) && !recientes.includes(d.id) && !(d.unico && usados.has(d.id)));
  const elegidos = [];
  for (let i = 0; i < n && posibles.length; i++) {
    const tot = posibles.reduce((a, d) => a + d.peso, 0);
    let r = R.rand() * tot, pick = posibles[0];
    for (const d of posibles) { r -= d.peso; if (r <= 0) { pick = d; break; } }
    elegidos.push(pick.id);
    posibles = posibles.filter(d => d !== pick);
  }
  S.expedientes = elegidos.map(id => ({ id, resuelto: false }));
  S.historialExp.push(...elegidos);
}

function resolverExpediente(idx, opIdx) {
  const exp = S.expedientes[idx];
  if (!exp || exp.resuelto) return { msg: "Expediente ya resuelto." };
  const d = DILEMAS.find(x => x.id === exp.id);
  const op = d.opciones[opIdx];
  exp.resuelto = true; exp.eleccion = opIdx;
  const r = aplicarOpcion(op, d);
  log(`${d.titulo}: ${op.t}. ${r.msg}`.trim(), r.tipo || "info");
  return r;
}

function aplicarOpcion(op, d) {
  const out = { msg: "", pasos: [], tipo: "info" };
  if (op.ind) aplicarEfectos(op.ind);
  if (op.grp) aplicarEfectos(null, op.grp);
  if (op.act) for (const k in op.act) moverActor(k, op.act[k]);
  if (op.gob) moverGobernadores(op.gob);
  if (op.riesgo) S.riesgo = Math.max(0, S.riesgo + op.riesgo);
  if (op.flag) S.flags[op.flag] = true;
  if (op.dif) for (const df of op.dif) {
    if (df.prob && R.rand() > df.prob) continue;
    if (df.en === 0) { aplicarEfectos(df.ind); if (df.act) for (const k in df.act) moverActor(k, df.act[k]); out.msg += " " + df.texto; out.tipo = "malo"; }
    else S.diferidos.push({ t: S.trimestre + df.en, texto: df.texto, ind: df.ind, act: df.act, origen: d ? d.titulo : "" });
  }
  if (op.fx) { const r = efectoEspecial(op.fx); out.msg += " " + (r.msg || ""); if (r.pasos) out.pasos = r.pasos; if (r.tipo) out.tipo = r.tipo; }
  out.msg = out.msg.trim();
  return out;
}

function efectoEspecial(fx) {
  const [tipo, a, b] = fx.split(":");
  const yo = S.jugador;
  switch (tipo) {
    case "gobRelacion": {
      const g = S.gobernadores[a]; if (!g) return {};
      g.relacion = R.clamp(g.relacion + Number(b), -100, 100);
      return { msg: `Relación con el gobernador de ${PROVINCIAS.find(p => p.id === a).nombre}: ${Math.round(g.relacion)}.` };
    }
    case "intervencion": {
      const prov = PROVINCIAS.find(p => p.id === a);
      const ley = { ideo: 50 };
      const v1 = votarCamara("dip", ley, { extra: -10 });
      const v2 = v1.aprobado ? votarCamara("sen", ley, { extra: -15 }) : null;
      const pasos = [v1, v2].filter(Boolean);
      if (v1.aprobado && v2.aprobado) {
        S.gobernadores[a] = { partido: yo.partido, relacion: 60 };
        aplicarEfectos({ legitimidad: -4, tension: -2 });
        moverGobernadores(-8);
        return { msg: `El Congreso aprobó la intervención federal de ${prov.nombre} (art. 6). Un interventor tuyo asume el gobierno provincial. Los demás gobernadores toman nota.`, pasos, tipo: "aviso" };
      }
      aplicarEfectos({ imagen: -3, legitimidad: -2 });
      return { msg: `El Congreso rechazó la intervención de ${prov.nombre}. Derrota política.`, pasos, tipo: "malo" };
    }
    case "default": {
      S.enDefault = true;
      if (S.fmi) S.fmi.activo = false;
      return { msg: "Valdora entra en cesación de pagos." , tipo: "malo" };
    }
    case "ley": {
      const L = LEYES_DILEMA[a];
      const r = tratarLey({ ideo: L.ideo, nombre: L.nombre }, 0);
      if (r.aprobado) {
        aplicarEfectos(L.ef, L.grupos);
        if (a === "delegacion") { S.delegacion = 4; return { msg: `El Congreso te delegó facultades por un año (art. 76). Podés dictar decretos delegados en materia administrativa y económica.`, pasos: r.pasos, tipo: "bueno" }; }
        return { msg: `El Congreso sancionó: ${L.nombre}.`, pasos: r.pasos, tipo: "bueno" };
      }
      aplicarEfectos({ imagen: -1.5 });
      return { msg: r.cajoneado ? `Quedó cajoneada en comisión: ${L.nombre}.` : `El Congreso rechazó: ${L.nombre}.`, pasos: r.pasos, tipo: "malo" };
    }
    case "pliego": {
      const extra = a === "afin" ? -25 : a === "independiente" ? 35 : 20;
      const v = votarCamara("sen", { ideo: a === "afin" ? yo.ideo : 50 }, { extra, dosTercios: true });
      if (v.aprobado) {
        if (a === "afin") { S.corte.afines++; aplicarEfectos({ legitimidad: -3 }); moverActor("corte", 15); }
        else if (a === "independiente") { aplicarEfectos({ legitimidad: 5 }); moverActor("corte", 5); }
        else { S.corte.afines++; S.corte.miembros = Math.max(S.corte.miembros, 5); aplicarEfectos({ legitimidad: 1 }); moverActor("corte", 8); }
        return { msg: `El Senado aprobó el pliego con ${v.si} votos (necesitaba ${v.necesario}). El nuevo juez jura en la Corte.`, pasos: [v], tipo: "bueno" };
      }
      aplicarEfectos({ imagen: -2 });
      return { msg: `El Senado rechazó el pliego: ${v.si} votos de ${v.necesario} necesarios. La vacante sigue abierta.`, pasos: [v], tipo: "malo" };
    }
    case "vice": {
      S.vice.lealtad = R.clamp(S.vice.lealtad + Number(a), 0, 100);
      return { msg: `Lealtad de ${S.vice.nombre}: ${Math.round(S.vice.lealtad)}.${S.vice.lealtad < 30 ? " Su sector en el Senado votará con libertad de acción." : ""}` };
    }
    case "ministro": return { msg: elegirMinistroEco(a) };
    case "waiver": {
      if (relActor("fmi") > 50 || R.rand() < relActor("fmi") / 100) { moverActor("fmi", -5); return { msg: "El Fondo concede el waiver: perdona el incumplimiento y gira el desembolso.", tipo: "bueno" }; }
      aplicarEfectos({ reservas: -1500 }); moverActor("fmi", -10);
      return { msg: "El Fondo niega el waiver y suspende el desembolso.", tipo: "malo" };
    }
    case "finFMI": { if (S.fmi) S.fmi.activo = false; return { msg: "Valdora da por terminado el programa con el Fondo.", tipo: "aviso" }; }
    case "dnuTributario": {
      aplicarEfectos({ legitimidad: -4, imagen: 2 }); moverActor("cgt", 10); moverActor("corte", -12);
      S.diferidos.push({ t: S.trimestre + 1, texto: "La Justicia declara inconstitucional el decreto sobre Ganancias: los DNU no pueden tratar materia tributaria (art. 99 inc. 3).", ind: { legitimidad: -3, imagen: -2 } });
      return { msg: "Firmaste el decreto. Los constitucionalistas advierten que es inválido.", tipo: "aviso" };
    }
    case "delegacion": return efectoEspecial("ley:delegacion");
  }
  return {};
}

// Lo que no se decide también tiene consecuencias
function expedientesSinResolver() {
  const pend = S.expedientes.filter(e => !e.resuelto);
  for (const e of pend) {
    const d = DILEMAS.find(x => x.id === e.id);
    e.resuelto = true; e.eleccion = -1;
    aplicarEfectos({ imagen: -2, legitimidad: -1, tension: 2 });
    log(`No decidiste sobre "${d.titulo}". La indecisión se paga: el problema se agrava.`, "malo");
  }
  return pend.length;
}

// ---------- Ministro, vice y Congreso ----------
const _probApoyo = probApoyo;
probApoyo = function (bloque, medida, extra = 0) {
  let p = _probApoyo(bloque, medida, extra);
  const yo = S.jugador;
  if (bloque === yo.partido && S.vice && S.vice.lealtad < 30) p -= 0.2;
  if (bloque !== yo.partido && S.gabinete) {
    const jg = S.gabinete.find(m => m.cargo === "Jefe de Gabinete");
    if (jg) p += (jg.comp - 5) * 0.015;
  }
  return R.clamp(p, 0.01, 0.99);
};

// Comisiones y dictamen antes del recinto
function comision(medida, extra = 0) {
  const yo = S.jugador;
  const propios = (S.dip[yo.partido] || 0) / 257;
  const relProm = Object.entries(S.bloques).filter(([k]) => k !== yo.partido).reduce((a, [k, b]) => a + b.relacion * (S.dip[k] || 0), 0) / 257;
  const p = R.clamp(0.25 + propios * 0.9 + relProm / 200 + extra / 100 + (medida && medida.ideo ? -Math.abs(medida.ideo - 50) / 300 : 0), 0.08, 0.95);
  const ok = R.rand() < p;
  return { tipo: "comision", ok, prob: p, texto: ok ? "Las comisiones emitieron dictamen de mayoría." : "El proyecto no consiguió dictamen: quedó cajoneado en comisión." };
}

const _tratarLey = tratarLey;
tratarLey = function (medida, extra) {
  const c = comision(medida, extra || 0);
  if (!c.ok) return { aprobado: false, cajoneado: true, pasos: [c] };
  const r = _tratarLey(medida, extra);
  r.pasos.unshift(c);
  return r;
};

// Sesión especial sin dictamen: requiere dos tercios (reglamento)
function forzarSesionEspecial(medidaId) {
  const m = MEDIDAS.find(x => x.id === medidaId);
  const v1 = votarCamara("dip", m, { dosTercios: true });
  const pasos = [v1];
  let aprobado = false;
  if (v1.aprobado) { const v2 = votarCamara("sen", m, {}); pasos.push(v2); aprobado = v2.aprobado; }
  if (aprobado) {
    aplicarEfectos(m.ef, m.grupos); S.medidasActivas.push(m.id); medidaAActores(m);
    log(`Sesión especial: el Congreso sancionó sin dictamen ${m.nombre}.`, "bueno");
  } else { aplicarEfectos({ imagen: -1 }); log(`Fracasó la sesión especial por ${m.nombre}.`, "malo"); }
  return { aprobada: aprobado, pasos, msg: aprobado ? "Aprobada en sesión especial." : "No se reunieron los dos tercios para tratarla sin dictamen." };
}

function medidaAActores(m) {
  if (!m.grupos) return;
  for (const g in m.grupos) for (const a of (GRUPO_A_ACTOR[g] || [])) moverActor(a, m.grupos[g] * 35);
  if (m.materia === "laboral") moverActor("cgt", -15);
  if (["ajuste", "privatizar", "levantarCepo", "megaDNU"].includes(m.id)) { moverActor("mercados", 10); moverActor("fmi", 10); }
  if (["estatizar", "cepo", "retMoviles"].includes(m.id)) { moverActor("mercados", -12); moverActor("norte", -5); }
  if (m.id === "ampliarCorte") moverActor("corte", -25);
  if (m.id === "leyMedios") moverActor("prensa", -30);
  if (m.id === "codigoPenal" || m.id === "planSeguridad") moverActor("fuerzas", 10);
}

const _tomarMedida = tomarMedida;
tomarMedida = function (medidaId, instrumento, extra = 0) {
  const m = MEDIDAS.find(x => x.id === medidaId);
  // Con facultades delegadas, un decreto delegado reemplaza a la ley (salvo materia penal, tributaria o electoral)
  if (instrumento === "delegado") {
    if (S.delegacion <= 0) return { ok: false, msg: "No tenés facultades delegadas." };
    if (["penal", "tributaria", "electoral"].includes(m.materia)) return { ok: false, msg: "La delegación no alcanza materia penal, tributaria ni electoral." };
    if (S.medidasEsteTrimestre >= 1) return { ok: false, msg: "Ya tomaste la medida grande de este mes." };
    if (S.medidasActivas.includes(m.id)) return { ok: false, msg: "Esa medida ya está vigente." };
    S.medidasEsteTrimestre++;
    aplicarEfectos(m.ef, m.grupos); S.medidasActivas.push(m.id); medidaAActores(m); S.ind.legitimidad -= 1.5;
    log(`Decreto delegado: ${m.nombre}.`, "bueno");
    return { ok: true, aprobada: true, pasos: [], msg: `Firmaste un decreto delegado: ${m.nombre}.` };
  }
  const r = _tomarMedida(medidaId, instrumento, extra);
  if (r.ok && r.aprobada) medidaAActores(m);
  if (r.ok && instrumento === "ley" && !r.aprobada && r.pasos.length === 1 && r.pasos[0].tipo === "comision") {
    r.cajoneado = true; r.msg = `${m.nombre}: el proyecto quedó cajoneado en comisión. Podés pedir una sesión especial sin dictamen (dos tercios).`;
  }
  if (r.ok && instrumento === "dnu") { moverActor("corte", -4); }
  return r;
};

// ---------- Reacciones y fin de trimestre ----------
function derivaActores() {
  const I = S.ind, yo = S.jugador;
  const A = S.ancla || { inflacion: 2, desempleo: 7, pobreza: 30 };
  const d = {
    cgt: -Math.min(I.inflacion - A.inflacion - 1, 10) * 1.5 - (I.desempleo - A.desempleo - 1) * 0.8,
    campo: (S.medidasActivas.includes("retenciones") ? 2 : 0) - (S.medidasActivas.includes("retMoviles") ? 3 : 0) - (S.medidasActivas.includes("cepo") ? 1.5 : 0),
    industria: (I.crecimiento - 1) * 1.5,
    mercados: -(I.deficit - 2) * 2 + (I.reservas - 15000) / 4000 - (S.enDefault ? 4 : 0),
    movimientos: -(I.pobreza - A.pobreza - 5) * 0.3 + S.presupuesto.social / 10,
    iglesia: -(I.pobreza - A.pobreza - 5) * 0.2,
    fuerzas: S.presupuesto.seguridad / 10,
    prensa: -S.riesgo / 15 - (S.dnuCount > 3 ? 1 : 0),
    corte: -(S.dnuCount > 3 ? 1.5 : 0),
    fmi: S.fmi && S.fmi.activo ? (S.fmi.metaDeficit - I.deficit) * 3 : 0,
    norte: S.alineamiento === "norte" ? 1.5 : S.alineamiento === "este" ? -1.5 : 0,
  };
  for (const a of ACTORES) {
    const base = S.actoresBase[a.id];
    S.actoresRel[a.id] = R.clamp(S.actoresRel[a.id] + ((base - S.actoresRel[a.id]) * 0.08 + (d[a.id] || 0)) * pasoT(), 0, 100);
  }
}

function reaccionesActores() {
  const eventos = [];
  S.ultimasReacciones = [];
  for (const a of ACTORES) {
    const rel = S.actoresRel[a.id];
    if (rel < 25 && R.rand() < 0.55) {
      aplicarEfectos(a.ef);
      S.ultimasReacciones.push({ actor: a.nombre, texto: a.contra, malo: true });
      eventos.push({ titulo: `${a.nombre}: ${a.contra.toLowerCase()}`, texto: `La relación con ${a.nombre} está rota (${Math.round(rel)}/100) y pasa a la acción.`, tipo: "malo" });
      log(`${a.nombre}: ${a.contra}.`, "malo");
      S.actoresRel[a.id] += 6; // descarga
    } else if (rel > 75 && R.rand() < 0.4) {
      aplicarEfectos(a.efPro);
      S.ultimasReacciones.push({ actor: a.nombre, texto: a.pro, malo: false });
      log(`${a.nombre}: ${a.pro}.`, "bueno");
    }
  }
  // Sólo se muestran como ventana las dos peores
  return eventos.slice(0, 2);
}

function procesarDiferidos() {
  const ev = [];
  const llegan = S.diferidos.filter(d => d.t <= S.trimestre);
  S.diferidos = S.diferidos.filter(d => d.t > S.trimestre);
  for (const d of llegan) {
    aplicarEfectos(d.ind);
    if (d.act) for (const k in d.act) moverActor(k, d.act[k]);
    ev.push({ titulo: "Consecuencia de una decisión anterior", texto: (d.origen ? `${d.origen}: ` : "") + d.texto, tipo: (d.ind && (d.ind.imagen < 0 || d.ind.tension > 0 || d.ind.reservas < 0 || d.ind.crecimiento < 0)) ? "malo" : "bueno" });
    log(d.texto, "aviso");
  }
  return ev;
}

function presupuestoAnual() {
  const yo = S.jugador, I = S.ind;
  const extra = 10 + (3 - I.deficit) * 6 + (I.imagen - 50) / 3;
  const ley = { ideo: yo.ideo };
  const v1 = votarCamara("dip", ley, { extra });
  const v2 = v1.aprobado ? votarCamara("sen", ley, { extra }) : null;
  const pasos = [v1, v2].filter(Boolean);
  if (v1.aprobado && v2.aprobado) {
    S.presupuestoAprobado = { ...S.presupuesto };
    return { titulo: "Ley de Presupuesto", texto: "El Congreso aprobó tu presupuesto para el año próximo.", tipo: "bueno", pasos };
  }
  S.presupuesto = { ...S.presupuestoAprobado };
  aplicarEfectos({ legitimidad: -3, imagen: -2 });
  moverActor("mercados", -5);
  return { titulo: "Sin Presupuesto", texto: "El Congreso rechazó la Ley de Presupuesto. Se prorroga el del año anterior: tus cambios de partidas no rigen y gobernás con decisiones administrativas.", tipo: "malo", pasos };
}

function desgasteGabinete() {
  for (const m of S.gabinete) m.desgaste += 1 + (S.ind.imagen < 40 ? 1 : 0);
  const quemado = S.gabinete.find(m => m.desgaste > 8 && R.rand() < 0.25);
  if (quemado) {
    const nuevo = R.pick(["Andrés Lucero", "Silvina Bazán", "Gustavo Benítez Arce", "Florencia Arrieta", "Martín Goyeneche", "Victoria Toledo", "Jorge Tarragó", "Eduardo Almirón"]);
    const t = `Renuncia ${quemado.nombre} (${quemado.cargo}), desgastado tras meses de gestión. Asume ${nuevo}.`;
    quemado.nombre = nuevo; quemado.desgaste = 0; quemado.comp = R.clamp(4 + Math.round(R.rand() * 4), 3, 9);
    aplicarEfectos({ imagen: -1 });
    log(t, "aviso");
    return { titulo: "Cambio en el gabinete", texto: t, tipo: "aviso" };
  }
  return null;
}

const _terminarTrimestre = terminarTrimestre;
terminarTrimestre = function () {
  const eventosPre = [];
  if (S.decisionInicial === "ministroEco") elegirMinistroEco("politico");
  expedientesSinResolver();
  // Efecto del ministro de Economía y del gabinete
  const f = 1 / 3, cierre = finDeTrimestre();
  if (S.ministroEco) { S.ind.inflacion += S.ministroEco.inflacion * 0.6 * f; S.ind.crecimiento += S.ministroEco.crecimiento * 0.6 * f; }
  const seg = S.gabinete.find(m => m.cargo === "Seguridad"); if (seg) S.ind.inseguridad -= (seg.comp - 5) * 0.4 * f;
  const des = S.gabinete.find(m => m.cargo === "Desarrollo Social"); if (des) S.ind.tension -= (des.comp - 5) * 0.4 * f;
  const int = S.gabinete.find(m => m.cargo === "Interior"); if (int) moverGobernadores((int.comp - 5) * 1.2 * f);
  const trimActual = S.trimestre;
  const ev = _terminarTrimestre();
  if (S.perdio) return ev;
  derivaActores();
  const reacc = cierre ? reaccionesActores() : [];
  // las consecuencias se procesan para el trimestre que empieza
  const dif = procesarDiferidos();
  if (cierre && [3, 7, 11, 15].includes(trimActual)) eventosPre.push(presupuestoAnual());
  if (cierre) { const g = desgasteGabinete(); if (g) eventosPre.push(g); }
  if (cierre && S.delegacion > 0) { S.delegacion--; if (S.delegacion === 0) log("Vencen las facultades delegadas.", "aviso"); }
  if (S.vice) S.vice.lealtad = R.clamp(S.vice.lealtad + (S.ind.imagen - 45) / 10 * f, 0, 100);
  for (const k of ["imagen", "legitimidad", "tension", "inseguridad"]) S.ind[k] = R.clamp(S.ind[k], 0, 100);
  S.ind.reservas = Math.max(0, S.ind.reservas);
  if (!S.terminoMandato) generarExpedientes();
  return [...ev, ...eventosPre, ...reacc, ...dif];
};
