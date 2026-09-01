# Screenshots de proyectos

Acá van los screenshots de la landing/página de cada proyecto. El
cartucho los muestra en el frente (slot de arte del label).

## Cómo agregar uno

1. Copiá el screenshot acá, por ejemplo `mi-proyecto.png`.
2. En `src/app/data/projects.data.ts`, agregá en el proyecto:

   ```ts
   image: 'assets/projects/mi-proyecto.png',
   ```

3. El slot recorta con `object-fit: cover; object-position: top`:
   - Apaisado (landscape) es lo ideal.
   - El header de la página queda visible arriba.
   - Sin `image`, el frente muestra el title screen (título + stack).