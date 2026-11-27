// =============================================================
//  VALDORA - Pantallas de gestiones ante el superior (intendente y
//  gobernador) y de peso político y negociación (legislador)
// =============================================================

function barraRel(v, min, max, tono) {
  const pct = Math.round((R.clamp(v, min, max) - min) / (max - min) * 100);
  return `<div class="barra-rel"><i style="width:${pct}%;background:${tono || "var(--accent)"}"></i></div>`;
}
const tonoRel = v => v >= 30 ? "var(--good)" : v <= -30 ? "var(--bad)" : "var(--warn)";
const ESTADO_TRAM = { tramite: "En trámite", condicionado: "Aprobado con condiciones", cumplido: "Aprobado", obra: "Obra en ejecución", terminada: "Obra inaugurada", negado: "Rechazado" };

// ---------- Intendente y gobernador ----------
function fichaSuperior(ante, titulo) {
  const s = supDe(ante), yo = S.jugador, P = PARTIDOS[s.partido] || { nombre: s.partido, color: "#999" };
  const mismo = s.partido === yo.partido;
  return `<div class="expediente stack sup-ficha"><h3>${titulo}</h3>
    <p><i style="display:inline-block;width:10px;height:10px;background:${P.color};border-radius:2px"></i> ${capRel(jefeSup(ante))} es del <b>${esc(P.nombre)}</b>${mismo ? " (tu partido: es más fácil, pero cobra lealtad)" : " (otro signo)"}.</p>
    <div class="sup-grid">
      <div><span class="small muted">Relación con vos</span><b>${Math.round(s.relacion)}</b>${barraRel(s.relacion, -100, 100, tonoRel(s.relacion))}</div>
      <div><span class="small muted">Su imagen</span><b>${Math.round(s.imagen)}%</b>${barraRel(s.imagen, 0, 100, s.imagen < 40 ? "var(--bad)" : "var(--accent)")}</div>
      <div><span class="small muted">Su caja</span><b>${Math.round(s.caja)}</b>${barraRel(s.caja, 0, 100, s.caja < 30 ? "var(--bad)" : "var(--good)")}</div>
      <div><span class="small muted">Favores que le debés</span><b>${s.favores || 0}</b>${barraRel(s.favores || 0, 0, 12, "var(--warn)")}</div>
    </div>
    ${s.castigo > 0 ? `<p class="small" style="color:var(--bad)">Te está castigando: retiene giros y frena tus expedientes (${s.castigo} ${s.castigo === 1 ? "mes" : "meses"} más).</p>` : ""}
    ${s.imagen < 40 && mismo && s.relacion > 30 ? `<p class="small" style="color:var(--warn)">Está en baja y vos estás pegado a él: te arrastra en las encuestas.</p>` : ""}
    <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      <button class="opcion" data-post="${ante}:reunion"><b>Mesa técnica con sus ministros</b><span class="small muted">Mejora la relación sin costo de imagen</span></button>
      <button class="opcion" data-post="${ante}:alinear"><b>Alinearte en público</b><span class="small muted">Relación +15 y baja un favor debido. Imagen ${mismo ? "neutra" : "en baja"}</span></button>
      <button class="opcion" data-post="${ante}:enfrentar"><b>Enfrentarlo</b><span class="small muted">Imagen local; relación −20 y riesgo de represalia</span></button>
    </div></div>`;
}

