# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primário: homens que procuram corte e barba e querem ver o trabalho e marcar horário pelo
celular ou computador. Secundário: a equipe da Valete, que usa o painel (`/admin`) para
agenda, clientes, serviços, profissionais, galeria, pagamentos e financeiro.

## Product Purpose

Site institucional + agendamento online + painel administrativo da Valete Barbearia — Cut and
Beard. O cliente escolhe serviço, profissional, data e horário a partir da disponibilidade
real e envia o pedido; o sinal via Pix manual é opcional. Sucesso = agendamentos reais
entrando pelo site, sem conflito de horário e sem precisar de conversa para marcar.

## Positioning

Barbearia de corte e barba com estética escura, fria e cuidadosa. O site deve parecer a casa:
a parede carvão com o script branco, a luz fria e o trabalho de perto. Não é uma barbearia
"vintage" de navalha e couro, nem um salão genérico.

## Operating Context

- Base técnica herdada do Lkas Locs (Next.js 16, React 19, Tailwind v4, Supabase): template
  clonado por cliente, um negócio por deployment, dados da marca em `business_settings`.
- **Ainda não existe projeto Supabase da Valete.** O `.env.local` do Lkas aponta para a
  produção de outro cliente e nunca pode ser usado aqui.
- Testes locais rodam contra um banco descartável com dados sintéticos marcados `[TESTE]`
  (ver `HANDOFF.md`).

## Capabilities and Constraints

- Agendamento: ordem serviço → profissional → data → horário → dados. Um serviço por vez.
- Disponibilidade, regras de negócio, sinal Pix e painel são herdados e **não** são reescritos
  na Fase 1.
- Vários profissionais com agenda própria; duração pode depender do tamanho do cabelo.
- Cliente não cancela pelo site; só a equipe, pelo painel.

## Brand Commitments

- Nome: **Valete Barbearia — Cut and Beard**.
- Logo: script monolinha branco "Valete" + "CUT AND BEARD" + bigode com naipe de espadas.
  Usado a partir do traçado fiel do original; nunca redesenhado.
- Cores do brief: `#0A0A0A`, `#121212`, `#1E1E1E`, `#242424`, `#FFFFFF`, `#A0A0A0`; dourado
  `#C5A059` só como detalhe.
- Decisões do cliente (2026-10-13): botões arredondados; translúcidos com blur só sobre vídeo
  ou foto; duas versões de Hero para escolha (VA/LE/TE vazado com vídeo; logo sobre vídeo com
  título e CTA); manter a ordem atual do agendamento; usar as fotos reais; motion com Framer
  Motion só em títulos e números reais.
- Feedback sobre "Lobeca" é de outro projeto: perguntar antes de aplicar.

## Evidence on Hand

- `assets-source/brand/valete-logo-original.jpg` (526×526).
- `assets-source/fotos/`: 5 fotos reais 1080×1350 do Instagram e uma foto do espaço em baixa
  resolução.
- `assets-source/video/valete-original-com-legenda.mp4` → `public/videos/valete-hero-v2.mp4`
  (legenda removida, ver `scripts/video-caption-removal/README.md`).

**Faltam (dependem do cliente):** serviços, preços, durações, profissionais, endereço,
horário de funcionamento, WhatsApp, Instagram, chave Pix e textos legais definitivos.
Enquanto não chegam, o site mostra estados vazios honestos; nada é inventado no código.

## Product Principles

1. Mostrar só o que é real. Sem dado, o espaço vira estado vazio, não texto de mentira.
2. Agendar tem que ser óbvio em qualquer tela: o CTA está sempre a um toque.
3. A marca aparece pela fotografia, pelo vídeo e pelo logo, não por ornamento.
4. Funciona sem animação: reduced motion é tratado como caminho de primeira classe.

## Accessibility & Inclusion

- Contraste AA no mínimo (texto secundário `#A0A0A0` sobre `#121212` = 7,2:1).
- Foco visível em tudo; navegação completa por teclado.
- Vídeo com botão de pausa e sem autoplay em `prefers-reduced-motion`.
- `lang="pt-BR"`, textos alternativos descritivos nas fotos.
