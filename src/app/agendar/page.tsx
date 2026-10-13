import type { Metadata } from "next";
import Link from "next/link";
import { BookingForm } from "@/components/booking/booking-form";
import { ValeteLogo } from "@/components/site/card-index";
import { getDepositConfig } from "@/lib/deposit";
import {
  getActiveProfessionals,
  getActiveServices,
  getBusinessSettings,
} from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Agendar horário",
};

export default async function AgendarPage(props: PageProps<"/agendar">) {
  const searchParams = await props.searchParams;
  const [services, professionals, business] = await Promise.all([
    getActiveServices(),
    getActiveProfessionals(),
    getBusinessSettings(),
  ]);
  const depositConfig = getDepositConfig(business);

  const preselectedParam = searchParams.servico;
  const preselectedServiceId = Array.isArray(preselectedParam)
    ? preselectedParam[0]
    : preselectedParam;

  return (
    <div className="flex flex-1 flex-col bg-carvao">
      <header className="border-b border-ardosia">
        <div className="mx-auto flex h-[72px] w-full max-w-2xl items-center px-6">
          <Link href="/" className="-m-2 p-2" aria-label="Valete — voltar ao início">
            <ValeteLogo className="h-9" label="Valete" />
          </Link>
        </div>
      </header>
      <main
        id="conteudo"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12"
      >
        <div className="mb-8 text-center">
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[0.95] font-extrabold text-white">
            Agendar horário
          </h1>
          <p className="mt-2 text-sm text-brand-smoke">
            Escolha o serviço, o profissional, a data e o horário.{" "}
            {depositConfig
              ? "Você garante o horário com um sinal via Pix e a equipe confirma em seguida."
              : "Você confirma o pedido pelo WhatsApp e aguarda a confirmação."}
          </p>
        </div>

        <BookingForm
          services={services}
          professionals={professionals}
          preselectedServiceId={preselectedServiceId}
          deposit={
            depositConfig
              ? {
                  amount: depositConfig.amount,
                  holdMinutes: depositConfig.holdMinutes,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
