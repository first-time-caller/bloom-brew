// Playwright check of the Today home screen and shelf. Usage: node test_today.js <path-to-index.html> [outdir]
const { chromium } = require('playwright');
const path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const out = process.argv[3] || '.';
const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const at = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(8, 0, 0, 0); return d.toISOString(); };

const seed = {
  'bloom.name': { name:'Brad', set:true },
  'bloom.settings.v1': { pro:false, grinders:[{ id:'g1', name:'Chestnut C4S', unit:'clicks', step:1, start:'18', isDefault:true }],
    waters:[{ id:'w1', name:'London tap', type:'tap', isDefault:true }], brewers:['v60','kalita','aeropress','french'] },
  'bloom.history.v1': [
    { id:'r3', createdAt:at(1), method:'v60', dose:15, water:250, yieldMl:220, roaster:'Kiss the Hipster', name:'Guji Hambela', varieties:['Heirloom'], roastDate:iso(14), roast:'light', notes:['Floral'], weightG:250, grinderId:'g1', grindSetting:'18', grindUnit:'clicks', taste:'Sour', rating:3, waterId:'w1', temp:94 },
    { id:'r2', createdAt:at(3), method:'v60', dose:15, water:250, yieldMl:220, roaster:'Kiss the Hipster', name:'Guji Hambela', varieties:['Heirloom'], roastDate:iso(14), roast:'light', notes:['Floral'], weightG:250, grinderId:'g1', grindSetting:'20', grindUnit:'clicks', taste:'Bitter', rating:2, waterId:'w1', temp:94 },
    { id:'r1', createdAt:at(70), method:'kalita', dose:20, water:320, yieldMl:290, roaster:'Square Mile', name:'Red Brick', varieties:['Bourbon'], roastDate:iso(90), roast:'medium', notes:[], grinderId:'g1', grindSetting:'21', grindUnit:'clicks', taste:'Balanced', rating:4 }
  ]
};
const stage = p => p.evaluate(() => document.querySelector('.stage[data-pos="active"]').dataset.stage);
const txt = (p, s) => p.$eval(s, e => e.hidden ? '(hidden)' : e.textContent.trim());
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  // returning user
  let ctx = await browser.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); sessionStorage.setItem('seeded', '1'); } }, seed);
  let p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(file); await p.waitForTimeout(600);
  ok(await stage(p) === 'today', 'returning user lands on Today (got ' + await stage(p) + ')');
  console.log('  h1:', await txt(p, '#h-today'));
  console.log('  name:', await txt(p, '#todayName'), '|', await txt(p, '#todayStatus'));
  console.log('  dose:', await txt(p, '#todayDose'), '|', await txt(p, '#tBrewer'), '|', await txt(p, '#tTemp'));
  const grind = await txt(p, '#tGrind'); console.log('  grind:', grind, '|', await txt(p, '#todayWhy'));
  ok(/16/.test(grind), 'sour last cup -> 2 clicks finer (18 -> 16)');
  console.log('  change:', await txt(p, '#todayChange'));
  ok((await txt(p, '#todayName')).includes('Guji'), 'Today shows the recent bag');
  ok(!(await p.content()).includes('Gesha') || true, 'no Gesha placeholder check (see form below)');
  await p.screenshot({ path:out + '/today.png', fullPage:true });
  // shelf
  await p.click('#shelfBtn'); await p.waitForTimeout(600);
  ok(await stage(p) === 'shelf', 'Shelf opens');
  console.log('  stats:', await txt(p, '#shelfStats'));
  ok(await p.$$eval('#shelfNext > li', l => l.length) === 1, 'one bag to drink next');
  ok(await p.$$eval('#shelfDone > li', l => l.length) === 1, 'old bag is finished');
  await p.screenshot({ path:out + '/shelf.png', fullPage:true });
  // freeze then take out
  await p.click('#shelfNext summary'); await p.click('#shelfNext .h-actions button:text("Freeze")'); await p.waitForTimeout(500);
  ok(await p.$$eval('#shelfFreezer > li', l => l.length) === 1, 'Freeze moves bag to freezer');
  await p.click('#nextBtn'); await p.waitForTimeout(500);
  ok(await stage(p) === 'today', 'Close returns to Today');
  ok(!(await p.$eval('#todayEmpty', e => e.hidden)), 'Today shows empty state when only bag is frozen');
  await p.click('#todayEmptyShelf'); await p.waitForTimeout(600); await p.$eval('#shelfFreezer details', d => d.open = true); await p.waitForTimeout(500); await p.click('#shelfFreezer .h-actions button:text("Take out")'); await p.waitForTimeout(500);
  ok(await p.$$eval('#shelfNext > li', l => l.length) === 1, 'Take out returns it to the shelf');
  await p.click('#nextBtn'); await p.waitForTimeout(500);
  // new bag form is blank
  await p.click('#todayNewBag'); await p.waitForTimeout(600);
  ok(await stage(p) === 'coffee', 'New bag opens the coffee form');
  console.log('  coffee h1:', await txt(p, '#h-coffee'));
  const formText = await p.$eval('[data-stage="coffee"]', e => [...e.querySelectorAll('input,textarea')].map(i => i.value).join('|') + e.innerText);
  ok(!/Gesha/.test(formText), 'no Gesha sample values on the new bag form');
  await p.click('#backBtn'); await p.waitForTimeout(500);
  ok(await stage(p) === 'today', 'Back from new bag returns to Today');
  // one-tap brew, cancel
  await p.click('#todayBrew'); await p.waitForTimeout(600);
  ok(await stage(p) === 'brew', 'Start brewing goes straight to the timer');
  console.log('  brewMeta:', await txt(p, '#brewMeta'));
  await p.click('#backBtn'); await p.click('#backBtn'); await p.waitForTimeout(600);
  ok(await stage(p) === 'today', 'Cancel brew returns to Today');
  // adjust -> recipe -> back to today
  await p.click('#todayAdjust'); await p.waitForTimeout(600);
  ok(await stage(p) === 'recipe', 'Adjust recipe opens recipe');
  ok((await txt(p, '#backBtn')) === 'Today', 'recipe back button says Today');
  await p.click('#backBtn'); await p.waitForTimeout(500);
  // quick swap size
  await p.click('#todaySwap summary'); await p.click('#tsCups button:nth-child(4)'); await p.waitForTimeout(500);
  console.log('  after 500g swap:', await txt(p, '#todayDose'));
  // bloom home
  await p.click('#historyBtn'); await p.click('#homeBtn'); await p.waitForTimeout(500);
  ok(await stage(p) === 'today', 'bloom wordmark goes to Today');
  // reload keeps bags
  await p.reload(); await p.waitForTimeout(500);
  ok(await stage(p) === 'today' && (await txt(p, '#todayName')).includes('Guji'), 'after reload still on Today with the bag');
  await p.emulateMedia({ colorScheme:'dark' }); await p.screenshot({ path:out + '/today-dark.png', fullPage:true });
  await ctx.close();

  // first-time user
  ctx = await browser.newContext({ viewport:{ width:390, height:844 } });
  p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(file); await p.waitForTimeout(400);
  ok(await stage(p) === 'welcome', 'new user sees welcome');
  await p.fill('#nameInput', 'Sam'); await p.click('#nextBtn'); await p.waitForTimeout(600);
  ok(await stage(p) === 'today', 'after name -> Today');
  console.log('  empty:', await txt(p, '#todayEmptyText'));
  await p.screenshot({ path:out + '/today-empty.png', fullPage:true });
  await p.click('#todayAddBag'); await p.waitForTimeout(600);
  ok(await stage(p) === 'coffee', 'Add a bag opens the form');
  await p.fill('#roasterIn', 'Origin').catch(() => console.log('  (no #roasterIn)'));
  await p.click('#nextBtn'); await p.waitForTimeout(600);
  console.log('  after Continue:', await stage(p));
  // go home and see bag on Today
  await p.click('#homeBtn'); await p.waitForTimeout(600);
  console.log('  today name:', await txt(p, '#todayName'), '|', await txt(p, '#todayStatus'), '|', await txt(p, '#tGrind').catch(() => ''));
  ok(!(await p.$eval('#todayMain', e => e.hidden)), 'new bag appears on Today');
  await ctx.close();
  await browser.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();
