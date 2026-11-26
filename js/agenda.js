// =============================================================
//  VALDORA - Agenda mensual: el tiempo y el capital político son
//  limitados. Cada mes hay pocos casilleros de agenda y casi todo
//  lo que hacés fuera del despacho consume uno.
//   - Presidente: 3 por mes (medida grande cuesta 2)
//   - Gobernador e intendente: 2 por mes
//   - Diputado: 1 acción por mes (ya era así)
//   - Campaña: 6 acciones por mes
// =============================================================

const AGENDA_COSTOS = { medida: 2, ley: 1, sobreTablas: 1, atn: 1, negociar: 1, exterior: 1, conferencia: 1, cadena: 1, causa: 1, derogar: 1, nacion: 1, negociarLeg: 1 };

function agendaMax() {
  if (!S) return 0;
  if (typeof esLocal === "function" && esLocal()) return 2;
  if (S.fase === "gobierno") return 3 + (S.jugador.gestion >= 8 ? 1 : 0);
  return 0;
}
function agendaDisponible() { if (S.agenda == null) S.agenda = agendaMax(); return S.agenda; }
function sinAgenda(tipo) {
  const c = AGENDA_COSTOS[tipo] || 1;
  return { ok: false, msg: `No te queda agenda este mes: esto requiere ${c} ${c === 1 ? "casillero" : "casilleros"} y tenés ${agendaDisponible()}. Terminá el mes o elegí otra prioridad.`, tipo: "aviso", pasos: [] };
}
// --- enganches (las funciones globales se reasignan) ---
tomarMedida = (orig => function (...a) { const c = AGENDA_COSTOS.medida; if (agendaDisponible() < c) return sinAgenda("medida"); S.agenda -= c; const r = orig.apply(this, a); if (r && r.ok === false) S.agenda += c; return r; })(tomarMedida);
presentarLey = (orig => function (ley, neg) { if (ctxLey().modo === "leg") return orig(ley, neg); if (agendaDisponible() < 1) return sinAgenda("ley"); const chk = puedePresentarLey(); if (!chk.ok) return orig(ley, neg); S.agenda--; const r = orig(ley, neg); if (r && r.tipo === "aviso" && !(r.pasos || []).length) S.agenda++; return r; })(presentarLey);
tratarSobreTablas = (orig => function (uid) { if (ctxLey().modo === "leg") return orig(uid); if (agendaDisponible() < 1) return sinAgenda("sobreTablas"); S.agenda--; const r = orig(uid); if (r && r.tipo === "aviso" && !(r.pasos || []).length) S.agenda++; return r; })(tratarSobreTablas);
enviarATN = (orig => function (id) { if (agendaDisponible() < 1) return sinAgenda("atn"); S.agenda--; orig(id); return { ok: true, msg: `Enviaste ATN a ${PROVINCIAS.find(p => p.id === id).nombre}. El gobernador promete votos.` }; })(enviarATN);
negociarBloque = (orig => function (b) { if (agendaDisponible() < 1) return sinAgenda("negociar"); S.agenda--; orig(b); return { ok: true, msg: `Negociaste con el bloque ${PARTIDOS[b].corto}: cargos en organismos a cambio de apoyo.` }; })(negociarBloque);
accionExterior = (orig => function (t) { if (agendaDisponible() < 1) return sinAgenda("exterior"); S.agenda--; const r = orig(t); if (r && r.ok === false) S.agenda++; return r; })(accionExterior);
if (typeof conferenciaPrensa === "function") conferenciaPrensa = (orig => function () { if (agendaDisponible() < 1) return sinAgenda("conferencia"); S.agenda--; return orig(); })(conferenciaPrensa);
if (typeof cadenaNacional === "function") cadenaNacional = (orig => function () { if (agendaDisponible() < 1) return sinAgenda("cadena"); S.agenda--; const r = orig(); if (r && r.ok === false) S.agenda++; return r; })(cadenaNacional);
if (typeof accionCausa === "function") accionCausa = (orig => function (id, acc) { if (acc === "respetar") return orig(id, acc); if (agendaDisponible() < 1) return sinAgenda("causa"); S.agenda--; const r = orig(id, acc); if (r && r.ok === false) S.agenda++; return r; })(accionCausa);
if (typeof derogarMedida === "function") derogarMedida = (orig => function (id) { if (agendaDisponible() < 1) return sinAgenda("derogar"); S.agenda--; const r = orig(id); if (r && r.ok === false) S.agenda++; return r; })(derogarMedida);
if (typeof gestionarNacion === "function") gestionarNacion = (orig => function (acc) { if (agendaDisponible() < 1) return sinAgenda("nacion"); S.agenda--; const r = orig(acc); if (r && /Ya hiciste/.test(r.msg || "")) S.agenda++; return r; })(gestionarNacion);

// reponer la agenda al empezar cada mes
terminarTrimestre = (orig => function () { const ev = orig(); S.agenda = agendaMax(); return ev; })(terminarTrimestre);
if (typeof finTrimestreLocal === "function") finTrimestreLocal = (orig => function () { const ev = orig(); S.agenda = agendaMax(); return ev; })(finTrimestreLocal);
iniciarGobierno = (orig => function () { orig(); S.agenda = agendaMax(); })(iniciarGobierno);
if (typeof iniciarGobiernoLocal === "function") iniciarGobiernoLocal = (orig => function () { orig(); S.agenda = agendaMax(); })(iniciarGobiernoLocal);

// en lo local, negociar con el cuerpo legislativo también ocupa agenda
function negociarLegLocal() {
  if (agendaDisponible() < 1) return sinAgenda("negociarLeg");
  S.agenda--;
  return { ok: true };
}

// ayuda para los módulos nuevos: ejecuta fn solo si queda agenda; si falla, devuelve el casillero
function conCasillero(c, fn) {
  if (agendaDisponible() < c) return { ok: false, msg: `No te queda agenda este mes: esto requiere ${c} ${c === 1 ? "casillero" : "casilleros"} y tenés ${agendaDisponible()}.`, tipo: "aviso", pasos: [] };
  S.agenda -= c;
  const r = fn();
  if (r && r.ok === false) S.agenda += c;
  return r;
}
