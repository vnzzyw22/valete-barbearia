import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { buildPlanMessage, formatPlanWeekdays, PLAN_PERIOD_LABEL } from "@/lib/plans";
import type { Plan } from "@/lib/supabase/types";
import { getWhatsappLink } from "@/lib/whatsapp";
import { CardIndex } from "./card-index";
import { RuledItem, TitleReveal } from "./motion";
import { PlayingCard } from "./playing-card";
import { container, sectionTitle } from "./ui";

interface PlansSectionProps {
  plans: Plan[];
  whatsapp: string | null;
}

// Assinaturas (DESIGN.md > Assinaturas): o plano em destaque é uma carta de baralho de verdade —
// face branca, índice nos dois cantos — e é o único bloco branco da página. Os demais planos
// ficam quietos, na mesma lista tabular de Serviços. Tudo vem de `plans` (painel → Assinaturas).
// Sem cobrança online: o botão abre o WhatsApp e a equipe ativa o plano.
export function PlansSection({ plans, whatsapp }: PlansSectionProps) {
  if (plans.length === 0) return null;

  const lead = plans.find((p) => p.featured) ?? plans[0];
  const rest = plans.filter((p) => p.id !== lead.id);
  const subscribeHref = (plan: Plan) => getWhatsappLink(whatsapp, buildPlanMessage(plan.name));
  const leadHref = subscribeHref(lead);
  const leadDays = formatPlanWeekdays(lead.weekdays);

  return (
    <section
      id="assinaturas"
      aria-labelledby="assinaturas-titulo"
      className="scroll-mt-[72px] overflow-hidden bg-ink py-20 md:py-32"
    >
      <div className={`${container} grid gap-x-10 gap-y-12 lg:grid-cols-12`}>
        <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1">
          <h2 id="assinaturas-titulo" className={sectionTitle}>
            <TitleReveal>Assinaturas</TitleReveal>
          </h2>
          <p className="mt-5 max-w-[36ch] text-[17px] leading-relaxed text-cinza">
            Valor fixo todo mês para manter o corte e a barba em dia.
          </p>
        </div>

        <PlayingCard className="mx-auto w-full max-w-[400px] lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:max-w-[440px] lg:self-start">
        <article
          aria-labelledby="plano-destaque"
          className="relative flex aspect-[5/7] w-full flex-col rounded-[22px] bg-white text-carvao"
        >
          <CardIndex tone="face" className="absolute top-6 left-6" />
          <CardIndex tone="face" className="absolute right-6 bottom-6 rotate-180" />

          <div className="flex flex-1 flex-col justify-center px-[clamp(44px,4vw,56px)] py-16">
            <h3
              id="plano-destaque"
              className="font-display max-w-[11ch] text-[clamp(1.875rem,3vw,2.5rem)] leading-[0.98] font-extrabold tracking-[-0.01em]"
            >
              {lead.name}
            </h3>
            {(lead.description || leadDays) && (
              <p className="mt-4 max-w-[28ch] text-[16px] leading-snug text-carvao/70">
                {[leadDays, lead.description].filter(Boolean).join(". ")}
              </p>
            )}

            <p className="font-display mt-10 text-[clamp(2.5rem,3.6vw,3rem)] leading-none font-extrabold tracking-[-0.02em] tabular-nums">
              {formatPrice(lead.price)}
            </p>
            <p className="mt-2 text-[15px] text-carvao/70">{PLAN_PERIOD_LABEL}</p>

            {leadHref && (
              <a
                href={leadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex min-h-11 items-center justify-center self-start rounded-full bg-carvao px-7 py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-carvao/85 focus-visible:outline-carvao"
              >
                Assinar pelo WhatsApp
              </a>
            )}
          </div>
        </article>
        </PlayingCard>

        <div className="lg:col-span-6 lg:col-start-7 lg:row-start-2">
          {rest.length > 0 && (
            <ul className="border-t border-ardosia">
              {rest.map((plan, index) => {
                const href = subscribeHref(plan);
                const days = formatPlanWeekdays(plan.weekdays);
                const body = (
                  <>
                    <span className="min-w-0">
                      <span className="block text-[clamp(1.25rem,1.8vw,1.5rem)] leading-tight font-bold [font-stretch:112%] text-white">
                        {plan.name}
                      </span>
                      {(days || plan.description) && (
                        <span className="mt-1.5 block max-w-[40ch] text-[15px] leading-relaxed text-cinza">
                          {[days, plan.description].filter(Boolean).join(". ")}
                        </span>
                      )}
                    </span>
                    <span className="text-right">
                      <span className="block text-[clamp(1.25rem,1.8vw,1.5rem)] font-semibold text-white tabular-nums">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="block text-[15px] text-cinza">{PLAN_PERIOD_LABEL}</span>
                    </span>
                    {href && (
                      <span className="col-span-2 text-[15px] font-semibold text-white underline decoration-white/30 underline-offset-[5px] group-hover:decoration-white sm:col-span-1">
                        Assinar
                      </span>
                    )}
                  </>
                );
                const rowClass =
                  "-mx-4 grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-3 rounded-sm px-4 py-6 sm:grid-cols-[1fr_auto_auto] md:py-7";
                return (
                  <RuledItem key={plan.id} index={index}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group ${rowClass} transition-colors duration-200 hover:bg-grafite`}
                      >
                        {body}
                      </a>
                    ) : (
                      <div className={rowClass}>{body}</div>
                    )}
                  </RuledItem>
                );
              })}
            </ul>
          )}

          <p className="mt-8 max-w-[52ch] text-[15px] leading-relaxed text-cinza">
            A equipe ativa o plano depois de combinar o pagamento com você. Depois é só agendar pelo site, como sempre.
          </p>
          <p className="mt-3 text-[15px] text-cinza">
            Já assina?{" "}
            <Link
              href="/minha-conta"
              className="font-semibold text-white underline decoration-white/30 underline-offset-[5px] hover:decoration-white"
            >
              Ver meu plano
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
