// =============================================================
//  VALDORA - Pantallas de gestión: Jefatura de Gabinete y
//  ministerios, Economía, Cancillería, Conflictos y gráficos.
// =============================================================

function resGestion(titulo, r, rerender) {
  if (!r) return rerender();
  modal(`<h2>${esc(titulo)}</h2><p>${esc(r.msg || "")}</p>${(r.pasos || []).map(tablaVotacion).join("")}<div class="row" style="justify-content:flex-end"><button id="mOk">OK</button></div>`, r.tipo || (r.ok === false ? "aviso" : "info"));
  $("#mOk").onclick = () => { cerrarModal(); rerender(); };
}
const n0 = v => Math.round(v).toLocaleString("es-AR");
function rango(v, sd) { const a = Math.max(0, Math.round(v - sd)), b = Math.min(100, Math.round(v + sd)); return `${a}–${b}`; }
function kpi(l, v, sub, cls) { return `<div class="ind"><div class="l">${l}</div><div class="n ${cls || ""}">${v}</div>${sub ? `<div class="d muted">${sub}</div>` : ""}</div>`; }
function bloque(titulo, html, extra) { return `<section class="bloque"><h3>${titulo}${extra ? ` <span class="small muted">${extra}</span>` : ""}</h3>${html}</section>`; }

// ---------- Gráficos ----------
function graficoSerie(titulo, series, opt = {}) {
  const H = S.hist || []; const n = H.length;
  if (n < 2) return `<div class="graf"><h4>${titulo}</h4><p class="small muted">Aparece al cerrar el primer mes.</p></div>`;
  const W = 320, Ht = 120;
  const vals = series.flatMap(s => H.map(h => h[s.k]).filter(v => v != null && !isNaN(v)));
  if (!vals.length) return "";
  let min = opt.min != null ? opt.min : Math.min(...vals), max = opt.max != null ? opt.max : Math.max(...vals);
  if (max - min < 1e-6) { max += 1; min -= 1; }
  const pad = (max - min) * 0.08; if (opt.min == null) min -= pad; if (opt.max == null) max += pad;
  const y = v => Ht - 4 - (v - min) / (max - min) * (Ht - 8);
  let svg = `<svg viewBox="0 0 ${W} ${Ht}" class="graf-svg" preserveAspectRatio="none">`;
  for (let g = 0; g <= 2; g++) { const yy = 4 + g * (Ht - 8) / 2; svg += `<line x1="0" x2="${W}" y1="${yy}" y2="${yy}" stroke="currentColor" opacity=".08"/>`; }
  if (opt.cero && min < 0 && max > 0) svg += `<line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" opacity=".3" stroke-dasharray="3 3"/>`;
  for (const s of series) {
    const pts = H.map((h, i) => h[s.k] == null || isNaN(h[s.k]) ? null : `${(i / (n - 1)) * W},${y(h[s.k])}`).filter(Boolean).join(" ");
    svg += `<polyline fill="none" stroke="${s.c}" stroke-width="2" vector-effect="non-scaling-stroke" points="${pts}"/>`;
  }
  svg += `</svg>`;
  const d = opt.dec != null ? opt.dec : 1, u = opt.u || "";
  const ult = series.map(s => { const v = H[n - 1][s.k], v0 = H[Math.max(0, n - 2)][s.k]; return `<span><i style="background:${s.c}"></i>${s.n}: <b>${v == null ? "s/d" : fmt(v, d)}${u}</b>${v != null && v0 != null ? ` <span class="${(v - v0 > 0) === !!s.malo ? "up-bad" : "up-good"}">${Math.abs(v - v0) < Math.pow(10, -d) / 2 ? "" : v > v0 ? "▲" : "▼"}</span>` : ""}</span>`; }).join("");
  return `<div class="graf"><h4>${titulo}</h4><div class="graf-eje"><span>${fmt(max, d)}</span><span>${fmt(min, d)}</span></div>${svg}<div class="leyenda">${ult}</div></div>`;
}
function htmlGraficos() {
  if (S.fase !== "gobierno") return `<div class="grafs">
    ${graficoSerie("Imagen y tensión social", [{ k: "imagen", n: "Imagen", c: "#5b9be6" }, { k: "tension", n: "Tensión", c: "#ef6457", malo: true }], { min: 0, max: 100, dec: 0 })}
    ${graficoSerie("Caja", [{ k: "caja", n: "Caja", c: "#3fbf7f" }], { dec: 0, cero: true })}
    ${graficoSerie("Desempleo y pobreza", [{ k: "desempleo", n: "Desempleo", c: "#e3a63b", malo: true }, { k: "pobreza", n: "Pobreza", c: "#ef6457", malo: true }], { u: "%" })}
    ${graficoSerie("Servicios e inseguridad", [{ k: "servicios", n: "Servicios", c: "#3fbf7f" }, { k: "inseguridad", n: "Inseguridad", c: "#b07be8", malo: true }], { min: 0, max: 100, dec: 0 })}
  </div>`;
  return `<div class="grafs">
    ${graficoSerie("Inflación mensual", [{ k: "inflacion", n: "IPC", c: "#ef6457", malo: true }], { u: "%", min: 0 })}
    ${graficoSerie("Imagen del gobierno y tensión social", [{ k: "imagen", n: "Imagen", c: "#5b9be6" }, { k: "tension", n: "Tensión", c: "#ef6457", malo: true }], { min: 0, max: 100, dec: 0 })}
    ${graficoSerie("Pobreza e indigencia", [{ k: "pobreza", n: "Pobreza", c: "#e3a63b", malo: true }, { k: "indigencia", n: "Indigencia", c: "#ef6457", malo: true }], { u: "%", min: 0 })}
    ${graficoSerie("Desempleo", [{ k: "desempleo", n: "Desocupación", c: "#e3a63b", malo: true }], { u: "%" })}
    ${graficoSerie("Empleo por sector (índice, inicio = 100)", [{ k: "empAgro", n: "Agro", c: "#3fbf7f" }, { k: "empIndustria", n: "Industria", c: "#5b9be6" }, { k: "empConstruccion", n: "Construcción", c: "#e3a63b" }, { k: "empComercio", n: "Comercio", c: "#e86fb0" }, { k: "empServicios", n: "Servicios", c: "#9fb3cc" }, { k: "empPublico", n: "Público", c: "#b07be8" }], { dec: 0 })}
    ${graficoSerie("Crecimiento de la economía", [{ k: "crecimiento", n: "PBI anual", c: "#3fbf7f" }], { u: "%", cero: true })}
    ${graficoSerie("Resultado fiscal", [{ k: "deficit", n: "Déficit", c: "#ef6457", malo: true }], { u: "% PBI", cero: true })}
    ${graficoSerie("Deuda pública", [{ k: "deuda", n: "Deuda", c: "#e3a63b", malo: true }], { u: "% PBI", dec: 0 })}
    ${graficoSerie("Reservas internacionales", [{ k: "reservas", n: "Reservas", c: "#3fbf7f" }], { dec: 0, min: 0 })}
    ${graficoSerie("Dólar oficial y paralelo", [{ k: "dolar", n: "Oficial", c: "#5b9be6", malo: true }, { k: "paralelo", n: "Paralelo", c: "#e3a63b", malo: true }], { dec: 0 })}
    ${graficoSerie("Riesgo país", [{ k: "riesgo", n: "Puntos básicos", c: "#ef6457", malo: true }], { dec: 0, min: 0 })}
    ${graficoSerie("Salario real (inicio = 100)", [{ k: "salarioReal", n: "Salario real", c: "#3fbf7f" }], { dec: 0 })}
    ${graficoSerie("Petróleo (US$/barril)", [{ k: "petroleo", n: "Petróleo", c: "#9fb3cc" }], { dec: 0 })}
    ${graficoSerie("Oro (US$/onza)", [{ k: "oro", n: "Oro", c: "#c9a54c" }], { dec: 0 })}
    ${graficoSerie("Inseguridad", [{ k: "inseguridad", n: "Índice", c: "#b07be8", malo: true }], { min: 0, max: 100, dec: 0 })}
  </div>`;
}

