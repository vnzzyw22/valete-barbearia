// Gabarito da manuscrita final: pixels brancos estáveis nos quadros já assentados (438-452).
import fs from "node:fs";
import { W, readFrames } from "./common.mjs";
const y0 = 540, y1 = 760, x0 = 60, x1 = 680, w = x1 - x0, h = y1 - y0;
const acc = new Uint8Array(w * h);
let k = 0;
await readFrames(process.argv[2], (f, n) => {
  if (n < 438 || n > 452) return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((y + y0) * W + x + x0) * 3, mn = Math.min(f[i], f[i + 1], f[i + 2]);
    let s = 0, c = 0;
    for (let dy = -5; dy <= 5; dy += 2) for (let dx = -5; dx <= 5; dx += 2) {
      const j = ((y + y0 + dy) * W + x + x0 + dx) * 3;
      s += 0.299 * f[j] + 0.587 * f[j + 1] + 0.114 * f[j + 2]; c++;
    }
    if (mn > 140 && mn - s / c > 30) acc[y * w + x]++;
  }
  k++;
});
const pts = [];
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (acc[y * w + x] >= Math.ceil(k * 0.8)) pts.push([x + x0, y + y0]);
fs.writeFileSync("tpl_sl_pts.json", JSON.stringify(pts));
console.log("SL pts", pts.length, "frames", k);
