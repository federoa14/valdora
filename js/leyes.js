// =============================================================
//  VALDORA - Motor legislativo
//  Trámite completo de un proyecto de ley: cámara de origen,
//  comisiones y dictamen, votación por bloque (ideología,
//  intereses, relación, gobernadores, disciplina), mayorías
//  especiales, cámara revisora, veto e insistencia, y control
//  judicial. Funciona para los cuatro cargos:
//   - presidente: Congreso bicameral, vos promulgás o vetás
//   - diputado/jefe de bloque: el presidente es otro y puede vetar
//   - gobernador / intendente: Legislatura o Concejo unicameral
// =============================================================

const GRUPO_IDEO = Object.fromEntries(GRUPOS.map(g => [g.id, g.ideo]));
const DISC_BASE = { MNJ: 0.8, UR: 0.6, FC: 0.75, LY: 0.85, FT: 0.98, PROV: 0.5, NUEVO: 0.85 };
const CADUCIDAD_MESES = 24; // estado parlamentario: dos años

function estadoLeyes() {
  if (!S.leyes) S.leyes = { tram: [], sanc: [], vet: [], rech: [], jud: [], temp: [], mes: 0, n: 0, hist: [] };
  return S.leyes;
}

// ---------- Contexto: qué cuerpo vota según el cargo ----------
function senadoDerivado(cam) {
  // el Senado sobrerrepresenta a las provincias chicas: más peso a los provinciales y al partido territorial
  const peso = { MNJ: 1.15, PROV: 1.5, FT: 0.3, LY: 0.8, UR: 1.1, FC: 0.9 };
  const w = {}; let tot = 0;
  for (const k in cam) { w[k] = cam[k] * (peso[k] || 1); tot += w[k]; }
  const sen = {}; let suma = 0;
  for (const k in w) { sen[k] = Math.round(w[k] / tot * 72); suma += sen[k]; }
  const mayor = Object.keys(sen).sort((a, b) => sen[b] - sen[a])[0];
  sen[mayor] += 72 - suma;
  return sen;
}

// Para un senador: Diputados se arma al revés, con la Cámara de 257 que acompaña al Senado
function diputadosDerivado(sen) {
  const peso = { MNJ: 1.15, PROV: 1.5, FT: 0.3, LY: 0.8, UR: 1.1, FC: 0.9 };
  const w = {}; let tot = 0;
  for (const k in sen) { w[k] = sen[k] / (peso[k] || 1); tot += w[k]; }
  const dip = {}; let suma = 0;
  for (const k in w) { dip[k] = Math.round(w[k] / tot * 257); suma += dip[k]; }
  const mayor = Object.keys(dip).sort((a, b) => dip[b] - dip[a])[0];
  dip[mayor] += 257 - suma;
  return dip;
}

function ctxLey() {
  const yo = S.jugador;
  if (typeof esLegislador === "function" && esLegislador()) {
    const esSen = camLeg().sen;
    if (esSen && !S.dipLeg) S.dipLeg = diputadosDerivado(S.cam);
    if (!esSen && !S.senLeg) S.senLeg = senadoDerivado(S.cam);
    return { modo: "leg", bicameral: true, propia: esSen ? "sen" : "dip", dip: esSen ? S.dipLeg : S.cam, sen: esSen ? S.cam : S.senLeg, tot: { dip: 257, sen: 72 }, ofi: S.presNac.partido, yo: yo.partido,
      rel: k => k === yo.partido ? 70 : (S.relBloques[k] || 0) - (k === S.presNac.partido && !S.oficialismo ? 10 : 0),
      disc: k => k === yo.partido ? S.leg2.disciplina / 100 : (DISC_BASE[k] || 0.7) };
  }
  if (typeof esLocal === "function" && esLocal()) {
    const gob = S.cfg.objetivo === "gobernador";
    return { modo: "local", bicameral: false, dip: S.leg, tot: { dip: S.legTotal }, ofi: yo.partido, yo: yo.partido, cuerpo: gob ? "leg" : "concejo",
      rel: k => S.legRel[k] || 0, disc: k => k === "PROV" ? 0.5 : 0.8 };
  }
  return { modo: "nac", bicameral: true, dip: S.dip, sen: S.sen, tot: { dip: 257, sen: 72 }, ofi: yo.partido, yo: yo.partido,
    rel: k => S.bloques[k] ? S.bloques[k].relacion : 0, disc: k => S.bloques[k] ? S.bloques[k].disciplina : 0.7 };
}

function nombreCuerpo(c, ctx) {
  if (c === "dip") return ctx && ctx.modo === "local" ? (ctx.cuerpo === "leg" ? "Legislatura" : "Concejo Deliberante") : "Diputados";
  return "Senado";
}