// ---------- Jefatura de Gabinete ----------
function indicadoresMin(id) {
  const I = S.ind, P = S.presupuesto, st = S.ministerios[id], on = p => st.activos.includes(p);
  const conf = id => (S.conflictos || []).find(c => c.id === id);
  switch (id) {
    case "seguridad": return [["Homicidios cada 100.000 hab.", fmt(1.6 + I.inseguridad * 0.055, 1)], ["Robos denunciados cada 100.000 hab.", n0(1400 + I.inseguridad * 22)], ["Efectivos federales desplegados", n0(12000 + (on("barrios") ? 6000 : 0) + (on("narco") ? 3500 : 0))], ["Protocolo ante cortes", ministerio("seguridad").palancas[0].opciones.find(o => o.id === st.palancas.protocolo).t.split(":")[0]]];
    case "defensa": return [["Gasto en defensa", fmt(0.5 * (1 + P.defensa / 100) + (on("equipo") ? 0.12 : 0), 2) + "% PBI"], ["Alistamiento operativo", Math.round(R.clamp(42 + P.defensa * 0.5 + (on("equipo") ? 15 : 0), 10, 95)) + "%"], ["Cascos azules desplegados", n0(S.mundo ? S.mundo.onf.cascos : 0)], ["Días de patrullaje en el mar", n0(on("mar") ? 240 : 90)]];
    case "salud": return [["Mortalidad infantil", fmt(R.clamp(7.5 + (I.pobreza - 30) * 0.06 - P.salud * 0.02 - (on("vacunas") ? 0 : -1.2) - (on("hospitales") ? 0.4 : 0), 4, 25), 1) + " ‰"], ["Cobertura de vacunación", Math.round(R.clamp(84 + P.salud / 5 + (on("vacunas") ? 6 : -18), 40, 98)) + "%"], ["Ocupación de camas críticas", Math.round(R.clamp(62 + (S.mundo && S.mundo.crisis.some(c => c.id === "pandemia" && c.hasta >= S.mes) ? 30 : 0) - P.salud * 0.2, 30, 100)) + "%"], ["Remedios gratis a jubilados", on("remedios") ? "Sí" : "No"]];
    case "educacion": { const d = conf("docentes"); return [["Días de clase (año)", n0(Math.max(120, 190 - (d ? d.dias : 0)))], ["Abandono en la secundaria", fmt(R.clamp(22 + (I.pobreza - 30) * 0.15 - P.educacion / 8 - (on("becas") ? 2 : -3), 5, 50), 1) + "%"], ["Chicos que leen bien a los 8 años", Math.round(R.clamp(54 + P.educacion / 6 + (on("alfabetizacion") ? Math.min(14, (S.mes || 1) * 0.4) : 0), 20, 90)) + "%"], ["Paritaria docente", ministerio("educacion").palancas[0].opciones.find(o => o.id === st.palancas.paritaria).t]]; }
    case "desarrollo": return [["Indigencia", fmt(I.indigencia != null ? I.indigencia : I.pobreza * 0.2, 1) + "%"], ["Cobertura de la asignación por hijo", (on("auh") ? 92 : 60) + "%"], ["Personas en programas de empleo", n0(on("cooperativas") ? 1050000 : 180000)], ["Gestión de los planes", ministerio("desarrollo").palancas[0].opciones.find(o => o.id === st.palancas.planes).t]];
  }
  return [];
}
function filaMinistro(m, extra) {
  if (!m) return "";
  const p = S.percepcion ? 8 : 8;
  return `<div class="min-ficha"><b>${esc(m.nombre)}</b><span class="tag">${RASGOS[m.rasgo] ? RASGOS[m.rasgo].nombre : "—"}</span>
    <span class="small muted">Capacidad ${m.comp}/10 · Lealtad ≈ ${rango(m.lealtad, p)} · Riesgo de escándalo ${m.riesgo < 25 ? "bajo" : m.riesgo < 50 ? "medio" : "alto"}</span>${extra || ""}</div>`;
}
function htmlGabinete() {
  asegurarGabinete();
  const sel = UI.minSel;
  const jg = titularDe("Jefe de Gabinete"), int = titularDe("Interior"), can = titularDe("Cancillería");
  if (sel && ministerio(sel)) {
    const M = ministerio(sel), st = S.ministerios[sel], m = titularDe(M.cargo), A = AREAS.find(a => a.id === M.area);
    const cands = UI.verCand === sel ? candidatosMinistro(M.cargo) : null;
    return `<div class="row" style="justify-content:space-between"><button class="sec" data-minvolver>◂ Jefatura de Gabinete</button><span class="small muted">Las resoluciones salen en el Boletín Oficial</span></div>
      <h3 style="margin-top:10px">${M.nombre}</h3>
      ${filaMinistro(m, `<div class="row" style="margin-top:6px"><button class="sec" data-vercand="${sel}">Reemplazar ministro/a (1 casillero)</button></div>`)}
      ${cands ? `<div class="cands">${cands.map((c, i) => `<div class="cand"><b>${esc(c.nombre)}</b><span class="tag">${RASGOS[c.rasgo].nombre}</span><span class="small muted">${RASGOS[c.rasgo].desc} Capacidad ≈ ${Math.max(1, c.comp - 1)}–${Math.min(10, c.comp + 1)} · lealtad ≈ ${rango(c.lealtad, 15)}</span><button data-nombrar="${M.cargo}" data-cidx="${i}">Designar</button></div>`).join("")}</div><p class="small muted">Lo que sabés de los candidatos es lo que dicen sus padrinos: puede no ser cierto.</p>` : ""}
      <div class="indicadores" style="margin-top:10px">${indicadoresMin(sel).map(([l, v]) => kpi(l, v)).join("")}</div>
      ${bloque("Presupuesto del área", `<div class="slider-row"><span>${A.nombre}</span><input type="range" min="-40" max="40" step="5" value="${S.presupuesto[A.id]}" data-area="${A.id}"><b>${S.presupuesto[A.id] > 0 ? "+" : ""}${S.presupuesto[A.id]}%</b></div><p class="small muted">Crédito vigente: $ ${n0(ejecucionPresupuestaria().find(r => r.nombre === A.nombre).vigente)} miles de millones.</p>`)}
      ${bloque("Programas", M.programas.map(p => { const on = st.activos.includes(p.id); return `<div class="prog ${on ? "on" : ""}"><div><b>${p.nombre}</b>${p.base ? ' <span class="tag">heredado</span>' : ""}<br><span class="small muted">${p.desc} Costo: ${fmt(p.costo, 2)}% del PBI por año.</span></div><button class="${on ? "sec" : ""}" data-prog="${sel}" data-pid="${p.id}">${on ? "Dar de baja" : "Lanzar"}</button></div>`; }).join(""), "hasta dos resoluciones por mes")}
      ${bloque("Política del área", M.palancas.map(pa => `<div class="campo"><label>${pa.nombre}</label><div class="opciones">${pa.opciones.map(o => `<button class="opcion ${st.palancas[pa.id] === o.id ? "sel" : ""}" data-pal="${sel}" data-palid="${pa.id}" data-op="${o.id}"><b>${o.t}</b><span class="small muted">${o.desc}</span></button>`).join("")}</div></div>`).join(""))}`;
  }
  const tarjeta = (id, titulo, m, linea, link) => `<button class="min-card" ${link ? `data-irtab="${link}"` : `data-min="${id}"`}><span class="kicker">${titulo}</span><b>${m ? esc(m.nombre) : "—"}</b><span class="small muted">${m && RASGOS[m.rasgo] ? RASGOS[m.rasgo].nombre + " · " : ""}${linea}</span></button>`;
  return `<p class="small muted">La Jefatura de Gabinete coordina a los ministros, responde ante el Congreso y administra el presupuesto. Entrá a cada ministerio para ver sus indicadores, programas y decisiones.</p>
    ${filaMinistro(jg, `<div class="row" style="margin-top:6px"><button class="sec" id="bInforme">Informe de gestión al Congreso (1 casillero)</button></div>`)}
    <div class="min-grid">
      ${tarjeta("economia", "Ministerio de Economía", S.ministroEco ? { nombre: S.ministroEco.nombre } : null, S.ministroEco ? S.ministroEco.titulo : "Sin designar", "economia")}
      ${tarjeta("cancilleria", "Cancillería", can, `Prestigio en la ONF: ${Math.round(mundo().onf.prestigio)}`, "cancilleria")}
      ${tarjeta("interior", "Ministerio del Interior", int, `Relación con gobernadores: ${Math.round(promGob())}`, "congreso")}
      ${MINISTERIOS.map(M => { const m = titularDe(M.cargo); const p = S.presupuesto[M.area]; return tarjeta(M.id, M.nombre, m, `Presupuesto ${p > 0 ? "+" : ""}${p}% · ${S.ministerios[M.id].activos.length} programas`); }).join("")}
    </div>`;
}

