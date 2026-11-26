// =============================================================
//  VALDORA - Catálogo de proyectos de ley
//  Inspirado en la historia legislativa argentina desde 1983,
//  con nombres y detalles ficticios. Cada proyecto sirve para
//  impulsarlo tal cual o como base para redactar uno propio.
//
//  ideo: 0 izquierda - 100 derecha · pop: opinión pública (-10 a 10)
//  costo: puntos de déficit (negativo = recauda)
//  ef: efectos sobre indicadores al promulgarse · grupos: simpatía
//  act: factores de poder · judicial: riesgo de inconstitucionalidad
//  materia: tributaria | electoral | constitucional | tratadoDDHH |
//           integracion | coparticipacion | magistratura | penal | comun
// =============================================================

const AREAS_LEY = {
  economia: "Economía y producción", tributaria: "Impuestos", laboral: "Trabajo", social: "Desarrollo social y previsión",
  seguridad: "Seguridad y defensa", penal: "Código Penal y Justicia", educacion: "Educación y ciencia", salud: "Salud",
  derechos: "Derechos civiles", electoral: "Sistema electoral y partidos", institucional: "Instituciones y transparencia",
  constitucional: "Reforma constitucional", ambiente: "Ambiente y energía", exterior: "Tratados internacionales", federal: "Federalismo y provincias",
};

function L(area, id, nombre, ideo, pop, ef, grupos, texto, x = {}) {
  return { area, id, nombre, ideo, pop, ef: ef || {}, grupos: grupos || {}, texto, costo: x.costo || 0, act: x.act || {}, judicial: x.judicial || 0, materia: x.materia || (area === "tributaria" ? "tributaria" : area === "penal" ? "penal" : "comun"), provincial: !!x.provincial, escala: "nacional", ...x };
}

