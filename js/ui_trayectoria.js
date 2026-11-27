// =============================================================
//  VALDORA - Interfaz de la trayectoria y la precampaña
//  Botón "Trayectoria" (currículum, reconocimiento, efecto por
//  grupo, dónde te conocen, encuesta de conocimiento y currículum
//  de los rivales), elegir una carrera guardada al crear el
//  personaje y "Seguir la carrera" al terminar una partida.
// =============================================================

function signoTray(v, d = 2) { return (v > 0 ? "+" : "") + fmt(v, d); }
function claseTray(v) { return v > 0.005 ? "up-good" : v < -0.005 ? "up-bad" : "muted"; }
function textoEfectoGrupo(v) { return v > 0.25 ? "muy a favor" : v > 0.08 ? "a favor" : v > 0.02 ? "algo a favor" : v < -0.25 ? "muy en contra" : v < -0.08 ? "en contra" : v < -0.02 ? "algo en contra" : "neutral"; }
function barraTray(v, max = 100, color = "var(--accent)") {
  return `<div class="barra" style="grid-template-columns:1fr 48px"><div class="track"><div class="fill" style="width:${Math.max(0, Math.min(100, 100 * v / max))}%;background:${color}"></div></div><span class="v">${Math.round(v)}</span></div>`;
}
function listaHitos(hitos) {
  if (!hitos.length) return `<p class="small muted">Todavía no hay hitos. Ganar internas y elecciones, gobernar, sacar leyes y hacer obras suma; los escándalos y los fracasos también quedan.</p>`;
  const porPartida = {};
  hitos.forEach(h => (porPartida[h.partida || 1] = porPartida[h.partida || 1] || []).push(h));
  return Object.keys(porPartida).sort((a, b) => b - a).map(p => `<h3 style="margin-top:10px">Partida ${p}</h3><div class="stack" style="gap:4px">${porPartida[p].slice().reverse().map(h =>
    `<div class="small" style="display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:start"><span>${ICONO_TRAY[h.tipo] || "•"}</span><span>${esc(h.txt)} <span class="muted">· ${esc((h.cuando || "").replace(/^Partida \d+ · /, ""))}</span></span><span class="${claseTray(h.valor)}" title="Prestigio">${h.valor > 0 ? "▲" : h.valor < 0 ? "▼" : "•"}</span></div>`).join("")}</div>`).join("");
}
function tablaGrupos(grupos) {
  return `<table class="tally"><tr><th>Grupo social</th><th>Cómo pesa tu trayectoria</th><th>Efecto en el voto</th></tr>${GRUPOS.map(g => `<tr><td>${esc(g.nombre)} <span class="muted small">· ${esc(g.prioridades)}</span></td><td class="${claseTray(grupos[g.id] || 0)}">${textoEfectoGrupo(grupos[g.id] || 0)}</td><td class="${claseTray(grupos[g.id] || 0)}">${signoTray(grupos[g.id] || 0)}</td></tr>`).join("")}</table>`;
}
function dondeTeConocen(P) {
  const filas = [];
  if (P.not.nac > 0.2) filas.push(["Todo el país", P.not.nac]);
  for (const [id, v] of Object.entries(P.not.prov)) if (v > 0.2) filas.push([nombreProvId(id), v]);
  for (const [id, v] of Object.entries(P.not.ciudad)) if (v > 0.2) filas.push([(CIUDADES_JUGABLES[id] || {}).nombre || id, v]);
  if (!filas.length) return `<p class="small muted">Nadie te conoce todavía por tu trayectoria.</p>`;
  filas.sort((a, b) => b[1] - a[1]);
  return filas.slice(0, 6).map(([n, v]) => `<div class="barra"><span>${esc(n)}</span><div class="track"><div class="fill" style="width:${Math.round(100 * satur(v, 10))}%;background:var(--gold)"></div></div><span class="v">${Math.round(100 * satur(v, 10))}</span></div>`).join("");
}
function htmlEncuestaConocimiento() {
  const filas = encuestaConocimiento().sort((a, b) => b.conoce - a.conoce);
  return `<table class="tally"><tr><th>Candidato</th><th>Lo conoce</th><th>Imagen positiva</th><th>Regular</th><th>Negativa</th></tr>${filas.map(f => `<tr><td>${f.esJugador ? "<b>" : ""}${esc(f.nombre)}${f.esJugador ? "</b>" : ""} <span class="muted small">${esc(PARTIDOS[f.partido] ? PARTIDOS[f.partido].corto : "")}</span></td><td>${Math.round(f.conoce)}%</td><td class="up-good">${Math.round(f.positiva)}%</td><td>${Math.round(f.regular)}%</td><td class="up-bad">${Math.round(f.negativa)}%</td></tr>`).join("")}</table>
    <p class="small muted">Quien no lo conoce no lo vota. ${esc(ENCUESTADORAS[S.encuestadora || 0].nombre)}, margen ±${ENCUESTADORAS[S.encuestadora || 0].error}.</p>`;
}
function htmlRivalesCV() {
  const rivales = S.candidatos.filter(c => !c.esJugador && c.activo && c.tray);
  if (!rivales.length) return "";
  return rivales.map(c => `<div class="expediente"><h3 style="border-left:5px solid ${PARTIDOS[c.partido].color};padding-left:8px">${esc(c.nombre)} <span class="small muted">· ${esc(PARTIDOS[c.partido].nombre)}${c.internoRival ? " · tu rival interno" : ""}</span></h3>
    <p class="small muted">Reconocimiento por trayectoria ${c.tray.reconocimiento}/100 · prestigio ${c.tray.prestigio > 0 ? "+" : ""}${c.tray.prestigio}</p>
    ${c.tray.hitos.map(h => `<div class="small">${ICONO_TRAY[h.tipo] || "•"} ${esc(h.txt)} <span class="${claseTray(h.valor)}">${h.valor > 0 ? "▲" : h.valor < 0 ? "▼" : ""}</span></div>`).join("")}</div>`).join("");
}

