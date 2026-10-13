import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { ROI } from "./common.mjs";
const w = ROI.x1 - ROI.x0, h = ROI.y1 - ROI.y0, N = w * h;
const raw = fs.readFileSync("persec.bin");
const sec = (s) => new Uint16Array(raw.buffer, raw.byteOffset + s * N * 2, N);
// quantos quadros tem cada segundo (30, último parcial)
const fr = (s) => (s < 15 ? 30 : 472 - 450);
function consistent(secs, frac, minSecs) {
  const m = new Uint8Array(N);
  for (let i = 0; i < N; i++) { let k = 0; for (const s of secs) if (sec(s)[i] >= frac * fr(s)) k++; m[i] = k >= minSecs ? 1 : 0; }
  return m;
}
function dilate(m, r) {
  const o = new Uint8Array(N);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x])
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r) continue;
      const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < h && xx >= 0 && xx < w) o[yy * w + xx] = 1;
    }
  return o;
}
const MO = consistent([5, 6, 7, 8, 9, 10, 11], 0.5, 5);
const MOd = dilate(MO, 4);
let SE = consistent([2, 3], 0.5, 2); for (let i = 0; i < N; i++) if (MOd[i]) SE[i] = 0;
const SL = consistent([12, 13, 14], 0.5, 3);
const save = (name, m) => fs.writeFileSync(name, Buffer.from(m));
save("tpl_mo.bin", MO); save("tpl_se.bin", SE); save("tpl_sl.bin", SL);
// visualização: MO vermelho, SE verde, SL azul
const img = Buffer.alloc(N * 3);
for (let i = 0; i < N; i++) { img[i * 3] = MO[i] * 255; img[i * 3 + 1] = SE[i] * 255; img[i * 3 + 2] = SL[i] * 255; }
fs.writeFileSync("tpl.rgb", img);
spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", "tpl.rgb", "tpl.png"]);
const cnt = (m) => m.reduce((a, b) => a + b, 0);
console.log({ MO: cnt(MO), SE: cnt(SE), SL: cnt(SL) });
