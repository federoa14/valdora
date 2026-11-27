// =============================================================
//  VALDORA - Relaciones con el nivel superior y peso legislativo
//
//  1) Intendente y gobernador gestionan ante su superior: el
//     intendente ante la provincia (y, salteando al gobernador,
//     ante la Nación); el gobernador ante la Nación. Obras, fondos,
//     convenios y programas son expedientes que el superior
//     aprueba, condiciona, demora o niega según la afinidad
//     política, el peso propio, la relación, su caja, la tensión
//     social y el calendario electoral. Si el superior es del mismo
//     signo es más fácil, pero después pasa la factura.
//
//  2) Legisladores: peso político propio. Cada proyecto tiene una
//     magnitud (tema menor o de fondo) y exige más o menos
//     negociación según el peso acumulado. El peso se construye
//     sacando leyes y siendo decisivo, y define el rango dentro de
//     la Cámara, las comisiones a las que llegás, cuántas rondas de
//     negociación y acciones tenés por mes y la jefatura del bloque.
// =============================================================

const capRel = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const entre = (a, b) => a + Math.floor(R.rand() * (b - a + 1));

// =============================================================
//  PARTE 1 · Gestiones ante el superior (intendente y gobernador)
// =============================================================

// ante: "sup" = superior directo (provincia para el intendente, Nación para el gobernador); "nac" = la Nación salteando a la provincia
// mag: magnitud del pedido (1 chico a 5 enorme) · demora: meses hasta la respuesta · ini: efectos al aprobarse
// obra: meses de ejecución; fin: efectos al inaugurar · dif: efecto diferido (trimestres)
const TIPOS_GESTION = {
  intendente: [
    { id: "obraProv", ante: "sup", mag: 3, demora: [2, 3], obra: 4, nombre: "Obra provincial en la ciudad", detalle: "Cloacas, desagües o pavimento que licita y paga la provincia.", ini: { desempleo: -0.3 }, fin: { servicios: 6, imagen: 3 }, ok: "La provincia licita la obra: arranca en los barrios en unos días." },
    { id: "fondoMuni", ante: "sup", mag: 2, demora: [1, 2], nombre: "Adelanto del fondo de financiamiento municipal", detalle: "Plata a cuenta de la coparticipación provincial, a devolver.", ini: { caja: 12, deuda: 3 }, ok: "Llega el adelanto: la caja respira, pero queda anotado como deuda." },
    { id: "convenioSeg", ante: "sup", mag: 2, demora: [1, 3], nombre: "Convenio de seguridad con la Policía provincial", detalle: "Más patrulleros, una comisaría nueva y cámaras conectadas.", ini: { inseguridad: -6 }, ok: "Firmaron el convenio: más policías en las calles de la ciudad." },
    { id: "programaSoc", ante: "sup", mag: 2, demora: [1, 2], nombre: "Programa alimentario y social provincial", detalle: "Tarjeta alimentaria, módulos para comedores y operativos de salud.", ini: { pobreza: -2, tension: -5 }, ok: "El programa provincial llega a tus barrios." },
    { id: "emergencia", ante: "sup", mag: 1, demora: [1, 1], cond: () => S.ind.tension >= 50, nombre: "Asistencia de emergencia", detalle: "Solo con tensión social alta: la provincia teme que el conflicto se le contagie.", ini: { caja: 8, tension: -8 }, ok: "La provincia manda asistencia de emergencia y funcionarios para contener el conflicto." },
    { id: "fondosNac", ante: "nac", mag: 2, demora: [2, 3], nombre: "Fondos nacionales directos (salteando a la provincia)", detalle: "Un programa nacional para el municipio. Al gobernador no le gusta que lo saltees.", ini: { caja: 10, servicios: 2 }, ok: "La Nación firma un convenio directo con el municipio." },
  ],
  gobernador: [
    { id: "atn", ante: "sup", mag: 2, demora: [1, 2], nombre: "ATN (Aportes del Tesoro Nacional)", detalle: "Fondos discrecionales del ministerio del Interior.", ini: { caja: 14 }, ok: "El ministerio del Interior firmó el ATN: la plata entra este mes." },
    { id: "obraNac", ante: "sup", mag: 4, demora: [2, 4], obra: 6, nombre: "Obra pública nacional", detalle: "Autovía, acueducto o puente que financia la Nación.", ini: { desempleo: -0.8 }, fin: { servicios: 8, imagen: 4 }, ok: "La Nación licita la obra: obradores y empleo en la provincia." },
    { id: "convenioFed", ante: "sup", mag: 2, demora: [1, 3], nombre: "Fuerzas federales y plan de seguridad", detalle: "Gendarmería y Prefectura en los puntos calientes, con fondos para la policía.", ini: { inseguridad: -7 }, ok: "Llegan las fuerzas federales y el plan conjunto de seguridad." },
    { id: "programaNac", ante: "sup", mag: 3, demora: [2, 3], nombre: "Programa nacional de viviendas e infraestructura social", detalle: "Viviendas, cloacas y salas de salud con fondos nacionales.", ini: { pobreza: -2.5, desempleo: -0.5, tension: -4 }, ok: "La Nación incluye a la provincia en el programa de viviendas." },
    { id: "deudaNac", ante: "sup", mag: 4, demora: [2, 4], nombre: "Refinanciar la deuda provincial con la Nación", detalle: "Estirar los vencimientos con el fondo fiduciario federal.", ini: { deuda: -10, caja: 5 }, ok: "La Nación refinancia la deuda: los vencimientos se estiran años." },
    { id: "adelantoCopa", ante: "sup", mag: 1, demora: [1, 1], nombre: "Adelanto de coparticipación", detalle: "Plata hoy que se descuenta en tres meses.", ini: { caja: 10 }, dif: { en: 1, texto: "Te descuentan el adelanto de coparticipación.", ind: { caja: -11 } }, ok: "Llega el adelanto: se descuenta de los giros del próximo trimestre." },
  ],
};

// condiciones que puede poner el superior
const CONDICIONES_SUP = [
  { id: "alinear", txt: (j) => `que te muestres con ${j} y defiendas su gestión en público`, costo: "Relación en alza; imagen en baja si es de otro signo o si está desgastado." },
  { id: "cofinanciar", txt: () => `que ${esIntendente() ? "el municipio" : "la provincia"} ponga una parte de la plata`, costo: "Te cuesta caja." },
  { id: "adherir", txt: () => `que ${cuerpoLocalRel()} adhiera a una ley suya`, costo: "Hay que conseguir los votos: si no salen, no hay pedido." },
  { id: "cargo", txt: () => "ubicar a un funcionario suyo en tu gabinete", costo: "Legitimidad y riesgo de escándalo." },
  { id: "lista", txt: () => "ir pegado a su boleta en la próxima elección", costo: "Tu suerte electoral queda atada a la suya." },
  { id: "votos", soloGob: true, txt: () => "que tus legisladores nacionales voten su próxima ley clave", costo: "Imagen, sobre todo si sos de otro signo." },
];

// favores que el superior cobra después de ayudarte (más seguido si es de tu mismo signo)
const COBROS_SUP = {
  gobernador: [
    { id: "presupuestoNac", titulo: "La Casa Rosada pide los votos para el Presupuesto", texto: "El ministro del Interior te recuerda lo que te giraron: quiere que tus diputados y senadores nacionales voten el Presupuesto sin cambios.", cumplir: { imagen: -2, legitimidad: -1 } },
    { id: "pactoFiscal", titulo: "Te piden firmar el pacto fiscal", texto: "La Nación quiere que bajes ingresos brutos y congeles los salarios estatales a cambio de lo que ya te dio.", cumplir: { caja: -4, tension: 4 } },
    { id: "candidatoNac", titulo: "Quieren a su candidato en tu lista", texto: "El presidente quiere poner a un hombre suyo en tu lista de diputados nacionales.", cumplir: { legitimidad: -2 }, flag: "pegado" },
    { id: "silencio", titulo: "Que bajes el tono", texto: "Te piden que no critiques en los medios el recorte de transferencias a las provincias.", cumplir: { imagen: -2 } },
  ],
  intendente: [
    { id: "adhesionProv", titulo: "El gobernador pide una adhesión", texto: "Quiere que tu Concejo adhiera a su ley de emergencia en seguridad, con su policía al mando.", cumplir: { legitimidad: -1, inseguridad: -1 } },
    { id: "actoGob", titulo: "Hay que llenar el acto del gobernador", texto: "Te piden micros y militantes para el acto del gobernador en la capital.", cumplir: { caja: -3, imagen: -1 } },
    { id: "boletaGob", titulo: "Ir pegado a la boleta del gobernador", texto: "El gobernador quiere que no desdobles y que vayas en su boleta.", cumplir: {}, flag: "pegado" },
    { id: "funcionarioProv", titulo: "Un funcionario provincial en tu gabinete", texto: "Te piden la secretaría de Obras para un hombre del gobernador.", cumplir: { legitimidad: -2 }, riesgo: 4 },
    { id: "reclamoCopa", titulo: "Que no reclames la deuda de coparticipación", texto: "La provincia te debe giros atrasados y te pide que no lo hagas público.", cumplir: { caja: -4 } },
  ],
};

