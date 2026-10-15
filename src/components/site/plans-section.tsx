import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { buildPlanMessage, formatPlanWeekdays, PLAN_PERIOD_LABEL } from "@/lib/plans";
import type { Plan } from "@/lib/supabase/types";
import { getWhatsappLink } from "@/lib/whatsapp";
import { GhostRank, SectionMark } from "./kinetics";
import { TitleReveal } from "./motion";
import { PlanHand, type HandCard } from "./plan-hand";
import { container, sectionTitle } from "./ui";

interface PlansSectionProps {
  plans: Plan[];
  whatsapp: string | null;
}

// Assinaturas (DESIGN.md > Assinaturas): cada plano é uma carta de baralho de verdade, e os
// planos juntos são a mão — em leque no computador, em baralho de arrastar no celular. Tudo vem
// de `plans` (painel → Assinaturas). Sem cobrança online: o botão abre o WhatsApp.
export function PlansSection({ plans, whatsapp }: PlansSectionProps) {
  if (plans.length === 0) return null;

  const cards: HandCard[] = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    details: [formatPlanWeekdays(plan.weekdays), plan.description].filter(Boolean).join(". ") || null,
    price: formatPrice(plan.price),
    period: PLAN_PERIOD_LABEL,
    href: getWhatsappLink(whatsapp, buildPlanMessage(plan.name)),
    featured: plan.featured,
  }));
  if (!cards.some((c) => c.featured)) cards[0].featured = true;

  return (
    <section
      id="assinaturas"
      aria-labelledby="assinaturas-titulo"
      className="relative scroll-mt-[72px] overflow-hidden bg-ink py-20 md:py-32"
    >
      <GhostRank rank="A" className="-top-[0.12em] -right-[0.08em] text-[clamp(18rem,45vw,40rem)]" />

      <div className={`${container} relative`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionMark rank="A" />
            <h2 id="assinaturas-titulo" className={sectionTitle}>
              <TitleReveal>Assinaturas</TitleReveal>
            </h2>
          </div>
          <p className="max-w-[36ch] text-[17px] leading-relaxed text-cinza lg:mb-2 lg:text-right">
            Valor fixo todo mês para manter o corte e a barba em dia. Escolha a sua carta.
          </p>
        </div>

        <div className="mt-14 md:mt-20">
          <PlanHand cards={cards} />
        </div>

        <div className="mx-auto mt-10 max-w-[56ch] text-center lg:mt-4">
          <p className="text-[15px] leading-relaxed text-cinza">
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
