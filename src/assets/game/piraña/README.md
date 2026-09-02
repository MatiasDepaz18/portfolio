# Piraña - Sprite

Sprite de la Planta Piraña del portfolio. La cabeza se usa como la
punta del tallo del recorrido en Experiencia laboral (`app-trajectory`)
y como decoración fija en la barra de scroll lateral
(`app-scroll-plant`), con el componente `app-piranha-plant`.

## Archivos

- `planta-sprite.png`: sheet master original (419x380, RGBA). **No se
  modifica**: es el asset original.
- `mouth/01..02.png` y `start/01..02.png`: PNG extraídos por
  `npm run extract:piranha` (coordenadas en
  `src/app/game/sprites/piranha.sprites.ts`).

## Rotación horneada (270)

Todas las animaciones declaran `rotate: 270`: el extractor rota los PNG
al extraerlos (el tallo vertical del sheet queda horizontal). Los
frames `start/01` y `start/02` pasan de 77x38 / 77x77 a 38x77 / 77x77;
`mouth/02` pasa de 76x75 a 75x76. El rect `source` del sheet conserva
las coordenadas originales del sheet master.

## Layout del sheet (componentes conexos)

| Frame     | Rect (x, y, w, h) | Poses                                    |
| --------- | ----------------- | ---------------------------------------- |
| mouth/01  | 15, 193, 76, 76   | boca abierta (labios rojos, interior blanco) |
| mouth/02  | 15, 273, 76, 75   | boca cerrada (mandíbula levantada)       |
| start/01  | 47, 29, 77, 38    | "tallo chico" corto (planta con tallo, boca cerrada) |
| start/02  | 47, 89, 77, 77    | "tallo chico" alto (idem, más alto)      |

La boca (mouth/01 y mouth/02) tiene SIEMPRE la misma altura: el paso
abierta <-> cerrada es continuo, sin saltos de escala. La cabeza nunca
se hunde ni desaparece.

## Animaciones

- `bite` (default): loop `mouth/01` <-> `mouth/02`, la boca abre y
  cierra sin parar (la planta "come" aunque esté quieta). Usado por la
  scroll plant y por la boca del recorrido en Experiencia laboral (viaja
  sobre el último tallo 01 generado).
- `stemShort` (start/01): los tallos 01 que forman la fila del
  recorrido en Experiencia laboral: GSAP los va creando de a uno con el
  scroll, de izquierda a derecha, hasta llenar el curso.
- `stemTall` (start/02): sin uso actual (quedó fuera del recorrido).

## Boca blanca

La animación `bite` declara `whiteMouth: true`: el extractor pinta de
blanco el interior del hocico (flood fill desde los píxeles
transparentes flanqueados por los labios rojos). Si se reemplaza el
sheet, se re-ejecuta `npm run extract:piranha` y el blanco se regenera.

## Uso

```html
<app-piranha-plant />               <!-- bite (default) -->
<app-piranha-plant state="stemShort" /> <!-- tallo chico -->
```

La reproducción de frames la maneja el motor `SpriteCharacter`; GSAP
mueve el host por fuera.