# Cuentos con Bluey

Actividad de lectura en español con 40 cuentos originales, 280 oraciones e ilustraciones y 120 preguntas de comprensión. Diseño adaptable a celular, tableta y computadora.

## Abrir en esta computadora

Requiere Node.js 20.19 o posterior.

```sh
cd ~/Documents/reading-stories
npm install
npm start
```

Abre http://127.0.0.1:3000. `npm start` prepara la página y enciende el pequeño servidor Node.js. Para detenerlo, presiona Ctrl+C.

Para editar con actualización automática:

```sh
npm run dev
```

## Cómo funciona

- El catálogo muestra 40 cuentos.
- Cada cuento tiene 7 oraciones de entre 8 y 10 palabras.
- En cada paso aparecen 3 dibujos. Al equivocarse, cambian de posición los mismos 3 dibujos y la respuesta correcta permanece disponible.
- Después de acertar, el botón permite pasar a la siguiente oración.
- Al finalizar la lectura hay 3 preguntas con opciones A, B y C. Su orden es fijo, incluso tras un error.
- Al terminar las preguntas, vuelve automáticamente al catálogo.
- Los cuentos completados se marcan durante la sesión abierta. No se envían datos del niño a ningún servidor.
- El cuaderno PDF de 40 páginas se descarga únicamente al pulsar el enlace correspondiente.

## Contenido e imágenes

`public/data/stories.json` contiene los títulos, oraciones, recortes de cada escena y preguntas. En cada pregunta, `correct` es la posición correcta: 0 para A, 1 para B y 2 para C. El orden de `options` permanece fijo.

`public/images` guarda las 40 láminas WebP, cada una con 7 escenas, y 40 copias pequeñas para el catálogo. Las vistas usan recortes SVG para mostrar la escena correspondiente. La lámina de un cuento se reutiliza en todos sus pasos. El catálogo carga las imágenes conforme se acercan a la pantalla.

`public/documents/40-cuentos-recortables.pdf` es el cuaderno imprimible. Las imágenes y el PDF se sirven desde el mismo sitio; no dependen de servicios externos de imágenes.

## Comprobar y publicar

```sh
npm test
npm run build
```

La compilación queda en `docs/`. GitHub Pages publica la rama `main`, carpeta `/docs`, del repositorio personal **ccastillo-contalink/reading-stories**. Después de editar, vuelve a compilar, guarda los cambios de fuente y de `docs/` en Git y envíalos al repositorio.

Sitio: https://ccastillo-contalink.github.io/reading-stories/

GitHub Pages sirve la versión estática de React. El servidor Node.js se usa para abrir la misma aplicación localmente.

Material educativo no oficial. Bluey y sus personajes pertenecen a sus respectivos titulares.
