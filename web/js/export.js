/* Exportación del constructor: HTML único, y ZIP con HTML + proyecto React (Vite) + imágenes.
   Usa funciones de app.js (esc, safeColor, getEntry, builderElevation, builderMotionStyle,
   builderEditedMediaCode, syncActiveScreen) que existen cuando se llama, no al cargar. */

/* Tamaños de pantalla de la maqueta (px del dispositivo). */
const DEVICES = {
  s: { n: "Móvil pequeño", w: 360, h: 740 },
  m: { n: "Móvil", w: 390, h: 844 },
  l: { n: "Móvil grande", w: 430, h: 932 },
  t: { n: "Tablet", w: 768, h: 1024 }
};
function deviceOf(b) { return DEVICES[b && b.device] || DEVICES.m; }

/* ───────── ZIP (sin compresión: JPG/WebP ya van comprimidos) ───────── */
const CRC_TABLE = (function () {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipBuild(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  const now = new Date();
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  files.forEach(f => {
    const name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  });
  let csize = 0; central.forEach(p => { csize += p.length; });
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, csize, true); end.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
}
function dataUrlBytes(u) {
  const i = u.indexOf(";base64,"); if (i < 0) return null;
  const bin = atob(u.slice(i + 8)), a = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
  return { mime: u.slice(5, i), bytes: a };
}
function downloadBlob(blob, name, delay) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), delay || 4000);
}

/* ───────── Modelo común (HTML y React) ───────── */
const DATA_IMG_G = /data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;
function builderBlockStyle(l) {
  const card = l.bare ? '' : ';background:' + safeColor(l.bg || '#FFFFFF') + ';border-radius:' + Math.max(6, Math.min(32, Number(l.radius) || 16)) + 'px;padding:' + Math.max(4, Math.min(32, Number(l.padding) || 12))
    + 'px;border:' + (l.borderWidth || 0) + 'px ' + (l.borderStyle || 'solid') + ' ' + safeColor(l.borderColor || '#E8EAF0') + ';box-shadow:' + builderElevation(l);
  return 'display:' + (l.hidden ? 'none' : 'block') + ';color:' + safeColor(l.color || '#263247') + card
    + ';font-size:' + (l.fontSize || 14) + 'px;font-weight:' + (l.weight || 600) + ';text-align:' + (l.align || 'left')
    + ';width:' + (l.width || 100) + '%;translate:' + (Number(l.offsetX) || 0) + 'px ' + (Number(l.offsetY) || 0) + 'px;'
    + builderMotionStyle(l);
}
function builderExportScreens(mediaFn) {
  syncActiveScreen();
  return builder.screens.map((sc, si) => ({
    id: "page-" + si, title: sc.title || ("Pantalla " + (si + 1)), subtitle: sc.subtitle || "", hero: sc.hero !== false,
    blocks: sc.selected.map((id, i) => {
      const e = getEntry(id); if (!e) return null;
      const l = sc.layers[i] || {};
      let code = builderEditedMediaCode(e, l);
      if (mediaFn) code = code.replace(DATA_IMG_G, mediaFn);
      return {
        id: "blk-" + si + "-" + i, bare: !!l.bare, rank: { top: 0, bottom: 2 }[l.slot] ?? 1, cls: "component " + (l.bare ? "bare" : (l.variant || "default")), tw: builderBlockTW(l), style: builderBlockStyle(l),
        tab: e.tab, n: i + 1, label: l.label || e.name, desc: e.desc,
        srcdoc: '<!doctype html><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1><style>body{margin:0;padding:8px;font-family:system-ui,sans-serif;overflow:hidden}*{box-sizing:border-box}</style>' + code
      };
    }).filter(Boolean).sort((a, b) => a.rank - b.rank || a.n - b.n)
  }));
}

/* Clases de Tailwind de un bloque. Los valores del usuario (colores, radios…) van como valores
   arbitrarios «[...]»; Tailwind solo genera las clases que aparecen completas en el código fuente,
   por eso cada una se escribe entera y nunca se compone a trozos. */
