# Próxima sessão: comece por aqui

Sessão interrompida em 2026-10-14 a pedido do usuário (créditos acabando). Tudo o que foi feito está
neste commit. Detalhes técnicos em `HANDOFF.md` (seção "⚡⚡ 2ª sessão"), direção visual em `DESIGN.md`.

Projeto = **demo/prévia**. Sem Supabase por enquanto (decisão do usuário): tudo roda no banco local.

## Onde parei (exatamente)

Estava na **verificação final** depois de implementar o movimento do site:
- `npx tsc --noEmit` → **passou**.
- ESLint no `src` inteiro **estourou memória** (notebook com 4 GB e só ~200 MB livres). Eu ia rodar o
  lint só nos arquivos alterados quando a sessão foi interrompida. **Primeira tarefa da próxima
  sessão:** fechar programas e rodar
  `npx eslint --quiet src/components/site src/components/account src/app/minha-conta src/components/admin/subscriptions-manager.tsx "src/app/admin/(painel)/assinaturas" src/lib`.
- Tudo foi conferido no Chrome real (desktop 1440 e ~500 px): sem erros de console, sem rolagem
  horizontal. A cortina das fotos de "O trabalho" e a máscara dos títulos foram corrigidas e
  reconferidas por medição; **falta só uma olhada visual final** depois da última correção.

## O que foi feito nesta sessão (resumo)

1. Dados reais: WhatsApp +55 43 99938-3149 e horário (seg 10–18, ter–sex 9–20, sáb 8:30–18, dom fechado).
2. Nova seção **Assinaturas** (logo após a Hero) com a carta de baralho do plano em destaque + painel
   **Admin → Assinaturas** (planos e assinantes).
3. Nova página **Minha conta** (`/minha-conta`): login por WhatsApp + código, próximo horário, plano,
   histórico. Demo: entrar com **(43) 90000-0001**; o código aparece na tela (modo demonstração).
4. **Dados fictícios** no painel e na Minha conta (4 barbeiros, 20 clientes, ~1.060 agendamentos,
   8 assinantes, caixa de 6 meses) em `scripts/local-db/test-data.sql`.
5. "A casa" → **"Os artistas"** (texto sobre a equipe). "O espaço" → **"O trabalho"** (layout editorial).
6. **Movimento** (Framer Motion): carta que vira e inclina no mouse, títulos por máscara, fios das
   listas se desenhando, cortina nas fotos, saída da Hero no scroll. Respeita "reduzir movimento".
7. Hero: borrão menor; links da navbar legíveis sobre o vídeo.
8. Painel e agendamento sem rótulos em CAIXA-ALTA; bug do gráfico do financeiro corrigido.
9. Migration nova (aditiva): `supabase/migrations/20261014120000_assinaturas_minha_conta.sql`.

## O que falta fazer (em ordem)

### Técnico (dá para fazer sem o cliente)
1. Rodar o ESLint (acima) e corrigir o que aparecer.
2. Olhada visual final da home inteira (desktop e celular), principalmente "O trabalho" e a carta.
3. Ciclo de revisão obrigatório do fluxo de design (ainda **não** feito nesta rodada):
   `impeccable` (crítica) → `web-design-guidelines` (auditoria) → corrigir → `quality-gate-visual`.
4. Seção "Equipe" (aparece quando profissional tem foto) fica colada em "Os artistas": decidir se
   vira parte dela.
5. Atualizar a memória `valete` se existir/criar (não há arquivo de memória do projeto ainda).

### Depende do cliente/usuário
6. **Endereço:** o usuário colou "Rua Nova Ucrânia, 309", mas o cliente tinha dito que a sede atual é
   "Rua Orquídea, 626" (Nova Ucrânia = anterior). O site usa a **Orquídea**. Confirmar.
7. Confirmar se os planos são **mensais** (o site mostra "por mês").
8. Aprovar o texto de "Os artistas" e os novos nomes das seções.
9. Dados reais que faltam: preços e durações dos serviços, nomes e fotos dos barbeiros, Facebook,
   chave Pix, textos legais (termos e privacidade).
10. Aprovar a Hero B e depois apagar a Hero A (`?hero=a`, `hero-letters.ts`, `public/brand/hero-vale-te.svg`).

### Antes de virar produção (não é necessário para a demo)
11. Envio real do código da Minha conta por WhatsApp/SMS (`src/app/minha-conta/actions.ts > requestAccessCode`).
    Hoje só funciona em modo demonstração com o banco local.
12. Projeto Supabase próprio + seed real (as migrations antigas semeiam dados do Lkas; ver HANDOFF).
13. Deploy na Vercel.

## Como subir o ambiente local (Windows)

Banco de teste fora do repositório, em `C:\Users\Protmar\.valete-local-db`:
1. `node_modules/@embedded-postgres/windows-x64/native/bin/postgres.exe -D data -p 54322` (deixar rodando)
2. `node up.mjs` (recria o banco com os dados de demonstração; imprime as chaves)
3. `bin/postgrest.exe postgrest.conf` — **antes, confira que não há outro PostgREST na porta 3011**
   (`netstat -ano | findstr :3011`); dois ao mesmo tempo dão 404 aleatório.
4. Na pasta do repositório: `JWT_SECRET_FILE=C:/Users/Protmar/.valete-local-db/jwt-secret.txt PGRST_PORT=3011 node scripts/local-db/gateway.mjs`
5. `npx next dev -p 3100`

O `.env.local` (não versionado) precisa de: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (os três saem do `up.mjs`), `CLIENT_SESSION_SECRET` (32+ caracteres
aleatórios), `CLIENT_LOGIN_DEMO=true` e, para o painel sem login, as 3 linhas `ADMIN_*` (ver
`.env.local.example`). Em outra máquina/nuvem: `bash scripts/local-db/up.sh`.

Memória curta: se o `tsc` estourar, feche o Chrome de testes e use `NODE_OPTIONS=--max-old-space-size=1536`.
