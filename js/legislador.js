// =============================================================
//  VALDORA - Escala legislador: diputado nacional y jefe de bloque
//  La campaña es por la lista de la provincia (Entre Ríos con el foco
//  activado): Diputados por D'Hondt o Senado por lista incompleta. En la Cámara
//  conducís tu bloque: posición en cada votación, disciplina,
//  negociaciones con la Casa Rosada y los gobernadores, proyectos
//  propios, interpelaciones, juicio político y sesiones especiales.
// =============================================================

function esLegislador() { return !!(S && S.cfg && S.cfg.objetivo === "legislador"); }
// Cámara del jugador: Diputados (257) o Senado (72), con su distrito
function camLeg() {
  const sen = !!(S && S.cfg && S.cfg.camaraLeg === "sen");
  const D = DISTRITO_LEG[PROV_LEG] || DISTRITO_LEG.buenosaires;
  return sen
    ? { sen: true, total: 72, nombre: "Senado", miembro: "senador", miembros: "senadores", bancas: 3, prov: PROVINCIAS_JUGABLES[PROV_LEG].nombre,
        base: { MNJ: 33, UR: 13, FC: 8, LY: 7, PROV: 11 } }
    : { sen: false, total: 257, nombre: "Cámara de Diputados", miembro: "diputado", miembros: "diputados", bancas: D.dipRenueva, prov: PROVINCIAS_JUGABLES[PROV_LEG].nombre,
        base: { MNJ: 96, FC: 72, UR: 38, LY: 26, FT: 5, PROV: 20 } };
}
// Senado: lista incompleta, 2 bancas para el primero y 1 para el segundo
function repartoSenado(votos) {
  const o = Object.entries(votos).sort((a, b) => b[1] - a[1]), r = {};
  if (o[0]) r[o[0][0]] = 2;
  if (o[1]) r[o[1][0]] = 1;
  return r;
}
// Los textos del bloque están escritos para Diputados: para un senador se adaptan
function txtCam(t) {
  if (!t || !esLegislador() || !camLeg().sen) return t;
  return String(t).replace(/Cámara de Diputados/g, "Senado").replace(/diputados nacionales/g, "senadores nacionales").replace(/diputado nacional/g, "senador nacional")
    .replace(/diputados/g, "senadores").replace(/diputado/g, "senador").replace(/Diputado/g, "Senador");
}

const _eleccionGeneralLeg = eleccionGeneral;
eleccionGeneral = function () {
  if (!esLegislador()) return _eleccionGeneralLeg();
  const C = camLeg();
  const cands = S.candidatos.filter(c => c.activo);
  const res = resultadosNacionales(cands);
  S.resultadoGeneral = res;
  const votos = {};
  if (C.sen) Object.assign(votos, res.nac);
  else for (const id in res.nac) if (res.nac[id] >= 3) votos[id] = res.nac[id];
  const bancas = C.sen ? repartoSenado(votos) : dHondt(votos, C.bancas);
  S.bancasLista = bancas;
  const texto = Object.entries(res.nac).sort((a, b) => b[1] - a[1]).map(([id, v]) => {
    const c = S.candidatos.find(x => x.id === id);
    return `${c.nombre} (${PARTIDOS[c.partido].corto}) ${fmt(v)}%: ${bancas[id] || 0} ${bancas[id] === 1 ? "banca" : "bancas"}`;
  }).join(" · ");
  const titulo = C.sen ? `Senadores por ${C.prov}` : `Diputados por ${C.prov}`;
  const mias = bancas.yo || 0;
  if (!mias) {
    S.perdio = true; S.motivoDerrota = `${titulo}: ${texto}. ${C.sen ? "Tu lista no salió primera ni segunda: el Senado reparte 2 bancas al ganador y 1 a la minoría." : "Tu lista no llegó al umbral del 3% o no alcanzó para una banca."}`;
    log(S.motivoDerrota, "malo");
    return { titulo: "Resultado electoral", texto: S.motivoDerrota, tipo: "malo" };
  }
  log(`${titulo}: ${texto}. Encabezás la lista: sos ${C.miembro} nacional.`, "bueno");
  iniciarLegislatura(mias);
  const sistema = C.sen ? "3 bancas: 2 para la lista más votada y 1 para la segunda" : `${C.bancas} bancas, sistema D'Hondt, umbral 3%`;
  return { titulo: C.sen ? "¡Entraste al Senado!" : "¡Entraste a la Cámara!", texto: `${titulo} (${sistema}): ${texto}. ${C.sen ? (mias === 2 ? "Tu lista ganó y se queda con la mayoría de la provincia." : "Entraste por la minoría.") : `Tu lista metió ${mias} ${mias === 1 ? "banca" : "bancas"}.`} Tu bloque te elige presidente.`, tipo: "bueno" };
};

