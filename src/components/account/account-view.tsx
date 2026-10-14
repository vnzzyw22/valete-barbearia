import Link from "next/link";
import { signOutClient } from "@/app/minha-conta/actions";
import { CardIndex } from "@/components/site/card-index";
import { PlayingCard } from "@/components/site/playing-card";
import { buttonPrimary, textLink } from "@/components/site/ui";
import { formatPhone } from "@/lib/phone";
import { appointmentStatusInfo } from "@/lib/deposit";
import { formatPrice } from "@/lib/format";
import { formatPlanWeekdays, PLAN_PERIOD_LABEL } from "@/lib/plans";
import type { ClientPortal, PortalAppointment, PortalSubscription } from "@/lib/supabase/client-portal";
import { getWhatsappLink } from "@/lib/whatsapp";

const TIMEZONE = "America/Sao_Paulo";

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDayLong(iso: string) {
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, weekday: "long", day: "numeric", month: "long" }).format(
      new Date(iso),
    ),
  );
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

// Datas sem hora (started_at/renews_at): meio-dia em Brasília evita virar o dia anterior.
function formatDateOnly(date: string) {
  return formatShortDate(`${date}T12:00:00-03:00`);
}

function formatMonthYear(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, month: "long", year: "numeric" }).format(new Date(iso));
}

function icsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Arquivo .ics como data URL: "Adicionar à agenda" funciona no celular e no computador sem rota extra.
function calendarHref(appointment: PortalAppointment, businessName: string, address: string | null) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Valete Barbearia//Minha conta//PT",
    "BEGIN:VEVENT",
    `UID:${appointment.id}@valete`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(appointment.starts_at)}`,
    `DTEND:${icsDate(appointment.ends_at)}`,
    `SUMMARY:${appointment.service_name} na ${businessName}`,
    ...(address ? [`LOCATION:${address.replace(/[,;]/g, (c) => `\\${c}`)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

function isRealized(a: PortalAppointment, now: number) {
  return a.status === "confirmed" && new Date(a.starts_at).getTime() < now;
}

// Início do ciclo atual do plano: um mês antes da renovação; sem renovação, a data de início.
function cycleStart(sub: PortalSubscription) {
  if (!sub.renews_at) return new Date(`${sub.started_at}T00:00:00-03:00`);
  const d = new Date(`${sub.renews_at}T00:00:00-03:00`);
  d.setMonth(d.getMonth() - 1);
  return d;
}

const SUBSCRIPTION_STATUS: Record<PortalSubscription["status"], string> = {
  active: "Ativo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const sectionHeading = "font-display text-[clamp(1.5rem,2.4vw,1.875rem)] leading-tight font-extrabold text-white";

interface AccountViewProps {
  portal: ClientPortal;
  phone: string;
  business: { name: string; whatsapp: string | null; address: string | null };
  now: number;
}

export function AccountView({ portal, phone, business, now }: AccountViewProps) {
  const firstName = portal.name?.replace(/^\[TESTE\]\s*/, "").split(/\s+/)[0] ?? null;
  const upcoming = portal.appointments
    .filter((a) => a.status !== "cancelled" && new Date(a.ends_at).getTime() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const history = portal.appointments.filter((a) => new Date(a.ends_at).getTime() <= now || a.status === "cancelled");
  const realized = portal.appointments.filter((a) => isRealized(a, now));
  const firstVisit = realized.length > 0 ? realized[realized.length - 1].starts_at : null;
  const next = upcoming[0] ?? null;
  const subscription = portal.subscriptions[0] ?? null;

  const rescheduleHref = next
    ? getWhatsappLink(
        business.whatsapp,
        `Olá! Preciso remarcar ou cancelar meu horário de ${formatDayLong(next.starts_at).toLowerCase()} às ${formatTime(next.starts_at)} (${next.service_name}).`,
      )
    : null;

  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold tracking-[-0.02em] text-white">
            {firstName ? `Olá, ${firstName}` : "Minha conta"}
          </h1>
          <p className="mt-4 text-[17px] text-cinza">
            {realized.length > 0
              ? `${realized.length} ${realized.length === 1 ? "visita" : "visitas"} desde ${formatMonthYear(firstVisit!)}.`
              : "Nenhuma visita registrada ainda."}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 text-[15px] text-cinza">
            <span className="tabular-nums">{formatPhone(phone)}</span>
            <form action={signOutClient}>
              <button
                type="submit"
                className="min-h-11 font-semibold text-white underline decoration-white/30 underline-offset-[5px] hover:decoration-white"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <Link href="/agendar" className={`${buttonPrimary} self-start md:self-auto`}>
          Agendar horário
        </Link>
      </header>

      <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
        <section aria-labelledby="proximo-titulo" className="lg:col-span-7">
          <h2 id="proximo-titulo" className={sectionHeading}>
            Próximo horário
          </h2>
          {next ? (
            <div className="mt-6 border-t border-ardosia pt-6">
              <p className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.05] font-extrabold text-white">
                {formatDayLong(next.starts_at)}
              </p>
              <p className="mt-1 text-[clamp(1.25rem,2vw,1.5rem)] font-semibold text-white tabular-nums">
                {formatTime(next.starts_at)}–{formatTime(next.ends_at)}
              </p>
              <p className="mt-4 text-[17px] text-cinza">
                {next.service_name}
                {next.professional_name ? ` com ${next.professional_name.replace(/^\[TESTE\]\s*/, "")}` : ""}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-white">{appointmentStatusInfo(next).label}</p>
              {next.status === "pending" && next.payment_status === "awaiting_payment" && (
                <Link href={`/agendar/pagamento/${next.id}`} className={`${textLink} mt-2`}>
                  Pagar o sinal
                </Link>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-1">
                <a href={calendarHref(next, business.name, business.address)} download="valete-horario.ics" className={textLink}>
                  Adicionar à agenda
                </a>
                {rescheduleHref && (
                  <a href={rescheduleHref} target="_blank" rel="noopener noreferrer" className={textLink}>
                    Remarcar pelo WhatsApp
                  </a>
                )}
              </div>
              {upcoming.length > 1 && (
                <ul className="mt-8 border-t border-ardosia">
                  {upcoming.slice(1).map((a) => (
                    <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ardosia py-4">
                      <span className="text-[17px] text-white">
                        {formatDayLong(a.starts_at)}, {formatTime(a.starts_at)}
                      </span>
                      <span className="text-[15px] text-cinza">{a.service_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="mt-6 border-t border-ardosia pt-6">
              <p className="max-w-[40ch] text-[17px] leading-relaxed text-cinza">Você não tem horário marcado.</p>
              <Link href="/agendar" className={`${textLink} mt-3`}>
                Escolher um horário
              </Link>
            </div>
          )}
        </section>

        <section aria-labelledby="plano-titulo" className="lg:col-span-5">
          <h2 id="plano-titulo" className={sectionHeading}>
            Seu plano
          </h2>
          {subscription ? (
            <PlanSummary subscription={subscription} realized={realized} />
          ) : (
            <div className="mt-6 border-t border-ardosia pt-6">
              <p className="max-w-[40ch] text-[17px] leading-relaxed text-cinza">
                Você ainda não assina um plano. Com a assinatura, o corte e a barba têm valor fixo todo mês.
              </p>
              <Link href="/#assinaturas" className={`${textLink} mt-3`}>
                Ver as assinaturas
              </Link>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="historico-titulo">
        <h2 id="historico-titulo" className={sectionHeading}>
          Histórico
        </h2>
        {history.length === 0 ? (
          <p className="mt-6 border-t border-ardosia pt-6 text-[17px] text-cinza">Seus atendimentos vão aparecer aqui.</p>
        ) : (
          <ul className="mt-6 border-t border-ardosia">
            {history.map((a) => {
              const cancelled = a.status === "cancelled";
              const notConfirmed = !cancelled && a.status !== "confirmed";
              return (
                <li
                  key={a.id}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-ardosia py-5 md:grid-cols-[8rem_1fr_auto_auto]"
                >
                  <span className="text-[15px] text-cinza tabular-nums md:col-start-1 md:row-start-1">
                    {formatShortDate(a.starts_at)}
                  </span>
                  <span className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
                    <span className={cancelled ? "text-cinza line-through decoration-white/30" : "text-white"}>
                      <span className="text-[17px] font-semibold">{a.service_name}</span>
                      {a.professional_name && (
                        <span className="text-[15px] text-cinza"> com {a.professional_name.replace(/^\[TESTE\]\s*/, "")}</span>
                      )}
                    </span>
                    {(cancelled || notConfirmed) && (
                      <span className="ml-3 text-[15px] text-cinza">
                        {cancelled ? appointmentStatusInfo(a).label : "Não confirmado"}
                      </span>
                    )}
                  </span>
                  <span className="text-right text-[15px] text-cinza tabular-nums md:col-start-3 md:row-start-1">
                    {formatPrice(a.service_price)}
                  </span>
                  <Link
                    href={`/agendar?servico=${a.service_id}`}
                    className="col-span-2 mt-1 justify-self-start text-[15px] font-semibold text-white underline decoration-white/30 underline-offset-[5px] hover:decoration-white md:col-span-1 md:col-start-4 md:row-start-1 md:mt-0"
                  >
                    Agendar de novo
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function PlanSummary({ subscription, realized }: { subscription: PortalSubscription; realized: PortalAppointment[] }) {
  const start = cycleStart(subscription).getTime();
  const inCycle = realized.filter((a) => new Date(a.starts_at).getTime() >= start).length;
  const days = formatPlanWeekdays(subscription.plan_weekdays);

  return (
    <div className="mt-6 flex flex-col gap-6 border-t border-ardosia pt-6 sm:flex-row sm:items-start">
      {/* A mesma carta da seção Assinaturas, em tamanho de bolso (vira e inclina igual). */}
      <PlayingCard className="w-[170px] shrink-0" radius="rounded-[14px]" restTilt={-2}>
      <div className="relative flex aspect-[5/7] w-full shrink-0 flex-col justify-center rounded-[14px] bg-white px-5 pt-12 pb-10 text-carvao">
        <CardIndex tone="face" className="absolute top-3 left-3 scale-75" />
        <CardIndex tone="face" className="absolute right-3 bottom-3 scale-75 rotate-180" />
        <p className="font-display text-[17px] leading-[1.05] font-extrabold">{subscription.plan_name}</p>
        <p className="mt-3 text-[15px] font-semibold tabular-nums">{formatPrice(subscription.plan_price)}</p>
        <p className="text-[13px] text-carvao/70">{PLAN_PERIOD_LABEL}</p>
      </div>
      </PlayingCard>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
        <dt className="text-cinza">Situação</dt>
        <dd className="font-semibold text-white">{SUBSCRIPTION_STATUS[subscription.status]}</dd>
        {days && (
          <>
            <dt className="text-cinza">Vale</dt>
            <dd className="text-white">{days}</dd>
          </>
        )}
        <dt className="text-cinza">Desde</dt>
        <dd className="text-white tabular-nums">{formatDateOnly(subscription.started_at)}</dd>
        {subscription.renews_at && (
          <>
            <dt className="text-cinza">Renova em</dt>
            <dd className="text-white tabular-nums">{formatDateOnly(subscription.renews_at)}</dd>
          </>
        )}
        <dt className="text-cinza">Neste ciclo</dt>
        <dd className="text-white tabular-nums">
          {inCycle} {inCycle === 1 ? "atendimento" : "atendimentos"}
        </dd>
      </dl>
    </div>
  );
}
