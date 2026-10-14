import { formatBusinessHours } from "@/lib/business-hours";
import type { BusinessSettings } from "@/lib/supabase/types";
import { getWhatsappLink } from "@/lib/whatsapp";
import { TitleReveal } from "./motion";
import { Reveal } from "./reveal";
import { container, sectionTitle, textLink } from "./ui";

function instagramHref(handle: string) {
  const user = handle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  return { href: `https://instagram.com/${user}`, label: `@${user}` };
}

// Telefone a partir do WhatsApp cadastrado (só dígitos, com DDI 55): (44) 99999-9999.
function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

// O navegador quebra linha no hífen do CEP ("86810-" / "250") em telas estreitas. O CEP vai num
// span sem quebra; o resto do endereço continua quebrando normalmente.
function withUnbreakableCep(address: string) {
  return address.split(/(\b\d{5}-\d{3}\b)/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// "Onde estamos": endereço, mapa, contatos e horário — tudo de business_settings (painel →
// Configurações). Sem endereço cadastrado a seção não aparece; cada contato só se preenchido.
export function LocationSection({ business }: { business: BusinessSettings | null }) {
  const address = business?.address?.trim();
  if (!address) return null;

  // Referências entre parênteses ("próximo a…") ajudam a pessoa, mas atrapalham a busca do mapa.
  // Para o mapa, só "rua, número, cidade": testado em 2026-10-14, o nome popular do bairro
  // ("Bairro da Igrejinha") faz o Google centralizar no bairro sem marcar o endereço, e o
  // trecho entre parênteses ("próximo a…") também atrapalha. O texto exibido não muda.
  const mapQuery = encodeURIComponent(
    address
      .replace(/\s*\([^)]*\)/g, "")
      .split(/\s+[—–]\s+|,\s*/)
      .filter((part) => !/^bairro\b/i.test(part))
      .join(", "),
  );
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
  const embedSrc = `https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`;
  const hours = formatBusinessHours(business?.business_hours ?? {});
  const whatsappHref = getWhatsappLink(business?.whatsapp ?? null, "Olá! Vim pelo site da Valete.");
  const phone = business?.whatsapp ? formatPhone(business.whatsapp) : null;
  const instagram = business?.instagram ? instagramHref(business.instagram) : null;

  return (
    <section id="onde-estamos" aria-labelledby="onde-titulo" className="scroll-mt-[72px] bg-ink py-20 md:py-32">
      <div className={`${container} grid gap-12 lg:grid-cols-12 lg:gap-10`}>
        <div className="flex flex-col lg:col-span-5">
          <h2 id="onde-titulo" className={sectionTitle}>
            <TitleReveal>Onde estamos</TitleReveal>
          </h2>

          <address className="mt-8 not-italic">
            <p className="font-display max-w-[22ch] text-[clamp(1.375rem,2vw,1.75rem)] leading-[1.2] font-bold text-white">
              {withUnbreakableCep(address)}
            </p>
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={`${textLink} mt-4`}>
              Como chegar
            </a>
          </address>

          {(phone || instagram) && (
            <ul className="mt-8 space-y-3 border-t border-ardosia pt-6 text-[17px]">
              {phone && whatsappHref && (
                <li className="flex items-baseline justify-between gap-6">
                  <span className="text-cinza">Telefone e WhatsApp</span>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="tabular-nums text-white underline decoration-1 underline-offset-4 hover:decoration-white/40">
                    {phone}
                  </a>
                </li>
              )}
              {instagram && (
                <li className="flex items-baseline justify-between gap-6">
                  <span className="text-cinza">Instagram</span>
                  <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-1 underline-offset-4 hover:decoration-white/40">
                    {instagram.label}
                  </a>
                </li>
              )}
            </ul>
          )}

          {hours.length > 0 && (
            <div className="mt-10">
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
        </div>

        {/* Mapa do Google sem chave de API. Invertido + matiz girado 180°: fica escuro como o
            site e o pino continua vermelho. Carrega só perto da tela (loading="lazy"). */}
        <div className="relative min-h-[360px] overflow-hidden bg-carvao lg:col-span-7 lg:min-h-[560px]">
          <iframe
            src={embedSrc}
            title={`Mapa: ${address}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
            style={{ filter: "invert(0.92) hue-rotate(180deg) saturate(0.55) contrast(0.95)" }}
          />
        </div>
      </div>
    </section>
  );
}
