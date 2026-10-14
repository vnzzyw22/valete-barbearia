# Próxima sessão: comece por aqui

Atualizado em 2026-10-14 (3ª sessão, na nuvem). Detalhes técnicos em `HANDOFF.md` (seção "⚡⚡⚡"),
direção visual em `DESIGN.md`.

Projeto = **demo/prévia**. Sem Supabase por enquanto (decisão do usuário): tudo roda no banco local.

## Estado

As pendências técnicas da sessão anterior estão fechadas: lint e tipos limpos, olhada visual final
da home (desktop e celular), seção Equipe integrada a "Os artistas" (bloco "Quem atende"), ajustes
no celular (Agendar visível em Serviços, CEP sem quebra) e fumaça de todas as telas.

## O que falta (todas dependem do cliente ou de produção)

1. **Endereço:** o site usa "Rua Orquídea, 626"; o usuário chegou a colar "Rua Nova Ucrânia, 309". Confirmar.
2. Confirmar se os planos são **mensais** (o site mostra "por mês").
3. Aprovar o texto de "Os artistas", os nomes das seções e a **Hero B**; depois apagar a Hero A
   (`?hero=a`, `hero-letters.ts`, `public/brand/hero-vale-te.svg`, `scripts/brand/build-hero-letters.py`).
4. Dados reais: preços e durações dos serviços, nomes e **fotos dos barbeiros** (cadastrar em
   Painel → Profissionais; o bloco "Quem atende" só aparece com foto), Facebook, chave Pix, textos legais.
5. Opcional, no desktop: crítica `impeccable` e `quality-gate-visual` (não instaladas na nuvem).

### Antes de virar produção
6. Envio real do código da Minha conta por WhatsApp/SMS (`src/app/minha-conta/actions.ts > requestAccessCode`).
7. Projeto Supabase próprio + seed real (as migrations antigas semeiam dados do Lkas; ver HANDOFF).
8. Deploy na Vercel.

## Como subir o ambiente local

- **Nuvem/Linux:** `bash scripts/local-db/up.sh`, copiar as 3 linhas impressas para `.env.local` e
  acrescentar `CLIENT_SESSION_SECRET` (32+ caracteres), `CLIENT_LOGIN_DEMO=true` e, para o painel sem
  login, as 3 linhas `ADMIN_*` (ver `.env.local.example`). Depois `npm run build && npx next start -p 3100`.
- **Windows (desktop):** banco em `C:\Users\Protmar\.valete-local-db`:
  1. `node_modules/@embedded-postgres/windows-x64/native/bin/postgres.exe -D data -p 54322` (deixar rodando)
  2. `node up.mjs` (recria o banco com os dados de demonstração; imprime as chaves)
  3. `bin/postgrest.exe postgrest.conf` — antes, confira que não há outro PostgREST na porta 3011
     (`netstat -ano | findstr :3011`); dois ao mesmo tempo dão 404 aleatório.
  4. Na pasta do repositório: `JWT_SECRET_FILE=C:/Users/Protmar/.valete-local-db/jwt-secret.txt PGRST_PORT=3011 node scripts/local-db/gateway.mjs`
  5. `npx next dev -p 3100`

Memória curta no notebook (4 GB): se o `tsc` ou o lint estourarem, feche o Chrome de testes e use
`NODE_OPTIONS=--max-old-space-size=1536`. O `tsc` avulso precisa de `npx next typegen` antes.
