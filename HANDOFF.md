# Valete Barbearia — passagem de sessão (Fase 1 interrompida em 2026-10-13)

Este repositório é a **Valete Barbearia — Cut and Beard**, cópia independente do Lkas Locs.
O `CLAUDE.md` ainda descreve o Lkas: vale como histórico técnico (arquitetura, lições de bugs), **não** como identidade visual.

## Repositórios

- `origin` = `github.com/vnzzyw22/valete-barbearia`, branch `main`. É aqui que se trabalha.
- O Lkas original (`vnzzyw22/Lkas---Locs`) **não pode ser alterado**. Na máquina do usuário ele está como `upstream`, com push desabilitado.
- O commit base do Lkas é `1173853`. Tudo depois dele é Valete.

## Feito até aqui

1. Auditoria completa do código (ver "Arquitetura herdada").
2. Inventário de skills: `frontend-design`, `impeccable`, `quality-gate-visual`, `ui-ux-pro-max`, `design-system`, `ui-styling`, `web-design-guidelines`, `taste`.
   - `taste` não se aplica: o brief não tem URL de referência.
   - Os scripts da `ui-ux-pro-max` exigem Python, ausente na máquina do usuário; foram usados só os CSVs e o checklist.
3. **Vídeo da Hero sem legenda**: `public/videos/valete-hero-v1.mp4`, com defeitos conhecidos em ~364–391. A correção já está no script, mas não foi rodada. Detalhes, comandos e validação em `scripts/video-caption-removal/README.md`.
4. Materiais da Valete versionados em `assets-source/`:
   - `video/valete-original-com-legenda.mp4`: original, nunca sobrescrever.
   - `brand/valete-logo-original.jpg`: 526×526, script branco monolinha sobre carvão (~#232323), sem alfa. "Valete" + "CUT AND BEARD" + bigode com **naipe de espadas** (♠).
   - `fotos/`: 5 fotos reais 1080×1350 do Instagram (tratamento frio, dessaturado, pretos profundos, bigode da marca como marca d'água no centro inferior) e `valete-espaco-baixa-resolucao.webp` (382×510; só serve pequena).

**Nada do frontend da Valete foi implementado ainda.** O site renderiza o visual do Lkas.

## Decisões do usuário (2026-10-13)

- **Botões:** arredondados. Translúcidos/blur **só** onde ficam sobre vídeo ou foto (função: legibilidade); sólidos no resto. Decisão delegada ao Claude.
- **Hero:** montar **duas versões** e mostrar screenshots antes de escolher:
  - (a) "VA / LE / TE" em três linhas, só contorno branco, com o vídeo aparecendo por dentro das letras;
  - (b) o logo original (script) em destaque sobre o vídeo, com headline curta e CTA.
- **Agendamento:** manter a ordem atual (serviço → tamanho, se houver → profissional → data → horário → dados). Sem seleção de vários serviços.
- **Usar as fotos reais** ao longo do site.
- **Motion com Framer Motion** no scroll: títulos e números. Números só se forem reais (preço, horário); **nada** de estatística inventada.
- Mensagens sobre "Lobeca" são de outro projeto. Não aplicar ideias de outra marca sem confirmar.

## Bloqueios

1. **Não existe projeto Supabase da Valete.** O `.env.local` do Lkas aponta para a **produção do Lkas** e não pode ser usado aqui. Criar o projeto exige o usuário logado no Supabase/Vercel.
   - As migrations semeiam dados do Lkas: `seed.sql` (serviços de tranças, endereço de Maringá), `20260831…`/`20260901140000…` (fotos do Lkas) e `20260926…` (profissionais Lucas/Crespo/Vênus; Lucas `…a001` é o padrão do trigger `appointments_default_professional`).
   - Num banco novo da Valete, isso precisa de seed próprio. Desenhar antes de aplicar, sem migration destrutiva.
2. **Faltam dados reais da Valete:** serviços, preços, profissionais, endereço, horários, WhatsApp, Instagram. O site lê tudo do banco; não inventar nada no código. Para testar visualmente, usar banco **local e descartável** com dados sintéticos marcados como teste (nunca commitar como seed real).

## Ambiente de teste sugerido (sem tocar produção nenhuma)

- Postgres local + PostgREST + um gateway Node mínimo que mapeia `/rest/v1/*` para o PostgREST. Esse foi o método do Lkas (ver `CLAUDE.md`, seção "Sinal via Pix manual > Testes").
- Bootstrap SQL com:
  - roles `anon`/`authenticated`/`service_role`/`authenticator`;
  - schema `auth` com `auth.uid()`/`auth.role()`/`auth.jwt()` lendo `request.jwt.claims`;
  - schema `storage` com `buckets`/`objects` (exigido pela migration da galeria).
- `NEXT_PUBLIC_SUPABASE_URL` = gateway local; `NEXT_PUBLIC_SUPABASE_ANON_KEY` = JWT `role: anon` assinado com o segredo do PostgREST local.
- Playwright: o MCP pode não conectar. `npx playwright` com Chromium funciona. Validar reveals com scroll real, não com screenshot `fullPage` (ver lição no `CLAUDE.md`).

## Arquitetura herdada (preservar)

- Next 16.3.3: `src/proxy.ts`, não middleware. Ler `node_modules/next/dist/docs/` antes de mexer em convenções.
- React 19, Tailwind v4 (tokens em `src/app/globals.css`), `framer-motion` 13 e `gsap` 3 já instalados, npm.
- Leituras públicas em `src/lib/supabase/queries.ts`; painel em `admin-queries.ts`. Disponibilidade em `src/lib/scheduling.ts`. Sinal Pix em `src/lib/deposit.ts` e `/agendar/pagamento/[id]`.
- Wizard de agendamento: `src/components/booking/booking-form.tsx`. **Não reescrever regras de negócio.**
- Textos do Lkas no código, a adaptar ou remover na Valete (25 arquivos; `grep -rli "lkas\|locs\|tranç\|twist\|maringá" src`):
  - metadata e OG: `layout.tsx`, `opengraph-image.tsx`;
  - páginas legais: `politica-de-privacidade`, `termos-de-uso`;
  - home: `about-section`, `faq-*` (perguntas do Lkas: não reaproveitar), `hero*`, `navbar`, `footer`, `rotating-seal`, `services-section`, `gallery-carousel`;
  - `lib/whatsapp.ts` (mensagem "Tamo junto" do Lkas), `lib/hair-length.ts` e o login do admin.
- Mídia do Lkas em `public/imagens/` e `public/videos/lkas-hero-mobile.mp4`: não é da Valete. Remover só quando nada mais referenciar.

## Direção de arte: notas de pesquisa (ainda não registradas em DESIGN.md)

- **Conceito da marca:** "valete" é a carta do baralho (Jack), e o logo já traz o naipe de espadas no bigode. Há um vocabulário próprio e não genérico aqui: índice de canto de carta, simetria rotacional das figuras, proporção de carta. Usar **com contenção**, em um único lugar memorável, nunca como tema de cassino.
- **Paleta do brief:** `#0A0A0A` / `#121212` / `#1E1E1E` / `#242424` / `#FFFFFF` / `#A0A0A0`, dourado `#C5A059` só pontual.
  - O logo é branco puro sobre ~#232323 e não tem dourado.
  - As fotos são frias e dessaturadas: os neutros devem ser frios/neutros, não quentes.
  - Evitar o clichê "preto + dourado premium" (lista do CLAUDE.md global).
- **Vídeo vertical 9:16, 720 p.** No desktop, **não** usar em tela cheia (ampliaria 2,7× e cortaria ~70% da altura). Tratar como painel vertical na altura da viewport (~506×900 a 900 px de altura, abaixo da resolução nativa, nítido), dentro de uma composição editorial assimétrica. No mobile, pode ocupar a tela.
  - O vídeo termina com fade para escuro: bom ponto de loop.
  - Gerar `poster` (WebP) a partir de um quadro forte para o LCP.
- **Logo:** gerar versão com alfa a partir da luminância (branco sobre escuro → máscara), sem redesenhar, como `scripts/process-decals.mjs` fez no Lkas. Variante branca para fundos escuros.
- **Tipografia:** ainda não escolhida.
  - Hoje o Lkas carrega Unbounded, Sora, Montserrat, Manrope e JetBrains Mono (`layout.tsx`): trocar por um sistema de 1 ou 2 famílias escolhido para a Valete.
  - Nada de Inter/Manrope automático.
  - Unbounded falhou no build da Vercel via `next/font/google` e foi servida localmente: lembrar disso para qualquer fonte nova.
- **Seções:** só com dado real. Prováveis: Hero, Serviços (do banco), Equipe (tabela `professionals`: foto e nome reais, se houver), Ambiente/fotos, Localização/horário (se confirmados), CTA, Rodapé. Sem depoimentos, estatísticas ou "diferenciais" inventados. Sem o FAQ do Lkas.

## Próximos passos (ordem)

1. `git pull`; ler este arquivo, o `CLAUDE.md` global do usuário (fluxo de design obrigatório), `scripts/video-caption-removal/README.md` e as skills aplicáveis.
2. Vídeo: rodar o passo B corrigido, gerar `valete-hero-v2.mp4` e validar 364–395 em 1:1. Se estiver bom, a v2 substitui a v1 (remover a v1 do repo depois de trocar a referência). Gerar o poster.
3. Montar o ambiente de banco local descartável e rodar `npm run build` + `next start` contra ele.
4. Registrar a direção de arte em `DESIGN.md` (substituindo a do Lkas) e em `PRODUCT.md`.
5. Tokens → navbar → Hero (as duas versões, com screenshots para o usuário) → seções → rodapé → metadata/OG/textos legais da Valete.
6. Ciclo do `CLAUDE.md` global:
   - renderizar desktop (1366/1440/1920) e intermediário (768/1024);
   - checar console, overflow e `prefers-reduced-motion`;
   - `impeccable` (crítica), `web-design-guidelines` (auditoria), corrigir, `quality-gate-visual`.
7. Commit claro, push no `main` sem force, conferir o commit no GitHub, atualizar este arquivo.

Fase 2 (outra sessão): experiência móvel do agendamento e validação funcional. Não reconstruir o painel admin nesta fase.
