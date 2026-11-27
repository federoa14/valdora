// =============================================================
//  VALDORA - Precampaña: arrancar hasta 6 meses antes de las PASO
//  o de la interna para traccionar votos.
//  - Cada mes de precampaña da 6 acciones más para instalarse,
//    juntar avales, militantes, lealtad del líder y afiliados.
//  - Rinde menos que la campaña: la gente todavía no presta
//    atención, y repetir la misma provincia o el mismo spot rinde
//    cada vez menos (rendimiento decreciente).
//  - Los rivales todavía no largaron: hacen la mitad de campaña.
//  - Arrancar muy temprano desgasta: cae la imagen y aparece la
//    fatiga, que resta rendimiento en la campaña general.
//  - Lo que se gana queda en la trayectoria como hito.
// =============================================================

const MESES_PRECAMPANA = [0, 3, 6];

function enPrecampana() {
  return !!(S && S.fase === "campana" && S.precampana && S.precampana.meses > 0 && S.semana <= S.precampana.meses * 2);
}
function mesesPrecampanaRestantes() { return enPrecampana() ? S.precampana.meses - mesDeSemana(S.semana) + 1 : 0; }

const _iniciarPartidaPre = iniciarPartida;
iniciarPartida = function (cfg) {
  const pre = fijarCalendario(cfg.precampana || 0);
  _iniciarPartidaPre(cfg);
  S.precampana = { meses: pre, knowInicio: conocimientoMedio(S.jugador), desgaste: 0, fatiga: 0, usos: {} };
  if (pre > 0) {
    const cuando = S.tipoInterna === "PASO" ? "las PASO" : S.tipoInterna === "avales" ? "el cierre de avales" : S.tipoInterna === "dedo" ? "que el líder decida" : "la interna";
    log(`Largás la precampaña ${pre} meses antes de lo habitual (hasta ${cuando} faltan ${mesDeSemana(SEMANA_INTERNA)} meses). Rinde menos que la campaña y los rivales todavía no largaron; ${pre >= 6 ? "arrancar tan temprano desgasta la imagen." : "cuidá no gastarte antes de tiempo."}`, "aviso");
  }
};

// rendimiento de las acciones: menor en la precampaña y decreciente si repetís; la fatiga resta en la campaña general
const _ejecutarAccionPre = ejecutarAccion;
ejecutarAccion = function (id, opt = {}) {
  if (!S || S.fase !== "campana" || !S.precampana) return _ejecutarAccionPre(id, opt);
  const yo = S.jugador, P = S.precampana;
  const antes = { ...yo.know };
  const r = _ejecutarAccionPre(id, opt);
  if (r && r.ok === false) return r;
  let factor = 1;
  if (enPrecampana()) {
    const clave = opt.prov || opt.grupo || opt.medio || id;
    P.usos[clave] = (P.usos[clave] || 0) + 1;
    factor = 0.75 / (1 + 0.3 * (P.usos[clave] - 1));
  } else if (P.fatiga > 0) factor = 1 - P.fatiga / 100;
  if (factor !== 1) for (const k in yo.know) { const d = yo.know[k] - (antes[k] || 0); if (d > 0) yo.know[k] = (antes[k] || 0) + d * factor; }
  return r;
};

// los rivales todavía no largaron
const _turnoIAPre = turnoIA;
turnoIA = function () {
  if (enPrecampana() && R.rand() < 0.5) { for (const c of S.candidatos) if (!c.esJugador && c.activo) c.plata += 0.6 + c.negociacion * 0.1; return; }
  return _turnoIAPre();
};

// desgaste mensual por arrancar muy temprano
const _terminarSemanaPre = terminarSemana;
terminarSemana = function (...a) {
  const estaba = enPrecampana();
  const ev = _terminarSemanaPre.apply(this, a);
  if (estaba && S && S.fase === "campana" && !S.perdio) {
    const P = S.precampana;
    const golpe = P.meses >= 6 ? 0.6 : P.meses >= 4 ? 0.3 : 0.1;
    S.jugador.imagen -= golpe;
    P.desgaste += golpe;
    P.fatiga = Math.min(12, P.fatiga + (P.meses >= 6 ? 1.5 : P.meses >= 4 ? 0.8 : 0.3));
    if (!enPrecampana()) log(`Termina la precampaña. ${P.fatiga >= 6 ? "Llegás a la campaña con cierto desgaste: la gente ya te vio mucho." : "Llegás a la campaña instalado y sin desgaste."}`, P.fatiga >= 6 ? "aviso" : "bueno");
  }
  return ev;
};

const _cargarPre = cargar;
cargar = function () {
  const ok = _cargarPre();
  if (ok && S) fijarCalendario((S.cfg && S.cfg.precampana) || 0);
  return ok;
};