function esIntendente() { return !!(S && S.cfg && S.cfg.objetivo === "intendente"); }
function cuerpoLocalRel() { return S.cfg.objetivo === "gobernador" ? "la Legislatura" : "el Concejo Deliberante"; }

function asegurarGest() {
  if (!S || typeof esLocal !== "function" || !esLocal() || !S.presidente) return null;
  if (!S.gest) {
    const yo = S.jugador;
    const g = { tram: [], cobros: [], n: 0, ultimo: {}, posturaMes: 0, hist: [] };
    if (esIntendente()) {
      const prov = (typeof provDeCiudad === "function" && provDeCiudad(S.cfg.ciudad || CIUDAD_DEFECTO)) || PROV_DEFECTO;
      const PP = typeof PERFIL_PROV !== "undefined" ? PERFIL_PROV[prov] : null;
      const cand = ["MNJ", "FC", "UR", "LY"].filter(p => PARTIDOS[p]);
      const partido = PP && PP.ofi && PARTIDOS[PP.ofi] && R.rand() < 0.6 ? PP.ofi : R.pick(cand);
      g.gobProv = { prov, nombre: typeof nombreProvId === "function" ? nombreProvId(prov) : prov, partido, relacion: partido === yo.partido ? 35 : -5, imagen: 40 + Math.round(R.rand() * 20), caja: 55, favores: 0, castigo: 0 };
    }
    const P = S.presidente;
    if (P.imagen == null) P.imagen = 40 + Math.round(R.rand() * 20);
    if (P.caja == null) P.caja = 60;
    if (P.favores == null) P.favores = 0;
    if (P.castigo == null) P.castigo = 0;
    S.gest = g;
  }
  return S.gest;
}

// "sup" o "nac" → el objeto del superior (con partido, relacion, imagen, caja, favores, castigo)
function supDe(ante) { const g = asegurarGest(); if (!g) return null; return (ante === "nac" || !esIntendente()) ? S.presidente : g.gobProv; }
function nombreSup(ante) { return (ante === "nac" || !esIntendente()) ? "la Casa Rosada" : `el gobierno de ${S.gest.gobProv.nombre}`; }
function jefeSup(ante) { return (ante === "nac" || !esIntendente()) ? "el presidente" : "el gobernador"; }
function anioElectoral() { const m = ((S.mes || 1) - 1) % 24 + 1; return m >= 18; }
function tipoGestion(id) { for (const k in TIPOS_GESTION) { const t = TIPOS_GESTION[k].find(x => x.id === id); if (t) return t; } return null; }
function tiposGestionCargo() { return TIPOS_GESTION[S.cfg.objetivo] || []; }

// La coparticipación municipal la gira la provincia: para el intendente pesa la relación con el gobernador
P_rel = function () {
  if (esIntendente() && S.gest && S.gest.gobProv) return S.gest.gobProv.relacion;
  return S.presidente ? S.presidente.relacion : 0;
};

// ---------- Peso propio ante el superior ----------
function pesoPropioLocal() {
  const yo = S.jugador, I = S.ind, gob = S.cfg.objetivo === "gobernador";
  const partes = [];
  if (gob) {
    const g = GEO_AR.nacion.provincias.find(p => p.id === (S.cfg.provincia || PROV_DEFECTO));
    partes.push(["Tu provincia: tres senadores y sus diputados", Math.round(8 + Math.min(22, (g ? g.pob : 3) * 1.6))]);
  } else {
    const T = typeof territorioDeCfg === "function" ? territorioDeCfg(S.cfg) : null;
    const prov = GEO_AR.nacion.provincias.find(p => p.id === (S.gest && S.gest.gobProv ? S.gest.gobProv.prov : PROV_DEFECTO));
    const share = (T && T.pobAbs ? T.pobAbs : 0.1) / (prov ? prov.pobAbs : 1.4);
    partes.push(["Votos de tu ciudad en la provincia", Math.round(4 + Math.min(24, share * 60))]);
  }
  partes.push(["Tu imagen en las encuestas", Math.round((I.imagen - 30) * 0.4)]);
  partes.push([gob ? "Tu bloque en la Legislatura" : "Tus concejales", Math.round(((S.leg[yo.partido] || 0) / (S.legTotal || 1)) * 14)]);
  const pf = typeof perfilActual === "function" ? perfilActual() : { prestigio: 0, reconocimiento: 0 };
  const tray = Math.round((pf.prestigio || 0) * 0.08 + (pf.reconocimiento || 0) * 0.05);
  if (tray) partes.push(["Tu trayectoria", tray]);
  partes.push(["Tu capacidad de negociación", Math.round((yo.negociacion - 5) * 1.5)]);
  if (I.tension > 60) partes.push(["Capacidad de daño: un conflicto que puede contagiarse", 4]);
  const total = R.clamp(partes.reduce((a, p) => a + p[1], 0), 0, 100);
  return { total, partes };
}

// ---------- Probabilidad de que el superior diga que sí (directo o con condiciones) ----------
function evaluarGestion(tipoId, t) {
  const T = tipoGestion(tipoId), sup = supDe(T.ante), yo = S.jugador, I = S.ind;
  const mismo = sup.partido === yo.partido;
  const dist = Math.abs(((PARTIDOS[sup.partido] || {}).ideo || 50) - yo.ideo);
  const peso = pesoPropioLocal().total;
  const f = [];
  f.push(["Punto de partida", 0.3]);
  f.push([mismo ? "Mismo signo político" : `Distancia ideológica con ${jefeSup(T.ante)}`, mismo ? 0.22 : -dist / 300]);
  f.push([`Relación con ${jefeSup(T.ante)}`, sup.relacion / 220]);
  f.push(["Tu peso propio", (peso - 25) / 200]);
  f.push([`Caja de ${T.ante === "nac" || !esIntendente() ? "la Nación" : "la provincia"}`, (sup.caja - 50) / 250]);
  if (anioElectoral()) f.push(["Año electoral: el superior reparte más", 0.08]);
  if (I.tension > 60) f.push(["Tensión social alta: teme el contagio", T.id === "emergencia" ? 0.2 : 0.06]);
  f.push(["Magnitud del pedido", -(T.mag - 1) * 0.05]);
  if (sup.favores > 4) f.push(["Favores que le debés y no pagaste", -(sup.favores - 4) * 0.03]);
  if (sup.castigo > 0) f.push(["Te está castigando", -0.25]);
  if (T.ante === "nac" && esIntendente() && S.gest.gobProv.partido !== S.presidente.partido && S.presidente.partido === yo.partido) f.push(["La Nación usa a los intendentes propios contra el gobernador", 0.08]);
  if (t && t.insist) f.push(["Insistencia", t.insist * 0.05]);
  const p = R.clamp(f.reduce((a, x) => a + x[1], 0), 0.03, 0.92);
  return { p, factores: f, peso, mismo };
}
function chanceTexto(p) { return p >= 0.65 ? "muy probable" : p >= 0.45 ? "probable" : p >= 0.25 ? "difícil" : "casi imposible"; }

function puedePedir(T) {
  const g = asegurarGest();
  if (T.cond && !T.cond()) return { ok: false, msg: "Ese pedido solo tiene sentido con la tensión social alta." };
  if (g.tram.filter(t => t.estado === "tramite" || t.estado === "condicionado").length >= 3) return { ok: false, msg: "Ya tenés tres expedientes abiertos: nadie te va a atender un cuarto." };
  if (g.tram.some(t => t.tipo === T.id && (t.estado === "tramite" || t.estado === "condicionado"))) return { ok: false, msg: "Ese pedido ya está en trámite." };
  const ult = g.ultimo[T.id];
  const espera = T.id === "emergencia" ? 3 : 6;
  if (ult && S.mes - ult < espera) return { ok: false, msg: `Te lo dieron hace poco: no vuelvas a pedirlo hasta dentro de ${espera - (S.mes - ult)} meses.` };
  return { ok: true };
}