// ---------- Inicio del mandato ----------
function iniciarLegislatura(mias) {
  const yo = S.jugador;
  S.fase = "legislador";
  S.trimestre = 1; S.mes = 1; S.paso = 1 / 3;
  // el resto de la Cámara viene de otras provincias y del turno anterior
  const C = camLeg(), base = C.base;
  const nuevas = Object.values(S.bancasLista).reduce((a, v) => a + v, 0);
  const resto = C.total - nuevas;
  const totBase = Object.values(base).reduce((a, v) => a + v, 0);
  const cam = {};
  for (const k in base) cam[k] = Math.round(base[k] * resto / totBase);
  for (const id in S.bancasLista) { const p = S.candidatos.find(c => c.id === id).partido; cam[p] = (cam[p] || 0) + S.bancasLista[id]; }
  // ajustar al total exacto
  let suma = Object.values(cam).reduce((a, v) => a + v, 0);
  cam.MNJ += C.total - suma;
  S.camTotal = C.total;
  S.cam = cam;
  // presidente de la Nación (exógeno)
  const opciones = ["MNJ", "FC", "UR", "LY"];
  S.presNac = { partido: R.rand() < 0.35 && opciones.includes(yo.partido) ? yo.partido : R.pick(opciones), imagen: 50 + Math.round((R.rand() - 0.5) * 16) };
  S.oficialismo = S.presNac.partido === yo.partido;
  S.leg2 = {
    influencia: 25 + Math.min(20, cam[yo.partido] / 4),
    imagen: 45 + (yo.carisma - 5) * 2,
    disciplina: 75,
    relPres: S.oficialismo ? 50 : -10,
    recursos: 3,
    leyesPropias: 0,
    votosGanados: 0,
    decisivo: 0,
  };
  S.relBloques = {};
  for (const k in cam) if (k !== yo.partido) S.relBloques[k] = R.clamp(30 - Math.abs(PARTIDOS[k].ideo - yo.ideo) / 2, -30, 60);
  S.proyLeg = []; S.expLeg = []; S.histLeg = []; S.diferidosLeg = []; S.propiosEnComision = [];
  S.accionesLeg = 1;
  S.hist = [{ t: 0, ...S.leg2 }];
  generarAgendaLeg();
  log(`Juraste como ${C.miembro} nacional por ${C.prov}. Tu bloque (${PARTIDOS[yo.partido].corto}) tiene ${cam[yo.partido]} de ${C.total} bancas. El presidente de la Nación es del ${PARTIDOS[S.presNac.partido].corto}: ${S.oficialismo ? "sos oficialismo" : "sos oposición"}.`, "info");
}

// ---------- Proyectos que llegan al recinto ----------
// ideo: dónde se ubica el proyecto; pop: cuánto le gusta a la opinión pública (-10 a 10)
// origen: "ejecutivo" (lo manda el presidente) u "oposicion"; dosTercios si lo requiere
const PROYECTOS_LEG = [
  { id: "presupuesto", nombre: "Presupuesto nacional", texto: "El Ejecutivo manda el presupuesto del año próximo. Sin presupuesto, gobierna con la prórroga del anterior y reparte a discreción.", ideo: 50, pop: 0, origen: "ejecutivo" },
  { id: "laboral", nombre: "Reforma laboral", texto: "Período de prueba más largo, indemnizaciones por fondo de cese y límites al derecho de huelga en servicios esenciales.", ideo: 72, pop: -2, origen: "ejecutivo" },
  { id: "fortunas", nombre: "Aporte extraordinario de las grandes fortunas", texto: "Un impuesto por única vez a los patrimonios de más de 300 millones.", ideo: 22, pop: 5, origen: "ejecutivo" },
  { id: "alquileres", nombre: "Nueva ley de alquileres", texto: "Contratos de tres años con actualización anual por índice oficial.", ideo: 35, pop: 2, origen: "oposicion" },
  { id: "imputabilidad", nombre: "Baja de la edad de imputabilidad", texto: "Bajar de 16 a 14 años la edad para juzgar penalmente a menores.", ideo: 74, pop: 4, origen: "ejecutivo" },
  { id: "fmiLey", nombre: "Aprobación del acuerdo con el Fondo", texto: "Por ley, el Congreso debe aprobar todo nuevo endeudamiento con el Fondo.", ideo: 60, pop: -3, origen: "ejecutivo" },
  { id: "emergenciaAlim", nombre: "Emergencia alimentaria", texto: "Duplica los fondos para comedores por dos años.", ideo: 25, pop: 6, origen: "oposicion" },
  { id: "jubilatoria", nombre: "Nueva fórmula de movilidad jubilatoria", texto: "Cambia cómo se actualizan las jubilaciones. Los jubilados protestan frente al Congreso.", ideo: 62, pop: -5, origen: "ejecutivo" },
  { id: "corteAmpl", nombre: "Ampliación de la Corte Suprema", texto: "Pasar de 5 a 9 jueces. La oposición denuncia que el Ejecutivo quiere una Corte propia.", ideo: 40, pop: -4, origen: "ejecutivo" },
  { id: "fichaLimpia", nombre: "Ficha limpia", texto: "Impide ser candidato a quien tenga condena confirmada en segunda instancia por corrupción.", ideo: 60, pop: 7, origen: "oposicion" },
  { id: "boletaUnica", nombre: "Boleta única de papel", texto: "Reemplaza las boletas partidarias por una boleta única. Los aparatos partidarios pierden poder.", ideo: 62, pop: 4, origen: "oposicion" },
  { id: "rechazoDNU", nombre: "Rechazo de un DNU del Ejecutivo", texto: "La oposición quiere voltear un decreto de necesidad y urgencia que desregula la economía. Hacen falta las dos cámaras.", ideo: 35, pop: 1, origen: "oposicion" },
  { id: "privatizacion", nombre: "Privatización de empresas públicas", texto: "Declara sujetas a privatización a la aerolínea, el correo y la empresa de agua.", ideo: 80, pop: -3, origen: "ejecutivo" },
  { id: "humedales", nombre: "Ley de humedales", texto: "Protege los humedales y frena desarrollos inmobiliarios y agrícolas en zonas inundables.", ideo: 30, pop: 4, origen: "oposicion" },
  { id: "financiamientoU", nombre: "Financiamiento universitario", texto: "Actualiza el presupuesto de las universidades por inflación. Marcha universitaria multitudinaria.", ideo: 30, pop: 7, origen: "oposicion" },
  { id: "delegacion", nombre: "Delegación de facultades al Ejecutivo", texto: "El presidente pide facultades legislativas por un año en materia económica (art. 76).", ideo: 65, pop: -2, origen: "ejecutivo" },
];