// ---------- Cómo piensa cada bloque ----------
// Devuelve la probabilidad de que el bloque k vote a favor (modelo logístico)
function probBloqueLey(k, ley, ctx, extra = 0, insistencia = false) {
  const P = PARTIDOS[k] || { ideo: 50 };
  if (k === "FT") return ley.ideo < 32 ? 0.75 : ley.ideo < 45 && ley.pop > 3 ? 0.35 : 0.03;
  const dist = Math.abs(ley.ideo - P.ideo);
  const autor = ley.autor;
  let z = 1.7 * (1 - dist / 32);
  z += (ley.pop || 0) / 7;
  z += ctx.rel(k) / 70 * (autor === ctx.yo ? 1 : -0.3);
  // intereses: cada bloque defiende a los grupos sociales que representa
  let gi = 0;
  for (const g in (ley.grupos || {})) gi += ley.grupos[g] * R.clamp(1 - Math.abs((GRUPO_IDEO[g] || 50) - P.ideo) / 35, -0.5, 1);
  z += gi * 4;
  // quién lo firma pesa
  if (k === autor) z += 2.4 - Math.max(0, dist - 18) / 12; // ni el propio bloque acompaña cualquier cosa
  else if (autor === ctx.ofi && k !== ctx.ofi) z -= 0.45; // la oposición no regala triunfos al gobierno
  if (k === ctx.ofi && autor !== ctx.ofi) z -= insistencia ? 2.2 : 0.9; // el oficialismo frena lo ajeno
  if (ctx.modo === "leg" && autor === ctx.yo && k !== ctx.yo) z -= 0.25; // nadie regala votos a un jefe de bloque rival
  // costo fiscal: los bloques de derecha castigan el gasto sin financiamiento
  if (ley.costo > 0) z -= ley.costo * (P.ideo - 35) / 12;
  // gobernadores: los diputados responden a su provincia
  if (ctx.modo === "nac" && S.gobernadores) {
    const gs = Object.values(S.gobernadores).filter(g => g.partido === k);
    if (gs.length) z += (gs.reduce((a, g) => a + g.relacion, 0) / gs.length) / 120 * (autor === ctx.yo ? 1 : -0.5) + (ley.gob || 0) / 12;
  } else if (ley.gob) z += ley.gob / (k === "PROV" ? 6 : 15);
  if (ley.fondosGob) z += k === "PROV" ? 1.2 : k === "MNJ" ? 0.5 : 0.2;
  if (ley.delegacion && k !== ctx.ofi) z -= 0.6;
  if (ley.revision) z += 0.25;
  if (k === "PROV") z += 0.3;
  z += extra / 35;
  return R.clamp(1 / (1 + Math.exp(-z)), 0.01, 0.99);
}

// mayoría que exige la Constitución según la materia
function mayoriaLey(ley) {
  const m = ley.materia;
  if (ley.mayoria === "dosTercios" || m === "constitucional" || m === "tratadoDDHH") return { tipo: "dosTercios", txt: m === "constitucional" ? "dos tercios de los miembros (art. 30)" : m === "tratadoDDHH" ? "dos tercios de los miembros (art. 75 inc. 22)" : "dos tercios de los miembros" };
  if (ley.mayoria === "absoluta" || ["electoral", "magistratura", "integracion", "coparticipacion"].includes(m)) {
    const art = { electoral: "art. 77", magistratura: "art. 114", integracion: "art. 75 inc. 24", coparticipacion: "art. 75 inc. 2" }[m];
    return { tipo: "absoluta", txt: `mayoría absoluta del total de miembros${art ? " (" + art + ")" : ""}` };
  }
  return { tipo: "simple", txt: "mayoría simple de los presentes" };
}

function camaraOrigen(ley, ctx) {
  if (!ctx.bicameral) return { c: "dip", txt: "" };
  if (ley.materia === "tributaria") return { c: "dip", txt: "Las leyes de impuestos empiezan en Diputados (art. 52)." };
  if (ley.materia === "coparticipacion") return { c: "sen", txt: "La coparticipación empieza en el Senado (art. 75 inc. 2)." };
  if (ctx.modo === "leg") return ctx.propia === "sen" ? { c: "sen", txt: "Lo presentás en el Senado." } : { c: "dip", txt: "Lo presentás en Diputados." };
  if (["tratado", "tratadoDDHH", "integracion"].includes(ley.materia)) return { c: "sen", txt: "Los tratados suelen entrar por el Senado." };
  return { c: "dip", txt: "Entra por Diputados." };
}

// ---------- Votación en una cámara ----------
function votarCuerpoLey(c, ley, ctx, opt = {}) {
  const bancas = c === "dip" ? ctx.dip : ctx.sen;
  const total = ctx.tot[c];
  let si = 0, no = 0, aus = 0;
  const detalle = [];
  for (const k in bancas) {
    const n = bancas[k]; if (!n) continue;
    let p = probBloqueLey(k, ley, ctx, opt.extra || 0, opt.insistencia);
    if (opt.forzarYo && k === ctx.yo) p = 0.99;
    const disc = ctx.disc(k);
    const postura = (opt.rnd || Math.random)() < p;
    const siguen = Math.round(n * (disc + (1 - disc) * 0.5));
    const resto = n - siguen;
    const rSi = Math.round(resto * p), rAus = Math.round((resto - rSi) * 0.35);
    const bSi = (postura ? siguen : 0) + rSi;
    const bAus = rAus + (postura ? 0 : Math.round(siguen * 0.08));
    const bNo = n - bSi - bAus;
    si += bSi; no += bNo; aus += bAus;
    detalle.push({ bloque: k, si: bSi, no: bNo, aus: bAus });
  }
  const presentes = si + no;
  const quorum = presentes > total / 2;
  const may = opt.dosTercios ? { tipo: "dosTercios" } : opt.mayoria || mayoriaLey(ley);
  let necesario;
  if (may.tipo === "dosTercios") necesario = opt.dosTercios === "presentes" ? Math.ceil(presentes * 2 / 3) : Math.ceil(total * 2 / 3);
  else if (may.tipo === "absoluta") necesario = Math.floor(total / 2) + 1;
  else necesario = Math.floor(presentes / 2) + 1;
  const camara = ctx.modo === "local" ? ctx.cuerpo : c;
  return { camara, si, no, aus, quorum, necesario, aprobado: quorum && si >= necesario, detalle, etiqueta: opt.etiqueta };
}

// probabilidad estimada de aprobar (simulación rápida, no consume el azar de la partida)
function chanceCamara(c, ley, ctx, opt = {}, n = 120) {
  let ok = 0;
  for (let i = 0; i < n; i++) if (votarCuerpoLey(c, ley, ctx, { ...opt, rnd: Math.random }).aprobado) ok++;
  return ok / n;
}

