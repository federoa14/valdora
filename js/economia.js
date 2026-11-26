// =============================================================
//  VALDORA - Ministerio de Economía y Banco Central (ficticio)
//  Tipo de cambio oficial y paralelo, régimen cambiario, tasa,
//  letras de liquidez, licitaciones y rollover, bonos, deuda,
//  reestructuración y default, impuestos por decreto o por ley,
//  superávit, salarios, canasta, PBI y empleo por sector.
//  Realista pero jugable: las magnitudes están calibradas para el
//  juego, no son un modelo macroeconómico.
// =============================================================

const BANCO_CENTRAL = "Banco Central de la Nación";
const REGIMENES = {
  flotacion: { nombre: "Flotación libre", desc: "El dólar lo fija el mercado. No perdés reservas defendiéndolo, pero cada salto pasa a precios." },
  bandas:    { nombre: "Bandas cambiarias", desc: "El dólar flota entre un piso y un techo que se ajustan cada mes. Si toca el techo, el Banco Central vende reservas." },
  crawling:  { nombre: "Devaluación administrada (crawling peg)", desc: "El Banco Central sube el dólar un porcentaje fijo por mes. Si va por debajo de la inflación, se atrasa." },
  cepo:      { nombre: "Cepo y desdoblamiento", desc: "Control de cambios: protege reservas, pero aparece la brecha con el paralelo, se frenan importaciones y los exportadores liquidan menos." },
  fijo:      { nombre: "Tipo de cambio fijo", desc: "Ancla fuerte contra la inflación mientras haya reservas. Si se acaban, la salida es traumática." },
};
const ERA_ECO = {
  hoy:    { tc: 1450, regimen: "bandas",   brecha: 5,  ret: 26, per: 0,  letras: 1.5, moneda: "$",  pbi: 640, cbt: 790, ingreso: 900,  usd: 0.65 },
  "2015": { tc: 9.7,  regimen: "cepo",     brecha: 55, ret: 35, per: 35, letras: 7,   moneda: "$",  pbi: 590, cbt: 700, ingreso: 1000, usd: 0.6 },
  "2001": { tc: 1,    regimen: "fijo",     brecha: 40, ret: 0,  per: 0,  letras: 0,   moneda: "$",  pbi: 270, cbt: 650, ingreso: 700,  usd: 0.95 },
  "1989": { tc: 650,  regimen: "cepo",     brecha: 80, ret: 25, per: 0,  letras: 4,   moneda: "A",  pbi: 75,  cbt: 280, ingreso: 260,  usd: 0.8 },
  "1983": { tc: 20,   regimen: "crawling", brecha: 30, ret: 15, per: 0,  letras: 2,   moneda: "$a", pbi: 100, cbt: 350, ingreso: 420,  usd: 0.85 },
};
// impuestos: cuáles se tocan por decreto (facultades delegadas) y cuáles necesitan ley
const IMPUESTOS_DECRETO = [
  { id: "ret", nombre: "Retenciones a la soja", min: 0, max: 35, paso: 1, unidad: "%", desc: "Derechos de exportación: el Código Aduanero permite fijarlos por decreto, con topes." },
  { id: "per", nombre: "Percepción a la compra de dólares", min: 0, max: 60, paso: 5, unidad: "%", desc: "Anticipo de impuestos por resolución de la agencia de recaudación. Baja la demanda de dólares." },
];

function ecoEra() { return ERA_ECO[(S && S.cfg && S.cfg.era) || "hoy"] || ERA_ECO.hoy; }
function eco() {
  if (S.eco) return S.eco;
  const e = ecoEra();
  S.eco = {
    tc: e.tc, tc0: e.tc, paralelo: e.tc * (1 + e.brecha / 100), brecha: e.brecha, regimen: S.convertibilidad ? "fijo" : e.regimen,
    crawl: 1.5, auto: true, tasa: 40, letras: e.letras, financiamiento: "mixto", superavit: "deuda", pauta: "libre",
    ret: e.ret, ret0: e.ret, per: e.per, per0: e.per, riesgo: 600, default: false, reestructura: null, refinanciarUSD: true,
    P: 100, W: 100, salarioReal: 100, pbiReal: 100, rer0: 1, rollover: 100, emisionMes: 0, intervencion: 0, ptPendiente: 0,
    emp: { agro: 100, industria: 100, construccion: 100, comercio: 100, servicios: 100, publico: 100 },
    prestamos: [], bonos: [], cambios: [], regimenDesde: 1, regimen0: S.convertibilidad ? "fijo" : e.regimen, brecha0: e.brecha, riesgo0: null,
  };
  S.eco.tasa = tasaAuto();
  return S.eco;
}
function inflAnual(m) { return (Math.pow(1 + (m != null ? m : S.ind.inflacion) / 100, 12) - 1) * 100; }
function tasaAuto() { return R.clamp(Math.round(inflAnual() + 4), 2, 20000); }
function tasaReal() { const E = eco(); return E.tasa - inflAnual(); }
function fmtTC(v) { const E = ecoEra(); return `${E.moneda} ${v >= 100 ? Math.round(v).toLocaleString("es-AR") : fmt(v, 2)}`; }
function vencimientosUSD() { const K = S.escalaRes || 1; return Math.round((3200 + S.ind.deuda * 22) / 3 * K); }
function pbiUSD() { const E = eco(), b = ecoEra(); return b.pbi * E.pbiReal / 100 * (E.P / 100) / (E.tc / E.tc0); }
function deudaPctUSD() { return ecoEra().usd; }
function cambioRegistrado(txt) { const E = eco(); E.cambios.unshift({ mes: S.mes || 1, txt }); if (E.cambios.length > 30) E.cambios.pop(); }

