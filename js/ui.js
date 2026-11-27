// =============================================================
//  VALDORA - Interfaz
// =============================================================

const $ = sel => document.querySelector(sel);
const app = $("#app");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let UI = { provSel: null, tabGob: "despacho", cfg: null };

// ---------- Modal ----------
function modal(html, tipo = "info") {
  const caja = $("#modalCaja");
  caja.className = "modal-caja " + tipo;
  caja.innerHTML = html;
  $("#modal").classList.remove("oculto");
}
function cerrarModal() { $("#modal").classList.add("oculto"); }
function colaEventos(eventos, alFinal) {
  const lista = eventos.filter(Boolean);
  const siguiente = () => {
    if (!lista.length) { cerrarModal(); alFinal && alFinal(); return; }
    const e = lista.shift();
    if (e.decision) { mostrarDecision(e, siguiente); return; }
    modal(`<h2>${esc(e.titulo)}</h2><p>${esc(e.texto)}</p>${(e.pasos || []).map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk">Continuar</button></div>`, e.tipo);
    $("#mOk").onclick = siguiente;
  };
  siguiente();
}

// ---------- Barra superior ----------
function renderEstado() {
  const el = $("#estado");
  if (!S) { el.innerHTML = ""; return; }
  const yo = S.jugador;
  if (S.fase === "campana") {
    const sem = S.balotaje ? "Balotaje a fin de mes" : `Mes ${mesDeSemana(S.semana)} de ${MESES_CAMPANA}`;
    el.innerHTML = `
      <span class="pill">${sem}</span>
      <span class="pill">Acciones <b>${S.ap}</b>/${AP_MES}</span>
      <span class="pill">Fondos <b>$${fmt(yo.plata)} M</b></span>
      <span class="pill">Militantes <b>${Math.round(yo.militantes).toLocaleString("es-AR")}</b></span>
      <span class="pill">Fiscales <b>${Math.round(yo.fiscales * 100)}%</b></span>
      <span class="pill" title="Riesgo de escándalo por aportes">Riesgo <b>${Math.round(S.riesgo)}</b></span>`;
  } else if (S.fase === "gobierno") {
    const etM = etiquetaMes(S.mes || 1);
    el.innerHTML = `
      <span class="pill">${etM} de 48</span>
      <span class="pill">Imagen <b>≈${Math.round(imagenPublicada())}%</b></span>
      <span class="pill">Inflación <b>${fmt(S.ind.inflacion)}%</b> mensual</span>
      <span class="pill">Tensión <b>${Math.round(S.ind.tension)}</b></span>
      <span class="pill" title="Casilleros de agenda: cada acción de gobierno fuera del despacho ocupa uno; una medida grande ocupa dos">Agenda <b>${agendaDisponible()}</b>/${agendaMax()}</span>`;
  }
}

// ---------- Portada ----------
function renderPortada() {
  S = null; renderEstado();
  app.innerHTML = `
    <div class="portada card">
      ${typeof EMBLEMA_SVG !== "undefined" ? EMBLEMA_SVG : ""}
      <div class="kicker">Simulador político por turnos</div>
      <h1 class="titulo-portada">VALDORA</h1>
      <p>Un simulador político por turnos. Armá tu partido o peleá la interna, hacé campaña provincia por provincia, ganá la elección y sobreviví a cuatro años de gobierno con el Congreso, la Justicia, los gobernadores, el Fondo y la calle.</p>
      <div class="row" style="justify-content:center">
        <button id="bNueva">Nueva partida</button>
        ${hayPartidaGuardada() ? '<button id="bCargar" class="sec">Continuar</button>' : ""}
        <button id="bPartidas" class="sec">Cargar o importar</button>
      </div>
      <p class="small muted" style="margin-top:24px">Geografía real de la Argentina; partidos, personajes y organismos ficticios. Las reglas se inspiran en la política argentina desde 1983 y en la política internacional desde 1945.</p>
    </div>`;
  $("#bNueva").onclick = renderCrear;
  const bc = $("#bCargar"); if (bc) bc.onclick = () => { const u = ultimaPartida(); const r = u ? cargarDe(u.k) : { ok: false }; if (r.ok) renderJuego(); };
  $("#bPartidas").onclick = () => panelPartidas();
  const u = ultimaPartida();
  if (u && bc) bc.title = `${u.m.nombre} · ${u.m.cargo} · ${u.m.fase}, mes ${u.m.mes}`;
}

