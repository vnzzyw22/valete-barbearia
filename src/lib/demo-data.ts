import type { ClientPortal } from "@/lib/supabase/client-portal";
import type { BusinessSettings, Plan, Professional, Service } from "@/lib/supabase/types";

// VITRINE (prévia sem banco). Quando o deploy não tem as variáveis do Supabase, o site mostra
// estes dados no lugar do banco: é só um exemplo visual para o cliente, nada é gravado.
// Mesmo conteúdo de scripts/local-db/test-data.sql — reais: nome, endereço, WhatsApp, Instagram,
// horário, nomes dos serviços e os três planos. Fictícios: barbeiros, preços e durações dos
// serviços e o cliente da Minha conta. Ao trocar algo aqui, trocar lá também.

export const DEMO_ACCESS_CODE = "123456";

const id = (suffix: string) => `00000000-0000-0000-0000-${suffix}`;

export const DEMO_BUSINESS: BusinessSettings = {
  id: id("000000000001"),
  name: "Valete Barbearia",
  whatsapp: "5543999383149",
  instagram: "@valete_barbearia",
  address: "Rua Orquídea, 626 — Jardim das Flores I, Apucarana - PR, 86810-250",
  business_hours: {
    mon: { open: "10:00", close: "18:00" },
    tue: { open: "09:00", close: "20:00" },
    wed: { open: "09:00", close: "20:00" },
    thu: { open: "09:00", close: "20:00" },
    fri: { open: "09:00", close: "20:00" },
    sat: { open: "08:30", close: "18:00" },
    sun: { closed: true },
  },
  deposit_amount: 0,
  pix_key: null,
  deposit_hold_minutes: 15,
};

export const DEMO_SERVICES: Service[] = [
  ["0000000005a1", "Corte", "Tesoura ou máquina, com acabamento na navalha.", 45, 40],
  ["0000000005a3", "Corte + barba", null, 70, 60],
  ["0000000005a2", "Barba", "Toalha quente e navalha.", 35, 30],
  ["0000000005a4", "Alinhamento de barba", "Contorno e acabamento.", 25, 20],
  ["0000000005a5", "Terapia capilar", null, 60, 45],
  ["0000000005a6", "Visagismo", "Leitura do rosto para indicar corte e barba.", 80, 50],
].map(([suffix, name, description, price, duration]) => ({
  id: id(suffix as string),
  name: name as string,
  description: description as string | null,
  price: price as number,
  duration_minutes: duration as number,
  image_url: null,
  hair_durations: [],
}));

export const DEMO_PROFESSIONALS: Professional[] = ["Rafael", "Bruno", "Diego", "Thiago"].map((name, i) => ({
  id: id(`00000000a00${i + 1}`),
  name,
  bio: null,
  photo_url: null,
  working_hours: null,
  service_ids: DEMO_SERVICES.map((s) => s.id),
}));

export const DEMO_PLANS: Plan[] = [
  { id: id("0000000001a3"), name: "Corte + barba ilimitado", description: null, price: 139.99, weekdays: null, featured: true },
  { id: id("0000000001a1"), name: "Corte ilimitado", description: null, price: 74.99, weekdays: ["mon", "tue", "wed"], featured: false },
  { id: id("0000000001a2"), name: "Barba", description: null, price: 79.99, weekdays: ["mon", "tue", "wed", "thu"], featured: false },
];

// Minha conta da vitrine: datas relativas a hoje, para a página sempre parecer atual.
function daysFromToday(days: number, time: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const base = new Date(`${today}T${time}:00-03:00`);
  return new Date(base.getTime() + days * 86_400_000);
}

export function getDemoPortal(): ClientPortal {
  const visit = (key: string, days: number, time: string, serviceIndex: number, prof: number) => {
    const service = DEMO_SERVICES[serviceIndex];
    const start = daysFromToday(days, time);
    return {
      id: id(`00000000d${key}`),
      status: "confirmed" as const,
      payment_status: "not_required" as const,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + service.duration_minutes * 60_000).toISOString(),
      service_id: service.id,
      service_name: service.name,
      service_price: service.price,
      professional_name: DEMO_PROFESSIONALS[prof].name,
    };
  };

  return {
    name: "Marcos Vinícius",
    appointments: [
      visit("101", 3, "12:00", 1, 0),
      visit("102", -4, "12:00", 1, 0),
      visit("103", -11, "12:00", 3, 1),
      visit("104", -19, "12:00", 1, 0),
      visit("105", -33, "12:00", 0, 2),
      visit("106", -52, "12:00", 1, 0),
    ],
    subscriptions: [
      {
        id: id("00000000e101"),
        status: "active",
        started_at: daysFromToday(-52, "12:00").toISOString().slice(0, 10),
        renews_at: daysFromToday(8, "12:00").toISOString().slice(0, 10),
        plan_name: DEMO_PLANS[0].name,
        plan_price: DEMO_PLANS[0].price,
        plan_weekdays: DEMO_PLANS[0].weekdays,
      },
    ],
  };
}
