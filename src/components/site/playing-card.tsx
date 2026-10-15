"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { ValeteLogo } from "./card-index";
import { EASE_OUT } from "./motion";

interface PlayingCardProps {
  children: ReactNode;
  // Posição na grade da seção (o cartão em si ocupa 100% da largura dada aqui).
  className?: string;
  // Raio da carta: a face (children) usa o mesmo valor.
  radius?: string;
  // Inclinação de repouso, em graus (a carta "pousada na mesa").
  restTilt?: number;
  // Atraso da entrada (cartas de uma mão sendo dadas uma depois da outra).
  delay?: number;
}

const MAX_TILT = 12;

// A carta da Valete (DESIGN.md > Movimento > A carta):
// 1. entra virada para baixo, é "dada" na mesa e vira para mostrar a face — uma vez, ao aparecer;
// 2. com o mouse em cima, inclina em 3D na direção do ponteiro, e uma luz fria acompanha a face.
// Toque não inclina (no celular o dedo cobriria a carta). Com movimento reduzido, o MotionConfig
// torna a virada instantânea e o handler não inclina.
export function PlayingCard({ children, className, radius = "rounded-[22px]", restTilt = -1.5, delay = 0 }: PlayingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 170, damping: 18 });
  const rotateY = useSpring(tiltY, { stiffness: 170, damping: 18 });
  const lightX = useMotionValue(30);
  const lightY = useMotionValue(20);
  const lightOpacity = useSpring(0, { stiffness: 120, damping: 20 });
  const light = useMotionTemplate`radial-gradient(120% 90% at ${lightX}% ${lightY}%, rgb(255 255 255 / 0) 30%, rgb(10 10 10 / 0.12) 100%)`;
  // A sombra no chão se desloca quando a carta inclina. Fica bem atrás (translateZ -220): com a
  // inclinação máxima o canto da carta recua ~110 px e não pode atravessar o plano da sombra.
  const shadowX = useTransform(rotateY, [-MAX_TILT, MAX_TILT], [18, -18]);
  const shadowY = useTransform(rotateX, [-MAX_TILT, MAX_TILT], [-10, 26]);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || reduceMotion || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width;
    const py = (event.clientY - box.top) / box.height;
    tiltY.set((px - 0.5) * 2 * MAX_TILT);
    tiltX.set(-(py - 0.5) * 2 * MAX_TILT);
    lightX.set(px * 100);
    lightY.set(py * 100);
    lightOpacity.set(1);
  }

  function handleLeave() {
    tiltX.set(0);
    tiltY.set(0);
    lightOpacity.set(0);
  }

  return (
    <div className={`[perspective:1400px] ${className ?? ""}`}>
      <motion.div
        className="relative [transform-style:preserve-3d]"
        initial={{ rotateY: 180, rotateZ: -9, y: 90, opacity: 0 }}
        whileInView={{ rotateY: 0, rotateZ: restTilt, y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{
          opacity: { duration: 0.35, delay },
          y: { type: "spring", stiffness: 70, damping: 15, delay },
          rotateZ: { type: "spring", stiffness: 70, damping: 13, delay },
          rotateY: { duration: 1.15, delay: delay + 0.25, ease: EASE_OUT },
        }}
      >
        <motion.div
          aria-hidden="true"
          className={`absolute inset-0 -z-0 ${radius} bg-black/60 blur-2xl`}
          style={{ x: shadowX, y: shadowY, translateZ: -220 }}
        />
        <motion.div
          ref={ref}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          className="relative [transform-style:preserve-3d]"
          style={{ rotateX, rotateY }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* face */}
          <div className={`relative ${radius} [backface-visibility:hidden]`}>
            {children}
            <motion.div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 ${radius}`}
              style={{ backgroundImage: light, opacity: lightOpacity }}
            />
          </div>
          {/* verso: o que aparece antes de a carta virar */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 ${radius} flex items-center justify-center overflow-hidden bg-grafite ring-1 ring-white/20 [backface-visibility:hidden] [transform:rotateY(180deg)]`}
          >
            {/* trama de losangos, como o verso de um baralho */}
            <span
              className="absolute inset-3 rounded-[14px]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 14px)",
              }}
            />
            <span className={`absolute inset-3 ${radius} border border-white/25`} />
            <span className={`absolute inset-6 ${radius} border border-white/10`} />
            <span className="relative flex aspect-square w-[64%] items-center justify-center rounded-full border border-white/20 bg-grafite">
              <ValeteLogo className="w-[78%]" label="" />
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