// Dilemas internos del bloque
const DILEMAS_BLOQUE = [
  { id: "discolo", titulo: "Un díscolo amenaza con irse", texto: "Un diputado de tu bloque, alineado con su gobernador, amenaza con armar un monobloque si no le dan la presidencia de una comisión.",
    opciones: [{ t: "Darle la comisión", pista: "Retenés la banca, otros toman nota", fx: { disciplina: 4, influencia: -2 }, dif: [{ en: 2, texto: "Otros dos diputados piden lo mismo que el díscolo.", fx: { disciplina: -5 } }] },
               { t: "Dejarlo ir", pista: "Perdés una banca, ganás autoridad", fx: { disciplina: 6, influencia: -3 }, bancas: -1 },
               { t: "Hablar con su gobernador", pista: "Cuesta recursos", fx: { disciplina: 3, recursos: -1 } }] },
  { id: "desafuero", titulo: "Piden el desafuero de un compañero", texto: "Un juez federal pide el desafuero de un diputado de tu bloque procesado por enriquecimiento ilícito.",
    opciones: [{ t: "Defenderlo: persecución política", pista: "El bloque te lo agradece; la sociedad no", fx: { disciplina: 6, imagen: -6 } },
               { t: "Votar el desafuero", pista: "Imagen, pero el bloque se resiente", fx: { imagen: 6, disciplina: -8 } },
               { t: "Pedirle que pida licencia", pista: "Salida intermedia", fx: { imagen: 2, disciplina: -2 } }] },
  { id: "comisionPres", titulo: "La presidencia de la comisión de Presupuesto", texto: "Se reparten las comisiones. Podés pelear la de Presupuesto y Hacienda, la más poderosa de la Cámara.",
    opciones: [{ t: "Pelearla a fondo", pista: "Si la ganás, controlás los dictámenes", fx: {}, especial: "comisionPres" },
               { t: "Cambiarla por tres comisiones menores", pista: "Más cargos para repartir", fx: { disciplina: 5, recursos: 1 } },
               { t: "Cedérsela a un aliado", pista: "Mejora la relación con otro bloque", especial: "cederComision" }] },
  { id: "viajes", titulo: "Escándalo de los pasajes", texto: "Un portal publica que diputados de tu bloque usaron pasajes oficiales para viajes de vacaciones.",
    opciones: [{ t: "Devolver los pasajes y pedir disculpas", pista: "Daño controlado", fx: { imagen: -2, disciplina: -2 } },
               { t: "Negar todo", pista: "Si sale más, peor", fx: {}, especial: "negar" },
               { t: "Proponer eliminar los pasajes para todos", pista: "Popular; tus colegas te odian", fx: { imagen: 6, disciplina: -4, influencia: -3 } }] },
  { id: "gobernadorPide", titulo: "Los gobernadores pasan la factura", texto: "Dos gobernadores de tu partido quieren que sus diputados apoyen al Ejecutivo a cambio de obras para sus provincias.",
    opciones: [{ t: "Liberar a esos diputados", pista: "Cuidás a los gobernadores, perdés cohesión", fx: { disciplina: -6, relPres: 8 } },
               { t: "Exigir disciplina", pista: "Choque con los gobernadores", fx: { disciplina: 3, influencia: -2 }, dif: [{ en: 1, texto: "Los gobernadores te quitan respaldo en las listas.", fx: { influencia: -3 } }] },
               { t: "Negociar las obras en nombre del bloque", pista: "Recursos para todos", fx: { recursos: 2, relPres: 4, imagen: -1 } }] },
  { id: "interbloque", titulo: "Propuesta de interbloque", texto: "Un bloque afín te propone formar un interbloque para coordinar votos y repartir lugares en comisiones.",
    opciones: [{ t: "Aceptar el interbloque", pista: "Más peso en la Cámara", fx: { influencia: 6, disciplina: -2 }, especial: "interbloque" },
               { t: "Rechazar: el bloque tiene identidad propia", pista: "Cohesión", fx: { disciplina: 3 } },
               { t: "Acuerdo puntual por temas", pista: "Intermedio", fx: { influencia: 2 } }] },
  { id: "operativoCompra", titulo: "Ofrecen \"embajadas\" a tus diputados", texto: "La Casa Rosada ofrece cargos y fondos a diputados de tu bloque, uno por uno, para que voten sus leyes.",
    opciones: [{ t: "Denunciarlo públicamente", pista: "Imagen; guerra con el Ejecutivo", fx: { imagen: 4, relPres: -12, disciplina: 2 } },
               { t: "Negociar en bloque para no perder a nadie", pista: "Plata para todos; menos independencia", fx: { recursos: 2, relPres: 8, imagen: -3 } },
               { t: "Mirar para otro lado", pista: "Algunos se van a dar vuelta", fx: { disciplina: -8 } }] },
  { id: "sesionEspecial", titulo: "La oposición pide una sesión especial", texto: "Otros bloques juntan firmas para una sesión especial sin pasar por comisión. Necesitan tu quórum.",
    opciones: [{ t: "Dar quórum", pista: "Te ganás a esos bloques", fx: { influencia: 3, relPres: -6 }, especial: "relTodos:8" },
               { t: "Negar quórum y dejarlos sentados", pista: "Fiel al Ejecutivo si sos oficialismo", fx: { relPres: 6 }, especial: "relTodos:-8" },
               { t: "Dar quórum a cambio de un tema tuyo en el orden del día", pista: "Negociación fina", fx: { influencia: 2, recursos: 1 } }] },
];

