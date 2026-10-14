"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deletePlan,
  deleteSubscription,
  savePlan,
  saveSubscription,
  type PlanInput,
  type SubscriptionInput,
} from "@/app/admin/(painel)/assinaturas/actions";
import {
  badgeClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  fieldClass,
  labelClass,
  linkDangerClass,
  linkPrimaryClass,
  sectionTitleClass,
} from "@/components/admin/theme";
import { DAY_LABELS, DAY_ORDER } from "@/lib/business-hours";
import { todayISO } from "@/lib/date";
import { formatPrice } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { formatPlanWeekdays } from "@/lib/plans";
import type { AdminPlan, AdminSubscription, SubscriptionStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  cancelled: "Cancelada",
};
const STATUS_TONE: Record<SubscriptionStatus, "green" | "amber" | "neutral"> = {
  active: "green",
  paused: "amber",
  cancelled: "neutral",
};

const thClass = "px-4 py-3 font-nav text-sm font-semibold text-white/40";

function formatDateOnly(date: string | null) {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

const EMPTY_PLAN: PlanInput = {
  name: "",
  description: "",
  price: 0,
  weekdays: [],
  featured: false,
  active: true,
  displayOrder: 0,
};

interface SubscriptionsManagerProps {
  plans: AdminPlan[];
  subscriptions: AdminSubscription[];
}

export function SubscriptionsManager({ plans, subscriptions }: SubscriptionsManagerProps) {
  return (
    <div className="mt-6 flex flex-col gap-12">
      <SubscribersSection plans={plans} subscriptions={subscriptions} />
      <PlansSection plans={plans} />
    </div>
  );
}

function SubscribersSection({ plans, subscriptions }: SubscriptionsManagerProps) {
  const router = useRouter();
  const blank = (): SubscriptionInput => ({
    planId: plans.find((p) => p.active)?.id ?? "",
    clientName: "",
    clientWhatsapp: "",
    status: "active",
    startedAt: todayISO(),
    renewsAt: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SubscriptionInput>(blank);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? "—";

  function openNew() {
    setEditingId(null);
    setForm(blank());
    setFormOpen(true);
    setError(null);
  }

  function openEdit(sub: AdminSubscription) {
    setEditingId(sub.id);
    setForm({
      planId: sub.plan_id,
      clientName: sub.client_name,
      clientWhatsapp: formatPhone(sub.client_whatsapp),
      status: sub.status,
      startedAt: sub.started_at,
      renewsAt: sub.renews_at ?? "",
      notes: sub.notes ?? "",
    });
    setFormOpen(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await saveSubscription(editingId, form);
      if (!result.ok) return setError(result.error);
      setFormOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sub: AdminSubscription) {
    if (!confirm(`Excluir a assinatura de "${sub.client_name}"? Para só encerrar, use a situação "Cancelada".`)) return;
    const result = await deleteSubscription(sub.id);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={sectionTitleClass}>Assinantes</h2>
        {!formOpen && plans.length > 0 && (
          <button type="button" onClick={openNew} className={buttonPrimaryClass}>
            Novo assinante
          </button>
        )}
      </div>
      <p className="max-w-2xl text-sm text-white/50">
        O cliente vê o plano em Minha conta ao entrar com o mesmo WhatsApp cadastrado aqui. O pagamento é combinado
        direto com ele; esta lista é o controle da equipe.
      </p>

      {formOpen && (
        <form onSubmit={handleSubmit} className={`${cardClass} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Cliente</span>
            <input
              required
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>WhatsApp</span>
            <input
              type="tel"
              required
              placeholder="(43) 99999-9999"
              value={form.clientWhatsapp}
              onChange={(e) => setForm({ ...form, clientWhatsapp: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Plano</span>
            <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className={fieldClass}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.active ? "" : " (inativo)"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Início</span>
            <input
              type="date"
              required
              value={form.startedAt}
              onChange={(e) => setForm({ ...form, startedAt: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Próxima renovação</span>
            <input
              type="date"
              value={form.renewsAt}
              onChange={(e) => setForm({ ...form, renewsAt: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Situação</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as SubscriptionStatus })}
              className={fieldClass}
            >
              {(Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <span className={labelClass}>Observação</span>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fieldClass} />
          </label>
          {error && <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-3">{error}</p>}
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
              {submitting ? "Salvando…" : editingId ? "Salvar assinatura" : "Cadastrar assinante"}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className={buttonSecondaryClass}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!formOpen && error && <p className="text-sm text-red-400">{error}</p>}

      {subscriptions.length === 0 ? (
        <p className="text-sm text-white/50">Nenhum assinante cadastrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass}>Cliente</th>
                <th className={thClass}>WhatsApp</th>
                <th className={thClass}>Plano</th>
                <th className={thClass}>Situação</th>
                <th className={thClass}>Renova em</th>
                <th className={`${thClass} text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white">{sub.client_name}</td>
                  <td className="px-4 py-3 text-white/70 tabular-nums">{formatPhone(sub.client_whatsapp)}</td>
                  <td className="px-4 py-3 text-white/70">{planName(sub.plan_id)}</td>
                  <td className="px-4 py-3">
                    <span className={badgeClass(STATUS_TONE[sub.status])}>{STATUS_LABEL[sub.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-white/70 tabular-nums">{formatDateOnly(sub.renews_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(sub)} className={`${linkPrimaryClass} mr-4`}>
                      Editar
                    </button>
                    <button type="button" onClick={() => handleDelete(sub)} className={linkDangerClass}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlansSection({ plans }: { plans: AdminPlan[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PlanInput>(EMPTY_PLAN);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_PLAN, displayOrder: plans.length + 1 });
    setFormOpen(true);
    setError(null);
  }

  function openEdit(plan: AdminPlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      price: Number(plan.price),
      weekdays: plan.weekdays ?? [],
      featured: plan.featured,
      active: plan.active,
      displayOrder: plan.display_order,
    });
    setFormOpen(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await savePlan(editingId, form);
      if (!result.ok) return setError(result.error);
      setFormOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(plan: AdminPlan) {
    if (!confirm(`Excluir o plano "${plan.name}"?`)) return;
    const result = await deletePlan(plan.id);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  function toggleDay(day: (typeof DAY_ORDER)[number]) {
    setForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(day) ? f.weekdays.filter((d) => d !== day) : [...f.weekdays, day],
    }));
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={sectionTitleClass}>Planos</h2>
        {!formOpen && (
          <button type="button" onClick={openNew} className={buttonSecondaryClass}>
            Novo plano
          </button>
        )}
      </div>
      <p className="max-w-2xl text-sm text-white/50">
        Aparecem no site, na seção Assinaturas. O plano em destaque vira a carta grande; os outros ficam na lista ao lado.
      </p>

      {formOpen && (
        <form onSubmit={handleSubmit} className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Nome</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Preço por mês (R$)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={Number.isNaN(form.price) ? "" : form.price}
              onChange={(e) => setForm({ ...form, price: e.target.valueAsNumber })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Descrição (opcional)</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={fieldClass}
            />
          </label>
          <fieldset className="flex flex-col gap-2 sm:col-span-2">
            <legend className={labelClass}>Dias em que vale (nenhum marcado = todos)</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DAY_ORDER.map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm text-white">
                  <input type="checkbox" checked={form.weekdays.includes(day)} onChange={() => toggleDay(day)} />
                  {DAY_LABELS[day]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Ordem de exibição</span>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.valueAsNumber || 0 })}
              className={fieldClass}
            />
          </label>
          <div className="flex flex-wrap items-end gap-6 pb-2">
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Em destaque
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Ativo no site
            </label>
          </div>
          {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
              {submitting ? "Salvando…" : editingId ? "Salvar plano" : "Criar plano"}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className={buttonSecondaryClass}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!formOpen && error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03]">
            <tr>
              <th className={thClass}>Plano</th>
              <th className={thClass}>Dias</th>
              <th className={`${thClass} text-right`}>Preço</th>
              <th className={thClass}>No site</th>
              <th className={`${thClass} text-right`}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-white">
                  {plan.name}
                  {plan.featured && <span className={`${badgeClass("neutral")} ml-2`}>Destaque</span>}
                </td>
                <td className="px-4 py-3 text-white/70">{formatPlanWeekdays(plan.weekdays) ?? "Todos"}</td>
                <td className="px-4 py-3 text-right text-white tabular-nums">{formatPrice(Number(plan.price))}</td>
                <td className="px-4 py-3">
                  <span className={badgeClass(plan.active ? "green" : "neutral")}>{plan.active ? "Ativo" : "Inativo"}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => openEdit(plan)} className={`${linkPrimaryClass} mr-4`}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(plan)} className={linkDangerClass}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
