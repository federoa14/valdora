// =============================================================
//  VALDORA - Gobierno profundo: factores de poder, gabinete y
//  expedientes del despacho presidencial (dilemas).
// =============================================================

// Factores de poder. "ideo" sirve para la relación inicial con el presidente.
// Cuando la relación cae debajo de 25 el actor reacciona en contra; arriba de 75 ayuda.
const ACTORES = [
  { id: "cgt",        nombre: "CGT y sindicatos",       ideo: 35, contra: "Paro general y plan de lucha",        ef: { crecimiento: -0.3, tension: 6, imagen: -2 },      pro: "Tregua sindical y paritarias moderadas", efPro: { tension: -3, inflacion: -0.2 } },
  { id: "campo",      nombre: "Mesa del campo",         ideo: 72, contra: "Lockout y retención de la cosecha",   ef: { reservas: -2000, crecimiento: -0.3, imagen: -1 }, pro: "Liquidación récord de la cosecha",       efPro: { reservas: 1500 } },
  { id: "industria",  nombre: "Unión Industrial",       ideo: 55, contra: "Suspensiones y despidos en fábricas", ef: { desempleo: 0.4, crecimiento: -0.2 },              pro: "Anuncio de inversiones industriales",    efPro: { crecimiento: 0.3, desempleo: -0.2 } },
  { id: "mercados",   nombre: "Bancos y mercados",      ideo: 75, contra: "Corrida cambiaria y suba del riesgo país", ef: { reservas: -3000, inflacion: 0.8 },          pro: "Baja el riesgo país y vuelve el crédito", efPro: { reservas: 2000, crecimiento: 0.2 } },
  { id: "movimientos",nombre: "Movimientos sociales",   ideo: 25, contra: "Cortes de accesos y acampe en la Plaza", ef: { tension: 6, imagen: -2 },                    pro: "Contienen la protesta en los barrios",  efPro: { tension: -4 } },
  { id: "iglesia",    nombre: "Iglesia y obispos",      ideo: 50, contra: "Documento episcopal crítico",         ef: { imagen: -2, legitimidad: -1 },                    pro: "Mesa de diálogo social",                efPro: { tension: -2, legitimidad: 1 } },
  { id: "fuerzas",    nombre: "Fuerzas de seguridad",   ideo: 65, contra: "Acuartelamiento por salarios",        ef: { inseguridad: 6, legitimidad: -3 },                pro: "Operativos exitosos",                   efPro: { inseguridad: -3 } },
  { id: "prensa",     nombre: "Grandes medios",         ideo: 60, contra: "Campaña de tapas en contra",          ef: { imagen: -3 },                                     pro: "Cobertura amable",                      efPro: { imagen: 2 } },
  { id: "corte",      nombre: "Corte Suprema",          ideo: 55, contra: "Fallos contra el gobierno",           ef: { legitimidad: -3 },                                pro: "La Corte convalida tus decisiones",     efPro: { legitimidad: 2 } },
  { id: "fmi",        nombre: "Fondo Monetario Internacional", ideo: 78, contra: "El Fondo endurece su postura",  ef: { reservas: -1000, inflacion: 0.3 },                pro: "El Fondo flexibiliza metas",            efPro: { reservas: 1000 } },
  { id: "norte",      nombre: "Federación del Norte",   ideo: 70, contra: "Presión diplomática y sanciones",     ef: { reservas: -1500, crecimiento: -0.2 },             pro: "Apoyo en organismos de crédito",        efPro: { reservas: 1500 } },
];

// Qué actores se mueven cuando una medida afecta a un grupo social
const GRUPO_A_ACTOR = { trabajadores: ["cgt"], estatales: ["cgt"], campo: ["campo"], empresarios: ["industria", "mercados"], informales: ["movimientos"], media: ["prensa"], jubilados: ["iglesia"] };

