import Link from "next/link";
import { formatServiceDuration } from "@/lib/format";
import type { Service } from "@/lib/supabase/types";
import { getWhatsappLink } from "@/lib/whatsapp";
import { CountUpPrice, GhostRank, SectionMark } from "./kinetics";
import { RuledItem, TitleReveal } from "./motion";
import { buttonDark, container, sectionTitleDark } from "./ui";

interface ServicesSectionProps {
  services: Service[];
  whatsapp: string | null;
}

// Serviços é o "lado branco da carta": a única seção clara da home, quebrando o preto. Lista
// tabular no vernáculo da tabela de preços da parede (DESIGN.md > Seções): as linhas entram de
// lados alternados, o fio se desenha e o preço conta do zero. Tudo vem de `services`.
export function ServicesSection({ services, whatsapp }: ServicesSectionProps) {
  const whatsappHref = getWhatsappLink(whatsapp, "Olá! Quero saber os serviços e valores.");

  return (
    <section
      id="servicos"
      aria-labelledby="servicos-titulo"
      className="relative scroll-mt-[72px] overflow-hidden bg-white py-20 text-carvao md:py-32"
    >
      <GhostRank rank="K" tone="light" className="-bottom-[0.2em] -left-[0.06em] text-[clamp(18rem,45vw,40rem)]" />

      <div className={`${container} relative grid gap-10 md:grid-cols-12`}>
        <div className="md:col-span-4">
          <div className="md:sticky md:top-28">
            <SectionMark rank="K" tone="light" />
            <h2 id="servicos-titulo" className={sectionTitleDark}>
              <TitleReveal>Serviços</TitleReveal>
            </h2>
            {services.length > 0 && (
              <p className="mt-5 max-w-[30ch] text-[17px] leading-relaxed text-carvao/65">
                Escolha o serviço para ver os horários livres.
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-8">
          {services.length === 0 ? (
            <div className="border-t border-carvao/15 pt-8">
              <p className="max-w-[44ch] text-[17px] leading-relaxed text-carvao/65">
                A lista de serviços ainda não foi publicada.
                {whatsappHref ? " Fale com a barbearia para saber valores e horários." : ""}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonDark}>
                    Chamar no WhatsApp
                  </a>
                )}
                <Link
                  href="/agendar"
                  className={
                    whatsappHref
                      ? "inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-[5px]"
                      : buttonDark
                  }
                >
                  Ver horários
                </Link>
              </div>
            </div>
          ) : (
            <ul className="border-t border-carvao/15">
              {services.map((service, index) => (
                <RuledItem
                  key={service.id}
                  index={index}
                  lineClassName="bg-carvao/15"
                  slideFrom={index % 2 === 0 ? -56 : 56}
                >
                  <Link
                    href={`/agendar?servico=${service.id}`}
                    className="group -mx-4 grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 rounded-sm px-4 py-6 transition-colors duration-200 hover:bg-carvao/[0.04] active:bg-carvao/[0.07] md:grid-cols-[1fr_auto_auto_auto] md:py-7"
                  >
                    <span className="min-w-0">
                      <span className="block text-[clamp(1.25rem,1.8vw,1.5rem)] leading-tight font-bold [font-stretch:112%] transition-transform duration-300 group-hover:translate-x-2">
                        {service.name}
                      </span>
                      {service.description && (
                        <span className="mt-1.5 block max-w-[52ch] text-[15px] leading-relaxed text-carvao/60">
                          {service.description}
                        </span>
                      )}
                    </span>
                    <CountUpPrice
                      value={service.price}
                      className="col-start-2 row-start-1 block text-right text-[clamp(1.25rem,1.8vw,1.5rem)] font-semibold md:col-start-3"
                    />
                    <span className="col-start-1 text-[15px] text-carvao/60 tabular-nums md:col-start-2 md:row-start-1 md:text-right">
                      {formatServiceDuration(service)}
                    </span>
                    {/* No celular a linha inteira já é o link, mas sem esta palavra nada indica que dá
                        para tocar: fica à direita, na linha da duração. */}
                    <span className="col-start-2 row-start-2 inline-flex items-center gap-1.5 self-end justify-self-end text-[15px] font-semibold underline decoration-carvao/30 underline-offset-[5px] group-hover:decoration-carvao md:col-start-4 md:row-start-1 md:self-auto">
                      Agendar
                      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </Link>
                </RuledItem>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