// ---------- Decisiones ----------
function fijarTasa(v) { const E = eco(); if (v === "auto") { E.auto = true; E.tasa = tasaAuto(); } else { E.auto = false; E.tasa = R.clamp(+v, 0, 20000); } return { ok: true, msg: E.auto ? "El Banco Central fija la tasa siguiendo la inflación." : `Tasa de política monetaria: ${E.tasa}% anual (real ${fmt(tasaReal(), 0)}%).` }; }
function cambiarRegimen(r) {
  const E = eco(); if (!REGIMENES[r]) return { ok: false, msg: "Régimen desconocido." };
  if (E.regimen === r) return { ok: false, msg: "Ya rige ese régimen." };
  if (r === "fijo" && S.ind.reservas < 15000 * (S.escalaRes || 1)) return { ok: false, msg: "Para fijar el tipo de cambio necesitás al menos 15.000 millones de reservas: si no, nadie lo cree." };
  const ant = E.regimen; E.regimen = r; E.regimenDesde = S.mes || 1;
  let msg = `Nuevo régimen cambiario: ${REGIMENES[r].nombre}.`;
  if (ant === "cepo" && r !== "cepo") { // salir del cepo: el oficial converge al paralelo
    const salto = Math.max(0, E.brecha * 0.7);
    E.tc *= 1 + salto / 100; E.ptPendiente += salto * 0.45; E.brecha = 6;
    aplicarEfectos({ imagen: -Math.min(8, salto / 6), legitimidad: 1 });
    if (typeof moverActor === "function") { moverActor("mercados", 12); moverActor("campo", 10); moverActor("fmi", 8); }
    msg += ` Se levanta el cepo: el oficial salta ${fmt(salto, 0)}% y se acerca al paralelo.`;
  }
  if (r === "cepo" && ant !== "cepo") { if (typeof moverActor === "function") { moverActor("mercados", -12); moverActor("fmi", -10); } msg += " Los mercados lo leen como señal de debilidad."; }
  cambioRegistrado(msg); log(msg, "aviso");
  if (typeof publicarBoletin === "function") publicarBoletin("resolucion", `Comunicación del ${BANCO_CENTRAL}: ${REGIMENES[r].nombre}`, REGIMENES[r].desc, { organismo: BANCO_CENTRAL });
  return { ok: true, msg, tipo: "aviso" };
}
function devaluar(pct, silencioso) {
  const E = eco(); pct = R.clamp(+pct, 1, 100);
  if (E.regimen === "flotacion") return { ok: false, msg: "Con flotación libre no hay devaluación por decreto: el precio lo pone el mercado." };
  E.tc *= 1 + pct / 100; E.ptPendiente += pct * 0.5; E.brecha = Math.max(0, E.brecha - pct * 0.8);
  aplicarEfectos({ imagen: -pct * 0.18, reservas: pct * 60 });
  if (typeof moverActor === "function") { moverActor("campo", pct * 0.4); moverActor("cgt", -pct * 0.4); }
  const msg = `Devaluación del ${pct}%: el dólar oficial pasa a ${fmtTC(E.tc)}. Mejora la competitividad, pero sube la inflación de los próximos meses.`;
  cambioRegistrado(msg); if (!silencioso) log(msg, "aviso");
  return { ok: true, msg, tipo: "aviso" };
}
function intervenir(monto) {
  const E = eco(), K = S.escalaRes || 1; monto = Math.round(+monto);
  if (monto > 0 && S.ind.reservas < monto * K + 1000 * K) return { ok: false, msg: "No hay reservas suficientes para esa venta." };
  S.ind.reservas -= monto * K; E.intervencion += monto;
  if (monto > 0) { E.brecha = Math.max(0, E.brecha - monto / 180); E.tc *= 1 - Math.min(0.04, monto / 60000); }
  else { E.emisionMes += -monto; }
  const msg = monto > 0 ? `El Banco Central vendió US$ ${monto.toLocaleString("es-AR")} M para calmar el dólar.` : `El Banco Central compró US$ ${(-monto).toLocaleString("es-AR")} M emitiendo pesos.`;
  log(msg, "info"); return { ok: true, msg };
}
function moverLetras(d) {
  const E = eco(); E.letras = R.clamp(E.letras + d, 0, 15);
  const msg = d > 0 ? `El Banco Central coloca letras de liquidez: absorbe pesos (stock ${fmt(E.letras)}% del PBI). Paga intereses: déficit cuasifiscal.` : `El Banco Central rescata letras: libera pesos (stock ${fmt(E.letras)}% del PBI).`;
  log(msg, "info"); return { ok: true, msg };
}
function colocarBono(moneda) {
  const E = eco(), K = S.escalaRes || 1;
  if (E.default) return { ok: false, msg: "En default nadie te presta: primero hay que reestructurar." };
  if (moneda === "usd" && E.riesgo > 1100) return { ok: false, msg: `Con riesgo país de ${Math.round(E.riesgo)} puntos los mercados internacionales están cerrados.` };
  const tasa = moneda === "usd" ? 4 + E.riesgo / 100 + (S.mundo ? S.mundo.tasa - S.mundo.base.tasa : 0) : Math.max(5, E.tasa + 2);
  const monto = moneda === "usd" ? 2500 : 0;
  if (moneda === "usd") { S.ind.reservas += monto * K; S.ind.deuda += monto / (pbiUSD() * 10); }
  else { S.ind.deficit -= 0.2; S.ind.deuda += 0.4; E.rollover = Math.min(130, E.rollover + 15); }
  E.bonos.unshift({ mes: S.mes || 1, moneda, tasa, monto });
  const nombre = moneda === "usd" ? `Bono Nación 2035 en dólares por US$ ${monto.toLocaleString("es-AR")} M al ${fmt(tasa)}%` : `Bono en pesos ajustado por inflación, tasa real ${fmt(tasa - inflAnual(), 0)}%`;
  if (typeof publicarBoletin === "function") publicarBoletin("resolucion", `Emisión: ${nombre}`, "Resolución conjunta de las secretarías de Finanzas y Hacienda.", { organismo: "Ministerio de Economía" });
  const msg = `Licitación exitosa: ${nombre}.`; log(msg, "info"); return { ok: true, msg };
}
function declararDefault() {
  const E = eco(); if (E.default) return { ok: false, msg: "Ya estás en cesación de pagos." };
  E.default = true; E.defaultDesde = S.mes || 1;
  aplicarEfectos({ legitimidad: -6, imagen: 3 });
  if (typeof moverActor === "function") { moverActor("mercados", -40); moverActor("fmi", -25); moverActor("norte", -10); }
  const msg = "Declarás la cesación de pagos de la deuda en dólares con privados. Dejan de salir reservas, pero se cierra el crédito y la inversión.";
  cambioRegistrado(msg); log(msg, "malo"); titular("Diario El Faro", "El país vuelve al default");
  return { ok: true, msg, tipo: "malo" };
}
function reestructurar(quita) {
  const E = eco(); quita = +quita;
  if (E.reestructura) return { ok: false, msg: "Ya hay una negociación con los acreedores en curso." };
  if (!E.default && E.riesgo < 1200) return { ok: false, msg: "Con este riesgo país una reestructuración asusta más de lo que ayuda: los mercados todavía te financian." };
  E.reestructura = { quita, desde: S.mes || 1, fin: (S.mes || 1) + 4 };
  const msg = `Abrís la negociación con los acreedores: proponés una quita del ${quita}% del valor y más plazo. La respuesta llega en cuatro meses.`;
  log(msg, "aviso"); return { ok: true, msg, tipo: "aviso" };
}
function firmarImpuestos(cambios) {
  const E = eco(); const txt = [];
  for (const it of IMPUESTOS_DECRETO) if (cambios[it.id] != null && +cambios[it.id] !== E[it.id]) {
    const v = R.clamp(+cambios[it.id], it.min, it.max), d = v - E[it.id]; E[it.id] = v;
    if (it.id === "ret" && typeof moverActor === "function") { moverActor("campo", -d * 1.4); if (S.jugador.sym) S.jugador.sym.campo -= d * 0.03; }
    if (it.id === "per" && S.jugador.sym) S.jugador.sym.media -= d * 0.006;
    txt.push(`${it.nombre}: ${v}%`);
  }
  if (!txt.length) return { ok: false, msg: "No cambiaste ningún impuesto." };
  if (typeof publicarBoletin === "function") publicarBoletin("decreto", "Modificación de alícuotas: " + txt.join(", "), "Decreto en uso de facultades delegadas.", { organismo: "Poder Ejecutivo" });
  const msg = "Firmaste el decreto. " + txt.join(". ") + ".";
  log(msg, "info"); return { ok: true, msg };
}

