---
name: Valete Barbearia — Cut and Beard
description: Barbearia de corte e barba. Identidade editorial fria construída sobre o logo monolinha, as fotos reais e o vídeo vertical da casa.
colors:
  ink: "#0A0A0A"
  carvao: "#121212"
  grafite: "#1E1E1E"
  ardosia: "#242424"
  branco: "#FFFFFF"
  cinza: "#A0A0A0"
  latao: "#C5A059"
typography:
  display:
    fontFamily: "Archivo (variável, wdth 125), ui-sans-serif, system-ui"
    fontWeight: 800
    fontStretch: "125%"
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Archivo (variável, wdth 100), ui-sans-serif, system-ui"
    fontWeight: 400
    lineHeight: 1.55
  numeric:
    fontFamily: "Archivo, tabular-nums"
    fontWeight: 500
rounded:
  pill: "9999px"
  photo: "0px"
components:
  button-primary:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.carvao}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-over-media:
    backgroundColor: "rgba(255,255,255,0.12) + backdrop-blur(12px)"
    textColor: "{colors.branco}"
    border: "1px solid rgba(255,255,255,0.28)"
    rounded: "{rounded.pill}"
---

# Design System: Valete Barbearia

O `CLAUDE.md` deste repositório ainda é o histórico técnico do Lkas Locs. Nada da identidade
do Lkas (vermelho, Unbounded, decalques de tranças, creme quente) vale aqui.

## Conceito

**Uma carta de baralho fotografada no escuro.** "Valete" é a figura do baralho, e o logo já
traz o naipe de espadas no bigode. O mundo real da marca, visto nas fotos e no vídeo, é uma
parede carvão com o script branco pintado, camisetas pretas, luz fria e pretos profundos.

- O logo monolinha é a única caligrafia do site. Nenhuma fonte imita o script.
- Fotografia e vídeo carregam a emoção. A tipografia é larga, branca e silenciosa.
- **Gesto de carta, uma vez só:** o painel do vídeo na Hero tem índice de canto (a letra V e o
  naipe recortado do próprio logo), repetido girado 180° no canto oposto, como uma figura de
  baralho. Ele não reaparece em cards, divisores nem ícones. Nada de cassino, fichas ou
  naipes espalhados.
- Removendo o logo, a página ainda deve ser reconhecível pelo vídeo vertical enquadrado como
  carta, pelas fotos frias e pelo branco sobre carvão.

## Cores

Neutros frios, sem calor, para casar com as fotos dessaturadas. O branco é a cor de ação.

| Token | Hex | Papel |
|---|---|---|
| `ink` | `#0A0A0A` | Atrás do vídeo e das fotos; fundo mais profundo |
| `carvao` | `#121212` | Fundo padrão das páginas |
| `grafite` | `#1E1E1E` | Superfícies (campos, linhas de serviço em hover, painéis) |
| `ardosia` | `#242424` | Bordas e divisores; mesmo tom do fundo do logo original |
| `branco` | `#FFFFFF` | Texto principal, logo, botão primário, foco |
| `cinza` | `#A0A0A0` | Texto secundário (7,2:1 sobre `carvao`) |
| `latao` | `#C5A059` | **Só detalhe:** o naipe do índice de carta. Nunca em texto corrido, botão ou fundo |

### Regras

- **Sem "preto + dourado premium".** O latão aparece em um ponto pequeno. Se ele começar a se
  espalhar, a peça está virando clichê.
- Texto sobre vídeo ou foto ganha véu (`ink` a 35–60%) medido no quadro mais claro.
- Os tokens legados `brand-*` do Lkas foram remapeados para estes valores, para que o
  agendamento, o painel e as páginas legais herdem a identidade sem reescrita (ver
  `src/app/globals.css`).

## Tipografia

**Archivo**, variável (pesos 100–900, larguras 62–125), licença OFL, servida pelo projeto
(`src/app/fonts/archivo-latin.woff2`). Por causa da falha da Unbounded no build da Vercel, nada
vem de `next/font/google`.

Uma família só, e a **largura faz a hierarquia**:

| Papel | Ajuste | Uso |
|---|---|---|
| Display | wdth 125, peso 800–900, entrelinha 0,9–0,95 | VA/LE/TE, títulos de seção |
| Título | wdth 112, peso 700 | Nome de serviço, títulos menores |
| Texto | wdth 100, peso 400, entrelinha 1,55 | Parágrafos, descrições |
| Números | `tabular-nums`, peso 500 | Preços, durações, horários |

Escala (px): 14 · 16 · 18 · 21 · 24 · 36 · 48 · 72, e display fluido com `clamp()`.

- Sentence case sempre. **Sem** rótulo em caixa-alta espaçada acima de títulos.
- Linhas de texto com no máximo 65 caracteres.
- CTAs sem "→" e sem ícone decorativo.

## Layout

- Container de até 1280px, margem lateral `clamp(20px, 5vw, 80px)`, grade de 12 colunas com
  gutter de 24px. Tudo alinhado à esquerda; nada centralizado por padrão.
- Ritmo vertical entre seções: 128px no desktop, 80px no mobile.

### Hero (duas versões para escolha)

