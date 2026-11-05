/* Imagen del componente (PNG o SVG) a partir de su HTML/CSS.
   El SVG lleva el componente dentro de un <foreignObject> (XHTML bien formado) y la fuente de la
   app incrustada, así que se ve igual en cualquier visor que renderice HTML dentro de SVG (navegadores).
   El PNG se saca de ese mismo SVG con un canvas al doble de resolución. Si el navegador no deja
   exportar el canvas (Safari antiguo) se avisa y queda el SVG. */
let imgFontPromise = null;
function imgFontDataUrl() {
  if (!imgFontPromise) {
    imgFontPromise = fetch("fonts/plus-jakarta-sans.woff2").then(r => r.arrayBuffer()).then(b => {
      const u = new Uint8Array(b); let s = "";
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return "data:font/woff2;base64," + btoa(s);
    }).catch(() => null);
  }
  return imgFontPromise;
}
function slugName(s) { return String(s || "estilo").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "estilo"; }

async function componentSvgString(e) {
  const W = 340, PAD = 24, bg = e.mode === "dark" ? "#0A0B1E" : "#E3E8F6";
  let html, css = "";
  if (e.code && String(e.code).trim()) html = String(e.code); else { const p = designParts(e); html = p.html; css = p.css; }
  const font = await imgFontDataUrl();
  const ff = font ? "@font-face{font-family:'Plus Jakarta Sans';font-weight:500 800;src:url(" + font + ") format('woff2')}" : "";
  const base = "*{box-sizing:border-box;margin:0}button{font:inherit;border:0;background:none;color:inherit}svg{display:block;flex:none}p{margin:0}";
  /* DOMParser + XMLSerializer: convierte el HTML (<br>, &nbsp;, <img> sin cerrar…) en XHTML válido para el SVG. */
  const doc = new DOMParser().parseFromString('<!doctype html><body><div style="width:' + W + 'px;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif;color:#14161B;line-height:1.3"><style>' + ff + base + css + '</style>' + html + '</div></body>', "text/html");
  const node = doc.body.firstElementChild;
  /* Se mide dentro de un Shadow DOM oculto: así sus estilos no afectan a la página. */
  const host = document.createElement("div"); host.style.cssText = "position:fixed;left:-99999px;top:0;visibility:hidden";
  document.body.appendChild(host);
  host.attachShadow({ mode: "open" }).appendChild(document.importNode(node, true));
  const h = Math.ceil(host.shadowRoot.firstElementChild.getBoundingClientRect().height) || 200; host.remove();
  const w = W + PAD * 2, H = h + PAD * 2;
  return {
    w, h: H,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + H + '" viewBox="0 0 ' + w + " " + H + '"><rect width="100%" height="100%" rx="20" fill="' + bg + '"/><foreignObject x="' + PAD + '" y="' + PAD + '" width="' + W + '" height="' + h + '">' + new XMLSerializer().serializeToString(node) + "</foreignObject></svg>"
  };
}

async function componentImage(e, kind) {
  try {
    const { svg, w, h } = await componentSvgString(e), name = slugName(e.name);
    if (kind === "svg") { downloadBlob(new Blob([svg], { type: "image/svg+xml" }), name + ".svg"); toast("SVG descargado"); return; }
    const img = await loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
    const c = document.createElement("canvas"), k = 2; c.width = w * k; c.height = h * k;
    const g = c.getContext("2d"); g.scale(k, k); g.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("png")), "image/png"));
    downloadBlob(blob, name + ".png"); toast("PNG descargado");
  } catch (err) { toast(kind === "png" ? "No se pudo crear el PNG en este navegador; prueba con SVG" : "No se pudo crear la imagen"); }
}