// ---------- Economía ----------
function htmlEconomia() {
  const E = eco(), I = S.ind, M = mundo(), era = ecoEra(), K = S.escalaRes || 1;
  const inflA = inflAnual(), oroUSD = M.oroTon * OZ_POR_TON * M.oro / 1e6;
  const canasta = era.cbt * E.tc0 * E.P / 100, ingreso = era.ingreso * E.tc0 * E.W / 100;
  const prim = I.deficit - interesesDeuda();
  const opt = (v, t, cur) => `<option value="${v}" ${cur === v ? "selected" : ""}>${t}</option>`;
  return `<p class="small muted">${BANCO_CENTRAL} y Ministerio de Economía. Las decisiones del Banco Central (tasa, intervención, letras) no ocupan agenda; las del ministerio (régimen, devaluación, deuda, impuestos, organismos) ocupan un casillero.</p>
    <div class="indicadores">
      ${kpi("Dólar oficial", fmtTC(E.tc), `${E.dev != null ? (E.dev >= 0 ? "+" : "") + fmt(E.dev, 1) + "% en el mes" : ""}`)}
      ${kpi("Dólar paralelo", fmtTC(E.paralelo), `Brecha ${fmt(E.brecha, 0)}%`, E.brecha > 40 ? "up-bad" : "")}
      ${kpi("Riesgo país", n0(E.riesgo) + " pb", E.default ? "En default" : E.riesgo > 1100 ? "Mercados cerrados" : "Mercados abiertos", E.riesgo > 1100 ? "up-bad" : "")}
      ${kpi("Reservas brutas", "US$ " + n0(I.reservas) + " M", `Oro: US$ ${n0(oroUSD)} M (${fmt(M.oroTon, 1)} t)`)}
      ${kpi("Tasa de política", fmt(E.tasa, 0) + "% anual", `Real ${fmt(E.tasa - inflA, 0)}%${E.auto ? " · automática" : ""}`)}
      ${kpi("Inflación anualizada", fmt(inflA, 0) + "%", `${fmt(I.inflacion)}% mensual`)}
      ${kpi("Salario real", fmt(E.salarioReal, 0), "inicio = 100", E.salarioReal < 95 ? "up-bad" : E.salarioReal > 102 ? "up-good" : "")}
      ${kpi("Canasta básica total", `${era.moneda} ${n0(canasta)}`, `Ingreso medio por hogar: ${era.moneda} ${n0(ingreso)}`)}
      ${kpi("PBI", "US$ " + n0(pbiUSD()) + " mil M", `${fmt(I.crecimiento)}% anual`)}
      ${kpi("Resultado primario", (prim > 0 ? "−" : "+") + fmt(Math.abs(prim)) + "% PBI", `Financiero: ${I.deficit > 0 ? "déficit " : "superávit "}${fmt(Math.abs(I.deficit))}%`, prim > 0 ? "up-bad" : "up-good")}
    </div>
    ${bloque("Banco Central", `
      <div class="eco-grid">
        <div class="campo"><label>Tasa de política monetaria</label><div class="row"><select id="ecoTasaModo">${opt("auto", "Automática (inflación + 4)", E.auto ? "auto" : "manual")}${opt("manual", "Manual", E.auto ? "auto" : "manual")}</select><input id="ecoTasa" type="number" min="0" step="5" value="${Math.round(E.tasa)}" style="width:90px"><button class="sec" id="ecoTasaOk">Fijar</button></div><p class="small muted">Tasa real alta: frena la inflación y el dólar, enfría la economía y encarece las letras. Tasa real negativa: todos se pasan al dólar.</p></div>
        <div class="campo"><label>Régimen cambiario <span class="muted small">(vigente: ${REGIMENES[E.regimen].nombre})</span></label><div class="row"><select id="ecoReg">${Object.entries(REGIMENES).map(([k, r]) => opt(k, r.nombre, E.regimen)).join("")}</select><button class="sec" id="ecoRegOk">Cambiar</button></div><p class="small muted" id="ecoRegDesc">${REGIMENES[E.regimen].desc}</p>
          ${["crawling", "cepo"].includes(E.regimen) ? `<div class="row small">Devaluación mensual: <input id="ecoCrawl" type="number" step="0.5" min="0" value="${E.crawl}" style="width:70px">% <button class="sec" id="ecoCrawlOk">Ajustar</button> <span class="muted">(inflación: ${fmt(I.inflacion)}%)</span></div>` : ""}</div>
        <div class="campo"><label>Devaluación de un salto</label><div class="row">${[5, 10, 20, 40].map(p => `<button class="sec" data-deval="${p}">${p}%</button>`).join("")}</div><p class="small muted">Mejora la competitividad y las reservas; la mitad pasa a precios en los meses siguientes.</p></div>
        <div class="campo"><label>Mercado de cambios</label><div class="row">${[500, 1000, 2000].map(v => `<button class="sec" data-interv="${v}">Vender ${n0(v)}</button>`).join("")}${[500, 1000].map(v => `<button class="sec" data-interv="${-v}">Comprar ${n0(v)}</button>`).join("")}</div><p class="small muted">Vender reservas calma el dólar hoy; comprar emite pesos.${E.ventasBanda ? ` Este mes el techo de la banda obligó a vender US$ ${n0(E.ventasBanda)} M.` : ""}</p></div>
        <div class="campo"><label>Letras de liquidez <span class="muted small">(stock ${fmt(E.letras)}% del PBI)</span></label><div class="row"><button class="sec" data-letras="1">Colocar (absorber pesos)</button><button class="sec" data-letras="-1">Rescatar (liberar pesos)</button></div><p class="small muted">Intereses: ${fmt(E.letras * E.tasa / 100, 1)}% del PBI por año de déficit cuasifiscal, que termina en emisión.</p></div>
      </div>`)}
    ${bloque("Deuda y financiamiento", `
      <table class="tally oficial"><tr><th>Concepto</th><th>Valor</th></tr>
        <tr><td>Deuda pública total</td><td>${fmt(I.deuda, 0)}% del PBI (≈ US$ ${n0(pbiUSD() * I.deuda / 100)} mil M)</td></tr>
        <tr><td>En moneda extranjera</td><td>${Math.round(deudaPctUSD() * 100)}%</td></tr>
        <tr><td>Vencimientos en dólares del mes</td><td>US$ ${n0(vencimientosUSD())} M${E.default ? " (suspendidos)" : ""}</td></tr>
        <tr><td>Rollover de la última licitación en pesos</td><td class="${E.rollover < 90 ? "up-bad" : "up-good"}">${fmt(E.rollover, 0)}%</td></tr>
        <tr><td>Intereses de la deuda</td><td>${fmt(interesesDeuda(), 1)}% del PBI por año</td></tr>
      </table>
      <div class="row" style="margin-top:8px"><label class="small">Financiar el déficit con:</label><select id="ecoFin">${opt("emision", "Emisión del Banco Central", E.financiamiento)}${opt("mixto", "Mixto", E.financiamiento)}${opt("deuda", "Deuda en el mercado", E.financiamiento)}</select>
        <label class="small"><input type="checkbox" id="ecoRefi" ${E.refinanciarUSD ? "checked" : ""}> Refinanciar vencimientos en dólares si el riesgo país lo permite</label></div>
      <div class="row" style="margin-top:8px"><button class="sec" data-bono="pesos">Licitar bono en pesos</button><button class="sec" data-bono="usd" ${E.riesgo > 1100 || E.default ? "disabled" : ""}>Colocar bono en dólares</button>
        ${E.default ? "" : `<button class="peligro" id="ecoDefault">Declarar default</button>`}
        ${E.reestructura ? `<span class="small muted">Negociación con acreedores en curso: respuesta en el mes ${E.reestructura.fin}.</span>` : `<span class="small">Reestructurar con quita de:</span>${[20, 40, 60].map(q => `<button class="sec" data-quita="${q}">${q}%</button>`).join("")}`}</div>
      <div class="row" style="margin-top:8px"><label class="small">Si hay superávit, usarlo para:</label><select id="ecoSup">${opt("deuda", "Pagar deuda", E.superavit)}${opt("reservas", "Comprar reservas", E.superavit)}${opt("impuestos", "Bajar impuestos", E.superavit)}${opt("gasto", "Más gasto social y obras", E.superavit)}</select></div>`)}
    ${bloque("Impuestos", `
      ${IMPUESTOS_DECRETO.map(it => `<div class="slider-row"><span>${it.nombre}</span><input type="range" min="${it.min}" max="${it.max}" step="${it.paso}" value="${E[it.id]}" data-impd="${it.id}"><b id="impv_${it.id}">${E[it.id]}%</b></div><p class="small muted" style="margin:0 0 6px">${it.desc}</p>`).join("")}
      <button class="sec" id="ecoImpOk">Firmar decreto</button>
      <h4 style="margin-top:12px">Por ley (los crea el Congreso; empiezan en Diputados)</h4>
      <table class="tally">${IMPUESTOS.map(t => `<tr><td>${esc(t.nombre)}</td><td><button class="sec" data-implaw="${t.id}" data-dir="sube">Subir</button> <button class="sec" data-implaw="${t.id}" data-dir="baja">Bajar</button></td></tr>`).join("")}</table>
      <p class="small muted">Un proyecto tributario por mes: cuenta como la medida grande del mes.</p>`)}
    ${bloque("Organismos internacionales de crédito", ORGANISMOS.map(o => { const p = prestamoActivo(o.id); return `<div class="prog ${p ? "on" : ""}"><div><b>${o.nombre}</b> <span class="small muted">US$ ${n0(o.monto)} M · ${o.tramos} ${o.tramos > 1 ? "tramos" : "tramo"} · tasa ${fmt(o.tasa)}%${o.congreso ? " · lo aprueba el Congreso" : ""}</span><br><span class="small muted">${o.desc}</span>${p ? `<br><span class="small">Estado: <b class="${p.estado === "vigente" ? "up-good" : "up-bad"}">${p.estado}</b> · desembolsado US$ ${n0(p.desembolsado)} M · ${p.tramosPend} tramos pendientes${o.id === "fondo" ? ` · meta de déficit ${fmt(p.metaDeficit)}% · meta de reservas US$ ${n0(p.metaReservas)} M` : ""}</span>` : ""}</div>${p ? "" : `<button class="sec" data-prest="${o.id}">Pedir</button>`}</div>`; }).join(""))}
    ${bloque("Salarios", `<div class="row"><label class="small">Pauta para las paritarias:</label><select id="ecoPauta">${opt("baja", "Por debajo de la inflación", E.pauta)}${opt("libre", "Acompañar la inflación", E.pauta)}${opt("alta", "Recuperar salario real", E.pauta)}</select></div><p class="small muted">Una pauta baja ayuda a bajar la inflación, pero pierde el salario real y la CGT se enoja.</p>`)}
    ${bloque("Mercados internacionales", `<div class="indicadores">${kpi("Petróleo (barril)", "US$ " + fmt(M.petroleo, 1), `${M.petroleo >= M.prev.petroleo ? "▲" : "▼"} ${fmt(Math.abs(M.petroleo / M.prev.petroleo - 1) * 100, 1)}% · ${era.exportadorEnergia ? "sos exportador" : "sos importador"}`)}${kpi("Oro (onza)", "US$ " + n0(M.oro), `${M.oro >= M.prev.oro ? "▲" : "▼"} ${fmt(Math.abs(M.oro / M.prev.oro - 1) * 100, 1)}%`)}${kpi("Soja (tonelada)", "US$ " + n0(M.soja), `${M.soja >= M.prev.soja ? "▲" : "▼"} ${fmt(Math.abs(M.soja / M.prev.soja - 1) * 100, 1)}%`)}${kpi("Tasa de la Reserva del Norte", fmt(M.tasa, 2) + "%", M.tasa > M.base.tasa + 0.5 ? "Salen capitales de los emergentes" : "")}</div>
      ${crisisActivas().length ? `<p class="small"><b>Crisis en curso:</b> ${crisisActivas().map(c => CRISIS.find(x => x.id === c.id).titulo + ` (hasta el mes ${c.hasta})`).join("; ")}.</p>` : ""}`)}
    ${E.cambios.length ? bloque("Últimas decisiones", `<div class="log small">${E.cambios.slice(0, 6).map(c => `<div><span class="t">M${c.mes}</span>${esc(c.txt)}</div>`).join("")}</div>`) : ""}`;
}

