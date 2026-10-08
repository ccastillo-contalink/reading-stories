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

## Resumen y premio de televisión

El botón **Resumen** muestra los puntos ganados por tiempo de lectura, respuestas correctas, errores y minutos de televisión.

**Premio = minutos completos de lectura + respuestas correctas − respuestas incorrectas**, con un mínimo de cero. Ejemplo: 20 minutos + 21 aciertos − 1 error = **40 minutos de televisión**.

El reloj cuenta mientras hay una oración o pregunta abierta y la página está visible. Se pausa en el catálogo, al abrir el resumen y al cambiar de pestaña u ocultar la página. Los aciertos y errores incluyen tanto la elección de dibujos como las preguntas finales. Un acierto se cuenta una vez antes de avanzar; cada intento incorrecto resta un punto.

El resumen se guarda en `sessionStorage`: se conserva al recargar la misma pestaña y normalmente se elimina al cerrarla. Los datos permanecen en el navegador y no se envían a un servidor.

## Contenido e imágenes

`public/data/stories.json` contiene los títulos, oraciones, recortes de cada escena y preguntas. En cada pregunta, `correct` es la posición correcta: 0 para A, 1 para B y 2 para C. El orden de `options` permanece fijo.

`public/images` guarda las 40 láminas WebP, cada una con 7 escenas, y 40 copias pequeñas para el catálogo. Las vistas usan recortes SVG para mostrar la escena correspondiente. La lámina de un cuento se reutiliza en todos sus pasos. El catálogo carga las imágenes conforme se acercan a la pantalla.

`public/documents/40-cuentos-recortables.pdf` es el cuaderno imprimible. Las imágenes y el PDF se sirven desde el mismo sitio; no dependen de servicios externos de imágenes.

## Comprobar y publicar

```sh
npm test
npm run build
```

La compilación queda en `docs/`, una carpeta generada que no se guarda en Git. El workflow `.github/workflows/deploy-pages.yml` publica automáticamente desde el repositorio personal **ccastillo-contalink/reading-stories** cada vez que se envían cambios a `main`.

El GitHub Action instala las dependencias con `npm ci`, ejecuta las pruebas, compila la página y publica el resultado en GitHub Pages. Si falla una prueba o la compilación, conserva la versión publicada. También se puede iniciar manualmente desde la pestaña Actions.

Después de editar:

```sh
git add .
git commit -m "Actualizar cuentos"
git push origin main
```

No es necesario subir la compilación ni publicar manualmente.

Sitio: https://ccastillo-contalink.github.io/reading-stories/

GitHub Pages sirve la versión estática de React. El servidor Node.js se usa para abrir la misma aplicación localmente.

Material educativo no oficial. Bluey y sus personajes pertenecen a sus respectivos titulares.