```
A — VA / LE / TE
┌─────────────────────────────────────────────────────────────┐
│ logo        Serviços  O espaço  Contato        ( Agendar )  │
│ ╔══╗╔══╗                                                    │
│ ║VA║        contorno branco, vídeo                          │
│ ║LE║        só por dentro das letras        Corte e barba   │
│ ║TE║        (bloco na altura da tela)       ( Agendar )     │
│ ╚══╝╚══╝                                   logo pequeno    │
└─────────────────────────────────────────────────────────────┘

B — logo + carta
┌─────────────────────────────────────────────────────────────┐
│ logo        Serviços  O espaço  Contato        ( Agendar )  │
│                                           ┌────────────┐    │
│  [ LOGO SCRIPT GRANDE ]                   │V           │    │
│                                           │♠   vídeo   │    │
│  Corte e barba,                           │    9:16    │    │
│  com hora marcada.                        │           ♠│    │
│  ( Agendar horário )   Ver serviços       │           V│    │
│                                           └────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

- **Vídeo no desktop:** painel vertical 9:16 na altura da viewport, nunca tela cheia ampliada
  (a fonte é 720×1280; em tela cheia ampliaria 2,7× e cortaria ~70% da altura).
- **Vídeo no mobile:** pode ocupar a tela, com véu para o texto.
- A escolha entre A e B é do cliente. Até lá, `?hero=a` ou `?hero=b` alterna na home.

### Seções (só com dado real)

1. **Serviços**: lista tabular de `services` (nome, descrição, duração e preço alinhados), no
   vernáculo da tabela de preços da parede de barbearia. Não são cards. Cada linha leva a
   `/agendar?servico=<id>`. Sem serviço cadastrado, mostra um estado vazio com saída para o
   WhatsApp, se houver.
2. **Equipe**: só aparece com profissional ativo que tenha foto cadastrada.
3. **O espaço**: fotos publicadas da galeria do painel; se não houver nenhuma, as fotos reais
   versionadas em `public/fotos/`. Grade assimétrica.
4. **Contato**: horário de `business_settings`; endereço, WhatsApp e Instagram só se
   preenchidos. Fecha com o CTA de agendamento.
5. **Rodapé**: assinatura do logo, navegação e páginas legais.

Fora da home: FAQ e "Sobre" do Lkas (não há conteúdo real da Valete para eles), depoimentos,
números de clientes e "diferenciais".

## Imagem

- Fotos reais 1080×1350 (4:5), frias e dessaturadas, com o bigode da marca como marca d'água
  no centro inferior. Sem filtro extra. Recortes mantêm a marca d'água inteira ou a excluem
  por completo; nunca cortada ao meio.
- `valete-espaco-baixa-resolucao.webp` (382×510) fica só em `assets-source`: resolução baixa demais para o site.
- Vídeo: `public/videos/valete-hero-v2.mp4` (sem legenda, H.264, sem áudio) com poster
  `valete-hero-v2-poster.webp` (quadro 440: barbeiro com a tesoura e a capa com o logo).
- Logo: `public/brand/valete-logo.svg` (traçado fiel do original), `valete-logo-alpha.png`
  (alfa pela luminância, pixels do original) e `valete-spade.svg` (naipe do próprio logo).
  Gerados por `scripts/brand/process-logo.py`; nunca redesenhados à mão.

## Movimento

Framer Motion, só `transform` e `opacity`.

- **Um momento orquestrado na entrada da Hero.** Em A, o contorno das letras se desenha e o
  vídeo acende por dentro. Em B, o logo e o título entram em sequência curta.
- **No scroll:** revelação única de títulos de seção e dos números reais (preços, durações,
  horários): opacidade com deslocamento de 12px, 0,5s, uma vez. Sem stagger de cards e sem a
  mesma animação em toda seção.
- **`prefers-reduced-motion`:** a entrada da Hero não anima (CSS desligado por media query), as
  revelações no scroll perdem o deslocamento e ficam só com troca de opacidade (`MotionConfig
  reducedMotion="user"`), e o vídeo não toca sozinho: fica o poster, com botão para tocar. Em
  qualquer caso há botão de pausar o vídeo (WCAG 2.2.2).
- A entrada da Hero é CSS (`.v-enter`, `.v-fade`, `.v-draw` em `globals.css`) e não Framer Motion,
  para não ler a preferência de movimento na renderização (risco de erro de hidratação).

## Componentes

- **Botão primário:** pill branco, texto `carvao`, peso 600, 14px de altura de x confortável,
  área de toque ≥ 44px.
- **Botão sobre mídia:** translúcido (branco a 12%, blur de 12px, borda branca a 28%). Só sobre
  vídeo ou foto; em qualquer outro lugar o botão é sólido.
- **Link de texto:** sublinhado de 1px com `text-underline-offset` de 4px.
- **Foco:** contorno branco de 2px com afastamento de 3px, visível sobre `carvao` e sobre mídia.
- **Navbar:** transparente sobre a Hero; ao rolar, vira `carvao` com borda inferior `ardosia`.
  No mobile, menu em folha cheia.
- **Linha de serviço:** nome (título), descrição em `cinza`, duração e preço em números
  tabulares, alinhados à direita. Hover em `grafite`.
- **Índice de carta:** "V" em Archivo wdth 125 e o naipe em `latao`, no canto superior esquerdo
  do painel do vídeo e girado 180° no canto inferior direito.

## Do's e Don'ts

**Do:** usar fotos e vídeo reais; deixar o branco carregar a ação; mostrar só dados que existem
no banco; manter o gesto de carta em um único lugar; testar com `prefers-reduced-motion`.

**Don't:** inventar serviço, preço, horário, endereço, número ou depoimento; usar Inter ou
Manrope; usar eyebrow em caixa-alta, numeração 01/02/03 falsa ou "→" em CTA; espalhar dourado;
usar z-index negativo em ancestral de `<video>` (quebra a pintura no Chrome, ver `CLAUDE.md`).