// ---------- Cancillería ----------
function htmlCancilleria() {
  const M = mundo(), can = titularDe("Cancillería");
  const sel = UI.secSocios || {};
  const pend = M.onf.pendiente && RESOLUCIONES_ONF.find(r => r.id === M.onf.pendiente);
  return `${filaMinistro(can)}
    ${bloque("Relaciones bilaterales", `<table class="tally oficial"><thead><tr><th>País o bloque</th><th>Relación</th><th></th></tr></thead><tbody>${PAISES.map(p => { const v = relPais(p.id); return `<tr><td><b>${p.nombre}</b><br><span class="small muted">${p.desc}</span></td><td><span class="relbar"><i style="left:50%;width:${Math.abs(v) / 2}%;${v < 0 ? `left:${50 - Math.abs(v) / 2}%;background:var(--bad)` : "background:var(--good)"}"></i></span> ${pesosRelacion(v)} (${Math.round(v)})</td><td><button class="sec" data-visita="${p.id}">Visita oficial</button></td></tr>`; }).join("")}</tbody></table>`, "una visita ocupa un casillero")}
    ${bloque("Acuerdos y tratados", ACUERDOS.map(a => { const f = M.acuerdos.some(x => x.id === a.id), v = relPais(a.pais); return `<div class="prog ${f ? "on" : ""}"><div><b>${a.nombre}</b>${a.congreso ? ' <span class="tag">lo ratifica el Congreso</span>' : ""}<br><span class="small muted">${a.desc} Requiere relación ${a.min}+ con ${nombrePais(a.pais)} (hoy ${Math.round(v)}).</span></div>${f ? '<span class="small up-good">Vigente</span>' : `<button class="sec" data-acuerdo="${a.id}" ${v < a.min ? "disabled" : ""}>Firmar</button>`}</div>`; }).join(""))}
    ${bloque("Acuerdos reservados", `<p class="small muted">No pasan por el Congreso ni salen en el Boletín Oficial. Dan beneficios inmediatos, pero cada mes pueden filtrarse: escándalo, represalias de los rivales y, en algunos casos, una causa judicial.</p>
      ${SECRETOS.map(s => { const vig = M.secretos.find(x => x.id === s.id && !x.filtrado), fil = M.secretos.find(x => x.id === s.id && x.filtrado); return `<div class="prog secreto ${vig ? "on" : ""}"><div><b>${s.nombre}</b> <span class="tag">riesgo de filtración ${s.fuga >= 0.04 ? "alto" : s.fuga >= 0.03 ? "medio" : "bajo"}</span><br><span class="small muted">${s.desc}</span>
        ${vig ? `<br><span class="small">Vigente con ${vig.socios.map(nombrePais).join(", ")} desde el mes ${vig.mes}.</span>` : fil ? `<br><span class="small up-bad">Se filtró en su momento.</span>` : `<div class="row small" style="margin-top:4px">${s.socios.map(p => `<label><input type="${s.multi ? "checkbox" : "radio"}" name="soc_${s.id}" data-soc="${s.id}" value="${p}" ${(sel[s.id] || [s.socios[0]]).includes(p) ? "checked" : ""}> ${nombrePais(p)}</label>`).join("")}</div>`}</div>
        ${vig ? "" : `<button class="sec" data-secreto="${s.id}">Firmar en reserva</button>`}</div>`; }).join("")}`)}
    ${bloque(`${ONF.nombre} (${ONF.corto})`, `
      <div class="indicadores">${kpi("Prestigio en la ONF", Math.round(M.onf.prestigio) + "/100")}${kpi(ONF.consejo, M.onf.consejo ? "Miembro no permanente" : M.onf.candidatura ? "Candidatura en campaña" : "No es miembro", M.onf.consejo ? `hasta el mes ${M.onf.consejo.hasta}` : M.onf.candidatura ? `se vota en el mes ${M.onf.candidatura.votacion}` : "")}${kpi("Cascos azules", n0(M.onf.cascos), "efectivos en misiones de paz")}</div>
      ${pend ? `<div class="expediente" style="margin-top:10px"><h4>Votación pendiente${pend.consejo ? " en el " + ONF.consejo : " en la Asamblea General"}</h4><p>${esc(pend.texto)}</p><div class="row"><button data-onf="si">A favor</button><button class="sec" data-onf="abst">Abstención</button><button class="sec" data-onf="no">En contra</button></div></div>` : '<p class="small muted">No hay votaciones pendientes este mes.</p>'}
      ${!M.onf.consejo && !M.onf.candidatura ? `<button class="sec" id="bConsejo">Lanzar candidatura al ${ONF.consejo} (1 casillero)</button>` : ""}
      ${M.onf.votos.length ? `<h4 style="margin-top:10px">Últimos votos</h4><div class="log small">${M.onf.votos.slice(0, 5).map(v => `<div><span class="t">M${v.mes}</span>${{ si: "A favor", no: "En contra", abst: "Abstención" }[v.voto]}: ${esc(v.texto)} ${v.aprobada ? "(aprobada)" : "(rechazada)"}</div>`).join("")}</div>` : ""}`)}`;
}