// ---------- Préstamos de organismos internacionales ----------
const ORGANISMOS = [
  { id: "fondo", nombre: "Fondo Monetario Mundial", corto: "el Fondo", monto: 15000, tramos: 8, tasa: 6.5, congreso: true,
    desc: "Préstamo grande con revisiones cada tres meses: meta de déficit, acumulación de reservas y, después del primer año, salir del cepo. Si no cumplís, frena los desembolsos." },
  { id: "bmd", nombre: "Banco Mundial de Desarrollo", corto: "el BMD", monto: 2000, tramos: 4, tasa: 4.5, area: "social",
    desc: "Financia programas sociales y de infraestructura. Exige no recortar la partida que financia." },
  { id: "brd", nombre: "Banco Regional de Desarrollo", corto: "el BRD", monto: 1500, tramos: 3, tasa: 5, area: "infra",
    desc: "Crédito para obras. Exige ejecutar la obra: la partida de infraestructura no puede bajar." },
  { id: "fomento", nombre: "Corporación de Fomento del Sur", corto: "la CFS", monto: 1000, tramos: 2, tasa: 6, area: null,
    desc: "Banco de los países de la región: poco dinero, pocas condiciones." },
  { id: "swap", nombre: "Swap con la República Popular del Este", corto: "el swap", monto: 5000, tramos: 1, tasa: 7, pais: "este",
    desc: "Intercambio de monedas: engrosa las reservas al instante. Si la relación con el Este se rompe, pueden no renovarlo." },
];
function prestamoActivo(id) { return eco().prestamos.find(p => p.id === id && p.estado !== "cancelado"); }
function pedirPrestamo(id) {
  const E = eco(), O = ORGANISMOS.find(o => o.id === id), K = S.escalaRes || 1;
  if (!O) return { ok: false, msg: "Organismo desconocido." };
  if (prestamoActivo(id)) return { ok: false, msg: `Ya tenés un programa vigente con ${O.corto}.` };
  if (O.pais && typeof relPais === "function" && relPais(O.pais) < -10) return { ok: false, msg: `La relación con ${nombrePais(O.pais)} no da para un swap.` };
  if (E.default && id !== "swap" && id !== "fomento") return { ok: false, msg: "En default los organismos exigen un plan de reestructuración antes de prestar." };
  let pasos = [];
  if (O.congreso) { // el acuerdo con el Fondo pasa por el Congreso
    const v = votarCamara("dip", { ideo: 60 }); pasos.push(v);
    if (!v.aprobado) { const msg = "Diputados rechazó el acuerdo con el Fondo."; log(msg, "malo"); return { ok: true, msg, pasos, tipo: "malo" }; }
  }
  const P = { id, desde: S.mes || 1, estado: "vigente", desembolsado: 0, tramosPend: O.tramos, metaDeficit: Math.max(0, S.ind.deficit - 1.5), metaReservas: S.ind.reservas + 3000 * K, revisiones: 0, fallas: 0 };
  const primer = Math.round(O.monto / O.tramos * (O.tramos > 1 ? 2 : 1));
  P.desembolsado += primer; P.tramosPend -= O.tramos > 1 ? 2 : 1;
  S.ind.reservas += primer * K; S.ind.deuda += O.monto / (pbiUSD() * 10);
  E.prestamos.push(P);
  if (id === "fondo") { S.fmi = { activo: true, metaDeficit: P.metaDeficit, trimestres: 8, v2: true }; if (typeof moverActor === "function") moverActor("fmi", 10); aplicarEfectos({ imagen: -3 }); }
  if (id === "swap" && typeof moverPais === "function") moverPais("este", 5);
  const msg = `Acuerdo con ${O.nombre}: entran US$ ${primer.toLocaleString("es-AR")} M ahora${P.tramosPend > 0 ? ` y ${P.tramosPend} tramos más si cumplís las condiciones` : ""}.${id === "fondo" ? ` Meta de déficit: ${fmt(P.metaDeficit)}% del PBI.` : ""}`;
  if (typeof publicarBoletin === "function") publicarBoletin(O.congreso ? "ley" : "decreto", `Apruébase el acuerdo con ${O.nombre}`, O.desc, { organismo: O.congreso ? "Congreso de la Nación" : "Poder Ejecutivo" });
  log(msg, "info"); return { ok: true, msg, pasos };
}
// las revisiones: acá están las complicaciones posteriores
function revisarPrestamos(eventos) {
  const E = eco(), K = S.escalaRes || 1, mes = S.mes || 1;
  for (const P of E.prestamos) {
    if (P.estado === "cancelado" || P.estado === "pagado") continue;
    const O = ORGANISMOS.find(o => o.id === P.id);
    S.ind.reservas -= O.monto * (O.tasa / 100) / 12 * (P.desembolsado / O.monto) * K; // intereses y sobrecargos
    if (P.id === "swap") { if (relPais("este") < -30 && P.estado === "vigente") { P.estado = "cancelado"; S.ind.reservas -= P.desembolsado * K * 0.6; eventos.push({ titulo: "El Este no renueva el swap", texto: "Tras el deterioro de la relación, la República Popular del Este activa la cláusula de cancelación: hay que devolver buena parte del swap.", tipo: "malo" }); } continue; }
    if ((mes - P.desde) % 3 !== 0 || mes === P.desde) continue;
    P.revisiones++;
    let fallas = [];
    if (P.id === "fondo") {
      P.metaDeficit = Math.max(0, P.metaDeficit - 0.25);
      if (S.ind.deficit > P.metaDeficit + 0.3) fallas.push(`déficit de ${fmt(S.ind.deficit)}% contra una meta de ${fmt(P.metaDeficit)}%`);
      if (S.ind.reservas < P.metaReservas) fallas.push("no acumulaste las reservas comprometidas");
      if (E.regimen === "cepo" && mes - P.desde >= 12) fallas.push("sigue el cepo cambiario");
      P.metaReservas += 1000 * K;
    } else if (O.area && S.presupuesto[O.area] < 0) fallas.push(`recortaste la partida de ${AREAS.find(a => a.id === O.area).nombre}`);
    if (E.default && P.id !== "fomento") fallas.push("entraste en default con los privados");
    const waiver = fallas.length === 1 && R.rand() < 0.35 + (typeof relPais === "function" ? relPais("norte") / 300 : 0) + (S.ministroEco && S.ministroEco.id === "ortodoxo" ? 0.15 : 0);
    if (!fallas.length || waiver) {
      if (P.tramosPend > 0) { const t = Math.round(O.monto / O.tramos); P.tramosPend--; P.desembolsado += t; S.ind.reservas += t * K; P.estado = "vigente"; }
      eventos.push({ titulo: `Revisión de ${O.nombre}`, texto: waiver ? `No se cumplió todo (${fallas[0]}), pero ${O.corto} otorga un perdón ("waiver") y gira el desembolso. A cambio pide más ajuste el próximo trimestre.` : `${O.corto[0].toUpperCase() + O.corto.slice(1)} aprueba la revisión${P.tramosPend >= 0 ? " y gira el siguiente tramo" : ""}.`, tipo: waiver ? "aviso" : "bueno" });
      if (waiver && P.id === "fondo") P.metaDeficit = Math.max(0, P.metaDeficit - 0.3);
    } else {
      P.fallas++; P.estado = "suspendido";
      aplicarEfectos({ reservas: -800, legitimidad: -2 });
      if (typeof moverActor === "function") { moverActor("mercados", -8); if (P.id === "fondo") moverActor("fmi", -12); }
      E.riesgo += P.id === "fondo" ? 180 : 40;
      eventos.push({ titulo: `${O.nombre} frena los desembolsos`, texto: `Incumpliste: ${fallas.join("; ")}. Se suspenden los giros y sube el riesgo país.${P.id === "fondo" && P.fallas >= 2 ? " El Fondo exige un ajuste fuerte para retomar el programa." : ""}`, tipo: "malo" });
      if (P.id === "fondo" && P.fallas >= 2 && typeof DILEMAS !== "undefined") (S.mundo ? (S.mundo.colaExp = S.mundo.colaExp || []) : []).push("fondoExige");
    }
    if (P.tramosPend <= 0 && P.revisiones >= O.tramos) P.estado = "pagado";
  }
  if (S.fmi && S.fmi.v2) { const f = prestamoActivo("fondo"); S.fmi.activo = !!(f && f.estado === "vigente"); if (f) S.fmi.metaDeficit = f.metaDeficit; }
}
if (typeof DILEMAS !== "undefined" && !DILEMAS.find(d => d.id === "fondoExige")) DILEMAS.push({ id: "fondoExige", titulo: "El Fondo exige un ajuste para retomar el programa", peso: 0, cond: () => false,
  texto: "La misión técnica del Fondo Monetario Mundial llega a Buenos Aires con una lista: bajar subsidios a la energía, reformar el régimen previsional y unificar el tipo de cambio. Sin eso, no hay más desembolsos.",
  opciones: [
    { t: "Aceptar el paquete completo", pista: "Vuelven los desembolsos; protestas y caída de imagen", ind: { deficit: -1, tension: 6, imagen: -4 }, act: { fmi: 20, mercados: 10, cgt: -15 } },
    { t: "Negociar un programa más gradual", pista: "Depende del ministro y de la Federación del Norte", ind: { deficit: -0.4, tension: 2 }, act: { fmi: 6 } },
    { t: "Romper con el Fondo", pista: "Épica soberana; sin crédito y con el riesgo país por las nubes", ind: { imagen: 4, reservas: -1500 }, act: { fmi: -30, mercados: -20 } },
  ] });