// ---------- Creación del personaje ----------
const PUNTOS_ATRIB = 24;
// los mandatos completos de una carrera dan puntos extra de atributos
function puntosAtrib(c) { return PUNTOS_ATRIB + (c && c.legajoId && typeof puntosExtraLegajo === "function" ? puntosExtraLegajo(legajoPorId(c.legajoId)) : 0); }
function renderCrear() {
  UI.cfg = UI.cfg || { nombre: "", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, objetivo: "presidente", camino: "sumarse", partido: "MNJ", nombrePartido: "", tipoInterna: null, era: "hoy", precampana: 6, legajoId: null };
  const c = UI.cfg;
  if (c.precampana == null) c.precampana = 6;
  const usados = c.carisma + c.oratoria + c.gestion + c.negociacion, maxAtrib = puntosAtrib(c);
  const ideoTxt = c.ideo < 20 ? "Izquierda" : c.ideo < 40 ? "Centroizquierda" : c.ideo < 60 ? "Centro" : c.ideo < 80 ? "Centroderecha" : "Derecha liberal";
  const atr = (k, n, d) => `<div class="attr"><span title="${d}">${n}</span><input type="range" min="1" max="10" value="${c[k]}" data-attr="${k}"><b>${c[k]}</b></div>`;
  const objetivos = [
    ["presidente", "Presidente", "Ejecutivo nacional. Disponible en esta versión."],
    ["gobernador", "Gobernador", "Elegí entre las 24 provincias: cada una con su Legislatura (una o dos cámaras), su coparticipación, su deuda y sus conflictos."],
    ["intendente", "Intendente", "Elegí entre 8 municipios reales (La Matanza, La Plata, Córdoba, Mendoza…), cada uno con su Concejo Deliberante, su caja y sus barrios."],
    ["legislador", "Diputado nacional, jefe de bloque", "Lista por la provincia de Buenos Aires. En la Cámara conducís tu bloque: votos, negociaciones, proyectos propios."],
  ];
  const partidos = ["MNJ", "UR", "FC", "LY", "FT"];
  app.innerHTML = `
    <div class="crear stack">
      ${typeof htmlCarreras === "function" ? htmlCarreras(c) : ""}
      <div class="card stack">
        <h2>1. Tu personaje</h2>
        <div class="grid">
          <div class="stack">
            <div class="campo"><label>Nombre</label><input id="iNombre" value="${esc(c.nombre)}" placeholder="Ej.: Julia Montenegro" style="width:100%"></div>
            <div class="campo"><label>Ideología: ${ideoTxt} (${c.ideo})</label><input type="range" id="iIdeo" min="0" max="100" value="${c.ideo}"><div class="row small muted" style="justify-content:space-between"><span>Izquierda</span><span>Derecha</span></div></div>
          </div>
          <div class="stack">
            <label><b>Atributos</b> <span class="small ${usados > maxAtrib ? "up-bad" : "muted"}">${usados} de ${maxAtrib} puntos${maxAtrib > PUNTOS_ATRIB ? ` (${maxAtrib - PUNTOS_ATRIB} por experiencia)` : ""}</span></label>
            ${atr("carisma", "Carisma", "Recorridas, actos, militancia")}
            ${atr("oratoria", "Oratoria", "Entrevistas y debates")}
            ${atr("gestion", "Gestión", "Imagen y legitimidad al gobernar")}
            ${atr("negociacion", "Negociación", "Recaudación, pactos y Congreso")}
          </div>
        </div>
      </div>
      <div class="card stack">
        <h2>2. La época</h2>
        <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
          ${ERAS.map(e => `<div class="opcion ${c.era === e.id ? "sel" : ""}" data-era="${e.id}"><b>${esc(e.nombre)}</b><span class="small muted">${esc(e.desc)}</span></div>`).join("")}
        </div>
      </div>
      <div class="card stack">
        <h2>3. Tu objetivo</h2>
        <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
          ${objetivos.map(([id, n, d]) => `<div class="opcion ${c.objetivo === id ? "sel" : ""} " data-obj="${id}"><b>${n}</b><span class="small muted">${d}</span></div>`).join("")}
        </div>
      </div>
      ${c.objetivo === "gobernador" || c.objetivo === "intendente" ? htmlSelectorTerritorio(c) : ""}
      <div class="card stack">
        <h2>4. Tu camino</h2>
        <div class="opciones" style="grid-template-columns:1fr 1fr">
          <div class="opcion ${c.camino === "fundar" ? "sel" : ""}" data-camino="fundar"><b>Fundar un partido propio</b><span class="small muted">Juntar avales, sin estructura, sin plata y sin fiscales. Ideología propia.</span></div>
          <div class="opcion ${c.camino === "sumarse" ? "sel" : ""}" data-camino="sumarse"><b>Sumarte a un partido existente</b><span class="small muted">Estructura, fondos y fiscales, pero hay que ganar la interna.</span></div>
        </div>
        ${c.camino === "fundar" ? `<div class="campo"><label>Nombre del partido</label><input id="iPartido" value="${esc(c.nombrePartido)}" placeholder="Ej.: Movimiento Renovador Federal" style="width:100%"></div>` : `
          <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
            ${partidos.map(p => { const P = PARTIDOS[p]; return `<div class="opcion ${c.partido === p ? "sel" : ""}" data-partido="${p}" style="border-left:6px solid ${P.color}"><b>${P.nombre}</b><span class="small muted">${P.desc} Interna por defecto: ${P.interna === "dedo" ? "el dedo del líder" : P.interna === "PASO" ? "PASO" : "interna cerrada"}.</span></div>`; }).join("")}
          </div>
          <div class="campo"><label>Tipo de interna</label>
            <select id="iInterna">
              <option value="">La que usa el partido (${PARTIDOS[c.partido].interna === "dedo" ? "dedo" : PARTIDOS[c.partido].interna})</option>
              <option value="PASO" ${c.tipoInterna === "PASO" ? "selected" : ""}>PASO abiertas y obligatorias</option>
              <option value="cerrada" ${c.tipoInterna === "cerrada" ? "selected" : ""}>Interna cerrada de afiliados</option>
              <option value="dedo" ${c.tipoInterna === "dedo" ? "selected" : ""}>El dedo del líder</option>
            </select></div>`}
      </div>
      <div class="card stack">
        <h2>5. ¿Cuándo largás?</h2>
        <p class="small muted">La campaña general dura seis meses y la interna se define al final del segundo. Con precampaña arrancás antes de las PASO o de la interna para instalarte: más tiempo para juntar avales, militantes y conocimiento, mientras los rivales todavía no largaron. Rinde menos que la campaña, repetir el mismo lugar rinde cada vez menos y arrancar muy temprano desgasta.</p>
        <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
          ${[[0, "Con la campaña", "Sin precampaña: seis meses en total."], [3, "Tres meses antes", "Precampaña corta, casi sin desgaste."], [6, "Seis meses antes", "Precampaña larga: más votos para traccionar, más desgaste."]].map(([m, n, d]) => `<div class="opcion ${c.precampana === m ? "sel" : ""}" data-pre="${m}"><b>${n}</b><span class="small muted">${d}</span></div>`).join("")}
        </div>
      </div>
      <div class="row" style="justify-content:space-between">
        <button class="sec" id="bVolver">Volver</button>
        <button id="bEmpezar" ${usados > maxAtrib ? "disabled" : ""}>${c.precampana ? "Largar la precampaña" : "Empezar la campaña"}</button>
      </div>
    </div>`;
  $("#iNombre").oninput = e => c.nombre = e.target.value;
  $("#iIdeo").oninput = e => { c.ideo = +e.target.value; renderCrear(); };
  document.querySelectorAll("[data-attr]").forEach(el => el.oninput = e => { c[el.dataset.attr] = +e.target.value; renderCrear(); });
  document.querySelectorAll("[data-era]").forEach(el => el.onclick = () => { c.era = el.dataset.era; renderCrear(); });
  document.querySelectorAll("[data-obj]").forEach(el => el.onclick = () => { c.objetivo = el.dataset.obj; renderCrear(); });
  if (c.objetivo === "gobernador" || c.objetivo === "intendente") bindSelectorTerritorio(c, renderCrear);
  document.querySelectorAll("[data-camino]").forEach(el => el.onclick = () => { c.camino = el.dataset.camino; renderCrear(); });
  document.querySelectorAll("[data-pre]").forEach(el => el.onclick = () => { c.precampana = +el.dataset.pre; renderCrear(); });
  if (typeof bindCarreras === "function") bindCarreras(c, renderCrear);
  document.querySelectorAll("[data-partido]").forEach(el => el.onclick = () => { c.partido = el.dataset.partido; c.ideo = Math.round((c.ideo + PARTIDOS[c.partido].ideo) / 2); renderCrear(); });
  const ip = $("#iPartido"); if (ip) ip.oninput = e => c.nombrePartido = e.target.value;
  const ii = $("#iInterna"); if (ii) ii.onchange = e => c.tipoInterna = e.target.value || null;
  $("#bVolver").onclick = renderPortada;
  $("#bEmpezar").onclick = () => {
    if (!c.nombre.trim()) c.nombre = "Julia Montenegro";
    if (c.camino === "fundar" && !c.nombrePartido.trim()) c.nombrePartido = "Movimiento Renovador Federal";
    iniciarPartida({ ...c });
    UI.provSel = PROVINCIAS.slice().sort((a, b) => b.pob - a.pob)[0].id;
    renderJuego();
  };
}

// ---------- Router ----------
function renderJuego() {
  renderEstado();
  if (S.perdio) return renderFin(false);
  if (S.fase === "campana") return renderCampana();
  if (S.fase === "gobierno") { if (S.terminoMandato) return renderFin(true); return renderGobierno(); }
}

function unidadMapa() { return typeof esLocal === "function" && mapaNoNacional() ? (S.cfg.objetivo === "intendente" ? "barrio" : "departamento") : "provincia"; }
// ---------- Mapa ----------
function renderMapa(colorPor) {
  const M = MAPA_META || { w: 420, h: 897 };
  const fs = Math.max(7, M.w / 42);
  let svg = `<svg viewBox="0 0 ${M.w} ${M.h}" class="mapa nivel-${M.nivel || "nacion"}" role="img" aria-label="Mapa">`;
  for (const p of PROVINCIAS) {
    if (!p.path) continue;
    svg += `<path class="prov ${UI.provSel === p.id ? "sel" : ""}" data-prov="${p.id}" d="${p.path}" fill="${colorPor(p)}" fill-rule="evenodd"><title>${esc(p.nombre)} · ${fmt(p.pob, 1)}% del padrón</title></path>`;
  }
  // jurisdicciones diminutas a esta escala (CABA): marcador cliqueable
  for (const p of PROVINCIAS.filter(x => x.marcador)) svg += `<circle class="prov marcador ${UI.provSel === p.id ? "sel" : ""}" data-prov="${p.id}" cx="${p.cx}" cy="${p.cy}" r="${fs * 0.9}" fill="${colorPor(p)}"><title>${esc(p.nombre)} · ${fmt(p.pob, 1)}% del padrón</title></circle>`;
  // etiquetas: las más pobladas y la seleccionada
  const orden = PROVINCIAS.slice().sort((a, b) => b.pob - a.pob);
  const conEtiqueta = new Set(orden.slice(0, M.nivel === "nacion" ? 24 : 9).map(p => p.id).concat([UI.provSel]));
  for (const p of PROVINCIAS) {
    if (!conEtiqueta.has(p.id) || p.cx == null) continue;
    const nom = (p.corto || p.nombre).replace(/ sección.*$/, "").replace(/^(\d+)ª Sección, /, "$1ª ");
    const dx = p.marcador ? fs * 1.3 : 0;
    svg += `<text class="etq" x="${p.cx + dx}" y="${p.cy}" font-size="${fs}" text-anchor="${p.marcador ? "start" : "middle"}">${esc(nom.length > 22 ? nom.slice(0, 21) + "…" : nom)}</text>`;
  }
  return svg + `</svg>`;
}
function bindMapa(cb) {
  document.querySelectorAll("[data-prov]").forEach(g => g.onclick = () => { UI.provSel = g.dataset.prov; cb(); });
}
function colorCandidato(id) {
  const c = S.candidatos.find(x => x.id === id);
  return c ? PARTIDOS[c.partido].color : "#999";
}
function aclarar(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * f); g = Math.round(g + (255 - g) * f); b = Math.round(b + (255 - b) * f);
  return `rgb(${r},${g},${b})`;
}

