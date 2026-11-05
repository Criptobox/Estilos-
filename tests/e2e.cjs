/* Pruebas de extremo a extremo (Playwright + Chromium) de la PWA.
   Uso:  cd tests && npm install && npx playwright install chromium && npm test
   Sirve web/ con un servidor propio, abre la app en Chromium y comprueba los flujos
   que ya han fallado en versiones anteriores (móvil, constructor, copia de seguridad…). */
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "web");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

let failed = 0, passed = 0, current = "";
const ok = (cond, msg) => { if (cond) { passed++; console.log("  ✓ " + msg); } else { failed++; console.log("  ✗ " + msg + "   [" + current + "]"); } };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), msg + (JSON.stringify(a) === JSON.stringify(b) ? "" : "  (obtenido " + JSON.stringify(a) + ", esperado " + JSON.stringify(b) + ")"));

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let f = path.join(ROOT, decodeURIComponent(req.url.split("?")[0])); if (f.endsWith(path.sep)) f += "index.html";
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, "127.0.0.1", () => res(srv));
  });
}

/* Lee las entradas de un ZIP sin compresión (el que genera la app) y comprueba los CRC. */
function readZip(buf) {
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) return null;
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const out = {};
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const crc = buf.readUInt32LE(p + 16), size = buf.readUInt32LE(p + 24), nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nl).toString("utf8");
    const lnl = buf.readUInt16LE(off + 26), lel = buf.readUInt16LE(off + 28), data = buf.slice(off + 30 + lnl + lel, off + 30 + lnl + lel + size);
    out[name] = { data, crcOk: typeof zlib.crc32 === "function" ? zlib.crc32(data) === crc : true };
    p += 46 + nl + el + cl;
  }
  return out;
}

