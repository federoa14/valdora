// =============================================================
//  VALDORA - Interfaz del debate televisado
// =============================================================

(function estilosDebate() {
  const css = `
  .modal-caja.debate { max-width: 780px; border-top: 6px solid var(--gold); }
  .deb-cab { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
  .deb-vivo { background: var(--bad); color: #fff; font-size: .7rem; font-weight: 700; letter-spacing: .08em; padding: 2px 8px; border-radius: 4px; }
  .deb-canal { color: var(--muted); font-size: .8rem; }
  .deb-tema { display: inline-block; background: var(--chip); color: var(--gold); font-size: .72rem; letter-spacing: .06em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; }
  .deb-preg { font-family: var(--serif); font-size: 1.15rem; margin: 8px 0 12px; line-height: 1.35; }
  .deb-preg small { display: block; color: var(--muted); font-family: system-ui, sans-serif; font-size: .78rem; margin-bottom: 4px; }
  .deb-op small { display: block; margin-top: 4px; color: var(--muted); font-size: .76rem; }
  .deb-op .riesgo { color: var(--warn); }
  .deb-medidor { display: grid; gap: 3px; margin: 10px 0; padding: 8px 10px; background: var(--bg2); border-radius: 10px; }
  .deb-medidor .fila { display: grid; grid-template-columns: minmax(90px, 160px) 1fr 42px; gap: 8px; align-items: center; font-size: .8rem; }
  .deb-medidor .pista { height: 8px; background: var(--chip); border-radius: 4px; overflow: hidden; }
  .deb-medidor .pista i { display: block; height: 100%; border-radius: 4px; transition: width .5s; }
  .deb-res { padding: 10px 12px; border-radius: 10px; background: var(--bg2); margin: 8px 0; border-left: 4px solid var(--accent); }
  .deb-res.brillante, .deb-res.bien { border-left-color: var(--good); } .deb-res.furcio { border-left-color: var(--bad); } .deb-res.flojo { border-left-color: var(--warn); }
  .deb-res .et { font-weight: 700; text-transform: uppercase; font-size: .75rem; letter-spacing: .06em; }
  .deb-riv { display: grid; gap: 4px; margin: 8px 0; font-size: .86rem; }
  .deb-riv div { padding: 4px 8px; border-radius: 6px; background: var(--panel2); }
  .deb-riv .mal { box-shadow: inset 3px 0 0 var(--bad); } .deb-riv .bien { box-shadow: inset 3px 0 0 var(--good); }
  .deb-grupos { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .deb-grupos span { font-size: .74rem; padding: 2px 7px; border-radius: 999px; background: var(--chip); }
  .deb-grupos .up { color: var(--good); } .deb-grupos .down { color: var(--bad); }
  .deb-banner { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 12px; padding: 10px 14px; border-radius: 10px; background: rgba(201,165,76,.12); border: 1px solid var(--gold); }
  @media (max-width: 560px) { .deb-medidor .fila { grid-template-columns: 90px 1fr 36px; } .deb-preg { font-size: 1.02rem; } }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
})();

const DEB_RES = { brillante: "¡Brillante!", bien: "Bien", flojo: "Floja", furcio: "¡Furcio!" };

function debMedidor() {
  const D = S.debate;
  const vals = D.part.map(id => D.pts[id]);
  const min = Math.min(0, ...vals), max = Math.max(1, ...vals);
  const orden = D.part.slice().sort((a, b) => D.pts[b] - D.pts[a]);
  return `<div class="deb-medidor"><div class="small muted">Medidor del público en el estudio</div>${orden.map(id => {
    const c = debateCand(id), w = 6 + 94 * (D.pts[id] - min) / ((max - min) || 1);
    return `<div class="fila"><span>${c.esJugador ? "<b>" : ""}${esc(c.nombre)}${c.esJugador ? "</b>" : ""} <span class="muted">${esc(PARTIDOS[c.partido].corto)}</span></span><div class="pista"><i style="width:${w}%;background:${PARTIDOS[c.partido].color}"></i></div><span class="small">${fmt(D.pts[id], 1)}</span></div>`;
  }).join("")}</div>`;
}
function debGrupos(ef) {
  const arr = Object.entries(ef || {}).filter(([, v]) => Math.abs(v) >= 0.015).sort((a, b) => b[1] - a[1]);
  if (!arr.length) return "";
  return `<div class="deb-grupos">${arr.map(([g, v]) => { const n = (GRUPOS.find(x => x.id === g) || { nombre: g }).nombre; return `<span class="${v > 0 ? "up" : "down"}">${v > 0 ? "▲" : "▼"} ${esc(n)}</span>`; }).join("")}</div>`;
}
function debCabecera() {
  const D = S.debate;
  const n = Math.min(D.ronda + 1, D.preguntas.length);
  return `<div class="deb-cab"><div><span class="deb-vivo">EN VIVO</span> <span class="deb-canal">${esc(D.canal)} · modera ${esc(D.moderador)}</span></div><span class="small muted">Ronda ${n} de ${D.preguntas.length}</span></div>`;
}
function debPista(r) {
  const yo = S.jugador;
  const leHabla = Object.entries(r.g || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => GRUPOS.find(x => x.id === g).nombre);
  const riesgo = r.d >= 2 ? `<span class="riesgo">arriesgada</span>` : r.d === 0 ? "segura" : "normal";
  const lejos = r.i >= 0 && Math.abs(r.i - yo.ideo) > 40 ? ` · <span class="riesgo">poco coherente con tu ideología</span>` : "";
  return `${DEBATE_ATR[r.a]} (${yo[r.a]}) · ${riesgo}${leHabla.length ? " · le habla a: " + leHabla.join(", ") : ""}${lejos}`;
}

// ---------- Pantallas ----------
function abrirDebate(alFinal) {
  const D = S.debate;
  if (!D || D.estado !== "pendiente") { alFinal && alFinal(); return; }
  const cands = D.part.map(debateCand);
  modal(`${debCabecera()}<h2>${D.tipo === "balotaje" ? "Debate del balotaje" : D.tipo === "interna" ? "Debate de la interna" : "Debate televisado"}</h2>
    <p>Las luces del estudio se encienden. ${cands.length} atriles: ${cands.map(c => `<b>${esc(c.nombre)}</b> (${esc(PARTIDOS[c.partido].corto)})`).join(", ")}.</p>
    <p class="small muted">El moderador va a hacer ${D.preguntas.length - 1} preguntas sorteadas y al final tenés un minuto para hablarle a cámara. Cada respuesta pone a prueba un atributo y le habla a distintos grupos sociales. Los rivales también juegan: pueden lucirse, equivocarse o atacarte. Si te atacan, tenés derecho a réplica.</p>
    <div class="row" style="justify-content:space-between;margin-top:10px"><button class="sec" id="dFaltar" title="Silla vacía: los rivales te van a destrozar">Faltar al debate</button><button id="dEntrar">Entrar al estudio ▸</button></div>`, "debate");
  $("#dEntrar").onclick = () => pantallaPregunta(alFinal);
  $("#dFaltar").onclick = () => { faltarDebate(); pantallaFinDebate(alFinal); };
}

function pantallaPregunta(alFinal) {
  const p = debatePreguntaActual();
  if (!p) return pantallaFinDebate(alFinal);
  const D = S.debate;
  modal(`${debCabecera()}<span class="deb-tema">${esc(DEBATE_TEMAS[p.tema] || p.tema)}</span>
    <div class="deb-preg"><small>${esc(D.moderador)} pregunta:</small>${esc(p.q)}</div>
    <div class="opciones">${p.r.map((r, i) => `<button class="opcion deb-op" data-dr="${i}"><b>${esc(r.t)}</b><small>${debPista(r)}</small></button>`).join("")}</div>
    ${debMedidor()}`, "debate");
  document.querySelectorAll("[data-dr]").forEach(b => b.onclick = () => { responderDebate(+b.dataset.dr); pantallaRonda(alFinal); });
}

function pantallaRonda(alFinal) {
  const D = S.debate, u = D.ultimo, y = u.yo;
  const riv = u.rivales.map(r => `<div class="${r.bueno ? "bien" : "mal"}"><b>${esc(r.nombre)}</b> <span class="muted small">${esc(PARTIDOS[r.partido].corto)}</span> ${esc(r.texto)}${/[.!?]$/.test(r.texto) ? "" : "."}</div>`).join("");
  const hayReplica = D.fase === "replica";
  modal(`${debCabecera()}<span class="deb-tema">${esc(DEBATE_TEMAS[u.tema] || u.tema)}</span>
    <div class="deb-res ${y.res}"><div class="et">${DEB_RES[y.res]}</div><p style="margin:4px 0"><i>"${esc(y.respuesta)}"</i></p><p style="margin:4px 0">${esc(y.texto)}</p>${y.notas.map(n => `<p class="small" style="margin:4px 0">${esc(n)}</p>`).join("")}${debGrupos(y.efecto)}</div>
    <h3>Los demás candidatos</h3><div class="deb-riv">${riv}</div>
    ${hayReplica ? `<div class="deb-res furcio"><div class="et">Derecho a réplica</div><p style="margin:4px 0">${esc(u.replica.nombre)} te atacó: <i>${esc(u.replica.frase)}</i> ¿Cómo respondés?</p>
      <div class="opciones">${DEBATE_REPLICA.map((o, i) => `<button class="opcion deb-op" data-rp="${i}"><b>${esc(o.t)}</b><small>${DEBATE_ATR[o.a]} (${S.jugador[o.a]}) · ${o.d >= 2 ? `<span class="riesgo">arriesgada</span>` : o.d === 0 ? "segura" : "normal"}</small></button>`).join("")}</div></div>` : ""}
    ${debMedidor()}
    ${hayReplica ? "" : `<div class="row" style="justify-content:flex-end"><button id="dSig">${D.fase === "fin" ? "Ver el resultado ▸" : "Siguiente pregunta ▸"}</button></div>`}`, "debate");
  if (hayReplica) document.querySelectorAll("[data-rp]").forEach(b => b.onclick = () => { replicarDebate(+b.dataset.rp); pantallaReplica(alFinal); });
  else $("#dSig").onclick = () => D.fase === "fin" ? pantallaFinDebate(alFinal) : pantallaPregunta(alFinal);
}

function pantallaReplica(alFinal) {
  const D = S.debate, r = D.ultimo.replicaRes;
  modal(`${debCabecera()}<div class="deb-res ${r.res}"><div class="et">Réplica: ${DEB_RES[r.res]}</div><p style="margin:4px 0">${esc(r.texto)}</p></div>${debMedidor()}
    <div class="row" style="justify-content:flex-end"><button id="dSig">${D.fase === "fin" ? "Ver el resultado ▸" : "Siguiente pregunta ▸"}</button></div>`, "debate");
  $("#dSig").onclick = () => D.fase === "fin" ? pantallaFinDebate(alFinal) : pantallaPregunta(alFinal);
}

function pantallaFinDebate(alFinal) {
  if (debatePendiente()) cerrarDebate();
  const D = S.debate, R0 = D.resultado;
  const filas = R0.orden.map((id, k) => { const c = debateCand(id); return `<div class="barra"><span>${k + 1}. ${c.esJugador ? "<b>" : ""}${esc(c.nombre)}${c.esJugador ? "</b>" : ""} <span class="muted small">${esc(PARTIDOS[c.partido].corto)}</span></span><div class="track"><div class="fill" style="width:${R0.flash[id]}%;background:${PARTIDOS[c.partido].color}"></div></div><span class="v">${fmt(R0.flash[id], 0)}%</span></div>`; }).join("");
  const tipo = R0.miPos === 1 ? "bueno" : R0.miPos === R0.orden.length ? "malo" : "info";
  modal(`<h2>${R0.miPos === 1 ? "¡Ganaste el debate!" : `Terminó el debate: quedaste ${R0.miPos}º`}</h2>
    <h3>Encuesta flash: ¿quién ganó?</h3>${filas}
    <h3 style="margin-top:12px">Lo que dice la prensa</h3>${R0.titulares.map(t => `<div class="titular">${esc(t.txt)}<small>${esc(t.medio)}</small></div>`).join("")}
    <h3 style="margin-top:12px">Tu repercusión</h3>
    <p class="small">Imagen ${R0.imagenYo >= 0 ? "+" : ""}${fmt(R0.imagenYo, 1)}. Más gente te conoce en ${debateTerritorio() === "el país" ? "todo el país" : esc(debateTerritorio())}. Así te ven los grupos sociales después del debate:</p>${debGrupos(R0.efectoYo)}
    <h3 style="margin-top:12px">Momentos de la noche</h3><div class="log">${D.momentos.slice(-8).map(m => `<div class="${m.tipo}"><span class="t">R${m.ronda}</span>${esc(m.txt)}</div>`).join("")}</div>
    <div class="row" style="justify-content:flex-end;margin-top:10px"><button id="dVolver">${D.tipo === "general" ? "Último mes de campaña ▸" : "Volver a la campaña ▸"}</button></div>`, tipo);
  $("#dVolver").onclick = () => { cerrarModal(); if (typeof autoguardar === "function") autoguardar(); alFinal && alFinal(); };
}

// ---------- Enganches ----------
// la cola de eventos del fin de mes abre el estudio cuando llega el aviso del debate
const _colaEventosDebate = colaEventos;
colaEventos = function (eventos, alFinal) {
  const lista = (eventos || []).filter(Boolean);
  const k = lista.findIndex(e => e.debate);
  if (k < 0) return _colaEventosDebate(lista, alFinal);
  const antes = lista.slice(0, k + 1).map(e => e.debate ? { ...e, debate: false } : e), despues = lista.slice(k + 1);
  _colaEventosDebate(antes, () => abrirDebate(() => colaEventos(despues, alFinal)));
};

// si la partida se recargó con el debate pendiente, aparece un aviso en la campaña
const _renderCampanaDebate = renderCampana;
renderCampana = function () {
  _renderCampanaDebate.apply(this, arguments);
  if (!debatePendiente()) return;
  const div = document.createElement("div");
  div.className = "deb-banner";
  div.innerHTML = `<span><b>Debate televisado pendiente.</b> Si terminás el mes sin entrar, tu equipo responde por vos en piloto automático.</span><button id="dIr">Entrar al estudio ▸</button>`;
  app.prepend(div);
  $("#dIr").onclick = () => abrirDebate(renderJuego);
};