function presentarGestion(id) {
  const g = asegurarGest(), T = tipoGestion(id);
  if (!g || !T) return { ok: false, msg: "No disponible.", tipo: "aviso" };
  const chk = puedePedir(T);
  if (!chk.ok) return { ok: false, msg: chk.msg, tipo: "aviso" };
  return conCasillero(1, () => {
    const sup = supDe(T.ante);
    const dem = entre(T.demora[0], T.demora[1]) + (sup.relacion < -20 ? 1 : 0);
    const t = { uid: ++g.n, tipo: id, ante: T.ante, estado: "tramite", desde: S.mes, resp: S.mes + dem - 1, insist: 0, demoras: 0 };
    g.tram.push(t);
    let extra = "";
    if (T.ante === "nac" && esIntendente()) { g.gobProv.relacion = R.clamp(g.gobProv.relacion - 4, -100, 100); extra = " El gobernador se entera de que fuiste directo a la Nación."; }
    const msg = `Pediste audiencia en ${nombreSup(T.ante)}: "${T.nombre}". El expediente entra en trámite; la respuesta tarda ${dem === 1 ? "un mes" : dem + " meses"}.${extra}`;
    log(msg, "info");
    return { ok: true, msg, tipo: "info" };
  });
}

function aprobarGestion(t, extra) {
  const T = tipoGestion(t.tipo), sup = supDe(t.ante), g = S.gest, yo = S.jugador;
  const mismo = sup.partido === yo.partido;
  aplicarLocal(T.ini);
  if (T.dif) S.diferidosLocal.push({ t: S.trimestre + T.dif.en, texto: T.dif.texto, ind: T.dif.ind, origen: T.nombre });
  sup.relacion = R.clamp(sup.relacion - 2, -100, 100);
  sup.caja = Math.max(0, sup.caja - T.mag * 3);
  sup.favores = (sup.favores || 0) + (mismo ? T.mag : Math.ceil(T.mag / 2));
  g.ultimo[t.tipo] = S.mes;
  if (T.obra) { t.estado = "obra"; t.finObra = S.mes + T.obra; } else t.estado = "cumplido";
  t.resuelto = S.mes;
  let salteo = "";
  if (t.ante === "nac" && esIntendente()) { const dif = g.gobProv.partido !== S.presidente.partido; g.gobProv.relacion = R.clamp(g.gobProv.relacion - (dif ? 10 : 5), -100, 100); salteo = dif ? " El gobernador, que es de otro signo que el presidente, lo toma como una traición." : " Al gobernador no le gustó que lo saltearas."; }
  const texto = `${T.nombre}: ${T.ok}${extra || ""}${mismo ? ` Es de tu mismo signo: te lo va a cobrar.` : ""}${salteo}`;
  log(texto, "bueno");
  return { titulo: `${capRel(nombreSup(t.ante))} aprobó tu pedido`, texto, tipo: "bueno" };
}

function negarGestion(t, motivo) {
  const T = tipoGestion(t.tipo);
  t.estado = "negado"; t.resuelto = S.mes;
  aplicarLocal({ imagen: -1 });
  const texto = `${T.nombre}: ${motivo || "la respuesta fue que no hay fondos para eso."} Podés denunciarlo en público o aguantar.`;
  log(texto, "malo");
  return { titulo: `${capRel(nombreSup(t.ante))} rechazó tu pedido`, texto, tipo: "malo" };
}

function elegirCondicion(t) {
  const sup = supDe(t.ante), mismo = sup.partido === S.jugador.partido;
  let pos = CONDICIONES_SUP.filter(c => !c.soloGob || S.cfg.objetivo === "gobernador");
  if (!anioElectoral() && !mismo) pos = pos.filter(c => c.id !== "lista");
  // al propio le piden lealtad; al opositor, plata o votos
  const pesos = pos.map(c => (mismo ? { alinear: 3, lista: 3, votos: 2, cargo: 1, cofinanciar: 1, adherir: 1 } : { cofinanciar: 3, adherir: 2, votos: 2, alinear: 1, cargo: 1, lista: 1 })[c.id] || 1);
  let r = R.rand() * pesos.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pos.length; i++) { r -= pesos[i]; if (r <= 0) return pos[i].id; }
  return pos[0].id;
}

function responderGestion(t) {
  const T = tipoGestion(t.tipo);
  const { p } = evaluarGestion(t.tipo, t);
  const r = R.rand();
  if (r < p * 0.6) return aprobarGestion(t, "");
  if (r < p) {
    t.estado = "condicionado"; t.cond = elegirCondicion(t); t.condMes = S.mes;
    const C = CONDICIONES_SUP.find(c => c.id === t.cond);
    const texto = `${T.nombre}: ${jefeSup(t.ante)} dice que sí, pero pide ${C.txt(jefeSup(t.ante))}. Tenés un mes para aceptar o rechazar.`;
    log(texto, "aviso");
    return { titulo: `${capRel(nombreSup(t.ante))} condiciona tu pedido`, texto, tipo: "aviso" };
  }
  if (r < p + (1 - p) * 0.45 && t.demoras < 2) {
    t.demoras++; t.resp = S.mes + entre(1, 2);
    const texto = `${T.nombre}: el expediente quedó cajoneado en ${nombreSup(t.ante)}. Podés insistir o esperar.`;
    log(texto, "info");
    return { titulo: "Expediente demorado", texto, tipo: "info" };
  }
  const sup = supDe(t.ante);
  return negarGestion(t, sup.relacion < -30 ? `${jefeSup(t.ante)} no te atiende: la relación está rota.` : sup.caja < 30 ? "no hay plata, te dicen, y hay prioridades." : t.demoras >= 2 ? "después de dar vueltas, el expediente se archivó." : "la respuesta fue que no.");
}

function aceptarCondicion(uid, acepta) {
  const g = asegurarGest(); if (!g) return { msg: "", tipo: "info" };
  const t = g.tram.find(x => x.uid === uid);
  if (!t || t.estado !== "condicionado") return { msg: "Ese pedido ya no espera respuesta.", tipo: "aviso" };
  const T = tipoGestion(t.tipo), sup = supDe(t.ante), mismo = sup.partido === S.jugador.partido;
  if (!acepta) {
    sup.relacion = R.clamp(sup.relacion - 6, -100, 100);
    const r = negarGestion(t, "rechazaste la condición y el pedido se cayó.");
    return { msg: r.texto, tipo: "malo" };
  }
  let nota = "", pasos = [];
  switch (t.cond) {
    case "alinear": sup.relacion += 8; aplicarLocal({ imagen: (mismo ? 0 : -3) + (sup.imagen < 40 ? -2 : 0) }); nota = ` Te mostraste con ${jefeSup(t.ante)}.`; break;
    case "cofinanciar": aplicarLocal({ caja: -T.mag * 3 }); nota = ` Pusiste ${T.mag * 3} de caja como contraparte.`; break;
    case "adherir": {
      const v = votarLegislatura({ ideo: (PARTIDOS[sup.partido] || { ideo: 50 }).ideo });
      pasos = [v];
      if (!v.aprobado) { const r = negarGestion(t, `${cuerpoLocalRel()} no aprobó la adhesión y el pedido se cayó.`); return { msg: r.texto, pasos, tipo: "malo" }; }
      S.adhesiones.push("sup:" + t.tipo); nota = ` ${capRel(cuerpoLocalRel())} aprobó la adhesión.`; break;
    }
    case "cargo": aplicarLocal({ legitimidad: -2 }); S.riesgo = (S.riesgo || 0) + 4; nota = " Un funcionario suyo se sienta en tu gabinete."; break;
    case "lista": S.flagsLocal.pegado = true; sup.relacion += 5; nota = " Vas a ir pegado a su boleta."; break;
    case "votos": aplicarLocal({ imagen: mismo ? -1 : -3 }); sup.relacion += 6; nota = " Tus legisladores nacionales votan con el gobierno."; break;
  }
  sup.relacion = R.clamp(sup.relacion, -100, 100);
  const r = aprobarGestion(t, nota);
  return { msg: r.texto, pasos, tipo: "bueno" };
}

function insistirGestion(uid) {
  const g = asegurarGest(); if (!g) return { msg: "", tipo: "info" };
  const t = g.tram.find(x => x.uid === uid);
  if (!t || t.estado !== "tramite" || !t.demoras) return { ok: false, msg: "Ese expediente no está demorado.", tipo: "aviso" };
  return conCasillero(1, () => {
    t.insist++; t.resp = S.mes;
    const sup = supDe(t.ante); sup.relacion = R.clamp(sup.relacion - 1, -100, 100);
    const msg = `Volviste a ${nombreSup(t.ante)} por "${tipoGestion(t.tipo).nombre}". Te prometen una respuesta este mes.`;
    log(msg, "info");
    return { ok: true, msg, tipo: "info" };
  });
}

