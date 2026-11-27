// =============================================================
//  VALDORA - Interfaz del legislador nacional (diputado o senador) y jefe de bloque
// =============================================================

const _renderEstadoLeg = renderEstado;
renderEstado = function () {
  if (!S || S.fase !== "legislador") return _renderEstadoLeg();
  const L = S.leg2, etM = etiquetaMes(S.mes || 1);
  $("#estado").innerHTML = `
    <span class="pill">${etM} de 48</span>
    <span class="pill">Influencia <b>${Math.round(L.influencia)}</b></span>
    <span class="pill">Disciplina <b>${Math.round(L.disciplina)}</b></span>
    <span class="pill">Imagen <b>${Math.round(L.imagen)}%</b></span>
    <span class="pill">Acción del mes <b>${S.accionesLeg ? "disponible" : "usada"}</b></span>`;
};

const _renderJuegoLeg = renderJuego;
renderJuego = function () {
  if (S && !S.perdio && S.fase === "legislador") { renderEstado(); if (S.terminoMandato) return renderFin(true); return renderLegislador(); }
  return _renderJuegoLeg();
};

const _renderFinLeg = renderFin;
renderFin = function (completo) {
  if (!completo || !S || S.fase !== "legislador") return _renderFinLeg(completo);
  renderEstado();
  const p = puntajeLeg(), L = S.leg2, H = S.hist[0];
  const juicio = p > 380 ? "Sos la figura parlamentaria de tu generación: ya te miden para gobernador o presidente." : p > 270 ? "Un jefe de bloque respetado: todos tuvieron que negociar con vos." : p > 170 ? "Cumpliste el mandato con algunos logros." : "Pasaste por la Cámara sin pena ni gloria.";
  app.innerHTML = `<div class="portada card stack" style="text-align:left"><h1>Fin del mandato</h1><p>${juicio}</p><h2>Puntaje: ${p}</h2>
    <table class="tally"><tr><th>Indicador</th><th>Al asumir</th><th>Al irte</th></tr>
    ${[["Influencia", "influencia"], ["Imagen", "imagen"], ["Disciplina del bloque", "disciplina"], ["Relación con el presidente", "relPres"]].map(([n, k]) => `<tr><td>${n}</td><td>${Math.round(H[k])}</td><td>${Math.round(L[k])}</td></tr>`).join("")}</table>
    <p>Proyectos propios con media sanción: <b>${L.leyesPropias}</b>. Votaciones ganadas: <b>${L.votosGanados}</b>, ${L.decisivo} con tus votos decisivos.</p>
    <div class="row" style="justify-content:center;margin-top:16px"><button id="bOtra">Jugar otra vez</button></div></div>`;
  borrarPartidaEnCurso();
  $("#bOtra").onclick = () => { UI.cfg = null; renderCrear(); };
};