function generarAgendaLeg() {
  const recientes = S.histLeg.slice(-8);
  let pos = PROYECTOS_LEG.filter(p => !recientes.includes(p.id));
  pos = pos.filter(p => p.id !== "presupuesto");
  const el = [];
  // un proyecto por mes; el Presupuesto llega en septiembre
  if ((S.mes || 1) % 12 === 9) el.push("presupuesto");
  while (el.length < 1 && pos.length) { const p = R.pick(pos); el.push(p.id); pos = pos.filter(x => x !== p); }
  // el origen se acomoda al presidente: lo que es de izquierda o derecha lo manda el Ejecutivo afín
  S.proyLeg = el.map(id => {
    const P = PROYECTOS_LEG.find(x => x.id === id);
    const presIdeo = PARTIDOS[S.presNac.partido].ideo;
    const delEjecutivo = id === "presupuesto" || (P.origen === "ejecutivo" ? Math.abs(P.ideo - presIdeo) < 30 : Math.abs(P.ideo - presIdeo) < 15);
    return { id, origen: delEjecutivo ? "ejecutivo" : "oposicion", resuelto: false };
  });
  S.histLeg.push(...el);
  // los problemas internos del bloque aparecen algunos meses
  S.expLeg = [];
  if ((S.mes || 1) === 1 || R.rand() < 0.4) {
    const recB = (S.histBloque || []).slice(-4);
    const posB = DILEMAS_BLOQUE.filter(d => !recB.includes(d.id));
    const d = R.pick(posB);
    S.histBloque = [...(S.histBloque || []), d.id];
    S.expLeg = [{ id: d.id, resuelto: false }];
  }
  S.accionesLeg = 1;
}

function aplicarLeg(fx) {
  if (!fx) return;
  const L = S.leg2;
  for (const k in fx) if (k in L) L[k] += fx[k];
  L.influencia = R.clamp(L.influencia, 0, 100); L.imagen = R.clamp(L.imagen, 0, 100);
  L.disciplina = R.clamp(L.disciplina, 0, 100); L.relPres = R.clamp(L.relPres, -100, 100); L.recursos = Math.max(0, L.recursos);
}

// ---------- Votación en el recinto ----------
// postura: "favor", "contra", "libertad", "negociar"
function votarRecinto(pr, postura) {
  const P = PROYECTOS_LEG.find(x => x.id === pr.id);
  const yo = S.jugador, L = S.leg2, pres = S.presNac.partido;
  const detalle = [];
  let si = 0, no = 0, aus = 0;
  const presentes = {};
  for (const k in S.cam) {
    const n = S.cam[k]; if (!n) continue;
    let bSi, bNo, bAus;
    if (k === yo.partido) {
      // tu bloque: sigue tu postura según la disciplina; los que no están de acuerdo se dan vuelta o se ausentan
      const afin = 1 - Math.abs(P.ideo - PARTIDOS[k].ideo) / 60;
      const disc = L.disciplina / 100;
      if (postura === "libertad") { bSi = Math.round(n * R.clamp(afin, 0.05, 0.95)); bAus = Math.round((n - bSi) * 0.3); bNo = n - bSi - bAus; }
      else {
        const aFavor = postura === "favor" || postura === "negociar";
        const conformes = aFavor ? R.clamp(disc * 0.7 + afin * 0.3 + 0.1, 0, 1) : R.clamp(disc * 0.7 + (1 - afin) * 0.3 + 0.1, 0, 1);
        const siguen = Math.round(n * conformes);
        const rebeldes = n - siguen;
        bAus = Math.round(rebeldes * 0.5);
        if (aFavor) { bSi = siguen; bNo = rebeldes - bAus; } else { bNo = siguen; bSi = rebeldes - bAus; }
      }
    } else {
      // los otros bloques: ideología, si el proyecto es del Ejecutivo y si el presidente es de ellos
      let p;
      if (S._propio) {
        // un proyecto ajeno: los bloques no regalan votos a un jefe de bloque rival
        p = Math.max(0, 1 - Math.abs(P.ideo - PARTIDOS[k].ideo) / 30) * 0.22 + L.influencia / 900 + P.pop / 120 + (S.relBloques[k] || 0) / 500;
        if (!S.oficialismo && k === pres) p -= 0.2;
        if (S.oficialismo) p -= 0.05;
      } else {
        p = 0.5 + (1 - Math.abs(P.ideo - PARTIDOS[k].ideo) / 40) * 0.35;
        if (pr.origen === "ejecutivo") p += k === pres ? 0.45 : -0.1;
        else p += k === pres ? -0.35 : 0.05;
      }
      if (k === "PROV") p = 0.45 + (pr.origen === "ejecutivo" ? 0.15 : 0) + (S.relBloques[k] || 0) / 300;
      p += (S.relBloques[k] || 0) / 400 + R.gauss() * 0.08;
      p = R.clamp(p, 0.02, 0.98);
      const masa = Math.round(n * 0.85);
      const bloqueSi = R.rand() < p;
      bSi = (bloqueSi ? masa : 0) + Math.round((n - masa) * p);
      bAus = Math.round((n - bSi) * 0.12);
      bNo = n - bSi - bAus;
    }
    detalle.push({ bloque: k, si: bSi, no: bNo, aus: bAus });
    si += bSi; no += bNo; aus += bAus;
  }
  const quorum = si + no >= Math.floor(camLeg().total / 2) + 1;
  const necesario = Math.floor((si + no) / 2) + 1;
  return { camara: camLeg().sen ? "sen" : "dip", si, no, aus, quorum, necesario, aprobado: quorum && si >= necesario, detalle };
}

