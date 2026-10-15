"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ValeteLogo } from "./card-index";
import { buttonPrimary, container } from "./ui";

const links = [
  { href: "#assinaturas", label: "Assinaturas" },
  { href: "#servicos", label: "Serviços" },
  { href: "#artistas", label: "Os artistas" },
  { href: "#trabalho", label: "O trabalho" },
  { href: "#onde-estamos", label: "Onde estamos" },
];

// Transparente sobre a Hero; ao rolar, vira carvão com borda inferior (DESIGN.md > Navbar).
export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        solid ? "border-ardosia bg-carvao" : "border-transparent bg-transparent"
      }`}
    >
      <nav aria-label="Principal" className={`${container} flex h-[72px] items-center justify-between gap-6`}>
        <Link href="/#topo" className="-m-2 p-2" aria-label="Valete — início">
          <ValeteLogo className="h-9" label="Valete" />
        </Link>

        <div className="hidden items-center gap-9 lg:flex">
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={`/${link.href}`}
                  className={`text-[15px] font-medium transition-colors duration-200 hover:text-white ${
                    solid ? "text-cinza" : "text-white/90"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <AccountButton />
          <Link href="/agendar" className={`${buttonPrimary} min-h-10 px-6 py-2 text-sm`}>
            Agendar
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <AccountButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 flex min-h-11 items-center px-2 text-[15px] font-semibold text-white"
            aria-expanded={open}
            aria-controls="menu-mobile"
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </div>
      </nav>

      {open && (
        <div id="menu-mobile" className="border-t border-ardosia bg-carvao lg:hidden">
          <ul className={`${container} flex flex-col py-4`}>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={`/${link.href}`}
                  onClick={() => setOpen(false)}
                  className="font-display flex min-h-14 items-center text-2xl font-bold text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/minha-conta"
                onClick={() => setOpen(false)}
                className="font-display flex min-h-14 items-center text-2xl font-bold text-white"
              >
                Minha conta
              </Link>
            </li>
            <li className="pt-4 pb-2">
              <Link href="/agendar" onClick={() => setOpen(false)} className={`${buttonPrimary} w-full`}>
                Agendar horário
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

// Atalho para a área do cliente, sempre visível no topo (celular e computador): pill vazado,
// para não competir com o "Agendar" sólido.
function AccountButton() {
  return (
    <Link
      href="/minha-conta"
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-white/[0.06] px-4 text-sm font-semibold whitespace-nowrap text-white backdrop-blur-md transition-[background-color,border-color,transform] duration-200 hover:border-white/60 hover:bg-white/12 active:scale-[0.96]"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 fill-none stroke-current" strokeWidth="1.6">
        <circle cx="10" cy="6.5" r="3.25" />
        <path d="M3.5 17c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5" strokeLinecap="round" />
      </svg>
      Minha conta
    </Link>
  );
}