function denunciarGestion(uid) {
  const g = asegurarGest(); if (!g) return { msg: "", tipo: "info" };
  const t = g.tram.find(x => x.uid === uid);
  if (!t || t.estado !== "negado" || t.denunciado) return { msg: "No hay nada para denunciar.", tipo: "aviso" };
  const sup = supDe(t.ante), mismo = sup.partido === S.jugador.partido;
  t.denunciado = true;
  sup.relacion = R.clamp(sup.relacion - 12, -100, 100);
  aplicarLocal({ imagen: mismo ? -1 : 3 + (sup.imagen < 45 ? 2 : 0), legitimidad: 1 });
  const msg = mismo ? `Denunciaste a ${jefeSup(t.ante)} siendo del mismo partido: la interna queda expuesta y a muchos no les gusta.` : `Denunciaste discriminación de ${nombreSup(t.ante)}: tu gente te aplaude y la relación se enfría.`;
  log(msg, mismo ? "malo" : "info");
  return { msg, tipo: mismo ? "malo" : "info" };
}

// alinearse, enfrentar o pedir una audiencia de cortesía (una postura por mes)
function posturaSup(ante, accion) {
  const g = asegurarGest(); if (!g) return { msg: "", tipo: "info" };
  if (g.posturaMes === S.mes) return { ok: false, msg: "Ya marcaste tu postura con tus superiores este mes.", tipo: "aviso" };
  return conCasillero(1, () => {
    g.posturaMes = S.mes;
    const sup = supDe(ante), mismo = sup.partido === S.jugador.partido, yo = S.jugador;
    let msg = "", tipo = "info";
    if (accion === "alinear") {
      sup.relacion += 15; sup.favores = Math.max(0, (sup.favores || 0) - 1);
      aplicarLocal({ imagen: (mismo ? 1 : -2) + (sup.imagen < 40 ? -2 : 0) });
      msg = `Te sacaste la foto con ${jefeSup(ante)} y defendiste su gestión.${sup.imagen < 40 ? " Está en baja: pegarte a él te resta." : ""}`;
    } else if (accion === "enfrentar") {
      sup.relacion -= 20;
      aplicarLocal({ imagen: 3 + (sup.imagen < 45 ? 2 : 0) - (mismo ? 2 : 0) });
      msg = `Saliste a enfrentar a ${jefeSup(ante)}: denunciaste el reparto de fondos.${mismo ? " Siendo del mismo partido, es una ruptura." : ""} ${capRel(nombreSup(ante))} cierra la canilla.`;
      if (sup.relacion < -40 && R.rand() < 0.4) { sup.castigo = 3; msg += " Y prepara una represalia."; tipo = "malo"; }
    } else {
      const sube = 6 + (yo.negociacion - 5);
      sup.relacion += sube;
      msg = `Mesa técnica con los ministros de ${nombreSup(ante)}: sin anuncios, pero la relación mejora (+${sube}).`;
    }
    sup.relacion = R.clamp(sup.relacion, -100, 100);
    log(msg, tipo);
    return { ok: true, msg, tipo };
  });
}

function resolverCobroSup(uid, op, auto) {
  const g = asegurarGest(); if (!g) return { msg: "", tipo: "info" };
  const c = g.cobros.find(x => x.uid === uid);
  if (!c || c.resuelto) return { msg: "Ese pedido ya está resuelto.", tipo: "aviso" };
  const sup = supDe(c.ante), C = (COBROS_SUP[S.cfg.objetivo] || []).find(x => x.id === c.id), yo = S.jugador;
  c.resuelto = true; c.op = op;
  let msg, tipo = "info";
  if (op === "cumplir") {
    aplicarLocal(C.cumplir); if (C.flag) S.flagsLocal[C.flag] = true; if (C.riesgo) S.riesgo = (S.riesgo || 0) + C.riesgo;
    sup.favores = Math.max(0, sup.favores - 3); sup.relacion += 6;
    msg = `${C.titulo}: cumpliste. ${capRel(jefeSup(c.ante))} toma nota de tu lealtad.`;
  } else if (op === "negociar") {
    if (R.rand() < 0.3 + yo.negociacion * 0.05) { sup.favores = Math.max(0, sup.favores - 1); sup.relacion -= 2; msg = `${C.titulo}: lo negociaste y cumpliste solo una parte.`; }
    else { sup.relacion -= 8; msg = `${C.titulo}: quisiste regatear y lo tomaron como un desaire.`; tipo = "malo"; }
  } else {
    sup.relacion -= auto ? 10 : 15; tipo = "malo";
    sup.favores = Math.max(0, sup.favores - 1);
    msg = auto ? `${C.titulo}: no respondiste y ${jefeSup(c.ante)} lo toma como un no.` : `${C.titulo}: te negaste. ${capRel(jefeSup(c.ante))} no se olvida.`;
    if (!auto && sup.relacion < -40 && R.rand() < 0.4) { sup.castigo = 3; msg += " Prepara una represalia."; }
  }
  sup.relacion = R.clamp(sup.relacion, -100, 100);
  log(msg, tipo);
  return { msg, tipo };
}

// Lo que pasa con tus superiores al cerrar cada mes
function procesarRelLocal() {
  const g = asegurarGest(); if (!g || S.perdio) return [];
  const ev = [], yo = S.jugador, I = S.ind;
  for (const t of g.tram) {
    if (t.estado === "condicionado" && S.mes > t.condMes) { supDe(t.ante).relacion -= 4; ev.push(negarGestion(t, "dejaste vencer el plazo para aceptar la condición.")); }
    else if (t.estado === "tramite" && t.resp <= S.mes) ev.push(responderGestion(t));
    else if (t.estado === "obra" && S.mes >= t.finObra) {
      const T = tipoGestion(t.tipo);
      aplicarLocal(T.fin); t.estado = "terminada";
      const fondos = t.ante === "nac" || !esIntendente() ? "nacionales" : "provinciales";
      if (typeof registrarHito === "function") registrarHito({ tipo: "obra", txt: `Inauguró una obra con fondos ${fondos}: ${T.nombre.toLowerCase()}`, peso: 1.2, valor: 1.5, mult: "obras" });
      ev.push({ titulo: "Inauguración", texto: `Cortaste la cinta: ${T.nombre.toLowerCase()} con fondos ${fondos}. ${jefeSup(t.ante) === "el presidente" ? "El presidente" : "El gobernador"} ${supDe(t.ante).partido === yo.partido ? "viene al acto y comparte el aplauso" : "manda un funcionario de segunda"}.`, tipo: "bueno" });
    }
  }
  for (const c of g.cobros.filter(x => !x.resuelto && S.mes > x.mes)) { const r = resolverCobroSup(c.uid, "negarse", true); ev.push({ titulo: "Factura sin pagar", texto: r.msg, tipo: "malo" }); }
  // el superior pasa la factura de lo que te dio
  const sups = [S.presidente, g.gobProv].filter(Boolean);
  if (!g.cobros.some(c => !c.resuelto)) {
    const s = sups.slice().sort((a, b) => (b.favores || 0) - (a.favores || 0))[0];
    if (s && s.favores >= 3 && R.rand() < 0.12 + s.favores * 0.03) {
      const lista = COBROS_SUP[S.cfg.objetivo] || [];
      const C = R.pick(lista);
      const ante = s === S.presidente && esIntendente() ? "nac" : "sup";
      // al intendente, la Casa Rosada le cobra con los cobros del gobernador adaptados
      g.cobros.push({ uid: ++g.n, id: C.id, ante, mes: S.mes, resuelto: false });
      ev.push({ titulo: "Te pasan la factura", texto: `${C.titulo}. ${C.texto}`, tipo: "aviso" });
    }
  }
  for (const s of sups) {
    const ante = s === S.presidente && esIntendente() ? "nac" : "sup";
    if (s.castigo > 0) {
      aplicarLocal({ caja: -2 }); s.castigo--;
      if (s.castigo === 2) ev.push({ titulo: "Represalia", texto: `${capRel(nombreSup(ante))} retiene giros, frena tus expedientes y le da la obra a un rival tuyo.`, tipo: "malo" });
    } else if (s.relacion < -60 && R.rand() < 0.08) { s.castigo = 3; ev.push({ titulo: "Represalia", texto: `${capRel(nombreSup(ante))} decide castigarte: los giros se demoran y tus pedidos no avanzan.`, tipo: "malo" }); }
    // caja e imagen del superior
    const objCaja = (s === S.presidente ? 70 : 60) - (S.inflNacional - 2.5) * (s === S.presidente ? 6 : 5) + (anioElectoral() ? 8 : 0);
    s.caja = R.clamp(suav(s.caja, objCaja, 0.8) + ruido(3), 5, 100);
    s.imagen = R.clamp(suav(s.imagen, 45, 0.92) + ruido(2.5), 10, 85);
    // arrastre: pegarse a un jefe impopular resta; enfrentarlo suma
    if (s.partido === yo.partido && s.relacion > 30) I.imagen += (s.imagen - 45) / 40;
    if (s.relacion < -30) I.imagen += (45 - s.imagen) / 80;
  }
  if (g.gobProv) g.gobProv.relacion = R.clamp(suav(g.gobProv.relacion, 0, 0.96), -100, 100);
  // no guardar historia infinita
  const viejos = g.tram.filter(t => ["cumplido", "negado", "terminada"].includes(t.estado));
  if (viejos.length > 10) g.tram = g.tram.filter(t => !viejos.slice(0, viejos.length - 10).includes(t));
  if (g.cobros.length > 10) g.cobros = g.cobros.slice(-10);
  return ev;
}