function pDictamen(ley, ctx, c) {
  // las comisiones firman dictamen si el proyecto tiene votos y si su autor controla las presidencias
  const ch = chanceCamara(c, ley, ctx, { extra: ley.extra || 0 }, 60);
  const bancas = c === "dip" ? ctx.dip : ctx.sen;
  const peso = (bancas[ley.autor] || 0) / ctx.tot[c];
  let p = 0.02 + ch * 0.18 + peso * 0.3 + (ley.autor === ctx.ofi ? 0.06 : 0) + (ley.urgencia ? 0.06 : 0);
  if (ctx.modo === "leg") p += (S.comisionPres ? 0.05 : 0) + S.leg2.influencia / 1500;
  if (ley.autor !== ctx.ofi && ctx.modo !== "leg") p -= 0.1;
  return R.clamp(p, 0.02, 0.6);
}

// ---------- Ficha y pronóstico ----------
function preverLey(ley) {
  const ctx = ctxLey();
  const org = camaraOrigen(ley, ctx);
  const may = mayoriaLey(ley);
  const camaras = ctx.bicameral ? [org.c, org.c === "dip" ? "sen" : "dip"] : ["dip"];
  const porCamara = camaras.map(c => {
    const bancas = c === "dip" ? ctx.dip : ctx.sen;
    const bloques = Object.keys(bancas).filter(k => bancas[k] > 0).map(k => ({ k, n: bancas[k], p: probBloqueLey(k, ley, ctx, ley.extra || 0) }));
    const esperados = Math.round(bloques.reduce((a, b) => a + b.n * b.p, 0));
    return { c, nombre: nombreCuerpo(c, ctx), bloques, esperados, total: ctx.tot[c], chance: chanceCamara(c, ley, ctx, { extra: ley.extra || 0 }) };
  });
  const ganadores = [], perdedores = [];
  for (const g in (ley.grupos || {})) { const nm = (GRUPOS.find(x => x.id === g) || { nombre: g }).nombre; (ley.grupos[g] > 0 ? ganadores : perdedores).push(nm); }
  for (const a in (ley.act || {})) { const A = (typeof ACTORES !== "undefined" ? ACTORES : []).find(x => x.id === a); if (A) (ley.act[a] > 0 ? ganadores : perdedores).push(A.nombre); }
  let veto = 0;
  if (ctx.modo === "leg" && ley.autor !== S.presNac.partido) veto = probVetoIA(ley);
  const chanceTotal = porCamara.reduce((a, x) => a * x.chance, 1) * pDictamen(ley, ctx, org.c) * (1 - veto * 0.7);
  return { ctx, origen: org, mayoria: may, porCamara, ganadores, perdedores, veto, chanceTotal, riesgoJud: ley.judicial || 0 };
}

// ---------- Redactor: arma un proyecto propio a partir de una base ----------
function catalogoSegunCargo() {
  if (typeof esLocal === "function" && esLocal()) return S.cfg.objetivo === "gobernador" ? LEYES_PROVINCIALES : ORDENANZAS;
  return LEYES_CATALOGO;
}

function redactarLey(baseId, op = {}) {
  const base = catalogoSegunCargo().find(x => x.id === baseId);
  if (!base) return null;
  const ley = JSON.parse(JSON.stringify(base));
  const local = base.escala !== "nacional";
  ley.baseId = base.id; ley.autor = S.jugador.partido; ley.propia = true;
  ley.clausulas = [];
  let f = 1;
  // intensidad: cuánto se anima el proyecto
  if (op.intensidad === "suave") { f *= 0.6; ley.ideo = 50 + (ley.ideo - 50) * 0.6; ley.pop += 1; ley.costo *= 0.6; }
  if (op.intensidad === "fuerte") { f *= 1.6; ley.ideo = R.clamp(50 + (ley.ideo - 50) * 1.3, 0, 100); ley.pop -= 1.5; ley.costo *= 1.6; ley.judicial += 0.05; }
  // alcance territorial
  if (op.alcance === "adhesion") { f *= 0.65; ley.gob = (ley.gob || 0) + 4; ley.pop += 0.5; ley.clausulas.push("Rige en las provincias que adhieran"); }
  if (op.alcance === "piloto") { f *= 0.35; ley.costo *= 0.35; ley.pop += 1; ley.judicial *= 0.5; ley.clausulas.push("Prueba piloto en tres distritos por dos años"); }
  // financiamiento del costo
  const costo = local ? -(ley.ef.caja || 0) : (ley.costo || 0) + Math.max(0, ley.ef.deficit || 0);
  if (costo > 0 && op.fin && op.fin !== "rentas") {
    if (op.fin === "impuesto") {
      if (local) { ley.ef.caja = 0; } else { ley.costo = 0; ley.ef.deficit = Math.min(0, ley.ef.deficit || 0); }
      if (ley.materia === "comun") ley.materia = "tributaria";
      ley.pop -= 2; ley.grupos.empresarios = (ley.grupos.empresarios || 0) - 0.1; ley.grupos.media = (ley.grupos.media || 0) - 0.05; ley.ideo -= 6;
      ley.clausulas.push("Se financia con un impuesto específico");
    } else if (op.fin === "deuda") {
      if (local) { ley.ef.caja = 0; ley.ef.deuda = (ley.ef.deuda || 0) + costo * 0.8; } else { ley.ef.deuda = (ley.ef.deuda || 0) + costo * 3; ley.costo *= 0.3; ley.ef.deficit = (ley.ef.deficit || 0) * 0.3; }
      ley.clausulas.push("Se financia con endeudamiento");
    } else if (op.fin === "recorte") {
      if (local) { ley.ef.caja = 0; ley.ef.servicios = (ley.ef.servicios || 0) - 1.5; } else { ley.costo = 0; ley.ef.deficit = Math.min(0, ley.ef.deficit || 0); }
      ley.grupos.estatales = (ley.grupos.estatales || 0) - 0.15; ley.ef.tension = (ley.ef.tension || 0) + 2; ley.ideo += 6;
      ley.clausulas.push("Se financia recortando otras partidas");
    }
  }
  // cláusulas
  const cl = op.clausulas || [];
  if (cl.includes("fondosProv")) { ley.fondosGob = true; ley.gob = (ley.gob || 0) + 6; if (local) ley.ef.caja = (ley.ef.caja || 0) - 2; else ley.costo += 0.08; ley.clausulas.push("Una parte de los fondos va a las provincias"); }
  if (cl.includes("penal")) { if (!["constitucional", "electoral", "tributaria"].includes(ley.materia)) ley.materia = "penal"; ley.ideo += 5; ley.judicial += 0.04; ley.pop += 0.5; ley.ef.inseguridad = (ley.ef.inseguridad || 0) - 0.3; ley.clausulas.push("Agrega sanciones penales a quien la incumpla"); }
  if (cl.includes("delegacion")) { ley.delegacion = true; ley.judicial += 0.08; ley.ef.legitimidad = (ley.ef.legitimidad || 0) - 1; f *= 1.15; ley.clausulas.push("Delega en el Ejecutivo la reglamentación amplia"); }
  if (cl.includes("revision")) { ley.revision = true; ley.judicial = Math.max(0, ley.judicial - 0.03); f *= 0.9; ley.clausulas.push("Cláusula de revisión a los dos años"); }
  if (cl.includes("compensacion")) {
    for (const g in ley.grupos) if (ley.grupos[g] < 0) ley.grupos[g] *= 0.5;
    if (local) ley.ef.caja = (ley.ef.caja || 0) - 2; else ley.costo += 0.1;
    ley.pop += 1; ley.clausulas.push("Compensa a los sectores perjudicados");
  }
  if (op.vigencia === "emergencia") { ley.temporal = 24; ley.judicial = Math.max(0, ley.judicial - 0.02); ley.pop += 0.5; ley.clausulas.push("Rige por dos años como emergencia"); }
  // aplicar la intensidad a los efectos
  for (const k in ley.ef) ley.ef[k] *= f;
  for (const g in ley.grupos) ley.grupos[g] *= Math.sqrt(f);
  for (const a in ley.act) ley.act[a] = Math.round(ley.act[a] * Math.sqrt(f));
  ley.ideo = Math.round(R.clamp(ley.ideo, 0, 100));
  ley.pop = Math.round(R.clamp(ley.pop, -10, 10) * 10) / 10;
  ley.judicial = Math.round(R.clamp(ley.judicial, 0, 0.9) * 100) / 100;
  ley.costo = Math.round(ley.costo * 100) / 100;
  if (op.nombre && op.nombre.trim()) ley.nombre = op.nombre.trim().slice(0, 90);
  return ley;
}

