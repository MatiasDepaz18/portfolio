# Gameboy - Sprite

Sprite real de la Game Boy del portfolio. Se usa en About, superpuesta
sobre la foto de Matías: la pantalla del sprite es TRANSPARENTE
(`gameboy-body.png`), así la foto se ve a través de la pantalla, como el
juego que está viendo el jugador.

## Archivos

- `gameboy.png`: sprite original subido (900x512). **Sin transparencia**:
  incluye fondo blanco.
- `gameboy-clean.png`: sprite con el fondo removido (generado).
- `gameboy-body.png`: sprite con la pantalla LCD recortada (transparente).
  Es el que usa el sitio (la foto de About pasa a través de la pantalla).

## Cómo limpiar el fondo y recortar la pantalla

Si reemplazás `gameboy.png`, ejecutá:

```
npm run clean:assets
```

El script remueve el fondo (flood fill + verificación) y luego recorta la
pantalla LCD (verde): calcula su bounding box y la vuelve transparente con
flood fill desde el centro de la pantalla. Si la detección falla, ajustá
`isScreen` en `scripts/clean-assets.mjs`.

## Uso

La Game Boy se renderiza con CSS en `about.css` (`.about-photo-gameboy`):
posición (sobre la foto), tamaño, rotación y sombra se ajustan ahí.
