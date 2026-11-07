/* Ejecuta TODAS las pruebas: levanta servidores estáticos para las que lo necesitan
   (8080/8081), genera la versión autónoma y usa un directorio temporal para capturas. */
const http = require('node:http'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), web = path.join(root, 'web');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const serve = port => new Promise(res => { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(web, path.normalize(p)); if (!f.startsWith(web) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(port, '127.0.0.1', () => res(s)); });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'estilos-tests-'));
const env = { ...process.env, SHOTS_DIR: tmp, STANDALONE_HTML: path.join(tmp, 'Estilos-Tinta.html') };
const only = process.argv[2];
(async () => {
  execFileSync('python3', [path.join(root, 'tools/build-tinta.py'), '--output', env.STANDALONE_HTML], { stdio: 'inherit' });
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.cjs') && f !== 'run-all.cjs' && (!only || f.includes(only))).sort();
  const failed = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(__dirname, f), 'utf8'), needs = !/listen\(/.test(src);
    const servers = needs ? await Promise.all([serve(8080), serve(8081)]) : [];
    process.stdout.write(`▶ ${f} … `);
    const r = await new Promise(res => { const c = spawn('node', [path.join(__dirname, f)], { env }); let o = ''; c.stdout.on('data', d => o += d); c.stderr.on('data', d => o += d); const t = setTimeout(() => c.kill(), 300000); c.on('close', code => { clearTimeout(t); res({ status: code, stdout: o, stderr: '' }); }); });
    servers.forEach(s => s.close());
    if (r.status === 0) console.log('ok — ' + (r.stdout.trim().split('\n').pop() || '').slice(0, 90));
    else { failed.push(f); console.log('FALLÓ\n' + (r.stdout + r.stderr).split('\n').slice(-15).join('\n')); }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(failed.length ? `\n${failed.length} archivo(s) con fallos: ${failed.join(', ')}` : `\nTodas las pruebas (${files.length} archivos) correctas.`);
  process.exit(failed.length ? 1 : 0);
})();
