// =============================================================
//  VALDORA - Pestaña "Leyes": redactor, pronóstico y trámite
// =============================================================

const NOMBRE_IND = { inflacion: "Inflación", desempleo: "Desempleo", crecimiento: "Crecimiento", pobreza: "Pobreza", deficit: "Déficit", deuda: "Deuda", reservas: "Reservas", inseguridad: "Inseguridad", imagen: "Imagen", legitimidad: "Legitimidad", tension: "Tensión social", caja: "Caja", servicios: "Servicios" };
// en estos indicadores, subir es malo
const IND_MALO = new Set(["inflacion", "desempleo", "pobreza", "deficit", "deuda", "inseguridad", "tension"]);

const _tablaVotacionLey = tablaVotacion;
tablaVotacion = function (v) {
  if (v.tipo === "nota") return `<h3 style="margin-top:10px">${esc(v.titulo || "Ejecutivo")}</h3><p class="small ${v.ok ? "up-good" : "up-bad"}">${esc(v.texto)}</p>`;
  const h = _tablaVotacionLey(v);
  return v.etiqueta ? h.replace("</h3>", ` <span class="small muted">(${esc(v.etiqueta)})</span></h3>`) : h;
};

const _mostrarDecisionLey = mostrarDecision;
mostrarDecision = function (e, siguiente) {
  if (e.decision !== "vetoLey") return _mostrarDecisionLey(e, siguiente);
  const ops = [["promulgar", "Promulgar la ley", "Mejora la relación con los bloques que la votaron."],
    ["parcial", "Veto parcial (art. 80)", "Observás los artículos más costosos y promulgás el resto."],
    ["vetar", "Veto total (art. 83)", "El cuerpo puede insistir con dos tercios."]];
  modal(`<h2>${esc(e.titulo)}</h2><p>${esc(e.texto)}</p>${(e.pasos || []).map(tablaVotacion).join("")}<div class="opciones">${ops.map(([v, n, d]) => `<button class="opcion" data-vop="${v}"><b>${esc(n)}</b><span class="small muted">${esc(d)}</span></button>`).join("")}</div>`, "aviso");
  document.querySelectorAll("#modalCaja [data-vop]").forEach(b => b.onclick = () => {
    const r = resolverVetoLey(b.dataset.vop);
    modal(`<p>${esc(r.msg)}</p>${(r.pasos || []).map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk">Continuar</button></div>`, "info");
    $("#mOk").onclick = siguiente;
  });
};

function estadoUILey() {
  const cat = catalogoSegunCargo();
  if (!UI.ly || !cat.some(l => l.id === UI.ly.base)) UI.ly = { area: cat[0].area, base: cat[0].id, int: "normal", fin: "rentas", alc: "nacional", vig: "permanente", cl: [], nom: "", fondos: false, conc: false, urg: false };
  return UI.ly;
}

function leyConNeg(ley, u) {
  const l = JSON.parse(JSON.stringify(ley));
  l.extra = 0;
  if (u.fondos) l.extra += 18;
  if (u.conc) { l.ideo = Math.round(50 + (l.ideo - 50) * 0.7); for (const k in l.ef) l.ef[k] *= 0.75; l.extra += 6; }
  if (u.urg) l.urgencia = true;
  return l;
}

function fmtEf(ef) {
  const r = Object.entries(ef || {}).filter(([k, v]) => NOMBRE_IND[k] && Math.abs(v) >= 0.05).map(([k, v]) => {
    const bueno = IND_MALO.has(k) ? v < 0 : v > 0;
    const num = k === "reservas" ? Math.round(v).toLocaleString("es-AR") : (Math.round(v * 10) / 10).toString().replace(".", ",");
    return `<span class="${bueno ? "up-good" : "up-bad"}">${NOMBRE_IND[k]} ${v > 0 ? "+" : ""}${num}</span>`;
  });
  return r.join(" · ") || '<span class="muted">sin efecto directo sobre los indicadores</span>';
}

