// Full brew from Today through the finale and back. Usage: node test_fullbrew.js <index.html> [outdir]
const { chromium } = require('playwright');
const path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const out = process.argv[3] || '.';
const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const seed = {
  'bloom.name': { name:'Brad', set:true },
  'bloom.settings.v1': { pro:false, grinders:[{ id:'g1', name:'Chestnut C4S', unit:'clicks', step:1, start:'18', isDefault:true }], waters:[], brewers:['v60','chemex','aeropress','french'] }
};
const stage = p => p.evaluate(() => document.querySelector('.stage[data-pos="active"]').dataset.stage);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

async function brewOnce(p, label){
  await p.click('#todayBrew'); await p.clock.runFor(600);
  ok(await stage(p) === 'brew', label + ': timer open');
  await p.evaluate(() => { window.__fin = 0; const f = document.getElementById('finale'); new MutationObserver(() => { if (f.classList.contains('on')) window.__fin = 1; }).observe(f, { attributes:true }); });
  for (let i = 0; i < 300 && !(await p.evaluate(() => window.__fin)); i++) {
    if (await p.evaluate(() => !document.getElementById('playBtn').disabled)) await p.click('#playBtn', { timeout:2000 }).catch(() => {});
    await p.clock.runFor(2000);
  }
  ok(await p.evaluate(() => window.__fin) === 1, label + ': finale played');
  await p.clock.runFor(2500);
  await p.screenshot({ path:out + '/finale-' + label + '.png' });
  await p.clock.runFor(6000);
  ok(await stage(p) === 'done', label + ': done screen');
}

(async () => {
  const browser = await chromium.launch(); const errs = [];
  const ctx = await browser.newContext({ viewport:{ width:390, height:844 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.clock.install();
  await ctx.addInitScript(s => { if (!localStorage.getItem('bloom.name')) Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, seed);
  await p.goto(file); await p.clock.runFor(600);
  // add a bag by hand
  await p.click('#todayAddBag'); await p.clock.runFor(600);
  await p.fill('#roasterIn', 'Origin'); await p.fill('#nameIn', 'Kenya Kiambu').catch(() => {});
  await p.click('#nextBtn'); await p.clock.runFor(600);
  ok(await stage(p) === 'method', 'new bag continues to brewer choice');
  await p.click('#homeBtn'); await p.clock.runFor(600);
  ok(await stage(p) === 'today', 'home is Today');
  await brewOnce(p, 'v60');
  const recs = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.history.v1') || '[]'));
  const bags = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.bags.v1') || '[]'));
  ok(recs.length === 1 && recs[0].bagId && recs[0].bagId === bags[0].id, 'brew saved with its bagId');
  ok(!!bags[0].lastBrewAt && !!bags[0].openedOn, 'bag marked opened and last brewed');
  ok((await p.textContent('#nextBtn')).trim() === 'Back to today', 'done says Back to today');
  // rate it sour on the done screen if possible, else via Today
  await p.click('#nextBtn'); await p.clock.runFor(600);
  ok(await stage(p) === 'today', 'back on Today');
  const rateShown = await p.evaluate(() => !document.getElementById('todayRate').hidden);
  console.log('  rate card shown:', rateShown);
  if (rateShown) { await p.click('#trTaste button[data-t="Sour"]'); await p.clock.runFor(300); }
  console.log('  why:', await p.textContent('#todayWhy'));
  ok(/sour/i.test(await p.textContent('#todayWhy')) || !rateShown, 'rating sour updates the suggestion');
  // swap to French press and brew again
  await p.click('#todaySwap summary'); await p.clock.runFor(200);
  await p.click('#tsBrewers button:has-text("French")'); await p.clock.runFor(300);
  await brewOnce(p, 'french');
  await browser.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();
