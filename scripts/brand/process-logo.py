"""Gera os assets do logo da Valete a partir do original, sem redesenhar.

Entrada: assets-source/brand/valete-logo-original.jpg (526x526, branco sobre carvão ~#232323).
Saídas em public/brand/:
  - valete-logo-alpha.png  branco puro com alfa = luminância normalizada (pixels exatos do original)
  - valete-logo.svg        traçado vetorial do mesmo limiar (potrace), para exibição grande e nítida
  - valete-spade.svg       só o naipe de espadas do logo (para o índice de carta)

Uso (na raiz do repositório):
  pip install potracer pillow numpy
  python3 scripts/brand/process-logo.py
"""

from pathlib import Path

import numpy as np
import potrace
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-source/brand/valete-logo-original.jpg"
OUT = ROOT / "public/brand"
UPSCALE = 4  # traça em 4x para curvas suaves; coordenadas voltam à escala original

OUT.mkdir(parents=True, exist_ok=True)
gray = np.asarray(Image.open(SRC).convert("L")).astype(np.float64)
size = gray.shape[0]

# 1) Alfa pela luminância: fundo (~33) vira 0, branco (255) vira 255.
bg = np.median(gray[:20, :20])
alpha = np.clip((gray - bg) / (255.0 - bg), 0, 1)
rgba = np.zeros((size, size, 4), dtype=np.uint8)
rgba[..., :3] = 255
rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)
Image.fromarray(rgba, "RGBA").save(OUT / "valete-logo-alpha.png", optimize=True)

# 2) Traçado vetorial do mesmo desenho.
big = np.asarray(
    Image.fromarray(gray.astype(np.uint8)).resize((size * UPSCALE, size * UPSCALE), Image.LANCZOS)
).astype(np.float64)
mid = (bg + 255) / 2
bitmap = potrace.Bitmap(big <= mid)  # potracer preenche o lado False: o traço branco fica como forma
curves = bitmap.trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2)


def fmt(v: float) -> str:
    return f"{v / UPSCALE:.2f}".rstrip("0").rstrip(".")


def curve_to_d(curve) -> str:
    p = curve.start_point
    d = [f"M{fmt(p.x)},{fmt(p.y)}"]
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f"L{fmt(seg.c.x)},{fmt(seg.c.y)}L{fmt(seg.end_point.x)},{fmt(seg.end_point.y)}")
        else:
            d.append(
                f"C{fmt(seg.c1.x)},{fmt(seg.c1.y)} {fmt(seg.c2.x)},{fmt(seg.c2.y)} "
                f"{fmt(seg.end_point.x)},{fmt(seg.end_point.y)}"
            )
    return "".join(d) + "Z"


def bbox(curve):
    pts = [curve.start_point] + [s.end_point for s in curve.segments]
    xs = [q.x / UPSCALE for q in pts]
    ys = [q.y / UPSCALE for q in pts]
    return min(xs), min(ys), max(xs), max(ys)


paths = [curve_to_d(c) for c in curves]
# O traçado inclui a moldura externa (o quadrado inteiro); ela é a única curva com bbox ~ quadro todo.
full = [i for i, c in enumerate(curves) if (lambda b: b[2] - b[0] > size * 0.98)(bbox(c))]
body = "".join(p for i, p in enumerate(paths) if i not in full)

# Recorte apertado do desenho (sem a margem do quadro original).
boxes = [bbox(c) for i, c in enumerate(curves) if i not in full]
x0 = min(b[0] for b in boxes) - 2
y0 = min(b[1] for b in boxes) - 2
x1 = max(b[2] for b in boxes) + 2
y1 = max(b[3] for b in boxes) + 2
vb = f"{x0:.1f} {y0:.1f} {x1 - x0:.1f} {y1 - y0:.1f}"
(OUT / "valete-logo.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Valete Cut and Beard">'
    f'<path fill="currentColor" fill-rule="evenodd" d="{body}"/></svg>\n'
)

# 3) Naipe de espadas: a forma pequena centrada logo abaixo do bigode.
cands = []
for i, c in enumerate(curves):
    if i in full:
        continue
    bx = bbox(c)
    w, h = bx[2] - bx[0], bx[3] - bx[1]
    cx = (bx[0] + bx[2]) / 2
    if 8 < w < 40 and 8 < h < 40 and abs(cx - size * 0.47) < 30 and bx[1] > size * 0.6:
        cands.append((bx[1], i, bx))
if not cands:
    raise SystemExit("naipe não encontrado — revisar o critério de seleção")
_, si, sb = max(cands)  # o mais baixo é o naipe
sx0, sy0, sx1, sy1 = sb
(OUT / "valete-spade.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{sx0 - 0.5:.1f} {sy0 - 0.5:.1f} {sx1 - sx0 + 1:.1f} {sy1 - sy0 + 1:.1f}" aria-hidden="true">'
    f'<path fill="currentColor" d="{paths[si]}"/></svg>\n'
)
print(f"logo: {len(paths) - len(full)} formas, viewBox {vb}; naipe bbox {[round(v, 1) for v in sb]}")