iniciarGobiernoLocal = (orig => function () { orig(); asegurarGest(); })(iniciarGobiernoLocal);
finTrimestreLocal = (orig => function () {
  const pre = S && S.fase === "gobiernoLocal" && !S.perdio ? procesarRelLocal() : [];
  const ev = orig();
  return [...pre, ...(ev || [])];
})(finTrimestreLocal);

// =============================================================
//  PARTE 2 · Peso político del legislador
// =============================================================

const RANGOS_LEG = [
  { min: 0, nombre: "Recién llegado", txt: "Pocos te devuelven el llamado. Todo te cuesta negociarlo.", rondas: 1, acciones: 1, vocalias: 2, pres: 0, nivelPres: 0 },
  { min: 20, nombre: "Referente temático", txt: "Te consultan en tus temas. Podés presidir una comisión menor.", rondas: 2, acciones: 1, vocalias: 3, pres: 1, nivelPres: 1 },
  { min: 40, nombre: "Armador del recinto", txt: "Sabés contar votos: manejás más agenda y podés presidir una comisión importante.", rondas: 2, acciones: 2, vocalias: 3, pres: 1, nivelPres: 2 },
  { min: 60, nombre: "Pieza clave de la Cámara", txt: "Sin vos no hay quórum. Podés presidir Presupuesto o Asuntos Constitucionales.", rondas: 3, acciones: 2, vocalias: 4, pres: 2, nivelPres: 3 },
  { min: 80, nombre: "Figura del Congreso", txt: "Todos pasan por tu despacho. Te ofrecen la vicepresidencia de la Cámara y te miden para cargos ejecutivos.", rondas: 3, acciones: 2, vocalias: 4, pres: 2, nivelPres: 3 },
];
const COMISIONES_LEG = [
  { id: "presupuesto", nombre: "Presupuesto y Hacienda", nivel: 3, temas: ["pymes"], areas: ["economia", "tributaria"] },
  { id: "constitucionales", nombre: "Asuntos Constitucionales", nivel: 3, temas: ["transparencia"], areas: ["constitucional", "electoral", "institucional"] },
  { id: "penal", nombre: "Legislación Penal y Seguridad", nivel: 2, temas: ["penas"], areas: ["penal", "seguridad"] },
  { id: "general", nombre: "Legislación General", nivel: 2, temas: ["violencia"], areas: ["derechos"] },
  { id: "trabajo", nombre: "Legislación del Trabajo y Previsión", nivel: 2, temas: [], areas: ["laboral", "social"] },
  { id: "exteriores", nombre: "Relaciones Exteriores", nivel: 2, temas: [], areas: ["exterior"] },
  { id: "salud", nombre: "Acción Social y Salud Pública", nivel: 1, temas: ["salud", "cannabis"], areas: ["salud"] },
  { id: "educacion", nombre: "Educación, Ciencia y Comunicaciones", nivel: 1, temas: ["conectividad"], areas: ["educacion"] },
  { id: "federal", nombre: "Economías Regionales y Coparticipación", nivel: 1, temas: ["regalias"], areas: ["federal"] },
  { id: "ambiente", nombre: "Recursos Naturales y Ambiente", nivel: 1, temas: [], areas: ["ambiente"] },
];
// magnitud de cada tema: 1 = menor (sale casi sin negociar) · 5 = de fondo (hay que negociar con medio Congreso)
const MAG_TEMA = { conectividad: 1, salud: 2, violencia: 2, transparencia: 3, pymes: 3, cannabis: 3, penas: 4, regalias: 5 };
const MAG_AREA = { constitucional: 5, electoral: 5, tributaria: 4, economia: 4, laboral: 4, federal: 4, penal: 3, seguridad: 3, social: 3, exterior: 3, institucional: 3, salud: 2, educacion: 2, ambiente: 2, derechos: 2 };
const MAG_PROY = { presupuesto: 5, laboral: 5, fortunas: 4, alquileres: 3, imputabilidad: 3, fmiLey: 5, emergenciaAlim: 2, jubilatoria: 4, corteAmpl: 5, fichaLimpia: 2, boletaUnica: 3, rechazoDNU: 3, privatizacion: 4, humedales: 2, financiamientoU: 3, delegacion: 5 };
const SECTOR_TEMA = { pymes: "las cámaras pyme", salud: "los colegios médicos", transparencia: "las ONG de transparencia", violencia: "las organizaciones de mujeres", conectividad: "las telefónicas y cooperativas", cannabis: "las asociaciones de cultivadores", penas: "los sindicatos policiales", regalias: "las petroleras y mineras" };
const SECTOR_AREA = { economia: "las cámaras empresarias", tributaria: "las cámaras empresarias", laboral: "la central sindical", social: "los movimientos sociales", seguridad: "las fuerzas de seguridad", penal: "los colegios de abogados", educacion: "los gremios docentes", salud: "los colegios médicos", derechos: "las organizaciones de derechos humanos", electoral: "los apoderados de los partidos", institucional: "las ONG de transparencia", constitucional: "los constitucionalistas", ambiente: "las ONG ambientales", exterior: "las cámaras exportadoras", federal: "las ligas de intendentes" };
const NOMBRE_MAG = ["", "tema menor", "tema chico", "tema mediano", "tema grande", "tema de fondo"];

function magLey(ley) {
  if (!ley) return 3;
  let m = MAG_AREA[ley.area] || 3;
  if (["constitucional", "coparticipacion"].includes(ley.materia)) m = 5;
  if ((ley.clausulas || []).some(c => /piloto/i.test(c))) m -= 1;
  if (Math.abs((ley.ideo || 50) - 50) > 25) m += 1;
  return R.clamp(m, 1, 5);
}

function asegurarPeso() {
  if (!S || typeof esLegislador !== "function" || !esLegislador() || !S.leg2 || !S.cam) return null;
  if (!S.pl) {
    const yo = S.jugador;
    const share = (S.cam[yo.partido] || 0) / (S.camTotal || camLeg().total);
    const pf = typeof perfilActual === "function" ? perfilActual() : { prestigio: 0, reconocimiento: 0 };
    const peso = R.clamp(8 + share * 70 + (pf.prestigio || 0) * 0.1 + (pf.reconocimiento || 0) * 0.08 + (yo.negociacion - 5) * 1.5, 3, 60);
    const menores = COMISIONES_LEG.filter(c => c.nivel <= 2).map(c => c.id);
    const com = {};
    while (Object.keys(com).length < 2) com[R.pick(menores)] = "vocal";
    if (S.comisionPres) com.presupuesto = "pres";
    S.pl = { peso: Math.round(peso * 10) / 10, palabra: 70, comisiones: com, deudas: [], cobros: [], neg: {}, n: 0, rondas: 1, intentos: {}, vice: false, figura: false, rangoVisto: 0 };
    S.pl.rondas = rondasMaxLeg();
  }
  return S.pl;
}
function rangoLeg(peso) { const p = peso != null ? peso : (S.pl ? S.pl.peso : 0); let r = RANGOS_LEG[0]; for (const x of RANGOS_LEG) if (p >= x.min) r = x; return r; }
function idxRango(peso) { return RANGOS_LEG.indexOf(rangoLeg(peso)); }
function rondasMaxLeg() { return rangoLeg().rondas + (S.jugador.negociacion >= 8 ? 1 : 0) + (S.pl && S.pl.vice ? 1 : 0); }
function sharePropio() { return (S.cam[S.jugador.partido] || 0) / (S.camTotal || camLeg().total); }
function presidencias() { const pl = asegurarPeso(); return pl ? Object.values(pl.comisiones).filter(v => v === "pres").length : 0; }
// las subidas rinden menos cuanto más peso ya tenés: llegar a figura del Congreso cuesta
function cambiarPeso(d) { const pl = asegurarPeso(); if (!pl) return; if (d > 0) d *= Math.max(0.05, 1 - pl.peso / 105); pl.peso = Math.round(R.clamp(pl.peso + d, 0, 100) * 10) / 10; }