// la revisión vieja del Fondo queda reemplazada por la de este módulo
(() => { const ev = typeof EVENTOS_GOB !== "undefined" && EVENTOS_GOB.find(e => e.id === "fmiRevision"); if (ev) { const c = ev.cond; ev.cond = s => c(s) && !(s.fmi && s.fmi.v2); } })();
resolverExpediente = (orig => function (idx, op) {
  const exp = S.expedientes && S.expedientes[idx];
  const r = orig(idx, op);
  if (exp && exp.id === "fondoExige") {
    const f = prestamoActivo("fondo");
    if (f) { if (op === 0 || (op === 1 && R.rand() < 0.5 + (S.ministroEco && S.ministroEco.id === "ortodoxo" ? 0.2 : 0))) { f.estado = "vigente"; f.fallas = 0; r.msg = (r.msg + " El Fondo retoma el programa.").trim(); } else if (op === 2) { f.estado = "cancelado"; if (S.fmi) S.fmi.activo = false; } }
  }
  return r;
})(resolverExpediente);

// ---------- Paso mensual ----------
function pasoEconomia(eventos) {
  const E = eco(), I = S.ind, K = S.escalaRes || 1, M = typeof mundo === "function" ? mundo() : null;
  const inflM = I.inflacion, inflA = inflAnual(inflM);
  if (E.auto) E.tasa = tasaAuto();
  const tReal = R.clamp(E.tasa - inflA, -40, 40); // tasa real acotada (en hiperinflación se mide mes a mes)
  // presión cambiaria: tasa real negativa, pocas reservas, riesgo alto, emisión
  if (E.res0 == null) E.res0 = I.reservas;
  const umbralP = Math.max(900, (E.riesgo0 || E.riesgo) + 100);
  const presion = Math.max(0, -tReal) * 0.08 + Math.max(0, Math.min(12000 * K, E.res0 * 0.8) - I.reservas) / (2500 * K) + Math.max(0, E.riesgo - umbralP) / 400 + Math.max(0, I.deficit - 3) * 0.6 + (M ? Math.max(0, M.tasa - M.base.tasa) * 0.5 : 0) - E.per * 0.02;
  E.presion = presion;
  // tipo de cambio oficial
  let dev;
  switch (E.regimen) {
    case "flotacion": dev = inflM * 0.9 + presion * 1.2 + R.gauss() * 1.2 - E.intervencion / 400; break;
    case "bandas": dev = Math.min(inflM * 0.8 + presion * 0.8 + R.gauss() * 0.8, 1 + inflM * 0.6 + 1.2); if (presion > 2) { const venta = Math.round((presion - 2) * 250); I.reservas -= venta * K; E.ventasBanda = venta; } else E.ventasBanda = 0; break;
    case "crawling": dev = E.crawl; break;
    case "cepo": dev = E.crawl; break;
    case "fijo": dev = 0; break;
  }
  dev = Math.max(-3, dev);
  E.tc *= 1 + dev / 100;
  // brecha con el paralelo
  const objBrecha = E.regimen === "cepo" ? 25 + presion * 12 - E.per * 0.2 : E.regimen === "fijo" ? Math.max(0, presion * 6 - 2) : E.regimen === "crawling" ? 6 + presion * 5 : E.regimen === "bandas" ? 3 + presion * 2 : 2 + presion;
  E.brecha = R.clamp(E.brecha + (objBrecha - E.brecha) * 0.35 + R.gauss() * 1.5 - E.intervencion / 300, 0, 250);
  E.paralelo = E.tc * (1 + E.brecha / 100);
  // tipo de cambio real (competitividad)
  const rer = (E.tc / E.tc0) / (E.P / 100) * Math.pow(1.002, (S.mes || 1)); E.rer = rer;
  const comp = R.clamp(rer - 1, -0.5, 0.8);
  // licitación de deuda en pesos (rollover)
  E.rollover = R.clamp(E.rollover + ((100 + tReal * 0.8 + (E.riesgo < 800 ? 8 : -6) - (inflA > 100 ? 20 : 0) - (E.default ? 15 : 0)) - E.rollover) * 0.5 + R.gauss() * 4, 40, 140);
  // riesgo país
  const fondoOk = typeof prestamoActivo === "function" && prestamoActivo("fondo") && prestamoActivo("fondo").estado === "vigente";
  const objRiesgo = 250 + Math.max(0, I.deuda - 40) * 9 + Math.max(0, 15000 * K - I.reservas) / (18 * K) + Math.max(0, I.deficit - 1) * 55 + Math.max(0, Math.min(inflA, 400) - 30) * 2.5 + (M ? (M.tasa - M.base.tasa) * 70 : 0) + E.brecha * 3.5 + (E.default ? 3200 : 0) - (fondoOk ? 150 : 0);
  if (E.riesgo0 == null) { E.riesgo0 = objRiesgo; E.riesgo = objRiesgo; }
  E.riesgo = Math.max(150, E.riesgo + (objRiesgo - E.riesgo) * 0.3 + R.gauss() * 30);
  const rUmbral = Math.max(900, E.riesgo0 + 100), dBrecha = E.brecha - E.brecha0;
  const REG = { fijo: -0.8, cepo: 0.15 }, regC = (REG[E.regimen] || 0) - (REG[E.regimen0] || 0);
  // reestructuración en curso
  if (E.reestructura && (S.mes || 1) >= E.reestructura.fin) {
    const q = E.reestructura.quita, p = R.clamp(0.95 - q / 85 + (fondoOk ? 0.15 : 0) + (typeof relPais === "function" ? relPais("norte") / 400 : 0), 0.1, 0.95);
    if (R.rand() < p) {
      I.deuda *= 1 - (q / 100) * deudaPctUSD() * 0.8; E.default = false; E.riesgo = Math.max(700, E.riesgo * (0.55 - q / 400));
      eventos.push({ titulo: "Acuerdo con los acreedores", texto: `El ${Math.round(70 + R.rand() * 25)}% de los bonistas acepta la quita del ${q}%. Baja la deuda y vuelve, de a poco, el crédito. Algunos fondos litigan en tribunales del Norte.`, tipo: "bueno" });
      if (typeof moverActor === "function") moverActor("mercados", 15);
    } else {
      E.riesgo += 300;
      eventos.push({ titulo: "Los acreedores rechazan la oferta", texto: `La quita del ${q}% fue demasiado agresiva y no alcanzó la adhesión necesaria. Hay que mejorar la propuesta.`, tipo: "malo" });
    }
    E.reestructura = null;
  }
  // efectos sobre los objetivos del mes
  const pt = Math.min(E.ptPendiente, Math.max(1.5, E.ptPendiente * 0.4)); E.ptPendiente -= pt;
  const cuasi = E.letras * (E.tasa / 100) / 12; // intereses de las letras, % PBI por mes
  const ef = {
    inflacion: -Math.max(-30, tReal - 4) * 0.018 + pt + (dev - inflM * 0.85) * 0.25 + (1 - E.rollover / 100) * 0.9 + cuasi * 1.2 - E.letras * 0.04 + E.emisionMes / 3000
      + regC + (E.financiamiento === "emision" ? Math.max(0, I.deficit) * 0.25 : E.financiamiento === "deuda" ? -Math.max(0, I.deficit) * 0.15 : 0)
      + (E.pauta === "baja" ? -0.25 : E.pauta === "alta" ? 0.25 : 0) + dBrecha * 0.004,
    crecimiento: -Math.max(-20, tReal - 4) * 0.04 + comp * 1.6 - (E.regimen === "cepo" ? dBrecha * 0.015 : 0) - Math.max(0, E.riesgo - rUmbral) / 900 - (E.default ? 1.2 : 0) - (E.ret - E.ret0) * 0.04 + (E.financiamiento === "deuda" ? -0.1 : 0),
    reservas: Math.max(-20, tReal - 4) * 20 + comp * 1400 - (E.regimen === "cepo" ? dBrecha * 12 : 0) + (E.regimen === "cepo" && E.regimen0 !== "cepo" ? 500 : 0) - Math.max(0, E.riesgo - rUmbral - 100) * 0.6 - (E.ret - E.ret0) * 45 + (E.per - E.per0) * 8 + (E.default ? vencimientosUSD() / K * 0.85 : 0)
      + (E.refinanciarUSD && !E.default ? vencimientosUSD() / K * Math.max(0, 1 - E.riesgo / 1100) * 0.5 : 0) - (E.regimen === "fijo" && E.regimen0 !== "fijo" ? presion * 300 : 0),
    deficit: -(E.ret - E.ret0) * 0.035 - (E.per - E.per0) * 0.008 + (E.financiamiento === "deuda" ? 0.15 : 0) + (E.riesgo > rUmbral + 100 && !E.default ? 0.15 : 0),
    pobreza: -(E.salarioReal - 100) * 0.03,
    tension: (E.pauta === "baja" ? 2 : 0) + Math.max(0, dBrecha - 20) * 0.05,
    deuda: I.deficit < 0 && E.superavit === "deuda" ? I.deficit * 0.6 : 0,
  };
  if (I.deficit < 0) { // destino del superávit
    if (E.superavit === "reservas") ef.reservas += -I.deficit * 350;
    if (E.superavit === "impuestos") { ef.crecimiento += -I.deficit * 0.25; ef.deficit += -I.deficit * 0.3; }
    if (E.superavit === "gasto") { ef.tension -= -I.deficit * 2; ef.imagen = (ef.imagen || 0) + -I.deficit * 1.5; ef.deficit += -I.deficit * 0.3; }
  }
  E.efMes = ef; E.dev = dev;
  E.intervencion = 0; E.emisionMes = 0;
  revisarPrestamos(eventos);
}
EXTRA_ECO.push(() => (S && S.fase === "gobierno" && S.eco && S.eco.efMes) ? S.eco.efMes : {});

