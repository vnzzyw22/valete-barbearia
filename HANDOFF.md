# Valete Barbearia — passagem de sessão (Fase 1, 2026-10-13, sessão na nuvem)

Este repositório é a **Valete Barbearia — Cut and Beard**, cópia independente do Lkas Locs.
O `CLAUDE.md` ainda descreve o Lkas: vale como histórico técnico (arquitetura, lições de bugs),
**não** como identidade visual. A identidade da Valete está em `DESIGN.md` e `PRODUCT.md`.

## Repositórios

- `origin` = `github.com/vnzzyw22/valete-barbearia`, branch `main`. É aqui que se trabalha.
- O Lkas original (`vnzzyw22/Lkas---Locs`) **não pode ser alterado**. Na máquina do usuário ele
  está como `upstream`, com push desabilitado.
- O commit base do Lkas é `1173853`. Tudo depois dele é Valete.

## Estado atual

A Fase 1 tem o site público com a identidade da Valete implementado e revisado contra um banco
local descartável. **Pendente do cliente: escolher a Hero A ou B.**

### Feito nesta sessão

1. **Vídeo v2** (`public/videos/valete-hero-v2.mp4` + poster WebP). Os dois defeitos da v1 em
   364–391 foram corrigidos e a v1 saiu do repositório. A primeira execução do passo B como
   estava no script trazia de volta o neon na borda esquerda; o passo B foi ajustado e
   revalidado. Ver `scripts/video-caption-removal/README.md`.
2. **Logo** sem redesenho (`scripts/brand/process-logo.py`):
   - `public/brand/valete-logo.svg`: traçado fiel;
   - `public/brand/valete-logo-alpha.png`: alfa pela luminância;
   - `public/brand/valete-spade.svg`: naipe do próprio logo.
   O favicon (`src/app/icon.png`) é o naipe.
3. **Direção de arte** em `DESIGN.md` e `PRODUCT.md` (substituíram os do Lkas):
   - conceito "carta de baralho fotografada no escuro";
   - neutros frios e branco como ação; latão só no naipe do índice de carta;
   - Archivo variável servida pelo projeto, em que a largura faz a hierarquia.
4. **Site público:**
   - tokens novos em `globals.css`; os tokens legados `brand-*` foram remapeados e `brand-red`
     virou `accent` (branco), para o agendamento e o painel herdarem a identidade;
   - navbar, duas Heros, Serviços (lista tabular do banco), Equipe (só com foto cadastrada),
     O espaço (galeria do painel ou, sem ela, as fotos reais de `public/fotos/`), Contato
     (horário e contatos do banco, só o que existir) e rodapé;
   - FAQ, Sobre, decalques, selo e galeria do Lkas removidos, junto com `public/imagens/`, o
     vídeo do Lkas e `scripts/process-decals.mjs`.
5. **Textos do Lkas trocados:**
   - metadata e OG;
   - páginas legais (continuam placeholder honesto);
   - login e cabeçalho do painel;
   - mensagem do WhatsApp do agendamento;
   - rótulo "Tamanho do cabelo";
   - placeholder de Instagram nas configurações.
   Regras de negócio, disponibilidade, sinal Pix e painel **não** foram reescritos.
6. **Skills nesta sessão (nuvem):** usadas `frontend-design` e `codemakers-design` (inclusive o
   `contrast_check.py` para a paleta). `impeccable`, `ui-ux-pro-max`, `quality-gate-visual`,
   `web-design-guidelines` e `taste` **não estão instaladas aqui** e não foram usadas; a revisão
   visual foi feita com screenshots do Playwright. Vale rodar a crítica `impeccable` e o
   `quality-gate-visual` no desktop.
7. **Banco de teste versionado** em `scripts/local-db/`: `up.sh` sobe Postgres, PostgREST e um
   gateway falso do Supabase, com as migrations reais e dados `[TESTE]`. Ver o README da pasta.

### Hero: duas versões para o cliente escolher

- `/?hero=a` mostra VA / LE / TE: contorno branco, vídeo dentro das letras, logo pequeno como
  assinatura.
- `/?hero=b` mostra o logo grande, o título "Corte e barba, com hora marcada." e o CTA, com o
  vídeo num painel vertical enquadrado como carta.
- O padrão é **B** (`DEFAULT_HERO` em `src/app/page.tsx`). Depois da escolha, apagar a outra
  função em `src/components/site/hero.tsx` e o parâmetro `?hero`.
  - Se a escolhida for a A: apagar só o componente `CardIndex` de `card-index.tsx` (`Spade` e
    `ValeteLogo` continuam em uso). O gesto de carta só existe na B.
  - Se for a B: apagar `hero-letters.ts`, `public/brand/hero-vale-te.svg` e
    `scripts/brand/build-hero-letters.py`.

