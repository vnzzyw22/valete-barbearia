-- DADOS DE DEMONSTRAÇÃO (banco local descartável). Nunca usar como seed de produção.
--
-- REAIS (cliente/usuário, 2026-10-14): nome, endereço (Rua Orquídea; a Rua Nova Ucrânia é o
-- endereço anterior), Instagram, WhatsApp, horário de funcionamento, nomes dos serviços e os
-- três planos de assinatura.
-- FICTÍCIOS (pedido do usuário, 2026-10-14, para a prévia): barbeiros, preços e durações dos
-- serviços, clientes, agendamentos, assinantes e o caixa. Trocar pelos reais antes de lançar.
--
-- As datas são relativas ao dia em que o banco é recriado, então a agenda sempre parece "viva".
begin;
delete from public.appointments;
delete from public.clients;
delete from public.blocked_slots;
delete from public.gallery_photos;
delete from public.service_hair_durations;
delete from public.professional_services;
delete from public.transactions;

-- Barbeiros fictícios. O trigger appointments_default_professional aponta para ...a001: mantemos esse id.
delete from public.professionals where id <> '00000000-0000-0000-0000-00000000a001';
update public.professionals set name = 'Rafael', display_order = 1, bio = null, photo_url = null
  where id = '00000000-0000-0000-0000-00000000a001';
insert into public.professionals (id, name, display_order) values
  ('00000000-0000-0000-0000-00000000a002', 'Bruno', 2),
  ('00000000-0000-0000-0000-00000000a003', 'Diego', 3),
  ('00000000-0000-0000-0000-00000000a004', 'Thiago', 4);

-- Serviços: nomes reais, preço e duração fictícios.
delete from public.services;
insert into public.services (id, name, description, price, duration_minutes, display_order) values
  ('00000000-0000-0000-0000-0000000005a1', 'Corte', 'Tesoura ou máquina, com acabamento na navalha.', 45, 40, 1),
  ('00000000-0000-0000-0000-0000000005a3', 'Corte + barba', null, 70, 60, 2),
  ('00000000-0000-0000-0000-0000000005a2', 'Barba', 'Toalha quente e navalha.', 35, 30, 3),
  ('00000000-0000-0000-0000-0000000005a4', 'Alinhamento de barba', 'Contorno e acabamento.', 25, 20, 4),
  ('00000000-0000-0000-0000-0000000005a5', 'Terapia capilar', null, 60, 45, 5),
  ('00000000-0000-0000-0000-0000000005a6', 'Visagismo', 'Leitura do rosto para indicar corte e barba.', 80, 50, 6);
insert into public.professional_services (professional_id, service_id)
select p.id, s.id from public.professionals p cross join public.services s;

insert into public.business_settings (id, name, whatsapp, instagram, address, business_hours)
values ('00000000-0000-0000-0000-000000000001', 'Valete Barbearia', '5543999383149', '@valete_barbearia',
  'Rua Orquídea, 626 — Jardim das Flores I, Apucarana - PR, 86810-250',
  '{"mon":{"open":"10:00","close":"18:00"},"tue":{"open":"09:00","close":"20:00"},
    "wed":{"open":"09:00","close":"20:00"},"thu":{"open":"09:00","close":"20:00"},
    "fri":{"open":"09:00","close":"20:00"},"sat":{"open":"08:30","close":"18:00"},
    "sun":{"closed":true}}'::jsonb)
on conflict (id) do update set name = excluded.name, whatsapp = excluded.whatsapp,
  instagram = excluded.instagram, address = excluded.address, business_hours = excluded.business_hours;

-- Planos REAIS. Período mensal ainda a confirmar com o cliente.
insert into public.plans (id, name, price, weekdays, featured, display_order) values
  ('00000000-0000-0000-0000-0000000001a3', 'Corte + barba ilimitado', 139.99, null, true, 1),
  ('00000000-0000-0000-0000-0000000001a1', 'Corte ilimitado', 74.99, array['mon', 'tue', 'wed'], false, 2),
  ('00000000-0000-0000-0000-0000000001a2', 'Barba', 79.99, array['mon', 'tue', 'wed', 'thu'], false, 3);

