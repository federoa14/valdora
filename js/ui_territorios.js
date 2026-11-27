// =============================================================
//  VALDORA - Interfaz: elegir provincia o municipio, ficha del
//  territorio y votaciones de Legislaturas bicamerales
// =============================================================

const COLOR_DIF = { "Accesible": "#3fbf7f", "Moderada": "#c9b84c", "Difícil": "#e3893b", "Muy difícil": "#ef6457" };
const TXT_REN = { total: "se renueva completa cada 4 años, junto con el Ejecutivo", mitades: "se renueva por mitades cada 2 años", tercios: "se renueva por tercios cada 2 años" };
const NIVEL = ["Bajo", "Medio", "Alto", "Muy alto"];

function barraDif(v, etiqueta) {
  const col = v < 38 ? COLOR_DIF["Accesible"] : v < 50 ? COLOR_DIF["Moderada"] : v < 62 ? COLOR_DIF["Difícil"] : COLOR_DIF["Muy difícil"];
  return `<div class="terr-barra"><span>${etiqueta}</span><div><i style="width:${v}%;background:${col}"></i></div><b>${v}</b></div>`;
}
function insigniaDif(d) { return `<span class="terr-dif" style="background:${COLOR_DIF[d.etiqueta]}">${d.etiqueta}</span>`; }
function nombrePartidoCorto(k) { return PARTIDOS[k] ? PARTIDOS[k].corto : k; }

function textoMayorias(T) {
  const L = T.L, n = L.dip, bi = L.tipo === "bi";
  const simple = Math.floor(n / 2) + 1, dos = Math.ceil(n * 2 / 3);
  const filas = [
    ["Quórum", `${simple} de ${n}${bi ? ` en Diputados y ${Math.floor(L.sen / 2) + 1} de ${L.sen} en el Senado` : ""}`],
    ["Ley común", "mayoría de los presentes (con quórum)"],
    ["Insistir una ley vetada", `dos tercios de los presentes${bi ? " en las dos cámaras" : ""}`],
    [T.kind === "prov" ? "Juicio político" : "Destitución del intendente", bi ? `dos tercios de Diputados para acusar (${dos} de ${n}) y dos tercios del Senado para destituir (${Math.ceil(L.sen * 2 / 3)} de ${L.sen})` : `dos tercios del cuerpo (${dos} de ${n})`],
  ];
  return `<table class="tally terr-tabla">${filas.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</table>`;
}