function htmlLeyes() {
  const u = estadoUILey();
  const cat = catalogoSegunCargo();
  const E = estadoLeyes();
  const ctx = ctxLey();
  const local = ctx.modo === "local";
  const areas = [...new Set(cat.map(l => l.area))];
  const deArea = cat.filter(l => l.area === u.area);
  const base = cat.find(l => l.id === u.base);
  const ley = redactarLey(u.base, { intensidad: u.int, fin: u.fin, alcance: u.alc, vigencia: u.vig, clausulas: u.cl, nombre: u.nom });
  const lv = leyConNeg(ley, u);
  const prev = preverLey(lv);
  const chk = puedePresentarLey();
  const nAreas = a => (typeof AREAS_LEY !== "undefined" && AREAS_LEY[a]) || a;
  const sel = (id, val, ops) => `<select id="${id}" data-ly>${ops.map(([v, n]) => `<option value="${v}" ${v === val ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>`;
  const cls = [["fondosProv", "Fondos a las provincias"], ["compensacion", "Compensar a los perjudicados"], ["revision", "Cláusula de revisión"], ["penal", "Sanciones penales"], ["delegacion", "Delegar la reglamentación al Ejecutivo"]];
  const cuerpoTxt = local ? (ctx.cuerpo === "leg" ? "la Legislatura" : "el Concejo") : ctx.modo === "leg" ? "Diputados" : "el Congreso";
  const intro = ctx.modo === "leg"
    ? `Como jefe de bloque podés presentar proyectos propios. Necesitan dictamen de comisión, media sanción en Diputados, la aprobación del Senado y que el presidente (${PARTIDOS[S.presNac.partido].corto}) no los vete. Presentar o pedir un tratamiento sobre tablas usa la acción del mes.`
    : `Elegí una base del catálogo y ajustala. El motor calcula qué cámara la trata, qué mayoría exige la Constitución y cómo votaría cada bloque según su ideología, los grupos que representa, la relación con vos${ctx.modo === "nac" ? " y la de sus gobernadores" : ""}. Podés mandar un proyecto por mes, aparte de las medidas.`;
  const ficha = `
    <div class="expediente">
      <h3>${esc(ley.nombre)}</h3>
      <p class="small">${esc(base.texto)}</p>
      ${ley.clausulas.length ? `<p class="small muted">Cláusulas: ${ley.clausulas.map(esc).join("; ")}.</p>` : ""}
      <p class="small"><b>Efectos esperados:</b> ${fmtEf(prev.ctx.modo === "nac" ? { ...lv.ef, deficit: (lv.ef.deficit || 0) + (lv.costo || 0) } : lv.ef)}</p>
      ${prev.ganadores.length ? `<p class="small"><b>Ganan:</b> <span class="up-good">${prev.ganadores.map(esc).join(", ")}</span></p>` : ""}
      ${prev.perdedores.length ? `<p class="small"><b>Pierden:</b> <span class="up-bad">${prev.perdedores.map(esc).join(", ")}</span></p>` : ""}
      <p class="small muted">Ubicación ideológica ${lv.ideo}/100 · opinión pública ${lv.pop > 3 ? "muy a favor" : lv.pop > 0 ? "a favor" : lv.pop > -3 ? "dividida" : "en contra"} · riesgo de inconstitucionalidad ${Math.round(prev.riesgoJud * 100)}%${ctx.modo === "leg" ? ` · riesgo de veto ${Math.round(prev.veto * 100)}%` : ""}</p>
      <p class="small"><b>Trámite:</b> ${esc(prev.origen.txt || "")} Necesita ${esc(prev.mayoria.txt)}.</p>
      ${prev.porCamara.map(c => {
        const nec = prev.mayoria.tipo === "dosTercios" ? Math.ceil(c.total * 2 / 3) : prev.mayoria.tipo === "absoluta" ? Math.floor(c.total / 2) + 1 : Math.floor(c.total / 2) + 1;
        return `<h4 style="margin:8px 0 4px">${esc(c.nombre)}: ${c.esperados} votos esperados de ${nec} necesarios · chance ${Math.round(c.chance * 100)}%</h4>
        <table class="tally"><tr><th>Bloque</th><th>Bancas</th><th>Postura probable</th></tr>${c.bloques.sort((a, b) => b.n - a.n).map(b => `<tr><td>${esc(PARTIDOS[b.k] ? PARTIDOS[b.k].corto : b.k)}</td><td>${b.n}</td><td class="${b.p > 0.6 ? "up-good" : b.p < 0.4 ? "up-bad" : ""}">${b.p > 0.8 ? "a favor" : b.p > 0.6 ? "inclinado a favor" : b.p > 0.4 ? "indeciso" : b.p > 0.2 ? "inclinado en contra" : "en contra"} (${Math.round(b.p * 100)}%)</td></tr>`).join("")}</table>`;
      }).join("")}
      <p><b>Chance de que sea ley este mes: ${Math.round(prev.chanceTotal * 100)}%</b> <span class="small muted">(si no consigue dictamen, sigue en comisión y puede destrabarse más adelante)</span></p>
    </div>`;
  const lista = (arr, vacio, btn) => arr.length ? `<div class="stack">${arr.map(l => `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:6px"><div style="flex:1;min-width:200px"><b>${esc(l.nombre)}</b> <span class="small muted">· ${l.propia ? "tuyo" : PARTIDOS[l.autor] ? PARTIDOS[l.autor].corto : ""} · ${l.estado === "comision" ? `en comisión de ${esc(nombreCuerpo(l.camara, ctx))} desde el mes ${l.desde}` : l.estado === "caduco" ? "caducó" : l.inconstitucional ? "declarada inconstitucional" : "mes " + (l.hasta || l.desde)}</span></div>${btn ? btn(l) : ""}</div>`).join("")}</div>` : `<p class="small muted">${vacio}</p>`;
  return `<p class="small muted">${intro}</p>
    <h3>Redactar un proyecto</h3>
    <div class="row" style="flex-wrap:wrap;gap:8px">
      <label class="small">Área ${sel("lyArea", u.area, areas.map(a => [a, nAreas(a)]))}</label>
      <label class="small">Proyecto base ${sel("lyBase", u.base, deArea.map(l => [l.id, l.nombre]))}</label>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:6px">
      <label class="small">Intensidad ${sel("lyInt", u.int, [["suave", "Moderada"], ["normal", "Tal cual"], ["fuerte", "A fondo"]])}</label>
      <label class="small">Financiamiento ${sel("lyFin", u.fin, [["rentas", "Rentas generales"], ["impuesto", "Impuesto específico"], ["deuda", "Endeudamiento"], ["recorte", "Recorte de otras partidas"]])}</label>
      <label class="small">Alcance ${sel("lyAlc", u.alc, local ? [["nacional", "Todo el territorio"], ["piloto", "Prueba piloto"]] : [["nacional", "Todo el país"], ["adhesion", "Adhesión provincial"], ["piloto", "Prueba piloto"]])}</label>
      <label class="small">Vigencia ${sel("lyVig", u.vig, [["permanente", "Permanente"], ["emergencia", "Emergencia por dos años"]])}</label>
    </div>
    <div class="row small" style="flex-wrap:wrap;gap:10px;margin-top:6px">${cls.filter(([id]) => !(local && (id === "fondosProv" || id === "delegacion"))).map(([id, n]) => `<label><input type="checkbox" data-lycl="${id}" ${u.cl.includes(id) ? "checked" : ""}> ${n}</label>`).join("")}</div>
    <div class="row small" style="flex-wrap:wrap;gap:10px;margin-top:6px"><b>Negociación:</b>
      <label><input type="checkbox" id="lyFondos" ${u.fondos ? "checked" : ""}> ${ctx.modo === "leg" ? "Repartir un favor (obras y cargos)" : ctx.modo === "nac" ? "Fondos a gobernadores (más déficit)" : "Obras para los distritos de los legisladores (caja)"}</label>
      <label><input type="checkbox" id="lyConc" ${u.conc ? "checked" : ""}> Aceptar cambios de la oposición</label>
      ${ctx.modo === "nac" ? `<label><input type="checkbox" id="lyUrg" ${u.urg ? "checked" : ""}> Pedir tratamiento preferencial</label>` : ""}
    </div>
    <div class="row" style="gap:8px;margin-top:6px"><input id="lyNom" placeholder="Nombre propio del proyecto (opcional)" value="${esc(u.nom)}" style="flex:1;min-width:200px"><button id="lyEnviar" ${chk.ok ? "" : "disabled"}>Presentar en ${esc(cuerpoTxt)}</button></div>
    ${chk.ok ? "" : `<p class="small muted">${esc(chk.msg)}</p>`}
    ${ficha}
    <h3>En trámite</h3>
    ${lista(E.tram, "No hay proyectos en trámite.", l => l.propia ? `<div class="row" style="gap:6px"><button class="sec" data-lyst="${l.uid}">Sobre tablas (2/3)</button><button class="sec" data-lyret="${l.uid}">Retirar</button></div>` : "")}
    <h3>Leyes sancionadas</h3>
    ${lista(E.sanc.slice(-12).reverse(), "Todavía no se sancionó ninguna ley por esta vía.")}
    <h3>Rechazadas, vetadas o caducas</h3>
    ${lista([...E.rech, ...E.vet].sort((a, b) => (b.hasta || 0) - (a.hasta || 0)).slice(0, 10), "Ninguna.")}`;
}

function bindLeyes(rerender) {
  if (!document.getElementById("lyBase")) return;
  const u = estadoUILey();
  const leer = () => {
    const area = $("#lyArea").value;
    if (area !== u.area) { u.area = area; u.base = catalogoSegunCargo().find(l => l.area === area).id; }
    else u.base = $("#lyBase").value;
    u.int = $("#lyInt").value; u.fin = $("#lyFin").value; u.alc = $("#lyAlc").value; u.vig = $("#lyVig").value;
    u.cl = [...document.querySelectorAll("[data-lycl]")].filter(x => x.checked).map(x => x.dataset.lycl);
    u.fondos = $("#lyFondos").checked; u.conc = $("#lyConc").checked; u.urg = !!($("#lyUrg") && $("#lyUrg").checked);
    u.nom = $("#lyNom").value;
    rerender();
  };
  document.querySelectorAll("[data-ly], [data-lycl], #lyFondos, #lyConc, #lyUrg").forEach(x => x.onchange = leer);
  $("#lyNom").onchange = () => { u.nom = $("#lyNom").value; };
  const mostrar = r => colaEventos([{ titulo: "Trámite legislativo", texto: r.msg, pasos: r.pasos, tipo: r.tipo || "info", decision: r.decision }], rerender);
  $("#lyEnviar").onclick = () => {
    u.nom = $("#lyNom").value;
    const ley = redactarLey(u.base, { intensidad: u.int, fin: u.fin, alcance: u.alc, vigencia: u.vig, clausulas: u.cl, nombre: u.nom });
    const r = presentarLey(ley, { fondos: u.fondos, concesiones: u.conc, urgencia: u.urg });
    u.nom = "";
    mostrar(r);
  };
  document.querySelectorAll("[data-lyst]").forEach(b => b.onclick = () => mostrar(tratarSobreTablas(+b.dataset.lyst)));
  document.querySelectorAll("[data-lyret]").forEach(b => b.onclick = () => mostrar(retirarLey(+b.dataset.lyret)));
}
