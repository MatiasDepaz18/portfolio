# Coins - Sprite

Sprite real de la moneda del portfolio. Se usa en About (los 4 slots de
metadata: "3+ AÑOS IT", "SOFTWARE", "AI / ML", "DATA") con el componente
`app-coin`: levita en todo momento y se levanta al pasar el mouse (sin
girar).

## Archivos

- `coin.png`: sprite original subido (920x966). **Sin transparencia**:
  incluye fondo blanco.
- `coin-clean.png`: sprite con el fondo removido (generado). Es el que
  usa el sitio.

## Cómo limpiar el fondo

Los PNG de monedas no suelen traer transparencia. Si reemplazás
`coin.png`, ejecutá:

```
npm run clean:assets
```

(flood fill desde los bordes + verificación automática). Si la
verificación falla, ajustá `threshold` en `scripts/clean-assets.mjs`.

## Uso

```html
<app-coin label="SOFTWARE" />
```

El comportamiento (levitación + hover) vive en
`src/app/components/shared/coin/coin.ts`, CSS puro, con fallback de
reduced-motion.
