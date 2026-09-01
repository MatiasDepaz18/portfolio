# Sistema de Sprites (Yoshi y futuros personajes)

Motor reutilizable para personajes por PNG individuales dentro del
portfolio. Reemplaza al dinosaurio SVG anterior. El sprite y el movimiento
son dos sistemas separados: los componentes solo reproducen frames; GSAP
mueve el host (x/y/scale/opacity/rotation).

## Pipeline del asset

```
yoshi.png (sheet master, 564x281 palette PNG)
      │
      ├── npm run extract:yoshi
      │        └── recorta los PNG individuales (scripts/extract-yoshi-sprites.mjs)
      │
      ▼
PNG individuales (walk/, tongue/, run/, ...)
      │
      ▼
YOSHI_SHEET (definición, fuente de verdad)
      │
      ▼
SpriteCharacter (motor genérico)
      │
      ▼
YoshiCharacter (wrapper)
      │
      ▼
GSAP (About + Trajectory)
```

## Source

- Sheet master: `src/assets/game/yoshi/yoshi.png` (564x281, palette PNG
  con transparencia). **No se modifica**: es el asset original/master.
- PNG extraídos: `src/assets/game/yoshi/<anim>/<NN>.png` (generados por
  `npm run extract:yoshi`, que lee las coordenadas de `YOSHI_SHEET`).

## Extract — scripts/extract-yoshi-sprites.mjs

```
npm run extract:yoshi
```

1. Lee la fuente de verdad `src/app/game/sprites/yoshi.sprites.ts`.
2. Recorta cada frame del sheet master preservando RGBA y calidad
   (soporta sheet RGBA 8-bit y palette PNG: colorType 3 + tRNS).
3. Valida antes de escribir: frame no vacío, contenido tocando todos los
   bordes (recorte ajustado), rect dentro del sheet.
4. Limpia píxeles de otros sprites empaquetados dentro del rect
   (ej: piezas dentro de una pose).
5. Valida post-escritura: archivo existe, dimensiones esperadas,
   contenido presente, patrón de nombre `basePath/anim/NN.png`.

Si el extractor reporta problemas, se corrigen en `yoshi.sprites.ts`
(la fuente de verdad) y se vuelve a ejecutar. Nunca editar los PNG a mano.

## Sprite architecture

```
SpriteSheet        -> url, basePath, animaciones, defaultAnimation
SpriteAnimation    -> fps + frames
SpriteFrame        -> src (PNG individual) + width/height + source (coords en el sheet)
SpriteCharacter    -> motor genérico: un elemento visual, timer por fps,
                      precarga de frames, reduced motion, cleanup total
YoshiCharacter     -> wrapper público con state/scale/setState()/element
```

### API de YoshiCharacter

```html
<app-yoshi-character state="walk" [scale]="1" />
```

- `state`: ver tabla de estados abajo. Por defecto `think`.
- `scale`: propiedad CSS `scale` sobre el frame, crece desde el baseline
  (independiente de los transform de GSAP).
- `setState(name)`: cambio imperativo desde una timeline GSAP.
- `element`: `HTMLDivElement` host, target de GSAP.

### Estados y coordenadas (mapeo del sheet de 5 filas)

| Estado           | Frames (x, y, w, h en el sheet)                                                                                                                             | fps | Uso                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------- |
| `walk`           | (5,6,27,32) (38,7,26,31) (70,8,25,30) (102,7,26,31) (132,6,26,32)                                                                                           | 6   | Caminar en el lugar (entrada de About)             |
| `think`          | (175,8,25,30) (205,8,25,30) (239,8,25,30)                                                                                                                   | 2   | Quieto pensando (default)                          |
| `lookBack`       | (299,9,23,29) (327,9,21,29) (354,9,18,29) (379,8,20,30)                                                                                                     | 4   | Mirar atrás                                        |
| `crouch`         | (428,12,26,26) (459,14,26,24) (491,22,24,16) (533,8,26,30)                                                                                                  | 4   | Agacharse                                          |
| `jump`           | (5,51,25,33) (36,51,23,30) (66,51,23,27) (115,50,22,34)                                                                                                     | 8   | Despegue del salto                                 |
| `flip`           | (159,50,21,32) (188,50,23,34) (216,50,25,31) (275,50,30,26) (312,50,27,30)                                                                                  | 10  | Voltereta en el aire                               |
| `fall`           | (346,50,22,29) (374,50,25,25) (405,50,22,24) (434,50,24,28) (479,50,26,25) (516,60,26,18)                                                                   | 8   | Caída y aterrizaje                                 |
| `grab`           | (5,104,20,29) (31,106,31,27) (68,105,23,28)                                                                                                                 | 5   | Agarrar el objeto                                  |
| `throwSlow`      | (117,103,21,30) (145,102,20,31) (176,102,23,31) (208,103,24,30)                                                                                             | 5   | Tirar despacio (frame 4 incluye el objeto)         |
| `throwFast`      | (283,102,24,31) (313,103,26,30) (346,106,33,27)                                                                                                             | 8   | Tirar fuerte                                       |
| `run`            | (5,152,26,30) (36,153,26,29) (68,153,26,29) (100,152,26,30) (133,152,26,30) (163,153,26,29) (195,154,26,28) (227,153,26,29) (261,151,26,31) (292,153,26,29) | 6   | Correr despacio (walker de Trajectory)             |
| `runFast`        | (341,156,33,26) (379,157,36,25)                                                                                                                             | 10  | Correr rápido                                      |
| `runJump`        | (437,150,24,32)                                                                                                                                             | 1   | Salto de la corrida                                |
| `tongue`         | (5,248,29,25) (42,248,44,25) (95,248,60,25) (161,248,76,25)                                                                                                 | 4   | Lengua crece hacia la derecha (anchor bottom-left) |
| `tongueIdle`     | reutiliza `tongue/01.png`                                                                                                                                   | 1   | Cuerpo fijo del hero (tongue/01 siempre)           |
| `tongueFall`     | reutiliza `tongueStyles/02..04.png`                                                                                                                         | 3   | Lengua que desciende (anchor top-left, hero)       |
| `tongueUp`       | (337,243,20,30) (367,230,20,43) (393,214,20,59) (420,198,20,75) (450,243,20,30)                                                                             | 4   | Lengua hacia arriba                                |
| `tongueStyles`   | (250,248,29,25) (288,244,16,3) (288,254,16,5) (288,266,16,7) (311,253,8,7)                                                                                  | 2   | Estilos de lengua (origen de tongueFall)           |
| `tongueUpStyles` | (475,238,3,16) (483,226,7,8) (483,238,5,16) (494,238,7,16)                                                                                                  | 2   | Variantes de lengua arriba                         |

