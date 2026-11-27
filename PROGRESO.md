# Valdora: orden de progreso

Archivo de seguimiento. Si la sesión se corta, retomar desde la primera casilla sin marcar.
Documento de diseño: https://claude.ai/artifact/2W7cuhDDo71UUFCJoaj9xx

## Etapa 1: Diseño
- [x] Documento de diseño (país, mecanismos, instituciones, votantes, gobierno, contexto internacional, alcance)

## Etapa 2: Prototipo jugable v0.1 (carpeta `valdora/`)
- [x] `js/data.js`: provincias, grupos, partidos, medios, aportantes, medidas, eventos
- [x] `js/engine.js`: campaña, internas (avales, dedo, cerrada, PASO), elección y balotaje, Congreso, DNU, veto, economía, tensión social
- [x] `index.html` + `css/style.css` + `js/ui.js`: pantallas de creación, campaña con mapa, gobierno, fin
- [x] Prueba automática en navegador (partida completa sin errores)
- [x] Ajuste de balance (que se pueda ganar y perder)
- [x] README con instrucciones para GitHub Pages / Vercel
- [x] Publicar versión jugable: https://claude.ai/artifact/VvoNCqmDG7dHqvfwraBnWp (v0.7 publicada)

## Etapa 3: v0.2 — Gobierno profundo (prioridad de Federico: decisiones realistas en el cargo)
- [x] Despacho presidencial: expedientes por trimestre con dilemas de 3 opciones (costos, beneficios, actores)
- [x] Consecuencias diferidas (efectos que llegan 1 a 4 trimestres después)
- [x] Factores de poder con relación propia que reaccionan: CGT, campo, industria, mercados, movimientos sociales, Iglesia, fuerzas de seguridad, prensa, Corte, Fondo, Federación del Norte
- [x] Gabinete: elegir ministro de Economía (ortodoxo, heterodoxo, político), desgaste, renuncias, vicepresidente con agenda propia
- [x] Congreso: comisiones y dictamen (proyectos cajoneados), sesión especial con dos tercios, ley de Presupuesto anual y prórroga
- [x] Corte: vacantes y pliegos con acuerdo de dos tercios del Senado
- [x] Probar, balancear y republicar
- [x] Sumar al documento de diseño la sección de decisiones de gobierno

## Etapa 4: v0.3

- [x] Escalas intendente y gobernador con mapa de barrios / departamentos (v0.4)
- [x] Justicia completa: causas con etapas y jueces, Consejo de la Magistratura (vacantes de la Corte ya estaban en v0.2)
- [x] Prensa con periodistas individuales, tapas, pauta oficial, conferencias y cadena nacional
- [x] Redacción de proyectos de ley propios (impuestos y programas), derogaciones y adhesión de provincias
- [x] Eras históricas elegibles (1983, 1989, 2001, 2015, hoy) con planes de estabilización (Austral, Convertibilidad, Jefes de Hogar, pesificación)
- [x] Reemplazar nombres parecidos a personas o medios reales por nombres ficticios
- [x] Probar, balancear y republicar v0.3
- [x] Subido a GitHub: https://github.com/federoa14/valdora · juego online: https://federoa14.github.io/valdora/

## Etapa 5: v0.6
- [x] Avance mes a mes en todos los cargos (48 meses de mandato, campaña de 6 meses) con economía recalibrada y partidas guardadas viejas convertidas

## Etapa 6: v0.7 — Motor legislativo
- [x] Catálogo de más de 140 proyectos de todos los tipos (nacionales, provinciales y ordenanzas), ficticios e inspirados en la historia legislativa argentina
- [x] Motor de votación por bloque: ideología, grupos sociales que representa, relación, gobernadores, disciplina, costo fiscal y quién firma
- [x] Reglas constitucionales: cámara de origen (art. 52, coparticipación), mayorías absolutas y de dos tercios (arts. 30, 75, 77, 114), sobre tablas, caducidad a los dos años
- [x] Revisora que modifica, veto total y parcial, insistencia con dos tercios, control judicial diferido
- [x] Redactor de leyes propias con pronóstico de votación, en los cuatro cargos
- [x] Proyectos de la oposición: promulgar o vetar (Ejecutivo) y votarlos en el recinto (diputado)
- [x] Prueba automática `npm test` y flujo de GitHub Pages listos para el repositorio

