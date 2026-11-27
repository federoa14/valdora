// =============================================================
//  VALDORA - Guardado: autoguardado cada mes, tres ranuras y
//  exportar/importar la partida como archivo .json.
//  Todo queda en el navegador (localStorage). La clave vieja
//  "valdora_partida" se sigue leyendo como "Guardado rápido".
// =============================================================

const VERSION_GUARDADO = 2;
const CLAVE_AUTO = "valdora_auto";
const CLAVES_RANURA = ["valdora_ranura_1", "valdora_ranura_2", "valdora_ranura_3"];
const CLAVE_VIEJA = "valdora_partida";

function _ls() { try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; } }
function cargoDe(st) {
  const o = st && st.cfg && st.cfg.objetivo;
  return o === "gobernador" ? "Gobernador/a" : o === "intendente" ? "Intendente" : o === "legislador" ? ((st && st.cfg && st.cfg.camaraLeg === "sen") ? "Senador/a" : "Diputado/a") : "Presidente/a";
}
function metaPartida() {
  const yo = S.jugador || {};
  const fase = S.fase === "campana" ? "Campaña" : "Gobierno";
  const mes = S.fase === "campana" ? (typeof mesDeSemana === "function" ? mesDeSemana(S.semana || 1) : Math.ceil((S.semana || 1) / 2)) : (S.mes || 1);
  return { v: VERSION_GUARDADO, fecha: new Date().toISOString(), nombre: yo.nombre || "", cargo: cargoDe(S), territorio: typeof nombreTerritorio === "function" ? nombreTerritorio() : "", fase, mes };
}
function serializarPartida() { return JSON.stringify({ S, NUEVO: PARTIDOS.NUEVO || null, meta: metaPartida() }); }
function guardarEn(clave) {
  const ls = _ls(); if (!ls || !S) return false;
  try { ls.setItem(clave, serializarPartida()); return true; } catch (e) { return false; }
}
function leerMeta(clave) {
  const ls = _ls(); if (!ls) return null;
  try {
    const raw = ls.getItem(clave); if (!raw) return null;
    const d = JSON.parse(raw);
    if (d.meta) return d.meta;
    const st = d.S || {}; const yo = (st.candidatos || []).find(c => c.esJugador) || {};
    return { v: 1, fecha: null, nombre: yo.nombre || "", cargo: cargoDe(st), territorio: "", fase: st.fase === "campana" ? "Campaña" : "Gobierno", mes: st.mes || 1 };
  } catch (e) { return null; }
}
// valida y carga un texto JSON de partida (de una ranura o de un archivo)
function cargarTexto(raw) {
  let d;
  try { d = JSON.parse(raw); } catch (e) { return { ok: false, msg: "El archivo no es una partida de Valdora válida." }; }
  if (!d || !d.S || !Array.isArray(d.S.candidatos) || !d.S.candidatos.some(c => c.esJugador)) return { ok: false, msg: "El archivo no tiene una partida de Valdora." };
  _rawCarga = raw;
  let ok = false;
  try { ok = cargar(); } finally { _rawCarga = null; }
  return ok ? { ok: true } : { ok: false, msg: "No se pudo cargar la partida." };
}
function cargarDe(clave) {
  const ls = _ls(); if (!ls) return { ok: false, msg: "El navegador bloquea el almacenamiento." };
  const raw = ls.getItem(clave); if (!raw) return { ok: false, msg: "Esa ranura está vacía." };
  return cargarTexto(raw);
}
function borrarRanura(clave) { const ls = _ls(); try { ls && ls.removeItem(clave); } catch (e) {} }
function autoguardar() { if (S && !S.perdio && !S.terminoMandato) return guardarEn(CLAVE_AUTO); return false; }
// al terminar una partida se borran el autoguardado y el guardado rápido (las ranuras quedan)
function borrarPartidaEnCurso() { borrarRanura(CLAVE_AUTO); borrarRanura(CLAVE_VIEJA); }
// el guardado más reciente, para el botón "Continuar"
function ultimaPartida() {
  const cands = [CLAVE_AUTO, ...CLAVES_RANURA, CLAVE_VIEJA].map(k => ({ k, m: leerMeta(k) })).filter(x => x.m);
  if (!cands.length) return null;
  cands.sort((a, b) => (b.m.fecha || "").localeCompare(a.m.fecha || ""));
  return cands[0];
}

// el botón Guardar de siempre: además de la clave vieja, deja metadatos
guardar = function () { return guardarEn(CLAVE_VIEJA); };
hayPartidaGuardada = function () { return !!ultimaPartida(); };

// autoguardado al cerrar cada mes, en todos los cargos
for (const n of ["terminarSemana", "terminarTrimestre", "finTrimestreLocal", "finTrimestreLeg"]) {
  const orig = globalThis[n];
  if (typeof orig !== "function") continue;
  globalThis[n] = function (...a) { const r = orig.apply(this, a); autoguardar(); return r; };
}
