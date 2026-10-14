import { ValeteLogo } from "@/components/site/card-index";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminLoginBypass } from "@/lib/admin-login-bypass";
import { countPaymentsAwaitingConfirmation } from "@/lib/supabase/admin-queries";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já bloqueia rotas /admin sem sessão; esta checagem aqui é
  // uma segunda camada de defesa direto no layout do painel.
  if (!user) {
    redirect("/admin/login");
  }

  const pendingPayments = await countPaymentsAwaitingConfirmation();
  const loginDisabled = getAdminLoginBypass() !== null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-ink md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-white/10 bg-[#0f0f0f] md:w-56 md:border-b-0 md:border-r">
        <div className="px-4 py-4">
          <ValeteLogo className="h-9" label="Valete — painel" />
        </div>
        <AdminNav initialPendingPayments={pendingPayments} />
        {loginDisabled ? (
          // Com o login desativado, "Sair" não faria sentido: o próximo acesso entra de novo sozinho.
          <p className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-white/60">
            Login desativado para teste. Reative tirando ADMIN_LOGIN_DISABLED do .env.local.
          </p>
        ) : (
          <form action={logout} className="border-t border-white/10 p-2">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left font-nav text-sm font-semibold text-white/60 transition-colors duration-200 hover:bg-white/5 hover:text-accent"
            >
              Sair
            </button>
          </form>
        )}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