// ---------- Conflictos e incertidumbre ----------
function htmlConflictos() {
  const act = conflictosActivos(), nac = S.fase === "gobierno";
  return `${bloque("Conflictos abiertos", act.length ? act.map((c, i) => { const C = CONFLICTOS.find(x => x.id === c.id); return `<div class="conflicto nivel${c.nivel}"><div class="row" style="justify-content:space-between"><b>${C.nombre}</b><span class="tag">${NIVELES[c.nivel]}</span></div>
      <div class="nivelbar">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= c.nivel ? "on" : ""}"></i>`).join("")}</div>
      <p class="small muted">${C.txt}${c.atendido ? " Este mes ya lo atendiste." : ""}</p>
      <div class="row"><button class="sec" data-conf="${i}" data-modo="dialogo">Mesa de diálogo</button>${C.conceder ? `<button class="sec" data-conf="${i}" data-modo="conceder">Ceder a los reclamos</button>` : ""}${C.reprimible ? `<button class="peligro" data-conf="${i}" data-modo="reprimir">Aplicar el protocolo</button>` : ""}${C.corrida && nac ? `<button class="sec" data-irtab="economia">Ir a Economía</button>` : ""}</div></div>`; }).join("") : '<p class="muted">No hay conflictos abiertos. La calle está tranquila, por ahora.</p>', "cada respuesta ocupa un casillero; si no hacés nada, escala")}
    ${bloque("Encuestas de imagen", S.encGob ? `<table class="tally"><tr><th>Consultora</th><th>Imagen positiva</th><th>Margen de error</th></tr>${S.encGob.map(e => `<tr><td>${e.nombre}</td><td>${fmt(e.imagen, 1)}%</td><td>±${fmt(e.error, 1)}</td></tr>`).join("")}<tr class="total"><td>Promedio</td><td>${fmt(imagenPublicada(), 1)}%</td><td></td></tr></table><p class="small muted">Cada consultora tiene su sesgo. El dato verdadero nadie lo conoce.</p>` : '<p class="small muted">Las primeras encuestas salen al cerrar el mes.</p>')}
    ${bloque("Rumores y versiones", (S.rumores || []).length ? `<div class="stack">${S.rumores.map(r => `<div class="rumor"><span class="small muted">M${r.mes} · fuente: ${r.fuente} · confianza ${r.confianza}</span><div>${esc(r.txt)}</div></div>`).join("")}</div><p class="small muted">Algunos son ciertos y otros son operaciones. No hay forma de saberlo de antemano.</p>` : '<p class="small muted">Sin versiones por ahora.</p>')}`;
}