function resolverProyecto(idx, postura) {
  const pr = S.proyLeg[idx]; if (!pr || pr.resuelto) return null;
  const P = PROYECTOS_LEG.find(x => x.id === pr.id);
  const yo = S.jugador, L = S.leg2;
  pr.resuelto = true; pr.postura = postura;
  const pasos = [];
  let extra = "";
  if (postura === "negociar") {
    // apoyo a cambio de obras y cargos: cuanto más necesita el Ejecutivo tus votos, más sacás
    const necesita = pr.origen === "ejecutivo" && !S.oficialismo;
    const botin = necesita ? 2 + Math.round((yo.negociacion - 5) / 2) : 1;
    aplicarLeg({ recursos: botin, relPres: necesita ? 10 : 4, imagen: -2 - Math.max(0, -P.pop) / 2 });
    extra = ` Negociaste tu apoyo a cambio de ${botin} ${botin === 1 ? "favor" : "favores"} (obras, cargos y fondos para provincias).`;
  }
  const v = votarRecinto(pr, postura);
  pasos.push(v);
  const misVotos = v.detalle.find(d => d.bloque === yo.partido) || { si: 0, no: 0 };
  const margen = Math.abs(v.si - v.no);
  const quisoAprobar = postura === "favor" || postura === "negociar";
  const gano = postura !== "libertad" && (quisoAprobar === v.aprobado);
  const decisivo = gano && margen <= (S.cam[yo.partido] || 0);
  // efectos
  const afinPartido = 1 - Math.abs(P.ideo - PARTIDOS[yo.partido].ideo) / 50;
  if (postura !== "libertad") {
    // votar contra la identidad del partido erosiona la disciplina
    const contraIdentidad = quisoAprobar ? afinPartido < 0.3 : afinPartido > 0.7;
    if (contraIdentidad) aplicarLeg({ disciplina: -7 });
    else aplicarLeg({ disciplina: 2 });
    aplicarLeg({ imagen: (quisoAprobar ? P.pop : -P.pop) * 0.4 });
  } else aplicarLeg({ disciplina: 1, influencia: -2 });
  if (gano) { L.votosGanados++; aplicarLeg({ influencia: 1 }); }
  if (decisivo) { L.decisivo++; aplicarLeg({ influencia: 3 }); }
  if (postura === "negociar" && !S.oficialismo) aplicarLeg({ disciplina: -3 });
  if (pr.origen === "ejecutivo" && postura !== "libertad") aplicarLeg({ relPres: quisoAprobar ? 6 : -8 });
  // los otros bloques registran de qué lado estuviste
  for (const k in S.relBloques) {
    const d = v.detalle.find(x => x.bloque === k); if (!d) continue;
    const votoBloqueSi = d.si > d.no;
    if (postura !== "libertad") S.relBloques[k] = R.clamp(S.relBloques[k] + (votoBloqueSi === quisoAprobar ? 3 : -3), -60, 80);
  }
  const nombrePost = { favor: "a favor", contra: "en contra", libertad: "con libertad de acción", negociar: "a favor, negociando" }[postura];
  const res = !v.quorum ? "no hubo quórum y la sesión se cayó" : v.aprobado ? "se aprobó" : "fue rechazado";
  const msg = `${P.nombre}: tu bloque votó ${nombrePost} (${misVotos.si} sí, ${misVotos.no} no) y el proyecto ${res}.${decisivo ? " Tus votos fueron decisivos." : ""}${extra}`;
  log(msg, gano ? "bueno" : postura === "libertad" ? "info" : "malo");
  if (pr.id === "presupuesto" && !v.aprobado && S.oficialismo) aplicarLeg({ relPres: -10 });
  return { msg, pasos, tipo: gano ? "bueno" : "info" };
}