// ---------- Presentar un proyecto ----------
function puedePresentarLey() {
  const E = estadoLeyes();
  const ctx = ctxLey();
  if (ctx.modo === "leg" && S.accionesLeg <= 0) return { ok: false, msg: "Ya usaste las acciones de este mes." };
  if (ctx.modo === "leg" && E.tram.filter(l => l.propia).length >= 3) return { ok: false, msg: "Tenés tres proyectos en trámite: las comisiones no te van a dar más lugar." };
  if (ctx.modo === "leg") return { ok: true };
  if (E.mes >= 1) return { ok: false, msg: `Ya enviaste un proyecto este mes. ${ctx.modo === "local" ? (ctx.cuerpo === "leg" ? "La Legislatura" : "El Concejo") : "El Congreso"} no trata más de uno tuyo por mes.` };
  if (E.tram.filter(l => l.propia).length >= 4) return { ok: false, msg: "Tenés cuatro proyectos en trámite. Destrabá alguno antes de mandar otro." };
  return { ok: true };
}

function presentarLey(ley, neg = {}) {
  const chk = puedePresentarLey();
  if (!chk.ok) return { msg: chk.msg, tipo: "aviso", pasos: [] };
  const ctx = ctxLey(), E = estadoLeyes(), yo = S.jugador;
  if (E.tram.some(l => l.propia && l.baseId === ley.baseId)) return { msg: "Ya tenés un proyecto parecido en trámite.", tipo: "aviso", pasos: [] };
  if (ctx.modo === "leg") S.accionesLeg--; else E.mes++;
  ley.uid = ++E.n; ley.desde = S.mes; ley.extra = 0; ley.estado = "comision";
  const notas = [];
  // negociación previa
  if (neg.fondos) {
    if (ctx.modo === "nac") { S.ind.deficit += 0.15; Object.values(S.gobernadores).forEach(g => g.relacion = R.clamp(g.relacion + 8, -100, 100)); }
    else if (ctx.modo === "leg") { if (S.leg2.recursos < 1) return { msg: "No tenés favores para repartir.", tipo: "aviso", pasos: [] }; aplicarLeg({ recursos: -1 }); }
    else S.ind.caja -= 4;
    ley.extra += 18; notas.push("Prometiste obras y fondos a cambio de votos.");
  }
  if (neg.concesiones) {
    ley.ideo = Math.round(50 + (ley.ideo - 50) * 0.7);
    for (const k in ley.ef) ley.ef[k] *= 0.75;
    ley.extra += 6; notas.push("Aceptaste cambios de la oposición: el proyecto sale más moderado.");
  }
  if (ctx.modo === "nac" && neg.urgencia) { ley.urgencia = true; notas.push("Pediste tratamiento preferencial."); }
  const org = camaraOrigen(ley, ctx);
  ley.camara = org.c;
  E.tram.push(ley);
  log(`Presentaste el proyecto "${ley.nombre}".`, "info");
  // primer intento de dictamen inmediato
  const r = avanzarLey(ley, true);
  return { msg: [`Presentaste "${ley.nombre}". ${org.txt}`, ...notas, r.msg].filter(Boolean).join(" "), pasos: r.pasos, tipo: r.tipo };
}

