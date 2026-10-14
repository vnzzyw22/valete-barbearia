import type { Metadata } from "next";
import Link from "next/link";
import { AccountView } from "@/components/account/account-view";
import { LoginForm } from "@/components/account/login-form";
import { ValeteLogo } from "@/components/site/card-index";
import { MotionProvider } from "@/components/site/motion-provider";
import { getClientLoginMode, getClientSessionPhone } from "@/lib/client-auth";
import { getClientPortal } from "@/lib/supabase/client-portal";
import { getBusinessSettings } from "@/lib/supabase/queries";
import { getWhatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

// Sempre por requisição: depende do cookie de sessão do cliente.
export const dynamic = "force-dynamic";

export default async function MinhaContaPage() {
  const mode = getClientLoginMode();
  const phone = await getClientSessionPhone();
  const [business, portal] = await Promise.all([getBusinessSettings(), phone ? getClientPortal(phone) : null]);
  const whatsappHref = getWhatsappLink(business?.whatsapp ?? null, "Olá! Vim pelo site da Valete.");
  const now = new Date().getTime();

  return (
    <MotionProvider>
    <div className="flex flex-1 flex-col bg-carvao">
      <header className="border-b border-ardosia">
        <div className="mx-auto flex h-[72px] w-full max-w-[1100px] items-center justify-between px-[clamp(20px,5vw,48px)]">
          <Link href="/" className="-m-2 p-2" aria-label="Valete — voltar ao início">
            <ValeteLogo className="h-9" label="Valete" />
          </Link>
          <Link href="/" className="text-[15px] font-semibold text-cinza transition-colors duration-200 hover:text-white">
            Voltar ao site
          </Link>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-[1100px] flex-1 px-[clamp(20px,5vw,48px)] py-14 md:py-20">
        {phone && portal ? (
          <AccountView
            portal={portal}
            phone={phone}
            business={{
              name: business?.name ?? "Valete Barbearia",
              whatsapp: business?.whatsapp ?? null,
              address: business?.address ?? null,
            }}
            now={now}
          />
        ) : (
          <div className="max-w-[440px]">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold tracking-[-0.02em] text-white">
              Minha conta
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-cinza">
              Seus horários, o histórico de atendimentos e o seu plano, num lugar só.
            </p>
            <div className="mt-10">
              {mode === "unavailable" ? (
                <div className="border-t border-ardosia pt-6 text-[17px] leading-relaxed text-cinza">
                  <p>O acesso à conta ainda não está disponível.</p>
                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center font-semibold text-white underline decoration-white/30 underline-offset-[5px] hover:decoration-white">
                      Falar com a barbearia
                    </a>
                  )}
                </div>
              ) : phone && !portal ? (
                <p role="alert" className="text-[17px] text-red-400">
                  Não foi possível carregar sua conta agora. Recarregue a página em instantes.
                </p>
              ) : (
                <LoginForm />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
    </MotionProvider>
  );
}
