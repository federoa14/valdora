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

## Próximas ideas
- [x] Escala legislador / jefe de bloque (v0.5)
