// Remoção da legenda: registro de gabarito por quadro + preenchimento harmônico com grão.
import fs from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { W, H, ROI, readFrames } from "./common.mjs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split("=")));
const SRC = args.src, MODE = args.mode ?? "sample";
const SAMPLE = (args.frames ?? "").split(",").filter(Boolean).map(Number);
const DIL = Number(args.dil ?? 3), GRAIN = Number(args.grain ?? 0.6);

// ROI estendida (a manuscrita final entra grande e sai da ROI original)
const E = { x0: 0, x1: W, y0: 500, y1: 850 };
const ew = E.x1 - E.x0, eh = E.y1 - E.y0;

// ---------- gabaritos (coordenadas absolutas do quadro) ----------
const tw = ROI.x1 - ROI.x0, th = ROI.y1 - ROI.y0;
function loadTpl(file) {
  const m = fs.readFileSync(file), pts = [];
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (m[y * tw + x]) pts.push([x + ROI.x0, y + ROI.y0]);
  return pts;
}
// componentes 8-conexas com fusão por proximidade (2px): ~uma por letra
function components(pts) {
  const key = (x, y) => y * W + x, set = new Map(pts.map((p, i) => [key(p[0], p[1]), i]));
  const lab = new Int32Array(pts.length).fill(-1);
  let L = 0;
  for (let i = 0; i < pts.length; i++) {
    if (lab[i] >= 0) continue;
    const st = [i]; lab[i] = L;
    while (st.length) {
      const j = st.pop(), [x, y] = pts[j];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const k = set.get(key(x + dx, y + dy));
        if (k !== undefined && lab[k] < 0) { lab[k] = L; st.push(k); }
      }
    }
    L++;
  }
  return { lab, n: L };
}
function makeLayer(name, pts, range) {
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  return { name, pts, range, cx: cx / pts.length, cy: cy / pts.length, ...components(pts) };
}

// ---------- mapa de "texto branco": min(RGB) alto e acima da média local ----------
function scoreMap(f) {
  const N = ew * eh, lum = new Float32Array(N), mn = new Float32Array(N);
  for (let y = 0; y < eh; y++) for (let x = 0; x < ew; x++) {
    const i = ((y + E.y0) * W + x + E.x0) * 3, r = f[i], g = f[i + 1], b = f[i + 2];
    mn[y * ew + x] = Math.min(r, g, b); lum[y * ew + x] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const ii = new Float64Array((ew + 1) * (eh + 1));
  for (let y = 0; y < eh; y++) {
    let s = 0;
    for (let x = 0; x < ew; x++) { s += lum[y * ew + x]; ii[(y + 1) * (ew + 1) + x + 1] = ii[y * (ew + 1) + x + 1] + s; }
  }
  const R = 7, B = new Uint8Array(N);
  for (let y = 0; y < eh; y++) for (let x = 0; x < ew; x++) {
    const ya = Math.max(0, y - R), yb = Math.min(eh, y + R + 1), xa = Math.max(0, x - R), xb = Math.min(ew, x + R + 1);
    const mean = (ii[yb * (ew + 1) + xb] - ii[ya * (ew + 1) + xb] - ii[yb * (ew + 1) + xa] + ii[ya * (ew + 1) + xa]) / ((yb - ya) * (xb - xa));
    B[y * ew + x] = mn[y * ew + x] > 120 && mn[y * ew + x] - mean > 22 ? 1 : 0;
  }
  // tolerância de 1px no registro
  const Bd = new Uint8Array(N);
  for (let y = 1; y < eh - 1; y++) for (let x = 1; x < ew - 1; x++) {
    let o = 0;
    for (let dy = -1; dy <= 1 && !o; dy++) for (let dx = -1; dx <= 1; dx++) if (B[(y + dy) * ew + x + dx]) { o = 1; break; }
    Bd[y * ew + x] = o;
  }
  return Bd;
}
const tf = (L, T, x, y) => [Math.round(L.cx + T.s * (x - L.cx) + T.tx) - E.x0, Math.round(L.cy + T.s * (y - L.cy) + T.ty) - E.y0];
function hits(L, Bm, T, step = 1) {
  let h = 0, n = 0;
  for (let i = 0; i < L.pts.length; i += step) {
    const [x, y] = tf(L, T, L.pts[i][0], L.pts[i][1]); n++;
    if (x >= 0 && x < ew && y >= 0 && y < eh && Bm[y * ew + x]) h++;
  }
  return h / n;
}
function register(L, Bm) {
  const ident = { s: 1, tx: 0, ty: 0 };
  const id = hits(L, Bm, ident);
  if (id > 0.75) return { ...ident, f: id };
  let best = { ...ident, f: id };
  for (let s = 0.8; s <= 2.0001; s += 0.05) for (let tx = -60; tx <= 60; tx += 5) for (let ty = -60; ty <= 60; ty += 5) {
    const T = { s, tx, ty }, f = hits(L, Bm, T, 4);
    if (f > best.f) best = { ...T, f };
  }
  const c = { ...best };
  for (let s = c.s - 0.05; s <= c.s + 0.05; s += 0.01) for (let tx = c.tx - 5; tx <= c.tx + 5; tx++) for (let ty = c.ty - 5; ty <= c.ty + 5; ty++) {
    const T = { s, tx, ty }, f = hits(L, Bm, T, 2);
    if (f > best.f) best = { ...T, f };
  }
  // só aceita sair da identidade se o ganho for claro (evita registro em ruído)
  if (best.f < id + 0.08) return { ...ident, f: id };
  return best;
}
function compFractions(L, Bm, T) {
  const hit = new Float32Array(L.n), tot = new Float32Array(L.n);
  for (let i = 0; i < L.pts.length; i++) {
    const [x, y] = tf(L, T, L.pts[i][0], L.pts[i][1]);
    tot[L.lab[i]]++;
    if (x >= 0 && x < ew && y >= 0 && y < eh && Bm[y * ew + x]) hit[L.lab[i]]++;
  }
  return Array.from(hit, (h, k) => (tot[k] >= 6 ? h / tot[k] : 0));
}

// ---------- máscara ----------
function buildMask(entries) {
  const M = new Uint8Array(ew * eh);
  for (const { L, T, act } of entries) {
    const r = Math.max(DIL, Math.round(DIL * T.s)), k = Math.ceil(T.s);
    for (let i = 0; i < L.pts.length; i++) {
      if (!act[L.lab[i]]) continue;
      for (let oy = 0; oy < k; oy++) for (let ox = 0; ox < k; ox++) {
        const [X, Y] = tf(L, T, L.pts[i][0] + ox / k, L.pts[i][1] + oy / k);
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + 1) continue;
          const xx = X + dx, yy = Y + dy;
          if (xx >= 1 && xx < ew - 1 && yy >= 1 && yy < eh - 1) M[yy * ew + xx] = 1;
        }
      }
    }
  }
  return M;
}

