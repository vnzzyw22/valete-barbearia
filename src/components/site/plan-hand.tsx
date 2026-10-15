"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, useState, type MouseEvent } from "react";
import { CardIndex } from "./card-index";
import { PlayingCard } from "./playing-card";
import { useMediaQuery } from "./use-media-query";

export interface HandCard {
  id: string;
  name: string;
  details: string | null;
  price: string;
  period: string;
  href: string | null;
  featured: boolean;
}

// Face branca da carta de um plano (a mesma da carta de antes, agora uma por plano).
function PlanFace({ card }: { card: HandCard }) {
  return (
    <article
      aria-label={`Plano ${card.name}`}
      className="relative flex aspect-[5/7] w-full flex-col rounded-[22px] bg-white text-carvao select-none"
    >
      <CardIndex tone="face" className="absolute top-5 left-5" />
      <CardIndex tone="face" className="absolute right-5 bottom-5 rotate-180" />

      <div className="flex flex-1 flex-col justify-center px-10 py-14">
        <h3 className="font-display max-w-[11ch] text-[clamp(1.6rem,6.5vw,2rem)] leading-[0.98] font-extrabold tracking-[-0.01em] lg:text-[2rem]">
          {card.name}
        </h3>
        {card.details && <p className="mt-3 max-w-[26ch] text-[15px] leading-snug text-carvao/70">{card.details}</p>}

        <p className="font-display mt-8 text-[clamp(2.1rem,9vw,2.6rem)] leading-none font-extrabold tracking-[-0.02em] tabular-nums lg:text-[2.6rem]">
          {card.price}
        </p>
        <p className="mt-2 text-[15px] text-carvao/70">{card.period}</p>

        {card.href && (
          <a
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            className="mt-8 inline-flex min-h-11 items-center justify-center self-start rounded-full bg-carvao px-6 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-carvao/85 focus-visible:outline-carvao active:scale-[0.96]"
          >
            Assinar pelo WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}

// Mão de cartas dos planos (DESIGN.md > Assinaturas). No computador as cartas chegam empilhadas
// e se abrem em leque conforme a seção entra na tela; com o mouse, a carta sobe da mão. No
// celular viram um baralho: arrasta-se a carta da frente para o lado e a próxima assume.
export function PlanHand({ cards }: { cards: HandCard[] }) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  return desktop ? <Fan cards={cards} /> : <Deck cards={cards} />;
}

function Fan({ cards }: { cards: HandCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.3"] });
  const springy = useSpring(scrollYProgress, { stiffness: 110, damping: 22 });
  const open = useMotionValue(1);
  const spread = reduceMotion ? open : springy;

  // O plano em destaque no centro da mão; os outros alternam para os lados.
  const lead = cards.find((c) => c.featured) ?? cards[0];
  const center: HandCard[] = [lead];
  cards.filter((c) => c !== lead).forEach((card, i) => (i % 2 === 0 ? center.unshift(card) : center.push(card)));
  const mid = (center.length - 1) / 2;

  return (
    <div ref={ref} className="relative mx-auto h-[540px] w-full max-w-[1040px]">
      {center.map((card, i) => (
        <FanCard
          key={card.id}
          card={card}
          offset={i - mid}
          spread={spread}
          lifted={hovered === i}
          onHover={(on) => setHovered(on ? i : null)}
          delay={Math.abs(i - mid) * 0.12}
        />
      ))}
    </div>
  );
}

function FanCard({
  card,
  offset,
  spread,
  lifted,
  onHover,
  delay,
}: {
  card: HandCard;
  offset: number;
  spread: MotionValue<number>;
  lifted: boolean;
  onHover: (on: boolean) => void;
  delay: number;
}) {
  const x = useTransform(spread, (s) => offset * s * 345);
  const y = useTransform(spread, (s) => Math.abs(offset) * s * 34);
  const rotate = useTransform(spread, (s) => offset * s * 8);
  const z = 20 - Math.abs(offset) * 4 + (lifted ? 30 : 0) + (card.featured ? 2 : 0);

  return (
    <motion.div
      className="absolute top-0 left-1/2 -ml-[165px] w-[330px]"
      style={{ x, y, rotate, zIndex: z }}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onFocusCapture={() => onHover(true)}
      onBlurCapture={() => onHover(false)}
    >
      <motion.div
        animate={{ y: lifted ? -26 : 0, scale: card.featured ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <PlayingCard restTilt={0} delay={delay}>
          <PlanFace card={card} />
        </PlayingCard>
      </motion.div>
    </motion.div>
  );
}

function Deck({ cards }: { cards: HandCard[] }) {
  // O destaque começa na frente.
  const initial = [...cards.keys()].sort((a, b) => Number(cards[b].featured) - Number(cards[a].featured));
  const [order, setOrder] = useState(initial);
  const dragged = useRef(false);

  const next = () => setOrder((o) => [...o.slice(1), o[0]]);
  const prev = () => setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]);
  const frontIndex = order[0];

  // Soltar o dedo depois de arrastar não pode abrir o WhatsApp da carta.
  const blockClickAfterDrag = (event: MouseEvent) => {
    if (dragged.current) {
      event.preventDefault();
      event.stopPropagation();
      dragged.current = false;
    }
  };

  return (
    <div>
      <div className="relative mx-auto mb-12 aspect-[5/7] w-[min(82vw,340px)]">
        {cards.map((card, i) => {
          const k = order.indexOf(i);
          const front = k === 0;
          return (
            <motion.div
              key={card.id}
              className="absolute inset-0 touch-pan-y"
              style={{ zIndex: cards.length - k }}
              animate={{
                y: k * 18,
                scale: 1 - k * 0.06,
                rotate: front ? 0 : k % 2 === 1 ? 5 : -5,
                opacity: k > 2 ? 0 : 1,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              drag={front ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.75}
              whileDrag={{ rotate: 3, scale: 1.02 }}
              onDragStart={() => (dragged.current = true)}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 70 || Math.abs(info.velocity.x) > 450) {
                  if (info.offset.x < 0) next();
                  else prev();
                }
              }}
              onClickCapture={blockClickAfterDrag}
              inert={!front}
            >
              <PlayingCard restTilt={0} delay={k * 0.15}>
                <PlanFace card={card} />
              </PlayingCard>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={prev}
          className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 text-white transition-transform active:scale-90"
          aria-label="Plano anterior"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2" aria-hidden="true">
            {cards.map((card, i) => (
              <span
                key={card.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === frontIndex ? "w-6 bg-white" : "w-1.5 bg-white/30"}`}
              />
            ))}
          </div>
          <p className="text-[13px] text-cinza" aria-live="polite">
            {cards[frontIndex].name} · arraste para o lado
          </p>
        </div>
        <button
          type="button"
          onClick={next}
          className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 text-white transition-transform active:scale-90"
          aria-label="Próximo plano"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
