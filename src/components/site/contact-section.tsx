import Link from "next/link";
import type { BusinessSettings } from "@/lib/supabase/types";
import { getWhatsappLink } from "@/lib/whatsapp";
import { Reveal } from "./reveal";
import { buttonPrimary, container, sectionTitle, textLink } from "./ui";

// Fecho da página: chamada para agendar. Endereço, mapa, contatos e horário ficam em
// "Onde estamos" (location-section.tsx).
export function ContactSection({ business }: { business: BusinessSettings | null }) {
  const whatsappHref = getWhatsappLink(business?.whatsapp ?? null, "Olá! Vim pelo site da Valete.");

  return (
    <section id="contato" aria-labelledby="contato-titulo" className="scroll-mt-[72px] bg-carvao py-20 md:py-28">
      <div className={`${container} flex flex-col gap-8 md:flex-row md:items-end md:justify-between`}>
        <div>
          <Reveal>
            <h2 id="contato-titulo" className={`${sectionTitle} max-w-[12ch]`}>
              Agende seu horário
            </h2>
          </Reveal>
          <p className="mt-6 max-w-[38ch] text-[17px] leading-relaxed text-cinza">
            Escolha o serviço, o profissional e o horário livre. A confirmação chega pela equipe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 md:pb-2">
          <Link href="/agendar" className={buttonPrimary}>
            Agendar horário
          </Link>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={textLink}>
              Chamar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
