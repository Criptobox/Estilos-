/* Botón Atrás del WebView de Android: window.estilosBack() */
const { chromium } = require('playwright'); const assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 390, height: 800 } }); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
  await pg.goto('http://127.0.0.1:8080/index.html');
  ok(await pg.evaluate(() => estilosBack()) === false, 'en Idea deja salir de la app');
  await pg.click('[data-idea=comida]'); await pg.locator('#briefForm [type=submit]').click(); await pg.waitForSelector('.gallery-item');
  ok(await pg.evaluate(() => estilosBack()) === true && await pg.locator('#home').isVisible(), 'desde Bloques vuelve a Idea');
  await pg.evaluate(() => document.getElementById('projectsDialog').showModal());
  ok(await pg.evaluate(() => estilosBack()) === true && !(await pg.locator('#projectsDialog[open]').count()), 'cierra el diálogo abierto primero');
  ok(await pg.evaluate(() => estilosBack()) === false, 'y luego permite salir');
  await b.close(); console.log(`${n} comprobaciones de botón Atrás correctas.`);
})().catch(e => { console.error(e); process.exit(1); });
