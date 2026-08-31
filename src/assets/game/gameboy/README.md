# Gameboy - Sprite Sheet

Carpeta preparada para el sprite de la Game Boy del portfolio.

## Cómo integrarlo

1. Dejá el sprite acá, por ejemplo: `gameboy-sprites.png`
   (sugerencia: estados en filas, fondo transparente).
2. Creá la definición en `src/app/game/sprites/` siguiendo el patrón de
   `yoshi.sprites.ts`:

   ```ts
   export const GAMEBOY_SHEET: SpriteSheet = {
     url: 'assets/game/gameboy/gameboy-sprites.png',
     sheetWidth: <ancho>,
     sheetHeight: <alto>,
     basePath: 'assets/game/gameboy',
     defaultAnimation: 'open',
     animations: {
       open: { fps: 1, frames: [ /* ... */ ] },
       playing: { fps: 4, frames: [ /* ... */ ] },
       close: { fps: 1, frames: [ /* ... */ ] },
     },
   };
   ```

3. Ejecutá el extractor si el sheet tiene coordenadas (los bboxes van en
   la definición) o usá PNG individuales directos con `frame()`.
4. Usalo:

   ```html
   <app-sprite-character [sheet]="GAMEBOY_SHEET" state="playing" />
   ```

Los PNG individuales extraídos se guardan acá mismo:
`src/assets/game/gameboy/<anim>/NN.png`.
