"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Vocabulário de movimento do site (DESIGN.md > Movimento). Tudo acontece uma vez, ao entrar na
// tela, e só mexe em transform, opacity e clip-path. Com prefers-reduced-motion, o MotionConfig
// (motion-provider.tsx) zera os deslocamentos e o CSS (.media-reveal) desliga a cortina.

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Título de seção: o texto sobe de dentro da própria linha (máscara), em vez de esmaecer.
// O respiro embaixo (pb/-mb) evita cortar a cedilha e as descendentes. Quem observa a entrada na
// tela é a máscara (o texto escondido dentro dela nunca "aparece" para o IntersectionObserver).
export function TitleReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.span
      className="-mb-[0.14em] block overflow-hidden pb-[0.14em]"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
    >
      <motion.span
        className="block"
        variants={{
          hidden: { y: "105%" },
          shown: { y: "0%", transition: { duration: 0.9, delay, ease: EASE_OUT } },
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

// Linha de lista tabular (Serviços, planos): o fio de baixo se desenha da esquerda para a direita
// e o conteúdo acende logo depois — como uma tabela de preços sendo escrita, linha a linha.
export function RuledItem({ children, index, className }: { children: ReactNode; index: number; className?: string }) {
  const delay = Math.min(index, 8) * 0.07;
  return (
    <motion.li
      className={`relative ${className ?? ""}`}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
    >
      <motion.div
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.6, delay: delay + 0.15 } } }}
      >
        {children}
      </motion.div>
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-ardosia"
        variants={{
          hidden: { scaleX: 0 },
          shown: { scaleX: 1, transition: { duration: 0.9, delay, ease: EASE_OUT } },
        }}
      />
    </motion.li>
  );
}

// Foto: cortina de baixo para cima com zoom-out lento por dentro. `className` define o quadro
// (proporção); o filho é a imagem com `fill`. Quem observa a entrada é o quadro sem recorte: um
// alvo com clip-path fechado não conta como visível para o IntersectionObserver.
export function MediaReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`relative ${className ?? ""}`}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.div
        className="media-reveal absolute inset-0 overflow-hidden bg-carvao"
        variants={{
          hidden: { clipPath: "inset(100% 0% 0% 0%)" },
          shown: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.1, delay, ease: EASE_OUT } },
        }}
      >
        <motion.div
          className="absolute inset-0"
          variants={{
            hidden: { scale: 1.14 },
            shown: { scale: 1, transition: { duration: 1.6, delay, ease: EASE_OUT } },
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