// a qué se refiere una clave de negociación: "tema:<id>" (proyectos propios del bloque) o "ley:<uid>" (redactor de leyes)
function objNeg(clave) {
  const [k, id] = clave.split(":");
  if (k === "tema") {
    const T = TEMAS_PROPIOS.find(x => x.id === id); if (!T) return null;
    return { clave, k, nombre: T.nombre, mag: MAG_TEMA[id] || 3, ideo: T.ideo, comision: COMISIONES_LEG.find(c => c.temas.includes(id)), federal: id === "regalias", sector: SECTOR_TEMA[id] || "los sectores interesados" };
  }
  const ley = (estadoLeyes().tram || []).find(l => l.propia && String(l.uid) === id); if (!ley) return null;
  return { clave, k, nombre: ley.nombre, mag: magLey(ley), ideo: ley.ideo, comision: COMISIONES_LEG.find(c => c.areas.includes(ley.area)), federal: ley.area === "federal" || !!ley.fondosGob, sector: SECTOR_AREA[ley.area] || "los sectores interesados", ley };
}
function negEntry(clave) { const pl = asegurarPeso(); if (!pl.neg[clave]) pl.neg[clave] = { apoyoNeg: 0, hechas: [], fallas: {}, concesiones: 0, bloques: {} }; return pl.neg[clave]; }
function umbralNeg(mag) { return 15 + mag * 15; }

function estadoNeg(clave) {
  const pl = asegurarPeso(), O = objNeg(clave); if (!pl || !O) return null;
  const N = negEntry(clave);
  const partes = [];
  partes.push([`Bancas de tu bloque (${S.cam[S.jugador.partido] || 0})`, Math.round(sharePropio() * 60)]);
  partes.push(["Tu peso político", Math.round(pl.peso * 0.5)]);
  if (O.comision && pl.comisiones[O.comision.id]) partes.push([`${pl.comisiones[O.comision.id] === "pres" ? "Presidís" : "Sos vocal de"} ${O.comision.nombre}`, pl.comisiones[O.comision.id] === "pres" ? 15 : 5]);
  if (S.oficialismo) partes.push(["Sos oficialismo", 5]);
  if (S.interbloque) partes.push(["Interbloque", 5]);
  if (pl.vice) partes.push(["Vicepresidencia de la Cámara", 8]);
  const propio = partes.reduce((a, p) => a + p[1], 0);
  const umbral = umbralNeg(O.mag);
  const total = propio + Math.round(N.apoyoNeg);
  return { O, N, partes, propio, neg: Math.round(N.apoyoNeg), total, umbral, listo: total >= umbral, falta: Math.max(0, umbral - total) };
}
// ajuste de la probabilidad de dictamen según cuánto apoyo juntaste
function ajusteDictamenNeg(clave) { const e = estadoNeg(clave); if (!e) return 0; return e.listo ? 0.45 : (e.total / e.umbral - 0.7) * 0.25; }
function ajusteDictamenTema(pc) { return pc ? ajusteDictamenNeg("tema:" + pc.id) : 0; }

// con quién se puede negociar un proyecto
function contrapartesNeg(clave) {
  const e = estadoNeg(clave); if (!e) return [];
  const O = e.O, yo = S.jugador, out = [];
  for (const k in S.cam) {
    if (k === yo.partido || !S.cam[k] || !PARTIDOS[k]) continue;
    const share = S.cam[k] / (S.camTotal || camLeg().total);
    const afin = Math.max(0, 1 - Math.abs((PARTIDOS[k].ideo || 50) - O.ideo) / 50);
    out.push({ id: "bloque:" + k, bloque: k, nombre: `Bloque ${PARTIDOS[k].nombre} (${S.cam[k]})`, gain: Math.round(share * 100 * (0.5 + afin * 0.9)), afin, rel: S.relBloques[k] || 0, ops: ["favor", "voto", "concesion"] });
  }
  out.push({ id: "gob", bloque: "PROV", nombre: "Los gobernadores (sus legisladores responden a ellos)", gain: Math.round((6 + O.mag * 2) * (O.federal ? 1.5 : 1)), afin: 0.5, rel: (S.relBloques.PROV || 0), ops: ["favor", "voto"] });
  if (O.comision && S.pl.comisiones[O.comision.id] !== "pres") out.push({ id: "comision", nombre: `Quien preside ${O.comision.nombre}`, gain: 12, afin: 0.4, rel: 0, ops: ["voto", "concesion"] });
  out.push({ id: "ofi", bloque: S.presNac.partido, nombre: S.oficialismo ? "La Casa Rosada (tu propio gobierno)" : "La Casa Rosada", gain: 10 + (S.oficialismo ? 8 : 0), afin: Math.max(0, 1 - Math.abs(PARTIDOS[S.presNac.partido].ideo - O.ideo) / 50), rel: S.leg2.relPres, ops: ["voto", "concesion"] });
  out.push({ id: "sector", nombre: capRel(O.sector), gain: 6, afin: 0.7, rel: 20, ops: ["aceptar"] });
  for (const c of out) c.hecha = e.N.hechas.includes(c.id);
  return out;
}
const OPS_NEG = { favor: { n: "Dar un favor", d: "Obras o cargos: gasta un favor acumulado", b: 0.25 }, voto: { n: "Prometer tu voto", d: "Te lo cobran en unos meses", b: 0.1 }, concesion: { n: "Aceptar cambios", d: "El proyecto sale más moderado y pierde brillo", b: 0.15 }, aceptar: { n: "Aceptar su apoyo", d: "Suman difusión y favores, pero suben el riesgo de escándalo", b: 0.45 } };

function promesasAbiertas() { const pl = S.pl; return pl ? pl.deudas.filter(d => !d.cobrado).length + pl.cobros.filter(c => !c.resuelto).length : 0; }
function chanceNeg(C, op, O) {
  const pl = S.pl, yo = S.jugador;
  return R.clamp(0.15 + C.rel / 150 + pl.peso / 180 + (yo.negociacion - 5) * 0.04 + (pl.palabra - 60) / 200 - O.mag * 0.04 + C.afin * 0.2 + (OPS_NEG[op] ? OPS_NEG[op].b : 0), 0.05, 0.95);
}

function negociarApoyo(clave, cid, op) {
  const pl = asegurarPeso(); if (!pl) return { msg: "", tipo: "info" };
  if (pl.rondas <= 0) return { msg: "No te quedan rondas de negociación este mes. Con más peso tendrías más.", tipo: "aviso" };
  const e = estadoNeg(clave); if (!e) return { msg: "Ese proyecto ya no está en trámite.", tipo: "aviso" };
  const O = e.O, N = e.N;
  const C = contrapartesNeg(clave).find(c => c.id === cid);
  if (!C || !C.ops.includes(op)) return { msg: "No se puede negociar eso.", tipo: "aviso" };
  if (C.hecha) return { msg: "Con ellos ya cerraste.", tipo: "aviso" };
  if (N.fallas[cid] === S.mes) return { msg: "Ya te dijeron que no este mes.", tipo: "aviso" };
  if (op === "favor" && S.leg2.recursos < 1) return { msg: "No tenés favores para repartir. Conseguí alguno negociando con el Ejecutivo.", tipo: "aviso" };
  if (op === "voto" && promesasAbiertas() >= 3) return { msg: "Ya tenés tres votos prometidos sin pagar: nadie te va a fiar otro.", tipo: "aviso" };
  pl.rondas--;
  const ch = chanceNeg(C, op, O);
  let msg, tipo;
  if (R.rand() < ch) {
    if (op === "favor") aplicarLeg({ recursos: -1 });
    if (op === "voto") pl.deudas.push({ uid: ++pl.n, acreedor: cid, nombre: C.nombre, bloque: C.bloque || null, vence: S.mes + 2 + entre(0, 3), cobrado: false });
    if (op === "concesion") { N.concesiones++; aplicarLeg({ imagen: -1 }); if (O.ley) { O.ley.ideo = Math.round(50 + (O.ley.ideo - 50) * 0.85); for (const k in O.ley.ef) O.ley.ef[k] *= 0.9; } }
    if (op === "aceptar") aplicarLeg({ recursos: 1, imagen: 1 });
    const gain = Math.round(C.gain * (op === "concesion" ? 0.9 : 1));
    N.apoyoNeg += gain; N.hechas.push(cid);
    if (C.bloque) N.bloques[C.bloque] = (N.bloques[C.bloque] || 0) + (cid === "ofi" ? 40 : 50);
    if (cid === "gob") aplicarLeg({ disciplina: 2 });
    if (O.ley) O.ley.extra = (O.ley.extra || 0) + gain * 0.3;
    const st = estadoNeg(clave);
    msg = `${C.nombre}: acuerdo cerrado (${OPS_NEG[op].n.toLowerCase()}). "${O.nombre}" suma ${gain} de apoyo: ${st.total} de ${st.umbral}.${st.listo ? " Ya tenés lo que hace falta para el dictamen." : ""}`;
    tipo = "bueno";
  } else {
    N.fallas[cid] = S.mes;
    if (C.bloque && S.relBloques[C.bloque] != null) S.relBloques[C.bloque] -= 3;
    msg = `${C.nombre}: no hubo acuerdo por "${O.nombre}". ${pl.peso < 30 ? "Todavía no tenés el peso para que te tomen en serio." : "Piden más de lo que podés dar."}`;
    tipo = "malo";
  }
  log(msg, tipo);
  return { msg, tipo };
}

