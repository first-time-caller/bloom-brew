// Weigh the bag, dose stepper, use it up / brew the rest. Usage: node test_weigh.js <index.html> [outdir]
const { chromium } = require('playwright');
const path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const out = process.argv[3] || '.';
const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const at = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(8, 0, 0, 0); return d.toISOString(); };
const seed = {
  'bloom.name': { name:'Brad', set:true },
  'bloom.settings.v1': { pro:false, grinders:[{ id:'g1', name:'C4S', unit:'clicks', step:1, start:'18', isDefault:true }], waters:[], brewers:['v60','french'] },
  'bloom.bags.v1': [{ id:'bag1', roaster:'Origin', name:'Kiambu', varieties:['SL28'], notes:[], roast:'light', roastDate:iso(12), status:'open', order:0, createdAt:at(5), weightG:250, lastBrewAt:at(1) }],
  'bloom.history.v1': [
    { id:'r1', createdAt:at(1), bagId:'bag1', method:'v60', dose:15, water:250, yieldMl:220, roaster:'Origin', name:'Kiambu', roastDate:iso(12), roast:'light', notes:[], grinderId:'g1', grindSetting:'18', grindUnit:'clicks', taste:'Balanced', rating:4 },
    { id:'r2', createdAt:at(2), bagId:'bag1', method:'v60', dose:15, water:250, yieldMl:220, roaster:'Origin', name:'Kiambu', roastDate:iso(12), roast:'light', notes:[], grinderId:'g1', grindSetting:'18', grindUnit:'clicks', taste:'Balanced', rating:4 }
  ]
};
const stage = p => p.evaluate(() => document.querySelector('.stage[data-pos="active"]').dataset.stage);
const txt = (p, s) => p.$eval(s, e => e.hidden ? '(hidden)' : e.textContent.trim());
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const W = p => p.waitForTimeout(400);

(async () => {
  const browser = await chromium.launch(); const errs = [];
  const ctx = await browser.newContext({ viewport:{ width:390, height:844 } });
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); sessionStorage.setItem('seeded', '1'); } }, seed);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(file); await p.waitForTimeout(700);
  ok(await stage(p) === 'today', 'on Today');
  console.log('  left:', await txt(p, '#todayLeftTxt'));
  ok(/220 g left/.test(await txt(p, '#todayLeftTxt')), 'label-based: 250 - 30 = 220 g left');
  // dose stepper
  await p.click('#todaySwap summary'); await W(p);
  const d0 = await txt(p, '#tdVal'); await p.click('#tdPlus'); await W(p); const d1 = await txt(p, '#tdVal');
  console.log('  dose', d0, '->', d1, '|', await txt(p, '#todayDose'));
  ok(Math.abs(parseFloat(d1) - parseFloat(d0) - .5) <= .5 && parseFloat(d1) % .5 === 0, 'plus steps up to the next half gram');
  ok((await txt(p, '#todayDose')).includes(d1.split(' ')[0]), 'hero dose follows the stepper');
  // weigh: gross 180 with 20 g bag -> 160 g coffee
  await p.click('#todayWeigh'); await W(p);
  ok(!(await p.$eval('#weighForm', e => e.hidden)), 'weigh form opens');
  await p.fill('#weighIn', '180'); await p.click('#weighSave'); await W(p);
  console.log('  msg:', await txt(p, '#weighMsg'), '| left:', await txt(p, '#todayLeftTxt'));
  ok(/160 g left/.test(await txt(p, '#todayLeftTxt')), 'weighing overrides the label: 160 g');
  ok(/weighed/.test(await txt(p, '#todayLeftTxt')), 'shows it was weighed');
  const bags = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.bags.v1')));
  ok(bags[0].weighings && bags[0].weighings[0].g === 160 && bags[0].tareG === 20, 'weighing stored with tare');
  await p.screenshot({ path:out + '/weigh.png', fullPage:true });
  // coffee only mode: 22 g -> brew the rest
  await p.click('#todayWeigh'); await W(p); await p.click('#weighSeg button[data-w="net"]'); await p.fill('#weighIn', '22'); await p.click('#weighSave'); await W(p);
  ok(/22 g left/.test(await txt(p, '#todayLeftTxt')), 'coffee-only weighing: 22 g');
  ok(!(await p.$eval('#todayBrewRest', e => e.hidden)), '"Brew the rest" offered under 1.6 doses');
  await p.click('#todayBrewRest'); await W(p);
  console.log('  rest dose:', await txt(p, '#tdVal'), '|', await txt(p, '#todayDose'));
  ok(parseFloat(await txt(p, '#tdVal')) === 22, 'brew the rest sets the dose to 22 g');
  // use it up: 40 g -> 2 brews of 20
  await p.click('#todayWeigh'); await W(p); await p.click('#weighSeg button[data-w="net"]'); await p.fill('#weighIn', '40'); await p.click('#weighSave'); await W(p);
  console.log('  left:', await txt(p, '#todayLeftTxt'), '| useUp hidden:', await p.$eval('#todayUseUp', e => e.hidden));
  if (!(await p.$eval('#todayUseUp', e => e.hidden))) { await p.click('#todayUseUp'); await W(p); console.log('  use-up dose:', await txt(p, '#tdVal')); ok(parseFloat(await txt(p, '#tdVal')) === 20, 'use it up splits 40 g into 2 × 20 g'); }
  // shelf row has Weigh
  await p.click('#shelfBtn'); await p.waitForTimeout(600); await p.click('#shelfNext summary'); await W(p);
  ok(await p.$('#shelfNext .h-actions button:text("Weigh")') != null, 'shelf row offers Weigh');
  await p.click('#shelfNext .h-actions button:text("Weigh")'); await p.waitForTimeout(600);
  ok(await stage(p) === 'today' && !(await p.$eval('#weighForm', e => e.hidden)), 'shelf Weigh opens the form on Today');
  // empty by weight -> finished
  await p.click('#weighSeg button[data-w="net"]'); await p.fill('#weighIn', '0'); await p.click('#weighSave'); await W(p);
  const bags2 = await p.evaluate(() => JSON.parse(localStorage.getItem('bloom.bags.v1')));
  ok(bags2[0].status === 'finished', 'weighing 0 marks the bag finished');
  await browser.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();
