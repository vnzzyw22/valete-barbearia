-- DADOS SINTÉTICOS DE TESTE — NÃO SÃO DA VALETE. Nunca commitar como seed real.
-- Remove o conteúdo do Lkas que as migrations semeiam e coloca dados marcados [TESTE].
begin;
delete from public.appointments;
delete from public.clients;
delete from public.blocked_slots;
delete from public.gallery_photos;
delete from public.service_hair_durations;
delete from public.professional_services;
-- O trigger appointments_default_professional aponta para ...a001: mantemos esse id.
delete from public.professionals where id <> '00000000-0000-0000-0000-00000000a001';
update public.professionals set name = '[TESTE] Profissional A', display_order = 1
  where id = '00000000-0000-0000-0000-00000000a001';
insert into public.professionals (id, name, display_order) values
  ('00000000-0000-0000-0000-00000000a002', '[TESTE] Profissional B', 2);
delete from public.services;
insert into public.services (id, name, description, price, duration_minutes, display_order) values
  ('00000000-0000-0000-0000-0000000005a1', '[TESTE] Corte', 'Serviço fictício para teste local.', 50, 40, 1),
  ('00000000-0000-0000-0000-0000000005a2', '[TESTE] Barba', 'Serviço fictício para teste local.', 35, 30, 2),
  ('00000000-0000-0000-0000-0000000005a3', '[TESTE] Corte e barba', null, 75, 60, 3);
insert into public.professional_services (professional_id, service_id)
select p.id, s.id from public.professionals p cross join public.services s;
insert into public.business_settings (id, name, whatsapp, instagram, address, business_hours)
values ('00000000-0000-0000-0000-000000000001', '[TESTE] Valete Barbearia', '5544900000000', null, null,
  '{"mon":{"open":"09:00","close":"19:00"},"tue":{"open":"09:00","close":"19:00"},
    "wed":{"open":"09:00","close":"19:00"},"thu":{"open":"09:00","close":"19:00"},
    "fri":{"open":"09:00","close":"19:00"},"sat":{"open":"09:00","close":"17:00"},
    "sun":{"closed":true}}'::jsonb)
on conflict (id) do update set name = excluded.name, whatsapp = excluded.whatsapp,
  instagram = null, address = null, business_hours = excluded.business_hours;
insert into auth.users (id, email, encrypted_password) values
  ('00000000-0000-0000-0000-0000000000ad', 'admin@teste.local', 'senha-local-de-teste')
on conflict do nothing;
commit;