// ---------- preenchimento ----------
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) * 1.414; };
function fill(f, M) {
  const out = Buffer.from(f), N = ew * eh, idx = [];
  for (let i = 0; i < N; i++) if (M[i]) idx.push(i);
  if (!idx.length) return out;
  const px = (i) => ((Math.floor(i / ew) + E.y0) * W + (i % ew) + E.x0) * 3;
  const val = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const p = px(i); val[i * 3] = f[p]; val[i * 3 + 1] = f[p + 1]; val[i * 3 + 2] = f[p + 2]; }
  // casca de cebola (de fora pra dentro) como chute inicial
  const known = new Uint8Array(N);
  for (let i = 0; i < N; i++) known[i] = M[i] ? 0 : 1;
  const nb = [-1, 1, -ew, ew, -ew - 1, -ew + 1, ew - 1, ew + 1];
  let pending = idx;
  while (pending.length) {
    const next = [], set = [];
    for (const i of pending) {
      let r = 0, g = 0, b = 0, c = 0;
      for (const o of nb) { const j = i + o; if (known[j]) { r += val[j * 3]; g += val[j * 3 + 1]; b += val[j * 3 + 2]; c++; } }
      if (c) set.push([i, r / c, g / c, b / c]); else next.push(i);
    }
    if (!set.length) break;
    for (const [i, r, g, b] of set) { val[i * 3] = r; val[i * 3 + 1] = g; val[i * 3 + 2] = b; known[i] = 1; }
    pending = next;
  }
  // Laplace (Gauss-Seidel) com a borda fixa = interpolação harmônica
  for (let it = 0; it < 80; it++) for (const i of idx) for (let c = 0; c < 3; c++)
    val[i * 3 + c] = 0.25 * (val[(i - 1) * 3 + c] + val[(i + 1) * 3 + c] + val[(i - ew) * 3 + c] + val[(i + ew) * 3 + c]);
  // grão casado: desvio do resíduo de alta frequência numa faixa em volta da máscara
  // Estimador robusto (MAD): bordas de alto contraste perto do texto não inflam o grão.
  const hps = [];
  for (let y = 10; y < eh - 10; y += 2) for (let x = 10; x < ew - 10; x += 2) {
    const i = y * ew + x;
    if (M[i]) continue;
    let near = false;
    for (let d = 1; d <= 9 && !near; d += 4) if (M[i - d] || M[i + d] || M[i - d * ew] || M[i + d * ew]) near = true;
    if (!near) continue;
    const Lm = (j) => val[j * 3 + 1];
    hps.push(Math.abs(Lm(i) - 0.25 * (Lm(i - 1) + Lm(i + 1) + Lm(i - ew) + Lm(i + ew))));
  }
  hps.sort((a, b) => a - b);
  const sd = hps.length ? hps[hps.length >> 1] * 1.4826 * GRAIN : 0;
  // ruído de baixa frequência (caixa 3x3 sobre ruído branco, renormalizado):
  // o grão do vídeo comprimido é "mole", ruído por pixel vira chuvisco
  const noise = new Float32Array(N);
  for (const i of idx) for (const o of [0, -1, 1, -ew, ew, -ew - 1, -ew + 1, ew - 1, ew + 1]) if (!noise[i + o]) noise[i + o] = gauss();
  for (const i of idx) {
    let s = 0;
    for (const o of [0, -1, 1, -ew, ew, -ew - 1, -ew + 1, ew - 1, ew + 1]) s += noise[i + o];
    const g = (s / 3) * sd, p = px(i);
    for (let c = 0; c < 3; c++) out[p + c] = Math.max(0, Math.min(255, Math.round(val[i * 3 + c] + g)));
  }
  return out;
}