Total: 72 frames. La división jump/flip/fall se valida visualmente en el
contact sheet del output.

### Anchor / baseline

Los frames de una animación tienen tamaños distintos (el sheet está
empaquetado irregularmente). Para que Yoshi no "salte" al cambiar de
frame:

- **stageBox** (YOSHI_SHEET: 27x32): el host conserva SIEMPRE ese
  aspect-ratio y todos los frames se escalan con el mismo factor. El pie
  del personaje nunca se mueve entre estados: agacharse = más bajo,
  lengua = sobresale, sin cambios bruscos de proporciones. Sin stageBox
  se usa el box de cada animación (comportamiento por defecto).
- **anchor por animación**: 'bottom-center' (default, pies centrados) o
  'bottom-left' (cuerpo fijo a la izquierda). `tongue` usa bottom-left
  porque el cuerpo está a la izquierda del bbox y la lengua se extiende
  hacia la derecha sin desplazar al personaje.
- El frame se ancla con `bottom: 0` (feet planted) y la escala CSS crece
  desde `transform-origin: 50% 100%`.
- La matemática vive en `sprite-geometry.ts` (`boxOf`, `stageBoxOf`,
  `frameGeometry`), pura y testeada.

## GSAP animation flow (hero-yoshi.ts + hero-tongue.ts)

Escena de "succión" en el hero (se ejecuta UNA vez, al cargar):

```
[-]    La CORTINA (hero-curtain, estilo Mario Bros) cubre el hero desde
       el render inicial: es la máscara de carga, no se ve ningún estado
       intermedio. Con reduced-motion la cortina no existe (CSS).

[0s]   GSAP oculta el hero-grid a la derecha (x: innerWidth + opacity 0 +
       scale 1.25) y la cortina se abre hacia arriba (yPercent -100,
       0.65s) mientras Yoshi ya viene caminando por detrás, emergiendo
       a mitad de apertura

[0.25s] Yoshi entra CAMINANDO (walk) deslizándose a su lugar en el
       medio-izquierdo; su sombra de piso aparece con él

[0.9s] VOLTERETA al llegar (flip + arco de GSAP); la sombra se achica
       en el aire

[1.5s] Aterriza en tongueIdle (tongueStyles/01) con un "plant"

[1.7s] La lengua se despliega: N segmentos de tongueStyles/02 (cuerpo)
       con tongueStyles/05 como punta, en barrido lineal de izquierda a
       derecha (scaleX 0->1, origin left, un pedazo por vez) desde la
       boca hasta el borde derecho del hero. El barrido dura SIEMPRE
       1.5s: el paso por segmento se deriva de la cantidad, así no se
       alarga en pantallas anchas

[3.4s] Pausa breve (la lengua "llegó a la derecha")

[3.6s] SUCCIÓN:
         • hero-grid: x 100vw -> 0 con ease power3.in (acelera = absorbido)
           y escala 1.25 -> 1 (llega grande y se acomoda en su lugar)
         • lengua: se contrae y desvanece en cascada real (punta -> boca,
           un pedazo por vez, power3.in), dura lo mismo que el vuelo del
           grid (0.95s) y termina exacto cuando el hero aterriza

[4.6s] Yoshi se da vuelta (espejo scaleX -1), cambia a walk y se va
       caminando hacia la izquierda (sombra simétrica incluida; el
       overflow del hero lo corta al salir). El contenido queda en su
       lugar.
```

