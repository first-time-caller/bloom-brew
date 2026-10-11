# atlas.json sources

Harvest windows and altitude bands in `atlas.json` were drafted from general knowledge of specialty green-coffee offer sheets and then checked against the pages below (fetched 2026-10-11). Where sources disagreed (they often do by a month or two) the band in the JSON is the overlap of the detailed country sections, not the widest claim. Coordinates are approximate centroids of the named growing area, placed by hand; they are for a world-scale map, not for navigation.

## Harvest calendars (multi-origin)
- https://www.greenplantation.com/a/calendar-of-coffee-picking-seasons — per-country harvest months (Africa, Central/South America, Asia)
- https://achillescoffeeroasters.com/blogs/specialty-coffee-blog/coffee-harvest-seasons-around-the-world-when-major-origins-pick-process-and-ship-coffee — per-origin harvest months incl. Tarrazú, Flores, PNG, India, Kenya fly crop
- https://coffeehunter.com/coffee-seasonality — South America seasonality

## Single-origin checks
- China / Yunnan: https://sucafina.com/na/origins/china (harvest Dec–Mar, 800–1,800 m, Catimor/Caturra/Typica/SL34, >90% washed)
- Myanmar / Ywangan: https://www.thewaytocoffee.com/beans/ywangan/ (1,100–1,500 m, Dec–Mar, Catuaí/S795, natural)
- Hawaii / Kona: https://konacoffee.com/kona-coffee/coffee-harvest-season/ (harvest Aug–Dec, extended to Jan by late passes)
- Thailand: https://library.sweetmarias.com/coffee-producing-countries/indonesia-se-asia/thailand-coffee-overview/ (arabica provinces; 800–1,200 m typical, higher at Doi Chaang)
- Yemen / Haraz: https://archerscoffee.com/products/yemen-masar-village-west-haraz (up to ~2,200 m, Yemeni varieties, natural)
- Bolivia / Caranavi: https://coffeehunter.com/coffee/caranavi-la-paz/ (Apr–Aug harvest, 1,400–1,600 m, Caturra/Typica/Catuaí, washed)
- Ecuador / Loja: https://www.algrano.com/origins/ecuador (main harvest Apr–Sep, Loja/Zamora Chinchipe/Pichincha, Typica/Bourbon/Caturra/Sidra)
- DR Congo / Kivu: https://www.thewaytocoffee.com/beans/dr-congo-lake-kivu-sopacdi-cooperative/ (1,460–2,000 m, Mar–Jun, Bourbon, washed)
- Vietnam / Da Lat: https://dalat.app/en/blog/guides/da-lat-coffee-culture-best-cafes-highland-bean-tours-2026 (Dec–Feb harvest, ~1,500 m, Typica/Bourbon/Catimor)
- Taiwan / Alishan: https://farmdirectory.cupofexcellence.org/?p=17872 and https://paradiseroasters.com/products/taiwan-alishan-sl34-natural (varieties, elevation context)
- Bali / Kintamani: https://oilslickcoffee.com/production/desa-ulian-kintamani-bali/ and https://peets.com/blogs/peets/bali-kintamani-julys-limited-release-coffee
- Flores / Bajawa: https://royalcoffee.com/?p=151751

## Geometry
- `belt.svg.txt` is derived from `world-atlas` 2.0.2 `land-110m.json` (Natural Earth 1:110m land), via `topojson-client` 3.1.0; see `geo/build-belt.js`.

## Known uncertainties
- Kenya: only the main (Oct–Jan) crop is in `harvest`; the fly crop (May–Jul) is in `harvestNote`.
- Colombia: `harvest` lists both main and mitaca months for Huila, Tolima, Cauca and Antioquia; Nariño is a single crop.
- Sumatra: `harvest` includes both Gayo crops (Sep–Dec and Mar–May); Lintong peaks later than Gayo.
- Uganda: the entry centres on Mt Elgon (Oct–Feb); Rwenzori picks mostly Apr–Jul.
- Tanzania: north (Kilimanjaro/Arusha) and south (Mbeya/Mbinga) overlap only partly; Jun–Oct is the shared window.
- Altitude bands are "where specialty lots usually come from", not the full range of commercial farms.