function bindGestion(rerender) {
  const q = (s, f) => document.querySelectorAll(s).forEach(f);
  q("[data-min]", b => b.onclick = () => { UI.minSel = b.dataset.min; UI.verCand = null; rerender(); });
  q("[data-minvolver]", b => b.onclick = () => { UI.minSel = null; rerender(); });
  q("[data-irtab]", b => b.onclick = () => { UI.tabGob = b.dataset.irtab; rerender(); });
  q("[data-vercand]", b => b.onclick = () => { UI.verCand = b.dataset.vercand; rerender(); });
  q("[data-nombrar]", b => b.onclick = () => { UI.verCand = null; resGestion("Gabinete", reemplazarMinistro(b.dataset.nombrar, +b.dataset.cidx), rerender); });
  q("[data-prog]", b => b.onclick = () => resGestion("Resolución ministerial", toggleProgramaMin(b.dataset.prog, b.dataset.pid), rerender));
  q("[data-pal]", b => b.onclick = () => { fijarPalanca(b.dataset.pal, b.dataset.palid, b.dataset.op); rerender(); });
  const bi = $("#bInforme"); if (bi) bi.onclick = () => resGestion("Jefatura de Gabinete", informeGestion(), rerender);
  // economía
  const tm = $("#ecoTasaOk"); if (tm) tm.onclick = () => resGestion(BANCO_CENTRAL, fijarTasa($("#ecoTasaModo").value === "auto" ? "auto" : $("#ecoTasa").value), rerender);
  const rg = $("#ecoReg"); if (rg) rg.onchange = () => { $("#ecoRegDesc").textContent = REGIMENES[rg.value].desc; };
  const ro = $("#ecoRegOk"); if (ro) ro.onclick = () => resGestion("Régimen cambiario", cambiarRegimen($("#ecoReg").value), rerender);
  const co = $("#ecoCrawlOk"); if (co) co.onclick = () => { eco().crawl = R.clamp(+$("#ecoCrawl").value, 0, 30); rerender(); };
  q("[data-deval]", b => b.onclick = () => resGestion("Devaluación", devaluar(+b.dataset.deval), rerender));
  q("[data-interv]", b => b.onclick = () => resGestion(BANCO_CENTRAL, intervenir(+b.dataset.interv), rerender));
  q("[data-letras]", b => b.onclick = () => resGestion(BANCO_CENTRAL, moverLetras(+b.dataset.letras), rerender));
  q("[data-bono]", b => b.onclick = () => resGestion("Finanzas", colocarBono(b.dataset.bono), rerender));
  q("[data-quita]", b => b.onclick = () => resGestion("Reestructuración de deuda", reestructurar(+b.dataset.quita), rerender));
  const df = $("#ecoDefault"); if (df) df.onclick = () => {
    modal(`<h2>¿Declarar el default?</h2><p>Dejás de pagar la deuda en dólares con privados. Se frenan las salidas de reservas, pero se cierra el crédito, cae la inversión y el riesgo país se dispara. No se puede deshacer: solo se sale reestructurando.</p><div class="row" style="justify-content:flex-end"><button class="sec" id="mNo">Cancelar</button><button class="peligro" id="mSi">Declarar el default</button></div>`, "malo");
    $("#mNo").onclick = cerrarModal; $("#mSi").onclick = () => { cerrarModal(); resGestion("Default", declararDefault(), rerender); };
  };
  const fi = $("#ecoFin"); if (fi) fi.onchange = () => { eco().financiamiento = fi.value; rerender(); };
  const rf = $("#ecoRefi"); if (rf) rf.onchange = () => { eco().refinanciarUSD = rf.checked; };
  const su = $("#ecoSup"); if (su) su.onchange = () => { eco().superavit = su.value; };
  const pa = $("#ecoPauta"); if (pa) pa.onchange = () => { eco().pauta = pa.value; if (pa.value === "baja") moverActor("cgt", -8); if (pa.value === "alta") moverActor("cgt", 6); rerender(); };
  q("[data-impd]", s => s.oninput = () => { $("#impv_" + s.dataset.impd).textContent = s.value + "%"; });
  const io = $("#ecoImpOk"); if (io) io.onclick = () => { const c = {}; q("[data-impd]", s => c[s.dataset.impd] = +s.value); resGestion("Decreto impositivo", firmarImpuestos(c), rerender); };
  q("[data-implaw]", b => b.onclick = () => resGestion("Proyecto tributario", impuestoPorLey(b.dataset.implaw, b.dataset.dir), rerender));
  q("[data-prest]", b => b.onclick = () => resGestion("Financiamiento internacional", pedirPrestamo(b.dataset.prest), rerender));
  // cancillería
  q("[data-visita]", b => b.onclick = () => resGestion("Cancillería", visitaOficial(b.dataset.visita), rerender));
  q("[data-acuerdo]", b => b.onclick = () => resGestion("Cancillería", firmarAcuerdo(b.dataset.acuerdo), rerender));
  q("[data-soc]", i => i.onchange = () => { UI.secSocios = UI.secSocios || {}; UI.secSocios[i.dataset.soc] = [...document.querySelectorAll(`[data-soc="${i.dataset.soc}"]:checked`)].map(x => x.value); });
  q("[data-secreto]", b => b.onclick = () => { const id = b.dataset.secreto; const socios = [...document.querySelectorAll(`[data-soc="${id}"]:checked`)].map(x => x.value); resGestion("Acuerdo reservado", firmarSecreto(id, socios), rerender); });
  q("[data-onf]", b => b.onclick = () => resGestion(ONF.nombre, votarONF(b.dataset.onf), rerender));
  const bc = $("#bConsejo"); if (bc) bc.onclick = () => resGestion(ONF.nombre, candidaturaConsejo(), rerender);
  // conflictos
  q("[data-conf]", b => b.onclick = () => resGestion("Conflicto", responderConflicto(+b.dataset.conf, b.dataset.modo), rerender));
}
