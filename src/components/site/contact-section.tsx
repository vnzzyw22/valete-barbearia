import Link from "next/link";
import { formatBusinessHours } from "@/lib/business-hours";
import type { BusinessSettings } from "@/lib/supabase/types";
import { getWhatsappLink } from "@/lib/whatsapp";
import { Reveal } from "./reveal";
import { buttonPrimary, container, sectionTitle, textLink } from "./ui";

function instagramHref(handle: string) {
  const user = handle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  return { href: `https://instagram.com/${user}`, label: `@${user}` };
}

// Horário, endereço e contatos vêm de business_settings; cada bloco só aparece se preenchido.
export function ContactSection({ business }: { business: BusinessSettings | null }) {
  const hours = business ? formatBusinessHours(business.business_hours ?? {}) : [];
  const whatsappHref = getWhatsappLink(business?.whatsapp ?? null, "Olá! Vim pelo site da Valete.");
  const instagram = business?.instagram ? instagramHref(business.instagram) : null;
  const mapsHref = business?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
    : null;

  return (
    <section id="contato" aria-labelledby="contato-titulo" className="scroll-mt-[72px] bg-carvao py-20 md:py-32">
      <div className={`${container} grid gap-14 md:grid-cols-12`}>
        <div className="md:col-span-6">
          <Reveal>
            <h2 id="contato-titulo" className={`${sectionTitle} max-w-[12ch]`}>
              Agende seu horário
            </h2>
          </Reveal>
          <p className="mt-6 max-w-[38ch] text-[17px] leading-relaxed text-cinza">
            Escolha o serviço, o profissional e o horário livre. A confirmação chega pela equipe.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
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

        <div className="grid gap-12 sm:grid-cols-2 md:col-span-6">
          {hours.length > 0 && (
            <div>
              <h3 className="text-lg font-bold [font-stretch:112%] text-white">Horário</h3>
              <dl className="mt-4 border-t border-ardosia">
                {hours.map(({ label, value }) => (
                  <div key={label} className="flex items-baseline justify-between gap-6 border-b border-ardosia py-3">
                    <dt className="text-[15px] text-cinza">{label}</dt>
                    <dd className={`text-[15px] tabular-nums ${value === "Fechado" ? "text-cinza" : "text-white"}`}>
                      <Reveal>{value}</Reveal>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {(business?.address || instagram || whatsappHref) && (
            <div>
              <h3 className="text-lg font-bold [font-stretch:112%] text-white">Contato</h3>
              <ul className="mt-4 space-y-4 border-t border-ardosia pt-4 text-[15px] leading-relaxed">
                {business?.address && (
                  <li>
                    <p className="text-white">{business.address}</p>
                    <a href={mapsHref!} target="_blank" rel="noopener noreferrer" className="text-cinza underline underline-offset-4 hover:text-white">
                      Ver no mapa
                    </a>
                  </li>
                )}
                {whatsappHref && (
                  <li>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4 hover:decoration-white/40">
                      WhatsApp
                    </a>
                  </li>
                )}
                {instagram && (
                  <li>
                    <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4 hover:decoration-white/40">
                      Instagram {instagram.label}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
