-- Assinaturas (planos mensais da barbearia) e "Minha conta" do cliente.
-- Migration ADITIVA: só cria tabelas e funções novas; nada do que existe é alterado.
-- Rollback manual em supabase/rollbacks/20261014120000_assinaturas_minha_conta.down.sql.

-- ---------------------------------------------------------------------------
-- Telefone "nacional": só dígitos e sem o DDI 55 (DDD + número). É a chave que
-- liga o cliente aos agendamentos (clients não é deduplicado: cada agendamento
-- cria um registro, e o WhatsApp é gravado como a pessoa digitou).
-- ---------------------------------------------------------------------------
create or replace function public.phone_national(p text)
returns text
language sql
immutable
as $$
  select case when length(d) in (12, 13) and d like '55%' then substr(d, 3) else d end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x;
$$;

-- ---------------------------------------------------------------------------
-- Planos: aparecem no site (seção Assinaturas) e são editados no painel.
-- weekdays: dias em que o plano vale (mon..sun); null = sem restrição de dia.
-- featured: o plano em destaque no site (o "carro-chefe").
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  weekdays text[] check (weekdays <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  featured boolean not null default false,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

alter table public.plans enable row level security;

create policy plans_public_read
  on public.plans for select
  to anon
  using (active = true);

create policy plans_admin_all
  on public.plans for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

-- ---------------------------------------------------------------------------
-- Assinantes: cadastrados pela equipe no painel (sem cobrança automática; o
-- pagamento é combinado direto com a barbearia). client_whatsapp guarda o
-- telefone nacional (ver phone_national) para casar com o login do cliente.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete restrict,
  client_name text not null,
  client_whatsapp text not null check (client_whatsapp ~ '^[0-9]{10,11}$'),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  started_at date not null default current_date,
  renews_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_client_whatsapp_idx on public.subscriptions (client_whatsapp);

create trigger set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy subscriptions_admin_all
  on public.subscriptions for all
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

-- ---------------------------------------------------------------------------
-- Códigos de acesso do cliente ("Minha conta"). Só o servidor do site mexe
-- aqui, com a chave service_role: nenhuma policy para anon/authenticated.
-- O código nunca é gravado em claro (code_hash = HMAC feito no servidor).
-- ---------------------------------------------------------------------------
create table public.client_login_codes (
  id uuid primary key default gen_random_uuid(),
  whatsapp text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index client_login_codes_whatsapp_idx on public.client_login_codes (whatsapp, created_at desc);

alter table public.client_login_codes enable row level security;
revoke all on public.client_login_codes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Índice de telefones dos clientes para a "Minha conta": liga um telefone a
-- todos os registros de clients (que não são deduplicados). Só o servidor do
-- site lê esta view, com a chave service_role, depois de validar a sessão do
-- cliente. (Uma função restrita ao service_role não entra no cache do
-- PostgREST; a view resolve o mesmo sem abrir nada para anon/authenticated.)
-- ---------------------------------------------------------------------------
create view public.client_phones as
select c.id as client_id, c.name, c.created_at, public.phone_national(c.whatsapp) as phone
from public.clients c;

revoke all on public.client_phones from anon, authenticated;
grant select on public.client_phones to service_role;