function builderBlockTW(l) {
  const clamp = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Number(v) || d));
  const c = [];
  c.push(l.hidden ? "hidden" : "block");
  if (!l.bare) c.push("bg-[" + safeColor(l.bg || "#FFFFFF") + "]");
  c.push("text-[color:" + safeColor(l.color || "#263247") + "]");
  if (!l.bare) c.push("rounded-[" + clamp(l.radius, 6, 32, 16) + "px]", "p-[" + clamp(l.padding, 4, 32, 12) + "px]");
  c.push("text-[length:" + (Number(l.fontSize) || 14) + "px]", "font-[" + (Number(l.weight) || 600) + "]");
  c.push("text-" + (["left", "center", "right"].includes(l.align) ? l.align : "left"));
  if (!l.bare) {
    c.push("border-[" + clamp(l.borderWidth, 0, 5, 0) + "px]", "border-" + (["solid", "dashed", "dotted"].includes(l.borderStyle) ? l.borderStyle : "solid"), "border-[color:" + safeColor(l.borderColor || "#E8EAF0") + "]");
    const sh = builderElevation(l);
    c.push(sh === "none" ? "shadow-none" : "shadow-[" + sh.replace(/ /g, "_") + "]");
  }
  c.push("w-[" + (Number(l.width) || 100) + "%]");
  const ox = Number(l.offsetX) || 0, oy = Number(l.offsetY) || 0;
  if (ox) c.push("translate-x-[" + ox + "px]");
  if (oy) c.push("translate-y-[" + oy + "px]");
  const ms = Math.max(300, Math.min(3000, Number(l.duration) || 700));
  const anim = { fade: "animate-[estilosFade_" + ms + "ms_ease_both]", rise: "animate-[estilosRise_" + ms + "ms_ease_both]", zoom: "animate-[estilosZoom_" + ms + "ms_ease_both]", float: "animate-[estilosFloat_" + ms + "ms_ease-in-out_infinite]", pulse: "animate-[estilosPulse_" + ms + "ms_ease-in-out_infinite]" }[l.animation];
  if (anim) c.push(anim, "motion-reduce:animate-none");
  return c.join(" ");
}

/* Proyecto React + Tailwind v4 (Vite). La página usa utilidades; el CSS propio solo trae
   las animaciones y las variantes Glass/Soft/Outline/Bold, que Tailwind no tiene. */