function resolverExpBloque(idx, op) {
  const e = S.expLeg[idx]; if (!e || e.resuelto) return null;
  const d = DILEMAS_BLOQUE.find(x => x.id === e.id);
  const o = d.opciones[op];
  e.resuelto = true; e.eleccion = op;
  aplicarLeg(o.fx);
  if (o.dif) for (const df of o.dif) S.diferidosLeg.push({ t: S.trimestre + df.en, texto: df.texto, fx: df.fx, origen: d.titulo });
  let msg = "";
  if (o.bancas) { S.cam[S.jugador.partido] += o.bancas; S.cam.PROV += -o.bancas; msg = `Se fue un ${camLeg().miembro} y armó un monobloque.`; }
  if (o.especial === "comisionPres") {
    if (R.rand() < 0.3 + S.leg2.influencia / 150) { S.comisionPres = true; aplicarLeg({ influencia: 8 }); msg = "Ganaste la presidencia de la comisión de Presupuesto y Hacienda: tus proyectos consiguen dictamen más fácil."; }
    else { aplicarLeg({ influencia: -3 }); msg = "Perdiste la pulseada: la comisión quedó para otro bloque."; }
  }
  if (o.especial === "cederComision") {
    const otros = Object.keys(S.relBloques).sort((a, b) => S.relBloques[b] - S.relBloques[a]);
    S.relBloques[otros[0]] += 20; msg = `El bloque ${PARTIDOS[otros[0]].corto} te lo agradece.`;
  }
  if (o.especial === "negar") {
    if (R.rand() < 0.5) { aplicarLeg({ imagen: -9, disciplina: -3 }); msg = "Aparecieron las fotos de las vacaciones. Peor que si hubieras admitido."; }
    else msg = "La noticia se apagó sola.";
  }
  if (o.especial === "interbloque") {
    const afines = Object.keys(S.relBloques).sort((a, b) => Math.abs(PARTIDOS[a].ideo - S.jugador.ideo) - Math.abs(PARTIDOS[b].ideo - S.jugador.ideo));
    S.relBloques[afines[0]] += 25; S.interbloque = afines[0]; msg = `Formaste un interbloque con ${PARTIDOS[afines[0]].nombre}.`;
  }
  if (o.especial && o.especial.startsWith("relTodos")) { const n = +o.especial.split(":")[1]; for (const k in S.relBloques) if (k !== S.presNac.partido) S.relBloques[k] += n; }
  const texto = `${d.titulo}: ${o.t}. ${msg}`.trim();
  log(texto, "info");
  return { msg: texto, tipo: "info" };
}

// ---------- Acciones del jefe de bloque ----------
const TEMAS_PROPIOS = [
  { id: "pymes", nombre: "Alivio fiscal para pymes", ideo: 55, pop: 4 },
  { id: "salud", nombre: "Ley de salud mental y adicciones", ideo: 45, pop: 3 },
  { id: "transparencia", nombre: "Ley de acceso a la información y declaraciones juradas", ideo: 55, pop: 5 },
  { id: "violencia", nombre: "Ley integral contra la violencia de género", ideo: 35, pop: 4 },
  { id: "conectividad", nombre: "Conectividad rural y escuelas", ideo: 45, pop: 3 },
  { id: "cannabis", nombre: "Cannabis medicinal y autocultivo", ideo: 30, pop: 1 },
  { id: "penas", nombre: "Endurecimiento de penas por narcotráfico", ideo: 72, pop: 4 },
  { id: "regalias", nombre: "Reparto de regalías con las provincias", ideo: 40, pop: 2 },
];

function accionLeg(tipo, arg) {
  const L = S.leg2, yo = S.jugador;
  if (S.accionesLeg <= 0) return { msg: "Ya usaste las acciones de este mes.", tipo: "aviso" };
  S.accionesLeg--;
  let msg = "", pasos = [], t = "info";
  switch (tipo) {
    case "proyecto": {
      const T = TEMAS_PROPIOS.find(x => x.id === arg);
      if (S.propiosEnComision.length >= 3) { S.accionesLeg++; return { msg: "Ya tenés tres proyectos esperando dictamen. Las comisiones no te van a dar más lugar.", tipo: "aviso" }; }
      if (S.propiosEnComision.some(x => x.id === arg)) { S.accionesLeg++; return { msg: "Ese proyecto ya está en comisión.", tipo: "aviso" }; }
      S.propiosEnComision.push({ id: T.id, desde: S.trimestre });
      msg = `Presentaste el proyecto "${T.nombre}". Pasa a comisión: sin dictamen no llega al recinto.`;
      break;
    }
    case "reunion": aplicarLeg({ disciplina: 8 + (yo.negociacion - 5), recursos: -1 }); msg = "Asado con el bloque: repartiste lugares y escuchaste quejas. La tropa se ordena."; break;
    case "gobernadores": if (L.recursos < 1) { S.accionesLeg++; return { msg: "No tenés favores para repartir. Negociá algo con el Ejecutivo primero.", tipo: "aviso" }; }
      aplicarLeg({ recursos: -1, disciplina: 6, influencia: 2 }); msg = `Repartiste obras entre los gobernadores de tu espacio: sus ${camLeg().miembros} te responden.`; break;
    case "medios": {
      const ok = R.rand() < 0.35 + yo.oratoria / 15;
      aplicarLeg(ok ? { imagen: 5, disciplina: -1 } : { imagen: -3 });
      msg = ok ? "Tu entrevista en el canal de noticias marcó la agenda del día." : "Te hicieron una pregunta incómoda y quedaste mal parado."; t = ok ? "bueno" : "malo"; break;
    }
    case "interpelar": {
      const apoyo = Object.entries(S.cam).filter(([k]) => k !== S.presNac.partido).reduce((a, [k, n]) => a + (k === yo.partido ? n : n * R.clamp(0.4 + (S.relBloques[k] || 0) / 100, 0, 1)), 0);
      if (S.oficialismo) { S.accionesLeg++; return { msg: "No podés interpelar a tu propio gobierno sin romper con el presidente.", tipo: "aviso" }; }
      if (apoyo >= Math.floor(camLeg().total / 2) + 1) { aplicarLeg({ imagen: 4, influencia: 5, relPres: -15 }); S.presNac.imagen -= 3; msg = "Lograste la interpelación al Jefe de Gabinete (art. 101). Pasó una tarde a la defensiva en el recinto."; t = "bueno"; }
      else { aplicarLeg({ influencia: -2 }); msg = "No juntaste la mayoría para la interpelación."; t = "malo"; }
      break;
    }
    case "juicio": {
      if (S.oficialismo) { S.accionesLeg++; return { msg: "Tu bloque no va a acusar a su propio presidente.", tipo: "aviso" }; }
      const apoyo = Object.entries(S.cam).filter(([k]) => k !== S.presNac.partido).reduce((a, [k, n]) => a + (k === yo.partido ? n * L.disciplina / 100 : n * R.clamp(0.2 + (S.relBloques[k] || 0) / 120 + (50 - S.presNac.imagen) / 100, 0, 1)), 0);
      const nec = Math.ceil(camLeg().total * 2 / 3);
      if (apoyo >= nec) { S.presNac.imagen -= 15; aplicarLeg({ influencia: 15, relPres: -40 }); msg = camLeg().sen ? `Diputados acusó y el Senado, constituido en tribunal, juntó ${Math.round(apoyo)} votos para destituir al presidente (se necesitaban ${nec}). El país entra en crisis política.` : `La Cámara acusó al presidente ante el Senado con ${Math.round(apoyo)} votos (se necesitaban ${nec}). El país entra en crisis política.`; t = "aviso"; }
      else { aplicarLeg({ imagen: -4, influencia: -4, relPres: -20 }); msg = `El pedido de juicio político juntó ${Math.round(apoyo)} votos de los ${nec} necesarios. Te acusan de golpista.`; t = "malo"; }
      break;
    }
    case "sesionEsp": {
      const pend = S.propiosEnComision[0];
      if (!pend) { S.accionesLeg++; return { msg: "No tenés proyectos esperando en comisión.", tipo: "aviso" }; }
      const T = TEMAS_PROPIOS.find(x => x.id === pend.id);
      // sesión especial: sin dictamen hacen falta dos tercios para tratar sobre tablas
      msg = votarPropio(T, true, pasos);
      S.propiosEnComision.shift();
      break;
    }
  }
  if (tipo !== "sesionEsp") log(msg, t);
  return { msg, pasos, tipo: t };
}

