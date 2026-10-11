// Origin card, harvest timeline, producer memory, origins map. Usage: node test_origin.js <index.html> [outdir]
const { chromium } = require('playwright');
const path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const out = process.argv[3] || '.';
const at = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(8, 0, 0, 0); return d.toISOString(); };
const bag = (id, o) => Object.assign({ id, varieties:[], notes:[], roast:'light', status:'open', order:0, createdAt:at(5), weightG:250 }, o);
const seed = {
  'bloom.name': { name:'Brad', set:true },
  'bloom.settings.v1': { pro:false, grinders:[], waters:[], brewers:['v60'] },
  'bloom.bags.v1': [
    bag('b1', { roaster:'Kiss the Hipster', name:'Guji Hambela Wamena', roastDate:'2026-09-20', components:[{ country:'Ethiopia', place:'Hambela Wamena', varieties:['74158'], process:'Washed' }], process:'Washed', altitude:'2,100 m', lastBrewAt:at(1), order:0 }),
    bag('b2', { roaster:'Origin', name:'Hambela natural', roastDate:'2026-08-01', components:[{ country:'Ethiopia', place:'Hambela washing station', varieties:[], process:'Natural' }], process:'Natural', status:'finished', order:1 }),
    bag('b3', { roaster:'Square Mile', name:'Red Brick', roastDate:'2026-09-01', components:[{ country:'Colombia', place:'', varieties:[], process:'' }], order:2 }),
    bag('b4', { roaster:'Nomad', name:'El Diamante', roastDate:'2026-09-10', components:[{ country:'Guatemala', place:'Huehuetenango', varieties:['Caturra'], process:'Washed' }], order:3 })
  ],
  'bloom.history.v1': [
    { id:'r1', createdAt:at(1), bagId:'b1', method:'v60', dose:15, water:250, yieldMl:220, roaster:'Kiss the Hipster', name:'Guji Hambela Wamena', roastDate:'2026-09-20', roast:'light', notes:[], rating:5, taste:'Balanced' },
    { id:'r2', createdAt:at(30), bagId:'b2', method:'v60', dose:15, water:250, yieldMl:220, roaster:'Origin', name:'Hambela natural', roastDate:'2026-08-01', roast:'light', notes:[], rating:4, taste:'Balanced' }
  ]
};
const txt = (p, s) => p.$eval(s, e => e.hidden ? '(hidden)' : e.textContent.trim());
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch(); const errs = [];
  const ctx = await browser.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); sessionStorage.setItem('seeded', '1'); } }, seed);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(file); await p.waitForTimeout(900);
  const bags = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.bags.v1')));
  const b1 = bags.find(b => b.id === 'b1');
  console.log('  b1 origin:', JSON.stringify(b1.origin && { where:b1.origin.where, level:b1.origin.level, regionId:b1.origin.regionId, harvest:b1.origin.harvest, src:b1.origin.source }));
  ok(b1.origin && b1.origin.level === 'region' && /guji/i.test(b1.origin.where), 'Hambela Wamena matched to Guji');
  ok(!(await p.$eval('#todayOrigin', e => e.hidden)), 'origin card shown on Today');
  console.log('  summary:', await txt(p, '#toWhere'));
  await p.click('#todayOrigin summary'); await p.waitForTimeout(300);
  const rows = await p.$$eval('#toRows dt', l => l.map(e => e.textContent));
  console.log('  rows:', rows.join(', '));
  ok(rows.includes('Harvest') && rows.includes('In the cup') && rows.includes('Pour-over'), 'card has harvest, cup and pour-over rows');
  console.log('  elevation:', await p.$eval('#toRows', e => [...e.querySelectorAll('div')].map(d => d.textContent).find(t => t.startsWith('Elevation')) || ''));
  console.log('  timeline:', await txt(p, '#toTimeline'));
  ok(/Picked around (Nov|Dec|Jan)/.test(await txt(p, '#toTimeline')) && /months from harvest/.test(await txt(p, '#toTimeline')), 'harvest-to-roast timeline for an Ethiopian roasted in September');
  console.log('  memory:', await txt(p, '#toMemory'));
  ok(/2nd coffee from Hambela/i.test(await txt(p, '#toMemory')), 'producer memory groups the two Hambela bags');
  await p.screenshot({ path:out + '/origin-today.png', fullPage:true });
  // recipe note
  await p.click('#todayAdjust'); await p.waitForTimeout(600);
  const notes = await p.$eval('[data-stage="recipe"]', e => e.innerText);
  ok(/Guji:/.test(notes), 'recipe notes carry the origin tip');
  await p.click('#backBtn'); await p.waitForTimeout(400);
  // shelf: origins map and list
  await p.click('#shelfBtn'); await p.waitForTimeout(900);
  ok(!(await p.$eval('#shelfOrigins', e => e.hidden)), 'origins section on the shelf');
  console.log('  stats:', await txt(p, '#originStats'));
  const pins = await p.$$eval('#originMap circle', c => c.length), land = await p.$$eval('#originMap path', c => c.length);
  console.log('  pins:', pins, 'land paths:', land);
  ok(pins >= 3, 'pins for Hambela, Colombia and Huehuetenango');
  ok(land >= 1, 'coffee-belt land drawn');
  const list = await p.$$eval('#originList li', l => l.map(e => e.textContent));
  console.log('  places:', list.join(' | '));
  ok(list.length >= 3 && /Hambela/i.test(list[0]), 'places list, Hambela first with 2 bags');
  const b3 = (await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.bags.v1')))).find(b => b.id === 'b3');
  ok(b3.origin && b3.origin.level === 'country', 'Colombia with no region gets a country-level card');
  await p.screenshot({ path:out + '/origin-shelf.png', fullPage:true });
  await p.emulateMedia({ colorScheme:'dark' }); await p.screenshot({ path:out + '/origin-shelf-dark.png', fullPage:true });
  await browser.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();
