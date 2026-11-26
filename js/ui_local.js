// =============================================================
//  VALDORA - Interfaz del gobierno provincial y municipal
// =============================================================

function cuerpoLocal() { return S.cfg.objetivo === "gobernador" ? "la Legislatura" : "el Concejo Deliberante"; }

// El debate deja de ser "presidencial" en las escalas locales
const _debateEsc = debate;
debate = function () {
  const r = _debateEsc();
  if (mapaNoNacional() && r) { r.titulo = `Debate para ${nombreCargo()}`; r.texto = r.texto.replace("Debate presidencial obligatorio", `Debate de candidatos a ${nombreCargo()} de ${nombreTerritorio()}`); }
  return r;
};

const _tablaVotacionEsc = tablaVotacion;
tablaVotacion = function (v) {
  if (v.camara !== "leg" && v.camara !== "concejo") return _tablaVotacionEsc(v);
  const nombre = v.camara === "leg" ? "Legislatura" : "Concejo Deliberante";
  return `<h3 style="margin-top:10px">${nombre}: ${v.aprobado ? "APROBADO" : "RECHAZADO"}</h3>
  <p class="small muted">Afirmativos ${v.si}, negativos ${v.no}. Necesarios: ${v.necesario} de ${S.legTotal}.</p>
  <table class="tally"><tr><th>Bloque</th><th>Sí</th><th>No</th></tr>${v.detalle.map(d => `<tr><td>${PARTIDOS[d.bloque] ? PARTIDOS[d.bloque].corto : d.bloque}</td><td>${d.si}</td><td>${d.no}</td></tr>`).join("")}</table>`;
};

const _renderEstadoEsc = renderEstado;
renderEstado = function () {
  if (!S || S.fase !== "gobiernoLocal") return _renderEstadoEsc();
  const etM = etiquetaMes(S.mes || 1);
  $("#estado").innerHTML = `
    <span class="pill">${etM} de 48</span>
    <span class="pill">Caja <b>${Math.round(S.ind.caja)}</b></span>
    <span class="pill">Imagen <b>${Math.round(S.ind.imagen)}%</b></span>
    <span class="pill">Tensión <b>${Math.round(S.ind.tension)}</b></span>
    <span class="pill">Gestión del mes <b>${S.medidasEsteTrimestre ? "usada" : "disponible"}</b></span>`;
};

const _renderJuegoEsc = renderJuego;
renderJuego = function () {
  if (S && !S.perdio && S.fase === "gobiernoLocal") { renderEstado(); if (S.terminoMandato) return renderFin(true); return renderGobiernoLocal(); }
  return _renderJuegoEsc();
};

function puntajeLocal() {
  const I = S.ind, H = S.hist[0];
  let p = 100 + (I.imagen - H.imagen) + (I.servicios - H.servicios) - (I.pobreza - H.pobreza) * 2 - (I.inseguridad - H.inseguridad) - (I.deuda - H.deuda) * 0.5 + Math.min(I.caja, 100) * 0.2 - Math.max(0, I.tension - 50);
  return Math.round(p);
}

const _renderFinEsc = renderFin;
renderFin = function (completo) {
  if (!completo || !S || S.fase !== "gobiernoLocal") return _renderFinEsc(completo);
  renderEstado();
  const p = puntajeLocal(), I = S.ind, H = S.hist[0], cargo = nombreCargo();
  const juicio = p > 150 ? `Te vas como un ${cargo} recordado: ya te mencionan para la presidencia.` : p > 105 ? "Una gestión prolija. Tu territorio está mejor que cuando llegaste." : p > 70 ? "Terminaste el mandato sin grandes logros ni catástrofes." : "Terminaste, pero dejás las cuentas en rojo y la gente enojada.";
  const filas = [["Caja", "caja", ""], ["Pobreza", "pobreza", "%"], ["Desempleo", "desempleo", "%"], ["Inseguridad", "inseguridad", "/100"], ["Servicios", "servicios", "/100"], ["Deuda", "deuda", ""], ["Imagen", "imagen", "%"], ["Tensión social", "tension", ""]];
  app.innerHTML = `<div class="portada card stack" style="text-align:left"><h1>Fin del mandato</h1><p>${juicio}</p><h2>Puntaje: ${p}</h2>
    <table class="tally"><tr><th>Indicador</th><th>Al asumir</th><th>Al irte</th></tr>
    ${filas.map(([n, k, u]) => `<tr><td>${n}</td><td>${fmt(H[k], 1)}${u}</td><td>${fmt(I[k], 1)}${u}</td></tr>`).join("")}</table>
    <div class="row" style="justify-content:center;margin-top:16px"><button id="bOtra">Jugar otra vez</button></div></div>`;
  try { localStorage.removeItem("valdora_partida"); } catch (e) {}
  $("#bOtra").onclick = () => { UI.cfg = null; renderCrear(); };
};

