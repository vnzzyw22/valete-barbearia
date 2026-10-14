import type { CSSProperties } from "react";

// Desenhos da marca usados como máscara CSS: a forma vem do arquivo gerado a partir do logo
// original (scripts/brand/process-logo.py) e a cor vem da classe `bg-*`. Nada redesenhado.
function maskStyle(url: string): CSSProperties {
  return {
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
}

// Naipe de espadas do próprio logo (viewBox 25,6 × 34,3).
export function Spade({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block aspect-[25.6/34.3] ${className ?? ""}`}
      style={maskStyle("/brand/valete-spade.svg")}
    />
  );
}

// Logo completo (script + CUT AND BEARD + bigode), recortado justo (viewBox 475 × 299,2).
export function ValeteLogo({ className, label = "Valete — Cut and Beard" }: { className?: string; label?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block aspect-[475/299.2] bg-white ${className ?? ""}`}
      style={maskStyle("/brand/valete-logo.svg")}
    />
  );
}

// Índice de canto de carta: "V" + naipe (DESIGN.md > Conceito). Aparece em dois lugares: no
// painel do vídeo da Hero B ("dark": V branco, naipe em latão) e na face branca da carta do
// plano em destaque, em Assinaturas ("face": tudo em carvão, como numa carta de verdade).
export function CardIndex({ className, tone = "dark" }: { className?: string; tone?: "dark" | "face" }) {
  return (
    <span aria-hidden="true" className={`flex flex-col items-center gap-1 leading-none ${className ?? ""}`}>
      <span className={`font-display text-[22px] font-black ${tone === "face" ? "text-carvao" : "text-white"}`}>V</span>
      <Spade className={`w-[12px] ${tone === "face" ? "bg-carvao" : "bg-latao"}`} />
    </span>
  );
}