function renderLegislador() {
  renderEstado();
  const L = S.leg2, yo = S.jugador;
  UI.tabLeg = UI.tabLeg || "recinto";
  const pend = S.proyLeg.filter(p => !p.resuelto).length + S.expLeg.filter(e => !e.resuelto).length;
  const tabs = [["recinto", `Recinto y bloque${pend ? " (" + pend + ")" : ""}`], ["acciones", "Acciones del jefe de bloque"], ["leyes", "Leyes propias"], ["camara", "La Cámara"], ["resumen", "Tu carrera"]];
  let cuerpo = "";
  if (UI.tabLeg === "recinto") {
    cuerpo = `<p class="small muted">Este mes se vota este proyecto. Vos fijás la línea del bloque: cuanto más baja la disciplina y más lejos está el proyecto de la identidad del partido, más diputados tuyos se dan vuelta o se ausentan. ${S.oficialismo ? "Sos oficialismo: el presidente espera tus votos." : "Sos oposición: el Ejecutivo necesita negociar con vos."}</p>
      <div class="stack">${S.proyLeg.map((pr, i) => {
        const P = PROYECTOS_LEG.find(x => x.id === pr.id);
        return `<div class="expediente ${pr.resuelto ? "resuelto" : ""}"><h3>${esc(P.nombre)} <span class="small muted">· ${pr.origen === "ejecutivo" ? "lo envía el Ejecutivo" : "lo impulsa la oposición"}</span></h3><p>${esc(P.texto)}</p>
          <p class="small muted">Opinión pública: ${P.pop > 3 ? "muy a favor" : P.pop > 0 ? "a favor" : P.pop > -3 ? "dividida o en contra" : "muy en contra"}. Cercanía con tu partido: ${Math.round(100 - Math.abs(P.ideo - PARTIDOS[yo.partido].ideo) * 2)}%.</p>
          ${pr.resuelto ? `<p class="small"><b>Línea del bloque:</b> ${{ favor: "a favor", contra: "en contra", libertad: "libertad de acción", negociar: "apoyo negociado" }[pr.postura]}</p>` :
          `<div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">
            <button class="opcion" data-pr="${i}" data-post="favor"><b>Votar a favor</b></button>
            <button class="opcion" data-pr="${i}" data-post="contra"><b>Votar en contra</b></button>
            <button class="opcion" data-pr="${i}" data-post="negociar"><b>Apoyar a cambio de obras y cargos</b><span class="small muted">Recursos y relación con la Casa Rosada; cuesta imagen</span></button>
            <button class="opcion" data-pr="${i}" data-post="libertad"><b>Libertad de acción</b><span class="small muted">Cuida la disciplina; no suma influencia</span></button>
          </div>`}</div>`;
      }).join("")}
      ${S.expLeg.map((e, i) => {
        const d = DILEMAS_BLOQUE.find(x => x.id === e.id);
        return `<div class="expediente ${e.resuelto ? "resuelto" : ""}"><h3>Interna del bloque: ${esc(d.titulo)}</h3><p>${esc(d.texto)}</p>
          ${e.resuelto ? `<p class="small"><b>Decisión:</b> ${esc(d.opciones[e.eleccion].t)}</p>` :
          `<div class="opciones">${d.opciones.map((o, j) => `<button class="opcion" data-eb="${i}" data-ebo="${j}"><b>${esc(o.t)}</b><span class="small muted">${esc(o.pista || "")}</span></button>`).join("")}</div>`}</div>`;
      }).join("")}</div>`;
  } else if (UI.tabLeg === "acciones") {
    const sin = S.accionesLeg <= 0 ? "disabled" : "";
    cuerpo = `<p class="small muted">Una acción por mes. Los proyectos propios van a comisión y necesitan dictamen; con una sesión especial los podés tratar sin dictamen, pero entonces hacen falta dos tercios.</p>
      <div class="expediente stack"><h3>Presentar un proyecto propio</h3>
        <div class="row"><select id="lTema">${TEMAS_PROPIOS.map(t => `<option value="${t.id}">${esc(t.nombre)}</option>`).join("")}</select><button id="lPresentar" ${sin}>Presentar</button></div>
        ${S.propiosEnComision.length ? `<p class="small">En comisión: ${S.propiosEnComision.map(pc => esc(TEMAS_PROPIOS.find(t => t.id === pc.id).nombre)).join(", ")}.${S.comisionPres ? " Presidís Presupuesto y Hacienda: los dictámenes salen más fácil." : ""}</p>` : ""}
      </div>
      <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
        <button class="opcion" data-al="reunion" ${sin}><b>Reunir al bloque</b><span class="small muted">Sube la disciplina; cuesta un favor si tenés</span></button>
        <button class="opcion" data-al="gobernadores" ${sin}><b>Repartir obras con los gobernadores</b><span class="small muted">Gasta un favor: disciplina e influencia</span></button>
        <button class="opcion" data-al="medios" ${sin}><b>Entrevista en televisión</b><span class="small muted">Imagen, según tu oratoria</span></button>
        <button class="opcion" data-al="sesionEsp" ${sin}><b>Pedir sesión especial</b><span class="small muted">Tu proyecto más viejo, sin dictamen: dos tercios</span></button>
        <button class="opcion" data-al="interpelar" ${sin}><b>Interpelar al Jefe de Gabinete</b><span class="small muted">Art. 101: mayoría absoluta. Solo desde la oposición</span></button>
        <button class="opcion" data-al="juicio" ${sin}><b>${camLeg().sen ? "Votar la destitución del presidente" : "Pedir juicio político al presidente"}</b><span class="small muted">${camLeg().sen ? "Art. 59: el Senado juzga y destituye con dos tercios" : "Art. 53: dos tercios"}. Arma de doble filo</span></button>
      </div>
      <p class="small muted">Favores acumulados: ${L.recursos}. Muchos favores sin usar aumentan el riesgo de escándalo.</p>`;
  } else if (UI.tabLeg === "camara") {
    const filas = Object.entries(S.cam).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    const C = camLeg();
    cuerpo = `<p class="small muted">${C.sen ? "Senado de la Nación" : "Cámara de Diputados"}: ${C.total} bancas, quórum ${Math.floor(C.total / 2) + 1}. Representás a ${esc(C.prov)}. El presidente de la Nación es del <b>${PARTIDOS[S.presNac.partido].nombre}</b> (imagen ${Math.round(S.presNac.imagen)}%).${S.interbloque ? ` Interbloque con ${PARTIDOS[S.interbloque].corto}.` : ""}</p>
      <div class="hemiciclo" style="max-width:520px"><h3>${C.sen ? "Senado" : "Diputados"} (${C.total})</h3>${hemiciclo(S.cam, C.total)}</div>
      <table class="tally"><tr><th>Bloque</th><th>Bancas</th><th>Relación con vos</th></tr>
      ${filas.map(([k, n]) => `<tr><td><i style="display:inline-block;width:10px;height:10px;background:${PARTIDOS[k].color};border-radius:2px"></i> ${PARTIDOS[k].nombre}${k === S.presNac.partido ? " (oficialismo)" : ""}</td><td>${n}</td><td>${k === yo.partido ? "tu bloque" : Math.round(S.relBloques[k])}</td></tr>`).join("")}</table>`;
  } else {
    cuerpo = `<div class="indicadores">
      ${[["Influencia en la Cámara", Math.round(L.influencia)], ["Imagen pública", Math.round(L.imagen) + "%"], ["Disciplina del bloque", Math.round(L.disciplina)], ["Relación con el presidente", Math.round(L.relPres)], ["Favores acumulados", L.recursos], ["Medias sanciones propias", L.leyesPropias], ["Votaciones ganadas", L.votosGanados], ["Votos decisivos", L.decisivo]].map(([l, v]) => `<div class="ind"><div class="l">${l}</div><div class="n">${v}</div></div>`).join("")}</div>
      <p class="small muted" style="margin-top:10px">Si la disciplina baja de 20, el bloque se parte. Si se queda sin diputados o tu imagen se hunde, perdés la jefatura. Medio término en el mes 24; el mandato dura 48 meses.</p>
      <h3>Evolución</h3>${grafico([{ k: "influencia", n: "Influencia", c: "#5b9be6", min: 0, max: 100 }, { k: "disciplina", n: "Disciplina", c: "#2e8b57", min: 0, max: 100 }, { k: "imagen", n: "Imagen", c: "#e3a63b", min: 0, max: 100 }])}`;
  }
  cuerpo = txtCam(cuerpo); // para un senador, los textos del bloque hablan del Senado
  if (UI.tabLeg === "leyes") cuerpo = htmlLeyes();
  app.innerHTML = `
    <div class="card stack">
      <div class="row" style="justify-content:space-between;align-items:center"><h2>Bloque ${esc(PARTIDOS[yo.partido].nombre)} · ${S.cam[yo.partido]} ${camLeg().miembros}</h2><button id="legFin">Terminar el mes ▸</button></div>
      <div class="tabs">${tabs.map(([id, n]) => `<button data-legtab="${id}" class="${UI.tabLeg === id ? "on" : ""}">${n}</button>`).join("")}</div>
      <div>${cuerpo}</div>
    </div>
    <div class="card"><h3>Registro</h3><div class="log">${S.log.slice(0, 10).map(l => `<div class="${l.tipo}"><span class="t">${l.sem}</span>${esc(l.txt)}</div>`).join("")}</div></div>`;
  const volver = () => renderLegislador();
  const mostrar = r => { if (!r) return volver(); colaEventos([{ titulo: "Resultado", texto: r.msg, pasos: r.pasos, tipo: r.tipo || "info" }], volver); };
  document.querySelectorAll("[data-legtab]").forEach(b => b.onclick = () => { UI.tabLeg = b.dataset.legtab; volver(); });
  bindLeyes(volver);
  document.querySelectorAll("[data-pr]").forEach(b => b.onclick = () => mostrar(resolverProyecto(+b.dataset.pr, b.dataset.post)));
  const mostrarTxt = r => mostrar(r && { ...r, msg: txtCam(r.msg) });
  document.querySelectorAll("[data-eb]").forEach(b => b.onclick = () => mostrarTxt(resolverExpBloque(+b.dataset.eb, +b.dataset.ebo)));
  document.querySelectorAll("[data-al]").forEach(b => b.onclick = () => mostrarTxt(accionLeg(b.dataset.al)));
  const lp = $("#lPresentar"); if (lp) lp.onclick = () => mostrar(accionLeg("proyecto", $("#lTema").value));
  $("#legFin").onclick = () => { const ev = finTrimestreLeg(); colaEventos(ev, () => { if (S.perdio) renderFin(false); else renderJuego(); }); };
}
