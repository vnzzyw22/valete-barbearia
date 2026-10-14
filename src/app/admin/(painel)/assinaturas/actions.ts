"use server";

import { revalidatePath } from "next/cache";
import { DAY_ORDER } from "@/lib/business-hours";
import { normalizePhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus, Weekday } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/minha-conta");
  revalidatePath("/admin/assinaturas");
}

export interface PlanInput {
  name: string;
  description: string;
  price: number;
  // Vazio = vale todos os dias (grava null).
  weekdays: Weekday[];
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

function planRow(input: PlanInput) {
  const weekdays = DAY_ORDER.filter((d) => input.weekdays.includes(d));
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    price: input.price,
    weekdays: weekdays.length === 0 || weekdays.length === 7 ? null : weekdays,
    featured: input.featured,
    active: input.active,
    display_order: input.displayOrder,
  };
}

// Só um plano em destaque: marcar um desmarca os outros.
async function clearOtherFeatured(supabase: Awaited<ReturnType<typeof createClient>>, keepId: string) {
  await supabase.from("plans").update({ featured: false }).neq("id", keepId).eq("featured", true);
}

export async function savePlan(id: string | null, input: PlanInput): Promise<ActionResult> {
  if (!input.name.trim()) return { ok: false, error: "Informe o nome do plano." };
  if (!(input.price >= 0)) return { ok: false, error: "Preço inválido." };

  const supabase = await createClient();
  const row = planRow(input);

  if (id) {
    const { error } = await supabase.from("plans").update(row).eq("id", id);
    if (error) {
      console.error("Erro ao salvar plano:", error.message);
      return { ok: false, error: "Não foi possível salvar o plano." };
    }
    if (input.featured) await clearOtherFeatured(supabase, id);
  } else {
    const newId = crypto.randomUUID();
    const { error } = await supabase.from("plans").insert({ id: newId, ...row });
    if (error) {
      console.error("Erro ao criar plano:", error.message);
      return { ok: false, error: "Não foi possível criar o plano." };
    }
    if (input.featured) await clearOtherFeatured(supabase, newId);
  }

  revalidateAll();
  return { ok: true };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) {
    // 23503 (PG ≤17) / 23001 (PG18): há assinantes ligados ao plano (ON DELETE RESTRICT).
    if (error.code === "23503" || error.code === "23001") {
      return { ok: false, error: "Este plano tem assinantes. Desative o plano em vez de excluir." };
    }
    console.error("Erro ao excluir plano:", error.message);
    return { ok: false, error: "Não foi possível excluir o plano." };
  }
  revalidateAll();
  return { ok: true };
}

export interface SubscriptionInput {
  planId: string;
  clientName: string;
  clientWhatsapp: string;
  status: SubscriptionStatus;
  startedAt: string;
  renewsAt: string;
  notes: string;
}

function subscriptionRow(input: SubscriptionInput): { row: Record<string, unknown> } | { error: string } {
  const phone = normalizePhone(input.clientWhatsapp);
  if (!input.clientName.trim()) return { error: "Informe o nome do cliente." };
  if (!phone) return { error: "Informe o WhatsApp com DDD." };
  if (!input.planId) return { error: "Escolha o plano." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startedAt)) return { error: "Informe a data de início." };
  if (input.renewsAt && input.renewsAt < input.startedAt) {
    return { error: "A renovação não pode ser antes do início." };
  }
  return {
    row: {
      plan_id: input.planId,
      client_name: input.clientName.trim(),
      client_whatsapp: phone,
      status: input.status,
      started_at: input.startedAt,
      renews_at: input.renewsAt || null,
      notes: input.notes.trim() || null,
    },
  };
}

export async function saveSubscription(id: string | null, input: SubscriptionInput): Promise<ActionResult> {
  const parsed = subscriptionRow(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("subscriptions").update(parsed.row).eq("id", id)
    : await supabase.from("subscriptions").insert(parsed.row);
  if (error) {
    console.error("Erro ao salvar assinatura:", error.message);
    return { ok: false, error: "Não foi possível salvar a assinatura." };
  }

  revalidateAll();
  return { ok: true };
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) {
    console.error("Erro ao excluir assinatura:", error.message);
    return { ok: false, error: "Não foi possível excluir a assinatura." };
  }
  revalidateAll();
  return { ok: true };
}
