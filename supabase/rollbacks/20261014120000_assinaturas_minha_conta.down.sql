-- Rollback de supabase/migrations/20261014120000_assinaturas_minha_conta.sql.
-- Não é aplicado automaticamente pelo `supabase db push` (fica fora de
-- migrations/ de propósito) — rodar à mão no SQL Editor só se for preciso
-- voltar atrás, e só DEPOIS de voltar o código publicado pra versão anterior
-- (o código novo lê as tabelas que este arquivo remove).
--
-- ⚠️ Perde os planos, os assinantes cadastrados e os códigos de acesso.

begin;

drop view public.client_phones;
drop table public.client_login_codes;
drop table public.subscriptions;
drop table public.plans;
drop function public.phone_national(text);

commit;