// después de la economía del mes: precios, salarios, canasta, PBI y empleo por sector
function postEconomia() {
  const E = eco(), I = S.ind, M = S.mundo;
  const inflPrev = E.inflPrev != null ? E.inflPrev : I.inflacion;
  E.P *= 1 + I.inflacion / 100;
  const pauta = E.pauta === "baja" ? 0.85 : E.pauta === "alta" ? 1.1 : 1;
  E.W *= 1 + (inflPrev * pauta + I.crecimiento * 0.03 - Math.max(0, I.desempleo - 8) * 0.05) / 100;
  E.salarioReal = E.W / E.P * 100;
  E.pbiReal *= 1 + I.crecimiento / 1200;
  E.inflPrev = I.inflacion;
  const infra = (S.presupuesto.infra || 0) / 100, pub = Object.values(S.presupuesto).reduce((a, v) => a + v, 0) / (8 * 100);
  const comp = R.clamp((E.rer || 1) - 1, -0.5, 0.8), tR = E.tasa - inflAnual(), dS = M ? M.soja / M.base.soja - 1 : 0;
  const g = {
    agro: dS * 1.2 + comp * 1.5 - (E.ret - E.ret0) * 0.06 + I.crecimiento * 0.1,
    industria: comp * 2 + I.crecimiento * 0.35 - Math.max(0, tR - 8) * 0.03 - (E.regimen === "cepo" ? 0.2 : 0),
    construccion: infra * 6 + I.crecimiento * 0.5 - Math.max(0, tR - 8) * 0.04,
    comercio: (E.salarioReal - 100) * 0.05 + I.crecimiento * 0.3,
    servicios: I.crecimiento * 0.3,
    publico: pub * 4,
  };
  for (const k in E.emp) E.emp[k] = R.clamp(E.emp[k] * (1 + g[k] / 100 * 0.35), 60, 160);
  // indigencia: pobreza extrema, sensible al salario real y a la asistencia social
  const asistencia = (S.presupuesto.social || 0) / 100;
  I.indigencia = R.clamp(I.pobreza * 0.21 + Math.max(0, 100 - E.salarioReal) * 0.07 - asistencia * 2.5 - (typeof bonusIndigencia === "function" ? bonusIndigencia() : 0), 1.5, 40);
  // series para gráficos (quedan en el historial mensual)
  Object.assign(I, { dolar: E.tc, paralelo: E.paralelo, brecha: E.brecha, riesgo: E.riesgo, salarioReal: E.salarioReal, tasaBC: E.tasa,
    empAgro: E.emp.agro, empIndustria: E.emp.industria, empConstruccion: E.emp.construccion, empComercio: E.emp.comercio, empServicios: E.emp.servicios, empPublico: E.emp.publico });
  if (M) Object.assign(I, { petroleo: M.petroleo, oro: M.oro, soja: M.soja, tasaInt: M.tasa });
}