// ---------- Campaña ----------
function barras(datos, max = null) {
  const arr = Object.entries(datos).sort((a, b) => b[1] - a[1]);
  const m = max || Math.max(...arr.map(x => x[1]), 1);
  return arr.map(([id, v]) => {
    const c = S.candidatos.find(x => x.id === id);
    return `<div class="barra"><span title="${esc(PARTIDOS[c.partido].nombre)}">${c.esJugador ? "<b>" : ""}${esc(c.nombre)}${c.esJugador ? "</b>" : ""} <span class="muted small">${PARTIDOS[c.partido].corto}</span></span><div class="track"><div class="fill" style="width:${100 * v / m}%;background:${PARTIDOS[c.partido].color}"></div></div><span class="v">${fmt(v)}%</span></div>`;
  }).join("");
}

function renderCampana() {
  renderEstado();
  const res = resultadosNacionales();
  const yo = S.jugador;
  const prov = PROVINCIAS.find(p => p.id === UI.provSel) || PROVINCIAS[0];
  const pctProv = res.porProv[prov.id];
  const colorPor = p => {
    const pct = res.porProv[p.id], g = ganadorProvincia(pct);
    const orden = Object.values(pct).sort((a, b) => b - a);
    const margen = orden[0] - (orden[1] || 0);
    return aclarar(colorCandidato(g), Math.max(0, 0.55 - margen / 30));
  };
  const enc = S.ultimaEncuesta;
  const internaInfo = (() => {
    if (S.internaResuelta) return `<span class="muted small">Candidatura definida.</span>`;
    if (S.tipoInterna === "avales") return `Avales: <b>${S.avales.toLocaleString("es-AR")}</b> de ${S.avalesNecesarios.toLocaleString("es-AR")} (cierre a fin del mes ${mesDeSemana(SEMANA_INTERNA - 1)})`;
    if (S.tipoInterna === "dedo") return `Lealtad con ${esc(PARTIDOS[yo.partido].lider)}: <b>${Math.round(S.lealtad)}</b> (decide a fin del mes ${mesDeSemana(SEMANA_INTERNA - 1)})`;
    if (S.tipoInterna === "cerrada") return `Apoyo de afiliados: <b>${Math.round(S.apoyoInterno)}</b> (interna a fin del mes ${mesDeSemana(SEMANA_INTERNA - 1)})`;
    if (S.tipoInterna === "PASO") return `PASO a fin del mes ${mesDeSemana(SEMANA_INTERNA)} contra ${esc(rivalInterno().nombre)}`;
  })();
  const acciones = Object.entries(ACCIONES).filter(([id]) => accionDisponible(id));
  app.innerHTML = `
    <div class="grid campana">
      <div class="card">
        <h2>Mapa de ${esc(typeof esLocal === "function" && mapaNoNacional() ? nombreTerritorio() : "la República Argentina")}</h2>
        <div id="mapa">${renderMapa(colorPor)}</div>
        <div class="leyenda">${S.candidatos.filter(c => c.activo && !(c.internoRival && S.internaResuelta)).map(c => `<span><i style="background:${PARTIDOS[c.partido].color}"></i>${esc(c.nombre)}</span>`).join("")}</div>
        <p class="small muted">Color: quién lidera en cada ${unidadMapa()}. Más claro, más reñido.</p>
        <div class="stack" style="margin-top:10px">
          <h3>${esc(prov.nombre)} <span class="muted small">${fmt(prov.pob)}% del padrón${mapaNoNacional() ? "" : ` · ${prov.dip} diputados`} · perfil ${prov.perfil}</span></h3>
          ${barras(pctProv)}
          <p class="small muted">Te conoce el ${Math.round(yo.know[prov.id] * 100)}% ${mapaNoNacional() ? "del distrito" : "de la provincia"}.</p>
        </div>
      </div>
      <div class="stack">
        <div class="card stack">
          <div class="row" style="justify-content:space-between"><h2>Acciones del mes</h2><span class="small muted">${internaInfo}</span></div>
          <p class="small muted">Las acciones territoriales se hacen en ${mapaNoNacional() ? "el distrito elegido" : "la provincia elegida"} en el mapa: <b>${esc(prov.nombre)}</b>.</p>
          <div class="acciones">
            ${acciones.map(([id, a]) => `<button class="accion" data-acc="${id}" ${S.ap < a.ap || yo.plata < a.plata ? "disabled" : ""} title="${esc(a.desc)}"><b>${a.nombre}</b><small>${a.ap} acc. · ${a.plata ? "$" + fmt(a.plata) + " M" : "gratis"}${a.necesitaProv ? " · " + esc(prov.nombre) : ""}</small></button>`).join("")}
          </div>
          ${S.ofertaAporte ? `<div class="oferta"><b>Oferta de aporte:</b> ${esc(S.ofertaAporte.nombre)} ofrece <b>$${fmt(S.ofertaAporte.monto)} M</b> a cambio de: <i>${esc(S.ofertaAporte.favor)}</i>. Riesgo de escándalo +${S.ofertaAporte.riesgo}.
            <div class="row" style="margin-top:6px"><button id="bAcepta">Aceptar</button><button class="sec" id="bRechaza">Rechazar</button></div></div>` : ""}
          <div class="row" style="justify-content:flex-end"><button id="bSemana">Terminar el mes ▸</button></div>
        </div>
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <h2>${mapaNoNacional() ? "Encuesta" : "Encuesta nacional"}</h2>
            <select id="selEnc">${ENCUESTADORAS.map((e, i) => `<option value="${i}" ${i === S.encuestadora ? "selected" : ""}>${esc(e.nombre)}</option>`).join("")}</select>
          </div>
          ${barras(enc)}
          <p class="small muted">Margen de error ±${ENCUESTADORAS[S.encuestadora].error} puntos. Cada consultora tiene su sesgo.${S.resultadoPASO ? " Las PASO ya se votaron." : ""}</p>
          ${S.pactos.length ? `<p class="small"><b>Pactos firmados:</b> ${S.pactos.map(p => SECTORES[p].nombre).join(", ")}</p>` : ""}
          ${S.favores.length ? `<p class="small"><b>Favores debidos:</b> ${S.favores.map(f => esc(f.aportante)).join(", ")}</p>` : ""}
        </div>
      </div>
      <div class="card col-log">
        <h2>Diario de campaña</h2>
        ${S.titulares.slice(0, 3).map(t => `<div class="titular">${esc(t.txt)}<small>${esc(t.medio)} · ${t.sem}</small></div>`).join("")}
        <div class="log">${S.log.map(l => `<div class="${l.tipo}"><span class="t">${l.sem}</span>${esc(l.txt)}</div>`).join("")}</div>
      </div>
    </div>`;
  bindMapa(renderCampana);
  document.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => clickAccion(b.dataset.acc));
  $("#bSemana").onclick = () => {
    const ev = terminarSemana();
    if (S.perdio) return colaEventos(ev, () => renderFin(false));
    colaEventos(ev, renderJuego);
  };
  $("#selEnc").onchange = e => { S.encuestadora = +e.target.value; S.ultimaEncuesta = encuesta(); renderCampana(); };
  const ba = $("#bAcepta"); if (ba) ba.onclick = () => { aceptarAporte(); renderCampana(); };
  const br = $("#bRechaza"); if (br) br.onclick = () => { rechazarAporte(); renderCampana(); };
}