function renderGobiernoLocal() {
  renderEstado();
  const I = S.ind, yo = S.jugador, gob = S.cfg.objetivo === "gobernador";
  UI.tabLoc = UI.tabLoc || "despacho";
  const pend = S.expedientesLocal.filter(e => !e.resuelto).length;
  const tabs = [["despacho", `Despacho${pend ? " (" + pend + ")" : ""}`], ["resumen", "Indicadores"], ["presupuesto", "Presupuesto"], ["leg", gob ? "Legislatura" : "Concejo Deliberante"], ["leyes", gob ? "Leyes" : "Ordenanzas"], ["nacion", gob ? "Relación con la Nación" : "Provincia y Nación"]];
  const P = S.presidente;
  let cuerpo = "";
  if (UI.tabLoc === "despacho") {
    cuerpo = `<p class="small muted">Lo que llega a tu escritorio este mes. La plata depende de la coparticipación y de la Nación: no podés emitir ni fijar el tipo de cambio. Lo que no decidas se agrava.</p>
      <div class="stack">${S.expedientesLocal.map((e, i) => {
        const d = DILEMAS_LOCAL[S.cfg.objetivo].find(x => x.id === e.id);
        return `<div class="expediente ${e.resuelto ? "resuelto" : ""}"><h3>${esc(d.titulo)}</h3><p>${esc(d.texto)}</p>
          ${e.resuelto ? `<p class="small"><b>Decisión:</b> ${e.eleccion >= 0 ? esc(d.opciones[e.eleccion].t) : "sin decisión"}</p>` :
          `<div class="opciones">${d.opciones.map((o, j) => `<button class="opcion" data-lexp="${i}" data-lop="${j}"><b>${esc(o.t)}</b><span class="small muted">${esc(o.pista || "")}</span></button>`).join("")}</div>`}</div>`;
      }).join("") || '<p class="muted">No hay expedientes pendientes.</p>'}</div>
      ${S.diferidosLocal.length ? `<p class="small muted">Hay ${S.diferidosLocal.length} decisiones cuyas consecuencias todavía no llegaron.</p>` : ""}`;
  } else if (UI.tabLoc === "resumen") {
    const inds = [["caja", "Caja (fondos disponibles)", Math.round(I.caja), false], ["desempleo", "Desempleo", fmt(I.desempleo) + "%", true], ["pobreza", "Pobreza", fmt(I.pobreza) + "%", true], ["inseguridad", "Inseguridad", Math.round(I.inseguridad) + "/100", true], ["servicios", "Calidad de servicios", Math.round(I.servicios) + "/100", false], ["deuda", "Deuda", Math.round(I.deuda), true], ["imagen", "Imagen", Math.round(I.imagen) + "%", false], ["legitimidad", "Legitimidad", Math.round(I.legitimidad) + "/100", false]];
    const nivel = I.tension < 30 ? "Calma" : I.tension < 50 ? "Malestar" : I.tension < 70 ? "Conflicto" : I.tension < 85 ? "Crisis" : "Estallido";
    cuerpo = `<div class="indicadores">${inds.map(([k, l, v, malo]) => `<div class="ind"><div class="l">${l}</div><div class="n">${v}</div>${deltaInd(k, malo)}</div>`).join("")}</div>
      <h3 style="margin-top:14px">Tensión social: ${Math.round(I.tension)} (${nivel})</h3>
      <div class="tension"><div class="marca-t" style="left:calc(${I.tension}% - 2px)"></div></div>
      <p class="small muted" style="margin-top:8px">Inflación nacional: ${fmt(S.inflNacional)}% mensual (no la controlás, pero te licúa la coparticipación). ${S.sueldosImpagos ? `Meses con sueldos atrasados: ${Math.round(S.sueldosImpagos * 3)}.` : ""}${S.adhesiones.length ? ` Adhesiones a leyes nacionales: ${S.adhesiones.length}.` : ""}${S.flagsLocal.reeleccion ? " Tenés reelección habilitada." : ""}</p>
      <h3 style="margin-top:14px">Evolución</h3>
      ${grafico([{ k: "imagen", n: "Imagen", c: "#1f5fa8", min: 0, max: 100 }, { k: "tension", n: "Tensión social", c: "#c0392b", min: 0, max: 100 }, { k: "servicios", n: "Servicios", c: "#2e8b57", min: 0, max: 100 }])}`;
  } else if (UI.tabLoc === "presupuesto") {
    cuerpo = `<p class="small muted">Subí o bajá cada partida respecto del presupuesto heredado. Gastar más mejora servicios y baja la tensión, pero vacía la caja; si la caja queda en rojo, no pagás sueldos. ${gob ? "Nueve meses sin pagar sueldos pueden terminar en intervención federal." : ""}</p>
      ${AREAS_LOCAL[S.cfg.objetivo].map(([id, n]) => `<div class="slider-row"><span>${n}</span><input type="range" min="-40" max="40" step="5" value="${S.presLocal[id]}" data-larea="${id}"><b>${S.presLocal[id] > 0 ? "+" : ""}${S.presLocal[id]}%</b></div>`).join("")}
      <p class="small muted">Recursos: coparticipación (cae con la inflación nacional y con una mala relación con el presidente), ${gob ? "ingresos brutos e inmobiliario" : "tasas municipales"} (nivel actual: +${S.tasa * 50}%) y deuda.</p>`;
  } else if (UI.tabLoc === "leg") {
    const filas = Object.entries(S.leg).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    cuerpo = `<p class="small muted">${gob ? "La Legislatura provincial" : "El Concejo Deliberante"} aprueba adhesiones, tasas y reformas. La mitad se renovó con tu elección; la otra mitad viene del turno anterior. Medio término en el mes 24. Mayoría simple: ${Math.floor(S.legTotal / 2) + 1}; dos tercios: ${Math.ceil(S.legTotal * 2 / 3)}.</p>
      <div class="hemiciclo" style="max-width:420px"><h3>${gob ? "Legislatura" : "Concejo"} (${S.legTotal} bancas)</h3>${hemiciclo(S.leg, S.legTotal)}</div>
      <table class="tally"><tr><th>Bloque</th><th>Bancas</th><th>Relación</th></tr>
      ${filas.map(([k, n]) => `<tr><td><i style="display:inline-block;width:10px;height:10px;background:${PARTIDOS[k] ? PARTIDOS[k].color : "#999"};border-radius:2px"></i> ${PARTIDOS[k] ? PARTIDOS[k].nombre : k}</td><td>${n}</td><td>${k === yo.partido ? "oficialismo" : Math.round(S.legRel[k])}</td></tr>`).join("")}</table>
      <div class="row" style="margin-top:10px"><button class="sec" id="lNegociar" ${S.medidasEsteTrimestre >= 1 ? "disabled" : ""}>Repartir cargos y obras con la oposición</button></div>
      <p class="small muted">Mejora la relación con todos los bloques opositores a cambio de caja.</p>`;
  } else if (UI.tabLoc === "nacion") {
    cuerpo = `<p>El presidente es del <b>${PARTIDOS[P.partido].nombre}</b>. Relación con la Casa Rosada: <b>${Math.round(P.relacion)}</b> (de -100 a 100).</p>
      <p class="small muted">De la Nación dependen los ATN, los fondos de emergencia, las obras y las fuerzas federales. Pelearte da imagen local pero cierra la canilla.</p>
      <div class="opciones">
        <button class="opcion" data-nac="alinear"><b>Alinearte con el presidente</b><span class="small muted">Prometés votos de tus legisladores nacionales.</span></button>
        <button class="opcion" data-nac="enfrentar"><b>Enfrentar a la Casa Rosada</b><span class="small muted">Denunciás discriminación en el reparto.</span></button>
        <button class="opcion" data-nac="atn"><b>Pedir un ATN</b><span class="small muted">Aportes del Tesoro Nacional: discrecionales.</span></button>
        <button class="opcion" data-nac="deuda"><b>Tomar deuda</b><span class="small muted">Entra caja, suben los vencimientos.</span></button>
        <button class="opcion" data-nac="tasa"><b>${gob ? "Subir ingresos brutos e inmobiliario" : "Subir la tasa municipal"}</b><span class="small muted">Lo vota ${cuerpoLocal()}.</span></button>
      </div>
      <p class="small muted">Una gestión grande por mes (${S.medidasEsteTrimestre ? "ya la usaste" : "disponible"}).</p>`;
  }
  if (UI.tabLoc === "leyes") cuerpo = htmlLeyes();
  app.innerHTML = `
    <div class="card stack">
      <div class="row" style="justify-content:space-between;align-items:center"><h2>${gob ? "Gobernación" : "Intendencia"} de ${esc(nombreTerritorio())}</h2><button id="lFin">Terminar el mes ▸</button></div>
      <div class="tabs">${tabs.map(([id, n]) => `<button data-ltab="${id}" class="${UI.tabLoc === id ? "on" : ""}">${n}</button>`).join("")}</div>
      <div>${cuerpo}</div>
    </div>
    <div class="card"><h3>Registro</h3><div class="log">${S.log.slice(0, 10).map(l => `<div class="${l.tipo}"><span class="t">${l.sem}</span>${esc(l.txt)}</div>`).join("")}</div></div>`;
  document.querySelectorAll("[data-ltab]").forEach(b => b.onclick = () => { UI.tabLoc = b.dataset.ltab; renderGobiernoLocal(); });
  bindLeyes(renderGobiernoLocal);
  document.querySelectorAll("[data-lexp]").forEach(b => b.onclick = () => {
    const r = resolverExpLocal(+b.dataset.lexp, +b.dataset.lop);
    if (r.msg || (r.pasos && r.pasos.length)) colaEventos([{ titulo: "Resultado", texto: r.msg || "Hecho.", pasos: r.pasos, tipo: r.tipo || "info" }], renderGobiernoLocal);
    else renderGobiernoLocal();
  });
  document.querySelectorAll("[data-larea]").forEach(el => el.onchange = e => { S.presLocal[el.dataset.larea] = +e.target.value; renderGobiernoLocal(); });
  document.querySelectorAll("[data-nac]").forEach(b => b.onclick = () => {
    const r = gestionarNacion(b.dataset.nac);
    log(r.msg || "", r.tipo || "info");
    colaEventos([{ titulo: "Gestión", texto: r.msg || "", pasos: r.pasos, tipo: r.tipo || "info" }], renderGobiernoLocal);
  });
  const ln = $("#lNegociar");
  if (ln) ln.onclick = () => {
    S.medidasEsteTrimestre++;
    for (const k in S.legRel) if (k !== yo.partido) S.legRel[k] += 12 + (yo.negociacion - 5) * 2;
    aplicarLocal({ caja: -6, legitimidad: -1 });
    log(`Repartiste cargos y obras con la oposición en ${cuerpoLocal()}.`, "info");
    renderGobiernoLocal();
  };
  $("#lFin").onclick = () => {
    const ev = finTrimestreLocal();
    colaEventos(ev, () => { if (S.perdio) renderFin(false); else renderJuego(); });
  };
}
