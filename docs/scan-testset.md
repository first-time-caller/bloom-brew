# Bag scan test set

Eight real bag photos (Oct 2026) used to check the label-scan prompt every time it changes. The photos themselves are not in this repo; the table records what the scan must return for each.

Today's date when these were taken: 10 Oct 2026. Roaster locale for all bags: UK (day/month/year dates).

| # | File | Side | Expected result |
|---|---|---|---|
| 1 | 01-unknown-back-date.jpg | Back | Roast date 28/09/26 → 2026-09-28. Weight 250 g. Nothing else: roaster, name and notes must be null (no guessing). |
| 2 | 02-latostadora-kenya-front.jpg | Front | Roaster: La Tostadora. Name: Kiangundo Farmers. Kenya. Washed. Variety SL28. Notes (script font): Lemonade, Green Apple, Jammy → Citrus for certain; green apple and jammy have no exact tag (leaving them unmapped, or Berry for jammy, is acceptable). Roast date: null (not on this side). |
| 3 | 03-ozone-hodson-front.jpg | Front | Roaster: Ozone. Name: Hodson (blend). 4 components: Nicaragua · Limoncillo · Bourbon · Natural; Brazil · Selvatech · Peaberry (grade) · Natural; Brazil · Matas de Minas · Pulped natural; Ethiopia · Chelechele · Natural. Notes in prose: brown sugar, milk chocolate, red fruit → Caramel, Chocolate, Berry. Roast date 28.09.26 → 2026-09-28. Weight 220 g. Ignore the Hard Lines bag in the background. |
| 4 | 04-hardlines-back.jpg | Back | Roaster: Hard Lines (Cardiff). Roast date sticker 28.09.26 → 2026-09-28. Use within: 3 months. Grind-size tick boxes all empty → whole bean, not a grind instruction. |
| 5 | 05-hardlines-karimikui-front.jpg | Front | Roaster: Hard Lines. Name: Karimikui AB. Kenya. Grade AB. Varieties SL28, SL34, Ruiru 11 (label "R11"), Batian. Washed (printed sideways). Notes: Blackcurrant, peaches, cocoa → Berry, Stone fruit, Chocolate. Weight 250 g. Roast date: null. |
| 6 | 06-plot-back.jpg | Back | Brand story only. Roaster may be read as Plot (plotroasting.com). Every coffee field null; app should say "No coffee details on this side". |
| 7 | 07-plot-nightcap-front.jpg | Front | Roaster: Plot. Name: Nightcap. Decaf. Colombia. El Vergel "…dor" (sticker torn: keep the partial text, do not invent the missing word). Washed. Notes: Blackberry, Hibiscus, Dark Chocolate → Berry, Floral, Chocolate. Rest 14 days. Use within 3 months. Roast date 07/01/26 → 2026-01-07 (UK day-first; show raw text). Weight 250 g. Ignore the food packet barcode. |
| 8 | 08-ozone-back.jpg | Back | Brand story and B Corp logo only. Roaster may be read as Ozone. Every coffee field null. |

## Pairs to test the two-photo scan

- Hard Lines Karimikui: 5 (front) + 4 (back) → full record with roast date 2026-09-28.
- Ozone Hodson: 3 (front) + 8 (back) → back adds nothing; must not overwrite front data.
- Plot Nightcap: 7 (front) + 6 (back) → back adds nothing.

## Things that must never happen

- A best-before / "use within" period read as the roast date.
- A date read month-first for a UK roaster, or any date in the future.
- Grades (AB, Peaberry) or places (Matas de Minas, Chelechele) listed as varieties.
- Text from background objects (other bags, food packets) in the result.
- Invented values for torn or missing text.