// ---------- main ----------
const layers = [
  makeLayer("MO", loadTpl("tpl_mo.bin"), [0, 364]),
  makeLayer("SE", loadTpl("tpl_se.bin"), [28, 134]),
  makeLayer("SL", JSON.parse(fs.readFileSync("tpl_sl_pts.json")), [362, 471]),
];
let enc = null;
if (MODE === "full") {
  enc = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", "30", "-i", "-",
    "-c:v", "libx264rgb", "-preset", "veryfast", "-qp", "0", "-an", args.out]);
  enc.stderr.on("data", (d) => process.stderr.write(d));
}
const log = [], lastActive = {}, HOLD = Number(args.hold ?? 5);
// No modo full, os quadros ficam num atraso de HOLD pra estender a máscara também pra trás
// (cobre o começo de fade-in, quando o texto ainda está fraco demais pra ser detectado).
const queue = [];
const flush = (force) => {
  while (queue.length && (force || queue.length > HOLD)) {
    const q = queue.shift();
    const M = buildMask(q.entries);
    const o = fill(q.f, M);
    if (MODE === "full") { if (!enc.stdin.write(o)) {/* backpressure tratado pelo buffer do Node */} }
    else {
      const crop = (buf) => { const c = Buffer.alloc(ew * eh * 3); for (let y = 0; y < eh; y++) buf.copy(c, y * ew * 3, (y + E.y0) * W * 3, ((y + E.y0) * W + W) * 3); return c; };
      fs.writeFileSync(`s_${q.n}.rgb`, Buffer.concat([crop(q.f), crop(o)]));
      spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${ew}x${eh * 2}`, "-i", `s_${q.n}.rgb`, `s_${q.n}.png`]);
      fs.unlinkSync(`s_${q.n}.rgb`);
    }
  }
};
await readFrames(SRC, (f, n) => {
  if (MODE === "sample" && !SAMPLE.includes(n)) return;
  const Bm = scoreMap(f), entries = [];
  for (const L of layers) {
    if (n < L.range[0] || n > L.range[1]) continue;
    let T = register(L, Bm);
    const fr = compFractions(L, Bm, T);
    let act = fr.map((v) => v > 0.3);
    // Camadas estáticas (MO/SE): depois de aparecerem inteiras, ficam inteiras até o fim da
    // janela — fade sobre fundo claro (flash amarelo) some do detector mas ainda é visível.
    if (L.name !== "SL") {
      if (act.every(Boolean) && T.f > 0.5) { L.full = true; L.goodT = T; }
      if (L.full) { act = act.map(() => true); if (T.f < 0.5) T = { ...L.goodT, f: T.f }; }
    }
    const on = act.some(Boolean) && T.f > 0.08;
    if (on) {
      entries.push({ L, T, act });
      // estende pra trás: quadros na fila que não tinham esta camada ganham a mesma máscara
      if (MODE === "full") for (const q of queue) if (n - q.n <= HOLD && !q.entries.some((e) => e.L === L)) q.entries.push({ L, T, act });
      lastActive[L.name] = { n, T, act };
    } else if (lastActive[L.name] && n - lastActive[L.name].n <= HOLD) {
      entries.push({ L, T: lastActive[L.name].T, act: lastActive[L.name].act });
    }
    log.push([n, L.name, T.f.toFixed(2), T.s.toFixed(2), T.tx, T.ty, `${act.filter(Boolean).length}/${act.length}`, on ? 1 : 0].join(","));
  }
  queue.push({ n, f: Buffer.from(f), entries });
  flush(MODE !== "full");
});
flush(true);
if (enc) { enc.stdin.end(); await new Promise((r) => enc.on("close", r)); }
fs.writeFileSync(`log_${MODE}.csv`, "n,layer,f,s,tx,ty,comps,on\n" + log.join("\n"));
console.log("ok");
