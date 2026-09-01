# Nintendo Switch - Sprite

Sprite HD de la Switch del portfolio. Se usa en la sección Habilidades
como carrusel: cada slide es una consola y las skills viven DENTRO de la
pantalla (que es transparente en el sprite body).

## Archivos

- `switch.png`: sprite fuente (824x350, fondo transparente), convertido
  desde el webp HD original.
- `switch-body.png`: sprite con la pantalla recortada (transparente).
  Es el que usa el sitio (el contenido de Habilidades pasa a través).

## Cómo regenerar

Si reemplazás `switch.png`, ejecutá:

```
npm run clean:assets
```

El script le recorta la pantalla (vidrio gris plano 51,51,51) con el
rect de `SWITCH_JOB.screen` en `scripts/clean-assets.mjs` y verifica que
el interior del rect sea vidrio antes de cortar. Si el sprite nuevo
tiene otra distribución, ajustá ese rect.

## Uso

El carrusel de Habilidades usa `switch-body.png` como fondo de cada
slide (ver `SWITCH_SPRITE` en `skills.ts`). El overlay del contenido se
posiciona con CSS en `skills.css` (`.switch-screen`) usando el rect:

- pantalla 527x296 en x148,y29 (sprite 824x350)