function fichaTerritorio(T, cfg, enJuego) {
  const P = T.P, L = T.L;
  if (!P) return `<p class="muted">Sin datos para este territorio.</p>`;
  const d = dificultadTerritorio(T, cfg);
  const yo = familiaJugador(cfg);
  const comp = enJuego ? S.leg : composicionBase(T, "dip");
  const compSen = L.tipo === "bi" ? (enJuego ? S.legSen : composicionBase(T, "sen")) : null;
  const esProv = T.kind === "prov";
  const premio = premioVigente(L, cfg.era);
  const cuerpo = esProv ? (L.tipo === "bi" ? "Legislatura bicameral" : "Legislatura unicameral") : "Concejo Deliberante";
  const cifras = [
    ["Población", `${T.pobAbs.toLocaleString("es-AR", { maximumFractionDigits: 2 })} millones`],
    esProv ? ["Coparticipación", `${String(P.copa).replace(".", ",")}% del reparto`] : ["Provincia", T.prov],
    [esProv ? "Plata de la Nación" : "Plata de afuera", `${P.dep}% de los recursos`],
    ["Pobreza", `≈${P.pob}%`],
    ["Desempleo", `≈${String(P.des).replace(".", ",")}%`],
    ["Deuda", NIVEL[P.deuda]],
  ];
  if (esProv) cifras.push(["Regalías", NIVEL[P.reg || 0]]);
  const factores = [["Conflictividad", P.conf], ["Gremios", P.sind], ["Empleo público", P.emp]];
  if (esProv) factores.push(["Poder de los intendentes", P.intend || 0]);
  const ofi = PARTIDOS[P.ofi];
  return `
    <div class="terr-ficha">
      <div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px">
        <div><h3 style="margin:0">${esc(T.nombre)}</h3>
          <span class="small muted">${esProv ? "Provincia" : "Municipio de " + esc(T.prov)} · gobierna hoy: <i class="terr-punto" style="background:${ofi ? ofi.color : "#999"}"></i>${ofi ? esc(ofi.nombre) : "—"}${enJuego ? "" : " (al empezar)"}</span></div>
        ${insigniaDif(d)}
      </div>
      ${barraDif(d.total, "Dificultad total")}
      <div class="terr-sub">${barraDif(d.leg, esProv ? "Legislatura" : "Concejo")}${barraDif(d.caja, "Caja")}${barraDif(d.calle, "Calle")}</div>
      ${d.motivos.length ? `<ul class="terr-motivos">${d.motivos.slice(0, 7).map(([s, t]) => `<li class="${s === "+" ? "up-good" : "up-bad"}"><b>${s === "+" ? "+" : "−"}</b> ${esc(t)}</li>`).join("")}</ul>` : ""}
      <h3 style="margin-top:12px">${cuerpo}</h3>
      <p class="small">${L.tipo === "bi" ? `<b>${L.dip}</b> diputados y <b>${L.sen}</b> senadores` : `<b>${L.dip}</b> bancas`}. ${esProv ? "Diputados" : "El Concejo"} ${TXT_REN[L.ren]}${L.tipo === "bi" && L.renSen && L.renSen !== L.ren ? `; el Senado ${TXT_REN[L.renSen]}` : ""}. ${esc(L.sistema || "")}${L.reeleccion ? ` Reelección del gobernador: ${esc(L.reeleccion)}.` : ""}${L.premioHasta && !premio ? " En esta época ya no rige el premio de mayoría." : ""}</p>
      <div class="terr-hemis">
        <div class="hemiciclo"><div class="small muted">${L.tipo === "bi" ? "Diputados" : esProv ? "Legislatura" : "Concejo"} ${enJuego ? "actual" : (L.tipo !== "bi" && esProv ? "heredada" : "heredado") + " (aprox.)"}</div>${hemiciclo(comp, L.dip)}</div>
        ${compSen ? `<div class="hemiciclo"><div class="small muted">Senado ${enJuego ? "actual" : "heredado (aprox.)"}</div>${hemiciclo(compSen, L.sen)}</div>` : ""}
      </div>
      <p class="small">${yo === "NUEVO" ? "Tu partido nuevo arranca sin bancas: solo entra con lo que saques en la elección." : `Tu partido: <b>${comp[yo] || 0}</b> de ${L.dip}${compSen ? ` en Diputados y <b>${compSen[yo] || 0}</b> de ${L.sen} en el Senado` : ""}${enJuego ? "" : " antes de la elección"}.`}</p>
      ${textoMayorias(T)}
      <h3 style="margin-top:12px">${esProv ? "Economía y recursos" : "Recursos y servicios"}</h3>
      <div class="terr-cifras">${cifras.map(([a, b]) => `<div><span class="small muted">${a}</span><b>${esc(String(b))}</b></div>`).join("")}</div>
      <div class="terr-cifras">${factores.map(([a, v]) => `<div><span class="small muted">${a}</span><b>${NIVEL[v]}</b></div>`).join("")}</div>
      <ul class="terr-rasgos">${P.rasgos.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      <p class="small muted">Datos aproximados, inspirados en las legislaturas y estadísticas reales recientes (2023-2025). Los partidos del juego son ficticios: cada fuerza real se traduce a la familia política más parecida.</p>
    </div>`;
}

// ---------- Selector en la pantalla de creación ----------
function listaTerritorios(c) {
  const kind = c.objetivo === "gobernador" ? "prov" : "ciudad";
  const ids = kind === "prov" ? Object.keys(PERFIL_PROV) : CIUDADES_AR.map(x => x.id);
  return ids.map(id => { const T = datosTerritorio(kind, id); return { T, d: dificultadTerritorio(T, c) }; });
}

