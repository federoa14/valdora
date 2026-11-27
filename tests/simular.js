// Prueba de humo: juega partidas completas en los cuatro cargos sin navegador
// y falla si algo tira error. Uso: npm test
const fs = require("fs"), vm = require("vm"), path = require("path");
const J = path.join(__dirname, "..", "js");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const motor = [...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m => m[1]).filter(f => !f.startsWith("ui"));

function nuevo() {
  const ctx = { console, Math, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(motor.map(f => fs.readFileSync(path.join(J, f), "utf8")).join("\n") + "\nthis.get=()=>S;this.PROV=PROVINCIAS;", ctx);
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
console.log(res);
console.log("OK: sin errores en", Object.values(res).reduce((a, v) => a + v, 0), "partidas.");
