// =============================================================
//  VALDORA - Jefatura de Gabinete y ministerios
//  Cada ministerio tiene titular (rasgo, capacidad, lealtad y
//  riesgo de escándalo), presupuesto, indicadores propios,
//  programas que se activan por resolución y palancas de política.
// =============================================================

const RASGOS = {
  tecnico:    { nombre: "Técnico", desc: "Gestiona bien los programas; poco peso político." },
  territorio: { nombre: "Político de territorio", desc: "Contiene conflictos y gobernadores; gestión irregular." },
  leal:       { nombre: "Leal a vos", desc: "No te va a traicionar, aunque no siempre es el mejor." },
  ambicioso:  { nombre: "Ambicioso", desc: "Capaz, pero juega para él: la lealtad se desgasta." },
  mediatico:  { nombre: "Mediático", desc: "Suma imagen, pero se expone y suma riesgo." },
  halcon:     { nombre: "Halcón", desc: "Mano dura: endurece los protocolos y choca con los movimientos." },
  negociador: { nombre: "Negociador", desc: "Destraba conflictos en la mesa de diálogo." },
};
const NOMBRES_MINISTROS = ["Laura Benavídez", "Ignacio Ferreyra Paz", "Soledad Quiroga", "Marcos Etchart", "Verónica Lanús", "Hernán Galíndez", "Paula Iriarte", "Federico Maidana", "Gabriela Sosa Lugones", "Tomás Arregui", "Carolina Dalmasso", "Ramiro Zabala", "Julieta Bonfanti", "Pablo Cendoya", "Natalia Ruffo", "Esteban Larroca", "Valeria Monzón", "Diego Achával", "Mónica Videla", "Santiago Urrutia"];