## Etapa 7: v0.8 — Argentina real, agenda, guardado y portal
- [x] Mapa real: 24 provincias, 526 departamentos (INDEC), 8 secciones electorales bonaerenses y barrios de 8 municipios; bancas reales (257/72 y legislaturas provinciales)
- [x] Agenda mensual limitada: campaña 6 acciones, presidente 3 casilleros (4 con gestión alta), gobernador e intendente 2
- [x] Autoguardado mensual, 3 ranuras, exportar e importar archivo .json
- [x] Portal de gobierno en azul oscuro: emblema inventado, Boletín Oficial, cuadros estadísticos, ejecución presupuestaria, sala de prensa

## Etapa 8: v0.9 — Gestión del Estado, economía y mundo
- [x] Estadísticas con 15 gráficos mes a mes (4 en cargos locales)
- [x] Jefatura de Gabinete y cinco ministerios con programas, palancas y ministros reemplazables
- [x] Economía: Banco Central ficticio, regímenes cambiarios, letras, licitaciones y rollover, bonos, default y reestructuración, impuestos por decreto y por ley, salarios y canasta
- [x] Organismos internacionales de crédito con metas y revisiones
- [x] Cancillería: países ficticios, tratados, acuerdos reservados, ONF y Consejo de Paz y Seguridad
- [x] Petróleo, oro, soja y tasas que fluctúan; 14 crisis internacionales y nacionales
- [x] Incertidumbre (encuestas con error, datos preliminares, percepción de actores, rumores) y conflictos sociales que escalan
- Nota de balance: 1989 y 2001 quedaron más difíciles (el bot prudente termina el mandato en ~15-20% de las partidas)

## Etapa 9: v0.10 — Provincias, municipios y sus legislaturas
- [x] `js/territorios.js`: las 24 legislaturas (uni/bicameral, bancas, renovación, premio de mayoría, senados uninominales, composición heredada aproximada) y perfil fiscal y social de cada provincia
- [x] Los 8 municipios con Concejo, renovación, premio de mayoría (Córdoba) y perfil propio
- [x] Pantalla de selección con mapa de dificultad, filtros, orden y ficha (dificultad para tu partido: Legislatura, caja y calle)
- [x] Motor: Legislaturas bicamerales en leyes, tasas y juicio político; medio término solo donde hay renovación parcial; caja según dependencia de la Nación y holgura; tensión según conflictividad; expedientes típicos de cada territorio; disciplina según el peso de los intendentes; gobernadores del oficialismo histórico al ser presidente
- [x] Prueba automática recorre las 24 provincias y los 8 municipios
- Pendiente: sumar más municipios exige cartografía de barrios

## Etapa 10: v0.11 — Trayectoria política y precampaña
- [x] `js/trayectoria.js`: hitos de la carrera (internas, precampaña, debates, elecciones, cargos y su calificación, mandatos interrumpidos, leyes, obras, escándalos, causas, medio término, cambios de partido) guardados con la partida y en un legajo persistente (`valdora_carreras`)
- [x] Reconocimiento por territorio, prestigio y efecto por grupo social en la intención de voto; estructura (plata, militantes, fiscales) y puntos de atributo por experiencia
- [x] Seguir la carrera con el mismo personaje en otro cargo; currículum de los rivales de la IA; encuesta de conocimiento e imagen
- [x] `js/precampana.js`: precampaña de 3 o 6 meses antes de las PASO o la interna, con rendimiento decreciente, rivales que todavía no largaron, desgaste y fatiga
- [x] Pantalla de trayectoria, tarjeta de conocimiento en la campaña, carreras en la creación del personaje y en la pantalla final
- [x] Prueba automática: carrera de dos partidas, efecto de escándalos por grupo, cambio de partido, guardados viejos y precampaña

## Etapa 11: v0.12 — Foco en Entre Ríos
- [x] `js/geo_er.js`: constante `SOLO_ENTRE_RIOS` (en `false` se reabren las 24 provincias y los 8 municipios del resto del país)
- [x] Gobernador: Entre Ríos fija, con mapa de sus 17 departamentos en la pantalla de inicio
- [x] Intendente: 10 ciudades entrerrianas con Concejo (renovación total y mitad más uno para el ganador), perfil fiscal y social y zonas esquemáticas
- [x] Legislador: diputado nacional (5 de 9 bancas, D'Hondt) o senador nacional (2 + 1) por Entre Ríos; el bloque se conduce en Diputados o en el Senado
- [x] Prueba automática suma las 10 ciudades, el senador y el tamaño de cada cámara
- Pendiente: diputado o senador provincial (Legislatura de Paraná) como cargo jugable; cartografía real de los barrios entrerrianos

## Próximas ideas
- [x] Escala legislador / jefe de bloque (v0.5)
