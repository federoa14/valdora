// =============================================================
//  VALDORA - Piezas del portal de gobierno: emblema inventado,
//  Boletín Oficial, cuadros estadísticos y ejecución del gasto.
// =============================================================

// emblema ficticio: escudo con columnas y estrella (no reproduce ningún símbolo oficial)
const EMBLEMA_SVG = `<svg class="emblema" viewBox="0 0 64 72" aria-hidden="true">
  <path d="M32 2 L60 12 V36 C60 54 47 65 32 70 C17 65 4 54 4 36 V12 Z" fill="#0f2747" stroke="#c9a54c" stroke-width="3"/>
  <path d="M32 9 L53 16.5 V36 C53 50 43 59 32 63 C21 59 11 50 11 36 V16.5 Z" fill="none" stroke="#c9a54c" stroke-width="1" opacity=".55"/>
  <polygon points="32,15 34.6,22.4 42.4,22.6 36.2,27.3 38.4,34.8 32,30.4 25.6,34.8 27.8,27.3 21.6,22.6 29.4,22.4" fill="#e6c76a"/>
  <rect x="19" y="38" width="26" height="3" fill="#c9a54c"/><rect x="21" y="42" width="3.2" height="11" fill="#c9a54c"/><rect x="27" y="42" width="3.2" height="11" fill="#c9a54c"/><rect x="33.8" y="42" width="3.2" height="11" fill="#c9a54c"/><rect x="39.8" y="42" width="3.2" height="11" fill="#c9a54c"/><rect x="18" y="54" width="28" height="3" fill="#c9a54c"/>
</svg>`;

function kickerCargo() {
  if (typeof esLocal === "function" && esLocal()) return S.cfg.objetivo === "intendente" ? `Municipalidad de ${nombreTerritorio()}` : `Gobierno de la Provincia de ${nombreTerritorio()}`;
  if (typeof esLegislador === "function" && esLegislador()) return "Honorable Cámara de Diputados";
  return "Presidencia de la Nación";
}
function encabezadoPortal(titulo, botonHtml) {
  const fecha = typeof fechaDeMes === "function" && S.mes ? fechaDeMes(S.mes) : "";
  return `<div class="portal-head"><div><div class="kicker">${esc(kickerCargo())}${fecha ? " · " + esc(fecha) : ""}</div><h2>${titulo}</h2></div>${botonHtml || ""}</div>`;
}

const TIPO_BOLETIN = { decreto: "Decreto", dnu: "Decreto de Necesidad y Urgencia", resolucion: "Resolución", ley: "Ley", leyp: "Ley provincial", ordenanza: "Ordenanza", veto: "Veto", derogacion: "Derogación" };
function htmlBoletin() {
  const B = boletin();
  const filtro = UI.filtroBO || "todos";
  const tipos = ["todos", ...new Set(B.items.map(i => i.tipo))];
  const items = B.items.filter(i => filtro === "todos" || i.tipo === filtro);
  return `<div class="bo">
    <div class="bo-cab"><div><b>${esc(nombreBoletin())}</b><span>Primera sección · Legislación y avisos oficiales</span></div><span class="small muted">${B.items.length} normas publicadas</span></div>
    <div class="row small" style="margin:8px 0">${tipos.map(t => `<button class="chip ${filtro === t ? "on" : ""}" data-bof="${t}">${t === "todos" ? "Todas" : TIPO_BOLETIN[t] || t}</button>`).join("")}</div>
    ${items.length ? items.map(it => `<article class="bo-item bo-${it.tipo}">
        <div class="bo-num">${esc(rotuloBoletin(it))}</div>
        <div class="bo-meta">${esc(it.organismo || "")} · ${esc(fechaDeMes(it.mes))}</div>
        <h4>${esc(it.titulo)}</h4>
        ${it.detalle ? `<p>${esc(it.detalle)}</p>` : ""}
      </article>`).join("") : `<p class="muted">Todavía no se publicó ninguna norma de tu gestión. Las medidas que firmes, las leyes que se sancionen y los vetos aparecen acá.</p>`}
  </div>`;
}
function bindBoletin(rerender) {
  document.querySelectorAll("[data-bof]").forEach(b => b.onclick = () => { UI.filtroBO = b.dataset.bof; rerender(); });
}

