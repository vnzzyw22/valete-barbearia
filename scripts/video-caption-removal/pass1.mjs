import fs from "node:fs";
import { ROI, readFrames, textScore } from "./common.mjs";
const w = ROI.x1 - ROI.x0, h = ROI.y1 - ROI.y0;
const perSec = []; // acumuladores por segundo
const stats = [];
await readFrames(process.argv[2], (f, n) => {
  const s = textScore(f), sec = Math.floor(n / 30);
  perSec[sec] ??= new Uint16Array(w * h);
  let c1 = 0, c2 = 0, c3 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = s[y * w + x] > 40;
    if (v) { perSec[sec][y * w + x]++; const ay = y + ROI.y0; if (ay >= 615 && ay <= 662) c1++; else if (ay > 662) c2++; else c3++; }
  }
  stats.push([n, c1, c2, c3].join(","));
});
fs.writeFileSync(process.argv[3] + "/stats.csv", "n,makingoff_band,low_band,high_band\n" + stats.join("\n"));
fs.writeFileSync(process.argv[3] + "/persec.bin", Buffer.concat(perSec.map((a) => Buffer.from(a.buffer))));
console.log("frames", stats.length, "secs", perSec.length);