// votación de un proyecto propio
function votarPropio(T, sinDictamen, pasos) {
  const fake = { id: "__propio", origen: S.oficialismo ? "ejecutivo" : "oposicion" };
  const v = votarRecintoTema(fake, T);
  pasos.push(v);
  const necesario = sinDictamen ? Math.ceil((v.si + v.no) * 2 / 3) : v.necesario;
  v.necesario = necesario; v.aprobado = v.quorum && v.si >= necesario;
  let msg;
  if (v.aprobado) { S.leg2.leyesPropias++; aplicarLeg({ influencia: 5, imagen: T.pop * 0.8 }); msg = `¡Media sanción! Tu proyecto "${T.nombre}" se aprobó${sinDictamen ? " sobre tablas con dos tercios" : ""} y pasa ${camLeg().sen ? "a Diputados" : "al Senado"}.`; log(msg, "bueno"); }
  else { aplicarLeg({ influencia: -2 }); msg = `Tu proyecto "${T.nombre}" no consiguió los votos${sinDictamen ? " (sin dictamen hacían falta dos tercios)" : ""}.`; log(msg, "malo"); }
  return msg;
}
function votarRecintoTema(pr, T) {
  const tmp = { id: "__propio", nombre: T.nombre, ideo: T.ideo, pop: T.pop, origen: pr.origen };
  PROYECTOS_LEG.push(tmp);
  S._propio = true;
  try { return votarRecinto({ id: "__propio", origen: pr.origen }, "favor"); } finally { PROYECTOS_LEG.pop(); S._propio = false; }
}

