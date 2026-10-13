import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de uso",
};

// Texto legal definitivo ainda não definido com o cliente: a página existe para o link do
// rodapé não ficar morto, sem inventar um texto jurídico que ninguém revisou.
export default function TermosDeUsoPage() {
  return (
    <main className="flex min-h-svh flex-col items-start justify-center gap-6 bg-carvao px-[clamp(20px,5vw,80px)] py-24">
      <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-[0.95] font-extrabold text-white">Termos de uso</h1>
      <p className="max-w-[46ch] text-[17px] leading-relaxed text-cinza">
        Este conteúdo ainda está em preparação. Em caso de dúvida sobre o uso do site, fale diretamente com a barbearia.
      </p>
      <Link href="/" className="text-[15px] font-semibold text-white underline underline-offset-[5px]">
        Voltar para o início
      </Link>
    </main>
  );
}
