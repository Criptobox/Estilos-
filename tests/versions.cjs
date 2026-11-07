/* Coherencia de versiones: version.json ⇄ Gradle ⇄ README, y entrada index == crear. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const v = JSON.parse(read('version.json')); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const gradle = read('app/build.gradle.kts');
ok(/versionField\("versionCode"\)/.test(gradle) && /versionField\("versionName"\)/.test(gradle), 'Gradle lee version.json');
ok(Number.isInteger(v.versionCode) && /^\d+\.\d+(\.\d+)?$/.test(v.versionName), 'version.json válido');
ok(read('README.md').includes(`versionCode ${v.versionCode}\`, \`versionName ${v.versionName}\``), 'README coincide con version.json');
ok(fs.existsSync(path.join(root, `docs/CHANGELOG-${v.versionName}.md`)), 'existe el CHANGELOG de esa versión');
ok(read('web/index.html') === read('web/crear.html'), 'index.html y crear.html idénticos');
const sw = read('web/sw.js'), files = JSON.parse(sw.match(/FILES = (\[.*?\]);/)[1]);
ok(files.every(f => f === './' || fs.existsSync(path.join(root, 'web', f))), 'todo el precache existe');
for (const d of ['js', 'css']) for (const f of fs.readdirSync(path.join(root, 'web', d))) ok(files.includes(`${d}/${f}`), `${d}/${f} está en el precache`);
console.log(`${n} comprobaciones de versión y precache correctas.`);