function filaTramite(t) {
  const T = tipoGestion(t.tipo), C = t.cond && CONDICIONES_SUP.find(c => c.id === t.cond);
  let acc = "";
  if (t.estado === "condicionado") acc = `<p class="small">Condición: ${esc(C.txt(jefeSup(t.ante)))}. <span class="muted">${esc(C.costo)}</span></p>
    <div class="row"><button data-cond="${t.uid}:1">Aceptar la condición</button><button class="sec" data-cond="${t.uid}:0">Rechazar</button></div>`;
  else if (t.estado === "tramite") acc = `<p class="small muted">Respuesta esperada a fin de ${t.resp <= S.mes ? "este mes" : etiquetaMes(t.resp)}.${t.demoras ? " Está cajoneado." : ""}</p>${t.demoras ? `<button class="sec" data-insist="${t.uid}">Insistir (1 casillero)</button>` : ""}`;
  else if (t.estado === "obra") acc = `<p class="small muted">Se inaugura a fin de ${etiquetaMes(t.finObra)}.</p>`;
  else if (t.estado === "negado" && !t.denunciado) acc = `<button class="sec" data-denun="${t.uid}">Denunciarlo en público</button>`;
  return `<div class="expediente ${["cumplido", "terminada", "negado"].includes(t.estado) ? "resuelto" : ""}"><h3>${esc(T.nombre)} <span class="small muted">· ante ${esc(nombreSup(t.ante))}</span></h3>
    <p class="small"><b>${ESTADO_TRAM[t.estado]}</b> · pedido en ${etiquetaMes(t.desde)}</p>${acc}</div>`;
}

