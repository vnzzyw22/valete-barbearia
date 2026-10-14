import { AppointmentsRevenue } from "@/components/admin/appointments-revenue";
import { FinanceView } from "@/components/admin/finance-view";
import { pageSubtitleClass, pageTitleClass, sectionTitleClass } from "@/components/admin/theme";
import { currentMonthISO, shiftMonth } from "@/lib/date";
import { getAppointmentsForRange, getTransactionsForRange } from "@/lib/supabase/admin-queries";

const TREND_MONTHS = 6;

function lastDayOfMonth(monthISO: string) {
  const [year, month] = monthISO.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export default async function FinanceiroPage(
  props: PageProps<"/admin/financeiro">,
) {
  const searchParams = await props.searchParams;
  const mesParam = searchParams.mes;
  const monthISO =
    (Array.isArray(mesParam) ? mesParam[0] : mesParam) || currentMonthISO();

  // Busca os últimos TREND_MONTHS meses de uma vez (inclui o mês atual) --
  // dá pra montar tanto o extrato do mês selecionado quanto o gráfico de
  // tendência com uma query só.
  const firstTrendMonth = shiftMonth(monthISO, -(TREND_MONTHS - 1));
  const fromDateISO = `${firstTrendMonth}-01`;
  const toDateISO = `${monthISO}-${String(lastDayOfMonth(monthISO)).padStart(2, "0")}`;

  const rangeTransactions = await getTransactionsForRange(
    fromDateISO,
    toDateISO,
  );

  const transactions = rangeTransactions.filter(
    (t) => t.occurred_at.slice(0, 7) === monthISO,
  );

  const monthlyTotals = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const month = shiftMonth(monthISO, -(TREND_MONTHS - 1) + i);
    const monthTx = rangeTransactions.filter(
      (t) => t.occurred_at.slice(0, 7) === month,
    );
    return {
      month,
      income: monthTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      expense: monthTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    };
  });

  // Agendamentos do mês selecionado (fuso fixo -03:00, mesmo do resto do projeto).
  const nextMonthISO = shiftMonth(monthISO, 1);
  const appointments = await getAppointmentsForRange(
    `${monthISO}-01T00:00:00-03:00`,
    `${nextMonthISO}-01T00:00:00-03:00`,
  );

  return (
    <div>
      <h1 className={pageTitleClass}>Financeiro</h1>
      <div className="mt-4 max-w-3xl rounded-lg border border-dashed border-white/25 px-5 py-4 text-sm leading-relaxed text-white/70">
        <p className="font-semibold text-white">Prévia do financeiro</p>
        <p className="mt-1">
          Mostra o essencial: o faturamento que vem dos agendamentos e o caixa lançado à mão. Dá
          para evoluir para algo mais completo, com comissão por barbeiro, formas de pagamento,
          fechamento de caixa do dia, metas e relatório mensal para o contador.
        </p>
      </div>
      <AppointmentsRevenue appointments={appointments} now={new Date()} />
      <h2 className={`${sectionTitleClass} mt-10`}>Caixa (lançamentos manuais)</h2>
      <p className={pageSubtitleClass}>
        Entradas e saídas avulsas: produtos, aluguel, contas. Não é um sistema contábil.
      </p>
      <FinanceView
        monthISO={monthISO}
        transactions={transactions}
        monthlyTotals={monthlyTotals}
      />
    </div>
  );
}
