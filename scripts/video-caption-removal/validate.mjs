// Validação: (1) cintilação na faixa tratada vs. original, (2) fidelidade fora da faixa (PSNR).
import fs from "node:fs";
import { W, H, FS, readFrames } from "./common.mjs";
const [orig, fin] = process.argv.slice(2);
const Y0 = 590, Y1 = 740; // faixa da legenda
const load = async (f) => { const a = []; await readFrames(f, (b) => a.push(Buffer.from(b))); return a; };
const A = await load(orig), B = await load(fin);
const n = Math.min(A.length, B.length);
const tdiff = (F, t) => { let s = 0, k = 0; for (let y = Y0; y < Y1; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 3; s += Math.abs(F[t][i + 1] - F[t - 1][i + 1]); k++; } return s / k; };
let rows = ["n,orig_tdiff,final_tdiff,psnr_outside"], worst = [];
let mseSum = 0, mseK = 0;
for (let t = 1; t < n; t++) {
  let se = 0, k = 0;
  for (let y = 0; y < H; y += 3) { if (y >= 500 && y < 850) continue; for (let x = 0; x < W; x += 3) { const i = (y * W + x) * 3; for (let c = 0; c < 3; c++) { const d = A[t][i + c] - B[t][i + c]; se += d * d; k++; } } }
  const mse = se / k, psnr = 10 * Math.log10(255 * 255 / Math.max(mse, 1e-6));
  mseSum += mse; mseK++;
  const o = tdiff(A, t), f = tdiff(B, t);
  rows.push([t, o.toFixed(2), f.toFixed(2), psnr.toFixed(1)].join(","));
  worst.push([f - o, t, o, f]);
}
fs.writeFileSync("validate.csv", rows.join("\n"));
worst.sort((a, b) => b[0] - a[0]);
console.log("frames", n, "PSNR médio fora da faixa:", (10 * Math.log10(255 * 255 / (mseSum / mseK))).toFixed(2), "dB");
console.log("maiores excessos de variação temporal (final - original) na faixa:");
for (const [d, t, o, f] of worst.slice(0, 10)) console.log(` quadro ${t}: original ${o.toFixed(2)} final ${f.toFixed(2)} (+${d.toFixed(2)})`);