// pelear un lugar en una comisión
function pedirComision(id, cargo) {
  const pl = asegurarPeso(); if (!pl) return { msg: "", tipo: "info" };
  const C = COMISIONES_LEG.find(c => c.id === id); if (!C) return { msg: "", tipo: "aviso" };
  const R0 = rangoLeg(), actual = pl.comisiones[id];
  if (pl.rondas <= 0) return { msg: "No te quedan rondas de negociación este mes.", tipo: "aviso" };
  if (cargo === "vocal") {
    if (actual) return { msg: "Ya integrás esa comisión.", tipo: "aviso" };
    if (Object.keys(pl.comisiones).length >= R0.vocalias) return { msg: `Con tu rango (${R0.nombre}) tu bloque te da ${R0.vocalias} comisiones. Necesitás más peso para sumar otra.`, tipo: "aviso" };
  } else {
    if (actual === "pres") return { msg: "Ya la presidís.", tipo: "aviso" };
    if (C.nivel > R0.nivelPres) return { msg: `Para presidir ${C.nombre} necesitás más peso: ${R0.nivelPres ? "con tu rango solo alcanzan comisiones de menor jerarquía" : "todavía no te alcanza para ninguna presidencia"}.`, tipo: "aviso" };
    if (presidencias() >= R0.pres) return { msg: "Ya presidís todas las comisiones que te permite tu peso.", tipo: "aviso" };
    const anio = Math.ceil((S.mes || 1) / 12);
    if (pl.intentos[id] === anio) return { msg: "Ya peleaste esa presidencia este año: el reparto se reabre el año que viene.", tipo: "aviso" };
    pl.intentos[id] = anio;
  }
  pl.rondas--;
  const relMedia = Object.values(S.relBloques).reduce((a, v) => a + v, 0) / Math.max(1, Object.keys(S.relBloques).length);
  const ch = cargo === "vocal" ? 0.85 : R.clamp(0.25 + sharePropio() * 1.2 + pl.peso / 150 + relMedia / 300 + (S.oficialismo ? 0.1 : 0) - C.nivel * 0.08, 0.05, 0.9);
  let msg, tipo;
  if (R.rand() < ch) {
    pl.comisiones[id] = cargo === "pres" ? "pres" : "vocal";
    if (id === "presupuesto" && cargo === "pres") S.comisionPres = true;
    if (cargo === "pres") {
      cambiarPeso(3);
      if (typeof registrarHito === "function") registrarHito({ tipo: "ley", txt: `Presidió la comisión de ${C.nombre} del ${camLeg().sen ? "Senado" : "Congreso"}`, peso: 1 + C.nivel * 0.4, valor: 1 + C.nivel * 0.4, mult: "legislativo" });
      msg = `Te votaron presidente de la comisión de ${C.nombre}. Los proyectos de ese tema pasan por tu escritorio.`;
    } else msg = `Te sumaste a la comisión de ${C.nombre}.`;
    tipo = "bueno";
  } else {
    cambiarPeso(cargo === "pres" ? -1 : 0);
    msg = cargo === "pres" ? `Perdiste la pulseada por la presidencia de ${C.nombre}: los bloques grandes se la repartieron.` : `Tu bloque no te consiguió lugar en ${C.nombre}.`;
    tipo = "malo";
  }
  log(msg, tipo);
  return { msg, tipo };
}
function dejarComision(id) {
  const pl = asegurarPeso(); if (!pl || !pl.comisiones[id]) return { msg: "", tipo: "aviso" };
  if (Object.keys(pl.comisiones).length <= 1) return { msg: "Tenés que integrar al menos una comisión.", tipo: "aviso" };
  delete pl.comisiones[id];
  if (id === "presupuesto") S.comisionPres = false;
  return { msg: `Dejaste la comisión de ${COMISIONES_LEG.find(c => c.id === id).nombre}.`, tipo: "info" };
}

// pagar lo que prometiste
function resolverCobroLeg(uid, op, auto) {
  const pl = asegurarPeso(); if (!pl) return { msg: "", tipo: "info" };
  const c = pl.cobros.find(x => x.uid === uid);
  if (!c || c.resuelto) return { msg: "Ya está resuelto.", tipo: "aviso" };
  if (op === "favores" && S.leg2.recursos < 2) return { msg: "No tenés dos favores para pagar.", tipo: "aviso" };
  c.resuelto = true; c.op = op;
  let msg, tipo = "info";
  const lejos = c.bloque && PARTIDOS[c.bloque] ? Math.abs(PARTIDOS[c.bloque].ideo - S.jugador.ideo) > 25 : false;
  if (op === "cumplir") {
    aplicarLeg({ disciplina: lejos ? -4 : -1, imagen: -1 });
    if (c.bloque && S.relBloques[c.bloque] != null) S.relBloques[c.bloque] += 6;
    if (c.acreedor === "ofi") aplicarLeg({ relPres: 6 });
    pl.palabra = Math.min(100, pl.palabra + 4); cambiarPeso(1);
    msg = `Cumpliste con ${c.nombre}: tus votos fueron para "${c.proyecto}".${lejos ? " A parte de tu bloque no le gustó." : ""} Tu palabra vale.`;
    tipo = "bueno";
  } else if (op === "favores") {
    aplicarLeg({ recursos: -2 }); pl.palabra = Math.min(100, pl.palabra + 1);
    msg = `Le pagaste a ${c.nombre} con obras y cargos en lugar de votos.`;
  } else {
    if (c.bloque && S.relBloques[c.bloque] != null) S.relBloques[c.bloque] -= 20;
    if (c.acreedor === "ofi") aplicarLeg({ relPres: -15 });
    pl.palabra = Math.max(0, pl.palabra - 15); cambiarPeso(-4);
    msg = `${auto ? "No respondiste y " : ""}no le cumpliste a ${c.nombre}. En el Congreso se corre la voz: tu palabra vale menos y negociar te va a costar más.`;
    tipo = "malo";
  }
  log(msg, tipo);
  return { msg, tipo };
}

