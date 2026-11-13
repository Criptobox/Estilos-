/* Subir a GitHub: token → repositorio → un solo commit con index.html, README y el proyecto → Pages. GitHub simulado con page.route. */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
(async () => {
  const b = await chromium.launch(), pg = await (await b.newContext({ viewport: { width: 412, height: 1000 } })).newPage(), errors = []; pg.on('pageerror', e => errors.push(e.message));
  const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, J = (route, status, body) => route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });
  const gh = { blobs: {}, tree: null, commit: null, pages: null, auth: [], log: [] }; let n2 = 0; const sha = () => (++n2).toString(16).padStart(40, '0');
  await pg.route('https://api.github.com/**', async route => {
    const q = route.request(), u = new URL(q.url()), p = u.pathname, m = q.method(), body = q.postData() ? JSON.parse(q.postData()) : null;
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    gh.auth.push(q.headers()['authorization']); gh.log.push(m + ' ' + p);
    if (q.headers()['authorization'] !== 'Bearer github_pat_ok') return J(route, 401, { message: 'Bad credentials' });
    if (p === '/user') return J(route, 200, { login: 'ana' });
    if (p === '/user/repos') return J(route, 200, [{ owner: { login: 'ana' }, name: 'mi-cafeteria', full_name: 'ana/mi-cafeteria', default_branch: 'main', size: 4, permissions: { push: true } }]);
    if (p === '/repos/ana/mi-cafeteria') return J(route, 200, { default_branch: 'main', permissions: { push: true }, size: 4, html_url: 'https://github.com/ana/mi-cafeteria' });
    if (p === '/repos/ana/mi-cafeteria/git/ref/heads/main') return J(route, 200, { object: { sha: 'a'.repeat(40) } });
    if (p === '/repos/ana/mi-cafeteria/git/commits/' + 'a'.repeat(40)) return J(route, 200, { tree: { sha: 'b'.repeat(40) } });
    if (p.endsWith('/git/blobs')) { const s = sha(); gh.blobs[s] = Buffer.from(body.content, 'base64').toString('utf8'); return J(route, 201, { sha: s }); }
    if (p.endsWith('/git/trees')) { gh.tree = body.tree.map(e => ({ path: e.path, text: gh.blobs[e.sha] })); return J(route, 201, { sha: sha() }); }
    if (p.endsWith('/git/commits') && m === 'POST') { gh.commit = body; return J(route, 201, { sha: 'c'.repeat(40) }); }
    if (p.endsWith('/git/refs/heads/main') && m === 'PATCH') return J(route, 200, {});
    if (p.endsWith('/pages') && m === 'POST') { gh.pages = body; return J(route, 201, {}); }
    return J(route, 404, { message: 'Not Found' });
  });
  await pg.goto('http://127.0.0.1:8080/crear.html#bloques/plantillas'); await pg.waitForSelector('[data-act=use-template][data-id=tpl-cafeteria]'); await pg.click('[data-act=use-template][data-id=tpl-cafeteria]');
  await pg.waitForSelector('#composeButton', { state: 'visible' }); ok(!(await pg.locator('#openGithub').isVisible()), 'sin crear la pantalla no se ofrece subir');
  await pg.click('#composeButton'); await pg.waitForSelector('#openGithub', { state: 'visible' }); await pg.click('#openGithub'); await pg.waitForSelector('#ghDialog[open]');
  await pg.fill('#ghToken', 'malo'); await pg.click('[data-act=gh-verify]'); await pg.waitForFunction(() => /no es válido/.test(document.getElementById('ghStatus').textContent)); ok(true, 'un token malo se explica');
  await pg.fill('#ghToken', 'github_pat_ok'); await pg.click('[data-act=gh-verify]'); await pg.waitForFunction(() => /Conectado como ana/.test(document.getElementById('ghStatus').textContent));
  ok(await pg.inputValue('#ghRepo') === 'ana/mi-cafeteria', 'si solo hay un repositorio se elige solo');
  await pg.fill('#ghDir', 'web'); await pg.check('#ghPages'); await pg.click('#ghPush');
  await pg.waitForFunction(() => /Listo: 3 archivos/.test(document.getElementById('ghResult').textContent), null, { timeout: 15000 });
  const t = Object.fromEntries(gh.tree.map(x => [x.path, x.text]));
  ok(Object.keys(t).sort().join() === 'web/README.md,web/index.html,web/tinta-proyecto.json', 'sube los 3 archivos dentro de «web»: ' + Object.keys(t));
  ok(/<html/i.test(t['web/index.html']) && t['web/index.html'].length > 5000, 'index.html es la app completa');
  ok(/## Pantallas/.test(t['web/README.md']) && /Inicio/.test(t['web/README.md']), 'el README lista las pantallas');
  const pj = JSON.parse(t['web/tinta-proyecto.json']); ok(pj.format === 'estilos-tinta-project' && pj.draft.selected.length >= 4, 'el proyecto se puede reabrir en Tinta');
  ok(gh.log.filter(l => l === 'POST /repos/ana/mi-cafeteria/git/commits').length === 1, 'un solo commit'); ok(/Proyecto creado con Estilos Tinta/.test(gh.commit.message), 'mensaje del commit');
  await pg.waitForFunction(() => /github\.io/.test(document.getElementById('ghResult').textContent), null, { timeout: 8000 }); ok(gh.pages && gh.pages.source.branch === 'main', 'activa GitHub Pages'); const rt = await pg.innerText('#ghResult'); ok(/ana\.github\.io\/mi-cafeteria/.test(rt), 'muestra la dirección de la web: ' + rt);
  ok(await pg.locator('#ghResult a[target=_blank][rel*=noopener]').count() >= 3, 'los enlaces se abren en otra pestaña de forma segura');
  ok(gh.auth.every(a => a === 'Bearer github_pat_ok' || a === 'Bearer malo'), 'el token solo viaja a GitHub');
  const guardado = await pg.evaluate(() => localStorage.getItem('estilos-tinta-github-v1')); ok(guardado.includes('github_pat_ok'), 'el token queda en el dispositivo');
  const resto = await pg.evaluate(() => Object.keys(localStorage).filter(k => k !== 'estilos-tinta-github-v1').map(k => localStorage.getItem(k)).join('')); ok(!resto.includes('github_pat_ok'), 'y en ningún otro sitio (borrador, copias, enlaces)');
  await pg.click('[data-act=gh-forget]'); ok(!(await pg.evaluate(() => localStorage.getItem('estilos-tinta-github-v1'))).includes('github_pat_ok'), 'olvidar borra el token');
  ok(errors.length === 0, 'sin errores de página: ' + errors.join('|'));
  await b.close(); console.log(n + ' comprobaciones de subida a GitHub correctas.');
})().catch(e => { console.error(e); process.exit(1); });