function builderTailwindFiles(screens) {
  const accent = safeColor(builder.palette), bg = safeColor(builder.bg), r = Math.max(8, Math.min(32, Number(builder.radius) || 20));
  const W = Math.max(460, deviceOf(builder).w), dk = !!builder.exportDark;
  const fam = builder.font === "Georgia" ? "font-[family-name:Georgia,serif]" : "font-[family-name:Inter,system-ui,sans-serif]";
  const data = screens.map(sc => ({
    id: sc.id, title: sc.title, subtitle: sc.subtitle, hero: sc.hero,
    blocks: sc.blocks.map(b => ({ id: b.id, bare: b.bare, cls: b.cls + " " + b.tw, tab: b.tab, n: b.n, label: b.label, desc: b.desc, srcdoc: b.srcdoc }))
  }));
  const navOff = "border-[#e4e7ef] bg-white text-[#596276]" + (dk ? " dark:border-[#2a2f3d] dark:bg-[#1b1e29] dark:text-[#b8bfd0]" : "");
  const app = 'import { useState } from "react";\n\n/* Datos del proyecto exportado desde Estilos. Cada bloque se muestra aislado en un iframe. */\nconst SCREENS = ' + JSON.stringify(data, null, 2) + ';\n\n'
    + 'export default function App() {\n  const [i, setI] = useState(0);\n  const s = SCREENS[i];\n  return (\n'
    + '    <div className="min-h-screen p-[18px] ' + fam + ' bg-[' + bg + '] text-[#182033]' + (dk ? ' dark:bg-[#0f1117] dark:text-[#e7eaf2]' : '') + '">\n'
    + '      <nav className="mx-auto mb-3 flex max-w-[' + W + 'px] gap-1.5 overflow-auto" aria-label="Pantallas">\n        {SCREENS.map((x, k) => (\n          <button\n            key={x.id}\n            onClick={() => setI(k)}\n            aria-current={k === i ? "page" : undefined}\n'
    + '            className={"cursor-pointer whitespace-nowrap rounded-full border px-[13px] py-[9px] " + (k === i ? "border-[' + accent + '] bg-[' + accent + '] text-white" : "' + navOff + '")}\n          >\n            {x.title}\n          </button>\n        ))}\n      </nav>\n'
    + '      <main className="mx-auto max-w-[' + W + 'px] rounded-[' + r + 'px] bg-white p-6 shadow-[0_20px_60px_#1d2b4a18]' + (dk ? ' dark:bg-[#171a23] dark:shadow-none' : '') + '">\n'
    + '        {s.hero && (\n          <>\n        <div className="grid size-[42px] place-items-center rounded-[14px] bg-[' + accent + '] text-[22px] text-white">✦</div>\n'
    + '        <small className="mt-2 block tracking-[1px] text-[#7c8497]' + (dk ? ' dark:text-[#9aa2b5]' : '') + '">DISEÑADO CON ESTILOS</small>\n'
    + '        <h1 className="mb-2 mt-5 text-[32px] font-bold leading-[1.05]">{s.title}</h1>\n'
    + '        <p className="leading-normal text-[#737b8d]' + (dk ? ' dark:text-[#aab1c2]' : '') + '">{s.subtitle}</p>\n'
    + '        <button className="my-[18px] cursor-pointer rounded-[' + r + 'px] border-0 bg-[' + accent + '] px-[18px] py-[14px] font-bold text-white">Descubrir más ↗</button>\n          </>\n        )}\n'
    + '        {s.blocks.map((b) => (\n          <section key={b.id} className={"mt-[18px] overflow-hidden " + b.cls}>\n'
    + '            {!b.bare && (\n            <>\n            <div className="flex justify-between text-[10px] uppercase tracking-[.08em] text-[#8991a2]' + (dk ? ' dark:text-[#8d95a8]' : '') + '">\n              <span>{b.tab}</span>\n              <small className="tracking-[1px]">Bloque {b.n}</small>\n            </div>\n'
    + '            <h2 className="my-2 text-base font-bold">{b.label}</h2>\n            <p className="text-[13px] leading-normal">{b.desc}</p>\n            </>\n            )}\n'
    + '            <iframe loading="lazy" title={b.label} sandbox="allow-same-origin" srcDoc={b.srcdoc} onLoad={(e) => { try { e.target.style.height = e.target.contentDocument.documentElement.scrollHeight + "px"; } catch {} }} className="mt-3 block h-[230px] w-full rounded-xl border-0 bg-[#f7f8fb]" />\n          </section>\n        ))}\n      </main>\n    </div>\n  );\n}\n';
  const css = '@import "tailwindcss";\n\n/* Animaciones y variantes de los bloques (Tailwind no las incluye). */\n'
    + '@keyframes estilosFade{from{opacity:0}to{opacity:1}}\n@keyframes estilosRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}\n@keyframes estilosZoom{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}\n@keyframes estilosFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}\n@keyframes estilosPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}\n'
    + '.component.glass{background:#ffffff88!important;backdrop-filter:blur(12px);border-color:#ffffffaa!important}\n.component.soft{background:linear-gradient(145deg,#fff,#f0f1f8)!important;box-shadow:8px 8px 18px #202a4014!important}\n.component.outline{background:transparent!important;border-width:1px!important;border-color:currentColor!important;box-shadow:none!important}\n.component.bold{background:linear-gradient(135deg,#635bff18,#26b9d418)!important;border-width:2px!important}\n';
  return [
    { name: "package.json", data: JSON.stringify({ name: "proyecto-estilos-tailwind", private: true, version: "1.0.0", type: "module", scripts: { dev: "vite", build: "vite build", preview: "vite preview" }, dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" }, devDependencies: { "@tailwindcss/vite": "^4.0.0", "@vitejs/plugin-react": "^4.3.1", tailwindcss: "^4.0.0", vite: "^5.4.0" } }, null, 2) + "\n" },
    { name: "vite.config.js", data: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({ plugins: [react(), tailwindcss()], base: "./" });\n' },
    { name: "index.html", data: '<!doctype html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width,initial-scale=1" />\n' + (dk ? '    <meta name="color-scheme" content="light dark" />\n' : '') + '    <title>' + esc(builder.title) + '</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n' },
    { name: "src/main.jsx", data: 'import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\nimport "./index.css";\n\ncreateRoot(document.getElementById("root")).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n' },
    { name: "src/App.jsx", data: app },
    { name: "src/index.css", data: css }
  ];
}

function builderExportCSS(mode, blocksCss) {
  const accent = safeColor(builder.palette), bg = safeColor(builder.bg), r = Math.max(8, Math.min(32, Number(builder.radius) || 20));
  const W = Math.max(460, deviceOf(builder).w);
  const pages = mode === "react" ? ".app{display:block;" : ".app{display:none;";
  const showRules = mode === "react" ? "" : ".app:first-of-type{display:block}.app:target{display:block}body:has(.app:target) .app:first-of-type:not(:target){display:none}";
  /* Modo oscuro opcional: solo cambia el marco de la página; los bloques conservan los colores que elegiste. */
  const dark = builder.exportDark ? "@media (prefers-color-scheme:dark){body{background:#0f1117;color:#e7eaf2}.nav a,.nav button{background:#1b1e29;border-color:#2a2f3d;color:#b8bfd0}.app{background:#171a23;box-shadow:none}small{color:#9aa2b5}p{color:#aab1c2}.component{border-color:#2a2f3d}.component-meta{color:#8d95a8}}" : "";
  return "*{box-sizing:border-box}body{margin:0;padding:18px;background:" + bg + ";font-family:" + (builder.font === 'Georgia' ? 'Georgia,serif' : 'Inter,system-ui,sans-serif') + ";color:#182033}"
    + ".nav{max-width:" + W + "px;margin:0 auto 12px;display:flex;gap:6px;overflow:auto}.nav a,.nav button{white-space:nowrap;border:1px solid #e4e7ef;background:white;color:#596276;border-radius:999px;padding:9px 13px;text-decoration:none;font:inherit;cursor:pointer}.nav button.on{background:" + accent + ";border-color:" + accent + ";color:white}"
    + pages + "max-width:" + W + "px;margin:0 auto;background:white;border-radius:" + r + "px;padding:24px;box-shadow:0 20px 60px #1d2b4a18}" + showRules
    + ".mark{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:" + accent + ";color:white;font-size:22px}small{color:#7c8497;letter-spacing:1px}"
    + "h1{font-size:32px;line-height:1.05;margin:20px 0 8px}p{color:#737b8d;line-height:1.5}.primary{margin:18px 0;padding:14px 18px;border:0;border-radius:" + r + "px;background:" + accent + ";color:white;font-weight:700}"
    + ".component{margin-top:18px;border:1px solid #e8eaf0;overflow:hidden}.component h2{font-size:16px;margin:8px 0}.component p{font-size:13px}"
    + ".component-meta{display:flex;justify-content:space-between;font-size:10px;color:#8991a2;text-transform:uppercase;letter-spacing:.08em}"
    + ".component iframe{display:block;width:100%;height:230px;border:0;border-radius:12px;background:#f7f8fb;margin-top:12px}"
    + ".component.bare{border:0;margin-top:10px;overflow:visible}.component.bare iframe{margin-top:0;background:transparent;border-radius:0;height:90px}"
    + ".component.glass{background:#ffffff88!important;backdrop-filter:blur(12px);border-color:#ffffffaa!important}"
    + ".component.soft{background:linear-gradient(145deg,#fff,#f0f1f8)!important;box-shadow:8px 8px 18px #202a4014!important}"
    + ".component.outline{background:transparent!important;border-width:1px!important;border-color:currentColor!important;box-shadow:none!important}"
    + ".component.bold{background:linear-gradient(135deg,#635bff18,#26b9d418)!important;border-width:2px!important}"
    + "@keyframes estilosFade{from{opacity:0}to{opacity:1}}@keyframes estilosRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}"
    + "@keyframes estilosZoom{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}@keyframes estilosFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}"
    + "@keyframes estilosPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}@media (prefers-reduced-motion:reduce){.component{animation:none!important}}"
    + dark + (blocksCss || "");
}

/* ───────── HTML único ───────── */
function builderExportHTML(mediaFn) {
  const screens = builderExportScreens(mediaFn);
  const pages = screens.map((sc, si) => '<main class="app page ' + (si === 0 ? 'active' : '') + '" id="' + sc.id + '">' + (sc.hero ? '<div class="mark">✦</div><small>DISEÑADO CON ESTILOS</small><h1>' + esc(sc.title) + '</h1><p>' + esc(sc.subtitle) + '</p><button class="primary">Descubrir más ↗</button>' : '')
    + sc.blocks.map(b => '<section class="' + b.cls + '" style="' + b.style + '">' + (b.bare ? '' : '<div class="component-meta"><span>' + esc(b.tab) + '</span><small>Bloque ' + b.n + '</small></div><h2>' + esc(b.label) + '</h2><p>' + esc(b.desc) + '</p>') + '<iframe loading="lazy" title="' + esc(b.label) + '" sandbox="allow-same-origin" srcdoc="' + esc(b.srcdoc) + '"></iframe></section>').join('')
    + '</main>').join('');
  const nav = screens.map(sc => '<a href="#' + sc.id + '">' + esc(sc.title) + '</a>').join('');
  return '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + (builder.exportDark ? '<meta name="color-scheme" content="light dark">' : '') + '<title>' + esc(builder.title) + '</title><style>' + builderExportCSS("html") + '</style><nav class="nav">' + nav + '</nav>' + pages + '<script>/* ajusta la altura de cada elemento a su contenido */document.querySelectorAll("iframe").forEach(function(f){f.addEventListener("load",function(){try{f.style.height=f.contentDocument.documentElement.scrollHeight+"px"}catch(e){}})})</script></html>';
}
function exportBuilder() {
  downloadBlob(new Blob([builderExportHTML()], { type: "text/html;charset=utf-8" }), "proyecto-estilos-multipantalla.html", 1500);
  toast("Proyecto multipantalla exportado");
}

/* ───────── Proyecto React (Vite) ───────── */
function builderReactFiles(screens) {
  const blocksCss = screens.map(sc => sc.blocks.map(b => ".blk-" + b.id.slice(4) + "{" + b.style + "}").join("")).join("");
  const data = screens.map(sc => ({
    id: sc.id, title: sc.title, subtitle: sc.subtitle, hero: sc.hero,
    blocks: sc.blocks.map(b => ({ id: b.id, bare: b.bare, cls: b.cls + " blk-" + b.id.slice(4), tab: b.tab, n: b.n, label: b.label, desc: b.desc, srcdoc: b.srcdoc }))
  }));
  const app = 'import { useState } from "react";\nimport "./styles.css";\n\n/* Datos del proyecto exportado desde Estilos. Cada bloque se muestra aislado en un iframe. */\nconst SCREENS = ' + JSON.stringify(data, null, 2) + ';\n\n'
    + 'export default function App() {\n  const [i, setI] = useState(0);\n  const s = SCREENS[i];\n  return (\n    <>\n      <nav className="nav" aria-label="Pantallas">\n        {SCREENS.map((x, k) => (\n          <button key={x.id} className={k === i ? "on" : ""} aria-current={k === i ? "page" : undefined} onClick={() => setI(k)}>\n            {x.title}\n          </button>\n        ))}\n      </nav>\n'
    + '      <main className="app">\n        {s.hero && (\n          <>\n            <div className="mark">✦</div>\n            <small>DISEÑADO CON ESTILOS</small>\n            <h1>{s.title}</h1>\n            <p>{s.subtitle}</p>\n            <button className="primary">Descubrir más ↗</button>\n          </>\n        )}\n        {s.blocks.map((b) => (\n          <section key={b.id} className={b.cls}>\n            {!b.bare && (\n              <>\n                <div className="component-meta">\n                  <span>{b.tab}</span>\n                  <small>Bloque {b.n}</small>\n                </div>\n                <h2>{b.label}</h2>\n                <p>{b.desc}</p>\n              </>\n            )}\n            <iframe loading="lazy" title={b.label} sandbox="allow-same-origin" srcDoc={b.srcdoc} onLoad={(e) => { try { e.target.style.height = e.target.contentDocument.documentElement.scrollHeight + "px"; } catch {} }} />\n          </section>\n        ))}\n      </main>\n    </>\n  );\n}\n';
  return [
    { name: "package.json", data: JSON.stringify({ name: "proyecto-estilos", private: true, version: "1.0.0", type: "module", scripts: { dev: "vite", build: "vite build", preview: "vite preview" }, dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" }, devDependencies: { "@vitejs/plugin-react": "^4.3.1", vite: "^5.4.0" } }, null, 2) + "\n" },
    { name: "vite.config.js", data: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({ plugins: [react()], base: "./" });\n' },
    { name: "index.html", data: '<!doctype html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width,initial-scale=1" />\n' + (builder.exportDark ? '    <meta name="color-scheme" content="light dark" />\n' : '') + '    <title>' + esc(builder.title) + '</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n' },
    { name: "src/main.jsx", data: 'import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\n\ncreateRoot(document.getElementById("root")).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n' },
    { name: "src/App.jsx", data: app },
    { name: "src/styles.css", data: builderExportCSS("react", blocksCss) + "\n" }
  ];
}

async function exportBuilderZip() {
  try {
    const assets = new Map(), assetFiles = [];
    const mediaFn = d => {
      if (assets.has(d)) return assets.get(d);
      const p = dataUrlBytes(d); if (!p) return d;
      const ext = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" }[p.mime] || "bin";
      const name = "assets/img-" + (assets.size + 1) + "." + ext;
      assets.set(d, name); assetFiles.push({ name, data: p.bytes });
      return name;
    };
    const html = builderExportHTML(mediaFn);
    const screens = builderExportScreens(mediaFn);
    const react = builderReactFiles(screens);
    const files = [{ name: "index.html", data: html }]
      .concat(assetFiles)
      .concat(react.map(f => ({ name: "react/" + f.name, data: f.data })))
      .concat(assetFiles.map(f => ({ name: "react/public/" + f.name, data: f.data })))
      .concat(builderTailwindFiles(screens).map(f => ({ name: "tailwind/" + f.name, data: f.data })))
      .concat(assetFiles.map(f => ({ name: "tailwind/public/" + f.name, data: f.data })))
      .concat([{ name: "LEEME.txt", data: "Proyecto exportado desde Estilos\n\n- index.html + assets/: versión lista para abrir o publicar (HTML estático).\n- react/: el mismo proyecto como app React con Vite y CSS.\n- tailwind/: el mismo proyecto como app React con Vite y Tailwind CSS v4 (utilidades en el código).\n    cd react   (o cd tailwind)\n    npm install\n    npm run dev      (desarrollo)\n    npm run build    (genera dist/ para publicar)\n\nLas imágenes que reemplazaste van como archivos en assets/ (y en public/assets/ de cada proyecto).\n" }]);
    downloadBlob(zipBuild(files), "proyecto-estilos.zip", 6000);
    toast("ZIP exportado: HTML + React + Tailwind" + (assetFiles.length ? " + " + assetFiles.length + (assetFiles.length > 1 ? " imágenes" : " imagen") : ""));
  } catch (e) { toast("No se pudo crear el ZIP"); }
}
