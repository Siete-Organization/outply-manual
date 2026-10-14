/* Manual de Outply: buscador, cambio de idioma e índice activo.
 *
 * Cada idioma es una página (es/, en/, pt/) con las mismas secciones (#s1, #s2…), así que al
 * cambiar de idioma se conserva la sección y la búsqueda. `?q=` abre el manual ya buscando.
 */
(function () {
  "use strict";

  var lang = (document.documentElement.lang || "es").slice(0, 2); // la página en portugués es «pt-BR»
  var TEXTOS = {
    es: { nada: "Nada coincide con «{q}». Prueba con otra palabra.", uno: "1 resultado", varios: "{n} resultados" },
    en: { nada: "Nothing matches “{q}”. Try another word.", uno: "1 result", varios: "{n} results" },
    pt: { nada: "Nada corresponde a “{q}”. Tente outra palavra.", uno: "1 resultado", varios: "{n} resultados" }
  };
  var tx = TEXTOS[lang] || TEXTOS.es;

  function guardar(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* navegador sin almacenamiento: no pasa nada */ }
  }

  // El idioma elegido se recuerda para la próxima visita a la raíz del manual.
  guardar("outply-manual-lang", lang);

  // ── cambio de idioma: misma sección ───────────────────────────────────────────
  // La búsqueda no viaja: unas palabras en un idioma no encuentran nada en otro.
  var entrada = document.getElementById("buscar");
  document.querySelectorAll(".langs a").forEach(function (a) {
    a.addEventListener("click", function () {
      guardar("outply-manual-lang", a.getAttribute("hreflang"));
      var base = a.getAttribute("href").split("?")[0].split("#")[0];
      a.setAttribute("href", base + location.hash);
    });
  });

  // ── buscador ──────────────────────────────────────────────────────────────────
  function normalizar(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // El texto de un bloque sin el número de sección («06») ni la etiqueta «Nuevo», que van en su
  // propio <span>.
  function sinNumero(el) {
    var copia = el.cloneNode(true);
    copia.querySelectorAll(".num, .nuevo").forEach(function (n) { n.remove(); });
    return copia.textContent;
  }

  var BLOQUES = "main section h2, main section h3, main section p, main section li, " +
    "main section td, main section dt, main section dd";
  var indice = [];
  document.querySelectorAll(BLOQUES).forEach(function (el) {
    // Un <li> que solo envuelve párrafos ya se indexa por sus <p>.
    if (el.tagName === "LI" && el.querySelector("p")) return;
    var texto = sinNumero(el).replace(/\s+/g, " ").trim();
    if (!texto) return;
    var seccion = el.closest("section");
    var h2 = seccion && seccion.querySelector("h2");
    indice.push({
      el: el,
      texto: texto,
      norm: normalizar(texto),
      seccion: h2 ? sinNumero(h2).trim() : "",
      titulo: /^H[23]$/.test(el.tagName)
    });
  });

  var panel = document.getElementById("resultados");
  var elegido = -1;

  function escapar(s) {
    return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  // Un trozo del texto alrededor de la primera coincidencia, con las palabras resaltadas. Se marca
  // sobre el texto plano y cada trozo se escapa por separado: nada del manual ni de la búsqueda
  // llega a la página como HTML.
  function fragmento(texto, palabras) {
    var pos = normalizar(texto).indexOf(palabras[0]);
    var desde = Math.max(0, pos - 60);
    var corte = texto.slice(desde, desde + 180);
    var plano = normalizar(corte);
    var marcas = [];
    palabras.forEach(function (p) {
      for (var j = plano.indexOf(p); j !== -1; j = plano.indexOf(p, j + p.length)) marcas.push([j, j + p.length]);
    });
    marcas.sort(function (a, b) { return a[0] - b[0]; });
    var html = desde > 0 ? "…" : "", i = 0;
    marcas.forEach(function (m) {
      if (m[0] < i) return; // solapada con la anterior
      html += escapar(corte.slice(i, m[0])) + "<mark>" + escapar(corte.slice(m[0], m[1])) + "</mark>";
      i = m[1];
    });
    return html + escapar(corte.slice(i)) + (desde + 180 < texto.length ? "…" : "");
  }

  function buscar(q) {
    // «de», «la», «en»… no ayudan a buscar y lo subrayan todo: cuentan solo si no hay otra cosa.
    var todas = normalizar(q).split(/\s+/).filter(function (p) { return p.length > 0; });
    var palabras = todas.filter(function (p) { return p.length > 2; });
    if (!palabras.length) palabras = todas.filter(function (p) { return p.length > 1; });
    if (!palabras.length) { cerrar(); return; }
    var hallados = indice.filter(function (x) {
      return palabras.every(function (p) { return x.norm.indexOf(p) !== -1; });
    });
    // Primero los títulos, después el texto; cada uno en el orden del manual.
    hallados.sort(function (a, b) { return (b.titulo ? 1 : 0) - (a.titulo ? 1 : 0); });
    hallados = hallados.slice(0, 40);
    elegido = -1;
    if (!hallados.length) {
      panel.innerHTML = '<p class="vacio">' + escapar(tx.nada.replace("{q}", q)) + "</p>";
    } else {
      panel.innerHTML = '<p class="cuenta">' +
        (hallados.length === 1 ? tx.uno : tx.varios.replace("{n}", hallados.length)) + "</p>";
      hallados.forEach(function (x, i) {
        var a = document.createElement("a");
        a.href = "#";
        a.setAttribute("role", "option");
        a.innerHTML = "<b>" + escapar(x.seccion) + "</b><span>" + fragmento(x.texto, palabras) + "</span>";
        a.addEventListener("click", function (e) { e.preventDefault(); ir(x.el); });
        a.dataset.i = String(i);
        panel.appendChild(a);
      });
    }
    panel.hidden = false;
    entrada.setAttribute("aria-expanded", "true");
  }

  function cerrar() {
    panel.hidden = true;
    entrada.setAttribute("aria-expanded", "false");
  }

  function ir(el) {
    cerrar();
    var seccion = el.closest("section");
    if (seccion && seccion.id) history.replaceState(null, "", location.pathname + location.search + "#" + seccion.id);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("destello");
    void el.offsetWidth; // reinicia la animación si se vuelve al mismo sitio
    el.classList.add("destello");
  }

  if (entrada && panel) {
    var espera;
    entrada.addEventListener("input", function () {
      clearTimeout(espera);
      espera = setTimeout(function () { buscar(entrada.value); }, 120);
    });
    entrada.addEventListener("focus", function () { if (entrada.value.trim()) buscar(entrada.value); });
    entrada.addEventListener("keydown", function (e) {
      var opciones = panel.querySelectorAll("a");
      if (e.key === "Escape") { cerrar(); entrada.blur(); return; }
      if (!opciones.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        elegido = (elegido + (e.key === "ArrowDown" ? 1 : -1) + opciones.length) % opciones.length;
        opciones.forEach(function (o, i) { o.setAttribute("aria-selected", i === elegido ? "true" : "false"); });
        opciones[elegido].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        opciones[Math.max(elegido, 0)].click();
      }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search")) cerrar();
    });
    // «/» lleva al buscador desde cualquier parte, como en la mayoría de documentaciones.
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== entrada && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
        e.preventDefault();
        entrada.focus();
      }
    });
    var q = new URLSearchParams(location.search).get("q");
    if (q) {
      entrada.value = q;
      buscar(q);
      entrada.focus();
    }
  }

  // ── índice: se rehace con las secciones de la página ──────────────────────────
  // Así, quien edite el manual solo toca las <section>: el índice (y el del móvil) sale de sus
  // <h2>. El que viene escrito en la página queda para quien navega sin JavaScript.
  var secciones = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var tocLista = document.querySelector(".toc ol");
  var movilLista = document.querySelector(".mobiletoc ol");
  if (tocLista && secciones.length) {
    tocLista.textContent = "";
    if (movilLista) movilLista.textContent = "";
    secciones.forEach(function (s) {
      var h2 = s.querySelector("h2");
      if (!h2) return;
      var num = h2.querySelector(".num");
      var titulo = sinNumero(h2).replace(/\s+/g, " ").trim();
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + s.id;
      var i = document.createElement("i");
      i.textContent = num ? num.textContent.trim() : "";
      a.appendChild(i);
      a.appendChild(document.createTextNode(" " + titulo));
      li.appendChild(a);
      tocLista.appendChild(li);
      if (movilLista) {
        var li2 = document.createElement("li");
        var a2 = document.createElement("a");
        a2.href = "#" + s.id;
        a2.textContent = titulo;
        li2.appendChild(a2);
        movilLista.appendChild(li2);
      }
    });
  }

  // ── índice: marca la sección que se está leyendo ──────────────────────────────
  var enlaces = {};
  document.querySelectorAll(".toc a").forEach(function (a) { enlaces[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var visible = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(enlaces).forEach(function (id) { enlaces[id].classList.toggle("activa", id === en.target.id); });
      });
    }, { rootMargin: "-30% 0px -65% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { visible.observe(s); });
  }

  // Al llegar con #sN (desde otro idioma o un enlace), las fuentes web cargan después y mueven
  // la página: se vuelve a la sección cuando ya está todo pintado.
  if (location.hash && !new URLSearchParams(location.search).get("q")) {
    var destino = document.getElementById(location.hash.slice(1));
    if (destino) {
      window.addEventListener("load", function () {
        var listo = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        listo.then(function () { destino.scrollIntoView({ behavior: "instant" }); });
      });
    }
  }
})();