// cuadro estilo instituto de estadística: último dato, mes anterior, hace un año
function htmlEstadisticas(filas, fuente) {
  const H = S.hist || [];
  const ult = H.length ? fechaDeMes(Math.max(1, (H[H.length - 1].t || 0))) : "";
  const f = (v, d) => v == null || isNaN(v) ? "s/d" : fmt(v, d);
  const flecha = (a, b, malo) => { if (a == null || b == null) return ""; const d = a - b; if (Math.abs(d) < 0.05) return '<span class="muted">=</span>'; const peor = malo ? d > 0 : d < 0; return `<span class="${peor ? "up-bad" : "up-good"}">${d > 0 ? "▲" : "▼"} ${fmt(Math.abs(d), 1)}</span>`; };
  return `<div class="cuadro">
    <div class="cuadro-cab"><b>Cuadro 1. Principales indicadores</b><span>Último dato publicado: ${esc(ult || "—")}</span></div>
    <table class="tally oficial"><thead><tr><th>Indicador</th><th>Unidad</th><th>Último</th><th>Mes anterior</th><th>Var.</th><th>Hace 12 meses</th></tr></thead><tbody>
    ${filas.map(([k, n, u, d, malo]) => { const r = filaEstadistica(k); return `<tr><td>${n}</td><td class="muted">${u}</td><td><b>${f(r.v, d)}</b></td><td>${f(r.prev, d)}</td><td>${flecha(r.v, r.prev, malo)}</td><td>${f(r.anio, d)}</td></tr>`; }).join("")}
    </tbody></table>
    <p class="fuente">Fuente: ${esc(fuente)}. Los datos del mes en curso se publican al cierre del mes.</p>
  </div>`;
}
const FILAS_EST_NAC = [["inflacion", "Inflación (IPC)", "% mensual", 1, true], ["crecimiento", "Actividad económica", "% anual", 1, false], ["desempleo", "Desocupación", "% PEA", 1, true], ["pobreza", "Pobreza", "% personas", 1, true], ["deficit", "Resultado fiscal (déficit)", "% PBI", 1, true], ["deuda", "Deuda pública", "% PBI", 0, true], ["reservas", "Reservas internacionales", "US$ M", 0, false], ["inseguridad", "Índice de inseguridad", "0-100", 0, true]];
const FILAS_EST_LOCAL = [["caja", "Fondos disponibles", "índice", 0, false], ["desempleo", "Desocupación", "% PEA", 1, true], ["pobreza", "Pobreza", "% personas", 1, true], ["inseguridad", "Índice de inseguridad", "0-100", 0, true], ["servicios", "Calidad de servicios", "0-100", 0, false]];

function htmlEjecucion() {
  const filas = ejecucionPresupuestaria(); if (!filas.length) return "";
  const tv = filas.reduce((a, r) => a + r.vigente, 0), td = filas.reduce((a, r) => a + r.devengado, 0);
  const m = n => Math.round(n).toLocaleString("es-AR");
  return `<div class="cuadro" style="margin-top:14px">
    <div class="cuadro-cab"><b>Ejecución presupuestaria de la Administración Nacional</b><span>Acumulado del ejercicio ${anioDeMes(S.mes)} · en miles de millones de $</span></div>
    <table class="tally oficial"><thead><tr><th>Finalidad / función</th><th>Crédito vigente</th><th>Devengado</th><th>% ejecución</th><th>Cambio vs. heredado</th></tr></thead><tbody>
    ${filas.map(r => `<tr><td>${esc(r.nombre)}</td><td>${m(r.vigente)}</td><td>${m(r.devengado)}</td><td><span class="ejec"><i style="width:${Math.min(100, r.pct)}%"></i></span>${fmt(r.pct, 1)}%</td><td class="${r.cambio < 0 ? "up-bad" : r.cambio > 0 ? "up-good" : "muted"}">${r.cambio > 0 ? "+" : ""}${r.cambio}%</td></tr>`).join("")}
    <tr class="total"><td>Total</td><td>${m(tv)}</td><td>${m(td)}</td><td>${fmt(td / tv * 100, 1)}%</td><td></td></tr>
    </tbody></table>
    <p class="fuente">Fuente: Oficina Nacional de Presupuesto (ficticia), sobre la base de los créditos que fijás arriba.</p>
  </div>`;
}

// el emblema va en la barra superior
(() => { const m = document.getElementById("marca"); if (m && !m.querySelector(".emblema")) m.insertAdjacentHTML("afterbegin", EMBLEMA_SVG); })();
