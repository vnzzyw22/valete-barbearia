import { DEMO_PLANS, DEMO_PROFESSIONALS, DEMO_SERVICES } from "@/lib/demo-data";
import type {
  AdminAppointment,
  AdminClient,
  AdminPlan,
  AdminProfessional,
  AdminService,
  AdminSubscription,
  AdminTransaction,
  AppointmentStatus,
} from "@/lib/supabase/types";

// PAINEL DA VITRINE (prévia sem banco): os mesmos dados fictícios de
// scripts/local-db/test-data.sql, gerados em memória. As datas são relativas a hoje, então a
// agenda sempre parece "viva"; as escolhas usam hash fixo para não mudar a cada visita.
// Nada é gravado: as ações do painel falham com aviso (ver src/app/admin/(painel)/layout.tsx).

const id = (suffix: string) => `00000000-0000-0000-0000-${suffix}`;
const DAY = 86_400_000;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Data de hoje em Brasília (AAAA-MM-DD) e um instante "dia + hora" em Brasília.
function todaySP() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function atSP(dateISO: string, time: string) {
  return new Date(`${dateISO}T${time}:00-03:00`);
}
function addDays(dateISO: string, days: number) {
  return new Date(atSP(dateISO, "12:00").getTime() + days * DAY).toISOString().slice(0, 10);
}

const CLIENT_NAMES: [string, string | null][] = [
  ["Marcos Vinícius", "Prefere degradê baixo."],
  ["João Pedro Lima", null],
  ["Gabriel Souza", null],
  ["Felipe Andrade", "Alergia a pós-barba com álcool."],
  ["Lucas Ferreira", null],
  ["Matheus Rocha", null],
  ["Pedro Henrique", null],
  ["Rodrigo Alves", null],
  ["André Martins", null],
  ["Caio Ribeiro", null],
  ["Vinícius Costa", null],
  ["Leonardo Dias", null],
  ["Henrique Barros", null],
  ["Eduardo Nunes", null],
  ["Gustavo Pires", null],
  ["Renato Cardoso", null],
  ["Samuel Teixeira", null],
  ["Igor Mendes", null],
  ["Daniel Moreira", null],
  ["Otávio Freitas", null],
];

export function demoClients(): AdminClient[] {
  const today = todaySP();
  return CLIENT_NAMES.map(([name, notes], i) => {
    const n = i + 1;
    const whatsapp =
      n === 1
        ? "(43) 90000-0001"
        : `(43) 9${String(1000 + n).padStart(4, "0")}-${String((n * 37) % 10000).padStart(4, "0")}`;
    return {
      id: id(`0000000c${String(n).padStart(4, "0")}`),
      name,
      whatsapp,
      notes,
      created_at: atSP(addDays(today, -60 - n * 3), "10:00").toISOString(),
    };
  });
}

export function demoServices(): AdminService[] {
  return DEMO_SERVICES.map((s, i) => ({ ...s, active: true, display_order: i + 1 }));
}

export function demoProfessionals(): AdminProfessional[] {
  return DEMO_PROFESSIONALS.map((p, i) => ({ ...p, active: true, display_order: i + 1 }));
}

export function demoPlans(): AdminPlan[] {
  return DEMO_PLANS.map((p, i) => ({ ...p, active: true, display_order: i + 1 }));
}

const SLOTS = ["08:30", "09:30", "10:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30"];
const SERVICE_BY_SHARE = ["0000000005a1", "0000000005a3", "0000000005a2", "0000000005a4", "0000000005a5", "0000000005a6"];
const SHARE_LIMITS = [34, 55, 72, 84, 92, 97];