function elegir(titulo, opciones, cb) {
  modal(`<h2>${esc(titulo)}</h2><div class="opciones">${opciones.map((o, i) => `<button class="opcion" data-i="${i}"><b>${esc(o.n)}</b>${o.d ? `<span class="small muted">${esc(o.d)}</span>` : ""}</button>`).join("")}</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="sec" id="mCancel">Cancelar</button></div>`);
  document.querySelectorAll("#modalCaja [data-i]").forEach(b => b.onclick = () => { cerrarModal(); cb(opciones[+b.dataset.i].v); });
  $("#mCancel").onclick = cerrarModal;
}

function clickAccion(id) {
  const a = ACCIONES[id];
  const hacer = opt => { const r = ejecutarAccion(id, opt); if (!r.ok) modal(`<p>${esc(r.msg)}</p><div class="row" style="justify-content:flex-end"><button onclick="cerrarModal()">OK</button></div>`, "aviso"); renderCampana(); };
  if (a.necesitaProv) return hacer({ prov: UI.provSel });
  if (a.necesitaGrupo) return elegir("¿A qué grupo apunta el spot?", GRUPOS.map(g => ({ n: g.nombre, d: g.prioridades, v: g.id })), g => hacer({ grupo: g }));
  if (a.necesitaMedio) return elegir("¿En qué medio?", MEDIOS.map(m => ({ n: m.nombre, d: `Línea editorial: ${m.afinidad < 40 ? "progresista" : m.afinidad > 60 ? "conservadora" : "de centro"}`, v: m.id })), m => hacer({ medio: m }));
  if (a.necesitaSector) return elegir("¿Con qué sector?", Object.entries(SECTORES).filter(([k]) => !S.pactos.includes(k)).map(([k, s]) => ({ n: s.nombre, d: "Compromiso: " + s.compromiso, v: k })), s => hacer({ sector: s }));
  if (a.necesitaRival) return elegir("¿Contra quién?", S.candidatos.filter(c => !c.esJugador && c.activo).map(c => ({ n: c.nombre, d: PARTIDOS[c.partido].nombre, v: c.id })), r => hacer({ rival: r }));
  hacer({});
}

// ---------- Gobierno ----------
function deltaInd(k, malo) {
  const h = S.hist[S.hist.length - 2] || S.hist[0];
  const d = S.ind[k] - h[k];
  if (Math.abs(d) < 0.05) return `<span class="d muted">=</span>`;
  const subeMalo = malo;
  const cls = (d > 0) === subeMalo ? "up-bad" : "up-good";
  return `<span class="d ${cls}">${d > 0 ? "▲" : "▼"} ${fmt(Math.abs(d), k === "reservas" ? 0 : 1)}</span>`;
}

