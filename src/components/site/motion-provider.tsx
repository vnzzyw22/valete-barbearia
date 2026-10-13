"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// Com `prefers-reduced-motion`, o Framer Motion desliga deslocamentos e mantém só a troca de
// opacidade das revelações. Evita ler a preferência na renderização (risco de hidratação).
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
