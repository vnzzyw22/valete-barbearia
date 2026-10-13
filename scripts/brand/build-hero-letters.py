"""Gera os contornos do "VA / LE / TE" da Hero A a partir da Archivo variável do projeto.

Os caracteres viram caminhos (não <text>), para servirem de máscara do vídeo sem depender do
carregamento da fonte dentro de um SVG externo.

Saídas:
  - public/brand/hero-vale-te.svg          máscara (preenchimento branco)
  - src/components/site/hero-letters.ts    viewBox e caminho para o contorno inline

Uso (na raiz do repositório):
  pip install fonttools brotli uharfbuzz
  python3 scripts/brand/build-hero-letters.py
"""

from io import BytesIO
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "src/app/fonts/archivo-latin.woff2"
LINES = ["VA", "LE", "TE"]
VARIATIONS = {"wght": 900, "wdth": 125}
GAP = 0.10  # espaço entre linhas, em frações da altura das maiúsculas

# HarfBuzz não lê WOFF2: descompacta para TTF em memória.
tt = TTFont(FONT)
tt.flavor = None
raw = BytesIO()
tt.save(raw)
face = hb.Face(hb.Blob(raw.getvalue()))
font = hb.Font(face)
font.set_variations(VARIATIONS)
glyph_set = tt.getGlyphSet(location=VARIATIONS)
names = tt.getGlyphOrder()


def line_outline(text: str):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True})
    items = []
    x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        items.append((names[info.codepoint], x + pos.x_offset))
        x += pos.x_advance
    return items


lines = [line_outline(t) for t in LINES]


def bounds(items):
    bp = BoundsPen(glyph_set)
    for name, dx in items:
        glyph_set[name].draw(TransformPen(bp, (1, 0, 0, 1, dx, 0)))
    return bp.bounds  # xMin, yMin, xMax, yMax em unidades da fonte (y para cima)


bxs = [bounds(items) for items in lines]
cap = max(b[3] - b[1] for b in bxs)
gap = cap * GAP

pen = SVGPathPen(glyph_set)
y_top = 0.0
width = 0.0
for items, (x0, y0, x1, y1) in zip(lines, bxs):
    # alinha cada linha à esquerda pelo contorno real e empilha de cima para baixo (y para baixo no SVG)
    for name, dx in items:
        glyph_set[name].draw(TransformPen(pen, (1, 0, 0, -1, dx - x0, y_top + y1)))
    width = max(width, x1 - x0)
    y_top += (y1 - y0) + gap
height = y_top - gap

d = pen.getCommands()
vb = f"0 0 {width:.0f} {height:.0f}"
(ROOT / "public/brand/hero-vale-te.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" preserveAspectRatio="xMinYMin meet">'
    f'<path fill="#fff" d="{d}"/></svg>\n'
)
(ROOT / "src/components/site/hero-letters.ts").write_text(
    "// Gerado por scripts/brand/build-hero-letters.py — não editar à mão.\n"
    f"// Archivo variável {VARIATIONS}, linhas {LINES}.\n"
    f'export const HERO_LETTERS = {{\n  viewBox: "{vb}",\n  width: {width:.0f},\n  height: {height:.0f},\n'
    f'  d: "{d}",\n}} as const;\n'
)
print(f"VA/LE/TE: {width:.0f} x {height:.0f} (proporção {width / height:.3f}), larguras por linha:",
      [round(b[2] - b[0]) for b in bxs])