// Un paso del trámite: comisión → recinto origen → revisora → Ejecutivo
function avanzarLey(ley, primera = false, sobreTablas = false) {
  const ctx = ctxLey(), E = estadoLeyes();
  const pasos = [];
  if (!sobreTablas) {
    const p = primera ? pDictamen(ley, ctx, ley.camara) * 0.5 : pDictamen(ley, ctx, ley.camara);
    const ok = R.rand() < p;
    pasos.push({ tipo: "comision", ok, texto: ok ? `Las comisiones de ${nombreCuerpo(ley.camara, ctx)} firmaron dictamen de mayoría.` : `El proyecto quedó en comisión: no consiguió las firmas para el dictamen (chance estimada ${Math.round(p * 100)}%).` });
    if (!ok) return { msg: primera ? "Por ahora no tiene dictamen; cada mes puede destrabarse." : "", pasos, tipo: "info", sigue: true };
  }
  return votarTramite(ley, ctx, pasos, sobreTablas);
}

function votarTramite(ley, ctx, pasos, sobreTablas) {
  const E = estadoLeyes();
  const extra = ley.extra || 0;
  const optOrigen = sobreTablas ? { extra, dosTercios: "presentes", etiqueta: "sobre tablas" } : { extra };
  const v1 = votarCuerpoLey(ley.camara, ley, ctx, optOrigen);
  pasos.push(v1);
  if (!v1.aprobado) return cerrarLey(ley, "rech", pasos, `${nombreCuerpo(ley.camara, ctx)} lo rechazó${v1.quorum ? "" : " (no hubo quórum)"}.`);
  if (ctx.bicameral) {
    const rev = ley.camara === "dip" ? "sen" : "dip";
    const v2 = votarCuerpoLey(rev, ley, ctx, { extra });
    pasos.push(v2);
    if (!v2.aprobado) {
      // la revisora puede modificarlo en lugar de rechazarlo, si estuvo cerca
      if (v2.quorum && v2.si >= v2.necesario * 0.85 && R.rand() < 0.6) {
        for (const k in ley.ef) ley.ef[k] *= 0.8;
        ley.ideo = Math.round(50 + (ley.ideo - 50) * 0.85);
        const v3 = votarCuerpoLey(ley.camara, ley, ctx, { extra: extra + 10 });
        pasos.push(v3);
        if (!v3.aprobado) return cerrarLey(ley, "rech", pasos, `${nombreCuerpo(rev, ctx)} lo modificó y la cámara de origen no aceptó los cambios.`);
        return promulgacion(ley, ctx, pasos, `${nombreCuerpo(rev, ctx)} lo aprobó con modificaciones y la cámara de origen las aceptó.`);
      }
      return cerrarLey(ley, "rech", pasos, `Media sanción en ${nombreCuerpo(ley.camara, ctx)}, pero ${nombreCuerpo(rev, ctx)} lo rechazó.`);
    }
  }
  return promulgacion(ley, ctx, pasos, ctx.bicameral ? "Sanción definitiva en las dos cámaras." : `${nombreCuerpo("dip", ctx)} lo sancionó.`);
}

function cerrarLey(ley, destino, pasos, texto) {
  const E = estadoLeyes();
  E.tram = E.tram.filter(x => x !== ley);
  ley.estado = destino; ley.hasta = S.mes;
  E[destino].push(ley);
  if (ley.propia) {
    if (esLegislador()) aplicarLeg({ influencia: destino === "rech" ? -2 : 0 });
    else if (S.ind) S.ind.imagen -= destino === "rech" ? 1 : 0;
  }
  log(`"${ley.nombre}": ${texto}`, ley.propia ? "malo" : "info");
  return { msg: texto, pasos, tipo: ley.propia ? "malo" : "info" };
}

// ---------- Veto ----------
function probVetoIA(ley) {
  const pres = PARTIDOS[S.presNac.partido];
  const d = Math.abs(ley.ideo - pres.ideo);
  return R.clamp((d - 14) / 40 + Math.max(0, ley.costo) * 0.6 - (ley.pop > 4 ? 0.15 : 0), 0, 0.9);
}

function promulgacion(ley, ctx, pasos, texto) {
  // presidente o jefe del Ejecutivo local: es el jugador. Si es su ley, promulga.
  if (ctx.modo === "nac" || ctx.modo === "local") {
    if (ley.autor === S.jugador.partido || ley.propia) return sancionar(ley, pasos, texto + " La promulgaste.");
    // ley ajena: el jugador decide
    const E = estadoLeyes();
    E.tram = E.tram.filter(x => x !== ley);
    E.vetoPend = ley; ley.estado = "veto";
    return { msg: texto, pasos, tipo: "aviso", decision: "vetoLey" };
  }
  // diputado: el presidente es otro y puede vetar (art. 83)
  if (ley.autor !== S.presNac.partido && R.rand() < probVetoIA(ley)) {
    const parcial = R.rand() < 0.4;
    if (parcial) {
      for (const k in ley.ef) ley.ef[k] *= 0.5;
      pasos.push({ tipo: "nota", titulo: "Veto parcial", ok: false, texto: "El presidente vetó parcialmente la ley: observó los artículos centrales y promulgó el resto." });
      return sancionar(ley, pasos, texto + " Veto parcial del Ejecutivo.");
    }
    pasos.push({ tipo: "nota", titulo: "Veto total", ok: false, texto: "El presidente vetó la ley en su totalidad (art. 83). El Congreso puede insistir con dos tercios en ambas cámaras." });
    const d = votarCuerpoLey("dip", ley, ctx, { dosTercios: "presentes", insistencia: true, extra: (ley.extra || 0) + 5 });
    pasos.push(d);
    const s = d.aprobado ? votarCuerpoLey("sen", ley, ctx, { dosTercios: "presentes", insistencia: true, extra: (ley.extra || 0) + 5 }) : null;
    if (s) pasos.push(s);
    if (d.aprobado && s.aprobado) { if (ley.propia) aplicarLeg({ influencia: 6, imagen: 3, relPres: -10 }); return sancionar(ley, pasos, texto + " El presidente la vetó, pero el Congreso insistió con dos tercios."); }
    if (ley.propia) aplicarLeg({ relPres: -6 });
    return cerrarLey(ley, "vet", pasos, texto + " El presidente la vetó y no se juntaron los dos tercios para insistir.");
  }
  return sancionar(ley, pasos, texto + " El presidente la promulgó.");
}

