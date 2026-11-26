// =============================================================
//  VALDORA - Cancillería: visitas, acuerdos que aprueba el
//  Congreso, acuerdos reservados con uno o más países (que se
//  pueden filtrar) y la Organización de Naciones Federadas (ONF).
// =============================================================

const ACUERDOS = [
  { id: "tlcUnion", pais: "union", nombre: "Tratado de libre comercio con la Unión Continental", min: 20, congreso: true, ideo: 65,
    ef: { crecimiento: 0.5, reservas: 800 }, grp: { campo: 0.3, trabajadores: -0.15 }, act: { campo: 8, industria: -8 }, otros: { este: -5 }, desc: "Baja aranceles agrícolas e industriales. El campo gana; parte de la industria pierde." },
  { id: "inversionEste", pais: "este", nombre: "Acuerdo de inversiones en infraestructura con el Este", min: 10, congreso: false,
    ef: { reservas: 1500, crecimiento: 0.3, desempleo: -0.2 }, otros: { norte: -10 }, desc: "Represas, trenes de carga y puertos financiados por bancos del Este." },
  { id: "energiaGolfo", pais: "golfo", nombre: "Fondo soberano del Golfo para Vaca Muerta y el GNL", min: 10, congreso: false,
    ef: { reservas: 2000, crecimiento: 0.4 }, desc: "Inversión en oleoductos y una planta de gas licuado en la costa atlántica." },
  { id: "litioAndes", pais: "andes", nombre: "Acuerdo del triángulo del litio con el Pacto Andino", min: 15, congreso: true, ideo: 45,
    ef: { crecimiento: 0.3, reservas: 600 }, desc: "Coordinación de políticas del litio y corredor bioceánico al Pacífico." },
  { id: "automotriz", pais: "brasilia", nombre: "Nuevo acuerdo automotriz con Brasilia del Sur", min: 10, congreso: false,
    ef: { crecimiento: 0.25, desempleo: -0.15 }, grp: { trabajadores: 0.1 }, act: { industria: 6 }, desc: "Cupos y piezas nacionales para las terminales de Córdoba y el conurbano." },
  { id: "defensaNorte", pais: "norte", nombre: "Acuerdo de cooperación en defensa con la Federación del Norte", min: 25, congreso: true, ideo: 70,
    ef: { inseguridad: -2, reservas: 500 }, act: { fuerzas: 8 }, otros: { este: -15, eurasia: -10 }, desc: "Equipamiento, entrenamiento y ejercicios conjuntos en el Atlántico Sur." },
  { id: "nuclearEste", pais: "este", nombre: "Central nuclear con tecnología del Este", min: 20, congreso: true, ideo: 40,
    ef: { crecimiento: 0.3, reservas: 1000, deuda: 1.5 }, otros: { norte: -15 }, desc: "Una cuarta central nuclear financiada por el Este. El Norte lo considera una línea roja." },
  { id: "carneEste", pais: "este", nombre: "Protocolo sanitario para exportar carne y granos al Este", min: 0, congreso: false,
    ef: { reservas: 700 }, act: { campo: 6 }, desc: "Abre mercados para carne, cebada y harina de soja." },
];
const SECRETOS = [
  { id: "baseEspacial", nombre: "Estación de monitoreo espacial en la Patagonia", socios: ["este"], multi: false, fuga: 0.035,
    beneficio: { reservas: 1200 }, rivales: { norte: -30 }, escandalo: { imagen: -6, legitimidad: -8 },
    desc: "Una estación de seguimiento de satélites operada por el Este, con un anexo reservado sobre el control de la información." },
  { id: "inteligencia", nombre: "Intercambio de inteligencia y vigilancia de comunicaciones", socios: ["norte"], multi: false, fuga: 0.03,
    beneficio: { inseguridad: -5 }, rivales: { este: -15, eurasia: -10 }, escandalo: { imagen: -5, legitimidad: -10 },
    desc: "Acceso a interceptaciones a cambio de compartir datos de tus propias telecomunicaciones." },
  { id: "armas", nombre: "Compra de armamento con cláusula de confidencialidad", socios: ["golfo"], multi: false, fuga: 0.04,
    beneficio: { inseguridad: -1 }, act: { fuerzas: 12 }, costo: 900, rivales: {}, escandalo: { imagen: -7, legitimidad: -7 }, causa: true,
    desc: "Aviones de segunda mano con intermediarios y comisiones que no figuran en el contrato." },
  { id: "litioReservado", nombre: "Pacto reservado del litio", socios: ["este", "andes", "brasilia"], multi: true, fuga: 0.025,
    beneficio: { reservas: 900, crecimiento: 0.15 }, rivales: { norte: -12, union: -8 }, escandalo: { imagen: -4, legitimidad: -6 },
    desc: "Coordinar precios y cupos de litio y venderle con preferencia a los socios. Cuantos más socios, más beneficio y más riesgo de filtración." },
  { id: "bloqueONF", nombre: "Bloque de voto coordinado en la ONF", socios: ["brasilia", "andes", "golfo", "este", "union"], multi: true, fuga: 0.02,
    beneficio: {}, onf: 8, rivales: { norte: -6 }, escandalo: { imagen: -2, legitimidad: -3 },
    desc: "Votar en bloque las resoluciones de la ONF a cambio de apoyos para un asiento en el Consejo de Paz y para el reclamo por Malvinas." },
  { id: "prestamoPuente", nombre: "Préstamo puente reservado con garantía en recursos", socios: ["golfo", "este"], multi: false, fuga: 0.05,
    beneficio: { reservas: 3000 }, rivales: {}, escandalo: { imagen: -8, legitimidad: -12 }, causa: true, deuda: 1,
    desc: "Dólares rápidos sin pasar por el Congreso, garantizados con regalías de petróleo y litio. Viola la ley de administración financiera." },
];
const RESOLUCIONES_ONF = [
  { id: "condenaEurasia", texto: "Resolución que condena la invasión de la Confederación Euroasiática y exige el retiro de tropas.", si: { norte: 8, union: 8, eurasia: -15 }, no: { eurasia: 10, norte: -12, union: -10 }, abst: { norte: -4 } },
  { id: "bloqueoIsla", texto: "Resolución que pide levantar el bloqueo económico a una isla del Caribe.", si: { este: 4, norte: -6, brasilia: 3 }, no: { norte: 6, este: -4 }, abst: {} },
  { id: "altoFuegoGolfo", texto: "Resolución por un alto el fuego inmediato y la entrada de ayuda humanitaria en el Golfo de Arén.", si: { golfo: 6, union: 4, norte: -6 }, no: { norte: 6, golfo: -10 }, abst: {} },
  { id: "malvinas", texto: "Resolución del Comité de Descolonización que insta a reanudar las negociaciones de soberanía por Malvinas.", si: { brasilia: 2, andes: 2 }, no: {}, abst: {}, malvinas: true },
  { id: "clima", texto: "Resolución que crea un fondo climático financiado por los grandes emisores y castiga la deforestación.", si: { union: 6, este: -3 }, no: { union: -6, norte: 2 }, abst: {} },
  { id: "ia", texto: "Resolución sobre límites al uso militar de la inteligencia artificial.", si: { union: 4, este: -2, norte: -2 }, no: { norte: 3, este: 2 }, abst: {} },
  { id: "sancionEste", texto: "Proyecto en el Consejo de Paz para sancionar a la República Popular del Este por su presión sobre una isla vecina.", si: { norte: 10, este: -20 }, no: { este: 12, norte: -12 }, abst: { norte: -3, este: -3 }, consejo: true },
];

