# Valete Barbearia — passagem de sessão (Fase 1, 2026-10-13, sessão na nuvem)

Este repositório é a **Valete Barbearia — Cut and Beard**, cópia independente do Lkas Locs.
O `CLAUDE.md` ainda descreve o Lkas: vale como histórico técnico (arquitetura, lições de bugs),
**não** como identidade visual. A identidade da Valete está em `DESIGN.md` e `PRODUCT.md`.

## 🪟 Vitrine sem banco (deploy de prévia na Vercel, 2026-10-14)

Decisão do usuário: o deploy é **só um exemplo visual**, sem banco de dados. Sem as variáveis
`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` o site entra sozinho no modo vitrine:
- leituras públicas (`queries.ts`) devolvem `src/lib/demo-data.ts` (mesmo conteúdo do
  `test-data.sql`: dados reais da Valete + barbeiros, preços e cliente fictícios). Ao mudar um, mudar o outro;
- `/agendar` vai até "Agendamento enviado!" sem gravar nada;
- Minha conta: qualquer WhatsApp, código fixo **123456** (aparece na tela), conta de exemplo do Marcos;
- painel: a tela de login avisa que a prévia não tem painel;
- o proxy pula a sessão do Supabase (`src/lib/supabase/config.ts`).
Com as variáveis preenchidas, tudo volta a usar o banco, sem mudança de código. Testado com
`next build` sem `.env.local` (fluxos completos em 390 px) e de novo com o banco local.

## ⚡⚡⚡ Atualização 2026-10-14, 3ª sessão (nuvem, mais recente): pendências técnicas fechadas

Feito e conferido com Playwright contra `next build` + `next start` e o banco local (`up.sh`):
- **ESLint e `tsc` limpos** no `src` inteiro (no Linux com 8 GB não estourou memória). Antes do
  `tsc` avulso, rodar `npx next typegen` (gera `PageProps`/`LayoutProps`); o `next build` já faz isso.
- **Seção Equipe integrada a "Os artistas"**: `team-section.tsx` removido; os retratos dos
  profissionais com foto entram em "Quem atende", dentro de `about-section.tsx`, abaixo do texto e
  da foto do grupo (4 colunas no desktop, 2 no celular, cortina `MediaReveal`). Sem nenhuma foto, o
  bloco não aparece. DESIGN.md atualizado. Testado com fotos temporárias no banco local.
- **Serviços no celular**: a palavra "Agendar" agora aparece também no celular (à direita, na
  linha da duração). Antes a linha era link, mas nada indicava que dava para tocar.
- **Onde estamos**: o CEP não quebra mais no hífen ("86810-" / "250") em telas estreitas.
- **Olhada visual final** da home inteira em 1440 e 390 px: sem erro de console, sem rolagem
  horizontal, revelações (títulos, fios, cortinas, carta) terminando em opacidade 1. "O trabalho"
  e a carta das Assinaturas conferidos.
- **Fumaça**: `/`, `/agendar`, `/minha-conta` (login demo com (43) 90000-0001 até o painel do
  cliente), páginas legais e as 11 telas do painel em 1440 e 390 px: tudo 200, sem erro, sem
  rolagem horizontal.
- O mapa do Google não carrega no ambiente de nuvem (rede bloqueada); no navegador real carrega.
- `impeccable`, `web-design-guidelines` e `quality-gate-visual` **não estão instaladas na nuvem**:
  a revisão foi feita por screenshot. Se quiser a crítica formal, rodar no desktop.

### Pendente (só depende do cliente ou de produção)
1. Endereço: Orquídea, 626 (no site) × Nova Ucrânia, 309 (colado pelo usuário). Confirmar.
2. Planos são mensais? O site mostra "por mês".
3. Aprovar o texto de "Os artistas", os nomes das seções e a Hero B (depois apagar a Hero A).
4. Dados reais: preços e durações, nomes e **fotos dos barbeiros** (o bloco "Quem atende" só
   aparece com foto), Facebook, chave Pix, textos legais.
5. Antes de produção: envio real do código da Minha conta (WhatsApp/SMS), Supabase próprio com
   seed real, deploy na Vercel.

## ⚡⚡ Atualização 2026-10-14, 2ª sessão no desktop: leia isto primeiro

Projeto é **demo/prévia**: sem Supabase por enquanto (decisão do usuário). Tudo roda no banco local.

### Feito e conferido no Chrome (desktop e ~500 px)
- **Dados reais aplicados no seed:** WhatsApp +55 43 99938-3149 e horário (seg 10–18, ter–sex 9–20,
  sáb 8:30–18, dom fechado). ⚠️ O usuário colou o endereço **Rua Nova Ucrânia, 309**, mas o cliente
  tinha dito que a sede atual é a **Rua Orquídea, 626** (Nova Ucrânia = anterior). Mantida a Orquídea;
  **confirmar com o cliente**.
