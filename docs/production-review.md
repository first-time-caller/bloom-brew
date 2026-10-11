# Bloom Brew: production review and pour-over gap analysis (11 Oct 2026)

Two passes over the app as shipped in Pass 5: a code audit (verified with Playwright against `index.html`) and a comparison with what the pour-over community uses in 2026 (Beanconqueror, Filtru, Timer.Coffee, Fellow Aiden, Barista Hustle, Rao, Hoffmann, Hedrick, Kasuya and the home-barista/coffeetime forums; Reddit itself couldn't be read, so community expectations are drawn from those sources).

Severity: **Blocker** stops real daily use · **Important** hurts trust or credibility · **Nice** polish.

---

## Part 1: Production readiness

### Blockers

1. **One bad history record breaks the app.** `store.init` renders history before bags load and before the db connects; `renderHistory` assumes `rec.notes` is an array. A single malformed record (old data, a partial write) throws, bags never load, Today shows empty, and db sync never starts. There is no record sanitiser like `cleanSettings`. *Fix: add `cleanRecord()`, sanitise on load, load bags first, wrap render in try/catch.*
2. **A reload or hardware back mid-brew loses the brew.** Brew state lives in memory only; no `beforeunload` guard; no `pushState`, so Android back leaves the page. *Fix: write the in-flight brew to storage on every tick and offer "Resume brew" on load; push a history entry per stage so back = Back.*
3. **Storage failures are silent.** `LS.set` swallows every error (quota, Safari private mode), so a brew or bag can vanish with no message. Local history is capped at 200 and the db query is `limit(200)`, so a daily brewer loses or can't see brews after ~7 months, and "brews left" under-counts. *Fix: show a "couldn't save" notice; raise the cap or page by bag; show "older brews not shown".*

### Important

4. **One db error wipes visible history.** Any single failed save/patch/remove calls `fallback()`, which replaces `S.history` with the (usually empty) local copy. *Fix: retry with backoff, keep the in-memory snapshot, show a "not synced" badge.*
5. **No export, import, backup or delete-all.** Data is trapped in one browser (Pages) or one Claude account. *Fix: Settings → Download my data (JSON) / Import / Delete everything.*
6. **No schema version.** `cleanSettings` strips unknown fields, so any field added later is dropped if an older client saves. *Fix: `schema:1` on settings, bags and brews, plus a migrate step.*
7. **Timer is silent for screen readers.** Step name, hint and next-step text have no `aria-live`. *Fix: `aria-live="polite"` on step text, or an sr-only announcer.*
8. **`<html>` has no `lang`.** *Fix: `lang="en"`.*
9. **Render-blocking Google Fonts; no offline on Pages.** No manifest, no service worker, no install prompt, no `theme-color`. *Fix: async font load with system fallback; minimal manifest + cache-first service worker (works on Pages, harmless in the artifact).*
10. **Touch targets under 44 px:** header buttons 42, greet 26, chips/decaf/iced 41, yield slider 32. *Fix: `min-height:44px` on `.mini`, `.chip`, `.btn-text`; pad the slider hit area.*
11. **Chimes on locked phones.** Timing is wall-clock based (verified: no drift after backgrounding; wake lock re-taken on return; AudioContext unlocked on the Start tap), but steps that pass while locked fire at most one chime, iOS mutes WebAudio under the silent switch, and iOS has no vibration. *Fix: visible "you're on step N" on return; `<audio>` element for the done chime; Notifications API fallback.*
12. **Two devices.** Settings are read once and last-writer-wins with no `updatedAt` check; the bag migration flag is per browser. *Fix: compare `updatedAt`; keep the migration marker in the profile doc.*
13. **History re-renders off-screen** on every save and snapshot (~7,800 nodes for 200 brews, ~50 ms headless, 3–4× on a phone). *Fix: dirty flag, render only on the History stage.*
14. **Scan has no timeout** beyond the user's Stop. Output sanitising is good (whitelists, `textContent`; the only `innerHTML` is static SVG). *Fix: `AbortSignal.timeout(90000)` combined with the user signal.*

### Nice

15. `finishBrew` has a duplicate `source` key, so "where bought" is never stored on the brew.
16. `migrateBags` sets `openedOn` from a UTC day while the rest of the app uses local days.
17. Contrast passes AA (`--ink2` 5.2:1 light, 7.0:1 dark; `--warn` 4.85:1 light, barely). Placeholders at 60% opacity fail (~2.2:1).
18. Pro, units and kettle max are only discoverable inside Settings. Cup size is labelled in g with ml beneath; hobbyists think in ml.
19. Code health: one 4,475-line file, features bolted on through hook arrays and a monkey-patched `renderHistory`; `withBag()` mutates global state to reuse helpers; ~60 ad-hoc fields on `S`. Tests cover Today, shelf and a full brew only; nothing for the engine, label-date parsing, the recipe editor, settings cleaning or storage. *Before the next big features: split into engine / store / ui with a tiny concat step, and add engine and parsing unit tests.*

### Do these first
1. `cleanRecord()` and a resilient `store.init` (item 1).
2. Persist the in-flight brew, `beforeunload`, back-button handling (item 2).
3. Surface storage failures; stop one db error wiping history (items 3–4).
4. Export / import / delete-all with schema versioning (items 5–6).
5. `aria-live` on the timer, `lang`, 44 px targets, async fonts, manifest + service worker (items 7–10).

---

## Part 2: Tailoring to the pour-over community

What hobbyists use today that Bloom doesn't do yet. **M** = must-have for credibility against Beanconqueror/Filtru, **D** = differentiator nobody does well, **N** = nice.

### Logging and dial-in
- **Bluetooth scale (M).** Beanconqueror and Filtru pair Acaia, Felicita, Bookoo, Timemore, DiFluid, Varia. Web Bluetooth works in Chrome on Android and desktop (the open-source Crema PWA proves Bookoo/Acaia/Felicita/Timemore from a browser); it does **not** work in iOS Safari, and may be blocked inside the Claude artifact frame, so this is a GitHub Pages / Android feature first. Turns pour targets into live weight-following with auto-logged bloom end, first drip and drawdown.
- **TDS and extraction yield (M for Pro).** Fields for TDS and beverage weight; EY = TDS × beverage ÷ dose; plot EY against taste. Norms: 1.2–1.5% TDS, 18–22% EY.
- **Filter paper as a first-class variable (M).** Hario tabbed vs untabbed, Cafec Abaca, Sibarist Fast change drawdown dramatically; log paper per brew and let the engine expect it.
- **Bypass / dilution step (M).** Kasuya hybrid, Switch and ORB-style strong-then-dilute methods need it. Already parked in the wishlist.
- **Per-pour temperature (M for Pro).** Kasuya hybrid uses 93 °C then 70 °C; Winton uses a second kettle. The editor has one temperature.
- **Flow rate (D, needs a scale).** "You poured at 8 g/s, the recipe wanted 5" as a pace hint.
- Brewer size (01/02), burr type, grinder RPM, kettle (N).

### Recipes
- **The named library people expect (M).** Hoffmann 1-cup V60 (15/250, 50 g bloom to 0:45, 50 g pours at 0:45/1:10/1:35/2:00), Rao V60 (20/330 at 97 °C, 60 g bloom + spin), Winton 5-pour (50/70/60/60/60), Kasuya Hybrid for the Switch (60+60 at 93 °C open, 160 g at 70 °C closed), Hedrick V60 (20/300, 40 g bloom + stir), April, AeroPress championship recipes. Timer.Coffee ships 27 brewers' worth.
- **Switch/immersion step types (M).** "Valve closed / open" steps rather than pours only.
- **Share by link and QR (M).** Fellow Aiden profiles are deep links on roaster pages; Beanconqueror reads QR/NFC and roasters add "Import into Beanconqueror" buttons. Bloom's recipe is already JSON: a `?r=` link plus QR is cheap, and translating the grind into the viewer's grinder would be unique (D).
- **Roaster-authored recipes (D).** Make the "roaster's recipe" field importable and structured.

### Grinders
- **Starting-point database by model (M).** C40, ZP6, K-Ultra, Ode Gen 2, DF54/DF64, 1Zpresso, Timemore C3/C4s/S3, Encore, Kingrinder, Niche: micron ranges and typical pour-over settings. "New grinder → start at 22–26 clicks for V60."
- **Cross-grinder conversion (D).** "C40 30 clicks ≈ ZP6 4.5 ≈ Ode 2 at 5", so shared recipes land in your units.
- **Dial-in session (D).** Today already nudges one change; show the last 2–4 brews converging on a chart and let the user lock in a "dialled" setting per bag.
- Burr geometry and a dull-burr floor per grinder (N).

### Water
- **Built-in recipes (M).** Third Wave Water, Lotus (Hedrick Light & Bright 60/25, Rao/Perger 90/42), Barista Hustle (80.7/40.1), Hendon (99.9/30.8), SCA, with drops/grams per 450 ml / 1 L.
- **Remineralisation calculator (D).** Start water + target recipe + litres → grams or drops, from the mineral table already in Settings.
- GH/KH targets by roast and a guided split-cup water test (D); UK postcode hardness presets (N).

### Social
- **Brew card image to share (M).** r/pourover posts are a screenshot plus a bed photo; Filtru and Timer.Coffee share entries.
- **Keep the bag photo; add a bed photo (M).** Bloom scans the bag but throws the picture away.
- Rating: 1–10 plus optional SCA attributes (sweetness, acidity, body, aftertaste) (N).
- Roaster/bean memory and barcode (D); origins map, roasters-tried, spend and cost per cup (N).

### Platform
- PWA install, offline, notifications, web share target (M; overlaps Part 1 item 9).
- Live Activities / widgets / Shortcuts are native-only; out of reach for a web app. Apple Health caffeine and smart-kettle control likewise (N, or a later native wrapper).

### Niche delights
- **"Ready to brew" and "leaving the best window" notifications (D):** the shelf already knows the dates.
- **Freezer dosing (D):** doses in the freezer per bag, "grind frozen: a touch finer".
- Burr-clean every N kg and filter-paper stock from logged doses (N); cupping mode (N).

---

## Suggested order

**Pass 6 — make it safe (1–2 days):** the five "do these first" items, plus the two-device fixes and history render guard. Nothing visible changes, but nobody loses a brew.

**Pass 7 — credibility with r/pourover:** named recipe library with per-pour temperature, valve steps and bypass; filter paper and brewer size as variables; grinder starting-point database; water presets and remineraliser; TDS/EY in Pro.

**Pass 8 — the things nobody else does well:** recipe share links + QR with grind translated to the viewer's grinder; dial-in session view with "dialled" lock; ready-to-brew notifications; freezer dosing; brew card image with bag and bed photos.

**Pass 9 — hardware:** Web Bluetooth scales on Pages/Android (Bookoo, Acaia, Timemore, Felicita), live weight on the ring, auto-logged drawdown and flow rate.

**Before Pass 7:** split `index.html` into engine / store / ui files with a small build step and add engine unit tests, or every pass from here on gets slower and riskier.

---

### Sources (community pass)
- Beanconqueror: https://apps.apple.com/app/beanconqueror/id1445297158 · https://kaffeemacher.ch/en/blog/beanconqueror · https://centralcoastcoffee.com.au/blogs/coffee-news/from-our-store-to-your-phone-beanconqueror-integration
- Filtru: https://apps.apple.com/us/app/1150921819 · Timer.Coffee: https://apps.apple.com/app/id6449322787
- Web Bluetooth scales: https://github.com/geota/crema · https://www.npmjs.com/package/btscale
- TDS/EY: https://kaffeemacher.de/en/blogs/kaffeewissen/refractometer-and-tds
- Filter papers: https://www.home-barista.com/brewing/new-thinner-hario-v2-tabbed-dramatic-change-to-brew-help-t94074.html
- Recipes: https://honestcoffeeguide.com/brew-recipes/ · https://honestcoffeeguide.com/brew-recipes/tetsu-kasuya-hybrid-method/ · https://www.baristahustle.com/?p=373265 · https://www.hario.co.uk/blogs/hario-ambassadors/hario-v60-recipe-interview-with-hario-ambassador-scott-rao · https://www.lamose.com/blogs/recipes/lance-hedricks-pour-over-masterclass-v60-technique · https://aeroprecipe.com/championship-aeropress-recipes · https://eightouncecoffee.ca/pages/aiden-brew-profiles · https://kurasu.kyoto/blogs/kurasu-journal/switch
- Grinders: https://honestcoffeeguide.com/comandante-c40-mk4-grind-settings/ · https://honestcoffeeguide.com/timemore-c3-grind-settings/ · https://honestcoffeeguide.com/turin-df64-gen-2-grind-settings/ · https://www.beeancoffee.com/?p=12658
- Water: https://www.scottrao.com/blog/lotus-water-drops · https://baristahustle.com/ar/diy-water-recipes-redux · https://www.baristahustle.com/?p=350791 · https://coffeetime.freeflarum.com/d/118-water-calculator-scaling-potential-and-remineralisation · https://stwater.co.uk/waterhardness
- Social/collecting: https://apps.apple.com/app/id6447788662 · https://mwm.ai/apps/bean-passport/6781880654 · https://mwm.ai/apps/beanbench/6758197929
- Freezer workflows: https://coffeetime.freeflarum.com/d/71-airscape-issues-and-single-dosing/48
