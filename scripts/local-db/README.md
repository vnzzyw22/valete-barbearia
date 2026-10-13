# Banco local descartável (testes)

Não existe projeto Supabase da Valete ainda, e o `.env.local` do Lkas aponta para a produção de
outro cliente. Para testar o site de ponta a ponta sem tocar em nada real, use este ambiente:

- Postgres local (porta 54322) com um bootstrap mínimo do Supabase (`bootstrap.sql`: papéis
  `anon`/`authenticated`/`service_role`/`authenticator`, `auth.uid()`/`auth.role()`/`auth.jwt()`,
  `storage.buckets`/`objects`).
- **As migrations reais** de `supabase/migrations/`, em ordem.
- `test-data.sql`: apaga o conteúdo do Lkas que as migrations semeiam e insere dados
  **sintéticos marcados `[TESTE]`**. Não é seed da Valete e nunca deve virar um.
- PostgREST 12 (porta 3001) e `gateway.mjs` (porta 54321), que imita o endereço do Supabase:
  `/rest/v1/*` vai para o PostgREST e `/auth/v1` tem um único admin de teste. Storage não existe
  (upload de foto no painel responde 501).

## Uso (Linux, como root, Postgres 16 instalado)

```bash
bash scripts/local-db/up.sh         # sobe tudo e recria o banco; imprime as linhas do .env.local
bash scripts/local-db/up.sh reset   # só recria o banco com as migrations e os dados [TESTE]
bash scripts/local-db/down.sh       # para PostgREST e gateway
```

Copie as duas linhas impressas para o `.env.local` (ignorado pelo git) e rode `npm run build`,
porque as variáveis `NEXT_PUBLIC_*` entram no bundle. Depois, `npx next start -p 3100`.

- Admin de teste: `admin@teste.local` / `senha-local-de-teste`.
- Segredo JWT, logs e PIDs ficam em `$VALETE_DB_STATE` (padrão `/tmp/valete-local-db`), fora
  do repositório.

## Playwright neste ambiente

O Chromium do Playwright não decodifica H.264 (`canPlayType` vazio). Para revisar a Hero com o
vídeo tocando, sirva uma cópia VP9 só no teste interceptando `/videos/valete-hero-v2.mp4`
(`page.route(..., route.fulfill({ path: "copia.webm", contentType: "video/webm" }))`). O arquivo
publicado continua sendo o MP4 H.264, que os navegadores reais tocam.
