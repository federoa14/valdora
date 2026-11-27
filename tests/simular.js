// Prueba de humo: juega partidas completas en los cuatro cargos sin navegador
// y falla si algo tira error. Uso: npm test
const fs = require("fs"), vm = require("vm"), path = require("path");
const J = path.join(__dirname, "..", "js");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const motor = [...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m => m[1]).filter(f => !f.startsWith("ui"));

function nuevo() {
  const ctx = { console, Math, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(motor.map(f => fs.readFileSync(path.join(J, f), "utf8")).join("\n") + "\nthis.get=()=>S;this.PROV=PROVINCIAS;this.vm_semanas=()=>SEMANAS_CAMPANA;this.vm_interna=()=>SEMANA_INTERNA;", ctx);
  return ctx;
}
function campana(ctx) {
  const S = ctx.get(); let g = 0;
  const ids = ctx.PROV.map(p => p.id);
  while (S.fase === "campana" && !S.perdio && g++ < 40) {
    let t = 0;
    while (S.ap > 0 && t++ < 12) {
      const r = Math.random();
      if (S.tipoInterna === "avales" && !S.internaResuelta && (S.avales || 0) < S.avalesNecesarios && t < 8) ctx.ejecutarAccion("avales", {});
      else if (!S.internaResuelta && S.tipoInterna === "dedo" && t < 4) ctx.ejecutarAccion("lealtad", {});
      else if (!S.internaResuelta && S.tipoInterna === "cerrada" && t < 4) ctx.ejecutarAccion("comites", {});
      else if (S.jugador.plata < 1.5) ctx.ejecutarAccion("recaudar", {});
      else if (r < 0.6) ctx.ejecutarAccion("recorrida", { prov: ids[Math.floor(Math.random() * ids.length)] });
      else ctx.ejecutarAccion("militantes", {});
    }
    ctx.terminarSemana();
  }
}
function leyDelMes(ctx) {
  const cat = ctx.catalogoSegunCargo();
  const b = cat[Math.floor(Math.random() * cat.length)];
  ctx.presentarLey(ctx.redactarLey(b.id, { intensidad: "suave" }), {});
  const E = ctx.get().leyes;
  if (E && E.vetoPend) ctx.resolverVetoLey(["promulgar", "parcial", "vetar"][Math.floor(Math.random() * 3)]);
}

const res = {};
function anotar(k) { res[k] = (res[k] || 0) + 1; }

for (let i = 0; i < 16; i++) {
  // presidente
  let ctx = nuevo();
  ctx.iniciarPartida({ nombre: "A", ideo: 50, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, camino: "sumarse", partido: "UR", era: "hoy" });
  let S = ctx.get(); S.resultadoGeneral = ctx.resultadosNacionales(S.candidatos.filter(c => c.activo)); ctx.iniciarGobierno();
  for (let g = 0; !S.perdio && !S.terminoMandato && g < 60; g++) {
    if (S.decisionInicial) ctx.elegirMinistroEco("ortodoxo");
    (S.expedientes || []).forEach((e, j) => { if (!e.resuelto) ctx.resolverExpediente(j, 1); });
    leyDelMes(ctx);
    if (S.decisionPendiente) ctx.resolverDecision(S.decisionPendiente, S.decisionPendiente === "saqueos" ? "asistencia" : "aceptar");
    ctx.terminarTrimestre();
  }
  anotar("presidente " + (S.perdio ? "perdió" : "completó"));
  // gobernador, intendente y diputado
  for (const obj of ["gobernador", "intendente", "legislador"]) {
    ctx = nuevo();
    ctx.iniciarPartida({ nombre: "X", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, objetivo: obj, provincia: ["buenosaires", "cordoba", "tdf", "caba", "santiago", "mendoza", "salta", "chubut"][i % 8], ciudad: ["lamatanza", "laplata", "mardelplata", "bahiablanca", "quilmes", "cordoba", "mendoza", "tucuman"][i % 8], camino: i % 2 ? "fundar" : "sumarse", partido: "MNJ", nombrePartido: "Nuevo Rumbo", tipoInterna: null, era: "hoy" });
    S = ctx.get(); campana(ctx);
    // para probar el gobierno local aunque se pierda la elección, se asume igual
    if (obj !== "legislador" && S.resultadoGeneral && S.fase === "campana") { S.perdio = false; ctx.iniciarGobiernoLocal(); }
    if (S.perdio || S.fase === "campana") { anotar(obj + " perdió la campaña"); if (process.env.DEBUG) console.log(S.fase, S.motivoDerrota); continue; }
    for (let g = 0; !S.perdio && !S.terminoMandato && g < 60; g++) {
      if (obj === "legislador") {
        S.expLeg.forEach((e, j) => ctx.resolverExpBloque(j, 0));
        S.proyLeg.forEach((p, j) => ctx.resolverProyecto(j, "favor"));
        leyDelMes(ctx);
        ctx.finTrimestreLeg();
      } else {
        S.expedientesLocal.forEach((e, j) => { if (!e.resuelto) ctx.resolverExpLocal(j, 1); });
        leyDelMes(ctx);
        ctx.finTrimestreLocal();
      }
    }
    anotar(obj + " " + (S.perdio ? "perdió" : "completó"));
  }
}
// cada provincia y cada municipio: armar la Legislatura o el Concejo y gobernar un año con leyes
const PROVS = ["caba", "buenosaires", "catamarca", "cordoba", "corrientes", "chaco", "chubut", "entrerios", "formosa", "jujuy", "lapampa", "larioja", "mendoza", "misiones", "neuquen", "rionegro", "salta", "sanjuan", "sanluis", "santacruz", "santafe", "santiago", "tucuman", "tdf"];
const CIUDS = ["lamatanza", "laplata", "mardelplata", "bahiablanca", "quilmes", "cordoba", "mendoza", "tucuman"];
for (const [obj, lista] of [["gobernador", PROVS], ["intendente", CIUDS]]) for (const id of lista) {
  const ctx = nuevo();
  ctx.iniciarPartida({ nombre: "X", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, objetivo: obj, provincia: id, ciudad: id, camino: "sumarse", partido: "UR", tipoInterna: null, era: id === "santafe" ? "2001" : "hoy" });
  const S = ctx.get();
  S.resultadoGeneral = ctx.resultadosNacionales(S.candidatos.filter(c => c.activo));
  ctx.iniciarGobiernoLocal();
  const suma = o => Object.values(o).reduce((a, v) => a + v, 0);
  if (suma(S.leg) !== S.legTotal) throw new Error(`${id}: la Legislatura suma ${suma(S.leg)} y debería sumar ${S.legTotal}`);
  if (S.legSen && suma(S.legSen) !== S.legSenTotal) throw new Error(`${id}: el Senado suma ${suma(S.legSen)} y debería sumar ${S.legSenTotal}`);
  for (let g = 0; !S.perdio && !S.terminoMandato && g < 12; g++) {
    S.expedientesLocal.forEach((e, j) => { if (!e.resuelto) ctx.resolverExpLocal(j, 0); });
    leyDelMes(ctx);
    ctx.finTrimestreLocal();
  }
  anotar("territorio " + obj);
}

// ---------- Trayectoria: una carrera de dos partidas con el mismo personaje ----------
function assert(c, msg) { if (!c) throw new Error("Trayectoria: " + msg); }
{
  const ctx = nuevo();
  const base = { nombre: "Carrera", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, camino: "sumarse", partido: "UR", tipoInterna: null, era: "hoy" };
  ctx.iniciarPartida({ ...base, objetivo: "gobernador", provincia: "cordoba" });
  let S = ctx.get();
  S.resultadoGeneral = ctx.resultadosNacionales(S.candidatos.filter(c => c.activo));
  ctx.iniciarGobiernoLocal();
  for (let g = 0; !S.terminoMandato && g < 60; g++) {
    S.perdio = false; S.presLocal.obras = 15;
    S.expedientesLocal.forEach((e, j) => { if (!e.resuelto) ctx.resolverExpLocal(j, 0); });
    leyDelMes(ctx);
    ctx.finTrimestreLocal();
  }
  const legs = ctx.leerCarreras();
  assert(legs.length === 1, "no se guardó el legajo al terminar el mandato");
  const L = legs[0];
  assert(L.hitos.some(h => h.tipo === "cargo" || h.tipo === "inconcluso"), "falta el hito del cargo");
  assert(L.hitos.some(h => h.tipo === "obra"), "falta el hito de obras");
  // segunda partida: presidente con la trayectoria de exgobernador de Córdoba, contra un personaje nuevo
  const know = (cfg) => { ctx.iniciarPartida(cfg); const T = ctx.get(); return { cba: T.jugador.know.cordoba, jujuy: T.jugador.know.jujuy, tray: T.tray }; };
  const nuevoP = know({ ...base, objetivo: "presidente" });
  const conTray = know({ ...base, objetivo: "presidente", legajoId: L.id });
  assert(conTray.tray.partida === 2, "la segunda partida no continúa la carrera");
  assert(conTray.cba > nuevoP.cba + 0.05, `la trayectoria no suma conocimiento en Córdoba (${nuevoP.cba} → ${conTray.cba})`);
  assert(conTray.cba > conTray.jujuy, "el exgobernador debería ser más conocido en su provincia");
  // escándalos: restan más en la clase media que entre los informales
  const P = ctx.perfilDe([{ tipo: "escandalo", peso: 3, valor: -6, mult: "escandalo", nivel: "nacion", partida: 1 }, { tipo: "causa", peso: 3, valor: -6, mult: "escandalo", nivel: "nacion", partida: 1 }], 1);
  assert(P.grupos.media < P.grupos.informales && P.grupos.media < 0, "los escándalos deberían castigar más a la clase media");
  assert(P.reconocimiento > 0 && P.prestigio < 0, "un escándalo da conocimiento y resta prestigio");
  // cambio de partido en la tercera partida
  ctx.iniciarPartida({ ...base, objetivo: "intendente", ciudad: "cordoba", partido: "FC", legajoId: L.id });
  assert(ctx.get().tray.hitos.some(h => h.tipo === "cambio"), "no se registró el cambio de partido");
  // partida guardada vieja (sin trayectoria) se carga igual
  const st = JSON.parse(ctx.serializarPartida()); delete st.S.tray; delete st.S.precampana; st.S.candidatos.forEach(c => delete c.tray);
  assert(ctx.cargarTexto(JSON.stringify(st)).ok && ctx.get().tray, "no carga una partida guardada sin trayectoria");
  anotar("trayectoria carrera");
}
// ---------- Precampaña: 6 meses antes de la interna ----------
{
  const conoc = { 0: [], 6: [] };
  for (let i = 0; i < 6; i++) for (const pre of [0, 6]) {
    const ctx = nuevo();
    ctx.iniciarPartida({ nombre: "P", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, objetivo: "presidente", camino: "sumarse", partido: "UR", tipoInterna: "PASO", era: "hoy", precampana: pre });
    const S = ctx.get();
    assert(ctx.vm_semanas() === 12 + pre * 2, "el calendario no se alargó con la precampaña");
    // jugar hasta la víspera de las PASO
    while (S.semana < ctx.vm_interna() && !S.perdio) { while (S.ap > 0) { if (S.jugador.plata < 1) ctx.ejecutarAccion("recaudar", {}); else ctx.ejecutarAccion("recorrida", { prov: ctx.PROV[Math.floor(Math.random() * ctx.PROV.length)].id }); } ctx.terminarSemana(); }
    conoc[pre].push(ctx.conocimientoMedio(S.jugador));
    if (pre) { campana(ctx); assert(S.tray.hitos.some(h => h.tipo === "precampana") || S.perdio, "falta el hito de la precampaña"); }
    anotar("precampaña " + pre + " meses");
  }
  const prom = a => a.reduce((x, y) => x + y, 0) / a.length;
  assert(prom(conoc[6]) > prom(conoc[0]) + 0.03, `la precampaña no tracciona conocimiento (${prom(conoc[0]).toFixed(2)} → ${prom(conoc[6]).toFixed(2)})`);
  console.log("Conocimiento medio antes de las PASO: sin precampaña", Math.round(prom(conoc[0]) * 100) + "%, con 6 meses", Math.round(prom(conoc[6]) * 100) + "%");
}
console.log(res);
console.log("OK: sin errores en", Object.values(res).reduce((a, v) => a + v, 0), "partidas.");