function panelTrayectoria(tab) {
  if (!S) return;
  const T = asegurarTray(), P = perfilActual(), yo = S.jugador;
  UI.tabTray = tab || UI.tabTray || "cv";
  const enCampana = S.fase === "campana";
  const tabs = [["cv", "Currículum"], ["grupos", "Peso en cada grupo"], ...(enCampana ? [["encuesta", "Conocimiento e imagen"], ["rivales", "Los rivales"]] : [])];
  if (!tabs.some(t => t[0] === UI.tabTray)) UI.tabTray = "cv";
  let cuerpo = "";
  if (UI.tabTray === "cv") {
    cuerpo = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
        <div><b>Reconocimiento</b>${barraTray(P.reconocimiento, 100, "var(--gold)")}<p class="small muted">Cuánta gente te conoce por lo que hiciste. Suma lo bueno y lo malo.</p></div>
        <div><b>Prestigio</b>${barraTray(Math.abs(P.prestigio), 100, P.prestigio >= 0 ? "var(--good)" : "var(--bad)")}<p class="small muted">${P.prestigio >= 0 ? "Saldo positivo" : "Saldo negativo"}: logros menos escándalos y fracasos.</p></div>
        <div><b>Carrera</b><p class="small">Partida ${T.partida}. Cargos: ${P.cargos} (${P.completos} con mandato completo). Hitos: ${P.n}.</p>${T.base && T.base.reconocimiento ? `<p class="small muted">Al largar esta partida tu trayectoria te daba ${T.base.reconocimiento}/100 de reconocimiento${T.base.bonoMedio ? ` y ${Math.round(T.base.bonoMedio * 100)} puntos más de conocimiento en el mapa` : ""}.</p>` : ""}</div>
      </div>
      <h3>Dónde te conocen</h3>${dondeTeConocen(P)}
      <h3>Hitos</h3>${listaHitos(T.hitos)}`;
  } else if (UI.tabTray === "grupos") {
    cuerpo = `<p class="small muted">Cada grupo valora distinto tu historia: los jubilados y los empresarios premian la experiencia de gestión, los informales y los trabajadores las obras, la clase media castiga fuerte los escándalos y los cambios de partido, y los jóvenes prefieren caras nuevas. Este efecto se suma a la intención de voto de cada grupo en todas las elecciones de tu carrera.</p>${tablaGrupos(P.grupos)}`;
  } else if (UI.tabTray === "encuesta") {
    cuerpo = htmlEncuestaConocimiento();
  } else if (UI.tabTray === "rivales") {
    cuerpo = `<p class="small muted">Los rivales también cargan con su historia: su experiencia y sus causas pesan en los votos de cada grupo.</p>${htmlRivalesCV()}`;
  }
  modal(`<h2>Trayectoria de ${esc(yo.nombre)}</h2>
    <div class="row" style="gap:6px;flex-wrap:wrap">${tabs.map(([id, n]) => `<button class="${UI.tabTray === id ? "" : "sec"}" data-ttab="${id}">${n}</button>`).join("")}</div>
    <div class="stack" style="margin-top:10px;max-height:62vh;overflow:auto">${cuerpo}</div>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="sec" id="mCerrarTray">Cerrar</button></div>`);
  document.querySelectorAll("[data-ttab]").forEach(b => b.onclick = () => panelTrayectoria(b.dataset.ttab));
  $("#mCerrarTray").onclick = cerrarModal;
}
$("#btnTray").onclick = () => panelTrayectoria();

// la barra superior: botón visible en partida y aviso de precampaña
const _renderEstadoTray = renderEstado;
renderEstado = function () {
  _renderEstadoTray();
  const b = $("#btnTray"); if (b) b.classList.toggle("oculto", !S);
  if (S && typeof enPrecampana === "function" && enPrecampana()) {
    const el = $("#estado");
    if (el) el.insertAdjacentHTML("afterbegin", `<span class="pill" title="Rinde menos que la campaña; repetir rinde cada vez menos; arrancar muy temprano desgasta">Precampaña <b>${mesesPrecampanaRestantes()}</b> ${mesesPrecampanaRestantes() === 1 ? "mes" : "meses"}</span>`);
  }
};

// en la campaña: conocimiento e imagen debajo de la encuesta
const _renderCampanaTray = renderCampana;
renderCampana = function () {
  _renderCampanaTray();
  const sel = $("#selEnc"); if (!sel) return;
  const card = sel.closest(".card"); if (!card) return;
  const yo = encuestaConocimiento().find(f => f.esJugador);
  const P = perfilActual(), pre = S.precampana;
  card.insertAdjacentHTML("afterend", `<div class="card stack">
    <div class="row" style="justify-content:space-between"><h2>Conocimiento y trayectoria</h2><button class="sec" id="bVerTray">Ver detalle</button></div>
    <p class="small">Te conoce el <b>${Math.round(yo.conoce)}%</b>: imagen positiva ${Math.round(yo.positiva)}%, negativa ${Math.round(yo.negativa)}%. Trayectoria: reconocimiento ${P.reconocimiento}/100, prestigio ${P.prestigio > 0 ? "+" : ""}${P.prestigio}.</p>
    ${enPrecampana() ? `<p class="small muted">Precampaña: te quedan ${mesesPrecampanaRestantes()} ${mesesPrecampanaRestantes() === 1 ? "mes" : "meses"} antes de que largue la campaña. Rinde el 75% y menos si repetís el mismo lugar o el mismo grupo. Desgaste acumulado: ${fmt(pre.desgaste, 1)} puntos de imagen.</p>` : pre && pre.fatiga > 0 ? `<p class="small muted">Fatiga por la precampaña: las acciones rinden ${Math.round(pre.fatiga)}% menos.</p>` : ""}
  </div>`);
  $("#bVerTray").onclick = () => panelTrayectoria(UI.tabTray === "cv" || !UI.tabTray ? "encuesta" : UI.tabTray);
};

// ---------- Crear personaje: personaje nuevo o seguir una carrera ----------
function htmlCarreras(c) {
  const legs = leerCarreras().slice().sort((a, b) => (b.actualizado || "").localeCompare(a.actualizado || ""));
  if (!legs.length) return "";
  return `<div class="card stack">
    <h2>Tu carrera</h2>
    <p class="small muted">Seguí con un personaje que ya tiene trayectoria: arranca más conocido donde gobernó o hizo campaña, y su historia pesa en cada grupo social. Cada mandato completo da un punto de atributo extra.</p>
    <div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      <div class="opcion ${!c.legajoId ? "sel" : ""}" data-leg=""><b>Personaje nuevo</b><span class="small muted">Sin trayectoria: nadie te conoce.</span></div>
      ${legs.map(l => { const P = perfilDe(l.hitos, (l.partidas || 0) + 1); return `<div class="opcion ${c.legajoId === l.id ? "sel" : ""}" data-leg="${esc(l.id)}"><b>${esc(l.nombre)}</b><span class="small muted" style="display:block">${l.partidas || 1} ${l.partidas === 1 ? "partida" : "partidas"} · último: ${esc(l.ultimoCargo || "")} · ${esc(l.ultimoPartido ? l.ultimoPartido.nombre : "")}</span><span class="small" style="display:block;margin-top:4px">Reconocimiento ${P.reconocimiento}/100 · prestigio ${P.prestigio > 0 ? "+" : ""}${P.prestigio}</span><span class="small" style="display:block;margin-top:4px"><a href="#" data-borrarleg="${esc(l.id)}">Borrar carrera</a></span></div>`; }).join("")}
    </div></div>`;
}
function bindCarreras(c, rerender) {
  document.querySelectorAll("[data-leg]").forEach(el => el.onclick = e => {
    if (e.target && e.target.dataset && e.target.dataset.borrarleg) return;
    const id = el.dataset.leg;
    if (!id) { c.legajoId = null; return rerender(); }
    aplicarLegajoACfg(c, legajoPorId(id));
    rerender();
  });
  document.querySelectorAll("[data-borrarleg]").forEach(a => a.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    const id = a.dataset.borrarleg, l = legajoPorId(id);
    modal(`<h2>Borrar la carrera</h2><p>Se borra la trayectoria de <b>${esc(l ? l.nombre : "")}</b> de este navegador. No se puede deshacer.</p><div class="row" style="justify-content:flex-end"><button class="sec" id="mNo">Cancelar</button><button id="mSi">Borrar</button></div>`, "aviso");
    $("#mNo").onclick = cerrarModal;
    $("#mSi").onclick = () => { borrarLegajo(id); if (c.legajoId === id) c.legajoId = null; cerrarModal(); rerender(); };
  });
}
function aplicarLegajoACfg(c, l) {
  if (!l) return;
  c.legajoId = l.id; c.nombre = l.nombre; c.ideo = l.ideo;
  Object.assign(c, l.attrs || {});
  const u = l.ultimoPartido;
  if (u && PARTIDOS[u.id] && u.id !== "NUEVO") { c.camino = "sumarse"; c.partido = u.id; }
  else if (u && u.fundado) { c.camino = "fundar"; c.nombrePartido = u.nombre; }
}

// ---------- Fin de la partida: trayectoria de esta partida y seguir la carrera ----------
const _renderFinTray = renderFin;
renderFin = function (completo) {
  _renderFinTray(completo);
  if (!S || !S.tray) return;
  if (!S.tray.cerrada) cerrarTrayectoria();
  const T = S.tray, P = perfilActual();
  const deEsta = T.hitos.filter(h => h.partida === T.partida);
  const bOtra = $("#bOtra"); if (!bOtra) return;
  const fila = bOtra.parentElement;
  fila.insertAdjacentHTML("beforebegin", `<div class="stack" style="margin-top:14px"><h2>Tu trayectoria</h2>
    <p class="small" style="margin:0;max-width:none">Reconocimiento <b>${P.reconocimiento}/100</b> · prestigio <b>${P.prestigio > 0 ? "+" : ""}${P.prestigio}</b>. Todo queda en tu legajo y pesa en tu próxima elección.</p>
    ${listaHitos(deEsta)}</div>`);
  bOtra.insertAdjacentHTML("beforebegin", `<button id="bSeguir">Seguir la carrera de ${esc(S.jugador.nombre)}</button>`);
  bOtra.classList.add("sec");
  bOtra.textContent = "Personaje nuevo";
  const legId = T.legajoId;
  $("#bSeguir").onclick = () => {
    const prev = UI.cfg || {};
    UI.cfg = { nombre: "", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, objetivo: prev.objetivo || "presidente", provincia: prev.provincia, ciudad: prev.ciudad, camino: "sumarse", partido: "MNJ", nombrePartido: "", tipoInterna: null, era: prev.era || "hoy", precampana: prev.precampana != null ? prev.precampana : 6, legajoId: null };
    aplicarLegajoACfg(UI.cfg, legajoPorId(legId));
    renderCrear();
  };
  $("#bOtra").onclick = () => { UI.cfg = null; renderCrear(); };
};

renderEstado();
