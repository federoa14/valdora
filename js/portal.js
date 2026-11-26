// =============================================================
//  VALDORA - Portal de gobierno: Boletín Oficial (decretos,
//  DNU, resoluciones, leyes y vetos), estadísticas oficiales
//  con su fuente y ejecución presupuestaria.
//  Los organismos y su numeración son ficticios.
// =============================================================

const ANIO_BASE = { hoy: 2027, "1983": 1983, "1989": 1989, "2001": 1999 };
function anioBase() { return ANIO_BASE[(S && S.cfg && S.cfg.era) || "hoy"] || 2027; }
// el mandato arranca en diciembre (como en la Argentina desde 1983): mes 1 = diciembre del año base
function anioDeMes(m) { return anioBase() + Math.floor(((m || 1) - 1 + 11) / 12); }
const MESES_NOM = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fechaDeMes(m) { const i = ((m || 1) - 1 + 11) % 12; return `${MESES_NOM[i]} de ${anioDeMes(m)}`; }

const NUM_INICIAL = { decreto: 14, dnu: 1, resolucion: 31, ley: 27801, leyp: 10512, ordenanza: 18204 };
function boletin() { if (!S.boletin) S.boletin = { items: [], num: { ...NUM_INICIAL } }; return S.boletin; }
const ORGANISMO_MEDIDA = { seguridad: "Ministerio de Seguridad", defensa: "Ministerio de Defensa", salud: "Ministerio de Salud", educacion: "Ministerio de Educación", social: "Ministerio de Desarrollo Humano", economia: "Ministerio de Economía", trabajo: "Ministerio de Trabajo", justicia: "Ministerio de Justicia" };
function organismoDe(m) {
  const t = ((m && (m.nombre + " " + (m.desc || ""))) || "").toLowerCase();
  if (/segur|policí|narco/.test(t)) return ORGANISMO_MEDIDA.seguridad;
  if (/salud|hospital|vacun/.test(t)) return ORGANISMO_MEDIDA.salud;
  if (/educa|escuel|docent|universi/.test(t)) return ORGANISMO_MEDIDA.educacion;
  if (/laboral|trabaj|salario|sindic/.test(t)) return ORGANISMO_MEDIDA.trabajo;
  if (/jubil|social|asignaci|aliment/.test(t)) return ORGANISMO_MEDIDA.social;
  if (/fuerzas armadas|defensa/.test(t)) return ORGANISMO_MEDIDA.defensa;
  return ORGANISMO_MEDIDA.economia;
}
function publicarBoletin(tipo, titulo, detalle, extra = {}) {
  if (!S) return null;
  const B = boletin();
  const serie = tipo === "veto" || tipo === "derogacion" ? "decreto" : tipo; // vetos y derogaciones son decretos
  const n = B.num[serie] || NUM_INICIAL[serie] || 1;
  B.num[serie] = n + 1 + (serie === "decreto" ? Math.floor(R.rand() * 6) : 0); // otros decretos se firman entre medio
  const m = S.mes || 1;
  const item = { tipo, n, anio: anioDeMes(m), mes: m, titulo, detalle, ...extra };
  B.items.unshift(item);
  if (B.items.length > 200) B.items.pop();
  return item;
}
function rotuloBoletin(it) {
  if (it.tipo === "ley") return `Ley ${it.n.toLocaleString("es-AR")}`;
  if (it.tipo === "leyp") return `Ley provincial ${it.n.toLocaleString("es-AR")}`;
  if (it.tipo === "ordenanza") return `Ordenanza ${it.n.toLocaleString("es-AR")}/${it.anio}`;
  if (it.tipo === "veto") return `Decreto ${it.n}/${it.anio} (veto)`;
  if (it.tipo === "dnu") return `DNU ${it.n}/${it.anio}`;
  if (it.tipo === "resolucion") return `Resolución ${it.n}/${it.anio}`;
  if (it.tipo === "derogacion") return `Decreto ${it.n}/${it.anio}`;
  return `Decreto ${it.n}/${it.anio}`;
}

