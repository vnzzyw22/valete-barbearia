// Passo B: entrada em neon da manuscrita final (quadros 364-391, cena do teto em push-in).
// O brilho é largo demais pra preenchimento local; aqui a faixa do texto é reconstruída a
// partir de um quadro vizinho já limpo (REF), reprojetado por escala+translação estimadas
// em faixas próximas (mesma profundidade) e com ganho/offset por canal casados.
import fs from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { W, H, FS, readFrames } from "./common.mjs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split("=")));
const SRC = args.src, OUT = args.out, MODE = args.mode ?? "full";
const SAMPLE = (args.frames ?? "").split(",").filter(Boolean).map(Number);
const REF = 392, T0 = 364, T1 = 391, FADE0 = 385; // de 385 a 391 a reprojeção sai em rampa
const BY0 = 588, BY1 = 732, FEATHER = 16; // faixa substituída (com transição suave)
const CX = W / 2, CY = 660;

// quadro de referência
const ref = spawnSync("ffmpeg", ["-v", "error", "-i", SRC, "-vf", `select=eq(n\\,${REF})`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: FS * 2 }).stdout;
if (ref.length !== FS) throw new Error("ref " + ref.length);

const lum = (f, x, y) => { const i = (y * W + x) * 3; return 0.299 * f[i] + 0.587 * f[i + 1] + 0.114 * f[i + 2]; };
function bilinear(f, x, y, c) {
  if (x < 0) x = 0; if (y < 0) y = 0; if (x > W - 1.001) x = W - 1.001; if (y > H - 1.001) y = H - 1.001;
  const x0 = Math.floor(x), y0 = Math.floor(y), ax = x - x0, ay = y - y0, i = (y0 * W + x0) * 3 + c;
  return (f[i] * (1 - ax) + f[i + 3] * ax) * (1 - ay) + (f[i + W * 3] * (1 - ax) + f[i + W * 3 + 3] * ax) * ay;
}
// ponto do quadro t -> ponto em REF (t é mais "aberto": REF = t ampliado em torno do centro)
const toRef = (T, x, y) => [CX + (x - CX) / T.s - T.tx, CY + (y - CY) / T.s - T.ty];