## Verificação feita (2026-10-13)

Tudo contra `next build` + `next start`, com o banco local de `scripts/local-db/`:

- **Larguras:** Playwright avulso em 1366, 1440, 1920, 1024 e 768 px, nas duas Heros.
  - Zero erro ou aviso de console, zero resposta 4xx/5xx, nenhum elemento fora da viewport.
  - Revelações conferidas com rolagem real pela roda do mouse: nada ficou com opacidade < 1.
- **Movimento reduzido:** vídeo parado no poster, botão "Tocar", sem erro.
- **Vídeo:** o Chromium do Playwright não tem H.264. O caminho do vídeo (máscara nas letras,
  autoplay, pausar/tocar) foi testado servindo uma cópia VP9 só no teste. **O MP4 em si não foi
  visto tocando num Chrome ou Safari real nesta sessão.**
- **`/agendar` até o fim:** serviço vindo da home → profissional → data → horário → dados →
  "Agendamento enviado!", com o registro conferido no banco (pendente, profissional certo).
- **Fumaça:**
  - login do painel com o admin de teste e dashboard;
  - páginas legais e imagem OG;
  - home e `/agendar` em 390 px (sem overflow; o refino mobile é da Fase 2).
- **Lint:** sem erros. Restam 3 avisos antigos nos scripts de vídeo.

## Problemas conhecidos e pendências

1. **Não existe projeto Supabase da Valete** (depende do usuário).
   - O `.env.local` do Lkas aponta para a **produção do Lkas** e nunca pode ser usado aqui.
   - As migrations semeiam conteúdo do Lkas:
     - `20260831…` e `20260901140000…`: fotos do Lkas;
     - `20260926…`: profissionais Lucas, Crespo e Vênus; `…a001` é o padrão do trigger
       `appointments_default_professional`.
   - Num banco novo da Valete é preciso planejar um seed próprio antes de aplicar, sem migration
     destrutiva. O `seed.sql` também é do Lkas (tranças, Maringá).
2. **Faltam dados reais:** serviços, preços, profissionais, endereço, horário, WhatsApp,
   Instagram, chave Pix e textos legais. O site mostra estados vazios; nada foi inventado.
3. **Mobile (Fase 2):**
   - abaixo de 1024 px as Heros empilham; em 768 px a B deixa o logo abaixo da dobra;
   - o agendamento e o painel herdaram cores e fonte, mas mantêm rótulos em caixa-alta espaçada
     do Lkas.
4. **Revelações:** sem JavaScript, títulos e preços nascem com opacidade 0 (comportamento do
   Framer Motion no SSR).
5. **Poster:** é o quadro 440 e o vídeo começa no quadro 0, então há uma troca de imagem quando
   o vídeo começa a tocar.
6. **Storage:** o upload de fotos do painel (galeria e profissionais) não tem Storage no gateway
   de teste e não foi testado.

## Próximos passos

1. Cliente escolhe a Hero (A ou B) e envia os dados reais.
2. Criar o projeto Supabase e o deploy da Valete. Aplicar as migrations com seed próprio
   (ver o bloqueio acima).
3. Fase 2 (sessão do celular): experiência mobile do agendamento e validação funcional, sobre
   esta mesma base. O banco de teste sobe com `bash scripts/local-db/up.sh`.

## Arquitetura herdada (preservar)

- Next 16.3.3: `src/proxy.ts`, não middleware. Ler `node_modules/next/dist/docs/` antes de
  mexer em convenções.
- React 19, Tailwind v4 (tokens em `src/app/globals.css`), `framer-motion` 13 e `gsap` 3
  instalados, npm.
- Leituras públicas em `src/lib/supabase/queries.ts`; painel em `admin-queries.ts`.
  Disponibilidade em `src/lib/scheduling.ts`. Sinal Pix em `src/lib/deposit.ts` e
  `/agendar/pagamento/[id]`.
- Wizard de agendamento: `src/components/booking/booking-form.tsx`. **Não reescrever regras de
  negócio.**
- Lições do Lkas que continuam valendo (ver `CLAUDE.md`):
  - nada de z-index negativo em ancestral de `<video>`;
  - fontes servidas pelo projeto, não por `next/font/google`;
  - insert público sem `.select()`;
  - `git fetch` no início de toda sessão.