- **Assinaturas** (nova, logo depois da Hero, carro-chefe): planos reais Corte + barba ilimitado
  R$ 139,99 (destaque), Corte ilimitado seg–qua R$ 74,99, Barba seg–qui R$ 79,99. "Por mês" é suposição
  (**confirmar**). Assinar = WhatsApp. Painel → **Assinaturas** (planos e assinantes).
- **Minha conta** (\`/minha-conta\`): login por WhatsApp + código de 6 dígitos (HMAC, 10 min, 5
  tentativas, 3 códigos/15 min) e cookie assinado httpOnly de 30 dias. Mostra próximo horário
  (adicionar à agenda .ics, remarcar pelo WhatsApp, pagar sinal), plano (carta de bolso, renovação,
  atendimentos no ciclo), histórico com "Agendar de novo" e "Sair". Leitura pelo servidor com a chave
  \`service_role\` (view \`client_phones\`, sem acesso para anon/authenticated).
  - ⚠️ **Não há envio do código por WhatsApp.** Com \`CLIENT_LOGIN_DEMO=true\` + banco local, o código
    aparece na tela. Fora disso o acesso fica "indisponível". Antes de produção: integrar a API do
    WhatsApp (ou SMS) em \`src/app/minha-conta/actions.ts > requestAccessCode\`.
  - Demo: entrar com **(43) 90000-0001** (Marcos Vinícius, assinante do plano principal).
- **Migration aditiva** \`20261014120000_assinaturas_minha_conta.sql\` (+ rollback): \`plans\`,
  \`subscriptions\`, \`client_login_codes\`, view \`client_phones\`, função \`phone_national\`.
- **Dados de demonstração** (\`scripts/local-db/test-data.sql\`, datas relativas ao dia): 4 barbeiros
  fictícios (Rafael, Bruno, Diego, Thiago), 6 serviços com nomes reais e **preços fictícios**, 20
  clientes, ~1.060 agendamentos (60 dias atrás, 10 à frente), 8 assinantes, caixa de 6 meses.
- **"A casa" → "Os artistas"** com texto sobre a equipe (sem fatos inventados: nada de anos, nomes
  ou quantidade). **"O espaço" → "O trabalho"**, recomposto em layout editorial (as fotos são do
  trabalho, não do salão).
- **Movimento** (DESIGN.md > Movimento): carta que é dada virada e vira para a face + inclinação 3D
  no mouse; títulos por máscara; fios das listas se desenhando; cortina nas fotos; saída da Hero no
  scroll. Tudo respeita \`prefers-reduced-motion\`.
- Hero: borrão um pouco menor (0,92 × altura, transição em 32%); véu no topo para os links.
- Painel e agendamento sem rótulos em caixa-alta espaçada (DESIGN.md); bug do gráfico do financeiro
  com mês vazio corrigido (chaves duplicadas).
- \`tsc\` e lint limpos. Console sem erros nas telas visitadas.

### Ambiente (Windows)
- \`.env.local\` ganhou \`SUPABASE_SERVICE_ROLE_KEY\` (local), \`CLIENT_SESSION_SECRET\` e
  \`CLIENT_LOGIN_DEMO=true\`. \`up.mjs\`/\`up.sh\` agora imprimem também a chave service_role.
- ⚠️ Dois PostgREST na mesma porta 3011 (um de sessão anterior) davam 404 aleatório em insert. Antes
  de subir outro, conferir \`netstat -ano | grep :3011\`.
- \`tsc\` pode estourar memória com o dev server aberto: \`NODE_OPTIONS=--max-old-space-size=1536\`.

### Pendente
1. Confirmar endereço (Orquídea × Nova Ucrânia) e se os planos são mensais.
2. Envio real do código da Minha conta (API do WhatsApp/SMS).
3. Rodar \`impeccable\`, \`web-design-guidelines\` e \`quality-gate-visual\` sobre esta rodada.
4. Seção Equipe ("Equipe", com foto de profissional) fica ao lado de "Os artistas" quando houver
   fotos: decidir se vira parte de Os artistas.
5. Itens antigos abaixo continuam valendo (Hero A a remover, textos legais, Supabase próprio etc.).

## ⚡ Atualização 2026-10-14 (sessão no desktop)

Interrompida a pedido do usuário. **O que vem abaixo de "Repositórios" é o estado de 2026-10-13.**

### Feito e conferido no Chrome real (desktop)
- **Hero B escolhida pelo cliente**, agora com o vídeo de **fundo** (`hero.tsx > HeroB`, classes `.hero-b-*`
  em `globals.css`). A camada nítida fica à direita e o fundo é `public/videos/valete-hero-v2-blur.mp4`
  (180×320, já desfocado no arquivo, 80 KB). Com `filter: blur` em tempo real o vídeo dava
  `MEDIA_ERR_DECODE` em 1920 px. Testado em 1024, 1440 e 1920: tocando, sem erro e sem overflow.
- **Nova seção "A casa"** (`about-section.tsx`): foto da equipe e serviços principais reais. A história
  da barbearia é **placeholder explícito** (`ABOUT_PARAGRAPHS = null`), até o cliente mandar o texto.
- **Nova seção "Onde estamos"** (`location-section.tsx`): endereço, "Como chegar", mapa do Google sem
  chave (filtro escuro), telefone, Instagram e horário, tudo de `business_settings`. A busca do mapa
  descarta o trecho "Bairro…" e os parênteses. Testado: com o nome popular do bairro, o Google não marca o pino.
- "O espaço" ficou com 4 fotos, cortadas acima da marca d'água. "Contato" virou só o fecho com o CTA.
  Navbar: Serviços · A casa · O espaço · Onde estamos.
- **Endereço atual** (cliente, 2026-10-14): Rua Orquídea, 626, Jardim das Flores I, Apucarana-PR,
  86810-250 (pino conferido no Google). Rua Nova Ucrânia, 380 é o endereço anterior. Instagram:
  @valete_barbearia. Serviços: corte, alinhamento/design de barba, terapia capilar, visagismo.

### Feito mas NÃO testado
- **Borrão da Hero um pouco menor**, a pedido do cliente: `.hero-b-sharp` passou de 0,78 para 0,88 × a
  altura e a máscara de 48% para 40%. Ainda não foi visto no navegador.
- **Login do painel desativado para teste** (`src/lib/admin-login-bypass.ts` + `src/lib/supabase/proxy.ts`
  + layout do painel). Com `ADMIN_LOGIN_DISABLED=true` no `.env.local`, o servidor entra sozinho com o
  admin de teste. A chave **só funciona com o banco local** (127.0.0.1/localhost). A tela de login
  continua no código. Conferido: `/admin` responde 200 sem login.
- **Financeiro em prévia** (`financeiro/page.tsx` + `components/admin/appointments-revenue.tsx`): aviso
  de prévia, faturamento realizado e previsto, ticket médio e divisão por profissional e por serviço,
  calculados dos agendamentos, além do caixa manual que já existia. **Não teve `tsc`, build nem tela.**
  Rodar `npx tsc --noEmit` antes de qualquer coisa.

### Pendente (pedidos do cliente)
1. **"Página do cliente"**: perfil com agendamentos, últimos serviços, plano/assinatura e outras ideias.
   **Nada feito.** Antes, decidir com o cliente:
   - como o cliente se identifica: link privado por UUID, como `/agendar/pagamento/[id]`, ou código pelo WhatsApp;
   - se "plano" exige tabela nova (`plans`/`client_plans`, migration aditiva).
2. Validar a nova largura do borrão com o cliente (screenshot).
3. Dados que faltam: telefone/WhatsApp real, link do Facebook, texto da história, confirmar o endereço e
   quais dados podem aparecer. O nome civil do dono e "9 anos de experiência" vieram de um resumo
   automático e **não** foram publicados.
4. Depois da aprovação: remover a Hero A (`?hero=a`, `hero-letters.ts`, `public/brand/hero-vale-te.svg`).
5. Supabase próprio da Valete + seed real (ver "Problemas conhecidos" abaixo).

### Como continuar
- **Desktop (Windows) do usuário:** o banco de teste roda fora do repositório, em `C:\Users\Protmar\.valete-local-db`
  (Postgres 17 portátil + PostgREST 12.2.3). Para subir:
  1. `node_modules/@embedded-postgres/windows-x64/native/bin/postgres.exe -D data -p 54322` (deixar rodando);
  2. `node up.mjs` (recria o banco);
  3. `bin/postgrest.exe postgrest.conf`;
  4. na pasta do repositório: `node scripts/local-db/gateway.mjs` com `JWT_SECRET_FILE=…/jwt-secret.txt PGRST_PORT=3011`;
  5. `npx next dev -p 3100`.

  O notebook tem só 4 GB: o `next build` falhou por falta de memória. Feche outros programas antes.
- **Nuvem/celular (Linux):** `bash scripts/local-db/up.sh`, copiar as linhas impressas para `.env.local`
  e acrescentar as 3 linhas `ADMIN_*` acima se quiser o painel sem login. Depois `npm run dev`.
- O `test-data.sql` já traz o endereço e o Instagram reais. Serviços, profissionais e WhatsApp continuam `[TESTE]`.

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
