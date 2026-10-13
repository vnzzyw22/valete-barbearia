# Valete Barbearia — Cut and Beard

Site + agendamento online + painel administrativo da Valete Barbearia. Base técnica herdada do
Lkas Locs (Next.js 16, React 19, Tailwind v4, Supabase).

- **Comece por `HANDOFF.md`:** estado atual, decisões do cliente, bloqueios e próximos passos.
- Identidade e produto: `DESIGN.md` e `PRODUCT.md`.
- Histórico técnico e lições de bugs (do Lkas): `CLAUDE.md`.

## Rodar localmente

Ainda não existe projeto Supabase da Valete. Para testar sem tocar em nada real:

```bash
npm ci
bash scripts/local-db/up.sh      # Postgres + PostgREST + gateway falso, com dados [TESTE]
# copie as duas linhas impressas para .env.local
npm run build && npx next start -p 3100
```

Detalhes em `scripts/local-db/README.md`. Nunca use o `.env.local` do Lkas: ele aponta para a
produção de outro cliente.

## Mídia

- Vídeo da Hero: `scripts/video-caption-removal/README.md`.
- Logo e letras da Hero: `scripts/brand/process-logo.py` e `scripts/brand/build-hero-letters.py`.
