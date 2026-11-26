// =============================================================
//  VALDORA - El mundo: petróleo, oro, granos y tasas internacionales
//  que fluctúan; crisis internacionales y nacionales que llegan al
//  despacho como expedientes. Países y organismos ficticios,
//  inspirados en los conflictos y bloques actuales.
// =============================================================

const MUNDO_BASE = {
  hoy:    { petroleo: 72, oro: 3200, soja: 400, tasa: 4.25, oroTon: 61.7, exportadorEnergia: true },
  "1983": { petroleo: 29, oro: 420,  soja: 280, tasa: 9.5,  oroTon: 137,  exportadorEnergia: false },
  "1989": { petroleo: 18, oro: 380,  soja: 250, tasa: 9,    oroTon: 137,  exportadorEnergia: false },
  "2001": { petroleo: 20, oro: 280,  soja: 170, tasa: 2,    oroTon: 0.9,  exportadorEnergia: true },
  "2015": { petroleo: 45, oro: 1100, soja: 330, tasa: 0.5,  oroTon: 61.7, exportadorEnergia: false },
};
const OZ_POR_TON = 32150.7;

// países y bloques (ficticios)
const PAISES = [
  { id: "norte",    nombre: "Federación del Norte",          bloque: "Occidente", desc: "Primera potencia militar y financiera. Controla el voto decisivo en el Fondo." },
  { id: "este",     nombre: "República Popular del Este",    bloque: "Oriente",   desc: "Fábrica del mundo y principal comprador de granos. Ofrece swaps e infraestructura." },
  { id: "union",    nombre: "Unión Continental",             bloque: "Occidente", desc: "Bloque de democracias del otro lado del océano. Mercado grande, exigente en normas ambientales." },
  { id: "brasilia", nombre: "Brasilia del Sur",              bloque: "Región",    desc: "El gran vecino y socio del Mercado Común. Lo que le pasa, te pasa." },
  { id: "eurasia",  nombre: "Confederación Euroasiática",    bloque: "Oriente",   desc: "Potencia energética y nuclear, en guerra con un vecino. Vende fertilizantes y gas." },
  { id: "golfo",    nombre: "Reinos del Golfo de Arén",      bloque: "Otros",     desc: "Monarquías petroleras con fondos soberanos que buscan dónde invertir." },
  { id: "andes",    nombre: "Pacto Andino del Pacífico",     bloque: "Región",    desc: "Vecinos del oeste: litio, cobre y salida al Pacífico." },
];
const ONF = { corto: "ONF", nombre: "Organización de Naciones Federadas", consejo: "Consejo de Paz y Seguridad" };

function mundoBaseEra() { return MUNDO_BASE[(S && S.cfg && S.cfg.era) || "hoy"] || MUNDO_BASE.hoy; }
function mundo() {
  if (S.mundo) return S.mundo;
  const b = mundoBaseEra();
  S.mundo = {
    petroleo: b.petroleo, oro: b.oro, soja: b.soja, tasa: b.tasa, oroTon: b.oroTon,
    base: { petroleo: b.petroleo, oro: b.oro, soja: b.soja, tasa: b.tasa },
    prev: { petroleo: b.petroleo, oro: b.oro, soja: b.soja, tasa: b.tasa },
    shock: { petroleo: 1, oro: 1, soja: 1, tasa: 0 },
    crisis: [], historialCrisis: [], ultimaCrisis: 0,
    rel: { norte: 10, este: 5, union: 10, brasilia: 25, eurasia: 0, golfo: 5, andes: 20 },
    acuerdos: [], secretos: [], prestamos: [],
    onf: { consejo: false, candidatura: null, votos: [], cascos: 0, prestigio: 50 },
    efMes: {},
  };
  return S.mundo;
}
function relPais(id) { const M = mundo(); if (id === "norte" && S.actoresRel && "norte" in S.actoresRel) return (S.actoresRel.norte - 50) * 2; return M.rel[id] || 0; }
function moverPais(id, d) {
  const M = mundo();
  if (id === "norte" && typeof moverActor === "function" && S.actoresRel && "norte" in S.actoresRel) moverActor("norte", d / 2);
  M.rel[id] = R.clamp((M.rel[id] || 0) + d, -100, 100);
}
function nombrePais(id) { const p = PAISES.find(x => x.id === id); return p ? p.nombre : id; }

