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

## Estado em 2026-10-13

- `public/videos/valete-hero-v1.mp4` (3,2 MB) foi validado:
  - sem legenda visível em 24 quadros amostrados e nos trechos de risco (flash, fade final);
  - variação temporal na faixa tratada nunca acima da do original (sem cintilação);
  - PSNR fora da faixa: 43,3 dB.
- **Defeitos conhecidos da v1**, nos quadros ~364–391 (cena do teto):
  - listras horizontais no canto esquerdo (x < ~100) da faixa: a reprojeção grampeava em x = 0;
  - uma cruz tênue (ornamento do neon) volta à esquerda em 385–391.
- `passB.mjs` **já contém a correção** dos dois defeitos, mas ela **não foi executada nem validada**. Próximo passo: rodar os comandos acima, gerar a v2, inspecionar 364–395 em 1:1 (região x 0–240, y 560–760) e só então trocar a referência no componente.
- Resíduo aceito: em tecido com textura forte (jeans, malha), os traços preenchidos ficam um pouco mais lisos que o entorno. Em 1:1 parado dá para notar procurando; em movimento e na escala da Hero (~0,7×), não aparece.
