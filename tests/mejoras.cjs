/* Pruebas de las mejoras: barra de tres modos, Explorar, buscador ⌘K, acento y tipografía,
   Agente (candado y revisión), cobertura de los 126 diseños y caché sin conexión.
   Uso: node tests/mejoras.cjs   (requiere el paquete playwright de tests/node_modules) */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const WEB = path.join(__dirname, '..', 'web');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + ' → esperado ' + JSON.stringify(b) + ', obtenido ' + JSON.stringify(a));

/* ── 1 · Caché sin conexión: todo lo que la app pide está en el precache ── */
function precache() {
  console.log('caché sin conexión');
  const sw = fs.readFileSync(path.join(WEB, 'sw.js'), 'utf8');
  const files = new Set([...sw.match(/const FILES = (\[[\s\S]*?\]);/)[1].matchAll(/"([^"]+)"/g)].map(m => m[1].replace(/^\.\//, '')));
  const refs = new Set();
  ['index.html', 'agente.html'].forEach(page => {
    const html = fs.readFileSync(path.join(WEB, page), 'utf8');
    [...html.matchAll(/(?:src|href)="([^"#:?]+)"/g)].forEach(m => { if (!/^(https?:|data:|mailto:)/.test(m[1])) refs.add(m[1]); });
  });
  const missing = [...refs].filter(f => !files.has(f) && !files.has('./' + f));
  eq(missing, [], 'todo recurso local de index.html y agente.html está en el precache');
  ['js', 'css'].forEach(dir => fs.readdirSync(path.join(WEB, dir)).forEach(f => {
    ok(files.has(dir + '/' + f), 'precache incluye ' + dir + '/' + f);
  }));
  ok(files.has('agente.html') && files.has('js/agente.js') && files.has('css/agente.css'), 'precache incluye el Agente');
}

/* ── Servidor estático para el navegador ── */
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, r) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      fs.readFile(path.join(WEB, p), (e, d) => {
        if (e) { r.writeHead(404); return r.end(); }
        r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d);
      });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

(async () => {
  precache();
  const srv = await serve(), BASE = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  const newPage = async url => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(url + ' EXC ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(url + ' CON ' + m.text()); });
    await p.goto(BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(400);
    return p;
  };

  /* ── 2 · Explorar y barra de tres modos ── */
  console.log('explorar');
  const p = await newPage('index.html');
  eq(await p.$$eval('#nav .ni', l => l.map(b => b.textContent.trim())), ['Biblioteca', 'Crear', 'Editor'], 'la barra tiene tres modos');
  ok(await p.$eval('#nav a.ni', a => a.getAttribute('href') === 'agente.html'), 'Agente enlaza a la página del agente');
  eq(await p.$$eval('.modeSeg button', l => l.map(b => b.textContent.trim())), ['Estilos', 'Plantillas', 'Colecciones'], 'Explorar tiene sus tres segmentos');
  ok(/Explorar/.test(await p.textContent('h1.big')), 'la portada se titula «Explorar»');
  const cats = await p.$$eval('.catk', l => l.length);
  ok(cats >= 19, 'la portada lista las categorías con estilos (' + cats + ')');
  const total = await p.evaluate(() => db().length);
  ok(await p.$eval('.home p.sub', (el, t) => el.textContent.includes(t + ' estilos'), total), 'la portada cuenta los ' + total + ' estilos reales');
  await p.click('.modeSeg button:has-text("Plantillas")'); await p.waitForTimeout(300);
  eq(await p.evaluate(() => document.body.dataset.view + ':' + S.tab), 'explore:Plantillas', 'el segmento Plantillas abre las plantillas');
  ok(await p.$eval('#nav .nia', b => b.textContent.trim() === 'Biblioteca'), 'Explorar sigue activo en la barra dentro de Plantillas');
  ok(await p.$eval('.modeSeg button.on', b => b.textContent.trim() === 'Plantillas'), 'el segmento Plantillas queda marcado');
  await p.click('.modeSeg button:has-text("Colecciones")'); await p.waitForTimeout(300);
  eq(await p.evaluate(() => document.body.dataset.view), 'favs', 'el segmento Colecciones abre los guardados');
  await p.click('#nav [data-v=builder]'); await p.waitForTimeout(300);
  eq(await p.evaluate(() => document.body.dataset.view), 'builder', 'Crear abre el creador');
  /* en el creador móvil la barra se oculta a propósito: se vuelve con el estado de la app */
  await p.evaluate(() => go({ view: 'home', q: '' })); await p.waitForTimeout(300);

  /* ── 3 · Acento único y escala tipográfica ── */
  console.log('acento y tipografía');
  const icons = await p.$$eval('.catk .tileIc', l => [...new Set(l.map(e => getComputedStyle(e).backgroundImage))]);
  eq(icons.length, 1, 'todas las categorías usan el mismo degradado de marca');
  const small = await p.evaluate(() => [...document.querySelectorAll('#view *')].filter(el => {
    const st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  }).map(el => parseFloat(getComputedStyle(el).fontSize)).filter(v => v < 11));
  eq(small, [], 'ningún texto de la portada baja de 11 px');

  /* ── 4 · Buscador ⌘K ── */
  console.log('buscador ⌘K');
  await p.keyboard.press('Control+k'); await p.waitForTimeout(200);
  ok(await p.$eval('.cmdk', el => getComputedStyle(el).display === 'flex'), 'Ctrl+K abre el buscador');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.tagName === 'INPUT'), 'el buscador toma el foco');
  await p.keyboard.type('navbar'); await p.waitForTimeout(150);
  ok(await p.$$eval('.cmdkItem small', l => l.some(s => s.textContent.trim() === 'Barras')), '«navbar» encuentra estilos de Barras');
  await p.fill('.cmdk input', 'input'); await p.waitForTimeout(150);
  ok(await p.$$eval('.cmdkItem small', l => l.some(s => s.textContent.trim() === 'Entradas')), '«input» encuentra estilos de Entradas');
  await p.fill('.cmdk input', 'zzqqxx'); await p.waitForTimeout(150);
  ok(/Sin resultados/.test(await p.textContent('.cmdkList')), 'una búsqueda sin coincidencias lo dice');
  await p.fill('.cmdk input', 'botón'); await p.waitForTimeout(150);
  await p.keyboard.press('ArrowDown');
  ok(await p.$$eval('.cmdkItem', l => l[1] && l[1].getAttribute('aria-selected') === 'true'), 'las flechas mueven la selección');
  await p.keyboard.press('Enter'); await p.waitForTimeout(350);
  ok(await p.evaluate(() => document.body.dataset.view === 'detail'), 'Enter abre el estilo elegido');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.cmdk')).display === 'none'), 'al elegir, el buscador se cierra');
  await p.evaluate(() => go({ view: 'home', q: '' })); await p.waitForTimeout(250);
  await p.keyboard.press('Control+k'); await p.waitForTimeout(150);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.cmdk')).display === 'none'), 'Esc cierra el buscador');
  await p.keyboard.press('/'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.cmdk')).display === 'flex'), '«/» abre el buscador fuera de campos');
  await p.keyboard.press('Escape');

  /* ── 5 · Agente: candado, revisión y limpieza ── */
  console.log('agente: candado y revisión');
  const a = await newPage('agente.html');
  await a.click('.vlab[data-v=comida]'); await a.waitForTimeout(250);
  const cardsId = await a.evaluate(() => S.blocks.cards);
  await a.click('.blk[data-slot=cards] [data-act=lock]'); await a.waitForTimeout(200);
  ok(await a.$eval('.blk[data-slot=cards] [data-act=lock]', b => b.getAttribute('aria-pressed') === 'true'), 'el candado se activa');
  ok(await a.$eval('.blk[data-slot=cards]', r => r.classList.contains('locked')), 'el bloque bloqueado se marca');
  let changed = false, kept = true;
  for (let i = 0; i < 8; i++) {
    await a.click('#btnShuffle'); await a.waitForTimeout(120);
    kept = kept && (await a.evaluate(() => S.blocks.cards)) === cardsId;
    const cur = await a.evaluate(() => JSON.stringify([S.blocks.header, S.blocks.cta, S.blocks.nav]));
    if (!a._first) a._first = cur; else if (cur !== a._first) changed = true;
  }
  ok(kept, 'un bloque bloqueado no cambia al pulsar «Sorpréndeme»');
  ok(changed, 'los bloques sin candado sí cambian');
  await a.reload({ waitUntil: 'load' }); await a.waitForTimeout(300);
  ok(await a.$eval('.blk[data-slot=cards] [data-act=lock]', b => b.getAttribute('aria-pressed') === 'true'), 'el candado se recuerda al recargar');
  await a.click('.blk[data-slot=cards] [data-act=lock]'); await a.waitForTimeout(150);
  ok(await a.$eval('.blk[data-slot=cards]', r => !r.classList.contains('locked')), 'el candado se quita');
  const score = await a.textContent('#reviewScore');
  ok(/^\d+\/6$/.test(score.trim()), 'la revisión muestra su puntuación (' + score.trim() + ')');
  eq(await a.$$eval('#checks li', l => l.length), 6, 'la revisión tiene seis comprobaciones');
  await a.click('[data-act=change][data-slot=header]'); await a.waitForTimeout(250);
  const hdrExpected = await a.evaluate(() => Object.values(ENTRY).filter(e => e.tab === 'Encabezados').length);
  eq(await a.$$eval('#pickerGrid .pick', l => l.length), hdrExpected, 'el selector de Encabezado muestra sus ' + hdrExpected + ' diseños');
  await a.keyboard.press('Escape');
  ok(await a.$eval('a[href="index.html"]:has-text("Biblioteca")', el => /Biblioteca/.test(el.textContent)), 'el Agente enlaza de vuelta a la biblioteca');

  /* ── 6 · Cobertura: los 126 diseños se ven en la biblioteca y en el Agente ── */
  console.log('cobertura de diseños');
  const fails = await p.evaluate(() => {
    const bad = [];
    SEED.forEach(e => {
      try {
        const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-9999px;width:170px';
        document.body.appendChild(host);
        const sh = host.attachShadow({ mode: 'open' }); sh.innerHTML = designShadow(e);
        if (!sh.innerHTML.length) bad.push(e.id + ' vacío');
        host.remove();
      } catch (err) { bad.push(e.id + ' ' + err.message); }
    });
    return bad;
  });
  eq(fails, [], 'los diseños de la biblioteca se renderizan sin error');
  const agFails = await a.evaluate(() => {
    const bad = [];
    Object.keys(ENTRY).forEach(id => {
      ['light', 'dark'].forEach(theme => {
        try {
          const prev = S.theme; S.theme = theme;
          const st = styled(id); if (!st) bad.push(id + ' sin estilo');
          else partsFor(st);
          S.theme = prev;
        } catch (err) { bad.push(id + ' ' + theme + ' ' + err.message); }
      });
    });
    return bad;
  });
  eq(agFails, [], 'el Agente renderiza todos los diseños en claro y en oscuro');
  ok(await a.evaluate(() => Object.keys(ENTRY).length) === (await p.evaluate(() => SEED.length)), 'el Agente conoce el mismo catálogo que la biblioteca');

  ok(errors.length === 0, 'sin errores de consola ni excepciones' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  console.log(pass + ' correctas, ' + fail + ' fallidas');
  await browser.close(); srv.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