// ---------- Crisis ----------
// shock: multiplicadores de precios mientras dura · mes: efecto mensual en indicadores
// dilema: expediente que llega al despacho cuando arranca
const CRISIS = [
  { id: "guerraEste", tipo: "internacional", titulo: "Guerra en las estepas del Este", dur: [8, 20], peso: 1,
    texto: "La Confederación Euroasiática invade a un país vecino. Se disparan el petróleo, el gas y los granos; la Federación del Norte y la Unión Continental preparan sanciones.",
    shock: { petroleo: 1.28, soja: 1.18, oro: 1.07, tasa: 0.3 }, mes: { inflacion: 0.15 },
    opciones: [
      { t: "Condenar la invasión y sumarse a las sanciones", pista: "Occidente lo valora; perdés fertilizantes y un comprador", ind: { reservas: -300, legitimidad: 1 }, paises: { norte: 15, union: 15, eurasia: -40 } },
      { t: "Condenar en la ONF, sin sanciones", pista: "La posición tradicional", ind: { legitimidad: 1 }, paises: { norte: 3, union: 5, eurasia: -10 } },
      { t: "Neutralidad: seguir comerciando con todos", pista: "Ganás mercados; la Federación del Norte toma nota", ind: { reservas: 500 }, paises: { norte: -15, union: -10, eurasia: 20 } },
    ] },
  { id: "golfo", tipo: "internacional", titulo: "Escalada militar en el Golfo de Arén", dur: [3, 10], peso: 1,
    texto: "Ataques cruzados entre potencias del Golfo amenazan el estrecho por donde pasa un quinto del petróleo mundial. Los mercados huyen al oro.",
    shock: { petroleo: 1.35, oro: 1.1, tasa: 0.25 }, mes: { inflacion: 0.1 },
    opciones: [
      { t: "Evacuar a los argentinos de la zona", pista: "Operativo costoso, buena imagen", ind: { reservas: -150, imagen: 2 } },
      { t: "Ofrecer mediación en la ONF", pista: "Prestigio internacional si sale bien", ind: { legitimidad: 1 }, onf: 6, paises: { golfo: 10 } },
      { t: "Alinearse con la Federación del Norte", pista: "El Norte lo agradece; riesgo de represalias", paises: { norte: 12, golfo: -10 }, ind: { inseguridad: 2 } },
    ] },
  { id: "guerraComercial", tipo: "internacional", titulo: "Guerra comercial entre el Norte y el Este", dur: [6, 18], peso: 1.1,
    texto: "La Federación del Norte pone aranceles del 60% a todo lo que viene de la República Popular del Este, que responde dejando de comprarle granos. Los dos te piden definiciones.",
    shock: { soja: 1.08, tasa: 0.2 }, mes: { crecimiento: -0.05 },
    opciones: [
      { t: "Vender más soja y carne al Este", pista: "Entran dólares; el Norte se enoja", ind: { reservas: 900 }, paises: { este: 15, norte: -12 } },
      { t: "Aranceles a las importaciones del Este", pista: "La industria festeja, el Norte también; el Este retalia", ind: { inflacion: 0.2 }, grp: { empresarios: 0.1 }, paises: { norte: 12, este: -20 } },
      { t: "Equidistancia: negociar con los dos", pista: "Nadie te premia, nadie te castiga", ind: { legitimidad: 1 } },
    ] },
  { id: "pandemia", tipo: "internacional", titulo: "Nueva pandemia respiratoria", dur: [5, 10], peso: 0.55, unico: true,
    texto: "La ONF declara la pandemia por un virus respiratorio nuevo. Los hospitales del AMBA empiezan a llenarse y el ministerio de Salud pide decisiones ya.",
    shock: { petroleo: 0.7, soja: 0.95, oro: 1.12, tasa: -0.5 }, mes: { crecimiento: -0.35, tension: 0.8 },
    opciones: [
      { t: "Cuarentena estricta nacional", pista: "Salva vidas al principio; la economía se hunde", ind: { crecimiento: -3, desempleo: 1.5, deficit: 1.5, imagen: 6, tension: -4 }, dif: [{ en: 2, texto: "La cuarentena larga cansa: crece el malestar y la economía no repunta.", ind: { imagen: -8, tension: 8 } }] },
      { t: "Restricciones focalizadas y testeo", pista: "Equilibrio; exige un ministerio de Salud con presupuesto", ind: { crecimiento: -1.2, deficit: 0.8, imagen: 2 }, salud: true },
      { t: "Sin restricciones: la economía no para", pista: "Hospitales colapsados, imagen en riesgo", ind: { crecimiento: -0.4, imagen: -9, legitimidad: -4, tension: 4 } },
    ] },
  { id: "devalBrasilia", tipo: "regional", titulo: "Devaluación brusca en Brasilia del Sur", dur: [3, 8], peso: 1,
    texto: "La moneda de Brasilia del Sur cae 30% en una semana. Sus autos y textiles llegan más baratos y tus exportaciones industriales se frenan.",
    shock: {}, mes: { crecimiento: -0.12, reservas: -120 },
    opciones: [
      { t: "Licencias de importación para proteger la industria", pista: "La UIA aplaude; Brasilia del Sur protesta en el Mercado Común", grp: { empresarios: 0.15 }, ind: { inflacion: 0.2 }, paises: { brasilia: -15 } },
      { t: "Acompañar con el tipo de cambio", pista: "Devaluás para no perder competitividad", eco: { salto: 8 } },
      { t: "Negociar cupos en el Mercado Común", pista: "Lento pero sin pelea", paises: { brasilia: 8 }, ind: { crecimiento: -0.2 } },
    ] },
  { id: "tasasNorte", tipo: "internacional", titulo: "La Reserva del Norte sube fuerte las tasas", dur: [6, 14], peso: 0.9,
    texto: "El banco central de la Federación del Norte sube la tasa para frenar su inflación. El dólar se fortalece en el mundo y los capitales salen de los emergentes.",
    shock: { tasa: 1.4, oro: 0.95, soja: 0.94 }, mes: {} },
  { id: "contagio", tipo: "internacional", titulo: "Contagio financiero en los emergentes", dur: [2, 6], peso: 0.7,
    texto: "El default de un país emergente grande dispara la venta de bonos de toda la región. Tu riesgo país salta sin que hayas hecho nada.",
    shock: { tasa: 0.8, oro: 1.05 }, mes: { reservas: -350 } },
  { id: "alimentos", tipo: "internacional", titulo: "Crisis alimentaria mundial", dur: [4, 10], peso: 0.7,
    texto: "Malas cosechas en el hemisferio norte disparan los precios de los granos. Exportar es un gran negocio, pero la comida sube en las góndolas.",
    shock: { soja: 1.3 }, mes: { inflacion: 0.2 },
    opciones: [
      { t: "Subir las retenciones mientras dure", pista: "Recaudás y desacoplás precios; el campo se enoja", ind: { deficit: -0.4, inflacion: -0.2 }, act: { campo: -15 }, grp: { campo: -0.3 } },
      { t: "Cupos de exportación de trigo y maíz", pista: "Baja el pan; los productores pierden", ind: { inflacion: -0.3, reservas: -400 }, act: { campo: -10 } },
      { t: "Dejar que el mercado funcione", pista: "Entran dólares; sube la canasta", ind: { reservas: 800, pobreza: 1 } },
    ] },
  { id: "golpeVecino", tipo: "regional", titulo: "Golpe de Estado en un país vecino", dur: [3, 8], peso: 0.6,
    texto: "Militares derrocan al presidente de un país del Pacto Andino. Miles cruzan la frontera y el Mercado Común convoca a una cumbre de urgencia.",
    shock: {}, mes: {},
    opciones: [
      { t: "No reconocer al gobierno de facto y pedir sanciones en la ONF", pista: "Coherencia democrática", ind: { legitimidad: 3 }, paises: { andes: -10 }, onf: 4 },
      { t: "Reconocer a las nuevas autoridades", pista: "Pragmatismo; críticas internas", ind: { legitimidad: -4 }, paises: { andes: 10 } },
      { t: "Ofrecer asilo al presidente depuesto", pista: "Gesto fuerte; tensión diplomática", ind: { imagen: 2 }, paises: { andes: -20 } },
    ] },
  { id: "refugiados", tipo: "regional", titulo: "Éxodo masivo desde un país del norte del continente", dur: [6, 14], peso: 0.6,
    texto: "La crisis en un país del norte del continente empuja a cientos de miles a emigrar. Llegan por la frontera norte y Ezeiza.",
    shock: {}, mes: {},
    opciones: [
      { t: "Regularización amplia y permisos de trabajo", pista: "Mano de obra calificada; costos sociales al principio", ind: { crecimiento: 0.2, deficit: 0.1, legitimidad: 1 } },
      { t: "Visas humanitarias con cupo", pista: "Equilibrio", ind: { legitimidad: 1 } },
      { t: "Cerrar la frontera", pista: "Popular en algunos sectores; críticas de la ONF", ind: { imagen: 1, legitimidad: -2 }, onf: -5 },
    ] },
  { id: "olaPolar", tipo: "nacional", titulo: "Ola polar y falta de gas", dur: [2, 3], peso: 0.8, cond: () => true,
    texto: "El invierno más frío en décadas dispara el consumo. No alcanza el gas: hay que elegir entre importar a precio récord o cortar a las industrias.",
    shock: {}, mes: {},
    opciones: [
      { t: "Importar barcos de gas licuado", pista: "Se van reservas", ind: { reservas: -1400, deficit: 0.2 } },
      { t: "Cortar el gas a las industrias", pista: "Hogares calefaccionados; fábricas paradas", ind: { crecimiento: -0.6 }, act: { industria: -12 } },
      { t: "Pedir gas a Brasilia del Sur y al Pacto Andino", pista: "Depende de la relación", paises: { brasilia: -3, andes: -3 }, ind: { reservas: -500 } },
    ] },
  { id: "sequia", tipo: "nacional", titulo: "Sequía histórica en la zona núcleo", dur: [6, 9], peso: 0.8,
    texto: "La peor sequía en 60 años destruye media cosecha de soja y maíz. Faltarán miles de millones de dólares de exportaciones.",
    shock: {}, mes: { reservas: -600, crecimiento: -0.15 },
    opciones: [
      { t: "Emergencia agropecuaria: prórrogas y créditos", pista: "El campo lo valora; cuesta déficit", ind: { deficit: 0.3 }, act: { campo: 12 } },
      { t: "Bajar retenciones para que se venda lo que hay", pista: "Entran dólares antes, se pierde recaudación", ind: { reservas: 800, deficit: 0.4 }, act: { campo: 15 } },
      { t: "Esperar la próxima campaña", pista: "Sin costo fiscal", act: { campo: -6 } },
    ] },
  { id: "ciberataque", tipo: "nacional", titulo: "Ciberataque a organismos públicos", dur: [1, 2], peso: 0.5,
    texto: "Un grupo de hackers cifra los sistemas de la agencia de recaudación y del registro de personas y pide un rescate en criptomonedas.",
    shock: {}, mes: {},
    opciones: [
      { t: "No pagar y restaurar desde cero", pista: "Semanas sin sistemas; dignidad", ind: { deficit: 0.15, imagen: -1 } },
      { t: "Pagar el rescate en secreto", pista: "Rápido; si se sabe, escándalo", ind: { reservas: -40 }, riesgo: 8 },
      { t: "Pedir ayuda a la Federación del Norte", pista: "Eficaz; acceso a datos sensibles", paises: { norte: 6 }, riesgo: 3 },
    ] },
  { id: "cascos", tipo: "internacional", titulo: "La ONF pide cascos azules", dur: [12, 24], peso: 0.5,
    texto: "El Consejo de Paz y Seguridad aprueba una misión de paz en África Central y le pide a la Argentina un batallón y un hospital reubicable.",
    shock: {}, mes: {},
    opciones: [
      { t: "Enviar el batallón y el hospital", pista: "Prestigio internacional; cuesta presupuesto de Defensa", ind: { deficit: 0.05, legitimidad: 1 }, onf: 10, cascos: 600 },
      { t: "Enviar solo el hospital", pista: "Aporte humanitario", onf: 5, cascos: 80 },
      { t: "Declinar", pista: "Sin costo", onf: -3 },
    ] },
];