const MINISTERIOS = [
  { id: "seguridad", cargo: "Seguridad", nombre: "Ministerio de Seguridad", area: "seguridad",
    programas: [
      { id: "barrios", nombre: "Operativos federales en barrios críticos", costo: 0.05, ef: { inseguridad: -2.5, tension: 0.3 }, desc: "Gendarmería y Prefectura en los barrios con más delitos del conurbano y Rosario." },
      { id: "narco", nombre: "Plan Litoral contra el narcotráfico", costo: 0.06, ef: { inseguridad: -1.8 }, riesgo: 0.4, desc: "Fuerzas federales, fiscales y control de puertos en la hidrovía." },
      { id: "camaras", nombre: "Videovigilancia y 911 federal", costo: 0.03, ef: { inseguridad: -1 }, desc: "Cámaras, lectoras de patentes y centro de monitoreo nacional." },
      { id: "fuerzas", nombre: "Reforma y salarios de las fuerzas federales", costo: 0.08, ef: { inseguridad: -0.8 }, act: { fuerzas: 1.5 }, desc: "Aumento salarial, carrera profesional y control interno." },
    ],
    palancas: [{ id: "protocolo", nombre: "Protocolo ante cortes de calle", opciones: [
      { id: "duro", t: "Duro: despejar siempre", desc: "Los cortes duran menos; costos en legitimidad y choques con los movimientos." },
      { id: "medio", t: "Intermedio: despejar rutas, tolerar marchas", desc: "El criterio habitual." },
      { id: "dialogo", t: "Dialoguista: negociar antes de actuar", desc: "Menos violencia, más cortes." },
    ], def: "medio" }] },
  { id: "defensa", cargo: "Defensa", nombre: "Ministerio de Defensa", area: "defensa",
    programas: [
      { id: "mar", nombre: "Patrullaje marítimo contra la pesca ilegal", costo: 0.04, ef: { reservas: 40 }, desc: "Patrulleros oceánicos en la milla 201: menos depredación de calamar y merluza." },
      { id: "radares", nombre: "Radarización de la frontera norte", costo: 0.05, ef: { inseguridad: -0.8 }, desc: "Control del espacio aéreo contra vuelos narco." },
      { id: "equipo", nombre: "Modernización del equipamiento", costo: 0.12, ef: { crecimiento: 0.05 }, act: { fuerzas: 1 }, desc: "Aviones, blindados y talleres nacionales de mantenimiento." },
      { id: "emergencias", nombre: "Fuerzas Armadas en emergencias", costo: 0.02, ef: { imagen: 0.4 }, desc: "Hospitales reubicables y logística ante inundaciones e incendios." },
    ],
    palancas: [{ id: "rol", nombre: "Rol de las Fuerzas Armadas", opciones: [
      { id: "externa", t: "Solo defensa externa", desc: "Lo que marca la ley de Defensa." },
      { id: "apoyo", t: "Apoyo logístico en la frontera", desc: "Radares, transporte y vigilancia, sin tareas policiales." },
      { id: "interna", t: "Participar en seguridad interior", desc: "Baja el delito, pero exige forzar la ley de Seguridad Interior: legitimidad y Corte en contra." },
    ], def: "externa" }] },
  { id: "salud", cargo: "Salud", nombre: "Ministerio de Salud", area: "salud",
    programas: [
      { id: "vacunas", nombre: "Plan nacional de vacunación", costo: 0.04, base: true, ef: { imagen: 0.3 }, desc: "Calendario obligatorio gratuito. Si se cae, vuelven el sarampión y la coqueluche." },
      { id: "remedios", nombre: "Medicamentos gratuitos para jubilados", costo: 0.12, base: true, ef: { pobreza: -0.3, imagen: 0.6 }, desc: "Cobertura del 100% en medicamentos esenciales." },
      { id: "hospitales", nombre: "Red federal de hospitales de alta complejidad", costo: 0.2, ef: { imagen: 0.6, crecimiento: 0.05 }, desc: "Terminar y equipar hospitales en el interior." },
      { id: "mental", nombre: "Salud mental y consumos problemáticos", costo: 0.03, ef: { inseguridad: -0.4 }, desc: "Centros de atención en barrios y dispositivos en escuelas." },
    ],
    palancas: [{ id: "precios", nombre: "Política de medicamentos", opciones: [
      { id: "libre", t: "Precios libres", desc: "La industria invierte; los remedios suben." },
      { id: "acuerdo", t: "Acuerdo de precios con laboratorios", desc: "Contiene la inflación de remedios; la industria se queja." },
      { id: "publica", t: "Producción pública de genéricos", desc: "Laboratorios estatales: cuesta, pero baja precios a largo plazo." },
    ], def: "libre" }] },
  { id: "educacion", cargo: "Educación", nombre: "Ministerio de Educación", area: "educacion",
    programas: [
      { id: "alfabetizacion", nombre: "Alfabetización inicial", costo: 0.05, ef: { crecimiento: 0.03 }, desc: "Que todos los chicos lean a los 8 años: maestras, libros y evaluación." },
      { id: "becas", nombre: "Becas de estudio para jóvenes", costo: 0.08, base: true, ef: { pobreza: -0.15 }, grp: { jovenes: 0.01 }, desc: "Becas para terminar la secundaria y estudiar." },
      { id: "conectividad", nombre: "Conectividad y computadoras escolares", costo: 0.04, ef: { imagen: 0.2 }, desc: "Internet en todas las escuelas y una computadora por alumno." },
      { id: "fonid", nombre: "Fondo de incentivo docente", costo: 0.15, base: true, ef: { tension: -0.6 }, desc: "Complemento salarial nacional para los docentes de todo el país." },
    ],
    palancas: [{ id: "paritaria", nombre: "Paritaria nacional docente", opciones: [
      { id: "baja", t: "Aumento por debajo de la inflación", desc: "Ahorro fiscal; paros docentes casi seguros." },
      { id: "igual", t: "Aumento igual a la inflación", desc: "Mantiene el salario real." },
      { id: "alta", t: "Recuperación salarial", desc: "Cuesta déficit; clases sin paros." },
    ], def: "igual" }] },
  { id: "desarrollo", cargo: "Desarrollo Social", nombre: "Ministerio de Desarrollo Social y Humano", area: "social",
    programas: [
      { id: "auh", nombre: "Asignación por hijo reforzada", costo: 0.3, base: true, ef: { pobreza: -0.8, tension: -0.5 }, ind: 2, desc: "Transferencia mensual a hogares con chicos, con controles de salud y escolaridad." },
      { id: "tarjeta", nombre: "Tarjeta alimentaria", costo: 0.2, base: true, ef: { pobreza: -0.3 }, ind: 1.8, desc: "Crédito para comprar alimentos en comercios de cercanía." },
      { id: "cooperativas", nombre: "Programa de empleo cooperativo", costo: 0.25, ef: { desempleo: -0.25, tension: -0.6 }, act: { movimientos: 1.5 }, riesgo: 0.5, desc: "Cooperativas de trabajo gestionadas con organizaciones sociales." },
      { id: "infancia", nombre: "Centros de primera infancia", costo: 0.05, ef: { pobreza: -0.1 }, ind: 0.4, desc: "Jardines y cuidado para que las madres puedan trabajar." },
    ],
    palancas: [{ id: "planes", nombre: "Gestión de los planes sociales", opciones: [
      { id: "organizaciones", t: "Con las organizaciones sociales", desc: "Contienen la calle; riesgo de clientelismo y escándalos." },
      { id: "directa", t: "Pago directo con contraprestación", desc: "Más transparencia; los movimientos protestan." },
    ], def: "organizaciones" }] },
];

