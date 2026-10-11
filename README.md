# Bloom Brew

A pour-over coffee coach. Describe your beans (or scan the bag), pick a brewer and how much coffee you want, and Bloom works out a recipe, runs a guided timer while you brew, then helps you adjust the next cup from how this one tasted.

**Try it:** https://first-time-caller.github.io/bloom-brew/

It is a single self-contained page, `index.html`: plain HTML, CSS and JavaScript with no build step and no dependencies beyond two Google Fonts.

## What it does

- **Today**: the home screen. It opens on the bag you're brewing with today's recipe already adjusted from your last cup ("yesterday's cup was sour, so 2 clicks finer today"), what changed last time, and one Start brewing button that goes straight to the timer. Quick swaps for brewer and cup size, and a nudge to rate an unrated cup.
- **Weigh the bag**: type what your scale says and Bloom works out grams and brews left, with "Use it up" and "Brew the rest".
- **Origin atlas**: an origin card for every bag (elevation, harvest season, what the region is known for, how it brews), a harvest-to-roast timeline, producer memory across bags, and a map of everywhere you've brewed from. A built-in atlas of 60 regions works offline; in Claude the card is refined with the bag's own farm or station.
- **Shelf**: every bag as its own record, with a drink-next order, resting and ready status, brews left by weight, a freezer backlog, and finished bags. Earlier brews are grouped into bags automatically.
- **Coffee details**: roaster, coffee name, varieties, roast date and level, the roaster's tasting notes and flavour tags, origin, process, grade, altitude, bag weight, decaf, and the roaster's rest and best-within advice. Blends are kept part by part.
- **Bag ageing**: opened, frozen, out-of-freezer and rest-until dates. Freezer time doesn't count towards age, and the bag's status is shown in plain words (resting, ready, in the freezer, past best-within).
- **Brewers**: V60, Kalita Wave, Origami, Chemex, Hario Switch, Clever Dripper, AeroPress and French press.
- **Recipe engine**: dose, water, temperature, ratio, bloom and pour schedule from cup size, roast level, days off roast, flavour lean, process, decaf, altitude and delicate varieties. Water hardness and kettle maximum are taken into account. Iced mode puts part of the water in the glass as ice.
- **Recipe editor**: adjust temperature, ratio and bloom; in Pro, edit each pour, step times and technique. Save your own recipes, or start from community recipes such as Tetsu Kasuya's 4:6.
- **Guided timer**: pour targets, pace hints, chimes and a screen wake lock, ending with a short animation of your brewer pouring into the cup.
- **After brewing**: drawdown time against plan, taste (sour, balanced, bitter, weak) with a grind or temperature tip in your grinder's own units, what you tasted beside the roaster's notes, as-it-cooled notes, rating and "would buy again".
- **History**: every brew with its grinder setting and water, a "By coffee" view charting rating against days off roast, Brew again, and **Copy as review** in the r/pourover weekly bean review thread format.
- **Settings**: Simple or Pro mode, units, your grinders (clicks, dial numbers or microns), the brewers you use, water profiles with mineral tables (GH and KH worked out), and kettle maximum.

## Running it

On GitHub Pages the app can be added to a phone's home screen and works offline (`sw.js` must sit next to `index.html`). Settings → Your data exports and imports everything as JSON.

Open `index.html` in a browser, or serve the folder with any static host (for example GitHub Pages: Settings → Pages → deploy from the `main` branch, root folder).

Two features only work when the page runs as a Claude artifact:

- **Label scan** sends bag photos to Claude to fill in the coffee details.
- **Synced history and settings** are stored privately per person in Claude.

Everywhere else Bloom works fully by hand, and history and settings are kept in that browser's local storage.

## Tests and tools

- `tests/*.test.js` are Playwright checks: Today and the shelf, a full brew through the timer, weigh-the-bag, the origin atlas, and the safety behaviours (resume after reload, back button, export/import). Run with `node tests/today.test.js index.html` (needs the `playwright` package and Chromium).
- `data/atlas.json` is the built-in origin atlas (60 regions) and `data/build-belt.js` rebuilds the coffee-belt map outline from `world-atlas`.
- `tools/finale-lab.html` is a test page for the end-of-brew animation, with every brewer side by side.

## Docs

- [`docs/wishlist.md`](docs/wishlist.md): the product build plan and what has shipped.
- [`docs/scan-testset.md`](docs/scan-testset.md): expected label-scan results for a set of real bag photos, used to check the scan prompt.