function grafico(series) {
  const W = 720, H = 170, n = S.hist.length;
  if (n < 2) return `<p class="small muted">El gráfico se arma con los datos mensuales: aparece al cerrar el primer mes.</p>`;
  let out = `<svg viewBox="0 0 ${W} ${H + 20}" class="grafico" preserveAspectRatio="none">`;
  for (let g = 0; g <= 4; g++) { const y = 5 + g * (H - 10) / 4; out += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".08"/>`; }
  for (const s of series) {
    const vals = S.hist.map(h => h[s.k]);
    const max = s.max, min = s.min;
    const pts = vals.map((v, i) => `${(i / (n - 1)) * (W - 10) + 5},${H - (v - min) / (max - min) * (H - 10) - 5}`).join(" ");
    out += `<polyline fill="none" stroke="${s.c}" stroke-width="2.5" vector-effect="non-scaling-stroke" points="${pts}"/>`;
  }
  out += `</svg><div class="row small muted" style="justify-content:space-between"><span>Asunción</span><span>Hoy</span></div>`;
  out += `<div class="leyenda">${series.map(s => `<span><i style="background:${s.c}"></i>${s.n}</span>`).join("")}</div>`;
  return out;
}

function hemiciclo(camara, total) {
  const orden = Object.entries(camara).filter(([, n]) => n > 0).sort((a, b) => PARTIDOS[a[0]].ideo - PARTIDOS[b[0]].ideo);
  const filas = total > 100 ? 9 : 5;
  const puntos = [];
  const R0 = 40, R1 = 140;
  let porFila = [], sumR = 0;
  for (let f = 0; f < filas; f++) { const r = R0 + (R1 - R0) * f / (filas - 1); porFila.push(r); sumR += r; }
  let asignados = 0;
  const cant = porFila.map((r, i) => { const c = i === filas - 1 ? total - asignados : Math.round(total * r / sumR); asignados += c; return c; });
  porFila.forEach((r, f) => { for (let i = 0; i < cant[f]; i++) { const ang = Math.PI - Math.PI * (cant[f] === 1 ? 0.5 : i / (cant[f] - 1)); puntos.push({ x: 150 + r * Math.cos(ang), y: 150 - r * Math.sin(ang), ang }); } });
  puntos.sort((a, b) => b.ang - a.ang);
  const colores = [];
  orden.forEach(([k, n]) => { for (let i = 0; i < n; i++) colores.push(PARTIDOS[k].color); });
  const rad = total > 100 ? 4.2 : 7;
  return `<svg viewBox="0 0 300 160">${puntos.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${rad}" fill="${colores[i] || "#999"}"/>`).join("")}<text x="150" y="150" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">${total}</text></svg>
  <div class="leyenda">${orden.map(([k, n]) => `<span><i style="background:${PARTIDOS[k].color}"></i>${PARTIDOS[k].corto} ${n}</span>`).join("")}</div>`;
}

function tablaVotacion(v) {
  if (v.tipo === "comision") return `<h3 style="margin-top:10px">Comisiones</h3><p class="small ${v.ok ? "up-good" : "up-bad"}">${esc(v.texto)}</p>`;
  const nombre = v.camara === "dip" ? "Diputados" : "Senado";
  const titulo = v.rechazoDNU ? `${nombre}: votación para rechazar el DNU` : nombre;
  return `<h3 style="margin-top:10px">${titulo}: ${v.aprobado ? (v.rechazoDNU ? "rechazado" : "APROBADO") : (v.rechazoDNU ? "no se reunió el rechazo" : "RECHAZADO")}</h3>
  <p class="small muted">${v.quorum ? "Hubo quórum" : "No hubo quórum"}. Afirmativos ${v.si}, negativos ${v.no}, ausentes ${v.aus}. Necesarios: ${v.necesario}.</p>
  <table class="tally"><tr><th>Bloque</th><th>Sí</th><th>No</th><th>Aus.</th></tr>${v.detalle.map(d => `<tr><td>${PARTIDOS[d.bloque].corto}</td><td>${d.si}</td><td>${d.no}</td><td>${d.aus}</td></tr>`).join("")}</table>`;
}

function renderGobierno() {
  renderEstado();
  const I = S.ind, yo = S.jugador;
  const pendExp = (S.expedientes || []).filter(e => !e.resuelto).length;
  const tabs = [["despacho", `Despacho${pendExp ? " (" + pendExp + ")" : ""}`], ["resumen", "Estadísticas"], ["gabinete", "Jefatura de Gabinete"], ["economia", "Economía"], ["cancilleria", "Cancillería"], ["conflictos", `Conflictos${conflictosActivos().length ? " (" + conflictosActivos().length + ")" : ""}`], ["poder", "Factores de poder"], ["presupuesto", "Presupuesto"], ["medidas", "Medidas"], ["congreso", "Congreso y gobernadores"], ["leyes", `Leyes${(S.leyes && S.leyes.tram.length) ? " (" + S.leyes.tram.length + ")" : ""}`], ["boletin", "Boletín Oficial"], ["justicia", `Justicia${(S.causasJ || []).filter(c => !c.cerrada).length ? " (" + S.causasJ.filter(c => !c.cerrada).length + ")" : ""}`], ["prensa", "Prensa"]];
  const indicadores = [
    ["inflacion", "Inflación mensual", fmt(I.inflacion) + "%", true],
    ["desempleo", "Desempleo", fmt(I.desempleo) + "%", true],
    ["crecimiento", "Crecimiento anual", fmt(I.crecimiento) + "%", false],
    ["pobreza", "Pobreza", fmt(I.pobreza) + "%", true],
    ["deficit", "Déficit fiscal", fmt(I.deficit) + "% PBI", true],
    ["deuda", "Deuda pública", fmt(I.deuda, 0) + "% PBI", true],
    ["reservas", "Reservas", "US$ " + Math.round(I.reservas).toLocaleString("es-AR") + " M", false],
    ["inseguridad", "Inseguridad", Math.round(I.inseguridad) + "/100", true],
    ["imagen", "Imagen", Math.round(I.imagen) + "%", false],
    ["legitimidad", "Legitimidad", Math.round(I.legitimidad) + "/100", false],
  ];
  let cuerpo = "";
  if (UI.tabGob === "despacho") {
    const exps = S.expedientes || [];
    cuerpo = `<p class="small muted">Los expedientes que llegan a tu escritorio este mes. Cada decisión mueve indicadores, grupos sociales y factores de poder, y algunas tienen consecuencias que llegan meses después. Lo que no decidas antes de terminar el mes se agrava solo.</p>
      ${S.ultimasReacciones && S.ultimasReacciones.length ? `<div class="stack small">${S.ultimasReacciones.map(r => `<div class="${r.malo ? "up-bad" : "up-good"}"><b>${esc(r.actor)}:</b> ${esc(r.texto)}</div>`).join("")}</div>` : ""}
      <div class="stack">${exps.map((e, i) => {
        const d = DILEMAS.find(x => x.id === e.id);
        return `<div class="expediente ${e.resuelto ? "resuelto" : ""}">
          <h3>${esc(d.titulo)}</h3><p>${esc(d.texto)}</p>
          ${e.resuelto ? `<p class="small"><b>Decisión:</b> ${e.eleccion >= 0 ? esc(d.opciones[e.eleccion].t) : "sin decisión"}</p>` :
          `<div class="opciones">${d.opciones.map((o, j) => `<button class="opcion" data-exp="${i}" data-op="${j}"><b>${esc(o.t)}</b><span class="small muted">${esc(o.pista || "")}</span></button>`).join("")}</div>`}
        </div>`; }).join("") || '<p class="muted">No hay expedientes pendientes.</p>'}</div>
      ${S.diferidos && S.diferidos.length ? `<p class="small muted">Hay ${S.diferidos.length} decisiones tuyas cuyas consecuencias todavía no llegaron.</p>` : ""}`;
  } else if (UI.tabGob === "poder") {
    const barra = (n, v, extra = "") => `<div class="barra"><span>${n}</span><div class="track"><div class="fill" style="width:${v}%;background:${v < 25 ? "var(--bad)" : v > 75 ? "var(--good)" : "var(--accent)"}"></div></div><span class="v">${Math.round(v)}</span></div>${extra}`;
    cuerpo = `
      <h3>Ministro de Economía</h3>
      <p>${S.ministroEco ? `<b>${esc(S.ministroEco.nombre)}</b>, ${esc(S.ministroEco.titulo)}. ${esc(S.ministroEco.desc)}` : "Sin designar."}</p>
      <h3>Gabinete</h3>
      <table class="tally"><tr><th>Cargo</th><th>Titular</th><th>Capacidad</th><th>Desgaste</th></tr>
      ${S.gabinete.map(m => `<tr><td>${m.cargo}</td><td>${esc(m.nombre)}</td><td>${m.comp}/10</td><td>${m.desgaste}</td></tr>`).join("")}</table>
      <p class="small muted">Vicepresidente: <b>${esc(S.vice.nombre)}</b>, lealtad ${Math.round(S.vice.lealtad)}/100${S.vice.lealtad < 30 ? " (su sector vota con libertad de acción en el Senado)" : ""}.${S.delegacion > 0 ? ` Facultades delegadas por ${S.delegacion} trimestres más.` : ""}${S.enDefault ? " El país está en default." : ""}</p>
      <h3 style="margin-top:12px">Factores de poder</h3>
      <p class="small muted">Debajo de 25 pasan a la acción en tu contra; arriba de 75 te ayudan. Se mueven con tus decisiones y con la economía.</p>
      ${ACTORES.map(a => { const pc = S.percepcion && S.percepcion[a.id]; return pc ? barra(a.nombre, pc.v).replace(`<span class="v">${Math.round(pc.v)}</span>`, `<span class="v">${rango(pc.v, pc.sd * 0.6)}</span>`) : barra(a.nombre, S.actoresRel[a.id]); }).join("")}
      <p class="small muted">${S.percepcion ? "Son estimaciones de tus asesores, no certezas: con un buen ministro del Interior el margen se achica." : ""}</p>`;
  } else if (UI.tabGob === "resumen") {
    const nivel = I.tension < 30 ? "Calma" : I.tension < 50 ? "Malestar" : I.tension < 70 ? "Conflicto" : I.tension < 85 ? "Crisis" : "Estallido";
    cuerpo = `
      <div class="indicadores">${indicadores.map(([k, l, v, malo]) => `<div class="ind"><div class="l">${l}</div><div class="n">${v}</div>${deltaInd(k, malo)}</div>`).join("")}</div>
      ${htmlEstadisticas(FILAS_EST_NAC, "Instituto Nacional de Estadística y Censos (ficticio)")}
      <h3 style="margin-top:14px">Tensión social: ${Math.round(I.tension)} (${nivel})</h3>
      <div class="tension"><div class="marca-t" style="left:calc(${I.tension}% - 2px)"></div></div>
      <div class="row small muted" style="justify-content:space-between"><span>Calma</span><span>Malestar</span><span>Conflicto</span><span>Crisis</span><span>Estallido</span></div>
      <h3 style="margin-top:14px">Evolución mes a mes</h3>
      ${htmlGraficos()}
      <p class="small muted">Medidas vigentes: ${S.medidasActivas.length ? S.medidasActivas.map(id => MEDIDAS.find(m => m.id === id).nombre).join(", ") : "ninguna"}. DNU firmados: ${S.dnuCount}. Corte Suprema: ${S.corte.miembros} miembros, ${S.corte.afines} afines.${S.fmi && S.fmi.activo ? ` Programa con el Fondo: meta de déficit ${fmt(S.fmi.metaDeficit)}%.` : ""}</p>`;
  } else if (UI.tabGob === "presupuesto") {
    cuerpo = `
      <p class="small muted">Subí o bajá cada partida respecto del presupuesto heredado. El gasto extra aumenta el déficit; el recorte baja el déficit pero tiene costos sociales. El presupuesto lo aprueba el Congreso: si cambiás mucho, se vota.</p>
      ${AREAS.map(a => `<div class="slider-row"><span>${a.nombre}</span><input type="range" min="-40" max="40" step="5" value="${S.presupuesto[a.id]}" data-area="${a.id}"><b>${S.presupuesto[a.id] > 0 ? "+" : ""}${S.presupuesto[a.id]}%</b></div>`).join("")}
      <div class="slider-row" style="margin-top:10px"><span><b>Presión impositiva</b></span><input type="range" min="-20" max="20" step="2" value="${S.impuestos}" id="slImp"><b>${S.impuestos > 0 ? "+" : ""}${S.impuestos}%</b></div>
      <p class="small muted">Para subir impuestos de verdad (IVA, Ganancias, retenciones) usá las medidas: las leyes tributarias empiezan en Diputados.</p>
      ${htmlEjecucion()}`;
  } else if (UI.tabGob === "medidas") {
    const nombreInst = { resolucion: "Resolución", decreto: "Decreto", dnu: "DNU", ley: "Proyecto de ley", delegado: "Decreto delegado" };
    cuerpo = `
      <p class="small muted">Una medida grande por mes. Restricciones: los DNU no pueden tratar materia penal, tributaria, electoral ni de partidos; los impuestos los crea el Congreso. Al mandar una ley podés ofrecer fondos a gobernadores para sumar votos.</p>
      <div class="expediente stack">
        <h3>Redactar un proyecto de ley propio</h3>
        <div class="row">
          <select id="pTipo"><option value="impuesto">Impuesto</option><option value="programa">Programa o regulación</option></select>
          <select id="pId">${IMPUESTOS.map(i => `<option value="${i.id}">${esc(i.nombre)}</option>`).join("")}</select>
          <select id="pDir"><option value="sube">Subir</option><option value="baja">Bajar</option></select>
          <button id="pEnviar" ${S.medidasEsteTrimestre >= 1 ? "disabled" : ""}>Enviar al Congreso</button>
        </div>
        <p class="small muted">Los impuestos solo se crean por ley y empiezan en Diputados. Algunos programas requieren que las provincias adhieran.</p>
      </div>
      <div class="stack">${MEDIDAS.filter(m => !m.dinamica || S.medidasActivas.includes(m.id)).map(m => {
        const vig = S.medidasActivas.includes(m.id);
        return `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:6px">
          <div style="flex:1;min-width:200px"><b>${m.nombre}</b><br><span class="small muted">Materia ${m.materia}${vig ? " · <b>vigente</b>" : ""}</span></div>
          <div class="row">${vig ? `<button class="sec" data-derogar="${m.id}" ${S.medidasEsteTrimestre >= 1 ? "disabled" : ""}>Derogar</button>` : (S.delegacion > 0 && m.inst.includes("ley") && !["penal", "tributaria", "electoral"].includes(m.materia) ? m.inst.concat(["delegado"]) : m.inst).map(i => `<button class="sec" data-medida="${m.id}" data-inst="${i}" ${S.medidasEsteTrimestre >= 1 ? "disabled" : ""}>${nombreInst[i]}</button>`).join("")}</div>
        </div>`; }).join("")}</div>`;
  } else if (UI.tabGob === "justicia") {
    const abiertas = S.causasJ.filter(c => !c.cerrada), cerradas = S.causasJ.filter(c => c.cerrada);
    cuerpo = `<p class="small muted">Juzgados federales, Cámara Federal y Corte. Las causas avanzan según el juez, la presión de la prensa y tu riesgo de escándalo. Corte Suprema: ${S.corte.miembros} miembros, ${S.corte.afines} afines al gobierno. Consejo de la Magistratura: ${S.consejo.oficialistas} de 13 consejeros oficialistas (hacen falta 9 para acusar a un juez).</p>
      ${abiertas.length ? abiertas.map(c => `<div class="expediente">
        <h3>Causa por ${esc(c.tema)}</h3>
        <p class="small">Imputado: <b>${esc(c.imputado.nombre)}</b>${c.imputado.cargo ? " (" + esc(c.imputado.cargo) + (c.imputado.tipo === "exfuncionario" ? ", ya renunció" : "") + ")" : ""}. Juez: ${esc(c.juez.nombre)}, ${esc(c.juez.estilo)}.</p>
        <div class="row small">${ETAPAS.map((e, i) => `<span class="pill" style="${i <= c.etapa ? "background:var(--accent);color:var(--accent-ink)" : ""}">${e}</span>`).join("")}</div>
        <div class="barra" style="margin-top:6px"><span>Avance a la próxima etapa</span><div class="track"><div class="fill" style="width:${Math.round(c.avance * 100)}%;background:var(--warn)"></div></div><span class="v">${Math.round(c.avance * 100)}%</span></div>
        ${c.accionTrimestre ? '<p class="small muted">Ya actuaste sobre esta causa en este trimestre.</p>' : `<div class="opciones" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
          <button class="opcion" data-causa="${c.id}" data-acc="respetar"><b>Respetar a la Justicia</b><span class="small muted">Gana legitimidad</span></button>
          ${c.imputado.tipo === "ministro" ? `<button class="opcion" data-causa="${c.id}" data-acc="renuncia"><b>Pedirle la renuncia</b><span class="small muted">La causa te pega menos</span></button>` : ""}
          <button class="opcion" data-causa="${c.id}" data-acc="operar"><b>Operar sobre el juez</b><span class="small muted">Enfría la causa; puede filtrarse</span></button>
          <button class="opcion" data-causa="${c.id}" data-acc="consejo"><b>Denunciarlo ante el Consejo de la Magistratura</b><span class="small muted">Necesitás 9 de 13 votos</span></button>
        </div>`}
      </div>`).join("") : '<p class="muted">No hay causas abiertas contra tu gobierno.</p>'}
      ${cerradas.length ? `<h3 style="margin-top:10px">Causas terminadas</h3><ul class="small">${cerradas.map(c => `<li>${esc(c.tema)} (${esc(c.imputado.nombre)})</li>`).join("")}</ul>` : ""}`;
  } else if (UI.tabGob === "prensa") {
    cuerpo = `<h3>Tapas de los diarios</h3>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${S.tapas.map(t => `<div class="titular"><b>${esc(t.titulo)}</b><small>${esc(t.medio)} · línea ${t.linea}</small></div>`).join("")}</div>
      <h3 style="margin-top:12px">Periodistas que investigan al gobierno</h3>
      ${S.periodistas.map(p => `<div class="barra"><span title="${esc(p.estilo)}">${esc(p.nombre)} <span class="muted small">${esc(p.medio)}</span></span><div class="track"><div class="fill" style="width:${Math.min(100, p.progreso)}%;background:var(--bad)"></div></div><span class="v">${Math.round(Math.min(100, p.progreso))}%</span></div>`).join("")}
      <p class="small muted">Cuando una investigación llega al 100% se publica y un fiscal abre una causa. Avanzan más rápido con tu riesgo de escándalo y con medios hostiles.</p>
      <h3 style="margin-top:12px">Comunicación</h3>
      <div class="slider-row"><span>Pauta oficial</span><input type="range" min="0" max="4" step="1" value="${S.pauta}" id="slPauta"><b>${["Nada", "Baja", "Media", "Alta", "Masiva"][S.pauta]}</b></div>
      <p class="small muted">La publicidad oficial ablanda a los medios y frena investigaciones, pero cuesta déficit y con montos altos suma riesgo de escándalo.</p>
      <div class="row"><button class="sec" id="bConf" ${S.conferencia ? "disabled" : ""}>Dar conferencia de prensa</button><button class="sec" id="bCadena">Cadena nacional</button></div>`;
  } else if (UI.tabGob === "congreso") {
    const gobs = Object.entries(S.gobernadores).sort((a, b) => PROVINCIAS.find(p => p.id === b[0]).dip - PROVINCIAS.find(p => p.id === a[0]).dip);
    cuerpo = `
      <div class="grid" style="grid-template-columns:1fr 1fr">
        <div class="hemiciclo"><h3>Diputados (quórum 129)</h3>${hemiciclo(S.dip, 257)}</div>
        <div class="hemiciclo"><h3>Senado (quórum 37)</h3>${hemiciclo(S.sen, 72)}</div>
      </div>
      <h3 style="margin-top:12px">Bloques</h3>
      <table class="tally"><tr><th>Bloque</th><th>Dip.</th><th>Sen.</th><th>Disciplina</th><th>Relación</th><th></th></tr>
      ${Object.keys(S.bloques).map(k => `<tr><td><i style="display:inline-block;width:10px;height:10px;background:${PARTIDOS[k].color};border-radius:2px"></i> ${PARTIDOS[k].nombre}</td><td>${S.dip[k] || 0}</td><td>${S.sen[k] || 0}</td><td>${Math.round(S.bloques[k].disciplina * 100)}%</td><td>${Math.round(S.bloques[k].relacion)}</td><td>${k === yo.partido ? "oficialismo" : `<button class="sec" data-neg="${k}">Negociar</button>`}</td></tr>`).join("")}
      </table>
      <h3 style="margin-top:12px">Gobernadores</h3>
      <p class="small muted">Los legisladores responden a sus gobernadores. Los ATN (Aportes del Tesoro Nacional) compran voluntades pero suben el déficit.</p>
      <table class="tally"><tr><th>Provincia</th><th>Partido</th><th>Relación</th><th></th></tr>
      ${gobs.map(([pid, g]) => `<tr><td>${PROVINCIAS.find(p => p.id === pid).nombre}</td><td>${PARTIDOS[g.partido].corto}</td><td>${Math.round(g.relacion)}</td><td><button class="sec" data-atn="${pid}">Enviar ATN</button></td></tr>`).join("")}
      </table>`;
  } else if (UI.tabGob === "cancilleria") {
    const acc = [
      ["brasil", "Cumbre con Brasilia del Sur", "Renovar el acuerdo automotriz del Mercado Común del Sur."],
      ["alinearNorte", "Alinearse con la Federación del Norte", "Inversiones y apoyo en el Fondo."],
      ["alinearEste", "Swap con la República Popular del Este", "Reservas frescas, recelo del Norte."],
      ["aviones", "Comprar aviones de combate", "1.500 millones de reservas."],
      ["islas", "Reclamo por las islas en la Asamblea General", "Soberanía y unidad nacional."],
    ];
    cuerpo = htmlCancilleria() + `<h3 style="margin-top:14px">Otras gestiones</h3><p class="small muted">Alineamiento actual: <b>${S.alineamiento}</b>. Los tratados internacionales los aprueba el Congreso (art. 75 inc. 22).</p>
      <div class="stack">${acc.map(([id, n, d]) => `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:6px"><div style="flex:1;min-width:200px"><b>${n}</b><br><span class="small muted">${d}</span></div><button class="sec" data-ext="${id}" ${S.politicaExterior.includes(id) && id !== "islas" ? "disabled" : ""}>Hacer</button></div>`).join("")}</div>`;
  }
  if (UI.tabGob === "leyes") cuerpo = htmlLeyes();
  if (UI.tabGob === "boletin") cuerpo = htmlBoletin();
  if (UI.tabGob === "gabinete") cuerpo = htmlGabinete();
  if (UI.tabGob === "economia") cuerpo = htmlEconomia();
  if (UI.tabGob === "conflictos") cuerpo = htmlConflictos();
  app.innerHTML = `
    <div class="grid gobierno">
      <div class="card" style="grid-column: span 2">
        ${encabezadoPortal(esc(yo.nombre), '<button id="bTrim">Terminar el mes ▸</button>')}
        <div class="tabs portal-nav">${tabs.map(([id, n]) => `<button data-tab="${id}" class="${UI.tabGob === id ? "on" : ""}">${n}</button>`).join("")}</div>
        ${cuerpo}
      </div>
      <div class="card col-log">
        <h2 class="sala">Sala de prensa</h2>
        ${S.titulares.slice(0, 3).map(t => `<div class="titular">${esc(t.txt)}<small>${esc(t.medio)} · ${t.sem}</small></div>`).join("")}
        <div class="log">${S.log.map(l => `<div class="${l.tipo}"><span class="t">${l.sem}</span>${esc(l.txt)}</div>`).join("")}</div>
      </div>
    </div>`;
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { UI.tabGob = b.dataset.tab; renderGobierno(); });
  bindLeyes(renderGobierno);
  bindBoletin(renderGobierno);
  bindGestion(renderGobierno);
  document.querySelectorAll("[data-exp]").forEach(b => b.onclick = () => {
    const r = resolverExpediente(+b.dataset.exp, +b.dataset.op);
    if (r.msg || (r.pasos && r.pasos.length)) {
      modal(`<h2>Decisión tomada</h2><p>${esc(r.msg || "Hecho.")}</p>${(r.pasos || []).map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk">OK</button></div>`, r.tipo || "info");
      $("#mOk").onclick = () => { cerrarModal(); renderGobierno(); };
    } else renderGobierno();
  });
  if (S.decisionInicial === "ministroEco") {
    modal(`<h2>Tu primera decisión: el ministro de Economía</h2><p>Antes de asumir tenés que anunciar quién maneja la economía. Los mercados, los sindicatos y el Fondo esperan el nombre.</p>
      <div class="opciones">${PERFILES_ECONOMIA.map(p => `<button class="opcion" data-eco="${p.id}"><b>${esc(p.nombre)}: ${esc(p.titulo)}</b><span class="small muted">${esc(p.desc)}</span></button>`).join("")}</div>`, "info");
    document.querySelectorAll("[data-eco]").forEach(b => b.onclick = () => { elegirMinistroEco(b.dataset.eco); cerrarModal(); renderGobierno(); });
  }
  document.querySelectorAll("[data-area]").forEach(s => s.onchange = e => { S.presupuesto[s.dataset.area] = +e.target.value; renderGobierno(); });
  const si = $("#slImp"); if (si) si.onchange = e => { S.impuestos = +e.target.value; renderGobierno(); };
  document.querySelectorAll("[data-medida]").forEach(b => b.onclick = () => clickMedida(b.dataset.medida, b.dataset.inst));
  const mostrarRes = (titulo, r) => {
    modal(`<h2>${esc(titulo)}</h2><p>${esc(r.msg || "")}</p>${(r.pasos || []).map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk">OK</button></div>`, r.tipo || (r.aprobada === false ? "malo" : "info"));
    $("#mOk").onclick = () => { cerrarModal(); renderGobierno(); };
  };
  document.querySelectorAll("[data-derogar]").forEach(b => b.onclick = () => mostrarRes("Derogación", derogarMedida(b.dataset.derogar)));
  document.querySelectorAll("[data-causa]").forEach(b => b.onclick = () => mostrarRes("Justicia", accionCausa(b.dataset.causa, b.dataset.acc)));
  const pt = $("#pTipo");
  if (pt) {
    const llenar = () => {
      const t = pt.value;
      $("#pId").innerHTML = (t === "impuesto" ? IMPUESTOS : PROGRAMAS).map(i => `<option value="${i.id}">${esc(i.nombre)}</option>`).join("");
      $("#pDir").style.display = t === "impuesto" ? "" : "none";
    };
    pt.onchange = llenar;
    $("#pEnviar").onclick = () => {
      const med = redactarProyecto(pt.value, $("#pId").value, $("#pDir").value);
      const r = enviarProyecto(med, 0);
      if (!r.ok) return mostrarRes("No se puede", { ...r, tipo: "aviso" });
      mostrarRes(med.nombre, { ...r, tipo: r.aprobada ? "bueno" : "malo" });
    };
  }
  const sp = $("#slPauta"); if (sp) sp.onchange = e => { setPauta(+e.target.value); renderGobierno(); };
  const bcf = $("#bConf"); if (bcf) bcf.onclick = () => mostrarRes("Conferencia de prensa", conferenciaPrensa());
  const bcd = $("#bCadena"); if (bcd) bcd.onclick = () => mostrarRes("Cadena nacional", cadenaNacional());
  document.querySelectorAll("[data-neg]").forEach(b => b.onclick = () => mostrarRes("Congreso", negociarBloque(b.dataset.neg)));
  document.querySelectorAll("[data-atn]").forEach(b => b.onclick = () => mostrarRes("Gobernadores", enviarATN(b.dataset.atn)));
  document.querySelectorAll("[data-ext]").forEach(b => b.onclick = () => {
    const r = accionExterior(b.dataset.ext);
    modal(`<h2>Relaciones exteriores</h2><p>${esc(r.msg)}</p>${(r.pasos || []).map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk">OK</button></div>`, r.ok ? "info" : "aviso");
    $("#mOk").onclick = () => { cerrarModal(); renderGobierno(); };
  });
  $("#bTrim").onclick = finTrimestre;
}