function ministerio(id) { return MINISTERIOS.find(m => m.id === id); }
function nuevoMinistro(cargo, base) {
  const ks = Object.keys(RASGOS);
  return { cargo, nombre: base && base.nombre || R.pick(NOMBRES_MINISTROS), comp: base && base.comp || R.clamp(4 + Math.round(R.rand() * 4), 3, 9), desgaste: 0,
    rasgo: base && base.rasgo || R.pick(ks), lealtad: base && base.lealtad != null ? base.lealtad : Math.round(45 + R.rand() * 40), riesgo: base && base.riesgo != null ? base.riesgo : Math.round(5 + R.rand() * 30) };
}
// completa el gabinete: suma Defensa, Salud y Educación y agrega rasgos al resto
function asegurarGabinete() {
  if (!S || !S.gabinete) return;
  for (const m of S.gabinete) { if (!m.rasgo) Object.assign(m, nuevoMinistro(m.cargo, { nombre: m.nombre, comp: m.comp }), { desgaste: m.desgaste || 0 }); }
  for (const c of ["Defensa", "Salud", "Educación"]) if (!S.gabinete.find(m => m.cargo === c)) S.gabinete.push(nuevoMinistro(c));
  if (!S.ministerios) {
    S.ministerios = {};
    for (const M of MINISTERIOS) S.ministerios[M.id] = { activos: M.programas.filter(p => p.base).map(p => p.id), palancas: Object.fromEntries(M.palancas.map(p => [p.id, p.def])), cambiosMes: 0 };
  }
}
function titularDe(cargoOMin) { const M = ministerio(cargoOMin); const cargo = M ? M.cargo : cargoOMin; return (S.gabinete || []).find(m => m.cargo === cargo); }
function factorMinistro(m) { if (!m) return 1; let f = 0.6 + m.comp / 10 * 0.8; if (m.rasgo === "tecnico") f += 0.15; return f; }

