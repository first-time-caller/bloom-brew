# Bloom Brew: product build wishlist

Everything identified so far (Oct 2026), grouped into build passes. ✅ = decided, 🅿️ = parked.

## Pass 1: Bag scan and richer coffee data ✅ shipped 10 Oct 2026

**Label scan**
- "Scan bag label" takes a front photo, then offers "Add the back for the roast date". Both go to Claude in one call.
- Runs on the quick model tier (fastest, uses the least of the viewer's Claude usage). A "Read more carefully" button retries on the default tier only when confidence is low or the roast date is missing.
- Results fill the coffee screen for review: filled fields highlighted, unsure ones left blank and flagged.
- Reads only the bag in the foreground; ignores other bags and packets in the photo.
- A side with only brand text returns nothing ("No coffee details on this side").
- Never invents torn or missing text.

**Dates**
- Day-first for UK/European roasters or a UK phone region; never a future date; the label's raw text shown next to the parsed date.
- Best-before and "use within" are stored separately, never used as the roast date.

**Coffee details**
- Roaster and coffee/blend name (history titles and search use these).
- Blends as a list of components, each with country, region/farm/producer/washing station, varieties and process.
- Any variety accepted as free text; matching Bloom's list only affects how the recipe treats it. Abbreviations expanded (R11 → Ruiru 11).
- Grade (AB, AA, Peaberry) kept separate from variety.
- Extended processes: washed, natural, honey, pulped natural, anaerobic, yeast-inoculated, co-fermented, plus a decaf flag.
- Altitude.
- Flavour notes stored twice: the label's exact words and the mapped Bloom tags.
- Roast level, marked "inferred" when the bag doesn't state it.
- Roaster's advice: rest days ("rest for 14 days") and use-within window.
- Bag weight.

**Test set**: 8 real bag photos with expected results (see `scan-testset.md`), run whenever the scan prompt changes. First run on the fast model matched the expected results for Hard Lines, Plot and La Tostadora; Ozone's blend place names needed an app-side fix.

**Also shipped**: the cup size screen shows millilitres beside grams ("About 350 ml · a large mug"), and the recipe's Cup line shows both.

## Pass 2: Settings, Pro mode, gear and water ✅ shipped 10 Oct 2026

**Shipped:** Settings screen (header button) with a Simple/Pro switch and units. Grinders: name, setting type (clicks, dial numbers, microns), usual filter setting; Pro adds step size and "higher number grinds finer". The recipe screen has grinder + setting pickers and suggests your last setting for the same coffee and method. Grind tips name a setting ("On your C4S, try 20 clicks"). Brewers: Hario Switch, Origami and Clever Dripper added; choose which brewers appear. Water profiles: tap, filtered, bottled, mineral recipe; Pro adds a mineral table (Ca, Mg, HCO₃, Na) that works out GH and KH, or GH/KH typed directly. Kettle maximum temperature (Pro) caps recipes. Each brew records grinder, setting and water, and Brew again restores them. Settings are saved privately per person.

**Still to do from this pass:** Pulsar, Orea, B75, Fellow Aiden, Mugen, Tsubame, Gabi, V60 sizes; a dilution step for brew-strong-then-dilute methods; editing an existing grinder or water (remove and re-add for now).

The full Simple/Pro split planned across all passes:

**Settings page with a Pro switch.** Simple stays the default, a fast weekday workflow. Pro reveals the configuration enthusiasts use. The r/pourover threads back this split: most people keep it simple day to day and tinker when they have time.

| Simple (default) | Pro reveals |
|---|---|
| Label scan, brewer, cup size | Several grinders, any units (clicks, dial numbers, microns), step size |
| Bloom's recipe, or a named recipe | Per-pour editor: amounts, bloom size and time, pour rate (g/s), swirl/agitation, temperature per pour |
| Guided timer | Water recipes and dilution; bypass/dilution after brewing |
| 4-button taste with one tip, rating | Extended taste words: astringent, chalky, herbal, mouthfeel (thin to syrupy), intensity |
| "As it cools" note, would buy again | Filter type (including flat-bottom, low-bypass), drawdown target override |
| Brew again | Freezer queue, compare view, harvest year, blend percentages, cost per cup, "suspected infused" flag |
| Rest status in plain words (resting, ready, getting old) | Raw age numbers and rest windows |
| Iced toggle | Max kettle temperature (e.g. at altitude) |


- **Grinders**: add your own (e.g. DF54, Timemore Chestnut C4S) with setting type (clicks or numbered dial). Each brew records grinder + setting; grind tips become specific ("try 20 clicks").
- **Brewers**: add Hario Switch (needs its own immersion/pour steps), Origami, Gabi, V60 sizes 01/02, alongside Kalita, Chemex, AeroPress, French press.
- **Water profiles**: picked per brew and saved in history.
  - Tap (e.g. London tap, hard).
  - Bottled water with its mineral table (calcium, magnesium, bicarbonate, sodium, TDS); Bloom works out GH and KH.
  - Mineral recipes (e.g. Third Wave Water, Lotus drops) or custom GH/KH.
  - Idea: scan a bottled water label with the same scan feature.

- **More brewers from the threads**: Pulsar, Orea, B75, Fellow Aiden, Clever, Mugen, Tsubame. Some brew strong and dilute after (ORB, fine-ground AeroPress), so the engine needs a dilution step.

## Pass 3: Tasting, reviews and history ✅ shipped 10 Oct 2026

**Shipped:** after brewing, "What you tasted" (flavour tags plus your own words) shown beside the roaster's notes, with a comparison rather than a score; "As it cooled" note; "Would you buy it again?" (yes, maybe, no); the grind setting you used, editable after the brew; "Copy as review" in the r/pourover weekly-thread format, from the after-brew screen and from any history entry; history shows tasting notes and buy-again; "Bought from" field; history search covers source and tasting notes. Header: "bloom" is now bold text that goes back to the start (asks first mid-brew); the logo is the page favicon. The grinder and setting moved up the recipe screen, and the grind shows on the timer screen.

## Next: bags, shelf and a Today screen (proposed 10 Oct)

- **Bags as the main object**: a shelf of open bags with details, roast date and grams left. Picking a coffee from the shelf asks only "same bag, or a new bag?"; a new bag asks just the roast date. Brews link to their bag.
- **Today screen on open**: the current bag ready to brew, with today's recipe already adjusted from the last cup ("yesterday was sour, so 2 clicks finer") and one Brew button; quick swaps for bag, brewer and cup size; a nudge to rate yesterday's cup; the rest of the shelf in plain words (resting, ready, past best-within, brews left); "New bag" opens the scan.
- **One screen for repeat brews**; keep the step-by-step flow for new bags.
- **Bottom navigation**: Today, Shelf, History; Settings moves into Today.

## Pass 3 (original plan)

- **What I tasted**: your own flavour tags and free text, shown beside the roaster's notes.
- **Would buy again** flag.
- **Copy as review**: a bag's details, roaster's notes, what you tasted, recipe and gear, and recommendation, formatted for r/pourover's Weekly Bean Review Thread.
- History titled "Roaster · Name", searchable by roaster, name and origin.

- **"As it cools"**: an optional note; many reviewers say the cup changes, often for the better, as it cools.
- **Subscription or source** field (Trade, SEY, Kurasu and the like, or a bag split with friends).

## Pass 4: Recipes and bag ageing ✅ shipped 10 Oct 2026

**Shipped (built by three parallel builders, then merged and independently reviewed):**
- Engine: rest-friendly age bands (4–45 days ready, 46–75 older but good, 76+ fading); cooler water for co-ferments, anaerobic and similar processes, naturals and decaf; altitude adjustment (+1 °C at 1,900 m+, −1 °C below 1,200 m); water-hardness notes; drawdown advice that treats fast-draining coffees as normal and uses agitation, temperature and ratio as well as grind; iced mode (60% hot water, 40% ice).
- Recipe editor: "Adjust recipe" (temperature, ratio, bloom for everyone; per-pour grams, step times, add/remove pours, agitation and pour speed in Pro); recipe picker with "Save as my recipe" and starting points based on Tetsu Kasuya's 4:6, James Hoffmann's Ultimate V60 and his AeroPress method; roaster's recipe field (also read by the label scan).
- Bag ageing: opened, frozen, out-of-freezer and rest-until dates; freezer days don't count towards age; plain-word status that matches the recipe engine; History "By coffee" view with a rating vs days-off-roast chart; dial-in hint on the recipe screen.
- Review fixes: iced water after recipe changes, ice reminder handling, iced ratio in reviews, dial-in hint per brewer, saved recipes syncing, review days-off-roast uses freezer-adjusted age.

**Moved to the shelf/Today work:** drink-next queue and freezer backlog, beans remaining, new-bag dial-in flow as its own screen.

## Pass 4 (original plan)

- **Editable recipe**: pour amounts, bloom length, temperature; technique note (agitation, pour speed). Saved with the brew.
- **Brew again**: reloads a brew's recipe, grinder + setting, water and yield, with roast age updated to today.
- **Bag timeline**: ratings plotted against days off roast, to show when each coffee peaked.
- **Rest until** date (from the roaster's advice or your own).
- **Frozen on** date (optional): freezer days don't count towards roast age. Threads also report "opened on" separately, so add an **opened on** date.
- **Drink-next queue / freezer backlog**: about a dozen reviewers freeze coffee; one tracks 28 bags with rest-until dates in a spreadsheet.
- **Named recipe library**: Hoffmann V60, 4:6, Tetsu, April, Lance 3-pour, Switch hybrids; plus a **"roaster's recipe"** field for the recipe printed on the card or website.
- **Iced mode**: split the water into ice and hot water.
- **New-bag dial-in flow**: a starting grind, a suggested step size, and what changed last time. The most common loop in the threads is "brew again, change one thing".
- **Engine review** (the threads contradict several defaults):
  - Age: Bloom calls beans "past peak" after 3 weeks and "fading" after 5. Reviewers routinely rest light roasts and co-ferments 4–8 weeks and still enjoy some at 3 months.
  - Temperature: co-ferments, very soluble and extra-light coffees are often brewed cooler (85–91 °C); "lighter roast means hotter water" doesn't always hold, so process should count.
  - Drawdown: co-ferments and Wush Wush drain fast by nature. "Fast drawdown, grind finer" is wrong for them; agitation, temperature and ratio are used as levers as often as grind.
  - Roast level is relative between roasters; keep it user-overridable.
  - Big batches don't scale linearly; flag brews far from 15–30 g.
  - Treat "what I tasted vs roaster's notes" as a comparison, never a score.
- **Future recipe inputs**: process, altitude and water hardness (data captured from passes 1–2).

## Later

- **Barcode / QR memory**: after a bag is confirmed, its barcode maps to its details (everything except roast date) so the next bag of that coffee fills instantly with no Claude call. Could become a shared database built from everyone's confirmed scans.
- **Beans remaining**: bag weight minus doses brewed.

## Considered and rejected 🅿️

- Barcode databases (Open Food Facts, UPCitemdb): supermarket-focused, no variety or roast date, most specialty roasters missing.
- On-device OCR (Tesseract.js): free but poor on curved, stylised bags, and can't map notes onto tags.