// Perfiles de ministro de Economía: primera decisión del mandato
const PERFILES_ECONOMIA = [
  { id: "ortodoxo",   nombre: "Lic. Fermín Sturla", titulo: "técnico ortodoxo, ex funcionario del Fondo", desc: "Baja la inflación y calma a los mercados; los sindicatos lo detestan.",
    inflacion: -0.35, crecimiento: -0.1, act: { mercados: 20, fmi: 20, cgt: -15, movimientos: -10 } },
  { id: "heterodoxo", nombre: "Dr. Ezequiel Montalbán", titulo: "economista heterodoxo", desc: "Prioriza consumo y empleo; desconfianza de mercados y del Fondo.",
    inflacion: 0.25, crecimiento: 0.25, act: { cgt: 15, movimientos: 10, mercados: -20, fmi: -15 } },
  { id: "politico",   nombre: "Sergio Bellomo", titulo: "político con llegada a todos", desc: "Sin dogmas. Negocia con gobernadores y empresarios, pero sin plan claro.",
    inflacion: 0, crecimiento: 0.05, act: { industria: 10, cgt: 5 }, gob: 10 },
];

const GABINETE_BASE = [
  { cargo: "Jefe de Gabinete", nombre: "Marcela Ugalde",  comp: 6 },
  { cargo: "Interior",         nombre: "Rubén Solari",       comp: 6 },
  { cargo: "Seguridad",        nombre: "Patricia Larrea",   comp: 6 },
  { cargo: "Desarrollo Social",nombre: "Carlos Iturrieta", comp: 5 },
  { cargo: "Cancillería",      nombre: "Diana Calvento",    comp: 6 },
];

