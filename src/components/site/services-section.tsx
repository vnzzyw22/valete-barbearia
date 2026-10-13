import Link from "next/link";
import { formatPrice, formatServiceDuration } from "@/lib/format";
import type { Service } from "@/lib/supabase/types";
import { getWhatsappLink } from "@/lib/whatsapp";
import { Reveal } from "./reveal";
import { buttonPrimary, container, sectionTitle, textLink } from "./ui";

interface ServicesSectionProps {
  services: Service[];
  whatsapp: string | null;
}

// Lista tabular no vernáculo da tabela de preços da parede (DESIGN.md > Seções). Tudo vem de
// `services`; nada fixo no código.
export function ServicesSection({ services, whatsapp }: ServicesSectionProps) {
  const whatsappHref = getWhatsappLink(whatsapp, "Olá! Quero saber os serviços e valores.");

  return (
    <section id="servicos" aria-labelledby="servicos-titulo" className="scroll-mt-[72px] bg-carvao py-20 md:py-32">
      <div className={`${container} grid gap-10 md:grid-cols-12`}>
        <div className="md:col-span-4">
          <Reveal>
            <h2 id="servicos-titulo" className={sectionTitle}>
              Serviços
            </h2>
          </Reveal>
          {services.length > 0 && (
            <p className="mt-5 max-w-[30ch] text-[17px] leading-relaxed text-cinza">
              Escolha o serviço para ver os horários livres.
            </p>
          )}
        </div>

        <div className="md:col-span-8">
          {services.length === 0 ? (
            <div className="border-t border-ardosia pt-8">
              <p className="max-w-[44ch] text-[17px] leading-relaxed text-cinza">
                A lista de serviços ainda não foi publicada.
                {whatsappHref ? " Fale com a barbearia para saber valores e horários." : ""}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
                    Chamar no WhatsApp
                  </a>
                )}
                <Link href="/agendar" className={whatsappHref ? textLink : buttonPrimary}>
                  Ver horários
                </Link>
              </div>
            </div>
          ) : (
            <ul className="border-t border-ardosia">
              {services.map((service) => (
                <li key={service.id} className="border-b border-ardosia">
                  <Link
                    href={`/agendar?servico=${service.id}`}
                    className="group -mx-4 grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 rounded-sm px-4 py-6 transition-colors duration-200 hover:bg-grafite md:grid-cols-[1fr_auto_auto_auto] md:py-7"
                  >
                    <span className="min-w-0">
                      <span className="block text-[clamp(1.25rem,1.8vw,1.5rem)] leading-tight font-bold [font-stretch:112%] text-white">
                        {service.name}
                      </span>
                      {service.description && (
                        <span className="mt-1.5 block max-w-[52ch] text-[15px] leading-relaxed text-cinza">
                          {service.description}
                        </span>
                      )}
                    </span>
                    <Reveal className="col-start-2 row-start-1 text-right md:col-start-3">
                      <span className="block text-[clamp(1.25rem,1.8vw,1.5rem)] font-semibold text-white tabular-nums">
                        {formatPrice(service.price)}
                      </span>
                    </Reveal>
                    <span className="col-span-2 text-[15px] text-cinza tabular-nums md:col-span-1 md:col-start-2 md:row-start-1 md:text-right">
                      {formatServiceDuration(service)}
                    </span>
                    <span className="hidden text-[15px] font-semibold text-white underline decoration-white/30 underline-offset-[5px] group-hover:decoration-white md:block">
                      Agendar
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