// faixas de estimativa: logo acima e logo abaixo do texto (a parede/espelhos e o chão próximo)
const EST = [];
for (let y = 470; y < 550; y += 3) for (let x = 20; x < W - 20; x += 3) EST.push([x, y]);
for (let y = 775; y < 860; y += 3) for (let x = 20; x < W - 20; x += 3) EST.push([x, y]);
function ncc(f, T) {
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
  for (const [x, y] of EST) {
    const a = lum(f, x, y), [rx, ry] = toRef(T, x, y);
    const b = 0.299 * bilinear(ref, rx, ry, 0) + 0.587 * bilinear(ref, rx, ry, 1) + 0.114 * bilinear(ref, rx, ry, 2);
    sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++;
  }
  const cov = sab / n - (sa / n) * (sb / n), va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
  return cov / Math.sqrt(va * vb + 1e-6);
}
function estimate(f, prev) {
  let best = { s: prev?.s ?? 0.97, tx: prev?.tx ?? 0, ty: prev?.ty ?? 0, c: -2 };
  best.c = ncc(f, best);
  // busca local em torno do quadro anterior (movimento de câmera é contínuo)
  for (const [ds, dt] of [[0.01, 2], [0.004, 1], [0.0015, 0.5]]) {
    let improved = true;
    while (improved) {
      improved = false;
      for (const [a, b, c] of [[ds, 0, 0], [-ds, 0, 0], [0, dt, 0], [0, -dt, 0], [0, 0, dt], [0, 0, -dt]]) {
        const T = { s: best.s + a, tx: best.tx + b, ty: best.ty + c }, v = ncc(f, T);
        if (v > best.c + 1e-5) { best = { ...T, c: v }; improved = true; }
      }
    }
  }
  return best;
}
const bandAlpha = (y) => {
  if (y < BY0 - FEATHER || y > BY1 + FEATHER) return 0;
  if (y < BY0) return (y - (BY0 - FEATHER)) / FEATHER;
  if (y > BY1) return ((BY1 + FEATHER) - y) / FEATHER;
  return 1;
};
function apply(f, T, n) {
  const out = Buffer.from(f);
    // Topo da faixa mais alto nos primeiros quadros: o neon entra com um brilho em estrela
  // por cima do teto. Depois disso a faixa fica justa pra não cruzar o topo dos espelhos.
  const top = n <= 369 ? 520 : BY0;
  const alpha = (y) => {
    if (y < top - FEATHER || y > BY1 + FEATHER) return 0;
    if (y < top) return (y - (top - FEATHER)) / FEATHER;
    if (y > BY1) return (BY1 + FEATHER - y) / FEATHER;
    return 1;
  };
  // ganho global por canal + offset por bloco horizontal (a luz varia da esquerda pra direita),
  // estimados em faixas logo acima e logo abaixo da região substituída
  const rows = [top - FEATHER - 26, top - FEATHER - 12, BY1 + FEATHER + 12, BY1 + FEATHER + 26];
  const BW = 90, NB = Math.ceil(W / BW), gain = [], offs = [];
  for (let c = 0; c < 3; c++) {
    let sa = 0, sb = 0, sbb = 0, sab = 0, k = 0;
    const bs = new Float64Array(NB), bk = new Float64Array(NB);
    for (const y of rows) for (let x = 4; x < W - 4; x += 2) {
      const va = f[(y * W + x) * 3 + c], [rx, ry] = toRef(T, x, y), vb = bilinear(ref, rx, ry, c);
      sa += va; sb += vb; sbb += vb * vb; sab += va * vb; k++;
    }
    const g = Math.max(0.5, Math.min(2.5, (sab / k - (sa / k) * (sb / k)) / (sbb / k - (sb / k) ** 2 + 1e-6)));
    for (const y of rows) for (let x = 4; x < W - 4; x += 2) {
      const va = f[(y * W + x) * 3 + c], [rx, ry] = toRef(T, x, y), vb = bilinear(ref, rx, ry, c);
      const j = Math.min(NB - 1, Math.floor(x / BW)); bs[j] += va - g * vb; bk[j]++;
    }
    gain.push(g); offs.push(Array.from(bs, (v, j) => v / bk[j]));
  }
  const offAt = (c, x) => {
    const p = x / BW - 0.5, j = Math.max(0, Math.min(NB - 2, Math.floor(p))), t = Math.max(0, Math.min(1, p - j));
    return offs[c][j] * (1 - t) + offs[c][j + 1] * t;
  };
  // sem rampa: em 391 a transformação já é ~identidade e 392 é a própria REF
  const ramp = 1;
  for (let y = top - FEATHER; y <= BY1 + FEATHER; y++) {
    const al = alpha(y) * ramp;
    if (al <= 0) continue;
    for (let x = 0; x < W; x++) {
      const [rx, ry] = toRef(T, x, y), i = (y * W + x) * 3;
      // fora da REF (a câmera mostra uma faixa que a REF não tem): volta pro passo A, com transição
      const edge = Math.min(rx, W - 1 - rx, ry, H - 1 - ry);
      const cov = Math.max(0, Math.min(1, (edge - 2) / 14));
      const a = al * cov;
      if (a <= 0) continue;
      for (let c = 0; c < 3; c++) {
        const v = gain[c] * bilinear(ref, rx, ry, c) + offAt(c, x);
        out[i + c] = Math.max(0, Math.min(255, Math.round(a * v + (1 - a) * f[i + c])));
      }
    }
  }
  return out;
}

let enc = null;
if (MODE === "full") {
  enc = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", "30", "-i", "-",
    "-c:v", "libx264rgb", "-preset", "veryfast", "-qp", "0", "-an", OUT]);
  enc.stderr.on("data", (d) => process.stderr.write(d));
}
// estima de trás pra frente seria mais estável (REF é o fim), mas a busca local com o
// quadro anterior como chute já converge; registra pra conferência
const log = [];
let prev = null;
// pré-passo: estimativas na ordem reversa (391 -> 364), partindo da identidade
const est = new Map();
{
  const frames = new Map();
  await readFrames(SRC, (f, n) => { if (n >= T0 && n <= T1) frames.set(n, Buffer.from(f)); });
  prev = { s: 1, tx: 0, ty: 0 };
  for (let n = T1; n >= T0; n--) { const T = estimate(frames.get(n), prev); est.set(n, T); prev = T; log.push(`${n},${T.s.toFixed(4)},${T.tx.toFixed(2)},${T.ty.toFixed(2)},${T.c.toFixed(4)}`); }
  fs.writeFileSync("log_passB.csv", "n,s,tx,ty,ncc\n" + log.reverse().join("\n"));
}
await readFrames(SRC, (f, n) => {
  const inWin = n >= T0 && n <= T1;
  if (MODE === "sample") {
    if (!SAMPLE.includes(n)) return;
    const o = inWin ? apply(f, est.get(n), n) : f;
    const crop = (b) => b.subarray(480 * W * 3, 880 * W * 3);
    fs.writeFileSync(`b_${n}.rgb`, Buffer.concat([crop(f), crop(o)]));
    spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x800`, "-i", `b_${n}.rgb`, `b_${n}.png`]);
    fs.unlinkSync(`b_${n}.rgb`);
    return;
  }
  enc.stdin.write(inWin ? apply(f, est.get(n), n) : Buffer.from(f));
});
if (enc) { enc.stdin.end(); await new Promise((r) => enc.on("close", r)); }
console.log("ok");
