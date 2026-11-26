// =============================================================
//  VALDORA - Panel de partidas: tres ranuras, autoguardado,
//  exportar a archivo e importar desde archivo.
// =============================================================

function fechaCorta(iso) {
  if (!iso) return "fecha desconocida";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
function filaRanura(clave, titulo, conGuardar) {
  const m = leerMeta(clave);
  const desc = m ? `<b>${esc(m.nombre || "Sin nombre")}</b> · ${esc(m.cargo)}${m.territorio ? " de " + esc(m.territorio) : ""}<br><span class="small muted">${esc(m.fase)}, mes ${m.mes} · ${fechaCorta(m.fecha)}</span>` : `<span class="muted">Vacía</span>`;
  return `<tr><td><b>${titulo}</b></td><td>${desc}</td><td class="acc">
    ${conGuardar && S && !S.perdio && !S.terminoMandato ? `<button class="sec" data-gsave="${clave}">Guardar acá</button>` : ""}
    ${m ? `<button data-gload="${clave}">Cargar</button>` : ""}
    ${m && conGuardar ? `<button class="sec" data-gdel="${clave}" title="Borrar ranura">Borrar</button>` : ""}</td></tr>`;
}
function panelPartidas(aviso) {
  const activa = S && !S.perdio && !S.terminoMandato;
  const filas = [
    filaRanura(CLAVE_AUTO, "Autoguardado", false),
    ...CLAVES_RANURA.map((k, i) => filaRanura(k, "Ranura " + (i + 1), true)),
  ];
  if (leerMeta(CLAVE_VIEJA)) filas.push(filaRanura(CLAVE_VIEJA, "Guardado rápido", true));
  modal(`<h2>Partidas guardadas</h2>
    ${aviso ? `<p class="aviso-linea">${esc(aviso)}</p>` : ""}
    <p class="small muted">El juego se guarda solo al terminar cada mes. Las partidas quedan en este navegador; para pasarlas a otra computadora o al celular, exportalas como archivo e importalas allá.</p>
    <table class="tally ranuras">${filas.join("")}</table>
    <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">
      ${activa ? '<button class="sec" id="gExport">Exportar partida (.json)</button>' : ""}
      <button class="sec" id="gImport">Importar desde archivo</button>
      <input type="file" id="gFile" accept=".json,application/json" hidden>
      <span style="flex:1"></span><button class="sec" id="gCerrar">Cerrar</button>
    </div>`, "info");
  $("#gCerrar").onclick = cerrarModal;
  document.querySelectorAll("[data-gsave]").forEach(b => b.onclick = () => panelPartidas(guardarEn(b.dataset.gsave) ? "Partida guardada." : "No se pudo guardar: el navegador bloquea el almacenamiento o está lleno."));
  document.querySelectorAll("[data-gload]").forEach(b => b.onclick = () => { const r = cargarDe(b.dataset.gload); if (r.ok) { cerrarModal(); renderJuego(); } else panelPartidas(r.msg); });
  document.querySelectorAll("[data-gdel]").forEach(b => b.onclick = () => { borrarRanura(b.dataset.gdel); panelPartidas("Ranura borrada."); });
  const ex = $("#gExport");
  if (ex) ex.onclick = () => {
    const m = metaPartida();
    const nombre = `valdora-${(m.nombre || "partida").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}-mes${m.mes}.json`;
    const url = URL.createObjectURL(new Blob([serializarPartida()], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const fi = $("#gFile");
  $("#gImport").onclick = () => fi.click();
  fi.onchange = () => {
    const f = fi.files && fi.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { const r = cargarTexto(String(rd.result)); if (r.ok) { autoguardar(); cerrarModal(); renderJuego(); } else panelPartidas(r.msg); };
    rd.readAsText(f);
  };
}