function sancionar(ley, pasos, texto) {
  const E = estadoLeyes(), ctx = ctxLey();
  E.tram = E.tram.filter(x => x !== ley);
  ley.estado = "sanc"; ley.hasta = S.mes;
  E.sanc.push(ley);
  aplicarLeyEfectos(ley, 1);
  if (ley.temporal) E.temp.push({ uid: ley.uid, t: S.mes + ley.temporal });
  // control judicial: alguien la impugna y la Corte decide meses después
  if (ley.judicial > 0 && R.rand() < Math.min(0.9, ley.judicial * 2.2)) E.jud.push({ uid: ley.uid, t: S.mes + 3 + Math.floor(R.rand() * 6) });
  log(`Es ley: "${ley.nombre}".`, ley.propia ? "bueno" : "info");
  return { msg: texto, pasos, tipo: ley.propia ? "bueno" : "info" };
}

function aplicarLeyEfectos(ley, fac) {
  const ctx = ctxLey();
  const dec = 1 / (1 + estadoLeyes().sanc.filter(l => l.propia).length / 5); // cada ley nueva rinde menos políticamente
  if (ctx.modo === "nac") {
    aplicarEfectos(ley.ef, ley.grupos, fac);
    S.ind.deficit += (ley.costo || 0) * fac;
    if (typeof moverActor === "function") for (const a in (ley.act || {})) moverActor(a, ley.act[a] * fac);
    if (ley.gob) Object.values(S.gobernadores).forEach(g => g.relacion = R.clamp(g.relacion + ley.gob * fac, -100, 100));
    if (fac > 0) {
      if (ley.limitaDNU) S.limitaDNU = true;
      if (ley.delegacion && ley.baseId === "delegacion2") S.delegacion = 4;
      if (ley.efectoCorte && S.corte) { S.corte.miembros = 9; S.corte.afines += ley.autor === S.jugador.partido ? 4 : 0; }
      if (ley.reeleccion) S.reeleccionHabilitada = true;
    }
    if (ley.propia && fac > 0) S.ind.imagen += Math.max(-3, Math.min(3, ley.pop / 3)) * dec;
  } else if (ctx.modo === "local") {
    aplicarLocal(Object.fromEntries(Object.entries(ley.ef).map(([k, v]) => [k, v * fac])));
    if (ley.propia && fac > 0) S.ind.imagen += Math.max(-3, Math.min(3, ley.pop / 3)) * dec;
  } else {
    // diputado: lo que gana es poder y prestigio
    if (fac > 0 && ley.propia) {
      S.leg2.leyesPropias++;
      aplicarLeg({ influencia: 4 * dec, imagen: Math.max(-3, Math.min(4, ley.pop * 0.4 + 0.5)) * dec, disciplina: 2 });
      for (const k in S.relBloques) S.relBloques[k] = R.clamp(S.relBloques[k] + 2, -60, 80);
    }
    if (fac < 0 && ley.propia) aplicarLeg({ influencia: -4, imagen: -2 });
    if (S.presNac) S.presNac.imagen = R.clamp(S.presNac.imagen + (ley.autor === S.presNac.partido ? 1 : -0.5) * fac * Math.sign(ley.pop || 1), 10, 80);
  }
}

// El jugador como Ejecutivo decide sobre una ley ajena
function resolverVetoLey(op) {
  const E = estadoLeyes(), ctx = ctxLey();
  const ley = E.vetoPend; E.vetoPend = null;
  if (!ley) return { msg: "" };
  if (op === "promulgar") {
    const r = sancionar(ley, [], `Promulgaste "${ley.nombre}".`);
    if (ctx.modo === "nac") for (const k in S.bloques) if (k !== S.jugador.partido) S.bloques[k].relacion += 3;
    return r;
  }
  if (op === "parcial") {
    for (const k in ley.ef) ley.ef[k] *= 0.5;
    ley.costo = (ley.costo || 0) * 0.4;
    const r = sancionar(ley, [], `Vetaste parcialmente "${ley.nombre}": observaste el financiamiento y los artículos más costosos, y promulgaste el resto (art. 80).`);
    if (S.ind) S.ind.legitimidad -= 1;
    return r;
  }
  // veto total: insistencia con dos tercios
  const pasos = [];
  const extra = -5 + (ley.pop > 3 ? 10 : 0);
  const d = votarCuerpoLey("dip", ley, ctx, { dosTercios: "presentes", insistencia: true, extra });
  pasos.push(d);
  let s = { aprobado: true };
  if (ctx.bicameral && d.aprobado) { s = votarCuerpoLey("sen", ley, ctx, { dosTercios: "presentes", insistencia: true, extra }); pasos.push(s); }
  if (d.aprobado && s.aprobado) {
    S.ind.legitimidad -= 4; S.ind.imagen -= 3;
    const r = sancionar(ley, pasos, `Vetaste "${ley.nombre}", pero ${ctx.modo === "local" ? (ctx.cuerpo === "leg" ? "la Legislatura" : "el Concejo") : "el Congreso"} insistió con dos tercios. Derrota política.`);
    return r;
  }
  S.ind.imagen -= ley.pop > 3 ? 3 : ley.pop > 0 ? 1 : 0;
  if (ctx.modo === "nac") for (const k in S.bloques) if (k !== S.jugador.partido) S.bloques[k].relacion -= 3;
  return { ...cerrarLey(ley, "vet", pasos, `Vetaste "${ley.nombre}". La oposición no juntó los dos tercios para insistir.`), tipo: "info" };
}