// los expedientes de crisis viven en DILEMAS, pero no salen al azar: los dispara la crisis
CRISIS.forEach(c => { if (c.opciones && typeof DILEMAS !== "undefined" && !DILEMAS.find(d => d.id === "cr_" + c.id)) DILEMAS.push({ id: "cr_" + c.id, titulo: c.titulo, texto: c.texto, peso: 0, cond: () => false, opciones: c.opciones, crisis: true }); });

function crisisActivas() { return mundo().crisis.filter(c => c.hasta >= (S.mes || 1)); }
function iniciarCrisis(id, eventos) {
  const M = mundo(), C = CRISIS.find(x => x.id === id); if (!C) return;
  const dur = C.dur[0] + Math.floor(R.rand() * (C.dur[1] - C.dur[0] + 1));
  M.crisis.push({ id, desde: S.mes || 1, hasta: (S.mes || 1) + dur });
  M.historialCrisis.push(id); M.ultimaCrisis = S.mes || 1;
  if (C.opciones) (M.colaExp = M.colaExp || []).push("cr_" + id); // entra al despacho al empezar el mes
  const txt = `${C.texto}${C.opciones ? " El expediente está en tu despacho." : ""}`;
  log(`${C.titulo}. ${C.texto}`, "malo");
  if (typeof titular === "function") titular(R.pick(["Diario El Faro", "La Posta", "Canal Federal Noticias", "Página Sur"]), C.titulo);
  if (eventos) eventos.push({ titulo: (C.tipo === "nacional" ? "Emergencia nacional: " : "Crisis internacional: ") + C.titulo, texto: txt, tipo: "malo" });
}
function sortearCrisis(eventos) {
  const M = mundo(), mes = S.mes || 1;
  if (mes < 3 || crisisActivas().length >= 2 || mes - M.ultimaCrisis < 3) return;
  if (R.rand() > 0.17) return;
  const invierno = [6, 7, 8].includes(((mes - 1 + 11) % 12) + 1);
  const posibles = CRISIS.filter(c => !crisisActivas().some(a => a.id === c.id) && !(c.unico && M.historialCrisis.includes(c.id)) && (c.id !== "olaPolar" || invierno) && M.historialCrisis.slice(-3).indexOf(c.id) < 0);
  const tot = posibles.reduce((a, c) => a + c.peso, 0);
  let r = R.rand() * tot;
  for (const c of posibles) { r -= c.peso; if (r <= 0) { iniciarCrisis(c.id, eventos); return; } }
}