const LEYES_CATALOGO = [
  // ---------- Economía y producción ----------
  L("economia", "convertibilidad2", "Ley de Convertibilidad monetaria", 72, 3, { inflacion: -3, crecimiento: 1, desempleo: 1.5, reservas: -2000 }, { media: 0.25, empresarios: 0.2, trabajadores: -0.1 }, "Fija por ley la paridad uno a uno y prohíbe emitir sin respaldo en reservas.", { act: { mercados: 15, cgt: -8 }, judicial: 0.05 }),
  L("economia", "emergenciaEco", "Emergencia económica y reforma del Estado", 68, -1, { deficit: -0.6, desempleo: 0.8, tension: 4 }, { estatales: -0.3, empresarios: 0.2 }, "Declara la emergencia, suspende subsidios y habilita privatizaciones y despidos en el Estado.", { act: { mercados: 10, cgt: -12 }, judicial: 0.2 }),
  L("economia", "basesInversion", "Régimen de incentivo a grandes inversiones", 76, -1, { crecimiento: 0.8, reservas: 3000, deficit: 0.1 }, { empresarios: 0.3, trabajadores: -0.05 }, "Treinta años de estabilidad fiscal, cambiaria y aduanera para inversiones de más de 200 millones.", { act: { mercados: 10, industria: -3, cgt: -4 }, judicial: 0.1 }),
  L("economia", "abastecimiento", "Ley de abastecimiento y control de precios", 22, 2, { inflacion: -0.5, crecimiento: -0.4 }, { informales: 0.15, empresarios: -0.3 }, "Habilita al Estado a fijar precios máximos, márgenes de ganancia y sancionar el desabastecimiento.", { act: { industria: -10, mercados: -6 }, judicial: 0.15 }),
  L("economia", "gondolas", "Ley de góndolas", 35, 4, { inflacion: -0.1 }, { informales: 0.05, media: 0.05, empresarios: -0.1 }, "Obliga a los supermercados a exhibir productos de pymes y limita el espacio de cada marca."),
  L("economia", "conocimiento", "Promoción de la economía del conocimiento", 58, 3, { crecimiento: 0.3, reservas: 800, deficit: 0.05 }, { jovenes: 0.15, empresarios: 0.1 }, "Beneficios fiscales para empresas de software, servicios profesionales y biotecnología que exporten."),
  L("economia", "expropiacionPetro", "Expropiación de la petrolera nacional", 25, 5, { reservas: -1500, crecimiento: 0.2, deuda: 2 }, { trabajadores: 0.15, empresarios: -0.2 }, "Declara de utilidad pública el 51% de las acciones de Petrolera Austral. Indemnización a fijar por tasación.", { act: { mercados: -12, norte: -8 }, judicial: 0.15 }),
  L("economia", "privatizaciones", "Privatización de empresas públicas", 82, -3, { deficit: -0.3, reservas: 2500, desempleo: 0.4 }, { estatales: -0.3, empresarios: 0.2 }, "Declara sujetas a privatización la aerolínea de bandera, el correo y la empresa de agua.", { act: { mercados: 12, cgt: -10 } }),
  L("economia", "pymeCredito", "Crédito a tasa subsidiada para pymes", 42, 5, { crecimiento: 0.3, desempleo: -0.3, deficit: 0.2 }, { empresarios: 0.1, trabajadores: 0.1 }, "Fondo de garantía y bonificación de tasas para capital de trabajo de pequeñas empresas.", { act: { industria: 6 } }),
  L("economia", "automotriz", "Régimen de promoción de autopartes", 40, 2, { crecimiento: 0.2, desempleo: -0.2, deficit: 0.1 }, { trabajadores: 0.15 }, "Reintegros a fabricantes que integren piezas nacionales.", { act: { industria: 8, cgt: 3 } }),
  L("economia", "zonaFranca", "Zona franca en el sur", 65, 1, { crecimiento: 0.15, deficit: 0.05 }, { empresarios: 0.1 }, "Exenciones aduaneras e impositivas para radicar industrias en la Patagonia.", { gob: 6 }),
  L("economia", "respFiscalNac", "Ley de responsabilidad fiscal", 70, 1, { deficit: -0.5, crecimiento: -0.2, legitimidad: 2 }, { media: 0.1, estatales: -0.1 }, "Prohíbe que el gasto primario crezca más que la inflación y obliga a superávit en los años de crecimiento.", { act: { mercados: 10, fmi: 8 } }),
  L("economia", "bancoCentral", "Independencia del Banco Central", 74, 0, { inflacion: -0.6, legitimidad: 1 }, { media: 0.1 }, "Prohíbe financiar al Tesoro y da mandato único de estabilidad de precios.", { act: { mercados: 12, fmi: 6 } }),
  L("economia", "fondoDeuda", "Aprobación del acuerdo con el Fondo", 62, -3, { reservas: 4000, deficit: -0.3, tension: 3 }, { media: 0.05, informales: -0.1 }, "Ratifica por ley el programa de facilidades extendidas y sus metas de déficit.", { act: { fmi: 15, mercados: 8, movimientos: -8 } }),
  // ---------- Impuestos ----------
  L("tributaria", "grandesFortunas", "Aporte extraordinario de las grandes fortunas", 22, 5, { deficit: -0.3, crecimiento: -0.1 }, { trabajadores: 0.1, empresarios: -0.35, informales: 0.1 }, "Aporte por única vez sobre patrimonios de más de 300 millones.", { costo: -0.3, act: { mercados: -8, prensa: -3 }, judicial: 0.2 }),
  L("tributaria", "gananciasCuarta", "Eliminación de Ganancias sobre salarios", 40, 7, { deficit: 0.4, imagen: 2 }, { trabajadores: 0.35, media: 0.2 }, "Exime del impuesto a las ganancias a todos los trabajadores en relación de dependencia.", { costo: 0.4, act: { cgt: 10, fmi: -6 } }),
  L("tributaria", "gananciasRepone", "Restitución de Ganancias a altos salarios", 64, -6, { deficit: -0.3 }, { trabajadores: -0.2, media: -0.2 }, "Vuelve a cobrar Ganancias a los sueldos más altos.", { costo: -0.3, act: { cgt: -10, fmi: 6 } }),
  L("tributaria", "retencionesMoviles", "Retenciones móviles a las exportaciones de granos", 25, -2, { deficit: -0.4, crecimiento: -0.2 }, { campo: -0.5, informales: 0.05 }, "Las retenciones suben y bajan automáticamente con el precio internacional.", { costo: -0.4, act: { campo: -25 }, gob: -6 }),
  L("tributaria", "bajaRetenciones", "Eliminación gradual de retenciones", 75, 1, { deficit: 0.4, crecimiento: 0.4, reservas: 1500 }, { campo: 0.4 }, "Baja las retenciones al agro 5 puntos por año hasta eliminarlas.", { costo: 0.4, act: { campo: 20 } }),
  L("tributaria", "ivaCanasta", "IVA cero a la canasta básica", 38, 8, { deficit: 0.3, pobreza: -1, inflacion: -0.2 }, { informales: 0.3, jubilados: 0.2 }, "Devuelve el IVA de los alimentos básicos a quienes cobran planes y jubilaciones.", { costo: 0.3 }),
  L("tributaria", "bienesPersonales", "Suba de Bienes Personales", 30, 2, { deficit: -0.15 }, { media: -0.15, empresarios: -0.15 }, "Alícuotas más altas para patrimonios grandes y bienes en el exterior.", { costo: -0.15 }),
  L("tributaria", "blanqueo", "Blanqueo de capitales", 66, -4, { reservas: 3000, deficit: -0.2, legitimidad: -3 }, { empresarios: 0.15, media: -0.1 }, "Permite declarar dólares no declarados pagando una tasa baja.", { costo: -0.2, act: { mercados: 6, prensa: -4 } }),
  L("tributaria", "monotributoSocial", "Monotributo social y simplificado", 45, 4, { desempleo: -0.2, pobreza: -0.3 }, { informales: 0.25 }, "Un régimen único y barato para formalizar changarines, cuentapropistas y cooperativas."),
  L("tributaria", "impuestoCheque", "Eliminación del impuesto al cheque", 74, 2, { deficit: 0.3, crecimiento: 0.2 }, { empresarios: 0.2, media: 0.05 }, "Elimina el impuesto a los débitos y créditos bancarios.", { costo: 0.3, gob: -4 }),
  L("tributaria", "consensoFiscal", "Reforma tributaria integral", 60, -1, { deficit: -0.1, crecimiento: 0.3 }, { empresarios: 0.15, trabajadores: -0.05 }, "Baja de contribuciones patronales, suba de impuestos internos y unificación de alícuotas.", { act: { industria: 6, cgt: -4 } }),
  // ---------- Trabajo ----------
  L("laboral", "reformaLaboral2", "Modernización laboral", 75, -3, { desempleo: -0.6, tension: 5 }, { empresarios: 0.3, trabajadores: -0.3 }, "Fondo de cese en lugar de indemnizaciones, período de prueba de seis meses y límites a la huelga en servicios esenciales.", { act: { cgt: -20, industria: 10, mercados: 8 }, judicial: 0.25 }),
  L("laboral", "teletrabajo", "Régimen de teletrabajo", 42, 4, {}, { jovenes: 0.15, trabajadores: 0.1, empresarios: -0.05 }, "Derecho a la desconexión, reversibilidad y compensación de gastos para quien trabaja desde su casa."),
  L("laboral", "plataformas", "Estatuto de trabajadores de plataformas", 35, 3, { desempleo: 0.1 }, { jovenes: 0.1, informales: 0.15, empresarios: -0.1 }, "Reconoce derechos laborales mínimos a repartidores y choferes de aplicaciones."),
  L("laboral", "dobleIndemnizacion", "Doble indemnización y prohibición de despidos", 18, 3, { desempleo: 0.2, crecimiento: -0.2 }, { trabajadores: 0.25, empresarios: -0.3 }, "Por 180 días, los despidos sin causa pagan el doble.", { act: { cgt: 12, industria: -10 }, judicial: 0.1 }),
  L("laboral", "salarioMinimo", "Aumento del salario mínimo por ley", 28, 6, { inflacion: 0.2, pobreza: -0.5, desempleo: 0.2 }, { trabajadores: 0.2, informales: 0.15 }, "Fija por ley un salario mínimo igual a la canasta básica.", { act: { cgt: 8, industria: -6 } }),
  L("laboral", "sindicatosDemocracia", "Democracia sindical y límite de mandatos", 70, 4, { legitimidad: 1 }, { trabajadores: 0.05, media: 0.15 }, "Elecciones con voto directo, límite de reelecciones y control de cuentas de los gremios.", { act: { cgt: -18 } }),
  L("laboral", "licencias", "Licencias parentales igualitarias", 32, 4, { deficit: 0.05 }, { jovenes: 0.2, trabajadores: 0.1 }, "Licencia de 90 días para madres y padres por igual."),
  // ---------- Desarrollo social y previsión ----------
  L("social", "movilidad2", "Nueva movilidad jubilatoria por salarios", 32, 6, { deficit: 0.5, tension: -2 }, { jubilados: 0.35 }, "Las jubilaciones se actualizan por salarios e inflación, la que sea mayor.", { costo: 0.5, act: { fmi: -8 } }),
  L("social", "reformaPrevisional", "Reforma previsional", 68, -6, { deficit: -0.4, tension: 5 }, { jubilados: -0.35, media: 0.05 }, "Cambia la fórmula de actualización y sube gradualmente la edad jubilatoria.", { costo: -0.4, act: { fmi: 10, cgt: -10, movimientos: -8 }, judicial: 0.15 }),
  L("social", "moratoria", "Moratoria previsional", 30, 4, { deficit: 0.3, pobreza: -0.6 }, { jubilados: 0.3, informales: 0.1 }, "Permite jubilarse a quienes no tienen los años de aportes, pagando la deuda en cuotas.", { costo: 0.3 }),
  L("social", "estatizacionJub", "Fin de las jubilaciones privadas", 28, 1, { deficit: -0.6, reservas: 1000, deuda: -3 }, { jubilados: 0.1, empresarios: -0.15 }, "Los fondos de las administradoras privadas pasan al sistema público de reparto.", { act: { mercados: -15 }, judicial: 0.1 }),
  L("social", "ingresoUniversal", "Asignación universal por hijo ampliada", 30, 5, { deficit: 0.4, pobreza: -1.5, tension: -2 }, { informales: 0.35 }, "Extiende la asignación por hijo a monotributistas y la actualiza por inflación.", { costo: 0.4, act: { movimientos: 10, iglesia: 6 } }),
  L("social", "emergenciaAlim2", "Emergencia alimentaria", 25, 7, { deficit: 0.2, pobreza: -0.6, tension: -2 }, { informales: 0.25 }, "Duplica las partidas para comedores comunitarios por dos años.", { costo: 0.2, act: { movimientos: 8, iglesia: 8 } }),
  L("social", "barrios", "Integración de barrios populares", 30, 3, { deficit: 0.2, pobreza: -0.5 }, { informales: 0.25 }, "Expropia las tierras de 4.000 barrios populares para urbanizarlas y entregar títulos.", { costo: 0.2, act: { movimientos: 10 }, judicial: 0.05 }),
  L("social", "discapacidad", "Emergencia en discapacidad", 35, 8, { deficit: 0.2 }, { jubilados: 0.1, media: 0.1 }, "Actualiza los aranceles de prestadores y las pensiones por invalidez.", { costo: 0.2 }),
  L("social", "alquileres2", "Nueva ley de alquileres", 35, 2, {}, { jovenes: 0.15, media: -0.05 }, "Contratos de tres años con actualización anual por un índice oficial.", { judicial: 0.05 }),
  L("social", "derogaAlquileres", "Libertad de contratación en alquileres", 76, 0, { crecimiento: 0.05 }, { jovenes: -0.05, media: 0.05 }, "Deroga la ley de alquileres: plazos y actualizaciones los pactan las partes."),
  // ---------- Seguridad y defensa ----------
  L("seguridad", "seguridadInterior", "Reforma de la Ley de Seguridad Interior", 72, 3, { inseguridad: -2, legitimidad: -1 }, { media: 0.1, informales: -0.05 }, "Permite a las Fuerzas Armadas dar apoyo logístico en la lucha contra el narcotráfico.", { act: { fuerzas: 12, movimientos: -6 }, judicial: 0.15 }),
  L("seguridad", "defensaFondo", "Fondo para la Defensa Nacional", 62, 2, { deficit: 0.15 }, { media: 0.05 }, "Asigna un porcentaje fijo del presupuesto a reequipar a las Fuerzas Armadas.", { costo: 0.15, act: { fuerzas: 15 } }),
  L("seguridad", "inteligencia", "Disolución de la agencia de inteligencia", 38, 4, { legitimidad: 3 }, { media: 0.15 }, "Crea un nuevo organismo con control parlamentario y pasa las escuchas a la Corte.", { act: { fuerzas: -5, corte: 5 } }),
  L("seguridad", "armas", "Desarme voluntario y control de armas", 35, 3, { inseguridad: -0.5 }, { media: 0.05 }, "Compra estatal de armas y controles más estrictos a la tenencia."),
  L("seguridad", "policiaFederal", "Policía federal de investigaciones", 60, 4, { inseguridad: -1.5, deficit: 0.1 }, { media: 0.1 }, "Una fuerza federal tipo agencia de investigación contra el crimen organizado.", { costo: 0.1, act: { fuerzas: 8 } }),
  // ---------- Código Penal y Justicia ----------
  L("penal", "imputabilidad2", "Baja de la edad de imputabilidad", 74, 4, { inseguridad: -0.5 }, { media: 0.15, informales: -0.05 }, "Baja de 16 a 14 años la edad para juzgar penalmente a menores.", { act: { iglesia: -6, movimientos: -6 }, judicial: 0.1 }),
  L("penal", "extincionDominio", "Extinción de dominio", 65, 6, { inseguridad: -0.5, legitimidad: 2 }, { media: 0.2 }, "El Estado recupera bienes de la corrupción y el narcotráfico sin esperar la condena.", { judicial: 0.3 }),
  L("penal", "juicioAusencia", "Juicio en ausencia para crímenes graves", 60, 4, { legitimidad: 1 }, { media: 0.1 }, "Permite juzgar a prófugos por atentados y crímenes de lesa humanidad.", { judicial: 0.25 }),
  L("penal", "puntoFinal", "Punto final para los juicios a militares", 78, -8, { legitimidad: -8, tension: 4 }, { media: -0.15, jovenes: -0.2 }, "Extingue las causas contra militares que no fueron citados en 60 días.", { act: { fuerzas: 20, movimientos: -15, prensa: -8 }, judicial: 0.4 }),
  L("penal", "nulidadAmnistia", "Nulidad de las leyes de amnistía", 25, 4, { legitimidad: 4 }, { jovenes: 0.15, media: 0.05 }, "Declara nulas las leyes que cerraron los juicios por la dictadura.", { act: { fuerzas: -15, corte: 4 }, judicial: 0.2 }),
  L("penal", "codigoPenal", "Nuevo Código Penal", 58, 3, { inseguridad: -0.8 }, { media: 0.1 }, "Unifica 900 leyes penales dispersas y endurece penas para delitos violentos."),
  L("penal", "narcomenudeo", "Desfederalización del narcomenudeo", 62, 3, { inseguridad: -0.8 }, { media: 0.05 }, "Las provincias que adhieran persiguen la venta minorista de drogas.", { provincial: true }),
  L("penal", "juradoNac", "Juicio por jurados", 50, 4, { legitimidad: 2 }, { media: 0.1 }, "Los delitos graves los juzgan doce ciudadanos sorteados."),
  // ---------- Educación y ciencia ----------
  L("educacion", "financiamientoEdu", "Financiamiento educativo: 6% del PBI", 35, 6, { deficit: 0.4 }, { jovenes: 0.2, estatales: 0.2 }, "Obliga a Nación y provincias a invertir el 6% del PBI en educación.", { costo: 0.4, provincial: true }),
  L("educacion", "financiamientoU2", "Financiamiento universitario", 30, 7, { deficit: 0.2 }, { jovenes: 0.25, estatales: 0.15 }, "Actualiza por inflación el presupuesto de las universidades nacionales.", { costo: 0.2 }),
  L("educacion", "aranceles", "Aranceles para estudiantes extranjeros", 68, 2, { deficit: -0.03 }, { media: 0.05, jovenes: -0.05 }, "Las universidades cobran a quienes no residen en el país.", { judicial: 0.1 }),
  L("educacion", "libertadEducativa", "Libertad educativa y vouchers", 80, -3, { deficit: -0.1 }, { media: 0.1, estatales: -0.25 }, "Financia a las familias en lugar de a las escuelas, que compiten por los alumnos.", { act: { cgt: -6, iglesia: 4 } }),
  L("educacion", "ciencia", "Financiamiento de la ciencia", 38, 4, { deficit: 0.1, crecimiento: 0.05 }, { jovenes: 0.1 }, "Lleva la inversión en ciencia al 1% del PBI en diez años.", { costo: 0.1 }),
  L("educacion", "esenciales", "Educación como servicio esencial", 70, 2, { tension: 2 }, { media: 0.15, estatales: -0.2 }, "Prohíbe los paros docentes que dejen las escuelas cerradas más de tres días.", { act: { cgt: -8 }, judicial: 0.2 }),
  // ---------- Salud ----------
  L("salud", "etiquetado", "Etiquetado frontal de alimentos", 40, 6, {}, { media: 0.1, empresarios: -0.1 }, "Octógonos negros en los envases con exceso de azúcar, sal o grasas.", { act: { industria: -4 } }),
  L("salud", "donacion", "Donante presunto de órganos", 45, 5, {}, { media: 0.05 }, "Todo mayor es donante salvo que exprese lo contrario."),
  L("salud", "saludMental2", "Reforma de la ley de salud mental", 62, 2, {}, { media: 0.05 }, "Facilita la internación involuntaria en casos de adicciones graves.", { judicial: 0.1 }),
  L("salud", "obrasSociales", "Libre elección de obra social", 74, 2, {}, { media: 0.1, trabajadores: 0.05 }, "Los trabajadores eligen cualquier obra social o prepaga con sus aportes.", { act: { cgt: -15 } }),
  L("salud", "medicamentos", "Medicamentos genéricos y precios de referencia", 36, 6, { inflacion: -0.05 }, { jubilados: 0.2 }, "Receta por nombre genérico y precios máximos para remedios esenciales.", { act: { industria: -5 } }),
  L("salud", "cannabisMed", "Cannabis medicinal y autocultivo", 30, 1, {}, { jovenes: 0.1, media: -0.02 }, "Autoriza el autocultivo registrado y la producción pública de aceite."),
  // ---------- Derechos civiles ----------
  L("derechos", "divorcio", "Divorcio vincular", 40, 3, {}, { media: 0.1, jovenes: 0.1 }, "Habilita el divorcio con posibilidad de volver a casarse.", { act: { iglesia: -10 } }),
  L("derechos", "matrimonio", "Matrimonio igualitario", 30, 2, {}, { jovenes: 0.2, media: 0.02 }, "Las parejas del mismo sexo pueden casarse con los mismos derechos.", { act: { iglesia: -15 } }),
  L("derechos", "identidad", "Ley de identidad de género", 28, 1, {}, { jovenes: 0.15 }, "Cambio de nombre y sexo registral por trámite administrativo.", { act: { iglesia: -8 } }),
  L("derechos", "interrupcion", "Interrupción voluntaria del embarazo", 28, 0, {}, { jovenes: 0.25, media: -0.05 }, "Legaliza el aborto hasta la semana 14 en el sistema de salud.", { act: { iglesia: -25 }, judicial: 0.05 }),
  L("derechos", "derogaInterrupcion", "Derogación de la ley de aborto", 85, -2, {}, { jovenes: -0.25, media: -0.05 }, "Vuelve al régimen de causales.", { act: { iglesia: 20 } }),
  L("derechos", "capacitacionGenero", "Capacitación obligatoria en género", 32, 3, {}, { jovenes: 0.1 }, "Formación obligatoria en violencia de género para los tres poderes del Estado."),
  L("derechos", "cupoLaboral", "Cupo laboral para personas trans", 25, 0, {}, { jovenes: 0.1 }, "El 1% de los cargos del Estado para personas travestis y trans."),
  L("derechos", "accesoInfo", "Acceso a la información pública", 52, 5, { legitimidad: 3 }, { media: 0.15 }, "Cualquiera puede pedir información al Estado y debe recibir respuesta en 15 días.", { act: { prensa: 10 } }),
  L("derechos", "mediosAudiovisual", "Ley de servicios audiovisuales", 25, -1, { legitimidad: -1 }, { media: -0.05 }, "Limita la cantidad de licencias por grupo y obliga a desinvertir a los multimedios.", { act: { prensa: -20 }, judicial: 0.3 }),
  // ---------- Sistema electoral y partidos ----------
  L("electoral", "boletaUnica2", "Boleta única de papel", 62, 4, { legitimidad: 2 }, { media: 0.1 }, "Una sola boleta con todos los candidatos, impresa por el Estado.", { materia: "electoral" }),
  L("electoral", "eliminarPASO", "Eliminación de las PASO", 66, 2, { deficit: -0.02 }, { media: 0.05 }, "Las primarias dejan de ser obligatorias: cada partido elige como quiera.", { materia: "electoral" }),
  L("electoral", "voto16", "Voto optativo desde los 16 años", 30, 0, {}, { jovenes: 0.2 }, "Amplía el padrón a los jóvenes de 16 y 17 años.", { materia: "electoral" }),
  L("electoral", "paridad", "Paridad de género en las listas", 35, 3, { legitimidad: 1 }, { jovenes: 0.05 }, "Las listas deben alternar varones y mujeres desde el primer lugar.", { materia: "electoral" }),
  L("electoral", "fichaLimpia2", "Ficha limpia", 60, 7, { legitimidad: 3 }, { media: 0.2 }, "Impide ser candidato a quien tenga condena por corrupción confirmada en segunda instancia.", { materia: "electoral", judicial: 0.15 }),
  L("electoral", "financiamientoPart", "Financiamiento transparente de campañas", 50, 5, { legitimidad: 2 }, { media: 0.1 }, "Aportes de empresas permitidos pero bancarizados y publicados en tiempo real.", { materia: "electoral" }),
  L("electoral", "votoElectronico", "Voto electrónico", 60, -1, {}, { jovenes: 0.05 }, "Urnas electrónicas en todo el país.", { materia: "electoral", judicial: 0.1 }),
  // ---------- Instituciones y transparencia ----------
  L("institucional", "consejoMag", "Reforma del Consejo de la Magistratura", 40, -2, { legitimidad: -2 }, { media: -0.05 }, "Cambia la composición: más legisladores, menos jueces y abogados.", { materia: "magistratura", act: { corte: -15 }, judicial: 0.4 }),
  L("institucional", "ampliaCorte", "Ampliación de la Corte Suprema a nueve miembros", 40, -4, { legitimidad: -3 }, { media: -0.1 }, "Suma cuatro jueces a la Corte Suprema.", { act: { corte: -15, prensa: -5 }, efectoCorte: true }),
  L("institucional", "eticaPublica", "Ley de ética pública y conflictos de interés", 55, 6, { legitimidad: 3 }, { media: 0.15 }, "Declaraciones juradas públicas y período de enfriamiento para funcionarios que vienen del sector privado.", { act: { prensa: 6 } }),
  L("institucional", "lobby", "Registro de lobby", 55, 3, { legitimidad: 2 }, { media: 0.05 }, "Las reuniones de funcionarios con privados se registran y publican."),
  L("institucional", "dnuLimite", "Límites a los decretos de necesidad y urgencia", 50, 3, { legitimidad: 2 }, { media: 0.1 }, "Si una cámara rechaza un DNU, cae. Antes hacían falta las dos.", { limitaDNU: true }),
  L("institucional", "delegacion2", "Delegación de facultades al Ejecutivo", 65, -2, { legitimidad: -2 }, {}, "El Congreso delega facultades en materia económica por un año (art. 76).", { judicial: 0.15, delegacion: true }),
  L("institucional", "ministerios", "Nueva ley de ministerios", 55, 0, { deficit: -0.03 }, {}, "Reduce de 20 a 9 los ministerios."),
  // ---------- Reforma constitucional ----------
  L("constitucional", "reformaReeleccion", "Necesidad de reforma: reelección presidencial", 50, -5, { legitimidad: -4 }, { media: -0.1 }, "Declara la necesidad de reformar la Constitución para permitir una reelección más.", { materia: "constitucional", act: { prensa: -8 } }),
  L("constitucional", "reformaFederal", "Necesidad de reforma: autonomía municipal y régimen federal", 45, 1, { legitimidad: 2 }, {}, "Convoca a Convención Constituyente para reformar el régimen federal y la coparticipación.", { materia: "constitucional", gob: 8 }),
  L("constitucional", "unicameral", "Necesidad de reforma: Congreso unicameral", 70, 0, { deficit: -0.02 }, { media: 0.05 }, "Propone eliminar el Senado y crear una sola cámara.", { materia: "constitucional", gob: -15 }),
  // ---------- Ambiente y energía ----------
  L("ambiente", "glaciares", "Protección de glaciares", 30, 5, { crecimiento: -0.1 }, { jovenes: 0.15 }, "Prohíbe la minería en glaciares y zonas periglaciares.", { gob: -6 }),
  L("ambiente", "humedales2", "Ley de humedales", 30, 4, { crecimiento: -0.05 }, { jovenes: 0.1, campo: -0.1 }, "Inventario y protección de humedales frente a desarrollos inmobiliarios y agrícolas.", { act: { campo: -6 } }),
  L("ambiente", "bosques", "Presupuestos mínimos de bosques nativos", 35, 4, {}, { jovenes: 0.1, campo: -0.05 }, "Ordenamiento territorial y fondo para conservar bosques.", { provincial: true }),
  L("ambiente", "fuego", "Manejo del fuego", 35, 3, {}, { jovenes: 0.05 }, "Prohíbe cambiar el uso del suelo de tierras incendiadas por 30 años.", { act: { campo: -4 } }),
  L("ambiente", "biocombustibles", "Régimen de biocombustibles", 50, 2, { crecimiento: 0.1 }, { campo: 0.1 }, "Corte obligatorio de naftas y gasoil con biodiésel y bioetanol.", { gob: 4 }),
  L("ambiente", "hidrocarburos", "Nueva ley de hidrocarburos", 68, 0, { crecimiento: 0.3, reservas: 2000 }, { empresarios: 0.15 }, "Concesiones más largas y libre exportación para el petróleo no convencional.", { act: { mercados: 6 }, gob: 5 }),
  L("ambiente", "litio", "Litio como recurso estratégico", 30, 3, { crecimiento: -0.05 }, { trabajadores: 0.05 }, "Una empresa estatal participa en toda explotación de litio.", { gob: -8, judicial: 0.2 }),
  L("ambiente", "renovables", "Energías renovables", 45, 4, { crecimiento: 0.1, deficit: 0.05 }, { jovenes: 0.1 }, "El 20% de la electricidad debe venir de fuentes renovables en 2030."),
  // ---------- Tratados internacionales ----------
  L("exterior", "tratadoUCon", "Tratado de libre comercio con la Unión Continental", 66, 1, { crecimiento: 0.4 }, { campo: 0.2, trabajadores: -0.1 }, "Baja de aranceles en diez años con el bloque europeo.", { materia: "integracion", act: { campo: 10, industria: -10 } }),
  L("exterior", "pactoDDHH", "Convención sobre derechos de las personas mayores", 40, 3, {}, { jubilados: 0.1 }, "Da jerarquía constitucional a un tratado de derechos humanos.", { materia: "tratadoDDHH" }),
  L("exterior", "bilateralNorte", "Acuerdo de cooperación militar con la Federación del Norte", 72, -1, {}, {}, "Ejercicios conjuntos y venta de equipamiento.", { materia: "tratado", act: { norte: 12, fuerzas: 6 } }),
  L("exterior", "bilateralEste", "Acuerdo de inversiones con la República Popular del Este", 35, 0, { reservas: 2000 }, {}, "Represas, trenes y una estación espacial a cambio de financiamiento.", { materia: "tratado", act: { norte: -12 } }),
  L("exterior", "mercosurSur", "Arancel externo común con Brasilia del Sur", 45, 1, { crecimiento: 0.1 }, { trabajadores: 0.05 }, "Profundiza la unión aduanera regional.", { materia: "integracion", act: { industria: 4 } }),
  // ---------- Federalismo y provincias ----------
  L("federal", "coparticipacion", "Nueva ley de coparticipación federal", 45, 1, { deficit: 0.1 }, {}, "Redistribuye los impuestos entre Nación y provincias con criterios objetivos.", { materia: "coparticipacion", gob: 15 }),
  L("federal", "pactoFiscal", "Pacto fiscal con las provincias", 60, 0, { deficit: -0.1 }, {}, "Las provincias bajan ingresos brutos a cambio de compensaciones.", { gob: 6, provincial: true }),
  L("federal", "fondoSojero", "Fondo federal solidario", 35, 3, { deficit: 0.1 }, {}, "El 30% de las retenciones va a provincias y municipios para obras.", { gob: 12, costo: 0.1 }),
  L("federal", "capitalTraslado", "Traslado de la Capital al interior", 50, -2, { deficit: 0.2 }, {}, "Muda la capital federal a una ciudad del sur.", { gob: 5, costo: 0.2 }),
  L("federal", "autonomiaCapital", "Traspaso de la justicia ordinaria a la Capital", 55, 1, {}, {}, "La ciudad capital recibe sus juzgados y su policía.", { gob: 2 }),
];