// sesión especial / sobre tablas: trata sin dictamen con dos tercios
function tratarSobreTablas(uid) {
  const E = estadoLeyes(), ctx = ctxLey();
  const ley = E.tram.find(l => l.uid === uid);
  if (!ley) return { msg: "", pasos: [] };
  if (ctx.modo === "leg") { if (S.accionesLeg <= 0) return { msg: "Ya usaste las acciones de este mes.", tipo: "aviso", pasos: [] }; S.accionesLeg--; }
  else { if (E.mes >= 1) return { msg: "Ya usaste el turno legislativo de este mes.", tipo: "aviso", pasos: [] }; E.mes++; }
  const r = avanzarLey(ley, false, true);
  return { msg: `Pediste tratarlo sobre tablas, sin dictamen: hacen falta dos tercios. ${r.msg}`, pasos: r.pasos, tipo: r.tipo, decision: r.decision };
}

function retirarLey(uid) {
  const E = estadoLeyes();
  const ley = E.tram.find(l => l.uid === uid);
  if (!ley) return { msg: "" };
  E.tram = E.tram.filter(x => x !== ley);
  return { msg: `Retiraste "${ley.nombre}".`, tipo: "info", pasos: [] };
}

// ---------- Proyectos de los rivales ----------
function elegirRival(cat, ideoJugador) {
  const E = estadoLeyes();
  const usados = new Set([...E.hist.slice(-20), ...E.tram.map(l => l.baseId), ...E.sanc.map(l => l.baseId)]);
  const pos = cat.filter(l => !usados.has(l.id) && Math.abs(l.ideo - ideoJugador) > 18);
  return pos.length ? R.pick(pos) : null;
}

function proyectoRival() {
  const ctx = ctxLey(), E = estadoLeyes();
  const yo = S.jugador;
  if (E.vetoPend) return null;
  const base = elegirRival(catalogoSegunCargo(), PARTIDOS[yo.partido].ideo);
  if (!base) return null;
  const ley = JSON.parse(JSON.stringify(base));
  // lo firma el bloque opositor más cercano a su ideología
  const bancas = ctx.dip;
  const cand = Object.keys(bancas).filter(k => k !== yo.partido && bancas[k] > 0 && PARTIDOS[k]);
  if (!cand.length) return null;
  cand.sort((a, b) => Math.abs(PARTIDOS[a].ideo - ley.ideo) - Math.abs(PARTIDOS[b].ideo - ley.ideo));
  ley.autor = cand[0]; ley.propia = false; ley.baseId = base.id; ley.uid = ++E.n; ley.desde = S.mes; ley.extra = 0;
  ley.camara = camaraOrigen(ley, ctx).c;
  E.hist.push(base.id);
  E.tram.push(ley);
  // los rivales también necesitan dictamen; se trata cuando lo tienen
  const r = avanzarLey(ley, false);
  if (r.sigue) return null; // quedó en comisión: se intenta más adelante
  if (r.decision) return { titulo: `${ctx.modo === "local" ? (ctx.cuerpo === "leg" ? "La Legislatura" : "El Concejo") : "El Congreso"} sancionó una ley de la oposición`, texto: `${ley.nombre} (${PARTIDOS[ley.autor].corto}). ${ley.texto} Podés promulgarla, vetarla en parte o vetarla entera.`, pasos: r.pasos, tipo: "aviso", decision: "vetoLey" };
  return { titulo: "Se cayó un proyecto opositor", texto: `${ley.nombre} (${PARTIDOS[ley.autor].corto}): ${r.msg}`, pasos: r.pasos, tipo: "bueno" };
}