function clickMedida(id, inst) {
  const m = MEDIDAS.find(x => x.id === id);
  const ejecutar = extra => {
    const r = tomarMedida(id, inst, extra);
    if (!r.ok) { modal(`<h2>No se puede</h2><p>${esc(r.msg)}</p><div class="row" style="justify-content:flex-end"><button id="mOk">OK</button></div>`, "aviso"); $("#mOk").onclick = cerrarModal; return; }
    modal(`<h2>${esc(m.nombre)}</h2><p>${esc(r.msg)}</p>${r.pasos.map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end">${r.cajoneado ? '<button class="sec" id="mForzar">Pedir sesión especial (2/3)</button>' : ""}<button id="mOk">OK</button></div>`, r.aprobada ? "bueno" : "malo");
    $("#mOk").onclick = () => { cerrarModal(); renderGobierno(); };
    const bf = $("#mForzar"); if (bf) bf.onclick = () => {
      const f = forzarSesionEspecial(id);
      modal(`<h2>Sesión especial: ${esc(m.nombre)}</h2><p>${esc(f.msg)}</p>${f.pasos.map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk2">OK</button></div>`, f.aprobada ? "bueno" : "malo");
      $("#mOk2").onclick = () => { cerrarModal(); renderGobierno(); };
    };
  };
  if (inst === "ley") {
    modal(`<h2>Enviar al Congreso: ${esc(m.nombre)}</h2>
      <p>${m.materia === "tributaria" ? "Por ser materia tributaria, la Cámara de origen es Diputados (art. 52). " : ""}El proyecto va a comisión, obtiene dictamen y se vota en las dos cámaras.</p>
      <p>Diputados oficialistas: <b>${S.dip[S.jugador.partido] || 0}</b> de 257. Senadores: <b>${S.sen[S.jugador.partido] || 0}</b> de 72.</p>
      <label>Fondos para gobernadores a cambio de votos: <b id="vExtra">0</b></label>
      <input type="range" id="slExtra" min="0" max="30" step="5" value="0">
      <p class="small muted">Cada 10 puntos suman apoyo y 0,1 punto de déficit.</p>
      <div class="row" style="justify-content:flex-end"><button class="sec" id="mCancel">Cancelar</button><button id="mEnviar">Enviar el proyecto</button></div>`, "info");
    $("#slExtra").oninput = e => $("#vExtra").textContent = e.target.value;
    $("#mCancel").onclick = cerrarModal;
    $("#mEnviar").onclick = () => ejecutar(+$("#slExtra").value);
  } else ejecutar(0);
}