// ---------- Leyes provinciales ----------
function LP(id, nombre, ideo, pop, ef, texto, x = {}) {
  return { area: x.area || "provincial", id, nombre, ideo, pop, ef: ef || {}, grupos: {}, texto, costo: x.costo || 0, act: {}, judicial: x.judicial || 0, materia: x.materia || "comun", escala: "provincial", mayoria: x.mayoria, ...x };
}
const LEYES_PROVINCIALES = [
  LP("codigoFiscalProv", "Reforma del código fiscal", 58, -2, { caja: 8, desempleo: 0.3 }, "Sube ingresos brutos a grandes empresas y baja a pymes.", { area: "tributaria" }),
  LP("bajaIIBB", "Baja de ingresos brutos", 70, 3, { caja: -8, desempleo: -0.5 }, "Reduce la alícuota de ingresos brutos a la industria y el comercio.", { area: "tributaria" }),
  LP("inmobiliarioRural", "Revalúo del inmobiliario rural", 30, -1, { caja: 6 }, "Actualiza las valuaciones fiscales del campo.", { area: "tributaria" }),
  LP("policiaProv", "Ley de seguridad pública provincial", 66, 4, { inseguridad: -3, caja: -3 }, "Crea una policía de investigaciones y amplía los patrulleros.", { area: "seguridad" }),
  LP("estatutoDocente", "Nuevo estatuto docente", 62, -1, { servicios: 2, tension: 3 }, "Presentismo, evaluación y concursos para cargos directivos.", { area: "educacion" }),
  LP("hospitalesAut", "Autarquía de los hospitales", 60, 1, { servicios: 2, caja: 2 }, "Los hospitales cobran a obras sociales y prepagas por los pacientes con cobertura.", { area: "salud" }),
  LP("emergenciaProv", "Emergencia económica provincial", 55, -2, { caja: 10, tension: 4, legitimidad: -2 }, "Congela vacantes, suspende ascensos y habilita a reestructurar deudas.", { area: "economia" }),
  LP("bonosLey", "Emisión de bonos de cancelación de deudas", 45, -4, { caja: 15, legitimidad: -3, pobreza: 0.5 }, "Autoriza a emitir una cuasimoneda provincial para pagar sueldos y proveedores.", { area: "economia" }),
  LP("endeudamientoProv", "Autorización de endeudamiento", 55, -1, { caja: 20, deuda: 12 }, "Autoriza a tomar 500 millones de dólares en el mercado internacional.", { area: "economia", mayoria: "dosTercios" }),
  LP("reformaConstProv", "Necesidad de reforma de la Constitución provincial", 50, -3, { legitimidad: -4 }, "Convoca a Convención Constituyente: reelección, Legislatura unicameral y autonomía municipal.", { area: "constitucional", mayoria: "dosTercios", reeleccion: true }),
  LP("lemas", "Ley de lemas", 45, -2, { legitimidad: -2 }, "Cada partido presenta varios sublemas y se suman los votos.", { area: "electoral", mayoria: "absoluta" }),
  LP("boletaUnicaProv", "Boleta única provincial", 60, 4, { legitimidad: 2 }, "Boleta única de papel para las elecciones provinciales.", { area: "electoral", mayoria: "absoluta" }),
  LP("mineriaProv", "Prohibición de la minería con cianuro", 30, 4, { desempleo: 0.3, caja: -3 }, "Prohíbe la minería metalífera a cielo abierto con sustancias tóxicas.", { area: "ambiente" }),
  LP("adhesionRigiProv", "Adhesión al régimen de grandes inversiones", 70, 0, { desempleo: -1, caja: 5 }, "Adhiere al régimen nacional y otorga estabilidad fiscal provincial.", { area: "federal" }),
  LP("adhesionNarco", "Adhesión a la desfederalización del narcomenudeo", 62, 3, { inseguridad: -2, caja: -2 }, "La policía y la justicia provinciales persiguen la venta minorista de drogas.", { area: "federal" }),
  LP("coparticipacionMun", "Nueva coparticipación a municipios", 40, 2, { caja: -6, servicios: 2 }, "Más fondos automáticos para los intendentes, menos discrecionalidad.", { area: "federal" }),
  LP("tarifaSocialProv", "Tarifa social de luz y agua", 30, 6, { caja: -5, pobreza: -0.8, tension: -2 }, "Descuentos en las facturas de la empresa provincial para hogares vulnerables.", { area: "social" }),
  LP("juradosProv", "Juicio por jurados provincial", 50, 4, { legitimidad: 2 }, "Los delitos graves los deciden jurados populares.", { area: "penal" }),
];

