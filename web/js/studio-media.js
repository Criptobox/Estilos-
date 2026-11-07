/* Contenido visual y destinos seguros. Sin ejecutar HTML ni URLs del usuario. */
const STUDIO_IMAGE_SLOTS = {
  "card.product": ".ph > svg", "card.photo": "svg.bgp", "card.category": "svg.il", "card.food": "svg.pl"
};
function studioURL(value, image) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return "";
  if (image && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(text) && text.length <= 750000) return text;
  if (text.length > 2048 || /[\x00-\x20\x7f]/.test(text)) return null;
  if (!image && /^#[a-zA-Z][\w-]*$/.test(text)) return text;
  try {
    const url = new URL(text);
    if (!(image ? ["https:"] : ["https:", "http:", "mailto:", "tel:"]).includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch (e) { return null; }
}
function studioAssets(raw, strict) {
  const out = {};
  const reject = () => { if (strict) throw Error("Imágenes o enlaces no válidos en el respaldo."); };
  if (raw === undefined) return out; // compatibilidad con respaldos anteriores
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) { reject(); return out; }
  Object.keys(raw).forEach(id => {
    if (!Object.hasOwn(ENTRY, id)) { reject(); return; }
    const item = raw[id];
    if (!item || typeof item !== "object" || Array.isArray(item)) { reject(); return; }
    const clean = { images: [], links: [] };
    ["images", "links"].forEach(key => {
      const values = item[key] || [];
      if (!Array.isArray(values) || values.length > 40) { reject(); return; }
      values.forEach(v => {
        if (v === null) { clean[key].push(null); return; }
        if (key === "links") {
          const href = studioURL(v, false);
          if (href === null) { reject(); clean.links.push(null); } else clean.links.push(href);
        } else {
          const src = v && studioURL(v.src, true);
          if (src === null || src === undefined || typeof v.alt !== "string" || v.alt.length > 200) { reject(); clean.images.push(null); }
          else clean.images.push({ src, alt: v.alt });
        }
      });
    });
    out[id] = clean;
  });
  return out;
}
function studioTargets(html, id) {
  const root = document.createElement("template"); root.innerHTML = html;
  const selector = STUDIO_IMAGE_SLOTS[variantOf(ENTRY[id])];
  return { root, images: selector ? [...root.content.querySelectorAll(selector)] : [], links: [...root.content.querySelectorAll("button,a")].slice(0,40) };
}
function studioApply(parts, entry, state = S) {
  const values = state.assets[entry.id]; if (!values) return parts;
  const parsed = studioTargets(parts.html, entry.id);
  parsed.images.forEach((original,i) => {
    const value = (values.images || [])[i]; if (!value || !value.src || !studioURL(value.src,true)) return;
    const img = document.createElement("img"); img.src = value.src; img.alt = value.alt || "";
    img.className = original.getAttribute("class") || "";
    img.style.cssText = "object-fit:cover;display:block;max-width:100%;";
    if (variantOf(entry) === "card.product") img.style.cssText += "width:100%;height:100%;border-radius:inherit;";
    img.referrerPolicy = "no-referrer"; img.loading = "lazy"; original.replaceWith(img);
  });
  let converted = false;
  parsed.links.forEach((original,i) => {
    const href = studioURL((values.links || [])[i], false); if (!href) return;
    let link = original;
    if (original.tagName === "BUTTON") {
      link = document.createElement("a");
      ["class", "style", "aria-label", "title"].forEach(k => { if (original.hasAttribute(k)) link.setAttribute(k, original.getAttribute(k)); });
      link.append(...original.childNodes); original.replaceWith(link); converted = true;
    }
    link.href = href; link.dataset.studioLink = "true";
    if (/^https?:/.test(href)) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
  });
  return { html: parsed.root.innerHTML, css: 'a[data-studio-link]{text-decoration:none;cursor:pointer}' + (converted ? parts.css.replace(/\bbutton\b/g, ':is(button,a[data-studio-link])') : parts.css) };
}
function studioMediaFields(id, host) {
  const parsed = studioTargets(designParts(styled(id)).html, id), value = S.assets[id] || {images:[],links:[]};
  const title = document.createElement("h5"); title.textContent = "Imágenes y enlaces"; host.appendChild(title);
  function field(labelText, kind, index, text, placeholder) {
    const label = document.createElement("label"); label.className = "content-field";
    const caption = document.createElement("span"); caption.textContent = labelText;
    const input = document.createElement("input"); input.type = "text"; input.value = text || ""; input.placeholder = placeholder || "";
    input.maxLength = kind === "alt" ? 200 : 2048;
    input.dataset.media = kind; input.dataset.id = id; input.dataset.index = index;
    label.append(caption,input); host.appendChild(label); return input;
  }
  if (!parsed.images.length) { const note = document.createElement("p"); note.className = "hint"; note.textContent = "Este diseño no tiene una zona de imagen compatible. Disponibles: Producto clara, Texto sobre foto, Categoría con ilustración y Comida."; host.appendChild(note); }
  parsed.images.forEach((node,i) => {
    const image = (value.images || [])[i] || {};
    field("Imagen " + (i+1) + " · URL HTTPS", "image",i,image.src && image.src.startsWith("data:") ? "" : image.src, image.src && image.src.startsWith("data:") ? "Imagen local incorporada · escribe una URL para reemplazarla" : "https://…");
    field("Descripción de la imagen", "alt",i,image.alt,"Ej.: Auriculares azules sobre fondo claro");
    const upload = document.createElement("input"); upload.type = "file"; upload.accept = "image/png,image/jpeg,image/webp"; upload.dataset.upload = id; upload.dataset.index = i; upload.setAttribute("aria-label","Subir imagen PNG, JPEG o WebP"); upload.className = "media-upload"; host.appendChild(upload);
    const reset = document.createElement("button"); reset.className = "btn sm"; reset.textContent = "Restaurar ilustración"; reset.dataset.act = "resetimage"; reset.dataset.id = id; reset.dataset.index = i; host.appendChild(reset);
  });
  parsed.links.forEach((node,i) => {
    const label = node.textContent.trim() || node.getAttribute("aria-label") || "Icono " + (i+1);
    field("Destino · " + label.slice(0,55),"link",i,(value.links || [])[i],"https://…, mailto:…, tel:… o #seccion");
  });
  if (!parsed.links.length) { const note = document.createElement("p"); note.className = "hint"; note.textContent = "Este diseño no contiene botones ni enlaces editables."; host.appendChild(note); }
}
function studioAsset(id) { if (!S.assets[id]) S.assets[id] = {images:[],links:[]}; return S.assets[id]; }
function studioMediaMessage(message) { document.getElementById("mediaStatus").textContent = message && !studioStorageOK ? "No se pudo guardar en este navegador. La vista previa cambió: exporta el HTML antes de salir o libera espacio." : message; }
document.getElementById("contentFields").addEventListener("input", ev => {
  const el = ev.target.closest("input[data-media]"); if (!el || !Object.hasOwn(ENTRY,el.dataset.id)) return;
  const id = el.dataset.id, i = Number(el.dataset.index), kind = el.dataset.media;
  if (!Number.isInteger(i) || i < 0 || i >= 40) return;
  const url = kind === "alt" ? el.value.slice(0,200) : studioURL(el.value,kind === "image");
  if (url === null) { el.setAttribute("aria-invalid","true"); studioMediaMessage("URL no permitida. Imágenes: HTTPS. Destinos: http(s), mailto, tel o #seccion. El último valor válido se conserva."); return; }
  el.removeAttribute("aria-invalid");
  const asset = studioAsset(id);
  if (kind === "link") asset.links[i] = url;
  else { const img = asset.images[i] || {src:"",alt:""}; img[kind === "alt" ? "alt" : "src"] = url; asset.images[i] = img; }
  renderScreen(); save("media:" + id + ":" + kind + ":" + i); studioMediaMessage("Cambio guardado. Los enlaces se activan en el HTML exportado, no en el editor.");
});
document.getElementById("contentFields").addEventListener("click", ev => {
  const b = ev.target.closest('[data-act="resetimage"]'); if (!b || !Object.hasOwn(ENTRY,b.dataset.id)) return;
  const asset = studioAsset(b.dataset.id); asset.images[Number(b.dataset.index)] = null; renderContent(); renderAll(); studioMediaMessage("Ilustración original restaurada.");
});
document.getElementById("contentFields").addEventListener("change", async ev => {
  const el = ev.target.closest("input[data-upload]"); if (!el) return;
  const file = el.files[0], id = el.dataset.upload, i = Number(el.dataset.index); if (!file || !Object.hasOwn(ENTRY,id)) return;
  let bitmap;
  try {
    if (!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 5*1024*1024) throw Error("Usa PNG, JPEG o WebP de hasta 5 MB. No se admite SVG.");
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1,1024/Math.max(bitmap.width,bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1,Math.round(bitmap.width*scale)); canvas.height = Math.max(1,Math.round(bitmap.height*scale));
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const src = canvas.toDataURL("image/jpeg",.82); if (!studioURL(src,true)) throw Error("La imagen comprimida sigue siendo demasiado grande. Usa una imagen más pequeña.");
    if (!el.isConnected) return;
    const asset = studioAsset(id); asset.images[i] = {src,alt:(asset.images[i] || {}).alt || ""}; renderContent(); renderAll(); studioMediaMessage("Imagen incorporada al proyecto. No depende de una URL externa.");
  } catch(e) { studioMediaMessage(e.message || "No se pudo leer la imagen."); }
  finally { if (bitmap) bitmap.close(); }
});
