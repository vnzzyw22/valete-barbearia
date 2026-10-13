# Remoção da legenda do vídeo da Hero

Fonte: `assets-source/video/valete-original-com-legenda.mp4` (720×1280, 9:16, 30 fps, 472 quadros, 15,8 s, H.264 + AAC).
O original nunca é alterado. A saída vai para `public/videos/`.

## O que há na legenda

| Camada | Gabarito | Quadros | Comportamento |
|---|---|---|---|
| "Making Off" (sans) | `tpl_mo.bin` | 0–364 | fixa; entra digitada (0–44); some no flash amarelo (~355–364) |
| "A magia acontece aqui" baixa (manuscrita) | `tpl_se.bin` | 28–134 | entra deslizando (~45), depois fixa |
| "A magia acontece aqui" alta (manuscrita) | `tpl_sl_pts.json` | 362–471 | entra como neon grande com brilho (364–385), encolhe e assenta (385+) |

O "VALETE" inclinado (quadros ~90–110 e ~300–340) é grafismo da edição, com recorte atrás da pessoa. **Não** é legenda e foi mantido.

## Método

1. **Passo A (`process.mjs`)**: em cada quadro, registra o gabarito da camada (escala + translação, com preferência pela identidade) contra o mapa de "texto branco". Cada letra é ativada separadamente, o que cobre a digitação. A máscara é dilatada 3 px e preenchida por interpolação harmônica (Laplace) com grão de baixa frequência estimado por MAD. Camadas estáticas ficam inteiras até o fim da janela, para cobrir fades sobre fundo claro. A saída é sem perdas (`libx264rgb -qp 0`).
2. **Passo B (`passB.mjs`)**: na entrada em neon (364–391), o brilho é largo demais para preenchimento local. A faixa y 588–732 (520–732 até o quadro 369) é reconstruída com o quadro 392 já limpo, reprojetado. A escala e a translação são estimadas por NCC em faixas logo acima e abaixo do texto, com ganho por canal e offset por bloco horizontal de 90 px.
3. **Codificação**: H.264 High, CRF 19, yuv420p, `+faststart`, sem áudio.

Gabaritos já versionados. Só é preciso regenerar (`pass1.mjs` → `template.mjs`, `sl_tpl.mjs`) se mudar a ROI.

## Comandos (Node 20+ e ffmpeg no PATH; rodar nesta pasta)

```bash
SRC=../../assets-source/video/valete-original-com-legenda.mp4
node process.mjs src=$SRC mode=full out=/tmp/passA.mkv          # ~3 min, ~210 MB (não versionar)
node passB.mjs src=/tmp/passA.mkv mode=full out=/tmp/passB.mkv   # ~1 min
ffmpeg -y -i /tmp/passB.mkv -c:v libx264 -preset veryslow -crf 19 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an ../../public/videos/valete-hero-v2.mp4
node --max-old-space-size=6000 validate.mjs $SRC ../../public/videos/valete-hero-v2.mp4
```

Amostras para inspeção visual: `node process.mjs src=$SRC mode=sample frames=20,75,200,358` e
`node passB.mjs src=/tmp/passA.mkv mode=sample frames=366,372,380,388`. Os PNGs (`s_N.png`, `b_N.png`) mostram original em cima e resultado embaixo.

## Estado em 2026-10-13 (v2 publicada)

- **`public/videos/valete-hero-v2.mp4`** (3,3 MB, 720×1280, 30 fps, 472 quadros, 15,7 s, H.264
  High, CRF 19, yuv420p, `+faststart`, sem áudio) substitui a v1, que saiu do repositório.
  Poster: `public/videos/valete-hero-v2-poster.webp` (quadro 440, 36 KB).
- **O que mudou no passo B:** a correção da borda esquerda que estava no script (voltar para o
  passo A onde o quadro 392 não cobre) trazia de volta o "A m" do neon na coluna x < ~110 em
  366–382, pior que a v1. Agora essa coluna usa uma **segunda referência** (quadro 365, o último
  antes de o neon chegar à borda; a câmera aproxima, então ele enxerga a coluna que o 392 já
  perdeu), com o mesmo ajuste de escala/translação por NCC e o mesmo ganho/offset por bloco. Até
  4 px além da borda da segunda referência usa a borda repetida, para não sobrar um filete de
  2–3 px do neon em x ≈ 0. A calibração de ganho/offset passou a ignorar amostras fora da
  referência.
- **Validação da v2** (`validate.mjs`): PSNR fora da faixa 43,30 dB (igual à v1). Os maiores
  excessos de variação temporal são os mesmos da v1 (quadro 71 com +3,1, por exemplo); a v2
  melhora o 365 (+1,1 contra +1,45) e soma +1,4 a +1,6 em 388–389, na rampa de saída da
  reprojeção, que é movimento real de câmera nesse trecho.
- **Inspeção 1:1** (x 0–240, y 560–760, quadros 364–395, v1 lado a lado com v2, e borda x 0–60
  ampliada 2×): sem as listras da v1 em 364–371, sem a cruz da v1 em 385–391 e sem neon. O
  "salto" do pilar entre 391 e 392 existe igual no original (a câmera acelera ali). Doze
  momentos do vídeo inteiro conferidos contra o original: nenhuma legenda; o grafismo "VALETE"
  e o logo na capa do cliente preservados.
- **Resíduo aceito (o mesmo da v1, vem do passo A):** em tecido com textura forte (jeans, malha
  da camisa), os traços preenchidos ficam um pouco mais lisos que o entorno. Visível a 1:1 com
  o vídeo parado; em movimento e na escala da Hero, não aparece.