function mapaSelector(lista, selId) {
  const N = GEO_AR.nacion;
  const porId = Object.fromEntries(lista.map(x => [x.T.id, x]));
  return `<svg class="mapa terr-mapa" viewBox="0 0 ${N.w} ${N.h}" role="img" aria-label="Mapa de dificultad por provincia">
    ${N.provincias.map(p => { const x = porId[p.id]; const col = x ? COLOR_DIF[x.d.etiqueta] : "#334";
      return p.marcador ? `<circle class="prov ${p.id === selId ? "sel" : ""}" data-terr="${p.id}" cx="${p.cx}" cy="${p.cy}" r="7" fill="${col}"><title>${esc(p.nombre)}</title></circle>`
        : `<path class="prov ${p.id === selId ? "sel" : ""}" data-terr="${p.id}" d="${p.path}" fill="${col}"><title>${esc(p.nombre)} · ${x ? x.d.etiqueta : ""}</title></path>`; }).join("")}
  </svg>`;
}
function mapaCiudad(id) {
  const C = CIUDADES_AR.find(x => x.id === id); if (!C) return "";
  const col = { capital: "#3d7fe0", conurbano: "#e3893b", norte: "#c9b84c", agro: "#3fbf7f", patagonia: "#8fa3c0", cuyo: "#b07ad6" };
  return `<svg class="mapa terr-mapa" viewBox="0 0 ${C.w} ${C.h}" role="img" aria-label="Barrios de ${esc(C.nombre)}">${C.barrios.map(b => `<path class="prov" d="${b.path}" fill="${col[b.perfil] || "#556"}"><title>${esc(b.nombre)}</title></path>`).join("")}</svg>
    <p class="small muted" style="text-align:center">${C.barrios.length} barrios o localidades</p>`;
}

function htmlSelectorTerritorio(c) {
  const esProv = c.objetivo === "gobernador";
  const selId = esProv ? (c.provincia || "buenosaires") : (c.ciudad || "lamatanza");
  const lista = listaTerritorios(c);
  const orden = UI.terrOrden || "facil";
  const filtro = esProv ? (UI.terrFiltro || "todas") : "todas";
  let vis = lista.filter(x => filtro === "todas" || (filtro === "bi" ? x.T.L.tipo === "bi" : filtro === "uni" ? x.T.L.tipo === "uni" : filtro === "propia" ? x.d.afin >= 45 : true));
  vis.sort(orden === "facil" ? (a, b) => a.d.total - b.d.total : orden === "dificil" ? (a, b) => b.d.total - a.d.total : orden === "pob" ? (a, b) => b.T.pobAbs - a.T.pobAbs : (a, b) => a.T.nombre.localeCompare(b.T.nombre));
  const sel = lista.find(x => x.T.id === selId) || lista[0];
  const yo = familiaJugador(c);
  return `<div class="card stack">
    <h2>${esProv ? "Provincia" : "Municipio"}</h2>
    <p class="small muted">Cada ${esProv ? "provincia" : "municipio"} tiene su ${esProv ? "Legislatura" : "Concejo"}, su plata y sus conflictos. La dificultad se calcula para ${yo === "NUEVO" ? "un partido nuevo, sin bancas" : "el " + esc(PARTIDOS[yo].nombre)}: si cambiás de partido o de camino, cambia.</p>
    <div class="terr-sel">
      <div class="terr-izq">${esProv ? mapaSelector(lista, selId) : mapaCiudad(selId)}
        ${esProv ? `<div class="terr-ref small">${Object.entries(COLOR_DIF).map(([k, v]) => `<span><i class="terr-punto" style="background:${v}"></i>${k}</span>`).join("")}</div>` : ""}</div>
      <div class="terr-der">${fichaTerritorio(sel.T, c, false)}</div>
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center">
      <label class="small muted">Ordenar</label>
      <select id="terrOrden"><option value="facil" ${orden === "facil" ? "selected" : ""}>De más fácil a más difícil</option><option value="dificil" ${orden === "dificil" ? "selected" : ""}>De más difícil a más fácil</option><option value="pob" ${orden === "pob" ? "selected" : ""}>Por población</option><option value="az" ${orden === "az" ? "selected" : ""}>Alfabético</option></select>
      ${esProv ? `<div class="tabs terr-filtros">${[["todas", "Todas"], ["uni", "Unicamerales"], ["bi", "Bicamerales"], ["propia", "Con mayoría de tu partido"]].map(([k, n]) => `<button class="${filtro === k ? "on" : ""}" data-terrf="${k}">${n}</button>`).join("")}</div>` : ""}
    </div>
    <div class="terr-grilla">${vis.map(({ T, d }) => `<button class="opcion terr-op ${T.id === selId ? "sel" : ""}" data-terr="${T.id}" style="border-left:5px solid ${COLOR_DIF[d.etiqueta]}">
        <b>${esc(esProv ? T.nombre.replace("Ciudad Autónoma de Buenos Aires", "CABA") : T.nombre)}</b>
        <span class="small muted">${d.etiqueta} (${d.total}) · ${T.L.tipo === "bi" ? `${T.L.dip}+${T.L.sen} bancas` : `${T.L.dip} bancas`}${esProv ? "" : " · " + esc(T.prov)}</span>
        <span class="small muted">Tu partido ≈${d.afin}% · ${T.P.dep}% de plata de afuera</span></button>`).join("") || '<p class="small muted">Ninguna coincide con el filtro.</p>'}</div>
  </div>`;
}

function bindSelectorTerritorio(c, rerender) {
  const esProv = c.objetivo === "gobernador";
  document.querySelectorAll("[data-terr]").forEach(el => el.onclick = () => { if (esProv) c.provincia = el.dataset.terr; else c.ciudad = el.dataset.terr; rerender(); });
  document.querySelectorAll("[data-terrf]").forEach(el => el.onclick = () => { UI.terrFiltro = el.dataset.terrf; rerender(); });
  const o = document.getElementById("terrOrden"); if (o) o.onchange = () => { UI.terrOrden = o.value; rerender(); };
}

// ---------- Ficha dentro del gobierno ----------
function htmlFichaEnJuego() {
  const T = territorioDeCfg(S.cfg);
  if (!T || !T.P) return `<p class="muted">Sin ficha para este territorio.</p>`;
  return fichaTerritorio(T, { ...S.cfg, partido: S.jugador.partido, camino: S.jugador.partido === "NUEVO" ? "fundar" : "sumarse" }, !!S.terr);
}

// ---------- Votaciones de Legislaturas provinciales y concejos ----------
const _tablaVotacionTerr = tablaVotacion;
tablaVotacion = function (v) {
  if (!v || !["leg", "concejo", "legsen", "legdip"].includes(v.camara)) return _tablaVotacionTerr(v);
  const nombre = v.camara === "legsen" ? "Senado provincial" : v.camara === "legdip" || (v.camara === "leg" && S.legSen) ? "Diputados provinciales" : v.camara === "leg" ? "Legislatura" : "Concejo Deliberante";
  const ok = v.camaraOk != null ? v.camaraOk : v.aprobado;
  const total = v.total || (v.camara === "legsen" ? S.legSenTotal : S.legTotal);
  const conAus = v.detalle.some(d => d.aus);
  let h = `<h3 style="margin-top:10px">${nombre}: ${ok ? "APROBADO" : "RECHAZADO"}${v.etiqueta ? ` <span class="small muted">(${esc(v.etiqueta)})</span>` : ""}</h3>
  <p class="small muted">Afirmativos ${v.si}, negativos ${v.no}${conAus ? `, ausentes ${v.aus}` : ""}. Necesarios: ${v.necesario} de ${total}.${v.quorum === false ? " Sin quórum." : ""}</p>
  <table class="tally"><tr><th>Bloque</th><th>Sí</th><th>No</th>${conAus ? "<th>Aus.</th>" : ""}</tr>${v.detalle.map(d => `<tr><td>${nombrePartidoCorto(d.bloque)}</td><td>${d.si}</td><td>${d.no}</td>${conAus ? `<td>${d.aus || 0}</td>` : ""}</tr>`).join("")}</table>`;
  if (v.siguiente) h += tablaVotacion(v.siguiente);
  return h;
};