-- Clientes fictícios. O primeiro é o da demonstração de "Minha conta": entrar com (43) 90000-0001.
insert into public.clients (id, name, whatsapp, notes)
select
  ('00000000-0000-0000-0000-0000000c' || lpad(n::text, 4, '0'))::uuid,
  name,
  '(43) 9' || lpad((1000 + n)::text, 4, '0') || '-' || lpad((n * 37 % 10000)::text, 4, '0'),
  note
from (values
  (1, 'Marcos Vinícius', 'Prefere degradê baixo.'),
  (2, 'João Pedro Lima', null), (3, 'Gabriel Souza', null), (4, 'Felipe Andrade', 'Alergia a pós-barba com álcool.'),
  (5, 'Lucas Ferreira', null), (6, 'Matheus Rocha', null), (7, 'Pedro Henrique', null), (8, 'Rodrigo Alves', null),
  (9, 'André Martins', null), (10, 'Caio Ribeiro', null), (11, 'Vinícius Costa', null), (12, 'Leonardo Dias', null),
  (13, 'Henrique Barros', null), (14, 'Eduardo Nunes', null), (15, 'Gustavo Pires', null), (16, 'Renato Cardoso', null),
  (17, 'Samuel Teixeira', null), (18, 'Igor Mendes', null), (19, 'Daniel Moreira', null), (20, 'Otávio Freitas', null)
) as c(n, name, note);
update public.clients set whatsapp = '(43) 90000-0001' where id = '00000000-0000-0000-0000-0000000c0001';

-- Agenda fictícia: 60 dias para trás e 10 para frente, 4 barbeiros, horários de hora em hora dentro
-- do funcionamento. Nenhum serviço passa de 60 min, então os horários nunca se sobrepõem; das 11:30
-- às 13:30 fica livre (12:00 é o horário do cliente da demonstração).
-- Escolhas "aleatórias" por hash, para o resultado ser o mesmo a cada recriação no mesmo dia.
do $$
declare
  d int;
  p int;
  slot time;
  day date;
  dow int;
  h int;
  svc uuid;
  dur int;
  st timestamptz;
  status text;
  slots time[] := array['08:30','09:30','10:30','13:30','14:30','15:30','16:30','17:30','18:30']::time[];
begin
  for d in -60..10 loop
    day := current_date + d;
    dow := extract(dow from day);
    continue when dow = 0;
    for p in 1..4 loop
      foreach slot in array slots loop
        -- funcionamento: seg 10–18; ter–sex 9–20; sáb 8:30–18
        continue when (dow = 1 and (slot < '10:00' or slot > '17:00'))
                   or (dow between 2 and 5 and (slot < '09:00' or slot > '19:00'))
                   or (dow = 6 and slot > '17:00');
        h := abs(hashtext(day::text || '-' || p || '-' || slot::text));
        continue when h % 100 >= (case when d < 0 then 62 else 45 end);
        svc := case
          when h % 97 < 34 then '00000000-0000-0000-0000-0000000005a1'::uuid
          when h % 97 < 55 then '00000000-0000-0000-0000-0000000005a3'::uuid
          when h % 97 < 72 then '00000000-0000-0000-0000-0000000005a2'::uuid
          when h % 97 < 84 then '00000000-0000-0000-0000-0000000005a4'::uuid
          when h % 97 < 92 then '00000000-0000-0000-0000-0000000005a5'::uuid
          else '00000000-0000-0000-0000-0000000005a6'::uuid end;
        select duration_minutes into dur from public.services where id = svc;
        st := (day + slot) at time zone 'America/Sao_Paulo';
        status := case
          when st < now() then (case when h % 89 < 7 then 'cancelled' else 'confirmed' end)
          else (case when h % 89 < 50 then 'confirmed' when h % 89 < 56 then 'cancelled' else 'pending' end) end;
        insert into public.appointments (client_id, service_id, professional_id, starts_at, ends_at, status)
        values (
          ('00000000-0000-0000-0000-0000000c' || lpad((2 + h % 19)::text, 4, '0'))::uuid,
          svc,
          ('00000000-0000-0000-0000-00000000a00' || p)::uuid,
          st, st + make_interval(mins => dur), status);
      end loop;
    end loop;
  end loop;
