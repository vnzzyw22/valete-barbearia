"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DAY_LABELS, DAY_ORDER } from "@/lib/business-hours";
import type { BusinessHours } from "@/lib/supabase/types";

type Day = (typeof DAY_ORDER)[number];

// Dia e minuto de agora em Brasília (o horário da barbearia), não no fuso de quem visita.
function nowInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = get("weekday").toLowerCase().slice(0, 3) as Day;
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

function openRange(hours: BusinessHours, day: Day) {
  const entry = hours[day];
  return entry && "open" in entry ? entry : null;
}

interface Status {
  today: Day;
  open: boolean;
  label: string;
}

function computeStatus(hours: BusinessHours): Status {
  const { day, minutes } = nowInSaoPaulo();
  const range = openRange(hours, day);
  if (range && minutes >= toMinutes(range.open) && minutes < toMinutes(range.close)) {
    return { today: day, open: true, label: `Aberto agora · fecha às ${range.close}` };
  }
  if (range && minutes < toMinutes(range.open)) {
    return { today: day, open: false, label: `Fechado agora · abre hoje às ${range.open}` };
  }
  // Próximo dia com expediente.
  const start = DAY_ORDER.indexOf(day);
  for (let step = 1; step <= 7; step++) {
    const next = DAY_ORDER[(start + step) % 7];
    const nextRange = openRange(hours, next);
    if (nextRange) {
      const when = step === 1 ? "amanhã" : DAY_LABELS[next].toLowerCase();
      return { today: day, open: false, label: `Fechado agora · abre ${when} às ${nextRange.open}` };
    }
  }
  return { today: day, open: false, label: "Fechado agora" };
}

// Calculado só no navegador (depende da hora): no HTML do servidor a tabela vem sem destaque.
function useStatus(hours: BusinessHours) {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    const update = () => setStatus(computeStatus(hours));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [hours]);
  return status;
}

// Selo "Aberto agora · fecha às 20:00", com o ponto pulsando quando está aberto.
export function OpenNowBadge({ hours }: { hours: BusinessHours }) {
  const status = useStatus(hours);
  return (
    <p className="mt-6 inline-flex min-h-9 items-center gap-2.5 rounded-full border border-white/15 px-4 text-[14px] font-semibold text-white" aria-live="polite">
      {status ? (
        <>
          <span className="relative flex size-2.5" aria-hidden="true">
            {status.open && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-latao opacity-70 motion-reduce:animate-none" />
            )}
            <span className={`relative inline-flex size-2.5 rounded-full ${status.open ? "bg-latao" : "bg-white/35"}`} />
          </span>
          {status.label}
        </>
      ) : (
        <span className="text-cinza">Horário de hoje</span>
      )}
    </p>
  );
}

// Tabela de horário com o dia de hoje aceso e as linhas entrando em sequência.
export function HoursTable({ hours }: { hours: BusinessHours }) {
  const status = useStatus(hours);
  const days = DAY_ORDER.filter((day) => hours[day]);
  return (
    <dl className="mt-4 border-t border-ardosia">
      {days.map((day, i) => {
        const range = openRange(hours, day);
        const isToday = status?.today === day;
        return (
          <motion.div
            key={day}
            className={`relative flex items-baseline justify-between gap-6 border-b border-ardosia py-3 transition-colors duration-500 ${
              isToday ? "bg-latao/[0.07]" : ""
            }`}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <dt className={`flex items-center gap-2 text-[15px] ${isToday ? "font-semibold text-white" : "text-cinza"}`}>
              {isToday && <span aria-hidden="true" className="size-1.5 rounded-full bg-latao" />}
              {DAY_LABELS[day]}
              {isToday && <span className="sr-only">(hoje)</span>}
            </dt>
            <dd className={`text-[15px] tabular-nums ${range ? "text-white" : "text-cinza"} ${isToday ? "font-semibold" : ""}`}>
              {range ? `${range.open} – ${range.close}` : "Fechado"}
            </dd>
          </motion.div>
        );
      })}
    </dl>
  );
}