function buildAppointments(): AdminAppointment[] {
  const today = todaySP();
  const now = Date.now();
  const clients = demoClients();
  const services = new Map(DEMO_SERVICES.map((s) => [s.id, s]));
  const list: AdminAppointment[] = [];

  const push = (key: string, start: Date, serviceId: string, profIndex: number, clientIndex: number, status: AppointmentStatus) => {
    const service = services.get(serviceId)!;
    const client = clients[clientIndex];
    const prof = DEMO_PROFESSIONALS[profIndex];
    list.push({
      id: id(`a${String(hash(key)).padStart(11, "0").slice(-11)}`),
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + service.duration_minutes * 60_000).toISOString(),
      status,
      notes: null,
      hair_length: null,
      payment_status: "not_required",
      deposit_amount: null,
      reservation_expires_at: null,
      payment_claimed_at: null,
      payment_confirmed_at: null,
      payment_confirmed_by: null,
      client: { id: client.id, name: client.name, whatsapp: client.whatsapp },
      service: { id: service.id, name: service.name, price: service.price },
      professional: { id: prof.id, name: prof.name },
    });
  };

  for (let d = -60; d <= 10; d++) {
    const day = addDays(today, d);
    const dow = atSP(day, "12:00").getUTCDay();
    if (dow === 0) continue;
    for (let p = 0; p < 4; p++) {
      for (const slot of SLOTS) {
        // funcionamento: seg 10–18; ter–sex 9–20; sáb 8:30–18
        if (dow === 1 && (slot < "10:00" || slot > "17:00")) continue;
        if (dow >= 2 && dow <= 5 && (slot < "09:00" || slot > "19:00")) continue;
        if (dow === 6 && slot > "17:00") continue;
        const h = hash(`${day}-${p}-${slot}`);
        if (h % 100 >= (d < 0 ? 62 : 45)) continue;
        const share = h % 97;
        const serviceId = id(SERVICE_BY_SHARE[SHARE_LIMITS.findIndex((limit) => share < limit)] ?? SERVICE_BY_SHARE[5]);
        const start = atSP(day, slot);
        const status: AppointmentStatus =
          start.getTime() < now
            ? h % 89 < 7
              ? "cancelled"
              : "confirmed"
            : h % 89 < 50
              ? "confirmed"
              : h % 89 < 56
                ? "cancelled"
                : "pending";
        push(`${day}-${p}-${slot}`, start, serviceId, p, 1 + (h % 19), status);
      }
    }
  }

  // Histórico do cliente da demonstração (12:00, horário que a agenda deixa livre).
  const own: [number, string, number, AppointmentStatus][] = [
    [3, "0000000005a3", 0, "confirmed"],
    [-4, "0000000005a3", 0, "confirmed"],
    [-11, "0000000005a4", 1, "confirmed"],
    [-19, "0000000005a3", 0, "confirmed"],
    [-26, "0000000005a6", 2, "confirmed"],
    [-33, "0000000005a1", 0, "cancelled"],
    [-47, "0000000005a3", 0, "confirmed"],
  ];
  for (const [offset, svc, prof, status] of own) {
    let day = addDays(today, offset);
    if (atSP(day, "12:00").getUTCDay() === 0) day = addDays(day, 1);
    push(`own-${offset}`, atSP(day, "12:00"), id(svc), prof, 0, status);
  }

  return list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function demoAppointmentsForRange(fromISO: string, toISO: string): AdminAppointment[] {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  return buildAppointments().filter(
    (a) => new Date(a.starts_at).getTime() < to && new Date(a.ends_at).getTime() > from,
  );
}

export function demoSubscriptions(): AdminSubscription[] {
  const today = todaySP();
  const clients = demoClients();
  const rows: [number, string, AdminSubscription["status"], number, number, string | null][] = [
    [1, "0000000001a3", "active", 52, 8, null],
    [3, "0000000001a3", "active", 95, 25, null],
    [4, "0000000001a1", "active", 40, 20, null],
    [6, "0000000001a2", "active", 15, 15, null],
    [9, "0000000001a1", "active", 70, 21, null],
    [12, "0000000001a3", "paused", 120, 30, "Viajando até o fim do mês."],
    [15, "0000000001a2", "active", 33, 27, null],
    [18, "0000000001a1", "cancelled", 150, 0, null],
  ];
  return rows.map(([n, plan, status, since, renew, notes]) => {
    const client = clients[n - 1];
    return {
      id: id(`00000000e${String(n).padStart(3, "0")}`),
      plan_id: id(plan),
      client_name: client.name,
      client_whatsapp: (client.whatsapp ?? "").replace(/\D/g, ""),
      status,
      started_at: addDays(today, -since),
      renews_at: status === "cancelled" ? null : addDays(today, renew),
      notes,
    };
  });
}

const CASH: [AdminTransaction["type"], string, number, string, number][] = [
  ["income", "Assinaturas", 820, "Mensalidades recebidas no mês", 5],
  ["income", "Produtos", 310, "Pomadas e óleos para barba", 18],
  ["expense", "Aluguel", 1800, "Aluguel do ponto", 9],
  ["expense", "Energia", 340, "Conta de luz", 14],
  ["expense", "Estoque", 460, "Lâminas, toalhas e produtos", 20],
  ["expense", "Internet", 120, "Plano de internet", 11],
];

export function demoTransactionsForRange(fromDateISO: string, toDateISO: string): AdminTransaction[] {
  const today = todaySP();
  const [y, m] = today.split("-").map(Number);
  const list: AdminTransaction[] = [];
  for (let back = 0; back < 6; back++) {
    const date = new Date(Date.UTC(y, m - 1 - back, 1));
    const month = date.toISOString().slice(0, 7);
    for (const [type, category, base, description, day] of CASH) {
      const occurred = `${month}-${String(day).padStart(2, "0")}`;
      if (occurred > today) continue;
      const factor = 0.9 + (hash(category + back) % 20) / 100;
      list.push({
        id: id(`0000000f${String(back)}${String(CASH.findIndex((c) => c[1] === category)).padStart(3, "0")}`),
        type,
        category,
        amount: Math.round(base * factor * 100) / 100,
        description,
        occurred_at: occurred,
      });
    }
  }
  return list
    .filter((t) => t.occurred_at >= fromDateISO && t.occurred_at <= toDateISO)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}