function toggleProgramaMin(minId, progId) {
  asegurarGabinete();
  const M = ministerio(minId), st = S.ministerios[minId], P = M && M.programas.find(p => p.id === progId);
  if (!P) return { ok: false, msg: "Programa desconocido." };
  if (st.cambiosMes >= 2) return { ok: false, msg: "Este ministerio ya firmó dos resoluciones este mes." };
  const on = st.activos.includes(progId);
  st.activos = on ? st.activos.filter(x => x !== progId) : [...st.activos, progId]; st.cambiosMes++;
  if (P.base && on && typeof moverActor === "function") { moverActor("movimientos", -6); moverActor("iglesia", -4); }
  if (typeof publicarBoletin === "function") publicarBoletin("resolucion", `${on ? "Dase de baja" : "Créase"} el programa "${P.nombre}"`, P.desc, { organismo: M.nombre });
  const msg = on ? `Se da de baja "${P.nombre}". Ahorro: ${fmt(P.costo, 2)}% del PBI por año.` : `Se lanza "${P.nombre}". Costo: ${fmt(P.costo, 2)}% del PBI por año.`;
  log(msg, on ? "aviso" : "info"); return { ok: true, msg };
}
function fijarPalanca(minId, palId, opId) {
  asegurarGabinete();
  const st = S.ministerios[minId]; if (!st) return { ok: false, msg: "Ministerio desconocido." };
  const M = ministerio(minId), Pa = M.palancas.find(p => p.id === palId), op = Pa && Pa.opciones.find(o => o.id === opId);
  if (!op) return { ok: false, msg: "Opción desconocida." };
  st.palancas[palId] = opId;
  if (palId === "rol" && opId === "interna") { aplicarEfectos({ legitimidad: -4 }); if (typeof moverActor === "function") { moverActor("corte", -8); moverActor("fuerzas", 8); } }
  if (palId === "planes" && opId === "directa" && typeof moverActor === "function") moverActor("movimientos", -12);
  if (palId === "planes" && opId === "organizaciones" && typeof moverActor === "function") moverActor("movimientos", 8);
  if (palId === "precios" && opId === "acuerdo" && typeof moverActor === "function") moverActor("industria", -5);
  const msg = `${Pa.nombre}: ${op.t}.`; log(msg, "info"); return { ok: true, msg };
}
// candidatos para reemplazar: la información sobre ellos es aproximada
function candidatosMinistro(cargo) {
  asegurarGabinete();
  S.candidatosMin = S.candidatosMin || {};
  if (!S.candidatosMin[cargo] || S.candidatosMin[cargo].mes !== S.mes) {
    const usados = new Set(S.gabinete.map(m => m.nombre));
    const lista = [];
    while (lista.length < 3) { const c = nuevoMinistro(cargo); if (!usados.has(c.nombre) && !lista.some(x => x.nombre === c.nombre)) lista.push(c); }
    S.candidatosMin[cargo] = { mes: S.mes, lista };
  }
  return S.candidatosMin[cargo].lista;
}
function reemplazarMinistro(cargo, idx) {
  return conCasillero(1, () => {
    const c = candidatosMinistro(cargo)[idx], m = S.gabinete.find(x => x.cargo === cargo);
    if (!c || !m) return { ok: false, msg: "No se encontró el cargo." };
    const viejo = m.nombre; Object.assign(m, c, { desgaste: 0 });
    S.candidatosMin[cargo] = null;
    aplicarEfectos({ imagen: -0.5 });
    if (typeof publicarBoletin === "function") publicarBoletin("decreto", `Desígnase a ${c.nombre} como ministro/a de ${cargo}`, `Acéptase la renuncia de ${viejo}.`, { organismo: "Poder Ejecutivo" });
    const msg = `Asume ${c.nombre} (${RASGOS[c.rasgo].nombre}) en ${cargo}, en reemplazo de ${viejo}.`; log(msg, "info"); return { ok: true, msg };
  });
}
function informeGestion() {
  return conCasillero(1, () => {
    const jg = titularDe("Jefe de Gabinete"); const f = factorMinistro(jg);
    aplicarEfectos({ legitimidad: 1.5 * f, imagen: 0.5 });
    for (const k in S.bloques || {}) if (k !== S.jugador.partido) S.bloques[k].relacion += 3 * f;
    const msg = `${jg ? jg.nombre : "El jefe de Gabinete"} presenta el informe de gestión en el Congreso: responde preguntas de todos los bloques durante ocho horas. Mejora la relación con la oposición.`;
    log(msg, "info"); return { ok: true, msg };
  });
}