// enganche: el mes del gobierno nacional pasa por el mundo y la economía
simularEconomia = (orig => function () {
  if (!S || S.fase !== "gobierno") return orig();
  S._eventosMes = S._eventosMes || [];
  if (typeof pasoMundo === "function") pasoMundo(S._eventosMes);
  pasoEconomia(S._eventosMes);
  orig();
  postEconomia();
})(simularEconomia);

// las decisiones grandes del ministerio ocupan agenda (las del Banco Central, no)
for (const n of ["cambiarRegimen", "devaluar", "colocarBono", "declararDefault", "reestructurar", "pedirPrestamo", "firmarImpuestos"]) {
  const orig = globalThis[n];
  globalThis[n] = function (...a) { if (n === "devaluar" && a[1] === true) return orig.apply(this, a); return conCasillero(1, () => orig.apply(this, a)); };
}
// impuestos que necesitan ley: van al Congreso con el motor de proyectos
function impuestoPorLey(id, dir) {
  return conCasillero(1, () => {
    if (typeof redactarProyecto !== "function") return { ok: false, msg: "No disponible." };
    const r = enviarProyecto(redactarProyecto("impuesto", id, dir));
    return r;
  });
}
function interesesDeuda() { const E = eco(); return S.ind.deuda * (0.035 + Math.min(0.05, E.riesgo / 40000)) * (E.default ? 0.3 : 1); }
