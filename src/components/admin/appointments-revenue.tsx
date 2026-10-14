import { cardClass, sectionTitleClass } from "@/components/admin/theme";
import { formatPrice } from "@/lib/format";
import type { AdminAppointment } from "@/lib/supabase/types";

interface Row {
  name: string;
  count: number;
  total: number;
}

function groupBy(list: AdminAppointment[], key: (a: AdminAppointment) => string): Row[] {
  const map = new Map<string, Row>();
  for (const a of list) {
    const name = key(a);
    const row = map.get(name) ?? { name, count: 0, total: 0 };
    row.count += 1;
    row.total += a.service?.price ?? 0;
    map.set(name, row);
  }
  return [...map.values()].sort((x, y) => y.total - x.total);
}

function Breakdown({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className={cardClass}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">Nenhum atendimento realizado no mês.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-white/50">
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 text-right font-medium">Atend.</th>
              <th className="pb-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/10">
                <td className="py-2 text-white">{r.name}</td>
                <td className="py-2 text-right tabular-nums text-white/70">{r.count}</td>
                <td className="py-2 text-right tabular-nums text-white">{formatPrice(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Faturamento do mês calculado direto dos agendamentos (nada é digitado aqui).
// "Realizado" = confirmado e já aconteceu; "previsto" = pendente ou confirmado ainda por vir.
export function AppointmentsRevenue({ appointments, now }: { appointments: AdminAppointment[]; now: Date }) {
  const done = appointments.filter((a) => a.status === "confirmed" && new Date(a.ends_at) <= now);
  const upcoming = appointments.filter((a) => a.status !== "cancelled" && new Date(a.ends_at) > now);
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const sum = (list: AdminAppointment[]) => list.reduce((s, a) => s + (a.service?.price ?? 0), 0);
  const revenue = sum(done);
  const ticket = done.length ? revenue / done.length : 0;

  const stats = [
    { label: "Faturado (realizado)", value: formatPrice(revenue), hint: `${done.length} atendimento${done.length === 1 ? "" : "s"}` },
    { label: "Ticket médio", value: formatPrice(ticket), hint: "por atendimento realizado" },
    { label: "Previsto até o fim do mês", value: formatPrice(sum(upcoming)), hint: `${upcoming.length} agendado${upcoming.length === 1 ? "" : "s"}` },
    { label: "Cancelados", value: String(cancelled), hint: "no mês" },
  ];

  return (
    <section className="mt-8">
      <h2 className={sectionTitleClass}>Pelos agendamentos</h2>
      <p className="mt-1 text-sm text-white/50">
        Calculado automaticamente com o preço atual de cada serviço.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cardClass}>
            <p className="text-sm text-white/50">{s.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{s.value}</p>
            <p className="mt-1 text-xs text-white/40">{s.hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Breakdown title="Por profissional" rows={groupBy(done, (a) => a.professional?.name ?? "Sem profissional")} />
        <Breakdown title="Por serviço" rows={groupBy(done, (a) => a.service?.name ?? "Serviço removido")} />
      </div>
    </section>
  );
}