// ---------- Precios internacionales ----------
function pasoMundo(eventos) {
  const M = mundo(), B = M.base;
  M.prev = { petroleo: M.petroleo, oro: M.oro, soja: M.soja, tasa: M.tasa };
  const sh = { petroleo: 1, oro: 1, soja: 1, tasa: 0 };
  for (const a of crisisActivas()) { const C = CRISIS.find(x => x.id === a.id); if (!C) continue; for (const k in C.shock) { if (k === "tasa") sh.tasa += C.shock[k]; else sh[k] *= C.shock[k]; } }
  M.shock = sh;
  const paso = (v, base, s, sig) => Math.max(base * 0.3, v * Math.exp(R.gauss() * sig + 0.18 * Math.log(base * s / v)));
  M.petroleo = paso(M.petroleo, B.petroleo, sh.petroleo, 0.065);
  M.oro = paso(M.oro, B.oro * (1 + 0.004 * ((S.mes || 1) - 1)), sh.oro, 0.035); // el oro tiende a subir de a poco
  M.soja = paso(M.soja, B.soja, sh.soja, 0.05);
  M.tasa = R.clamp(M.tasa + R.gauss() * 0.12 + 0.2 * (B.tasa + sh.tasa - M.tasa), 0, 20);
  sortearCrisis(eventos);
}
// efectos de los precios internacionales sobre la economía (se suman a los objetivos del mes)
EXTRA_ECO.push(() => {
  if (!S || S.fase !== "gobierno" || !S.mundo) return {};
  const M = S.mundo, B = M.base, eb = mundoBaseEra(), K = S.escalaRes || 1;
  const dPet = M.petroleo / B.petroleo - 1, dSoja = M.soja / B.soja - 1, dTasa = M.tasa - B.tasa;
  const valOro = M.oroTon * OZ_POR_TON * (M.oro - M.prev.oro) / 1e6; // revaluación de las reservas en oro (US$ M)
  const ef = {
    inflacion: (M.petroleo / M.prev.petroleo - 1) * 1.6 + Math.max(0, dSoja) * 0.25,
    crecimiento: dSoja * 1.2 - dTasa * 0.25 + (eb.exportadorEnergia ? dPet * 0.6 : -dPet * 0.8),
    reservas: (eb.exportadorEnergia ? dPet * 900 : -dPet * 700) + dSoja * 2200 - dTasa * 250 + valOro / K,
    deficit: -dSoja * 0.35 + dTasa * 0.08,
  };
  for (const a of crisisActivas()) { const C = CRISIS.find(x => x.id === a.id); if (C && C.mes) for (const k in C.mes) ef[k] = (ef[k] || 0) + C.mes[k] * (k === "reservas" ? 1 : 3); }
  M.efMes = ef;
  return ef;
});

// opciones de los expedientes de crisis: efectos propios del mundo
resolverExpediente = (orig => function (idx, op) {
  const exp = S.expedientes && S.expedientes[idx];
  const r = orig(idx, op);
  if (exp && exp.id && exp.id.startsWith("cr_")) {
    const C = CRISIS.find(c => "cr_" + c.id === exp.id), o = C && C.opciones[op];
    if (o) {
      if (o.paises) for (const k in o.paises) moverPais(k, o.paises[k]);
      if (o.onf) mundo().onf.prestigio = R.clamp(mundo().onf.prestigio + o.onf, 0, 100);
      if (o.cascos) mundo().onf.cascos += o.cascos;
      if (o.eco && typeof devaluar === "function" && o.eco.salto) devaluar(o.eco.salto, true);
      if (o.salud && typeof ministerio === "function") { const m = ministerio("salud"); if (m && S.presupuesto.salud < 0) aplicarEfectos({ imagen: -3 }); }
    }
  }
  return r;
})(resolverExpediente);

function pesosRelacion(v) { return v > 50 ? "aliado" : v > 20 ? "buena" : v > -20 ? "normal" : v > -50 ? "fría" : "hostil"; }
