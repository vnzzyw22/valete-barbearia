import { getDemoPortal } from "@/lib/demo-data";
import { isSupabaseConfigured } from "./config";
import { createServiceClient } from "./service";
import type { AppointmentStatus, PaymentStatus, SubscriptionStatus, Weekday } from "./types";

// Dados da "Minha conta" de UM telefone (nacional, já validado pela sessão do cliente).
// clients não é deduplicado — cada agendamento cria um registro —, então a view client_phones
// liga o telefone a todos os registros daquela pessoa.

export interface PortalAppointment {
  id: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  starts_at: string;
  ends_at: string;
  service_id: string;
  service_name: string;
  service_price: number;
  professional_name: string | null;
}

export interface PortalSubscription {
  id: string;
  status: SubscriptionStatus;
  started_at: string;
  renews_at: string | null;
  plan_name: string;
  plan_price: number;
  plan_weekdays: Weekday[] | null;
}

export interface ClientPortal {
  name: string | null;
  appointments: PortalAppointment[];
  subscriptions: PortalSubscription[];
}

interface AppointmentRow {
  id: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  starts_at: string;
  ends_at: string;
  service_id: string;
  service: { name: string; price: number } | null;
  professional: { name: string } | null;
}

interface SubscriptionRow {
  id: string;
  status: SubscriptionStatus;
  started_at: string;
  renews_at: string | null;
  client_name: string;
  plan: { name: string; price: number; weekdays: Weekday[] | null } | null;
}

export async function getClientPortal(phone: string): Promise<ClientPortal | null> {
  // Vitrine sem banco: qualquer telefone vê a conta de exemplo.
  if (!isSupabaseConfigured) return getDemoPortal();
  const supabase = createServiceClient();
  if (!supabase) return null;

  // Reservas de sinal vencidas viram canceladas antes da leitura (mesma regra do painel).
  await supabase.rpc("release_expired_reservations");

  const [clientsRes, subsRes] = await Promise.all([
    supabase
      .from("client_phones")
      .select("client_id, name, created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("id, status, started_at, renews_at, client_name, plan:plans(name, price, weekdays)")
      .eq("client_whatsapp", phone)
      .neq("status", "cancelled")
      .order("started_at", { ascending: false })
      .returns<SubscriptionRow[]>(),
  ]);

  if (clientsRes.error || subsRes.error) {
    console.error("Erro ao montar a Minha conta:", clientsRes.error?.message ?? subsRes.error?.message);
    return null;
  }

  const clientIds = (clientsRes.data ?? []).map((c) => c.client_id as string);
  let appointments: PortalAppointment[] = [];
  if (clientIds.length > 0) {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, status, payment_status, starts_at, ends_at, service_id, service:services(name, price), professional:professionals(name)",
      )
      .in("client_id", clientIds)
      .order("starts_at", { ascending: false })
      .limit(50)
      .returns<AppointmentRow[]>();
    if (error) {
      console.error("Erro ao buscar agendamentos da Minha conta:", error.message);
      return null;
    }
    appointments = (data ?? []).map((a) => ({
      id: a.id,
      status: a.status,
      payment_status: a.payment_status,
      starts_at: a.starts_at,
      ends_at: a.ends_at,
      service_id: a.service_id,
      service_name: a.service?.name ?? "Serviço",
      service_price: Number(a.service?.price ?? 0),
      professional_name: a.professional?.name ?? null,
    }));
  }

  return {
    // Sem agendamento ainda, o nome vem do cadastro da assinatura.
    name: (clientsRes.data?.[0]?.name as string | undefined) ?? subsRes.data?.[0]?.client_name ?? null,
    appointments,
    subscriptions: (subsRes.data ?? [])
      .filter((s) => s.plan)
      .map((s) => ({
        id: s.id,
        status: s.status,
        started_at: s.started_at,
        renews_at: s.renews_at,
        plan_name: s.plan!.name,
        plan_price: Number(s.plan!.price),
        plan_weekdays: s.plan!.weekdays,
      })),
  };
}