function visitaOficial(pais) {
  return conCasillero(1, () => {
    const M = mundo(), P = PAISES.find(p => p.id === pais); if (!P) return { ok: false, msg: "País desconocido." };
    const can = titularDe("Cancillería"), f = factorMinistro(can);
    const d = Math.round((6 + R.rand() * 8) * f); moverPais(pais, d);
    M.visitas = M.visitas || {}; M.visitas[pais] = S.mes || 1;
    const msg = `Viaje oficial a ${P.nombre}: reuniones con el jefe de Estado, empresarios y la comunidad argentina. La relación mejora (${d > 0 ? "+" : ""}${d}).`;
    log(msg, "info"); return { ok: true, msg };
  });
}
function firmarAcuerdo(id) {
  return conCasillero(1, () => {
    const M = mundo(), A = ACUERDOS.find(a => a.id === id); if (!A) return { ok: false, msg: "Acuerdo desconocido." };
    if (M.acuerdos.some(x => x.id === id)) return { ok: false, msg: "Ese acuerdo ya está vigente." };
    if (relPais(A.pais) < A.min) return { ok: false, msg: `La relación con ${nombrePais(A.pais)} todavía no alcanza (necesitás ${A.min}, tenés ${Math.round(relPais(A.pais))}). Probá con una visita oficial.` };
    const pasos = [];
    if (A.congreso) { // tratados: los aprueba el Congreso (art. 75 inc. 22)
      const v1 = votarCamara("sen", { ideo: A.ideo }); pasos.push(v1);
      const v2 = v1.aprobado ? votarCamara("dip", { ideo: A.ideo }) : null; if (v2) pasos.push(v2);
      if (!v1.aprobado || !v2.aprobado) { const msg = `El Congreso no aprobó el ${A.nombre.charAt(0).toLowerCase() + A.nombre.slice(1)}.`; log(msg, "malo"); moverPais(A.pais, -3); return { ok: true, msg, pasos, tipo: "malo" }; }
    }
    aplicarEfectos(A.ef, A.grp);
    if (A.act) for (const k in A.act) moverActor(k, A.act[k]);
    if (A.otros) for (const k in A.otros) moverPais(k, A.otros[k]);
    moverPais(A.pais, 8);
    M.acuerdos.push({ id, mes: S.mes || 1 });
    if (typeof publicarBoletin === "function") publicarBoletin(A.congreso ? "ley" : "decreto", `Apruébase el ${A.nombre.charAt(0).toLowerCase() + A.nombre.slice(1)}`, A.desc, { organismo: A.congreso ? "Congreso de la Nación" : "Poder Ejecutivo" });
    const msg = `Firmaste el ${A.nombre.charAt(0).toLowerCase() + A.nombre.slice(1)}.${A.congreso ? " El Congreso lo ratificó." : ""}`;
    log(msg, "bueno"); return { ok: true, msg, pasos, tipo: "bueno" };
  });
}
function firmarSecreto(id, socios) {
  return conCasillero(1, () => {
    const M = mundo(), Sx = SECRETOS.find(s => s.id === id); if (!Sx) return { ok: false, msg: "Acuerdo desconocido." };
    if (M.secretos.some(x => x.id === id && !x.filtrado)) return { ok: false, msg: "Ese acuerdo reservado ya está vigente." };
    socios = (socios && socios.length ? socios : [Sx.socios[0]]).filter(p => Sx.socios.includes(p));
    if (!Sx.multi) socios = socios.slice(0, 1);
    if (!socios.length) return { ok: false, msg: "Elegí al menos un país." };
    const frios = socios.filter(p => relPais(p) < -10);
    if (frios.length) return { ok: false, msg: `${frios.map(nombrePais).join(", ")} no confía en vos para un acuerdo reservado.` };
    const n = socios.length, K = S.escalaRes || 1;
    const ben = {}; for (const k in Sx.beneficio) ben[k] = Sx.beneficio[k] * (Sx.multi ? (0.6 + 0.4 * n) : 1);
    aplicarEfectos(ben);
    if (Sx.costo) S.ind.reservas -= Sx.costo * K;
    if (Sx.deuda) S.ind.deuda += Sx.deuda;
    if (Sx.act) for (const k in Sx.act) moverActor(k, Sx.act[k]);
    if (Sx.onf) M.onf.prestigio = R.clamp(M.onf.prestigio + Sx.onf * (0.5 + 0.25 * n), 0, 100);
    for (const p of socios) moverPais(p, 10);
    M.secretos.push({ id, socios, mes: S.mes || 1, filtrado: false, fuga: Sx.fuga * (Sx.multi ? (0.7 + 0.3 * n) : 1) });
    const msg = `Acuerdo reservado firmado con ${socios.map(nombrePais).join(", ")}: ${Sx.nombre}. No pasa por el Congreso ni sale en el Boletín Oficial. Mientras no se filtre, todo bien.`;
    log(msg, "aviso"); return { ok: true, msg, tipo: "aviso" };
  });
}
function votarONF(voto) {
  const M = mundo(), R0 = M.onf.pendiente && RESOLUCIONES_ONF.find(r => r.id === M.onf.pendiente);
  if (!R0) return { ok: false, msg: "No hay ninguna votación pendiente." };
  const ef = R0[voto] || {};
  for (const k in ef) moverPais(k, ef[k] * (M.onf.consejo && R0.consejo ? 1.5 : 1));
  if (R0.malvinas && voto === "si") aplicarEfectos({ imagen: 1, legitimidad: 1 });
  if (voto === "abst") M.onf.prestigio = R.clamp(M.onf.prestigio - 1, 0, 100); else M.onf.prestigio = R.clamp(M.onf.prestigio + 1, 0, 100);
  const bloque = M.secretos.find(s => s.id === "bloqueONF" && !s.filtrado);
  const txtVoto = { si: "a favor", no: "en contra", abst: "abstención" }[voto];
  M.onf.votos.unshift({ mes: S.mes || 1, id: R0.id, voto, texto: R0.texto, aprobada: R.rand() < (R0.consejo ? 0.45 : 0.7) });
  M.onf.pendiente = null;
  const msg = `La Argentina votó ${txtVoto} en la ${R0.consejo ? ONF.consejo : "Asamblea General"} de la ONF. ${M.onf.votos[0].aprobada ? "La resolución fue aprobada." : "La resolución no alcanzó los votos."}${bloque ? " Votaste en línea con tu bloque reservado." : ""}`;
  log(msg, "info"); return { ok: true, msg };
}
function candidaturaConsejo() {
  return conCasillero(1, () => {
    const M = mundo();
    if (M.onf.consejo) return { ok: false, msg: "Ya tenés un asiento en el Consejo de Paz y Seguridad." };
    if (M.onf.candidatura) return { ok: false, msg: "La campaña ya está en marcha." };
    M.onf.candidatura = { votacion: (S.mes || 1) + 3 };
    const msg = "Lanzás la candidatura argentina a un asiento no permanente en el Consejo de Paz y Seguridad. La Asamblea vota en tres meses: suman la relación con cada bloque y el prestigio en la ONF.";
    log(msg, "info"); return { ok: true, msg };
  });
}
function pasoCancilleria(eventos) {
  const M = mundo(), mes = S.mes || 1;
  // filtraciones de acuerdos reservados
  const per = (S.periodistas || []).reduce((a, p) => a + (p.progreso || 0), 0) / Math.max(1, (S.periodistas || []).length);
  const can = titularDe("Cancillería");
  for (const sx of M.secretos) {
    if (sx.filtrado) continue;
    const Sx = SECRETOS.find(s => s.id === sx.id);
    const p = sx.fuga * (1 + per / 150) * (can && can.lealtad < 35 ? 1.6 : 1) * (1 + (mes - sx.mes) / 24);
    if (R.rand() < p) {
      sx.filtrado = true;
      aplicarEfectos(Sx.escandalo);
      for (const k in Sx.rivales) moverPais(k, Sx.rivales[k]);
      for (const k in S.bloques || {}) if (k !== S.jugador.partido) S.bloques[k].relacion -= 10;
      if (typeof moverActor === "function") moverActor("prensa", -8);
      if (Sx.causa && typeof nuevaCausa === "function") nuevaCausa("acuerdoSecreto");
      const t = `Se filtró el acuerdo reservado "${Sx.nombre}" con ${sx.socios.map(nombrePais).join(", ")}. La oposición habla de traición a la patria y pide interpelar al canciller.${Sx.causa ? " Un fiscal abre una investigación." : ""}`;
      titular(R.pick(["Diario El Faro", "Página Sur", "La Posta"]), `Exclusivo: el acuerdo secreto con ${nombrePais(sx.socios[0])}`);
      eventos.push({ titulo: "Filtración: acuerdo secreto", texto: t, tipo: "malo" }); log(t, "malo");
    }
  }
  // préstamo puente: hay que devolverlo
  const pp = M.secretos.find(s => s.id === "prestamoPuente" && mes - s.mes === 12);
  if (pp) { S.ind.reservas -= 3300 * (S.escalaRes || 1); eventos.push({ titulo: "Vence el préstamo puente", texto: "Se devuelve el préstamo reservado con intereses: salen 3.300 millones de las reservas.", tipo: "aviso" }); }
  // votaciones en la ONF
  if (!M.onf.pendiente && R.rand() < (M.onf.consejo ? 0.35 : 0.2)) {
    const pos = RESOLUCIONES_ONF.filter(r => (!r.consejo || M.onf.consejo) && !M.onf.votos.slice(0, 3).some(v => v.id === r.id));
    if (pos.length) { M.onf.pendiente = R.pick(pos).id; eventos.push({ titulo: "Votación en la ONF", texto: RESOLUCIONES_ONF.find(r => r.id === M.onf.pendiente).texto + " La Cancillería espera tu instrucción de voto.", tipo: "info" }); }
  }
  // candidatura al Consejo
  if (M.onf.candidatura && mes >= M.onf.candidatura.votacion) {
    const relProm = Object.keys(M.rel).reduce((a, k) => a + relPais(k), 0) / Object.keys(M.rel).length;
    const p = R.clamp(0.3 + M.onf.prestigio / 200 + relProm / 300, 0.05, 0.9);
    M.onf.candidatura = null;
    if (R.rand() < p) { M.onf.consejo = { hasta: mes + 24 }; aplicarEfectos({ legitimidad: 3, imagen: 2 }); eventos.push({ titulo: "La Argentina, al Consejo de Paz y Seguridad", texto: "La Asamblea General de la ONF eligió a la Argentina para un asiento no permanente por dos años. Más voz internacional y más presión de las potencias.", tipo: "bueno" }); }
    else { aplicarEfectos({ imagen: -1 }); eventos.push({ titulo: "Derrota en la ONF", texto: "La candidatura al Consejo de Paz y Seguridad no consiguió los dos tercios.", tipo: "malo" }); }
  }
  if (M.onf.consejo && mes > M.onf.consejo.hasta) M.onf.consejo = false;
  if (M.onf.cascos > 0) aplicarEfectos({ legitimidad: 0.1 });
}
