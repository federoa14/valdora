// Prueba de humo: juega partidas completas en los cuatro cargos sin navegador
// y falla si algo tira error. Uso: npm test
const fs = require("fs"), vm = require("vm"), path = require("path");
const J = path.join(__dirname, "..", "js");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const motor = [...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m => m[1]).filter(f => !f.startsWith("ui"));

function nuevo() {
  const ctx = { console, Math, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(motor.map(f => fs.readFileSync(path.join(J, f), "utf8")).join("\n") + "\nthis.get=()=>S;this.PROV=PROVINCIAS;this.CIUDADES_AR=CIUDADES_AR;", ctx);
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
  // gobernador, intendente, diputado y senador (por Entre Ríos con el foco activado)
  for (const obj of ["gobernador", "intendente", "legislador", "senador"]) {
    ctx = nuevo();
    ctx.iniciarPartida({ nombre: "X", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, objetivo: obj === "senador" ? "legislador" : obj, camaraLeg: obj === "senador" ? "sen" : "dip", provincia: ["buenosaires", "cordoba", "tdf", "caba", "santiago", "mendoza", "salta", "chubut"][i % 8], ciudad: ctx.CIUDADES_AR[i % ctx.CIUDADES_AR.length].id, camino: i % 2 ? "fundar" : "sumarse", partido: "MNJ", nombrePartido: "Nuevo Rumbo", tipoInterna: null, era: "hoy" });
    S = ctx.get(); campana(ctx);
    // para probar el gobierno local aunque se pierda la elección, se asume igual
    if (obj !== "legislador" && obj !== "senador" && S.resultadoGeneral && S.fase === "campana") { S.perdio = false; ctx.iniciarGobiernoLocal(); }
    // lo mismo para el Congreso: si la lista no entró, se asume con una banca para probar el mandato
    if ((obj === "legislador" || obj === "senador") && S.resultadoGeneral && S.fase === "campana") { S.perdio = false; S.bancasLista = { yo: 1 }; ctx.iniciarLegislatura(1); anotar(obj + " (entró a prueba)"); }
    if (S.perdio || S.fase === "campana") { anotar(obj + " perdió la campaña"); if (process.env.DEBUG) console.log(S.fase, S.motivoDerrota); continue; }
    for (let g = 0; !S.perdio && !S.terminoMandato && g < 60; g++) {
      if (obj === "legislador" || obj === "senador") {
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
const CIUDS = ["lamatanza", "laplata", "mardelplata", "bahiablanca", "quilmes", "cordoba", "mendoza", "tucuman", "parana", "concordia", "gualeguaychu", "cdeluruguay", "gualeguay", "victoria", "chajari", "villaguay", "lapaz", "colon"];
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
// el Congreso del legislador suma lo que debe: 257 en Diputados y 72 en el Senado
for (const cam of ["dip", "sen"]) {
  const ctx = nuevo();
  ctx.iniciarPartida({ nombre: "X", ideo: 45, carisma: 6, oratoria: 6, gestion: 6, negociacion: 6, objetivo: "legislador", camaraLeg: cam, camino: "sumarse", partido: "MNJ", tipoInterna: null, era: "hoy" });
  const S = ctx.get();
  if (ctx.PROV.length !== 17) throw new Error(`el mapa del legislador debería tener los 17 departamentos de Entre Ríos y tiene ${ctx.PROV.length}`);
  S.bancasLista = cam === "sen" ? { yo: 2, x: 1 } : { yo: 2 };
  S.candidatos.push({ id: "x", partido: "FC", activo: false });
  ctx.iniciarLegislatura(2);
  const tot = Object.values(S.cam).reduce((a, v) => a + v, 0);
  if (tot !== (cam === "sen" ? 72 : 257)) throw new Error(`${cam}: la cámara suma ${tot}`);
  anotar("congreso " + cam);
}
console.log(res);
console.log("OK: sin errores en", Object.values(res).reduce((a, v) => a + v, 0), "partidas.");