// ---------- Ordenanzas municipales ----------
const ORDENANZAS = [
  LP("tasaVial", "Tasa vial a los combustibles", 40, -3, { caja: 6, servicios: 1 }, "Un cargo por litro de combustible para financiar el bacheo.", { area: "tributaria", escala: "municipal" }),
  LP("moratoriaTasas", "Moratoria de tasas municipales", 45, 4, { caja: 4, legitimidad: -1 }, "Plan de pagos y condonación de intereses a vecinos deudores.", { area: "tributaria", escala: "municipal" }),
  LP("presupuestoParticipativo", "Presupuesto participativo", 35, 5, { legitimidad: 3, servicios: 1 }, "Los vecinos deciden en asambleas el destino del 5% del presupuesto.", { area: "institucional", escala: "municipal" }),
  LP("camaras", "Plan de videovigilancia", 62, 5, { inseguridad: -2, caja: -3 }, "Doscientas cámaras con centro de monitoreo.", { area: "seguridad", escala: "municipal" }),
  LP("guardiaUrbana", "Guardia urbana municipal", 66, 2, { inseguridad: -1.5, caja: -3, tension: 1 }, "Un cuerpo de agentes municipales para controlar el espacio público.", { area: "seguridad", escala: "municipal" }),
  LP("ruidosNoche", "Ordenanza de nocturnidad", 62, 1, { inseguridad: -0.5 }, "Los boliches cierran a las 5 y se prohíbe vender alcohol en kioscos de noche.", { area: "seguridad", escala: "municipal" }),
  LP("plasticos", "Prohibición de bolsas plásticas", 35, 3, {}, "Los comercios no pueden entregar bolsas de plástico.", { area: "ambiente", escala: "municipal" }),
  LP("reciclado", "Separación en origen y reciclado", 38, 4, { servicios: 2, caja: -2 }, "Recolección diferenciada y planta de reciclado con cooperativas.", { area: "ambiente", escala: "municipal" }),
  LP("codigoUrbano", "Nuevo código urbano", 65, -1, { caja: 5, servicios: -1 }, "Permite edificios más altos en el centro a cambio de un cargo por plusvalía.", { area: "economia", escala: "municipal" }),
  LP("ferias", "Regulación de ferias populares", 40, 2, { desempleo: -0.2 }, "Habilita ferias de emprendedores en plazas con un registro municipal.", { area: "economia", escala: "municipal" }),
  LP("apps", "Regulación de aplicaciones de transporte", 60, 3, { caja: 1 }, "Las aplicaciones de viajes se registran y pagan una tasa.", { area: "economia", escala: "municipal" }),
  LP("boletoEstudiantil", "Boleto estudiantil gratuito", 30, 7, { caja: -4, tension: -1 }, "Transporte gratis para estudiantes de todos los niveles.", { area: "social", escala: "municipal" }),
  LP("adhesionSeguridadNac", "Adhesión al plan nacional de seguridad", 58, 2, { inseguridad: -1, caja: 2 }, "Adhiere al plan de la Nación para recibir patrulleros y cámaras.", { area: "federal", escala: "municipal" }),
  LP("endeudamientoMun", "Autorización de endeudamiento municipal", 55, -2, { caja: 15, deuda: 8 }, "Crédito para obras de cloacas y asfalto.", { area: "economia", escala: "municipal", mayoria: "dosTercios" }),
];