// ---------- efectos mensuales ----------
function efectosMinisterios() {
  const X = {}; const add = (k, v) => X[k] = (X[k] || 0) + v;
  for (const M of MINISTERIOS) {
    const st = S.ministerios[M.id], f = factorMinistro(titularDe(M.cargo));
    for (const P of M.programas) {
      const on = st.activos.includes(P.id);
      const signo = P.base ? (on ? 0 : -1) : (on ? 1 : 0);
      if (!signo) continue;
      add("deficit", P.costo * signo);
      for (const k in P.ef || {}) add(k, P.ef[k] * signo * (k === "reservas" ? 1 : f * 3)); // los efectos son por mes; el motor los toma por trimestre
    }
  }
  const pal = id => { for (const M of MINISTERIOS) if (S.ministerios[M.id].palancas[id]) return S.ministerios[M.id].palancas[id]; };
  if (pal("protocolo") === "duro") { add("inseguridad", -1.5); add("tension", 1); }
  if (pal("protocolo") === "dialogo") { add("tension", -0.8); add("inseguridad", 0.8); }
  if (pal("rol") === "apoyo") add("inseguridad", -0.8);
  if (pal("rol") === "interna") add("inseguridad", -3);
  if (pal("precios") === "acuerdo") add("inflacion", -0.05);
  if (pal("precios") === "publica") { add("deficit", 0.05); add("inflacion", -0.03); }
  if (pal("paritaria") === "baja") add("deficit", -0.1);
  if (pal("paritaria") === "alta") { add("deficit", 0.15); add("tension", -0.6); }
  if (pal("planes") === "organizaciones") add("tension", -0.8);
  return X;
}
EXTRA_ECO.push(() => (S && S.fase === "gobierno" && S.ministerios) ? efectosMinisterios() : {});
function bonusIndigencia() {
  if (!S.ministerios) return 0;
  const M = ministerio("desarrollo"), st = S.ministerios.desarrollo; let b = 0;
  for (const P of M.programas) if (P.ind) { const on = st.activos.includes(P.id); b += P.base ? (on ? 0 : -P.ind) : (on ? P.ind : 0); }
  return b;
}
// cada mes: lealtad, escándalos, renuncias y palancas con efectos directos
function pasoGabinete(eventos) {
  asegurarGabinete();
  for (const M of MINISTERIOS) S.ministerios[M.id].cambiosMes = 0;
  const pal = (min, id) => S.ministerios[min].palancas[id];
  if (pal("defensa", "rol") === "interna") aplicarEfectos({ legitimidad: -0.5 });
  if (pal("seguridad", "protocolo") === "duro") aplicarEfectos({ legitimidad: -0.3 });
  if (pal("desarrollo", "planes") === "directa") aplicarEfectos({ legitimidad: 0.2 });
  for (const m of S.gabinete) {
    if (m.rasgo === "ambicioso") m.lealtad -= 1.2;
    if (m.rasgo === "leal") m.lealtad = Math.min(100, m.lealtad + 0.3);
    m.lealtad = R.clamp(m.lealtad + (S.ind.imagen - 45) * 0.03 - 0.3, 0, 100);
    const progRiesgo = MINISTERIOS.filter(M => M.cargo === m.cargo).flatMap(M => M.programas.filter(p => p.riesgo && S.ministerios[M.id].activos.includes(p.id)).map(p => p.riesgo)).reduce((a, b) => a + b, 0);
    m.riesgo = R.clamp(m.riesgo + (m.rasgo === "mediatico" ? 0.6 : 0.15) + progRiesgo + (m.cargo === "Desarrollo Social" && pal("desarrollo", "planes") === "organizaciones" ? 0.3 : 0), 0, 100);
    if (m.rasgo === "mediatico") aplicarEfectos({ imagen: 0.2 });
    if (R.rand() < m.riesgo / 900) {
      m.riesgo *= 0.4; aplicarEfectos({ imagen: -3, legitimidad: -2.5 });
      const t = `Escándalo en ${m.cargo}: una investigación revela sobreprecios en contrataciones del área de ${m.nombre}. La oposición pide su renuncia.`;
      titular("Página Sur", `Escándalo en ${m.cargo}: piden la renuncia de ${m.nombre}`);
      eventos.push({ titulo: `Escándalo en el ministerio de ${m.cargo}`, texto: t, tipo: "malo" }); log(t, "malo");
    } else if (m.lealtad < 22 && R.rand() < 0.18) {
      const viejo = m.nombre; Object.assign(m, nuevoMinistro(m.cargo));
      aplicarEfectos({ imagen: -2, legitimidad: -1 });
      const t = `${viejo} renuncia a ${m.cargo} con una carta que critica el rumbo del gobierno. Asume ${m.nombre}.`;
      eventos.push({ titulo: "Renuncia con portazo", texto: t, tipo: "malo" }); log(t, "malo");
    }
  }
}
