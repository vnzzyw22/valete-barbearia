import { DAY_LABELS, DAY_ORDER } from "@/lib/business-hours";
import type { Weekday } from "@/lib/supabase/types";

// Período de cobrança mostrado no site. Os planos foram passados sem período explícito
// (2026-10-14); mensal é o padrão de assinatura de barbearia — confirmar com o cliente.
export const PLAN_PERIOD_LABEL = "por mês";

// "Segunda a quarta" para dias seguidos; "Segunda, quarta e sexta" para dias soltos.
// null/vazio = sem restrição de dia (retorna null e a interface não mostra nada).
export function formatPlanWeekdays(weekdays: Weekday[] | null): string | null {
  if (!weekdays || weekdays.length === 0) return null;
  const days = DAY_ORDER.filter((d) => weekdays.includes(d));
  if (days.length === 7) return null;

  const idx = days.map((d) => DAY_ORDER.indexOf(d));
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (contiguous && days.length >= 3) {
    return `${DAY_LABELS[days[0]]} a ${DAY_LABELS[days[days.length - 1]].toLowerCase()}`;
  }
  const labels = days.map((d, i) => (i === 0 ? DAY_LABELS[d] : DAY_LABELS[d].toLowerCase()));
  return labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

export function buildPlanMessage(planName: string) {
  return `Olá! Vim pelo site da Valete e quero assinar o plano ${planName}.`;
}
