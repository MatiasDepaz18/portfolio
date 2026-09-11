# Fotos de Educación

Acá van las fotos de tu tiempo en la facultad. El card de Educación
muestra la **portada** (foto del título) como miniatura y, al tocarla,
abre un **carrousel** con las fotos de la carrera.

## Cómo agregarlas

1. Copiá las fotos acá, por ejemplo:
   - `titulo-unt.jpg` (portada: el título)
   - `foto-materias.jpg`, `foto-egresados.jpg` (vida en la facultad)
2. En `src/app/data/education.data.ts`, agregá en el entry:

   ```ts
   period: '2017 — 2024',           // el tiempo que tardaste
   image: 'assets/education/titulo-unt.jpg',
   imageAlt: 'Título de Ingeniero en Computación',
   photos: [
     'assets/education/foto-materias.jpg',
     'assets/education/foto-egresados.jpg',
   ],
   photoCaptions: [
     'Título de grado · UNT',        // leyenda de la portada
     'Últimas materias',             // leyenda de cada foto (opcional)
     'Egresados 2024',
   ],
   ```

3. El carrousel muestra la portada primero y después las fotos, con
   prev / next, teclado ← → y swipe en mobile.
   - `photoCaptions` es opcional: una leyenda por imagen, en el mismo
     orden (portada + fotos).
   - Sin `image` ni `photos`, el card muestra un placeholder pixel y no
     se abre el carrousel.
   - La miniatura recorta con `object-fit: cover` (apaisado ideal);
     el carrousel muestra la foto completa.