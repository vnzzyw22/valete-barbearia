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

// Índice de canto de carta: "V" + naipe. Gesto único do site (DESIGN.md > Conceito): só no
// painel do vídeo da Hero B.
export function CardIndex({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex flex-col items-center gap-1 leading-none ${className ?? ""}`}>
      <span className="font-display text-[22px] font-black text-white">V</span>
      <Spade className="w-[12px] bg-latao" />
    </span>
  );
}