// ---------- Paso mensual ----------
function procesarLeyesMes() {
  const E = estadoLeyes(), ctx = ctxLey(), ev = [];
  E.mes = 0;
  // proyectos en comisión: pueden destrabarse o caducar
  for (const ley of E.tram.slice()) {
    if (ley.estado !== "comision") continue;
    if (S.mes - ley.desde >= CADUCIDAD_MESES) { E.tram = E.tram.filter(x => x !== ley); ley.estado = "caduco"; E.rech.push(ley); if (ley.propia) ev.push({ titulo: "Proyecto caducado", texto: `"${ley.nombre}" perdió estado parlamentario: pasaron dos años sin tratarse.`, tipo: "malo" }); continue; }
    if (R.rand() < (ley.propia ? 0.15 : 0.2)) {
      const r = avanzarLey(ley, false);
      if (r.sigue) continue;
      if (r.decision) ev.push({ titulo: "El Congreso sancionó una ley de la oposición", texto: `${ley.nombre} (${PARTIDOS[ley.autor] ? PARTIDOS[ley.autor].corto : ""}). ${ley.texto}`, pasos: r.pasos, tipo: "aviso", decision: "vetoLey" });
      else if (ley.propia || r.tipo !== "info") ev.push({ titulo: ley.propia ? `Tu proyecto: ${ley.nombre}` : ley.nombre, texto: r.msg, pasos: r.pasos, tipo: r.tipo });
    }
  }
  // fallos judiciales
  for (const j of E.jud.filter(x => x.t <= S.mes)) {
    const ley = E.sanc.find(l => l.uid === j.uid); if (!ley) continue;
    let p = Math.min(0.85, ley.judicial * 1.8);
    if (ctx.modo === "nac" && S.corte) p *= ley.autor === S.jugador.partido ? 1 - S.corte.afines / S.corte.miembros * 0.7 : 1 + S.corte.afines / S.corte.miembros * 0.5;
    if (R.rand() < p) {
      aplicarLeyEfectos(ley, -0.7);
      ley.inconstitucional = true;
      const quien = ctx.modo === "local" ? "El Superior Tribunal" : "La Corte Suprema";
      ev.push({ titulo: "Fallo de inconstitucionalidad", texto: `${quien} declaró inconstitucional "${ley.nombre}" y la dejó sin efecto en sus puntos centrales.`, tipo: ley.propia || ley.autor === S.jugador.partido ? "malo" : "bueno" });
    } else if (ley.propia) ev.push({ titulo: "La ley pasó el control judicial", texto: `Los tribunales rechazaron los planteos contra "${ley.nombre}".`, tipo: "bueno" });
  }
  E.jud = E.jud.filter(x => x.t > S.mes);
  // emergencias que vencen
  for (const t of E.temp.filter(x => x.t <= S.mes)) {
    const ley = E.sanc.find(l => l.uid === t.uid); if (!ley || ley.inconstitucional) continue;
    aplicarLeyEfectos(ley, -0.5);
    ev.push({ titulo: "Vence una ley de emergencia", texto: `"${ley.nombre}" cumplió su plazo y dejó de regir.`, tipo: "info" });
  }
  E.temp = E.temp.filter(x => x.t > S.mes);
  // la oposición impulsa sus propios proyectos
  if (ctx.modo !== "leg") {
    const prob = ctx.modo === "nac" ? 0.3 : 0.22;
    if (R.rand() < prob) { const r = proyectoRival(); if (r) ev.push(r); }
  }
  return ev;
}

// ---------- Rivales en el modo diputado: se suman a la agenda del recinto ----------
if (typeof PROYECTOS_LEG !== "undefined") {
  const ya = new Set(PROYECTOS_LEG.map(p => p.id));
  for (const l of LEYES_CATALOGO) {
    if (ya.has(l.id)) continue;
    PROYECTOS_LEG.push({ id: l.id, nombre: l.nombre, texto: l.texto, ideo: l.ideo, pop: l.pop, origen: l.ideo > 55 || l.costo < 0 ? "ejecutivo" : "oposicion", catalogo: true, materia: l.materia, mayoria: l.mayoria });
  }
}

// ---------- Enganches con el resto del juego ----------
// presidente: el viejo evento de "ley opositora" se reemplaza por el motor
const _terminarTrimestreLey = terminarTrimestre;
terminarTrimestre = function () {
  const guard = S.vetoPendiente;
  S.vetoPendiente = S.vetoPendiente || { nombre: "-", ef: {}, grupos: {} }; // bloquea el evento viejo
  const ev = _terminarTrimestreLey();
  if (!guard) S.vetoPendiente = null;
  if (S.perdio || S.terminoMandato || S.fase !== "gobierno") return ev;
  return [...ev, ...procesarLeyesMes()];
};

if (typeof finTrimestreLocal === "function") {
  const _finLocalLey = finTrimestreLocal;
  finTrimestreLocal = function () {
    const ev = _finLocalLey();
    if (S.perdio || S.terminoMandato) return ev;
    return [...ev, ...procesarLeyesMes()];
  };
}

if (typeof finTrimestreLeg === "function") {
  const _finLegLey = finTrimestreLeg;
  finTrimestreLeg = function () {
    const ev = _finLegLey();
    if (S.perdio || S.terminoMandato) return ev;
    if (camLeg().sen) S.dipLeg = diputadosDerivado(S.cam); // la otra cámara acompaña los cambios de bancas
    else S.senLeg = senadoDerivado(S.cam);
    return [...ev, ...procesarLeyesMes()];
  };
  // los proyectos del catálogo que se votan en el recinto siguen al Senado y al presidente
  const _resolverProyectoLey = resolverProyecto;
  resolverProyecto = function (idx, postura) {
    const pr = S.proyLeg[idx];
    const P = pr && PROYECTOS_LEG.find(x => x.id === pr.id);
    const r = _resolverProyectoLey(idx, postura);
    if (!r || !P || !P.catalogo) return r;
    const v = r.pasos[r.pasos.length - 1];
    if (!v || !v.aprobado) return r;
    const base = LEYES_CATALOGO.find(l => l.id === P.id);
    const ley = JSON.parse(JSON.stringify(base));
    ley.autor = pr.origen === "ejecutivo" ? S.presNac.partido : Object.keys(S.cam).filter(k => k !== S.presNac.partido && PARTIDOS[k]).sort((a, b) => Math.abs(PARTIDOS[a].ideo - ley.ideo) - Math.abs(PARTIDOS[b].ideo - ley.ideo))[0];
    ley.propia = false; ley.baseId = base.id; ley.uid = ++estadoLeyes().n; ley.desde = S.mes; ley.extra = 0;
    const rev = camLeg().sen ? "dip" : "sen", nomRev = rev === "sen" ? "el Senado" : "Diputados";
    ley.camara = rev === "sen" ? "dip" : "sen";
    const ctx = ctxLey();
    const s = votarCuerpoLey(rev, ley, ctx, {});
    r.pasos.push(s);
    if (!s.aprobado) { r.msg += ` ${nomRev[0].toUpperCase() + nomRev.slice(1)} lo rechazó después.`; return r; }
    const fin = promulgacion(ley, ctx, r.pasos, "");
    r.msg += ` Sanción de ${nomRev}.` + fin.msg;
    return r;
  };
}

// partidas guardadas viejas
const _cargarLey = cargar;
cargar = function () { const ok = _cargarLey(); if (ok && S) estadoLeyes(); return ok; };
