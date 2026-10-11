// Pass 6 safety checks: bad records, resume after reload, hardware back, export/import/delete, storage failures, a11y and fonts.
// Usage: node test_safety.js <index.html> [outdir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const out = process.argv[3] || '.';
const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const at = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(8, 0, 0, 0); return d.toISOString(); };

const seed = {
  'bloom.name': { name:'Brad', set:true },
  'bloom.settings.v1': { pro:false, grinders:[{ id:'g1', name:'Chestnut C4S', unit:'clicks', step:1, start:'18', isDefault:true }], waters:[], brewers:['v60','kalita','aeropress','french'] },
  'bloom.bags.v1': [
    { id:'bag1', createdAt:at(5), status:'open', roaster:'Kiss the Hipster', name:'Guji Hambela', varieties:['Heirloom'], roastDate:iso(14), roast:'light', notes:['Floral'], weightG:250, order:-1 },
    { id:'', createdAt:at(5), roaster:'Ghost bag' },                  // no id: dropped
    { id:'bag2', createdAt:at(9), status:'open', roaster:'Bad', name:'Bag', varieties:'not-an-array', notes:42, weightG:'abc' }
  ],
  'bloom.history.v1': [
    { id:'good1', createdAt:at(1), method:'v60', dose:15, water:250, yieldMl:220, roaster:'Kiss the Hipster', name:'Guji Hambela', varieties:['Heirloom'], roastDate:iso(14), roast:'light', notes:['Floral'], grinderId:'g1', grindSetting:'18', grindUnit:'clicks', taste:'Sour', rating:3, bagId:'bag1', source:'timer' },
    { id:'bad1', createdAt:at(2), method:'v60', dose:'15', notes:'Floral, Citrus', varieties:null, components:'x', tasted:{}, rating:9, roaster:'Broken', name:'Record', bagId:'bag1' },
    { createdAt:at(3), method:'v60', roaster:'No id' },
    'not even an object',
    null
  ]
};
const stage = p => p.evaluate(() => document.querySelector('.stage[data-pos="active"]').dataset.stage);
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const watch = p => { p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept()); };

  /* 1. malformed records do not break boot */
  let ctx = await browser.newContext({ viewport:{ width:390, height:844 }, acceptDownloads:true });
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); sessionStorage.setItem('seeded', '1'); } }, seed);
  let p = await ctx.newPage(); watch(p);
  await p.goto(file); await p.waitForTimeout(700);
  ok(await stage(p) === 'today', 'boots to Today with malformed history and bags (got ' + await stage(p) + ')');
  ok(errs.length === 0, 'no page errors at boot' + (errs.length ? ': ' + errs.join(' | ') : ''));
  ok((await p.textContent('#todayName')).includes('Guji'), 'bags still load: Today shows the good bag');
  await p.click('#historyBtn'); await p.waitForTimeout(500);
  ok(await stage(p) === 'history', 'History opens');
  const stats = await p.textContent('#histStats');
  ok(/^2 coffees/.test(stats.trim()), 'two usable records kept, id-less and junk ones dropped (' + stats.trim() + ')');
  const cleaned = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.history.v1')));
  console.log('  stored records:', cleaned.length, '(local store rewrites on next save)');
  ok(await p.$eval('html', h => h.lang) === 'en', 'html lang="en"');
  ok(await p.$eval('#stepName', e => e.getAttribute('aria-live')) === 'polite', 'timer step name has aria-live');
  ok(await p.$eval('#stepHint', e => e.getAttribute('aria-live')) === 'polite', 'timer hint has aria-live');
  const fontLink = await p.$eval('link[href*="fonts.googleapis.com/css2"]', l => ({ media:l.media, onload:l.getAttribute('onload') }));
  ok(fontLink.onload && /media/.test(fontLink.onload) && /print|all/.test(fontLink.media), 'Google Fonts stylesheet is non-blocking (media=' + fontLink.media + ')');
  ok((await p.content()).includes('<noscript><link href="https://fonts.googleapis.com'), 'noscript font fallback present');
  ok(await p.$$eval('meta[name="theme-color"]', m => m.length) === 2, 'theme-color for light and dark');
  ok(await p.$eval('link[rel="manifest"]', l => /^(blob:|data:)/.test(l.href)), 'runtime manifest link added');
  const targets = await p.evaluate(() => [...document.querySelectorAll('.mini, #greet')].map(e => { const s = getComputedStyle(e); return e.id + ':' + s.minHeight; }));
  ok(targets.every(t => /44px/.test(t)), 'header buttons and greet have 44px min-height (' + targets.join(' ') + ')');
  await p.click('#nextBtn'); await p.waitForTimeout(400);

  /* 2. popstate behaves like Back */
  await p.click('#todayNewBag'); await p.waitForTimeout(500);
  ok(await stage(p) === 'coffee', 'New bag opens the coffee form');
  await p.goBack(); await p.waitForTimeout(500);
  ok(await stage(p) === 'today', 'browser back from the coffee form returns to Today');
  await p.click('#shelfBtn'); await p.waitForTimeout(400);
  await p.goBack(); await p.waitForTimeout(400);
  ok(await stage(p) === 'today', 'browser back from the shelf returns to Today');

  /* 3. reload mid-brew offers Resume */
  await p.click('#todayBrew'); await p.waitForTimeout(600);
  ok(await stage(p) === 'brew', 'timer open');
  await p.click('#playBtn'); await sleep(3200);
  await p.goBack(); await p.waitForTimeout(300);
  ok(await stage(p) === 'brew', 'browser back mid-brew stays on the timer');
  const inflight = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.brew.inflight') || 'null'));
  ok(inflight && inflight.state === 'running' && inflight.method === 'v60', 'in-flight brew written to storage');
  await p.reload(); await p.waitForTimeout(700);
  ok(await stage(p) === 'today', 'after reload we are on Today');
  const bar = await p.$('[data-stage="today"] .resume');
  ok(!!bar, 'Resume bar shown');
  const barText = bar ? await bar.textContent() : '';
  console.log('  bar:', barText.trim());
  ok(/Brew in progress/.test(barText) && /V60 at 0:0\d/.test(barText), 'bar names the brewer and elapsed time');
  await p.screenshot({ path:out + '/resume-bar.png' });
  await p.click('[data-stage="today"] .resume button:text("Resume")'); await p.waitForTimeout(600);
  ok(await stage(p) === 'brew', 'Resume lands on the brew stage');
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.brew.inflight') || 'null'));
  ok(after && after.real >= 3000 && after.real <= 9000, 'elapsed time restored (about ' + (after ? (after.real / 1000).toFixed(1) : '?') + ' s)');
  ok(await p.textContent('#brewMeta') !== '', 'brew meta rendered');
  await p.screenshot({ path:out + '/resumed.png' });
  // cancel the brew via Back twice
  await p.click('#backBtn'); await p.click('#backBtn'); await p.waitForTimeout(500);
  ok(await stage(p) === 'today', 'cancelled back to Today');
  ok(await p.evaluate(() => localStorage.getItem('bloom.brew.inflight')) === null, 'cancel clears the in-flight brew');
  ok(!(await p.$('[data-stage="today"] .resume')), 'bar gone after cancel');

  /* 4. export */
  await p.click('#settingsBtn'); await p.waitForTimeout(400);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout:5000 }).catch(() => null), p.click('#exportBtn')]);
  let json = null, exportPath = out + '/export.json';
  if (dl) { const pth = await dl.path(); fs.copyFileSync(pth, exportPath); json = JSON.parse(fs.readFileSync(exportPath, 'utf8')); }
  else { const txt = await p.$eval('#exportOut', e => e.value); fs.writeFileSync(exportPath, txt); json = JSON.parse(txt); }
  ok(json && json.schema === 1 && Array.isArray(json.history) && Array.isArray(json.bags) && json.settings, 'export is valid JSON with schema, history, bags, settings');
  ok(json.history.some(r => r.id === 'good1'), 'export contains the seeded brew');
  ok(json.bags.some(b => b.id === 'bag1') && !json.bags.some(b => b.id === ''), 'export contains the seeded bag and not the id-less one');
  console.log('  export:', (dl ? 'download' : 'textarea'), json.history.length, 'brews,', json.bags.length, 'bags');

  /* 5. storage failure shows a notice */
  await p.evaluate(() => { localStorage.setItem = () => { throw new Error('QuotaExceededError'); }; });
  await p.click('#modeSeg button[data-mode="pro"]'); await p.waitForTimeout(300);
  const noticeText = await p.$eval('#notice', e => e.hidden ? '' : e.textContent).catch(() => '');
  ok(/storage is full or blocked/.test(noticeText), 'storage write failure shows the notice (' + noticeText + ')');
  await p.screenshot({ path:out + '/notice.png' });
  await ctx.close();

  /* 6. import into a fresh context */
  ctx = await browser.newContext({ viewport:{ width:390, height:844 } });
  p = await ctx.newPage(); watch(p);
  await p.goto(file); await p.evaluate(() => localStorage.setItem('bloom.name', JSON.stringify({ name:'Brad', set:true })));
  await p.reload(); await p.waitForTimeout(600);
  ok(await stage(p) === 'today', 'fresh context boots to Today');
  await p.click('#settingsBtn'); await p.waitForTimeout(400);
  await p.setInputFiles('#importFile', exportPath); await p.waitForTimeout(600);
  const msg = await p.textContent('#dataMsg');
  console.log('  import:', msg.trim());
  ok(/Imported 2 brews and 2 bags, plus settings/.test(msg), 'import reports the merged counts');
  const hist = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.history.v1') || '[]'));
  const bags = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.bags.v1') || '[]'));
  ok(hist.some(r => r.id === 'good1') && bags.some(b => b.id === 'bag1'), 'imported brew and bag saved locally');
  ok(/History · 2/.test(await p.textContent('#historyBtn')), 'header count updated after import');
  await p.$eval('#dataMsg', e => { e.textContent = ''; });
  await p.setInputFiles('#importFile', []); await p.setInputFiles('#importFile', exportPath); await p.waitForTimeout(500);
  const msg2 = (await p.textContent('#dataMsg')).trim(); console.log('  second import:', msg2);
  ok(/Imported 0 brews and 0 bags\./.test(msg2), 'importing the same file twice adds nothing');
  await p.click('#nextBtn'); await p.waitForTimeout(500);
  ok((await p.textContent('#todayName')).includes('Guji'), 'Today shows the imported bag');

  /* 7. delete everything */
  await p.click('#settingsBtn'); await p.waitForTimeout(400);
  await p.click('#wipeBtn');
  ok((await p.textContent('#wipeBtn')).includes('Tap again'), 'delete-all arms on first tap');
  await p.click('#wipeBtn'); await p.waitForTimeout(1200);
  const keys = await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('bloom.')));
  ok(keys.length === 0 || keys.join() === 'bloom.schema', 'bloom.* keys cleared (' + keys.join(', ') + ')');
  ok(await stage(p) === 'welcome', 'reloads to welcome (got ' + await stage(p) + ')');
  await ctx.close();

  await browser.close();
  const real = errs.filter(e => !/TUNNEL|fonts\.g/.test(e));
  console.log(real.length ? 'ERRORS:\n' + real.join('\n') : 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();
