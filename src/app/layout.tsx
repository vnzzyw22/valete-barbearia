import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getBusinessSettings } from "@/lib/supabase/queries";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

// Archivo variável (pesos 100–900, larguras 62–125), servida pelo projeto. Fontes de
// next/font/google já quebraram o build na Vercel (ver CLAUDE.md > Unbounded). Licença OFL em
// ./fonts/archivo-OFL.txt.
const archivo = localFont({
  variable: "--font-archivo",
  src: "./fonts/archivo-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const FALLBACK_NAME = "Valete Barbearia";
const DESCRIPTION = "Corte e barba com hora marcada. Agende seu horário pelo site.";

// Nome vindo de business_settings (nada de marca fixa além do fallback).
export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessSettings();
  const name = business?.name ?? FALLBACK_NAME;
  const description = business?.address ? `${DESCRIPTION} ${business.address}.` : DESCRIPTION;
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: { default: name, template: `%s — ${name}` },
    description,
    openGraph: {
      title: name,
      description,
      url: siteUrl,
      siteName: name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#121212",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-carvao"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
