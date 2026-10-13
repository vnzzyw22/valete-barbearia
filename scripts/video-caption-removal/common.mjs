import { spawn } from "node:child_process";
export const W = 720, H = 1280, FS = W * H * 3;
// ROI que contém todas as camadas de legenda (medido nos quadros)
export const ROI = { x0: 90, x1: 650, y0: 580, y1: 785 };
export function readFrames(file, onFrame) {
  return new Promise((res, rej) => {
    const p = spawn("ffmpeg", ["-v", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
    let buf = Buffer.alloc(0), n = 0, chunks = [], len = 0;
    p.stdout.on("data", (d) => {
      chunks.push(d); len += d.length;
      if (len >= FS) {
        buf = Buffer.concat([buf, ...chunks]); chunks = []; len = 0;
        while (buf.length >= FS) { onFrame(buf.subarray(0, FS), n++); buf = buf.subarray(FS); }
        len = buf.length; if (len) { chunks = [Buffer.from(buf)]; buf = Buffer.alloc(0); }
      }
    });
    p.stderr.on("data", (d) => process.stderr.write(d));
    p.on("close", (c) => (c === 0 ? res(n) : rej(new Error("ffmpeg " + c))));
  });
}
// "brancura" local: min(R,G,B) menos a média local (caixa 15x15) da luminância
export function textScore(f) {
  const { x0, x1, y0, y1 } = ROI, w = x1 - x0, h = y1 - y0;
  const mn = new Float32Array(w * h), lum = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((y + y0) * W + (x + x0)) * 3, r = f[i], g = f[i + 1], b = f[i + 2];
    mn[y * w + x] = Math.min(r, g, b); lum[y * w + x] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  // integral image da luminância
  const ii = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) { s += lum[y * w + x]; ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + s; } }
  const R = 7, out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ya = Math.max(0, y - R), yb = Math.min(h, y + R + 1), xa = Math.max(0, x - R), xb = Math.min(w, x + R + 1);
    const s = ii[yb * (w + 1) + xb] - ii[ya * (w + 1) + xb] - ii[yb * (w + 1) + xa] + ii[ya * (w + 1) + xa];
    const mean = s / ((yb - ya) * (xb - xa));
    out[y * w + x] = mn[y * w + x] > 150 ? mn[y * w + x] - mean : 0;
  }
  return out;
}
