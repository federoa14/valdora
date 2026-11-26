# Valdora — simulador político

Juego web por turnos, en español, ambientado en la República de Valdora, un país ficticio cuyas reglas se inspiran en la política argentina desde 1983 (internas, PASO, el "dedo", coaliciones, financiamiento, gobernadores, DNU, veto, juicio político, crisis y estallidos) y en la política internacional desde 1945.

## Cómo jugar

1. **Elegí la época**: 1983, 1989, 2001, 2015 u hoy. Cada una arranca con su economía, sus partidos y sus problemas.
2. **Creá tu personaje**: nombre, ideología y 24 puntos para carisma, oratoria, gestión y negociación.
3. **Elegí tu cargo**: presidente, gobernador (cuatro provincias jugables, con Legislatura), intendente de Puerto Ribera (con Concejo Deliberante) o diputado nacional y jefe de bloque.
4. **Elegí tu camino**: fundar un partido (juntar avales, sin plata ni fiscales) o sumarte a uno existente y ganar la interna (PASO, interna cerrada o el dedo del líder).
5. **Hacé campaña** durante 6 meses, distrito por distrito, con 10 acciones por mes: recorridas, actos, spots, redes, entrevistas, pactos sectoriales, recaudación, militancia y operaciones de prensa. Cuidado con los aportantes: dan plata pero suman riesgo de escándalo.
6. **Ganá la elección**: para presidente, 45% o 40% con 10 puntos de ventaja (si no, balotaje); para gobernador e intendente, el más votado; para diputado, bancas por D'Hondt.
7. **Gobernás 48 meses**, un turno por mes (como presidente): cada mes llega un expediente al despacho y podés tomar una medida grande; presupuesto, impuestos, medidas por resolución, decreto, DNU o ley, un Congreso de 257 diputados y 72 senadores con bloques y gobernadores, la Corte, el Fondo, la política exterior y el medidor de tensión social.

8. **Hacé tus propias leyes** en la pestaña *Leyes* (en los cuatro cargos). Elegís una base entre más de 140 proyectos inspirados en la historia legislativa argentina (impuestos, trabajo, previsión, seguridad, Código Penal, educación, salud, derechos civiles, sistema electoral, instituciones, reforma constitucional, ambiente, tratados y federalismo; leyes provinciales y ordenanzas en los cargos locales) y la ajustás: intensidad, financiamiento, alcance, vigencia, cláusulas y negociación. El motor legislativo te muestra antes de presentarla qué cámara la trata, qué mayoría exige la Constitución, quién gana y quién pierde, el riesgo judicial y cómo votaría cada bloque. Después hace el trámite real: dictamen de comisión, media sanción, cámara revisora (que puede modificarla), veto total o parcial, insistencia con dos tercios y fallos de inconstitucionalidad meses después. La oposición también presenta sus proyectos: si sos Ejecutivo podés promulgarlos o vetarlos; si sos diputado, los votás en el recinto.

El tiempo avanza mes a mes en todos los cargos: la economía, la tensión y la imagen se mueven cada mes, y algunas cosas siguen un calendario (Presupuesto en septiembre, legislativas a mitad de mandato, reacciones de los factores de poder al cierre de cada trimestre).

## Correrlo en tu computadora

No necesita instalar nada. Abrí `index.html` con doble clic en cualquier navegador moderno.

## Probarlo

Con Node.js 18 o más nuevo: `npm test` juega 64 partidas completas en los cuatro cargos sin navegador y falla si algo tira error.

## Publicarlo en GitHub Pages (gratis)

El repositorio ya trae el flujo `.github/workflows/pages.yml`: cada vez que se sube algo a la rama `main`, corre las pruebas y publica el juego.

1. Creá un repositorio nuevo en GitHub (por ejemplo `valdora`).
2. Subí todo el contenido de esta carpeta, incluidas las carpetas ocultas `.github` y el archivo `.nojekyll`.
   - Desde la web: botón **Add file → Upload files**, arrastrá los archivos y hacé **Commit**.
   - Desde la terminal:
     ```
     git init
     git add .
     git commit -m "Valdora v0.1"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/valdora.git
     git push -u origin main
     ```
3. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**. (Si preferís no usar Actions, elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`.)
4. En uno o dos minutos el juego queda en `https://TU_USUARIO.github.io/valdora/`.

## Publicarlo en Vercel

1. Entrá a vercel.com con tu cuenta de GitHub.
2. **Add New → Project**, elegí el repositorio `valdora`.
3. Framework: **Other**. Sin comando de build. **Deploy**.

## Estructura

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | Página principal |
| `css/style.css` | Estilos (modo claro y oscuro) |
| `js/data.js` | Contenido: provincias, grupos sociales, partidos, medios, aportantes, medidas, eventos |
| `js/engine.js` | Lógica: modelo de voto, campaña, internas, elecciones, Congreso, DNU, veto, economía, tensión social |
| `js/dilemas.js` | Factores de poder, gabinete y los expedientes del despacho presidencial |
| `js/gobierno2.js` | Gobierno profundo: reacciones de actores, consecuencias diferidas, comisiones, Presupuesto, Corte |
| `js/v03.js` | Justicia (causas, jueces, Consejo de la Magistratura), prensa, proyectos de ley propios, derogaciones, adhesiones y eras históricas |
| `js/escalas.js` | Escalas gobernador e intendente: mapas locales, Legislatura o Concejo, coparticipación, relación con la Nación, dilemas locales |
| `js/legislador.js` | Escala diputado y jefe de bloque: lista D'Hondt, votaciones en el recinto, disciplina, interna del bloque, proyectos propios, interpelación y juicio político |
| `js/leyes_catalogo.js` | Catálogo de proyectos de ley nacionales, leyes provinciales y ordenanzas municipales |
| `js/leyes.js` | Motor legislativo: voto de cada bloque, mayorías especiales, cámara de origen y revisora, comisiones, veto, insistencia, Corte y proyectos de la oposición |
| `js/ui.js` | Interfaz: pantallas, mapa, hemiciclos, gráficos |
| `js/ui_local.js` | Interfaz del gobierno provincial y municipal |
| `js/ui_legislador.js` | Interfaz del diputado y jefe de bloque |
| `js/ui_leyes.js` | Pestaña Leyes: redactor, pronóstico de votación y seguimiento del trámite |
| `tests/simular.js` | Prueba automática (`npm test`) |
| `.github/workflows/pages.yml` | Publicación automática en GitHub Pages |
| `PROGRESO.md` | Orden de progreso del proyecto |

Para agregar medidas, eventos, medios o aportantes alcanza con editar `js/data.js`. Para sumar proyectos de ley, agregá una línea en `js/leyes_catalogo.js`.

## Aviso

País, partidos, medios y personajes son ficticios. Los valores numéricos están pensados para balancear el juego, no son datos oficiales.
