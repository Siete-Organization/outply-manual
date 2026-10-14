# Manual de uso de Outply

El manual de Outply para quien lo usa a diario (SDR, operadores y administradores de agencia), en
**español, inglés y portugués**, con buscador. Se consulta en línea, sin descargar nada:

**https://siete-organization.github.io/outply-manual/**

El botón **«?»** de Outply abre esta página en el idioma de la interfaz (`?lang=es|en|pt`). También
acepta una búsqueda: `?q=dominio de tracking`.

## Cómo está hecho

| Archivo | Qué es |
|---|---|
| `index.html` | Entrada: manda a `es/`, `en/` o `pt/` según `?lang=`, el último idioma usado o el del navegador. |
| `es/index.html`, `en/index.html`, `pt/index.html` | El manual en cada idioma. Las secciones llevan los mismos ids (`#s1`, `#s2`…), así que al cambiar de idioma se queda en la misma sección. |
| `assets/manual.css` | Diseño (identidad Siete; modo claro y oscuro según el sistema). |
| `assets/manual.js` | Buscador, cambio de idioma e índice, que se arma solo con los títulos de las secciones. |

Es HTML estático: GitHub Pages lo publica tal cual desde la rama `main` (raíz). No hay paso de
compilación.

## Editar

1. Cambia el texto dentro de la `<section id="sN">` que toque, en los tres idiomas.
2. Para una sección nueva, copia una existente con el siguiente id y su número en
   `<span class="num">`. El índice se actualiza solo.
3. Convenciones de marcado:
   - nombres de pantalla: `<span class="ui">Campañas</span>`;
   - valores literales: `<code>{{FirstName}}</code>`;
   - avisos: `<div class="note">`, con las variantes `note--warn` y `note--stop`;
   - en los pasos (`<ol class="steps">`), el texto de cada `<li>` va dentro de `<p>`.
4. Al subir a `main`, la página se actualiza en uno o dos minutos.

Es un documento público: sin nombres de clientes, correos de personas ni datos internos.