// ---------- Fin del trimestre ----------
function finTrimestreLeg() {
  const L = S.leg2, yo = S.jugador, ev = [];
  if (!S.mes) S.mes = (S.trimestre - 1) * 3 + 1;
  S.paso = 1 / 3;
  const f = S.paso, cierre = finDeTrimestre();
  for (const p of S.proyLeg.filter(x => !x.resuelto)) { const r = resolverProyecto(S.proyLeg.indexOf(p), "libertad"); aplicarLeg({ influencia: -2 }); ev.push({ titulo: "Sin línea del bloque", texto: "No fijaste posición y tu bloque votó dividido. " + r.msg, pasos: r.pasos, tipo: "malo" }); }
  for (const e of S.expLeg.filter(x => !x.resuelto)) { e.resuelto = true; aplicarLeg({ disciplina: -4 }); ev.push({ titulo: "Conflicto sin atender", texto: "Dejaste pasar un problema interno del bloque y se agrandó.", tipo: "malo" }); }
  // proyectos propios en comisión: pueden conseguir dictamen
  for (const pc of S.propiosEnComision.slice()) {
    const T = TEMAS_PROPIOS.find(x => x.id === pc.id);
    const p = 0.02 + L.influencia / 1200 + (S.cam[yo.partido] || 0) / 1500 + (S.comisionPres ? 0.1 : 0) + (S.oficialismo ? 0.05 : 0) + (S.trimestre - pc.desde) * 0.03 + (typeof ajusteDictamenTema === "function" ? ajusteDictamenTema(pc) : 0);
    if (R.rand() < 1 - Math.pow(1 - Math.min(0.95, p), f)) {
      S.propiosEnComision = S.propiosEnComision.filter(x => x !== pc);
      const pasos = [];
      const msg = votarPropio(T, false, pasos);
      ev.push({ titulo: "Tu proyecto llega al recinto", texto: `La comisión firmó dictamen. ${msg}`, pasos, tipo: "info" });
    } else if (S.trimestre - pc.desde >= 6) {
      S.propiosEnComision = S.propiosEnComision.filter(x => x !== pc);
      ev.push({ titulo: "Proyecto caducado", texto: `"${T.nombre}" perdió estado parlamentario sin dictamen.`, tipo: "malo" });
    }
  }
  // diferidos
  for (const d of S.diferidosLeg.filter(x => x.t <= S.trimestre)) { aplicarLeg(d.fx); ev.push({ titulo: "Consecuencia de una decisión anterior", texto: `${d.origen}: ${d.texto}`, tipo: "info" }); }
  S.diferidosLeg = S.diferidosLeg.filter(x => x.t > S.trimestre);
  // deriva
  S.presNac.imagen = R.clamp(S.presNac.imagen + ruido(4) - 0.5 * f, 10, 80);
  const baseInf = 12 + (S.cam[yo.partido] || 0) / 3 + Math.min(L.leyesPropias, 5) * 3 + (S.comisionPres ? 8 : 0) + (S.interbloque ? 5 : 0);
  aplicarLeg({ influencia: (baseInf - L.influencia) * 0.15 * f, disciplina: ((50 - L.disciplina) * 0.08 - 1) * f, imagen: (42 - L.imagen) * 0.1 * f + ruido(2), relPres: -L.relPres * 0.05 * f });
  // estar cerca de un presidente impopular cuesta; enfrentarlo suma
  aplicarLeg({ imagen: (S.presNac.imagen - 45) / 20 * (L.relPres > 20 ? 1 : L.relPres < -20 ? -1 : 0) * f });
  // escándalo por los favores que acumulaste
  if (L.recursos > 6 && R.rand() < 0.15 * f) { aplicarLeg({ imagen: -7, recursos: -3 }); ev.push({ titulo: "Escándalo", texto: "Un medio revela el reparto de obras y cargos que negociaste a cambio de votos.", tipo: "malo" }); }
  // ruptura del bloque
  if (cierre && L.disciplina < 20) {
    const se = Math.max(1, Math.round(S.cam[yo.partido] * 0.25));
    S.cam[yo.partido] -= se; S.cam.PROV += se;
    aplicarLeg({ influencia: -8 });
    ev.push({ titulo: "Se parte el bloque", texto: `${se} ${camLeg().miembros} se van y arman su propio bloque. Te quedan ${S.cam[yo.partido]}.`, tipo: "malo" });
    if (S.cam[yo.partido] <= 0 || (L.disciplina < 10 && R.rand() < 0.5)) {
      S.perdio = true; S.motivoDerrota = "Tu bloque te desconoció como presidente y eligió otro jefe. Terminás el mandato como " + camLeg().miembro + " raso, sin poder."; ev.push({ titulo: "Destituido como jefe de bloque", texto: S.motivoDerrota, tipo: "malo" }); return ev;
    }
  }
  if (cierre && L.disciplina < 40 && R.rand() < (40 - L.disciplina) / 80 * (typeof factorJefatura === "function" ? factorJefatura() : 1)) {
    S.perdio = true; S.motivoDerrota = "Un sector del bloque te desafió en una reunión a puertas cerradas y ganó: eligen otro presidente de bloque. Seguís como " + camLeg().miembro + " raso."; ev.push({ titulo: "Te sacan la jefatura", texto: S.motivoDerrota, tipo: "malo" }); return ev;
  }
  if (cierre && L.imagen < 10) { S.perdio = true; S.motivoDerrota = "Tu imagen se desplomó y el partido te pide un paso al costado: renunciás a la presidencia del bloque."; ev.push({ titulo: "Renuncia", texto: S.motivoDerrota, tipo: "malo" }); return ev; }
  // medio término
  if (cierre && S.trimestre === 8) {
    const swing = Math.round((L.imagen - 45) / 4);
    const cambio = R.clamp(swing, -Math.floor(S.cam[yo.partido] / 3), 15);
    const mayor = Object.keys(S.cam).filter(k => k !== yo.partido).sort((a, b) => S.cam[b] - S.cam[a])[0];
    S.cam[yo.partido] += cambio; S.cam[mayor] -= cambio;
    ev.push({ titulo: "Elecciones de medio término", texto: `Tu bloque ${cambio >= 0 ? "gana" : "pierde"} ${Math.abs(cambio)} bancas. Ahora tiene ${S.cam[yo.partido]}.`, tipo: cambio >= 0 ? "bueno" : "malo" });
  }
  S.hist.push({ t: S.mes, ...L });
  S.mes++;
  S.trimestre = Math.ceil(S.mes / 3);
  if (S.mes > MESES_MANDATO) { S.terminoMandato = true; return ev; }
  generarAgendaLeg();
  return ev;
}

function puntajeLeg() {
  const L = S.leg2;
  return Math.round(L.influencia + L.imagen + L.leyesPropias * 15 + L.decisivo * 4 + L.votosGanados * 1.5 + L.disciplina / 4);
}