// medidas: se publican cuando entran en vigencia (por decreto, DNU, resolución o ley aprobada)
tomarMedida = (orig => function (id, inst, ...rest) {
  const antes = S && S.medidasActivas ? S.medidasActivas.length : 0;
  const r = orig.call(this, id, inst, ...rest);
  if (S && S.medidasActivas && S.medidasActivas.length > antes && S.medidasActivas.includes(id)) {
    const m = MEDIDAS.find(x => x.id === id);
    const tipo = inst === "ley" ? "ley" : inst === "dnu" ? "dnu" : inst === "resolucion" ? "resolucion" : "decreto";
    publicarBoletin(tipo, m ? m.nombre : id, m ? m.desc || "" : "", { organismo: tipo === "resolucion" ? organismoDe(m) : tipo === "ley" ? "Congreso de la Nación" : "Poder Ejecutivo", medida: id });
  }
  return r;
})(tomarMedida);
if (typeof derogarMedida === "function") derogarMedida = (orig => function (id) {
  const r = orig(id);
  if (r && r.ok !== false && S && S.medidasActivas && !S.medidasActivas.includes(id)) {
    const m = MEDIDAS.find(x => x.id === id);
    publicarBoletin("derogacion", `Derógase: ${m ? m.nombre : id}`, "Queda sin efecto la norma y sus reglamentaciones.", { organismo: "Poder Ejecutivo" });
  }
  return r;
})(derogarMedida);
// leyes del motor legislativo: sanción y veto
if (typeof sancionar === "function") sancionar = (orig => function (ley, pasos, texto) {
  const r = orig(ley, pasos, texto);
  const c = ctxLey();
  const tipo = c.modo === "local" ? (c.cuerpo === "concejo" ? "ordenanza" : "leyp") : "ley";
  const org = c.modo === "local" ? (c.cuerpo === "concejo" ? "Concejo Deliberante" : "Legislatura provincial") : "Congreso de la Nación";
  publicarBoletin(tipo, ley.nombre, ley.desc || ley.resumen || "", { organismo: org, uid: ley.uid });
  return r;
})(sancionar);
if (typeof cerrarLey === "function") cerrarLey = (orig => function (ley, estado, ...rest) {
  const r = orig(ley, estado, ...rest);
  if (estado === "vet") publicarBoletin("veto", `Obsérvase el proyecto "${ley.nombre}"`, "El Poder Ejecutivo veta el proyecto sancionado por el Congreso.", { organismo: "Poder Ejecutivo" });
  return r;
})(cerrarLey);

// ---------- Estadísticas oficiales ----------
// las cifras oficiales se publican con un mes de rezago (el mes en curso todavía no tiene dato)
function serieOficial(k) { return (S.hist || []).map(h => h[k]); }
function filaEstadistica(k) {
  const H = S.hist || []; const n = H.length;
  const ult = H[n - 1] || S.ind, prev = H[n - 2] || ult, anio = H[n - 13] || H[0] || ult;
  return { v: ult[k], prev: prev[k], anio: anio[k] };
}
// ejecución presupuestaria: crédito vigente vs devengado, en miles de millones (escala ficticia)
function ejecucionPresupuestaria() {
  if (!S.presupuesto || typeof AREAS === "undefined") return [];
  const PBI = 900000; // PBI en miles de millones de pesos (orden de magnitud realista)
  const mesAnio = (((S.mes || 1) - 1 + 11) % 12) + 1; // el ejercicio es el año calendario
  return AREAS.map(a => {
    const vigente = a.base * PBI / 100 * (1 + S.presupuesto[a.id] / 100);
    const ritmo = mesAnio / 12;
    const sesgo = S.presupuesto[a.id] < 0 ? -0.06 : S.presupuesto[a.id] > 0 ? 0.03 : 0;
    const ejec = Math.max(0, Math.min(1, ritmo * (0.94 + sesgo) + (((a.id.charCodeAt(0) * 7 + (S.mes || 1) * 3) % 9) - 4) / 400));
    return { nombre: a.nombre, vigente, devengado: vigente * ejec, pct: ejec * 100, cambio: S.presupuesto[a.id] };
  });
}
function nombreBoletin() {
  if (typeof esLocal === "function" && esLocal()) return S.cfg.objetivo === "intendente" ? "Boletín Oficial Municipal" : "Boletín Oficial de la Provincia";
  return "Boletín Oficial de la Nación";
}