// lo que pasa con tu peso al cerrar cada mes
function procesarPesoMes() {
  const pl = asegurarPeso(); if (!pl || S.perdio) return [];
  const ev = [], L = S.leg2;
  if (S.comisionPres && pl.comisiones.presupuesto !== "pres") pl.comisiones.presupuesto = "pres";
  for (const c of pl.cobros.filter(x => !x.resuelto && S.mes > x.mes)) { const r = resolverCobroLeg(c.uid, "incumplir", true); ev.push({ titulo: "Promesa incumplida", texto: r.msg, tipo: "malo" }); }
  const ajenos = PROYECTOS_LEG.filter(p => p.id !== "__propio");
  for (const d of pl.deudas.filter(x => !x.cobrado && x.vence <= S.mes)) {
    d.cobrado = true;
    const proyecto = R.pick(ajenos).nombre;
    pl.cobros.push({ uid: d.uid, acreedor: d.acreedor, nombre: d.nombre, bloque: d.bloque, mes: S.mes, proyecto, resuelto: false });
    ev.push({ titulo: "Te pasan la factura", texto: `${d.nombre} te recuerda la promesa: quiere tus votos para "${proyecto}". Tenés un mes para cumplir.`, tipo: "aviso" });
  }
  // el peso se mueve: lo sostienen tus bancas, tus cargos y tus leyes; sin novedades, se apaga de a poco
  const antes = idxRango();
  const base = 10 + sharePropio() * 70 + presidencias() * 6 + (pl.vice ? 8 : 0) + Math.min(L.leyesPropias, 5) * 2;
  cambiarPeso((base - pl.peso) * 0.06 - 0.2 + (L.imagen - 45) / 80);
  const ahora = idxRango();
  if (ahora !== antes) ev.push({ titulo: ahora > antes ? "Subís en la Cámara" : "Perdés peso en la Cámara", texto: `Ahora sos ${rangoLeg().nombre.toLowerCase()} (peso ${Math.round(pl.peso)}). ${rangoLeg().txt}`, tipo: ahora > antes ? "bueno" : "malo" });
  if (pl.peso >= 80 && !pl.vice) {
    pl.vice = true;
    ev.push({ titulo: `Vicepresidente ${camLeg().sen ? "del Senado" : "de la Cámara"}`, texto: "Tu peso te sienta en la mesa que arma el temario de cada sesión: sumás apoyo propio para tus proyectos y una ronda más de negociación.", tipo: "bueno" });
    if (!pl.figura && typeof registrarHito === "function") { pl.figura = true; registrarHito({ tipo: "ley", txt: `Figura del Congreso: vicepresidente ${camLeg().sen ? "del Senado" : "de la Cámara de Diputados"}`, peso: 3, valor: 3, mult: "legislativo" }); }
  }
  // renovación anual de las comisiones: si tu peso ya no alcanza, perdés presidencias
  if ((S.mes || 1) % 12 === 0) {
    const R0 = rangoLeg();
    const pres = Object.keys(pl.comisiones).filter(k => pl.comisiones[k] === "pres").sort((a, b) => COMISIONES_LEG.find(c => c.id === b).nivel - COMISIONES_LEG.find(c => c.id === a).nivel);
    const pierde = pres.filter((k, i) => i >= R0.pres || COMISIONES_LEG.find(c => c.id === k).nivel > R0.nivelPres);
    for (const k of pierde) { pl.comisiones[k] = "vocal"; if (k === "presupuesto") S.comisionPres = false; }
    if (pierde.length) ev.push({ titulo: "Reparto de comisiones", texto: `Con tu peso actual perdés la presidencia de ${pierde.map(k => COMISIONES_LEG.find(c => c.id === k).nombre).join(" y ")}. Seguís como vocal.`, tipo: "malo" });
    if (pl.vice && pl.peso < 65) { pl.vice = false; ev.push({ titulo: "Perdés la vicepresidencia", texto: "Los bloques eligieron a otro para la vicepresidencia de la Cámara.", tipo: "malo" }); }
  }
  // limpiar negociaciones de proyectos que ya no están en trámite
  for (const k in pl.neg) if (!objNeg(k) || (k.startsWith("tema:") && !S.propiosEnComision.some(pc => "tema:" + pc.id === k))) delete pl.neg[k];
  if (pl.cobros.length > 12) pl.cobros = pl.cobros.slice(-12);
  if (pl.deudas.length > 20) pl.deudas = pl.deudas.filter(d => !d.cobrado).concat(pl.deudas.filter(d => d.cobrado).slice(-5));
  return ev;
}

// la jefatura del bloque depende también del peso: con poco peso te desafían más
function factorJefatura() { const pl = S.pl; if (!pl) return 1; return pl.peso < 15 ? 1.5 : pl.peso >= 50 ? 0.5 : 1; }

// --- enganches con el motor del legislador ---
iniciarLegislatura = (orig => function (mias) { orig(mias); S.pl = null; asegurarPeso(); S.accionesLeg = rangoLeg().acciones; })(iniciarLegislatura);
finTrimestreLeg = (orig => function () {
  const pre = S && S.fase === "legislador" && !S.perdio ? procesarPesoMes() : [];
  const ev = orig();
  if (S.pl && !S.perdio && !S.terminoMandato) { S.pl.rondas = rondasMaxLeg(); S.accionesLeg = rangoLeg().acciones; }
  return [...pre, ...(ev || [])];
})(finTrimestreLeg);

// votación de un proyecto propio del bloque: los acuerdos se notan en el recinto y el resultado mueve el peso
votarRecintoTema = (orig => function (pr, T) {
  const pl = S.pl, N = pl && T && pl.neg["tema:" + T.id];
  if (!N) return orig(pr, T);
  const viejo = { ...S.relBloques };
  for (const k in N.bloques) S.relBloques[k] = (S.relBloques[k] || 0) + N.bloques[k];
  try { return orig(pr, T); } finally { S.relBloques = viejo; }
})(votarRecintoTema);
votarPropio = (orig => function (T, sinDictamen, pasos) {
  const pl = asegurarPeso();
  const msg = orig(T, sinDictamen, pasos);
  if (!pl) return msg;
  const v = pasos[pasos.length - 1], mag = MAG_TEMA[T.id] || 3, N = pl.neg["tema:" + T.id];
  const hechas = N ? N.hechas.length : 0;
  if (v && v.aprobado) {
    cambiarPeso(mag * 1.3 + (hechas ? 0.5 : 0) - (N ? N.concesiones * 0.5 : 0));
    if (mag >= 4 && typeof registrarHito === "function") registrarHito({ tipo: "ley", txt: `Consiguió media sanción para "${T.nombre}"${hechas ? ` tras negociar con ${hechas} ${hechas === 1 ? "sector" : "sectores"}` : ""}`, peso: 1, valor: 1.2, mult: "legislativo" });
  } else cambiarPeso(-mag * 0.8);
  delete pl.neg["tema:" + T.id];
  return msg;
})(votarPropio);

// leyes del redactor: mismo esquema, con la clave "ley:<uid>"
pDictamen = (orig => function (ley, ctx, c) {
  const p = orig(ley, ctx, c);
  if (ctx && ctx.modo === "leg" && ley && ley.propia && ley.uid && S.pl) return R.clamp(p + ajusteDictamenNeg("ley:" + ley.uid), 0.02, 0.85);
  return p;
})(pDictamen);
avanzarLey = (orig => function (ley, primera, sobreTablas) {
  if (!(typeof esLegislador === "function" && esLegislador() && ley && ley.propia && S.pl)) return orig(ley, primera, sobreTablas);
  const clave = "ley:" + ley.uid, N = S.pl.neg[clave], mag = magLey(ley);
  const viejo = { ...S.relBloques };
  if (N) for (const k in N.bloques) S.relBloques[k] = (S.relBloques[k] || 0) + N.bloques[k];
  let r;
  try { r = orig(ley, primera, sobreTablas); } finally { S.relBloques = viejo; }
  if (ley.estado === "sanc") cambiarPeso(mag * 2.5 + (N && N.hechas.length ? 1 : 0));
  else if (ley.estado === "vet") cambiarPeso(mag * 1.5);
  else if (ley.estado === "rech") cambiarPeso(-mag * 0.8);
  if (ley.estado !== "comision" && S.pl) delete S.pl.neg[clave];
  return r;
})(avanzarLey);

// cuando el Ejecutivo necesita tus votos, lo que sacás depende de tu peso y del tema
resolverProyecto = (orig => function (idx, postura) {
  const pr = S.proyLeg && S.proyLeg[idx];
  const r = orig(idx, postura);
  const pl = asegurarPeso();
  if (!r || !pr || !pl) return r;
  const P = PROYECTOS_LEG.find(x => x.id === pr.id);
  const mag = MAG_PROY[pr.id] || (P && P.catalogo ? magLey(LEYES_CATALOGO.find(l => l.id === pr.id)) : 3);
  if (postura === "negociar") {
    const necesita = pr.origen === "ejecutivo" && !S.oficialismo;
    if (pl.peso < 20 && mag >= 4) r.msg += " Con tu peso actual, la Casa Rosada negoció en serio con los bloques grandes: a vos te tocaron migajas.";
    else {
      const extra = Math.round(pl.peso / 35 * mag / 3 * (necesita ? 1 : 0.5));
      if (extra > 0) { aplicarLeg({ recursos: extra }); r.msg += ` Por tu peso (${Math.round(pl.peso)}) y la magnitud del tema sacaste ${extra} ${extra === 1 ? "favor" : "favores"} más.`; }
    }
  }
  if (/decisivos/.test(r.msg)) cambiarPeso(mag * 0.8);
  else if (r.tipo === "bueno") cambiarPeso(0.3);
  return r;
})(resolverProyecto);

puntajeLeg = (orig => function () { const p = orig(); return S.pl ? p + Math.round(S.pl.peso * 0.8) + presidencias() * 10 + (S.pl.vice ? 15 : 0) : p; })(puntajeLeg);

// partidas guardadas antes de esta versión
cargar = (orig => function () {
  const ok = orig();
  if (ok && S) { if (typeof esLocal === "function" && esLocal() && S.fase === "gobiernoLocal") asegurarGest(); if (typeof esLegislador === "function" && esLegislador() && S.fase === "legislador") asegurarPeso(); }
  return ok;
})(cargar);
