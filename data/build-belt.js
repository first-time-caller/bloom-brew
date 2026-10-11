// Builds /home/claude/p6/belt.svg.txt from world-atlas land-110m, equirectangular,
// cropped to 35N..35S, x=(lon+180)*2, y=(35-lat)*2  -> viewBox 0 0 720 140
const fs = require('fs');
const topojson = require('topojson-client');
const topo = require('world-atlas/land-110m.json');
const land = topojson.feature(topo, topo.objects.land);

const LAT_MAX = 35, LAT_MIN = -35;
const KEEP_BOXES = [ // [lonMin, lonMax, latMin, latMax] small islands to keep regardless of size
  [-161, -154, 18, 23],   // Hawaii
  [119.5, 122.5, 21.5, 25.5], // Taiwan
  [114, 128, -11, -7.5],  // Bali, Lombok, Sumbawa, Flores, Timor
  [140, 156, -12, 0],     // New Guinea + Bismarck
  [79, 82.5, 5.5, 10],    // Sri Lanka
  [-79, -76, 17.5, 18.8], // Jamaica
  [-67.5, -65, 17.5, 18.8], // Puerto Rico
];
const MIN_EXTENT = 0.3; // degrees

// Sutherland-Hodgman clip of a ring against a horizontal band
function clipRing(ring, lo, hi) {
  const clipHalf = (pts, inside, intersect) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
      const ci = inside(cur), pi = inside(prev);
      if (ci) { if (!pi) out.push(intersect(prev, cur)); out.push(cur); }
      else if (pi) out.push(intersect(prev, cur));
    }
    return out;
  };
  const ix = (lat) => (a, b) => { const t = (lat - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), lat]; };
  let r = clipHalf(ring, p => p[1] <= hi, ix(hi));
  if (r.length) r = clipHalf(r, p => p[1] >= lo, ix(lo));
  return r;
}

function extent(ring) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
}
function inKeepBox(e) {
  return KEEP_BOXES.some(([a, b, c, d]) => e.x0 >= a - 0.5 && e.x1 <= b + 0.5 && e.y0 >= c - 0.5 && e.y1 <= d + 0.5);
}

const proj = ([lon, lat]) => [((lon + 180) * 2), ((LAT_MAX - lat) * 2)];
const r1 = v => Math.round(v * 10) / 10;

let paths = [];
let kept = 0, dropped = 0;
const feats = land.type === 'FeatureCollection' ? land.features : [land];
const polys = [];
for (const f of feats) {
  if (f.geometry.type === 'MultiPolygon') polys.push(...f.geometry.coordinates);
  else if (f.geometry.type === 'Polygon') polys.push(f.geometry.coordinates);
}
for (const poly of polys) {
  for (let k = 0; k < poly.length; k++) {
    const ring = poly[k];
    const e0 = extent(ring);
    if (e0.y1 < LAT_MIN || e0.y0 > LAT_MAX) continue;
    if (e0.w > 180 && e0.h < 20) { dropped++; continue; } // antimeridian-straddling ring (Fiji) draws a line across the map
    if (k === 0) {
      // outer ring: drop small islands unless in keep boxes
      if (Math.max(e0.w, e0.h) < MIN_EXTENT && !inKeepBox(e0)) { dropped++; continue; }
      // drop tiny islands under 0.6 deg too, unless kept, to save bytes
      if (Math.max(e0.w, e0.h) < 0.6 && !inKeepBox(e0)) { dropped++; continue; }
    }
    const clipped = clipRing(ring, LAT_MIN, LAT_MAX);
    if (clipped.length < 3) continue;
    const e1 = extent(clipped);
    if (Math.max(e1.w, e1.h) < MIN_EXTENT && !inKeepBox(e1)) { dropped++; continue; }
    // project, round, dedupe consecutive points
    let pts = clipped.map(proj).map(([x, y]) => [r1(x), r1(y)]);
    pts = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
    if (pts.length < 3) continue;
    // relative path encoding
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const dx = r1(pts[i][0] - pts[i - 1][0]), dy = r1(pts[i][1] - pts[i - 1][1]);
      if (dx === 0) d += `v${dy}`; else if (dy === 0) d += `h${dx}`; else d += `l${dx} ${dy}`;
    }
    d += 'z';
    paths.push(d);
    kept++;
  }
}
const out = paths.join('');
fs.writeFileSync('/home/claude/p6/belt.svg.txt', out);
console.log('rings kept', kept, 'dropped', dropped, 'bytes', Buffer.byteLength(out));