Detalles:

- El cuerpo de Yoshi es SIEMPRE `tongueIdle` (= tongue/01); no cambia de
  pose. La lengua es `HeroTongue`: segmentos generados en runtime según
  el viewport (N = innerWidth / 80px + 1), así la lengua cruza SIEMPRE
  todo el hero (desktop y mobile); el exceso se corta en el `overflow:
hidden` del hero.
- `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`: con
  reduced-motion la escena no corre y el contenido del hero es visible.
- Carga lazy de GSAP (`GsapService`) + `gsap.context()` con `revert()`.
- GSAP SOLO anima hosts (x/y/opacity/scale); los sprites reproducen
  frames por su cuenta.

## About (sin animación)

El About ya no tiene personaje ni animación: el contenido es estático y
siempre visible (SSR-safe, reduced-motion-safe). La escena narrativa vive
exclusivamente en el hero.

- `gsap.context()` con `revert()` en `ngOnDestroy`.
- GSAP SOLO anima el host (x/y/scale/opacity/rotation); el frame interno
  queda fuera de su alcance.

## Trajectory

```html
<app-yoshi-character state="run" />
```

El walker del curso: GSAP mueve `.course-walker` a lo largo de la línea
(scroll scrub) mientras el sprite reproduce el ciclo `run/01..10`.
Oculto en mobile (CSS existente).

## Performance

- Un único elemento visual por personaje (`background-image` + swap de
  `background-image` por frame).
- Precarga de todos los frames al iniciar (sin parpadeos).
- `setInterval` por fps con `clearInterval` en `ngOnDestroy` y al cambiar
  de animación; `matchMedia` listener removido en destroy; sin observadores
  colgados; timelines GSAP con `context().revert()`.
- `image-rendering: pixelated` para nitidez retro.
- `prefers-reduced-motion: reduce` -> primer frame estático, sin timer.
- Solo se anima `transform`/`opacity` en el host (GSAP); el frame cambia
  `background-image`, sin layout thrash.

## Adding a new frame

1. Agregá/corregí la entrada en `yoshi.sprites.ts` usando el helper `f()`:
   ```ts
   f('walk', 1, 5, 6, 27, 32); // (anim, n, x, y, w, h en el sheet)
   ```
2. Ejecutá `npm run extract:yoshi` para regenerar los PNG.

## Adding a new animation

1. Agregá la entrada en `animations` de `YOSHI_SHEET`:
   ```ts
   myAction: {
     fps: 4,
     frames: [f('myAction', 1, ...), f('myAction', 2, ...)],
   },
   ```
2. Si es un estado público, sumalo a `YoshiState`.
3. `npm run extract:yoshi` y usalo: `yoshi.setState('myAction')`.

## Adding a new character

El motor se reutiliza sin duplicar lógica:

1. Dejá el sheet master en `src/assets/game/<char>/...` (angular.json ya
   sirve `src/assets`).
2. Creá la definición `SpriteSheet` (patrón de `yoshi.sprites.ts`).
3. Usá el motor genérico directo o creá un wrapper:
   ```html
   <app-sprite-character [sheet]="mySheet" state="idle" [scale]="1" />
   ```

## Futuros assets (coins, gameboy)

Carpetas ya creadas y documentadas:

- `src/assets/game/coins/README.md` -> `COIN_SHEET` (estado típico:
  `spin`, fps ~8). Ej: `<app-sprite-character [sheet]="COIN_SHEET" state="spin" />`.
- `src/assets/game/gameboy/README.md` -> `GAMEBOY_SHEET`
  (estados típicos: `open`, `playing`, `close`).

Para cada uno: dejar el sheet master, definir la `SpriteSheet`, ejecutar
el extractor si tiene coordenadas, y usar el mismo `<app-sprite-character>`.

## Archivos

```
scripts/
  extract-yoshi-sprites.mjs   -> extractor (lee YOSHI_SHEET, valida, escribe PNG)

src/app/game/sprites/
  types.ts                 -> SpriteFrame / SpriteAnimation (anchor) / SpriteSheet (stageBox)
  sprite-geometry.ts       -> boxOf + stageBoxOf + frameGeometry (anchor bottom-center / bottom-left)
  yoshi.sprites.ts         -> YOSHI_SHEET (fuente de verdad) + YoshiState
  sprite-character.ts      -> motor genérico (un elemento, timer por fps)
  yoshi-character.ts       -> wrapper Yoshi sobre el motor
  sprite-character.spec.ts -> tests de geometría, sheet y motor
  README.md                -> esta documentación

src/assets/game/
  yoshi/                   -> sheet master + PNG extraídos
  coins/README.md          -> dónde va el sprite de la moneda
  gameboy/README.md        -> dónde va el sprite de la Game Boy
```