end $$;

-- Histórico do cliente da demonstração (12:00, horário que a agenda fictícia deixa livre).
-- Dias que cairiam num domingo vão para a segunda.
insert into public.appointments (client_id, service_id, professional_id, starts_at, ends_at, status)
select '00000000-0000-0000-0000-0000000c0001', s.id, ('00000000-0000-0000-0000-00000000a00' || x.prof)::uuid,
  st, st + make_interval(mins => s.duration_minutes), x.status
from (values (3, '5a3', 1, 'confirmed'), (-4, '5a3', 1, 'confirmed'), (-11, '5a4', 2, 'confirmed'),
             (-19, '5a3', 1, 'confirmed'), (-26, '5a6', 3, 'confirmed'), (-33, '5a1', 1, 'cancelled'),
             (-47, '5a3', 1, 'confirmed')) as x(off, svc, prof, status)
join public.services s on s.id = ('00000000-0000-0000-0000-000000000' || x.svc)::uuid
cross join lateral (
  select ((current_date + x.off + case when extract(dow from current_date + x.off) = 0 then 1 else 0 end)
    + time '12:00') at time zone 'America/Sao_Paulo' as st
) t;

-- Assinantes fictícios (o WhatsApp casa com o cadastro de clientes acima).
insert into public.subscriptions (plan_id, client_name, client_whatsapp, status, started_at, renews_at, notes)
select ('00000000-0000-0000-0000-0000000001' || x.plan)::uuid, c.name, public.phone_national(c.whatsapp),
  x.status, current_date - x.since, case when x.status = 'cancelled' then null else current_date + x.renew end, x.note
from (values (1, 'a3', 'active', 52, 8, null), (3, 'a3', 'active', 95, 25, null), (4, 'a1', 'active', 40, 20, null),
             (6, 'a2', 'active', 15, 15, null), (9, 'a1', 'active', 70, 21, null), (12, 'a3', 'paused', 120, 30, 'Viajando até o fim do mês.'),
             (15, 'a2', 'active', 33, 27, null), (18, 'a1', 'cancelled', 150, 0, null)) as x(n, plan, status, since, renew, note)
join public.clients c on c.id = ('00000000-0000-0000-0000-0000000c' || lpad(x.n::text, 4, '0'))::uuid;

-- Caixa fictício dos últimos 6 meses (lançamentos manuais do Financeiro).
insert into public.transactions (type, category, amount, description, occurred_at)
select t.type, t.category, round((t.base * (0.9 + (abs(hashtext(t.category || m)) % 20) / 100.0))::numeric, 2),
  t.description, (date_trunc('month', current_date) - make_interval(months => m))::date + t.day
from generate_series(0, 5) as m
cross join (values
  ('income', 'Assinaturas', 820, 'Mensalidades recebidas no mês', 5),
  ('income', 'Produtos', 310, 'Pomadas e óleos para barba', 18),
  ('expense', 'Aluguel', 1800, 'Aluguel do ponto', 9),
  ('expense', 'Energia', 340, 'Conta de luz', 14),
  ('expense', 'Estoque', 460, 'Lâminas, toalhas e produtos', 20),
  ('expense', 'Internet', 120, 'Plano de internet', 11)
) as t(type, category, base, description, day)
where (date_trunc('month', current_date) - make_interval(months => m))::date + t.day <= current_date;

insert into auth.users (id, email, encrypted_password) values
  ('00000000-0000-0000-0000-0000000000ad', 'admin@teste.local', 'senha-local-de-teste')
on conflict do nothing;
commit;
