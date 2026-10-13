import Link from "next/link";
import type { BusinessSettings } from "@/lib/supabase/types";
import { ValeteLogo } from "./card-index";
import { container } from "./ui";

const linkClass = "text-[15px] text-cinza transition-colors duration-200 hover:text-white";

export function Footer({ business }: { business: BusinessSettings | null }) {
  const name = business?.name ?? "Valete Barbearia";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ardosia bg-carvao">
      <div className={`${container} flex flex-col gap-10 py-14 md:flex-row md:items-end md:justify-between`}>
        <ValeteLogo className="w-[150px]" label={name} />
        <nav aria-label="Rodapé" className="flex flex-col gap-x-8 gap-y-3 sm:flex-row sm:flex-wrap">
          <Link href="/agendar" className={linkClass}>
            Agendar horário
          </Link>
          <Link href="/#servicos" className={linkClass}>
            Serviços
          </Link>
          <Link href="/politica-de-privacidade" className={linkClass}>
            Política de privacidade
          </Link>
          <Link href="/termos-de-uso" className={linkClass}>
            Termos de uso
          </Link>
        </nav>
      </div>
      <div className={`${container} pb-10`}>
        <p className="text-sm text-cinza">
          © {year} {name}
        </p>
      </div>
    </footer>
  );
}
