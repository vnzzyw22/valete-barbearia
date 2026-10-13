import type { Metadata } from "next";
import { ValeteLogo } from "@/components/site/card-index";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar no painel",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-brand-ink px-6">
      <h1 className="flex flex-col items-center gap-3">
        <ValeteLogo className="w-[180px]" label="Valete" />
        <span className="font-display text-lg font-bold text-white">Painel</span>
      </h1>
      <LoginForm />
    </main>
  );
}