// -------------------------------------------------------------
//  EXPEDIENTES DEL DESPACHO
//  ind: efecto inmediato en indicadores · act: relación con factores de poder
//  grp: simpatía de grupos · gob: relación con todos los gobernadores
//  dif: consecuencias diferidas [{en: trimestres, texto, ind, act}]
//  fx: mecánica especial resuelta en gobierno2.js
// -------------------------------------------------------------
const DILEMAS = [
  { id: "paritariaDocente", titulo: "Paro docente nacional", peso: 3,
    texto: "Los gremios docentes reclaman un 40% de aumento. Las clases no empiezan en diez provincias y los padres se movilizan.",
    opciones: [
      { t: "Dar el aumento con fondos nacionales", pista: "Gasto alto, conflicto cerrado", ind: { deficit: 0.3, tension: -3 }, act: { cgt: 10 }, grp: { estatales: 0.3, media: 0.1 }, gob: 8 },
      { t: "Ofrecer 20% y descontar los días de paro", pista: "Duro con los gremios; la clase media lo aplaude", ind: { tension: 4, imagen: 1 }, act: { cgt: -15, prensa: 5 }, grp: { estatales: -0.4, media: 0.15 },
        dif: [{ en: 1, texto: "El conflicto docente se extiende: marcha federal educativa.", ind: { tension: 3, imagen: -2 } }] },
      { t: "Pasarles el problema a los gobernadores", pista: "Sin costo fiscal, pero las provincias se enojan", ind: { imagen: -1 }, gob: -12,
        dif: [{ en: 2, texto: "Las provincias sin fondos cierran escuelas. La pelea vuelve a la Casa Rosada.", ind: { tension: 3, imagen: -2 } }] },
    ] },
  { id: "tarifas", titulo: "Subsidios a la energía", peso: 3, cond: s => !s.flags.tarifas,
    texto: "Los subsidios a la luz y el gas cuestan 2 puntos del PBI. El Fondo y los economistas piden recortarlos; los intendentes advierten sobre facturas impagables.",
    opciones: [
      { t: "Tarifazo: eliminar subsidios de golpe", pista: "Mucho ahorro fiscal, mucha bronca", ind: { deficit: -1.2, inflacion: 1.2, tension: 7, imagen: -5 }, act: { fmi: 15, mercados: 10, cgt: -10, movimientos: -10 }, flag: "tarifas",
        dif: [{ en: 1, texto: "Ruidazos y amparos judiciales contra el aumento de tarifas.", ind: { tension: 3 }, act: { corte: -5 } }] },
      { t: "Segmentar: subsidio solo para quien lo necesita", pista: "Ahorro moderado, lento de implementar", ind: { deficit: -0.5, inflacion: 0.4, tension: 2 }, act: { fmi: 5 }, flag: "tarifas",
        dif: [{ en: 2, texto: "La segmentación tarifaria empieza a dar resultado fiscal.", ind: { deficit: -0.3 } }] },
      { t: "Congelar tarifas", pista: "Alivio hoy, problema mañana", ind: { deficit: 0.3, inflacion: -0.3, imagen: 2 }, act: { fmi: -10, mercados: -10, industria: 5 },
        dif: [{ en: 3, texto: "Faltante de gas en invierno: cortes a industrias por falta de inversión.", ind: { crecimiento: -0.5, reservas: -1500 }, act: { industria: -10 } }] },
    ] },
  { id: "provinciaQuiebra", titulo: "Una provincia no paga sueldos", peso: 2,
    texto: "El gobierno de Montaraz no puede pagar los sueldos estatales. Hay incidentes frente a la Casa de Gobierno y la policía provincial amenaza con acuartelarse.",
    opciones: [
      { t: "Rescate con un adelanto de coparticipación", pista: "Plata nacional, gobernador agradecido", ind: { deficit: 0.15, tension: -2 }, fx: "gobRelacion:montaraz:30", riesgo: 2 },
      { t: "Intervención federal de la provincia", pista: "Necesita ley del Congreso; muy fuerte", fx: "intervencion:montaraz" },
      { t: "Que se arregle sola: emitir cuasimonedas", pista: "Sin costo nacional; caos provincial", ind: { tension: 3, imagen: -1 }, fx: "gobRelacion:montaraz:-25",
        dif: [{ en: 1, texto: "Montaraz emite bonos cuasimoneda. Otras provincias amenazan con copiarla.", ind: { inflacion: 0.3, legitimidad: -2 } }] },
    ] },
  { id: "tomaTierras", titulo: "Toma de tierras en Gran Ribera", peso: 2,
    texto: "Dos mil familias ocupan un predio en el conurbano. El dueño pide el desalojo y un juez lo ordena. Los movimientos sociales defienden la toma.",
    opciones: [
      { t: "Desalojar con fuerzas federales", pista: "Orden y propiedad; riesgo de violencia", ind: { tension: 4, inseguridad: -1 }, act: { movimientos: -20, fuerzas: 10, prensa: 5 }, grp: { media: 0.2, informales: -0.3 },
        dif: [{ en: 0, prob: 0.3, texto: "El desalojo termina con heridos graves. Repudio de organismos de derechos humanos.", ind: { legitimidad: -4, imagen: -3 } }] },
      { t: "Expropiar y urbanizar el predio", pista: "Solución social cara; el campo y los mercados se alarman", ind: { deficit: 0.2, tension: -3 }, act: { movimientos: 15, mercados: -10, campo: -8 }, grp: { informales: 0.3, media: -0.15 } },
      { t: "Mesa de diálogo y relocalización", pista: "Lento; nadie queda conforme", ind: { tension: -1 }, act: { iglesia: 8 },
        dif: [{ en: 1, texto: "La toma sigue y aparecen nuevas ocupaciones.", ind: { tension: 2, inseguridad: 2 } }] },
    ] },
  { id: "vencimiento", titulo: "Vencimiento de deuda en dólares", peso: 2.5, cond: s => s.ind.reservas < 18000,
    texto: "Vence un bono por 4.000 millones de dólares. Las reservas no sobran y los acreedores esperan una señal.",
    opciones: [
      { t: "Pagar con reservas", pista: "Credibilidad, pero quedás corto de dólares", ind: { reservas: -4000 }, act: { mercados: 15, fmi: 10, norte: 5 } },
      { t: "Reestructurar: canje con quita y más plazo", pista: "Negociación de meses; alivio después", ind: { reservas: -800 }, act: { mercados: -10 },
        dif: [{ en: 2, texto: "Se cierra el canje de deuda con alta adhesión. Bajan los vencimientos.", ind: { deuda: -8, reservas: 1500 }, act: { mercados: 10 } }] },
      { t: "Declarar el default", pista: "Aplausos en el Congreso, aislamiento financiero", ind: { imagen: 4, deuda: -5 }, act: { mercados: -40, fmi: -30, norte: -15 }, fx: "default",
        dif: [{ en: 1, texto: "El default cierra el crédito externo: las empresas no consiguen financiamiento.", ind: { crecimiento: -1.2, reservas: -1500 } }] },
    ] },
  { id: "fondosBuitre", titulo: "Fallo de un juez extranjero", peso: 1.2, unico: true,
    texto: "Un juez de la Federación del Norte ordena pagar el 100% a los fondos que no entraron al canje. Si no pagás, bloquea los pagos al resto de los acreedores.",
    opciones: [
      { t: "Acatar y negociar con los holdouts", pista: "Volvés a los mercados; la oposición te acusa de entregar", ind: { reservas: -2500, imagen: -3 }, act: { mercados: 20, norte: 10 },
        dif: [{ en: 2, texto: "Valdora vuelve a emitir deuda en los mercados internacionales.", ind: { reservas: 5000, deuda: 3 } }] },
      { t: "Desconocer el fallo: \"Patria o buitres\"", pista: "Épica nacional, default técnico", ind: { imagen: 5 }, act: { mercados: -20, norte: -15 }, fx: "default" },
      { t: "Pagar en jurisdicción local", pista: "Ingenioso, pero el juez lo declara desacato", ind: { imagen: 2 }, act: { mercados: -10, norte: -8 } },
    ] },
  { id: "corrida", titulo: "Corrida contra el peso", peso: 3, cond: s => s.ind.reservas < 12000 || s.ind.inflacion > 6,
    texto: "El dólar paralelo sube 15% en una semana. Hay colas en las casas de cambio y los bancos pierden depósitos.",
    opciones: [
      { t: "Subir la tasa de interés al 80%", pista: "Frena la corrida, enfría la economía", ind: { crecimiento: -0.7, inflacion: -0.5, desempleo: 0.4 }, act: { mercados: 10, industria: -15 } },
      { t: "Endurecer el cepo cambiario", pista: "Cuida reservas; brecha y mercado negro", ind: { reservas: 2000, crecimiento: -0.3 }, act: { mercados: -15, campo: -10 }, grp: { media: -0.3 } },
      { t: "Vender reservas para calmar al mercado", pista: "Funciona hasta que se acaban", ind: { reservas: -4000, inflacion: -0.3 },
        dif: [{ en: 1, prob: 0.5, texto: "La corrida vuelve con más fuerza: el mercado sabe que te quedan pocos dólares.", ind: { reservas: -2000, inflacion: 1 } }] },
    ] },
  { id: "inflacionAlimentos", titulo: "Los alimentos suben más que el resto", peso: 2.5, cond: s => s.ind.inflacion > 3,
    texto: "La carne y el pan aumentaron 12% en un mes. Los jubilados no llegan a fin de mes y la oposición habla de \"inflación de los pobres\".",
    opciones: [
      { t: "Cerrar las exportaciones de carne", pista: "Baja precios internos; furia del campo", ind: { inflacion: -0.4, reservas: -800 }, act: { campo: -25 }, grp: { jubilados: 0.2, campo: -0.5 },
        dif: [{ en: 3, texto: "Se liquidan vientres: cae el stock ganadero y la carne vuelve a subir.", ind: { inflacion: 0.5, crecimiento: -0.2 } }] },
      { t: "Bono alimentario para jubilados y AUH", pista: "Alivio directo, más déficit", ind: { deficit: 0.3, tension: -3, pobreza: -1 }, grp: { jubilados: 0.25, informales: 0.2 } },
      { t: "Bajar el IVA de los alimentos", pista: "Necesita ley; menos recaudación", ind: { deficit: 0.4, inflacion: -0.3, imagen: 2 }, fx: "ley:ivaAlimentos" },
    ] },
  { id: "narco", titulo: "Ola de violencia narco en el Litoral", peso: 2, cond: s => s.ind.inseguridad > 50,
    texto: "Balaceras diarias en la ciudad portuaria del Litoral. Amenazas a comerciantes y al intendente. El gobernador pide ayuda federal.",
    opciones: [
      { t: "Desembarco de 3.000 efectivos federales", pista: "Resultados rápidos, caro", ind: { inseguridad: -5, deficit: 0.1 }, act: { fuerzas: 10 }, fx: "gobRelacion:litoral:20", grp: { media: 0.2 } },
      { t: "Involucrar a las Fuerzas Armadas", pista: "Polémico: la ley de seguridad interior lo limita", ind: { inseguridad: -6, legitimidad: -5 }, act: { fuerzas: 5, iglesia: -5 }, grp: { media: 0.25, jovenes: -0.2 } },
      { t: "Plan integral: juzgados, lavado y prevención", pista: "Efecto lento pero duradero", ind: { deficit: 0.1 },
        dif: [{ en: 2, texto: "Caen las cúpulas narco del Litoral por causas de lavado.", ind: { inseguridad: -7, imagen: 2 } }] },
    ] },
  { id: "carapintadas", titulo: "Levantamiento militar", peso: 1, unico: true,
    texto: "Un grupo de oficiales con la cara pintada se acuartela en el cuartel de Campo Sarmiento. Exigen que se frenen los juicios por los crímenes de la dictadura.",
    opciones: [
      { t: "Resistir y convocar a la Plaza en defensa de la democracia", pista: "Gran apoyo popular; tensión con las Fuerzas", ind: { imagen: 6, legitimidad: 6 }, act: { fuerzas: -15 } },
      { t: "Negociar una ley que limite los juicios", pista: "Termina el alzamiento; lo vivirán como claudicación", ind: { legitimidad: -8, imagen: -6 }, act: { fuerzas: 20, iglesia: 5 }, grp: { jovenes: -0.3, estatales: -0.2 } },
      { t: "Ordenar a tropas leales reprimir el alzamiento", pista: "Riesgo de enfrentamiento armado", ind: { legitimidad: 3 }, act: { fuerzas: -25 },
        dif: [{ en: 0, prob: 0.4, texto: "Enfrentamientos con muertos en el cuartel. Sofocás el levantamiento pero la sociedad queda conmocionada.", ind: { imagen: -3, tension: 4 } }] },
    ] },
  { id: "vacanteCorte", titulo: "Vacante en la Corte Suprema", peso: 1.5, unico: true,
    texto: "Renunció un juez de la Corte. Tenés que proponer un reemplazo; el pliego necesita dos tercios del Senado.",
    opciones: [
      { t: "Un jurista leal al gobierno", pista: "Corte más amigable, si el Senado lo aprueba", fx: "pliego:afin" },
      { t: "Un jurista prestigioso e independiente", pista: "Fácil de aprobar, gana legitimidad", fx: "pliego:independiente" },
      { t: "Negociar: un juez para vos y otro para la oposición", pista: "Propone ampliar el acuerdo, mitad y mitad", fx: "pliego:reparto" },
    ] },
  { id: "periodista", titulo: "Una investigación periodística te apunta", peso: 2, cond: s => s.riesgo > 10 || (s.causas || 0) > 0,
    texto: "Un periodista de Página Sur publica documentos sobre contratos a empresas de un amigo del gobierno.",
    opciones: [
      { t: "Echar al funcionario involucrado", pista: "Cortás la sangría, pero admitís el problema", ind: { imagen: -1, legitimidad: 2 }, riesgo: -10 },
      { t: "Acusar al periodista de operar para la oposición", pista: "Tu núcleo duro te banca; el resto no", ind: { legitimidad: -3 }, act: { prensa: -20 }, grp: { media: -0.2 },
        dif: [{ en: 1, texto: "Aparecen más documentos. La causa avanza en un juzgado federal.", ind: { imagen: -4, legitimidad: -3 } }] },
      { t: "Pedir que la Oficina Anticorrupción investigue", pista: "Prolijo y lento", ind: { legitimidad: 1 }, riesgo: -4 },
    ] },
  { id: "vicepresidente", titulo: "Tu vicepresidente te critica en público", peso: 1.5, cond: s => s.trimestre > 2,
    texto: "En una entrevista, tu vicepresidente dice que \"el gobierno perdió el rumbo\" y que los ministros \"no sirven\". Preside el Senado y tiene su propio bloque.",
    opciones: [
      { t: "Ceder: cambiar ministros como pide", pista: "Paz interna, te muestran débil", ind: { imagen: -2 }, fx: "vice:+30" },
      { t: "Romper con el vice y aislarlo", pista: "Liderazgo claro; perdés votos en el Senado", ind: { imagen: 1 }, fx: "vice:-40" },
      { t: "Cena a solas para recomponer", pista: "Tregua frágil", fx: "vice:+10" },
    ] },
  { id: "renunciaEconomia", titulo: "Renuncia el ministro de Economía", peso: 1.5, cond: s => s.trimestre > 3 && (s.ind.inflacion > 4 || s.ind.reservas < 10000),
    texto: "Tu ministro de Economía presenta la renuncia. Los mercados esperan el nombre del reemplazo para decidir si se calman o se asustan.",
    opciones: [
      { t: "Nombrar un ortodoxo amigo de los mercados", pista: "Calma financiera, enojo sindical", fx: "ministro:ortodoxo" },
      { t: "Nombrar un heterodoxo con perfil productivo", pista: "Contento el ala política; los mercados dudan", fx: "ministro:heterodoxo" },
      { t: "Rechazar la renuncia y sostenerlo", pista: "Continuidad, pero queda debilitado", ind: { imagen: -1 }, act: { mercados: -5 } },
    ] },
  { id: "fmiReforma", titulo: "El Fondo pide reforma previsional", peso: 2, cond: s => s.fmi && s.fmi.activo,
    texto: "En la revisión, el staff del Fondo pide subir la edad jubilatoria y cambiar la fórmula de movilidad. Sin eso, no habrá desembolso.",
    opciones: [
      { t: "Aceptar y enviar la reforma al Congreso", pista: "Desembolso asegurado; protesta masiva", ind: { deficit: -0.5, tension: 6 }, act: { fmi: 20, cgt: -20 }, grp: { jubilados: -0.5 },
        dif: [{ en: 0, prob: 0.5, texto: "Incidentes graves frente al Congreso durante la sesión de la reforma previsional.", ind: { tension: 4, imagen: -3 } }] },
      { t: "Negociar un waiver sin reforma", pista: "Depende de tu relación con el Fondo", fx: "waiver" },
      { t: "Romper con el Fondo", pista: "Soberanía; adiós desembolsos", ind: { imagen: 3 }, act: { fmi: -40, mercados: -20 }, fx: "finFMI" },
    ] },
  { id: "aerolinea", titulo: "La aerolínea estatal pierde plata", peso: 1.2, unico: true,
    texto: "Aerolíneas Valdorenses pierde 400 millones de dólares por año. Hay propuestas para privatizarla, cerrarla o sostenerla.",
    opciones: [
      { t: "Privatizarla", pista: "Ahorro y conflicto con los gremios aeronáuticos", ind: { deficit: -0.15, tension: 2 }, act: { cgt: -12, mercados: 8 }, grp: { estatales: -0.2 }, fx: "ley:privAerolinea" },
      { t: "Sostenerla: conecta al país", pista: "Gasto que sigue; orgullo nacional", ind: { deficit: 0.05, imagen: 1 }, act: { cgt: 5 } },
      { t: "Plan de reestructuración y nuevas rutas", pista: "Gradual; resultados en un año", dif: [{ en: 4, texto: "La aerolínea estatal logra equilibrio operativo por primera vez.", ind: { deficit: -0.1, imagen: 1 } }] },
    ] },
  { id: "hidrovia", titulo: "Licitación de la hidrovía", peso: 1.2, unico: true,
    texto: "Vence la concesión del dragado del río por donde sale el 80% de las exportaciones. Hay ofertas de empresas de la Unión Continental y de la República Popular del Este.",
    opciones: [
      { t: "Adjudicar a la empresa de la Unión Continental", pista: "Experiencia y buena relación con el Norte", act: { norte: 10, campo: 5 } },
      { t: "Adjudicar a la empresa del Este", pista: "Más barata; el Norte se queja", ind: { reservas: 1000 }, act: { norte: -15 } },
      { t: "Estatizar el dragado", pista: "Control nacional; riesgo de ineficiencia", ind: { deficit: 0.1 }, act: { campo: -10, cgt: 5 },
        dif: [{ en: 3, prob: 0.5, texto: "Problemas de dragado: barcos que salen con menos carga.", ind: { reservas: -1200 } }] },
    ] },
  { id: "gatilloFacil", titulo: "Un policía federal mata a un joven", peso: 1.5,
    texto: "Un adolescente murió de un disparo de un policía federal en un control. La familia y las organizaciones de derechos humanos marchan. La versión policial habla de enfrentamiento.",
    opciones: [
      { t: "Exonerar al policía y pedir justicia", pista: "Empatía social; malestar en las fuerzas", ind: { legitimidad: 2, tension: -2 }, act: { fuerzas: -15, movimientos: 5 }, grp: { jovenes: 0.2 } },
      { t: "Respaldar a la fuerza hasta que hable la Justicia", pista: "Las fuerzas lo valoran; marchas crecen", ind: { tension: 3 }, act: { fuerzas: 12 }, grp: { media: 0.1, jovenes: -0.3 } },
      { t: "Anunciar protocolo de uso de armas", pista: "Intermedio", act: { fuerzas: -5 }, ind: { legitimidad: 1 } },
    ] },
  { id: "gobernadorPide", titulo: "Un gobernador pide fondos a cambio de votos", peso: 2.5,
    texto: "El gobernador de Sierras Centrales ofrece los votos de sus diputados y senadores para tus leyes a cambio de financiar una autopista.",
    opciones: [
      { t: "Aceptar y firmar el convenio", pista: "Votos asegurados por un tiempo", ind: { deficit: 0.15 }, fx: "gobRelacion:sierras:35" },
      { t: "Rechazar: \"no compro votos\"", pista: "Prolijo; perdés un aliado", ind: { legitimidad: 1 }, fx: "gobRelacion:sierras:-15" },
      { t: "Ofrecerle un ministerio a su gente", pista: "Sin costo fiscal; tu partido protesta", fx: "gobRelacion:sierras:20", ind: { imagen: -1 } },
    ] },
  { id: "votoONU", titulo: "Votación en la Asamblea General", peso: 1.2,
    texto: "La Federación del Norte pide que Valdora vote a favor de condenar a un país aliado de la República Popular del Este. Brasilia del Sur se abstendrá.",
    opciones: [
      { t: "Votar con la Federación del Norte", pista: "Apoyo financiero; el Este se enfría", act: { norte: 15 }, ind: { reservas: 500 } },
      { t: "Abstenerse junto a Brasilia del Sur", pista: "Tradición de no alineamiento", ind: { legitimidad: 1 } },
      { t: "Votar en contra", pista: "El Este lo agradece; el Norte toma nota", act: { norte: -20 }, ind: { reservas: 800 } },
    ] },
  { id: "papelera", titulo: "Conflicto por una planta en el río limítrofe", peso: 1, unico: true,
    texto: "El país vecino autorizó una pastera en la orilla del río compartido. Los vecinos de Islas del Paraná cortan el puente internacional.",
    opciones: [
      { t: "Denunciar al vecino ante la Corte Internacional", pista: "Juicio de años; apoyo local", ind: { imagen: 2 }, act: { industria: -3 } },
      { t: "Desalojar el puente y negociar un monitoreo conjunto", pista: "Pragmático; los vecinos se enojan", ind: { tension: 2 }, fx: "gobRelacion:islas:-15", act: { industria: 5 } },
      { t: "Apoyar el corte del puente", pista: "Popular en la provincia, crisis diplomática", fx: "gobRelacion:islas:15", ind: { crecimiento: -0.1 } },
    ] },
  { id: "ganancias", titulo: "El impuesto a las Ganancias alcanza a más trabajadores", peso: 2, cond: s => s.ind.inflacion > 2.5,
    texto: "Por la inflación, cada vez más asalariados pagan Ganancias. La CGT exige subir el mínimo no imponible.",
    opciones: [
      { t: "Subir el mínimo por decreto", pista: "Rápido; ¿es legal? Es materia tributaria", fx: "dnuTributario" },
      { t: "Enviar una ley que lo actualice", pista: "Prolijo; depende del Congreso", ind: { deficit: 0.3 }, act: { cgt: 10 }, fx: "ley:ganancias" },
      { t: "No tocar nada: hace falta la recaudación", pista: "Cuida el déficit", act: { cgt: -12 }, grp: { trabajadores: -0.3 } },
    ] },
  { id: "acampe", titulo: "Acampe de movimientos en la avenida principal", peso: 2, cond: s => s.actoresRel && s.actoresRel.movimientos < 45,
    texto: "Miles de personas acampan frente al Ministerio de Desarrollo Social reclamando alimentos para los comedores.",
    opciones: [
      { t: "Aplicar protocolo antipiquetes", pista: "Orden en la calle; choque con los movimientos", ind: { tension: 3 }, act: { movimientos: -20, fuerzas: 5 }, grp: { media: 0.25, informales: -0.3 } },
      { t: "Ampliar la partida para comedores", pista: "Termina el acampe, más gasto", ind: { deficit: 0.15, tension: -3, pobreza: -0.5 }, act: { movimientos: 15 } },
      { t: "Auditar los planes y pasarlos a los municipios", pista: "Corta intermediarios; conflicto inicial", ind: { tension: 2, deficit: -0.1 }, act: { movimientos: -10 }, gob: 5, grp: { media: 0.15 } },
    ] },
  { id: "lluviaInversiones", titulo: "Una minera ofrece una inversión gigante", peso: 1.5,
    texto: "Una minera de la Unión Continental ofrece invertir 8.000 millones de dólares en litio en la Puna si le garantizás estabilidad fiscal por 30 años.",
    opciones: [
      { t: "Aprobar un régimen de incentivo a grandes inversiones", pista: "Dólares e inversión; ambientalistas en contra", ind: { reservas: 2500, crecimiento: 0.4 }, act: { mercados: 10, industria: 5 }, grp: { jovenes: -0.1 }, fx: "ley:rigi" },
      { t: "Exigir industrialización local del litio", pista: "Soberanía; la empresa duda", ind: { crecimiento: 0.1 }, act: { industria: 8, mercados: -5 },
        dif: [{ en: 2, prob: 0.5, texto: "La minera se va a un país vecino.", ind: { imagen: -1 } }] },
      { t: "Rechazar por impacto ambiental", pista: "Los ambientalistas celebran, la provincia no", fx: "gobRelacion:puna:-20", grp: { jovenes: 0.15 } },
    ] },
  { id: "aumentoFuerzas", titulo: "Las fuerzas reclaman aumento", peso: 1.5, cond: s => s.ind.inflacion > 3,
    texto: "Prefectura y Gendarmería se concentran frente a sus edificios reclamando un aumento salarial. Advierten que no saldrán a patrullar.",
    opciones: [
      { t: "Dar el aumento", pista: "Conflicto resuelto, más gasto y efecto contagio", ind: { deficit: 0.1 }, act: { fuerzas: 15, cgt: -3 },
        dif: [{ en: 1, texto: "Otros estatales piden lo mismo que las fuerzas.", ind: { tension: 2 } }] },
      { t: "Pasar a disponibilidad a los cabecillas", pista: "Autoridad; malestar interno", ind: { inseguridad: 2 }, act: { fuerzas: -20 } },
      { t: "Bono por única vez", pista: "Parche", ind: { deficit: 0.04 }, act: { fuerzas: 5 } },
    ] },
  { id: "dnuMasivo", titulo: "Tu equipo propone gobernar por decreto", peso: 1.2, cond: s => s.trimestre > 1 && (s.dip[s.jugador.partido] || 0) < 100,
    texto: "Con minoría en el Congreso, tu jefe de Gabinete propone un paquete de 300 artículos por DNU para cambiar leyes sin pasar por el Parlamento.",
    opciones: [
      { t: "Firmarlo", pista: "Avanzás rápido; lluvia de amparos y desgaste institucional", ind: { crecimiento: 0.3, legitimidad: -8 }, act: { mercados: 15, cgt: -15, corte: -10 },
        dif: [{ en: 1, prob: 0.5, texto: "La Justicia laboral suspende el capítulo laboral del megadecreto.", ind: { legitimidad: -2 }, act: { mercados: -5 } }] },
      { t: "Partirlo en leyes y negociar una por una", pista: "Lento pero sólido", ind: { legitimidad: 2 }, gob: 5 },
      { t: "Pedir una ley de emergencia con delegación de facultades", pista: "Si el Congreso te la da, tenés superpoderes por un año", fx: "delegacion" },
    ] },
];

// Leyes que algunos dilemas mandan al Congreso
const LEYES_DILEMA = {
  ivaAlimentos: { nombre: "Ley de IVA cero a los alimentos", ideo: 40, ef: { inflacion: -0.3 }, grupos: { jubilados: 0.2, informales: 0.2 } },
  privAerolinea: { nombre: "Ley de privatización de la aerolínea estatal", ideo: 78, ef: { deficit: -0.1 }, grupos: { estatales: -0.2 } },
  ganancias: { nombre: "Ley de actualización de Ganancias", ideo: 45, ef: { imagen: 2 }, grupos: { trabajadores: 0.35 } },
  rigi: { nombre: "Régimen de incentivo a grandes inversiones", ideo: 72, ef: { crecimiento: 0.2 }, grupos: { empresarios: 0.2 } },
  delegacion: { nombre: "Ley de emergencia pública y delegación de facultades", ideo: 60, ef: { legitimidad: -3 }, grupos: {} },
};