function mostrarDecision(e, siguiente) {
  const ops = {
    veto: [["promulgar", "Promulgar la ley"], ["vetar", "Vetarla (art. 83: el Congreso puede insistir con dos tercios)"]],
    saqueos: [["asistencia", "Plan de emergencia alimentaria"], ["sitio", "Declarar el estado de sitio"], ["reprimir", "Reprimir con fuerzas federales"]],
    este: [["aceptar", "Aceptar la inversión"], ["rechazar", "Rechazarla"]],
  }[e.decision];
  modal(`<h2>${esc(e.titulo)}</h2><p>${esc(e.texto)}</p><div class="opciones">${ops.map(([v, n]) => `<button class="opcion" data-op="${v}"><b>${esc(n)}</b></button>`).join("")}</div>`, "aviso");
  document.querySelectorAll("#modalCaja [data-op]").forEach(b => b.onclick = () => {
    const r = resolverDecision(e.decision, b.dataset.op);
    modal(`<p>${esc(r.msg)}</p>${(r.pasos || []).map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk">Continuar</button></div>`, "info");
    $("#mOk").onclick = siguiente;
  });
}

function finTrimestre() {
  const ev = terminarTrimestre();
  colaEventos(ev, () => { if (S.perdio) renderFin(false); else renderJuego(); });
}

