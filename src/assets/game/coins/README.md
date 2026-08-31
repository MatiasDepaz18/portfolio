# Coins - Sprite Sheet

Carpeta preparada para el sprite de las monedas del portfolio.

## Cómo integrarlo

1. Dejá el sprite acá, por ejemplo: `coin-sprites.png`
   (sugerencia: frames en fila, fondo transparente).
2. Creá la definición en `src/app/game/sprites/` siguiendo el patrón de
   `yoshi.sprites.ts`:

   ```ts
   export const COIN_SHEET: SpriteSheet = {
     url: 'assets/game/coins/coin-sprites.png',
     sheetWidth: <ancho>,
     sheetHeight: <alto>,
     basePath: 'assets/game/coins',
     defaultAnimation: 'spin',
     animations: {
       spin: {
         fps: 8,
         frames: [ /* f('spin', 1, x, y, w, h), ... */ ],
       },
     },
   };
   ```

3. Si el sheet tiene coordenadas, ejecutá el extractor (con los bboxes en
   la definición). Si los frames ya vienen como PNG individuales, usá
   `frame()` con `src` directos.
4. Usalo:

   ```html
   <app-sprite-character [sheet]="COIN_SHEET" state="spin" />
   ```

Los PNG individuales extraídos se guardan acá mismo:
`src/assets/game/coins/<anim>/NN.png`.
