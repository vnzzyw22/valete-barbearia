"use client";

import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import { Spade } from "./card-index";
import { EASE_OUT } from "./motion";

// Peças de movimento da segunda rodada (DESIGN.md > Movimento > Ritmo): letreiro que responde à
// velocidade do scroll, preços que contam, índice de carta por seção, naipe gigante em parallax
// e a barra de progresso. Tudo para quieto com prefers-reduced-motion.

function wrap(min: number, max: number, value: number) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

interface MarqueeProps {
  items: string[];
  // Velocidade de base em % da faixa por segundo; o sinal dá a direção.
  baseVelocity?: number;
  // "dark": faixa carvão com texto branco; "light": faixa branca com texto carvão.
  tone?: "dark" | "light";
  // Inclinação da faixa, em graus.
  tilt?: number;
}

// Letreiro: anda sozinho e acelera (ou inverte) com a rolagem, como a régua de um painel de
// barbearia. Decorativo: o conteúdo real está nas seções, então fica fora da árvore de acessibilidade.
export function VelocityMarquee({ items, baseVelocity = -2.2, tone = "dark", tilt = 0 }: MarqueeProps) {
  const reduceMotion = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduceMotion) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  if (items.length === 0) return null;

  // Uma "volta" larga o bastante para cobrir telas largas; duas voltas permitem o laço sem emenda.
  const lap = [...items, ...items, ...items];
  const dark = tone === "dark";

  return (
    <div
      aria-hidden="true"
      className={`relative z-10 overflow-hidden py-4 md:py-6 ${dark ? "bg-carvao text-white" : "bg-ouro text-carvao"}`}
      style={tilt ? { transform: `rotate(${tilt}deg) scale(1.04)` } : undefined}
    >
      <motion.div className="flex w-max whitespace-nowrap will-change-transform" style={{ x }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {lap.map((item, i) => (
              <Fragment key={`${copy}-${i}`}>
                <span
                  className="font-display px-[0.35em] text-[clamp(2rem,6vw,5rem)] leading-none font-extrabold tracking-[-0.02em] uppercase"
                  style={
                    i % 2 === 1
                      ? { color: "transparent", WebkitTextStroke: `1.5px ${dark ? "#fff" : "#121212"}` }
                      : undefined
                  }
                >
                  {item}
                </span>
                <Spade className={`w-[clamp(14px,1.6vw,22px)] ${dark ? "bg-latao" : "bg-carvao"}`} />
              </Fragment>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Preço que conta do zero quando entra na tela. No HTML do servidor já vem o valor final (sem JS
// ou com movimento reduzido, é ele que aparece); só zera se ainda estiver fora da tela.
export function CountUpPrice({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const armed = useRef(false);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.textContent = formatPrice(0);
      armed.current = true;
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (!inView || !armed.current) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: EASE_OUT,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = formatPrice(v);
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {formatPrice(value)}
    </span>
  );
}

// Índice de carta da seção: posto (A, K, Q, J, 10) + naipe em latão, acima do título.
export function SectionMark({ rank, tone = "dark" }: { rank: string; tone?: "dark" | "light" }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`mb-6 flex items-center gap-2 ${tone === "dark" ? "text-white" : "text-carvao"}`}
      initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
      whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 14 }}
    >
      <span className={`font-display text-[22px] leading-none font-black ${tone === "dark" ? "text-ouro" : ""}`}>{rank}</span>
      <Spade className="w-[13px] bg-latao" />
    </motion.span>
  );
}

// Posto gigante vazado atrás da seção, em parallax lento. A seção precisa de `relative` e
// `overflow-hidden` (ou clip).
export function GhostRank({
  rank,
  tone = "dark",
  className,
}: {
  rank: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-18%", "18%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      className={`font-display pointer-events-none absolute leading-none font-black select-none ${className ?? ""}`}
      style={{
        y: reduceMotion ? 0 : y,
        rotate: reduceMotion ? 0 : rotate,
        color: "transparent",
        WebkitTextStroke: tone === "dark" ? "1px rgb(197 160 89 / 0.16)" : "1px rgb(138 100 36 / 0.16)",
      }}
    >
      {rank}
    </motion.span>
  );
}

// Barra fina no topo da tela que acompanha a leitura da página.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="bg-ouro fixed inset-x-0 top-0 z-[60] h-[2px] origin-left"
      style={{ scaleX }}
    />
  );
}

// Entrada lateral (linhas alternadas em Serviços). Só transform + opacity.
export function SlideIn({ children, from, delay = 0, className }: { children: ReactNode; from: number; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: from }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