// ---------- Fin ----------
function renderFin(completo) {
  renderEstado();
  let html;
  if (completo) {
    const p = puntajeFinal();
    const juicio = p > 160 ? "Pasás a la historia como un gran presidente. Te piden que vuelvas." : p > 110 ? "Un gobierno aceptable. Terminás el mandato con la frente alta." : p > 70 ? "Terminaste el mandato, que en la Argentina ya es mucho." : "Terminaste, pero dejás un país en ruinas.";
    const I = S.ind, H = S.hist[0];
    html = `<h1>Fin del mandato</h1><p>${juicio}</p><h2>Puntaje: ${p}</h2>
      <table class="tally"><tr><th>Indicador</th><th>Al asumir</th><th>Al irte</th></tr>
      ${[["Inflación mensual", "inflacion", "%"], ["Pobreza", "pobreza", "%"], ["Desempleo", "desempleo", "%"], ["Crecimiento", "crecimiento", "%"], ["Reservas (US$ M)", "reservas", ""], ["Imagen", "imagen", "%"], ["Tensión social", "tension", ""]].map(([n, k, u]) => `<tr><td>${n}</td><td>${fmt(H[k], k === "reservas" ? 0 : 1)}${u}</td><td>${fmt(I[k], k === "reservas" ? 0 : 1)}${u}</td></tr>`).join("")}</table>`;
  } else {
    html = `<h1>Fin de la partida</h1><p>${esc(S.motivoDerrota || "Tu carrera política terminó.")}</p>`;
    if (S.resultadoGeneral) html += `<h3>Elección general</h3>${barras(S.resultadoGeneral.nac)}`;
  }
  app.innerHTML = `<div class="portada card stack" style="text-align:left">${html}<div class="row" style="justify-content:center;margin-top:16px"><button id="bOtra">Jugar otra vez</button></div></div>`;
  borrarPartidaEnCurso();
  $("#bOtra").onclick = () => { UI.cfg = null; renderCrear(); };
}

// ---------- Botones globales ----------
$("#btnGuardar").onclick = () => panelPartidas();
$("#btnMenu").onclick = () => {
  modal(`<h2>Menú</h2><div class="opciones">
    <button class="opcion" id="mAyuda"><b>Cómo se juega</b></button>
    <button class="opcion" id="mPortada"><b>Volver a la portada</b><span class="small muted">Lo no guardado se pierde.</span></button>
  </div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="sec" id="mCancel">Cerrar</button></div>`);
  $("#mCancel").onclick = cerrarModal;
  $("#mPortada").onclick = () => { cerrarModal(); renderPortada(); };
  $("#mAyuda").onclick = ayuda;
};
function ayuda() {
  modal(`<h2>Cómo se juega</h2>
    <p><b>Campaña.</b> La campaña dura seis meses y cada mes tenés 6 acciones. Elegí una provincia en el mapa para recorridas y actos; los spots, redes y entrevistas son nacionales. La provincia de Buenos Aires tiene el 38% del padrón y la Ciudad de Buenos Aires, el 7%.</p>
    <p><b>Interna.</b> Si fundás partido, juntá avales antes de fin del segundo mes. Si te sumás a uno, ganá la interna: PASO (fin del mes 2), cerrada (comités) o el dedo del líder (lealtad).</p>
    <p><b>Precampaña.</b> Podés largar tres o seis meses antes de las PASO o de la interna. Rinde menos que la campaña y repetir el mismo lugar rinde cada vez menos, pero los rivales todavía no largaron y llegás a la interna más conocido y con más militancia. Arrancar muy temprano desgasta.</p>
    <p><b>Trayectoria.</b> Todo lo que hacés queda en tu legajo: internas, elecciones ganadas y perdidas, cargos, leyes, obras, escándalos y cambios de partido. Al terminar una partida podés seguir la carrera con el mismo personaje en otro cargo: cuanto más conocido y mejor tu trayectoria, más te votan. Los escándalos también te hacen conocido, pero te restan votos, sobre todo en la clase media.</p>
    <p><b>Plata y riesgo.</b> Los aportes dan fondos pero suman riesgo de escándalo. Los pactos con sectores te comprometen después.</p>
    <p><b>Elección.</b> Ganás en primera vuelta con 45%, o con 40% y 10 puntos de ventaja. Si no, balotaje.</p>
    <p><b>Gobernador e intendente.</b> La campaña es por departamentos o barrios y gana el más votado, sin balotaje. Al gobernar no controlás la moneda: dependés de la coparticipación, de la Nación (ATN, fuerzas federales) y de tu Legislatura o Concejo. Si la caja queda en rojo unos nueve meses, te intervienen.</p>
    <p><b>Diputado y jefe de bloque.</b> Encabezás la lista de la provincia de Buenos Aires (35 bancas por D'Hondt, umbral 3%). En la Cámara fijás la línea de tu bloque en cada votación, cuidás la disciplina, negociás con la Casa Rosada y los gobernadores y empujás proyectos propios, que necesitan dictamen de comisión o dos tercios en sesión especial.</p>
    <p><b>Despacho.</b> Cada mes llegan expedientes con dilemas reales: paros, tarifas, deuda, provincias quebradas, vacantes en la Corte. Elegí con cuidado: hay consecuencias que llegan meses después, y los factores de poder (CGT, campo, mercados, Iglesia, fuerzas, prensa, Corte, el Fondo) reaccionan si los maltratás.</p>
    <p><b>Gobierno.</b> Cada turno es un mes (48 en total). Ajustá el presupuesto, tomá una medida por mes por resolución, decreto, DNU o ley, negociá con bloques y gobernadores. Si la tensión social supera 85 dos trimestres seguidos, caés. Si la legitimidad se derrumba, puede haber juicio político.</p>
    <div class="row" style="justify-content:flex-end"><button id="mOk">Entendido</button></div>`);
  $("#mOk").onclick = cerrarModal;
}

renderPortada();