function htmlRelacionesLocal() {
  const g = asegurarGest(); if (!g) return "<p class='muted'>No disponible.</p>";
  const gob = S.cfg.objetivo === "gobernador", yo = S.jugador;
  const PP = pesoPropioLocal();
  const abiertos = g.tram.filter(t => ["tramite", "condicionado", "obra"].includes(t.estado));
  const cerrados = g.tram.filter(t => !["tramite", "condicionado", "obra"].includes(t.estado)).slice(-4).reverse();
  const cobros = g.cobros.filter(c => !c.resuelto);
  const pedidos = tiposGestionCargo().map(T => {
    const { p } = evaluarGestion(T.id);
    const chk = puedePedir(T);
    return `<button class="opcion" data-gest="${T.id}" ${chk.ok ? "" : "disabled"} title="${esc(chk.ok ? "" : chk.msg)}"><b>${esc(T.nombre)}</b><span class="small muted">${esc(T.detalle)}</span>
      <span class="small">Ante ${esc(nombreSup(T.ante))} · ${NOMBRE_MAG[T.mag]} · <b>${chanceTexto(p)}</b> (≈${Math.round(p * 100)}%)</span>${chk.ok ? "" : `<span class="small muted">${esc(chk.msg)}</span>`}</button>`;
  }).join("");
  return `<p class="small muted">${gob ? "Casi toda la obra pública grande, los ATN y las fuerzas federales dependen de la Nación." : `La coparticipación, la obra grande y la policía dependen de la provincia. También podés ir directo a la Nación, pero el gobernador se entera.`} Cada pedido es un expediente: ocupa un casillero de agenda y la respuesta llega en uno a cuatro meses. Puede salir aprobado, con condiciones, cajoneado o rechazado según la afinidad política, tu peso propio, la relación, la caja del superior, la tensión social y el calendario electoral.</p>
    ${fichaSuperior("sup", gob ? "La Nación" : `El gobierno de ${esc(g.gobProv.nombre)}`)}
    ${!gob ? fichaSuperior("nac", "La Nación (salteando al gobernador)") : ""}
    <div class="expediente stack"><h3>Tu peso propio: ${PP.total}</h3>
      <table class="tally">${PP.partes.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${v > 0 ? "+" : ""}${v}</td></tr>`).join("")}</table>
      <p class="small muted">Con más peso, ${gob ? "la Casa Rosada" : "el gobernador"} no se puede dar el lujo de ignorarte. Sube con la imagen, tu bloque y la trayectoria.</p></div>
    ${cobros.length ? `<h3>Te pasan la factura</h3>${cobros.map(c => { const C = (COBROS_SUP[S.cfg.objetivo] || []).find(x => x.id === c.id); return `<div class="expediente"><h3>${esc(C.titulo)} <span class="small muted">· ${esc(nombreSup(c.ante))}</span></h3><p>${esc(C.texto)}</p><p class="small muted">Si no respondés este mes, cuenta como que te negaste.</p>
      <div class="opciones"><button class="opcion" data-cobro="${c.uid}:cumplir"><b>Cumplir</b><span class="small muted">Pagás el costo y bajan tus deudas</span></button><button class="opcion" data-cobro="${c.uid}:negociar"><b>Negociar</b><span class="small muted">Cumplir a medias, según tu negociación</span></button><button class="opcion" data-cobro="${c.uid}:negarse"><b>Negarte</b><span class="small muted">La relación cae y puede haber represalias</span></button></div></div>`; }).join("")}` : ""}
    <h3>Pedir</h3>
    <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${pedidos}</div>
    <h3>Expedientes</h3>
    <div class="stack">${abiertos.map(filaTramite).join("") || "<p class='muted small'>No tenés expedientes abiertos.</p>"}${cerrados.map(filaTramite).join("")}</div>
    <h3>Recursos propios</h3>
    <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
      <button class="opcion" data-nac="deuda"><b>Tomar deuda</b><span class="small muted">Entra caja, suben los vencimientos.</span></button>
      <button class="opcion" data-nac="tasa"><b>${gob ? "Subir ingresos brutos e inmobiliario" : "Subir la tasa municipal"}</b><span class="small muted">Lo vota ${cuerpoLocalRel()}.</span></button>
    </div>
    <p class="small muted">Agenda del mes: ${agendaDisponible()} de ${agendaMax()} casilleros.</p>`;
}

function bindRelacionesLocal(volver) {
  const mostrar = r => colaEventos([{ titulo: "Gestión", texto: (r && r.msg) || "Hecho.", pasos: r && r.pasos, tipo: (r && r.tipo) || "info" }], volver);
  document.querySelectorAll("[data-gest]").forEach(b => b.onclick = () => mostrar(presentarGestion(b.dataset.gest)));
  document.querySelectorAll("[data-cond]").forEach(b => b.onclick = () => { const [u, a] = b.dataset.cond.split(":"); mostrar(aceptarCondicion(+u, a === "1")); });
  document.querySelectorAll("[data-insist]").forEach(b => b.onclick = () => mostrar(insistirGestion(+b.dataset.insist)));
  document.querySelectorAll("[data-denun]").forEach(b => b.onclick = () => mostrar(denunciarGestion(+b.dataset.denun)));
  document.querySelectorAll("[data-post]").forEach(b => b.onclick = () => { const [ante, acc] = b.dataset.post.split(":"); mostrar(posturaSup(ante, acc)); });
  document.querySelectorAll("[data-cobro]").forEach(b => b.onclick = () => { const [u, op] = b.dataset.cobro.split(":"); mostrar(resolverCobroSup(+u, op)); });
}
function pendientesRelLocal() {
  const g = S.gest; if (!g) return 0;
  return g.tram.filter(t => t.estado === "condicionado").length + g.cobros.filter(c => !c.resuelto).length;
}

// ---------- Legislador ----------
function htmlMesaNeg(clave) {
  const e = estadoNeg(clave); if (!e) return "";
  const pl = S.pl, cps = contrapartesNeg(clave);
  return `<div class="expediente stack"><h3>${esc(e.O.nombre)} <span class="small muted">· ${NOMBRE_MAG[e.O.mag]}${e.O.comision ? " · comisión de " + esc(e.O.comision.nombre) : ""}</span></h3>
    <p class="small">Apoyo: <b>${e.total}</b> de <b>${e.umbral}</b> necesarios ${e.listo ? "<b style='color:var(--good)'>· listo para el dictamen</b>" : `· faltan ${e.falta}`}</p>
    <div class="barra-rel grande"><i style="width:${Math.min(100, Math.round(e.total / e.umbral * 100))}%;background:${e.listo ? "var(--good)" : "var(--warn)"}"></i></div>
    <p class="small muted">Propio ${e.propio} (${e.partes.map(([n, v]) => `${n}: ${v}`).join(" · ")}) + negociado ${e.neg}.${e.N.concesiones ? ` Concesiones: ${e.N.concesiones}.` : ""}</p>
    ${e.listo ? "" : `<div class="cuadro-scroll"><table class="tally neg-tabla"><tr><th>Con quién</th><th>Aporta</th><th>Opciones</th></tr>${cps.map(c => `<tr class="${c.hecha ? "resuelto" : ""}"><td>${esc(c.nombre)}</td><td>+${c.gain}</td><td>${c.hecha ? "acuerdo cerrado" : c.ops.map(op => `<button class="sec chico" data-neg="${clave}|${c.id}|${op}" ${pl.rondas <= 0 || e.N.fallas[c.id] === S.mes || (op === "favor" && S.leg2.recursos < 1) || (op === "voto" && promesasAbiertas() >= 3) ? "disabled" : ""} title="${esc(OPS_NEG[op].d)}">${OPS_NEG[op].n} · ${Math.round(chanceNeg(c, op, e.O) * 100)}%</button>`).join(" ")}</td></tr>`).join("")}</table></div>`}
  </div>`;
}

function htmlPesoLeg() {
  const pl = asegurarPeso(); if (!pl) return "<p class='muted'>No disponible.</p>";
  const R0 = rangoLeg(), i = RANGOS_LEG.indexOf(R0), sig = RANGOS_LEG[i + 1];
  const temas = S.propiosEnComision.map(pc => "tema:" + pc.id);
  const leyes = (estadoLeyes().tram || []).filter(l => l.propia && l.estado === "comision").map(l => "ley:" + l.uid);
  const cobros = pl.cobros.filter(c => !c.resuelto);
  const debidas = pl.deudas.filter(d => !d.cobrado);
  const comFilas = COMISIONES_LEG.map(C => {
    const c = pl.comisiones[C.id];
    const btns = [];
    if (!c) btns.push(`<button class="sec chico" data-com="${C.id}|vocal" ${pl.rondas <= 0 ? "disabled" : ""}>Sumarte</button>`);
    if (c !== "pres" && C.nivel <= R0.nivelPres) btns.push(`<button class="sec chico" data-com="${C.id}|pres" ${pl.rondas <= 0 ? "disabled" : ""}>Pelear la presidencia</button>`);
    if (c) btns.push(`<button class="sec chico" data-dejar="${C.id}">Dejar</button>`);
    return `<tr><td>${esc(C.nombre)}</td><td>${"★".repeat(C.nivel)}</td><td>${c === "pres" ? "<b>Presidís</b>" : c === "vocal" ? "Vocal" : "<span class='muted'>—</span>"}</td><td>${btns.join(" ")}</td></tr>`;
  }).join("");
  return `<p class="small muted">Tu peso político es lo que te posiciona dentro del Congreso. Cada proyecto tiene una magnitud: un tema menor sale casi solo si tenés peso; uno de fondo exige negociar con bloques, gobernadores, la comisión, la Casa Rosada y los sectores. El peso sube cuando sacás leyes, cuando tus votos son decisivos y cuando presidís comisiones; baja si fracasás o no cumplís lo que prometés.</p>
    <div class="indicadores">
      <div class="ind"><div class="l">Peso político</div><div class="n">${Math.round(pl.peso)}</div></div>
      <div class="ind"><div class="l">Rango</div><div class="n" style="font-size:1rem">${esc(R0.nombre)}</div></div>
      <div class="ind"><div class="l">Tu palabra</div><div class="n">${Math.round(pl.palabra)}</div></div>
      <div class="ind"><div class="l">Rondas de negociación</div><div class="n">${pl.rondas}/${rondasMaxLeg()}</div></div>
      <div class="ind"><div class="l">Acciones por mes</div><div class="n">${R0.acciones}</div></div>
      <div class="ind"><div class="l">Favores para repartir</div><div class="n">${S.leg2.recursos}</div></div>
    </div>
    <div class="barra-rel grande" style="margin-top:8px"><i style="width:${Math.round(pl.peso)}%;background:var(--gold)"></i></div>
    <p class="small">${esc(R0.txt)}${sig ? ` Próximo rango, ${esc(sig.nombre.toLowerCase())}, con peso ${sig.min}.` : ""}${pl.vice ? ` Sos vicepresidente ${camLeg().sen ? "del Senado" : "de la Cámara"}.` : ""}</p>
    <div class="cuadro-scroll"><table class="tally"><tr><th>Rango</th><th>Peso</th><th>Rondas</th><th>Acciones</th><th>Comisiones</th><th>Presidencias</th></tr>
      ${RANGOS_LEG.map((r, j) => `<tr class="${j === i ? "on" : ""}"><td>${j === i ? "▸ " : ""}${esc(r.nombre)}</td><td>${r.min}+</td><td>${r.rondas}</td><td>${r.acciones}</td><td>${r.vocalias}</td><td>${r.pres ? r.pres + " (hasta " + "★".repeat(r.nivelPres) + ")" : "—"}</td></tr>`).join("")}</table></div>
    ${cobros.length ? `<h3>Te pasan la factura</h3>${cobros.map(c => `<div class="expediente"><h3>${esc(c.nombre)}</h3><p>Te pide tus votos para "${esc(c.proyecto)}", como prometiste. Si no respondés este mes, cuenta como incumplido.</p>
      <div class="opciones"><button class="opcion" data-cobl="${c.uid}|cumplir"><b>Cumplir</b><span class="small muted">Tu palabra sube; algo de disciplina</span></button><button class="opcion" data-cobl="${c.uid}|favores" ${S.leg2.recursos < 2 ? "disabled" : ""}><b>Pagar con dos favores</b><span class="small muted">Obras y cargos en lugar de votos</span></button><button class="opcion" data-cobl="${c.uid}|incumplir"><b>No cumplir</b><span class="small muted">Tu palabra y tu peso caen</span></button></div></div>`).join("")}` : ""}
    ${debidas.length ? `<p class="small muted">Promesas pendientes: ${debidas.map(d => `${esc(d.nombre)} (vence en ${etiquetaMes(d.vence)})`).join("; ")}.</p>` : ""}
    <h3>Mesa de negociación</h3>
    ${temas.length + leyes.length ? [...temas, ...leyes].map(htmlMesaNeg).join("") : `<p class="muted small">No tenés proyectos esperando dictamen. Presentá uno en "Acciones del jefe de bloque" o en "Leyes propias" y negociá acá su apoyo.</p>`}
    <h3>Comisiones</h3>
    <p class="small muted">Presidir la comisión de un tema suma 15 de apoyo propio a tus proyectos de ese tema; ser vocal suma 5. La presidencia se pelea una vez por año y se renueva cada diciembre según tu peso.</p>
    <div class="cuadro-scroll"><table class="tally"><tr><th>Comisión</th><th>Jerarquía</th><th>Tu lugar</th><th></th></tr>${comFilas}</table></div>`;
}

function bindPesoLeg(volver) {
  const mostrar = r => colaEventos([{ titulo: "Congreso", texto: txtCam((r && r.msg) || "Hecho."), tipo: (r && r.tipo) || "info" }], volver);
  document.querySelectorAll("[data-neg]").forEach(b => b.onclick = () => { const [k, c, op] = b.dataset.neg.split("|"); mostrar(negociarApoyo(k, c, op)); });
  document.querySelectorAll("[data-com]").forEach(b => b.onclick = () => { const [id, cargo] = b.dataset.com.split("|"); mostrar(pedirComision(id, cargo)); });
  document.querySelectorAll("[data-dejar]").forEach(b => b.onclick = () => mostrar(dejarComision(b.dataset.dejar)));
  document.querySelectorAll("[data-cobl]").forEach(b => b.onclick = () => { const [u, op] = b.dataset.cobl.split("|"); mostrar(resolverCobroLeg(+u, op)); });
}
