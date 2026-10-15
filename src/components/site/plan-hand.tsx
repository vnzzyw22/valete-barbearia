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
import { CardIndex, Spade } from "./card-index";
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

// Grão de papel de carta (ruído fractal em SVG, embutido): quase invisível, tira o "plástico" da face.
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Face da carta de um plano, desenhada como carta de baralho impressa (DESIGN.md > Assinaturas):
// moldura de filete duplo com pips de espada nos cantos, índice "V ♠" nos dois cantos (o de baixo
// invertido), um naipe grande em marca d'água ao centro, filete com naipe separando o nome do
// preço e grão de papel. O plano em destaque é a carta "especial" do baralho: face carvão,
// filetes brancos e naipe em latão.
function PlanFace({ card }: { card: HandCard }) {
  const special = card.featured;
  const ink = special ? "text-white" : "text-carvao";
  const muted = special ? "text-white/65" : "text-carvao/65";
  const rule = special ? "border-latao/55" : "border-carvao/20";
  const ruleSoft = special ? "border-latao/20" : "border-carvao/10";
  const pip = special ? "bg-latao" : "bg-carvao";

  return (
    <article
      aria-label={`Plano ${card.name}`}
      className={`relative flex aspect-[5/7] w-full flex-col overflow-hidden rounded-[22px] select-none ${
        special ? "bg-carvao ring-1 ring-latao/40" : "bg-[#fbfaf7]"
      } ${ink}`}
    >
      {/* grão de papel */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${special ? "opacity-[0.07] mix-blend-screen" : "opacity-[0.09] mix-blend-multiply"}`}
        style={{ backgroundImage: PAPER_GRAIN }}
      />
      {/* moldura de filete duplo */}
      <span aria-hidden="true" className={`pointer-events-none absolute inset-[12px] rounded-[14px] border ${rule}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute inset-[17px] rounded-[10px] border ${ruleSoft}`} />
      {/* pips nos cantos da moldura interna */}
      {["top-[24px] right-[24px]", "bottom-[24px] left-[24px] rotate-180"].map((pos) => (
        <Spade key={pos} className={`absolute w-[9px] opacity-40 ${pos} ${pip}`} />
      ))}
      {/* naipe grande em marca d'água */}
      <Spade
        className={`pointer-events-none absolute top-1/2 left-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 ${
          special ? "bg-white/[0.035]" : "bg-carvao/[0.035]"
        }`}
      />

      <CardIndex tone={special ? "dark" : "face"} className="absolute top-[26px] left-[26px]" />
      <CardIndex tone={special ? "dark" : "face"} className="absolute right-[26px] bottom-[26px] rotate-180" />

      <div className="relative flex flex-1 flex-col justify-center px-[52px] py-16">
        <h3 className="font-display max-w-[11ch] text-[clamp(1.5rem,6vw,1.85rem)] leading-[0.98] font-extrabold tracking-[-0.01em] lg:text-[1.85rem]">
          {card.name}
        </h3>
        {card.details && <p className={`mt-2.5 max-w-[24ch] text-[14px] leading-snug ${muted}`}>{card.details}</p>}

        {/* filete com naipe */}
        <span aria-hidden="true" className="my-6 flex items-center gap-2.5">
          <span className={`h-px flex-1 ${special ? "bg-latao/45" : "bg-carvao/20"}`} />
          <Spade className={`w-[10px] ${special ? pip : "bg-latao"}`} />
          <span className={`h-px flex-1 ${special ? "bg-latao/45" : "bg-carvao/20"}`} />
        </span>

        <p className="font-display text-[clamp(1.9rem,8vw,2.3rem)] leading-none font-extrabold tracking-[-0.02em] tabular-nums lg:text-[2.3rem]">
          <span className={special ? "text-ouro" : undefined}>{card.price}</span>
        </p>
        <p className={`mt-1.5 text-[14px] ${muted}`}>{card.period}</p>

        {card.href && (
          <a
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            className={`mt-6 inline-flex min-h-11 items-center justify-center self-start rounded-full px-5 py-2.5 text-[14px] font-semibold transition-[background-color,transform] duration-200 active:scale-[0.96] ${
              special
                ? "bg-ouro text-carvao hover:brightness-110"
                : "bg-carvao text-white hover:bg-carvao/85 focus-visible:outline-carvao"
            }`}
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