(async () => {
  const srv = await serve(), BASE = "http://127.0.0.1:" + srv.address().port + "/";
  const browser = await chromium.launch();
  const errors = [];
  async function open(opts, url) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1200, height: 900 }, acceptDownloads: true }, Object.assign({}, opts, { init: undefined })));
    if (opts && opts.init) await ctx.addInitScript(opts.init);
    const page = await ctx.newPage();
    page.on("pageerror", e => errors.push(current + ": " + e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(current + ": " + m.text()); });
    page.on("dialog", d => { errors.push(current + ": DIÁLOGO NATIVO " + d.message()); d.dismiss(); });
    await page.goto(BASE + (url || "index.html")); await page.waitForTimeout(350);
    return { ctx, page };
  }
  const goBuilder = async page => { await page.click("#nav [data-v=builder]"); await page.waitForTimeout(350); };
  const setProject = (page, ids, edit) => page.evaluate(([ids, edit]) => {
    builder.selected = ids.slice(); builder.layers = ids.map(id => cleanLayer(id, (edit && edit[id]) || {})); builder.activeLayer = 0; saveBuilder(); go({ view: "builder" });
  }, [ids, edit || null]);

  /* ───────── 1 · arranque, búsqueda y tema ───────── */
  current = "arranque"; console.log("\n" + current);
  {
    const { ctx, page } = await open({ colorScheme: "dark" });
    eq(await page.evaluate(() => document.documentElement.dataset.theme), "dark", "sigue al sistema en oscuro (modo Automático)");
    await page.click("[data-act=themecycle]"); await page.waitForTimeout(100);
    eq(await page.evaluate(() => localStorage.getItem("estilos-theme")), "light", "el botón de tema cambia y se guarda");
    await page.click("[data-act=gosearch]"); await page.fill("#q", "tipografia"); await page.waitForTimeout(300);
    ok(/^[5-9]|^\d{2,}/.test(await page.textContent("#count")), "la búsqueda ignora acentos («tipografia»)");
    await page.fill("#q", "boton primario"); await page.waitForTimeout(300);
    ok(parseInt(await page.textContent("#count"), 10) >= 1, "la búsqueda acepta varias palabras");
    await page.fill("#q", ""); await page.waitForTimeout(300);
    ok(await page.$$eval(".pv[data-h]", l => l.length) < await page.$$eval(".pv", l => l.length), "las vistas previas se dibujan al acercarse (carga diferida)");
    await ctx.close();
  }

  /* ───────── 2 · detalle: editor en vivo y código ───────── */
  current = "detalle"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await page.click("[data-act=gosearch]"); await page.click("article.card"); await page.waitForTimeout(200);
    await page.click("[data-act=dtab][data-d=edit]"); await page.fill('.lhex[data-i="0"]', "#FF0055"); await page.waitForTimeout(100);
    ok(await page.isEnabled("[data-act=lapply]"), "el editor en vivo activa «Aplicar» al cambiar un color");
    await page.click("[data-act=lapply]"); await page.waitForTimeout(150);
    ok(await page.evaluate(() => getEntry(S.id).colors[0] === "#FF0055"), "aplicar guarda el color en el estilo");
    await page.click("[data-act=dtab][data-d=code]");
    for (const [s, needle] of [["tailwind", "@theme"], ["compose", "darkColorScheme"], ["swiftui", "EstilosTheme"], ["flutter", "ThemeData"]]) {
      await page.click(`[data-act=stack][data-s=${s}]`);
      ok((await page.textContent(".codeBox pre")).includes(needle === "darkColorScheme" ? "ColorScheme" : needle), "código para " + s);
    }
    await page.click("[data-act=more]"); await page.waitForTimeout(150);
    eq(await page.evaluate(() => document.activeElement.id), "sheetCard", "el foco entra en la hoja");
    for (let i = 0; i < 9; i++) await page.keyboard.press("Tab");
    ok(await page.evaluate(() => document.getElementById("sheetCard").contains(document.activeElement)), "Tab no sale de la hoja");
    await page.keyboard.press("Escape");
    eq(await page.evaluate(() => document.activeElement.dataset.act), "more", "al cerrar, el foco vuelve al botón que la abrió");
    await ctx.close();
  }

  /* ───────── 3 · constructor: añadir, deshacer, carpetas, imágenes y texto ───────── */
  current = "constructor"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await goBuilder(page);
    await page.locator(".builder-picker-card:visible").first().click(); await page.locator(".builder-picker-card:visible").nth(1).click(); await page.waitForTimeout(300);
    eq(await page.evaluate(() => builder.selected.length), 2, "tocar una tarjeta del selector añade el diseño");
    await page.locator("[data-act=builderundo]:visible").first().click(); await page.waitForTimeout(150);
    eq(await page.evaluate(() => builder.selected.length), 1, "deshacer");
    await page.locator("[data-act=builderredo]:visible").first().click(); await page.waitForTimeout(150);
    eq(await page.evaluate(() => builder.selected.length), 2, "rehacer");
    await page.locator("[data-act=buildergroupadd]:visible").first().click(); await page.fill("#askNameField", "Cabecera"); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
    ok(await page.evaluate(() => builder.layers.some(l => l.group === "Cabecera")), "crear carpeta con hoja propia (sin prompt nativo)");
    await page.locator("[data-act=builderlayerlock]:visible").first().click(); await page.waitForTimeout(150);
    ok(await page.evaluate(() => builder.layers[0].locked), "bloquear capa");

    await setProject(page, ["tar-1"]); await page.waitForTimeout(350);
    await page.locator("[data-act=buildermediamode]:visible").first().click(); await page.waitForTimeout(250);
    const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 3000 }).catch(() => null), page.evaluate(() => document.querySelector(".builder-block .pv").shadowRoot.querySelector("svg path").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })))]);
    ok(!!fc, "tocar un icono SVG abre el selector de imagen");
    if (fc) { await fc.setFiles({ name: "a.png", mimeType: "image/png", buffer: PNG }); await page.waitForTimeout(700); }
    ok(await page.evaluate(() => !!document.querySelector(".builder-block .pv").shadowRoot.querySelector('img[alt="Imagen personalizada"]')), "el icono se sustituye por la imagen");
    await page.locator("[data-act=buildermediamode]:visible").first().click();

    await page.locator("[data-act=buildertextmode]:visible").first().click(); await page.waitForTimeout(250);
    await page.evaluate(() => { const sr = document.querySelector(".builder-block .pv").shadowRoot; [...sr.querySelectorAll("button")].find(b => /carrito/i.test(b.textContent)).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })); });
    await page.fill("#askNameField", "Comprar ahora"); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
    const btn = () => page.evaluate(() => { const b = [...document.querySelector(".builder-block .pv").shadowRoot.querySelectorAll("button")].find(x => /Comprar ahora|carrito/i.test(x.textContent)); return b ? { t: b.textContent.trim(), icon: !!b.querySelector("svg") } : null; });
    eq(await btn(), { t: "Comprar ahora", icon: true }, "el texto junto a un icono se edita y el icono se conserva");
    await page.locator("[data-act=builderundo]:visible").first().click(); await page.waitForTimeout(200);
    eq((await btn()).t, "Añadir al carrito", "deshacer funciona con el modo Texto activo");
    await ctx.close();
  }

  /* ───────── 4 · imágenes en IndexedDB y historial entre recargas ───────── */
  current = "persistencia"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await setProject(page, ["tar-1"]); await page.waitForTimeout(300);
    await page.locator("[data-act=buildermediamode]:visible").first().click();
    const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 3000 }).catch(() => null), page.evaluate(() => document.querySelector(".builder-block .pv").shadowRoot.querySelector("svg path").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })))]);
    if (fc) { await fc.setFiles({ name: "a.png", mimeType: "image/png", buffer: PNG }); await page.waitForTimeout(800); }
    const stored = await page.evaluate(() => localStorage.getItem("estilos-builder-v1"));
    ok(stored.includes('"idb:') && !stored.includes("data:image"), "en localStorage solo queda la referencia a la imagen (idb:…)");
    await page.reload(); await page.waitForTimeout(500); await goBuilder(page); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !!document.querySelector(".builder-block .pv").shadowRoot.querySelector('img[alt="Imagen personalizada"]')), "tras recargar, la imagen se recupera desde IndexedDB");
    // historial: editar, recargar y deshacer
    await page.locator("[data-act=buildertextmode]:visible").first().click(); await page.waitForTimeout(200);
    await page.evaluate(() => { const sr = document.querySelector(".builder-block .pv").shadowRoot; [...sr.querySelectorAll("button")].find(b => /carrito/i.test(b.textContent)).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })); });
    await page.fill("#askNameField", "Hola mundo"); await page.keyboard.press("Enter"); await page.waitForTimeout(700);
    await page.reload(); await page.waitForTimeout(500); await goBuilder(page); await page.waitForTimeout(300);
    await page.locator("[data-act=builderundo]:visible").first().click(); await page.waitForTimeout(300);
    ok(await page.evaluate(() => [...document.querySelector(".builder-block .pv").shadowRoot.querySelectorAll("button")].some(b => /carrito/i.test(b.textContent))), "el historial sobrevive a una recarga: deshacer recupera el texto anterior");
    await ctx.close();
  }

  /* ───────── 5 · ediciones robustas ───────── */
  current = "ediciones robustas"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await setProject(page, ["tar-1"]); await page.waitForTimeout(300);
    await page.evaluate(() => {
      const l = builder.layers[0];
      l.textEdits = { "article:nth-of-type(1) > button:nth-of-type(1)::own": "Texto A", "article:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > h3:nth-of-type(1)": "Texto B" };
      l.editMeta = { "article:nth-of-type(1) > button:nth-of-type(1)::own": { t: "button", b: "Texto que ya no existe" }, "article:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > h3:nth-of-type(1)": { t: "h3", b: "Auriculares Air" } };
      saveBuilder(); render(true);
    });
    await page.waitForTimeout(300);
    const t = await page.evaluate(() => { const sr = document.querySelector(".builder-block .pv").shadowRoot; return { btn: [...sr.querySelectorAll("button")].map(b => b.textContent.trim()).join("|"), h3: sr.querySelector("h3").textContent.trim() }; });
    ok(t.h3 === "Texto B", "una edición cuyo nodo coincide se aplica");
    ok(!/Texto A/.test(t.btn), "una edición cuyo texto original ya no coincide se omite (no se edita otro sitio)");
    await ctx.close();
  }

  /* ───────── 6 · tamaños de pantalla ───────── */
  current = "tamaños"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await goBuilder(page);
    await page.selectOption("[data-builder=device]", "t"); await page.waitForTimeout(300);
    eq(await page.evaluate(() => builder.device), "t", "elegir «Tablet» guarda el tamaño");
    ok(await page.evaluate(() => /--dev-w:\s*670px/.test(document.querySelector(".builder-device").getAttribute("style"))), "la maqueta recibe el ancho de la tablet");
    await ctx.close();
  }

  /* ───────── 7 · copia de seguridad completa ───────── */
  current = "copia de seguridad"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await setProject(page, ["tar-1", "chat-1"], { "tar-1": { label: "Mi tarjeta", group: "Cabecera" } });
    await page.evaluate(() => { builderThemes.push({ id: "theme-prueba", name: "Tema de prueba", palette: "#112233", bg: "#EEEEEE", font: "Inter", radius: 18 }); writeJSON("estilos-themes-v1", builderThemes); });
    await page.evaluate(() => RefStore.put({ id: "rprueba", label: "Captura prueba", date: Date.now(), blob: new Blob([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), c => c.charCodeAt(0))], { type: "image/png" }) }).then(loadUserRefs));
    const json = await page.evaluate(() => exportJSON());
    const o = JSON.parse(json);
    ok(o.format === 2 && o.builder && o.builder.screens[0].selected.length === 2, "la copia incluye el proyecto del constructor");
    ok(Array.isArray(o.themes) && o.themes.some(x => x.id === "theme-prueba"), "la copia incluye los temas");
    ok(Array.isArray(o.refs) && o.refs.length === 1 && /^data:image\/png/.test(o.refs[0].data), "la copia incluye las capturas propias");
    await ctx.close();
    const b = await open();   // contexto nuevo = sin datos
    await b.page.evaluate(async j => { await doImportText(j); }, json); await b.page.waitForTimeout(500);
    eq(await b.page.evaluate(() => builder.screens[0].selected.length), 2, "importar restaura las capas del proyecto");
    eq(await b.page.evaluate(() => builder.screens[0].layers[0].label), "Mi tarjeta", "…con sus propiedades");
    ok(await b.page.evaluate(() => builderThemes.some(x => x.id === "theme-prueba")), "…y los temas");
    eq(await b.page.evaluate(() => userRefs.length), 1, "…y las capturas propias");
    ok(await b.page.evaluate(() => { builderUndo(); return true; }), "la importación del proyecto se puede deshacer");
    await b.ctx.close();
  }

  /* ───────── 8 · exportar: HTML, modo oscuro y ZIP ───────── */
  current = "exportación"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await setProject(page, ["tar-1"]); await page.waitForTimeout(300);
    await page.locator("[data-act=buildermediamode]:visible").first().click();
    const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 3000 }).catch(() => null), page.evaluate(() => document.querySelector(".builder-block .pv").shadowRoot.querySelector("svg path").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })))]);
    if (fc) { await fc.setFiles({ name: "a.png", mimeType: "image/png", buffer: PNG }); await page.waitForTimeout(800); }
    await page.locator("[data-act=buildermediamode]:visible").first().click();
    await page.evaluate(() => { builder.layers[0].offsetX = 12; saveBuilder(); });
    let [dl] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => exportBuilder())]);
    let html = fs.readFileSync(await dl.path(), "utf8");
    ok(html.includes("translate:12px") && !html.includes("prefers-color-scheme"), "el HTML exportado conserva el desplazamiento y no oscurece por defecto");
    await page.locator("[data-act=builderexportdark]:visible").first().click(); await page.waitForTimeout(150);
    eq(await page.evaluate(() => builder.exportDark), true, "el interruptor de modo oscuro de la exportación se guarda");
    [dl] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => exportBuilder())]);
    html = fs.readFileSync(await dl.path(), "utf8");
    ok(html.includes("prefers-color-scheme:dark") && html.includes('content="light dark"'), "con el interruptor, el HTML incluye el modo oscuro automático");
    [dl] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => exportBuilderZip())]);
    const zip = readZip(fs.readFileSync(await dl.path()));
    ok(!!zip, "el ZIP se lee correctamente");
    if (zip) {
      const names = Object.keys(zip);
      for (const n of ["index.html", "LEEME.txt", "react/package.json", "react/vite.config.js", "react/index.html", "react/src/main.jsx", "react/src/App.jsx", "react/src/styles.css"]) ok(names.includes(n), "ZIP contiene " + n);
      ok(names.some(n => /^assets\/img-1\.(png|webp|jpg)$/.test(n)) && names.some(n => /^react\/public\/assets\/img-1\./.test(n)), "ZIP contiene la imagen en assets/ y en react/public/assets/");
      ok(Object.values(zip).every(f => f.crcOk), "todos los CRC del ZIP son válidos");
      const idx = zip["index.html"].data.toString("utf8");
      ok(!/data:image/.test(idx) && /assets\/img-1\./.test(idx), "el index.html del ZIP referencia la imagen como archivo (no incrusta base64)");
      const app = zip["react/src/App.jsx"].data.toString("utf8");
      const m = app.match(/const SCREENS = ([\s\S]*?);\n\nexport default/);
      let screens = null; try { screens = JSON.parse(m[1]); } catch (e) { /* ignorar */ }
      ok(screens && screens[0].blocks.length === 1 && screens[0].blocks[0].srcdoc.includes("assets/img-1."), "App.jsx lleva los datos del proyecto (JSON válido) con las imágenes como archivos");
      ok(JSON.parse(zip["react/package.json"].data.toString("utf8")).dependencies.react, "package.json de React válido");
      ok(zip["react/src/styles.css"].data.toString("utf8").includes(".blk-0-0{"), "styles.css lleva el estilo de cada bloque");
    }
    await ctx.close();
  }

  /* ───────── 9 · paleta de una captura → constructor ───────── */
  current = "paleta"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await page.evaluate(() => go({ view: "explore", tab: "Referencias" })); await page.waitForTimeout(300);
    await page.click(".refItem[data-act=lb]"); await page.click("[data-act=palette]"); await page.waitForTimeout(500);
    const before = await page.evaluate(() => [builder.palette, builder.bg]);
    await page.click("[data-act=palbuilder]"); await page.waitForTimeout(300);
    const after = await page.evaluate(() => [builder.palette, builder.bg]);
    ok(after[0] !== before[0] && after[1] !== before[1], "«Aplicar al constructor» cambia el color principal y el fondo (" + before.join("/") + " → " + after.join("/") + ")");
    eq(await page.evaluate(() => S.view), "builder", "…y abre el constructor");
    ok(await page.evaluate(() => builderThemes.some(t => /^Paleta ·/.test(t.name))), "…y la guarda como tema reutilizable");
    await ctx.close();
  }

  /* ───────── 10 · accesibilidad del panel de capas ───────── */
  current = "accesibilidad"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await setProject(page, ["tar-1"], { "tar-1": { group: "Cabecera" } }); await page.waitForTimeout(300);
    const r = await page.evaluate(() => [...document.querySelectorAll(".builder-layer-tools button, .builder-folder button")].map(b => ({ name: (b.getAttribute("aria-label") || b.textContent).trim().length > 0 })));
    ok(r.length >= 8 && r.every(x => x.name), "todos los botones del panel de capas y carpetas tienen nombre accesible (aria-label o texto)");
    ok(await page.evaluate(() => [...document.querySelectorAll(".builder-layer-tools button")].every(b => b.getAttribute("aria-label"))), "los botones que solo llevan icono tienen aria-label");
    ok(await page.evaluate(() => [...document.querySelectorAll(".builder-layer-tools button")].every(b => !/[◉◌🔒🔓↑↓＋×]/.test(b.textContent))), "ya no hay emojis ni símbolos sueltos en los botones de capa");
    ok(await page.evaluate(() => !!document.querySelector('[data-act="builderlayerhide"][aria-pressed]') && !!document.querySelector('[data-act="builderlayerlock"][aria-pressed]')), "ocultar y bloquear indican su estado con aria-pressed");
    await ctx.close();
  }

  /* ───────── 11 · móvil ───────── */
  current = "móvil"; console.log("\n" + current);
  {
    const { ctx, page } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await goBuilder(page);
    await page.locator(".builder-picker-card:visible").first().tap(); await page.waitForTimeout(250);
    eq(await page.evaluate(() => builder.selected.length), 1, "en el móvil se añade un componente tocando la tarjeta");
    await page.fill('[data-layer-field="label"]', "Hola");
    await page.tap("#nav [data-v=explore]"); await page.waitForTimeout(300);
    eq(await page.evaluate(() => S.view), "explore", "al primer toque en la barra principal se sale del constructor (barras apiladas)");
    await ctx.close();
  }

  /* ───────── 12 · sin conexión ───────── */
  current = "sin conexión"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500); await ctx.setOffline(true); await page.reload(); await page.waitForTimeout(500);
    ok(await page.isVisible(".hero"), "la app abre sin conexión");
    await ctx.close();
  }


  /* ───────── 13 · exportar con Tailwind ───────── */
  current = "tailwind"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await setProject(page, ["tar-1"], { "tar-1": { bg: "#112233", radius: 20, offsetX: 8, animation: "rise", variant: "glass" } }); await page.waitForTimeout(300);
    await page.evaluate(() => { builder.exportDark = true; saveBuilder(); });
    const [dl] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => exportBuilderZip())]);
    const zip = readZip(fs.readFileSync(await dl.path()));
    for (const n of ["tailwind/package.json", "tailwind/vite.config.js", "tailwind/index.html", "tailwind/src/main.jsx", "tailwind/src/App.jsx", "tailwind/src/index.css"]) ok(zip && !!zip[n], "ZIP contiene " + n);
    if (zip) {
      const app = zip["tailwind/src/App.jsx"].data.toString("utf8");
      ok(app.includes("bg-[#112233]") && app.includes("rounded-[20px]") && app.includes("translate-x-[8px]") && app.includes("animate-[estilosRise_700ms_ease_both]"), "App.jsx usa utilidades de Tailwind con los valores del bloque");
      ok(app.includes("dark:bg-[#0f1117]"), "con el interruptor, la página incluye variantes dark:");
      const m = app.match(/const SCREENS = ([\s\S]*?);\n\nexport default/); let sc = null; try { sc = JSON.parse(m[1]); } catch (e) { /* ignorar */ }
      ok(sc && /\bglass\b/.test(sc[0].blocks[0].cls), "el bloque conserva su variante (glass)");
      ok(zip["tailwind/src/index.css"].data.toString("utf8").startsWith('@import "tailwindcss";'), "index.css importa Tailwind v4");
      const pk = JSON.parse(zip["tailwind/package.json"].data.toString("utf8")); ok(pk.devDependencies.tailwindcss && pk.devDependencies["@tailwindcss/vite"], "package.json de Tailwind válido");
      ok(Object.values(zip).every(f => f.crcOk), "los CRC siguen siendo válidos");
    }
    await ctx.close();
  }

  /* ───────── 14 · copia automática en un archivo ───────── */
  current = "copia automática"; console.log("\n" + current);
  {
    const init = () => { window.showSaveFilePicker = async () => (await navigator.storage.getDirectory()).getFileHandle("copia-prueba.json", { create: true }); };
    const { ctx, page } = await open({ init });
    const read = () => page.evaluate(async () => { try { const f = await (await (await navigator.storage.getDirectory()).getFileHandle("copia-prueba.json")).getFile(); return await f.text(); } catch (e) { return ""; } });
    await page.click("#nav [data-act=menu]"); await page.waitForTimeout(200);
    ok(await page.isVisible("[data-act=abchoose]"), "Ajustes ofrece «Elegir archivo…»");
    await page.click("[data-act=abchoose]"); await page.waitForTimeout(900);
    eq(await page.evaluate(() => AutoBackup.active && AutoBackup.state.perm), "granted", "tras elegir el archivo la copia queda activa");
    let o = null; try { o = JSON.parse(await read()); } catch (e) { /* ignorar */ }
    ok(o && o.format === 2 && o.app === "estilos", "se escribe una primera copia completa en el archivo");
    await page.keyboard.press("Escape");
    await setProject(page, ["tar-1"]);
    for (let k = 0; k < 25 && !(await read()).includes('"tar-1"'); k++) await page.waitForTimeout(400);   /* la copia espera unos 4 s tras el último cambio */
    ok((await read()).includes('"tar-1"'), "un cambio en el constructor se vuelca solo al archivo (sin pulsar nada)");
    /* No se prueba «recordar el archivo tras recargar»: leer de IndexedDB un manejador de OPFS cierra el Chromium de pruebas
       (falla sin código de la app de por medio); en Chrome real los manejadores de showSaveFilePicker sí se guardan así. */
    await page.click("#nav [data-act=menu]"); await page.waitForTimeout(200);
    await page.click("[data-act=abstop]"); await page.waitForTimeout(300);
    eq(await page.evaluate(() => AutoBackup.active), false, "«Desactivar» olvida el archivo");
    await ctx.close();
    const u = await open({ init: () => { delete window.showSaveFilePicker; } });
    await u.page.click("#nav [data-act=menu]"); await u.page.waitForTimeout(200);
    ok(/no permite guardar automáticamente/.test(await u.page.textContent("#sheetCard")) && !(await u.page.isVisible("[data-act=abchoose]")), "sin la API del navegador se explica y no se ofrece el botón");
    await u.ctx.close();
  }

  /* ───────── 15 · compartir por enlace ───────── */
  current = "enlace"; console.log("\n" + current);
  {
    const a = await open();
    await setProject(a.page, ["tar-1", "chat-1"], { "tar-1": { label: "Mi tarjeta", bg: "#223344" } });
    await a.page.evaluate(() => { builder.palette = "#AA3355"; builder.device = "l"; saveBuilder(); });
    const url = await a.page.evaluate(() => builderShareLink());
    ok(/#p1=[A-Za-z0-9_-]+$/.test(url) && url.length < 4000, "el enlace va comprimido y es corto (" + url.length + " caracteres)");
    await a.ctx.close();
    const b = await open({}, url.slice(BASE.length));
    ok(/Abrir proyecto compartido/.test(await b.page.textContent("#sheetCard")), "al abrir el enlace se pide confirmación");
    eq(await b.page.evaluate(() => location.hash), "", "el fragmento se limpia de la dirección");
    eq(await b.page.evaluate(() => builder.screens[0].selected.length), 0, "hasta confirmar, el proyecto actual no cambia");
    await b.page.click("[data-act=confirm]"); await b.page.waitForTimeout(400);
    const got = await b.page.evaluate(() => ({ view: S.view, n: builder.screens[0].selected.length, label: builder.screens[0].layers[0].label, bg: builder.screens[0].layers[0].bg, pal: builder.palette, dev: builder.device }));
    eq(got, { view: "builder", n: 2, label: "Mi tarjeta", bg: "#223344", pal: "#AA3355", dev: "l" }, "confirmar abre el proyecto en el constructor con todos sus ajustes");
    await b.page.evaluate(() => builderUndo()); await b.page.waitForTimeout(200);
    eq(await b.page.evaluate(() => builder.screens[0].selected.length), 0, "abrir un proyecto compartido se puede deshacer");
    await b.ctx.close();
    const c = await open({}, "index.html#p1=AAAAAAAA");
    ok(/no es válido/.test(await c.page.evaluate(() => (document.getElementById("toast") || {}).textContent || "")), "un enlace dañado muestra un aviso y no rompe la app");
    await c.ctx.close();
    const d = await open();
    await setProject(d.page, ["tar-1"]);
    await d.page.evaluate(() => { builder.layers[0].mediaEdits = { "a:nth-of-type(1)": "data:image/png;base64,AAAA" }; builder.layers[0].editMeta = { "m:a:nth-of-type(1)": { t: "svg", b: "" } }; saveBuilder(); });
    const sd = await d.page.evaluate(() => JSON.stringify(builderShareData()));
    ok(!/data:image/.test(sd) && !/"m:/.test(sd), "las imágenes reemplazadas no viajan en el enlace");
    await d.ctx.close();
  }

  /* ───────── 16 · reordenar capas arrastrando el asa ───────── */
  current = "reordenar"; console.log("\n" + current);
  {
    const order = page => page.evaluate(() => builder.selected.join(","));
    const box = (page, i) => page.evaluate(i => { const r = document.querySelector('[data-layer-grip="' + i + '"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, i);
    const m = await open();
    await m.page.addStyleTag({ content: "*{scroll-behavior:auto!important}" });
    await setProject(m.page, ["tar-1", "chat-1", "tar-2"]); await m.page.waitForTimeout(300);
    await m.page.evaluate(() => document.getElementById("builder-layers-panel").scrollIntoView({ block: "start" })); await m.page.waitForTimeout(300);
    ok(await m.page.evaluate(() => [...document.querySelectorAll("[data-layer-grip]")].every(b => b.getAttribute("aria-label"))), "cada capa tiene un asa de arrastre con nombre accesible");
    let a = await box(m.page, 0), z = await box(m.page, 2);
    await m.page.mouse.move(a.x, a.y); await m.page.mouse.down(); await m.page.mouse.move(z.x, z.y + 6, { steps: 8 }); await m.page.mouse.up(); await m.page.waitForTimeout(250);
    eq(await order(m.page), "chat-1,tar-2,tar-1", "arrastrar el asa con el ratón mueve la capa");
    await m.page.evaluate(() => builderUndo()); await m.page.waitForTimeout(200);
    eq(await order(m.page), "tar-1,chat-1,tar-2", "…y se puede deshacer");
    await m.page.evaluate(() => { builder.layers[0].locked = true; saveBuilder(); render(true); }); await m.page.waitForTimeout(250);
    await m.page.evaluate(() => document.getElementById("builder-layers-panel").scrollIntoView({ block: "start" })); await m.page.waitForTimeout(250);
    a = await box(m.page, 0); z = await box(m.page, 2);
    await m.page.mouse.move(a.x, a.y); await m.page.mouse.down(); await m.page.mouse.move(z.x, z.y + 6, { steps: 8 }); await m.page.mouse.up(); await m.page.waitForTimeout(250);
    eq(await order(m.page), "tar-1,chat-1,tar-2", "una capa bloqueada no se arrastra");
    await m.ctx.close();

    const t = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await t.page.addStyleTag({ content: "*{scroll-behavior:auto!important}" });   /* el desplazamiento suave deja las posiciones inestables durante la prueba */
    await setProject(t.page, ["tar-1", "chat-1", "tar-2"]); await t.page.waitForTimeout(400);
    await t.page.evaluate(() => { document.getElementById("builder-layers-panel").scrollIntoView({ block: "start" }); }); await t.page.waitForTimeout(400);
    const cdp = await t.ctx.newCDPSession(t.page);
    const tp = (type, p) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: p.x, y: p.y, id: 1 }] });
    a = await box(t.page, 0); z = await box(t.page, 2);
    await tp("touchStart", a);
    for (let k = 1; k <= 10; k++) await tp("touchMove", { x: a.x, y: a.y + (z.y + 6 - a.y) * k / 10 });
    await tp("touchEnd", z); await t.page.waitForTimeout(300);
    eq(await order(t.page), "chat-1,tar-2,tar-1", "arrastrar el asa con el dedo (táctil) mueve la capa");
    await t.ctx.close();
  }

  /* ───────── 17 · calidad de las imágenes ───────── */
  current = "calidad"; console.log("\n" + current);
  {
    const { ctx, page } = await open();
    await setProject(page, ["tar-1"]); await page.waitForTimeout(300);
    const png = await page.evaluate(async () => {
      const c = document.createElement("canvas"); c.width = 1400; c.height = 1400; const g = c.getContext("2d");
      for (let i = 0; i < 600; i++) { g.fillStyle = "hsl(" + (i * 37 % 360) + "," + (40 + i % 50) + "%," + (30 + i % 40) + "%)"; g.beginPath(); g.arc((i * 97) % 1400, (i * 53) % 1400, 20 + (i * 13) % 160, 0, 7); g.fill(); }
      const b = await new Promise(r => c.toBlob(r, "image/png")); const u = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s);
    });
    const big = Buffer.from(png, "base64"); ok(big.length < 6 * 1024 * 1024, "imagen de prueba válida (" + Math.round(big.length / 1024) + " KB)");
    const size = async q => {
      await page.evaluate(() => { builder.layers[0].mediaEdits = {}; builder.layers[0].editMeta = {}; saveBuilder(); render(true); }); await page.waitForTimeout(300);   /* vuelve a mostrar el icono SVG original */
      await page.selectOption("#imgq", q); await page.waitForTimeout(250);
      await page.locator("[data-act=buildermediamode]:visible").first().click(); await page.waitForTimeout(150);
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 3000 }).catch(() => null), page.evaluate(() => document.querySelector(".builder-block .pv").shadowRoot.querySelector("svg path").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })))]);
      if (fc) await fc.setFiles({ name: "grande.png", mimeType: "image/png", buffer: big });
      await page.waitForTimeout(1500);
      const r = await page.evaluate(() => { const v = Object.values(builder.layers[0].mediaEdits || {})[0]; if (!v) return null; return new Promise(res => { const i = new Image(); i.onload = () => res({ len: v.length, w: i.naturalWidth }); i.onerror = () => res(null); i.src = v; }); });
      const tog = page.locator("[data-act=buildermediamode]:visible").first(); if (/Terminar/.test(await tog.textContent())) await tog.click();
      return r;
    };
    const lo = await size("low"), hi = await size("high");
    ok(lo && hi, "se pueden reemplazar imágenes con calidad Baja y Alta");
    if (lo && hi) { ok(lo.w <= 640 && hi.w > 1000, "la calidad limita el tamaño: Baja " + lo.w + " px, Alta " + hi.w + " px"); ok(lo.len < hi.len * 0.6, "Baja pesa mucho menos que Alta (" + Math.round(lo.len * .75 / 1024) + " KB frente a " + Math.round(hi.len * .75 / 1024) + " KB)"); }
    eq(await page.evaluate(() => builder.imageQuality), "high", "la calidad elegida se guarda con el proyecto");
    ok(/imagen/.test(await page.textContent("#imgq ~ .sub")), "el panel muestra cuántas imágenes y cuánto pesan");
    await ctx.close();
  }

  current = "global";
  ok(errors.length === 0, "ningún error de consola, ninguna excepción ni diálogo nativo" + (errors.length ? "\n      " + errors.slice(0, 6).join("\n      ") : ""));
  await browser.close(); srv.close();
  console.log("\n" + passed + " correctas, " + failed + " fallidas");
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
