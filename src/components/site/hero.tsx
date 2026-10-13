"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { CardIndex, ValeteLogo } from "./card-index";
import { HERO_LETTERS } from "./hero-letters";
import { HeroVideo } from "./hero-video";
import { buttonPrimary, container, textLink } from "./ui";

export type HeroVariant = "a" | "b";

const HEADLINE = "Corte e barba, com hora marcada.";
const NAV_H = "72px";
// Altura útil da primeira dobra (sem navbar e respiro vertical).
const FOLD = `(100svh - ${NAV_H} - 64px)`;

// Entrada em sequência curta (CSS .v-enter em globals.css, desligada com movimento reduzido).
const delay = (seconds: number, extra?: CSSProperties) =>
  ({ ...extra, "--v-delay": `${seconds}s` }) as CSSProperties;

function Actions() {
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
      <Link href="/agendar" className={buttonPrimary}>
        Agendar horário
      </Link>
      <a href="#servicos" className={textLink}>
        Ver serviços
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A — "VA / LE / TE": contorno branco, vídeo só por dentro das letras.
// ---------------------------------------------------------------------------
const lettersMask: CSSProperties = {
  WebkitMaskImage: "url(/brand/hero-vale-te.svg)",
  maskImage: "url(/brand/hero-vale-te.svg)",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

function HeroA() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const ratio = HERO_LETTERS.width / HERO_LETTERS.height;

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = true;
      v.play().catch(() => {});
    } else v.pause();
  };

  return (
    <section id="topo" className="relative bg-carvao" style={{ paddingTop: NAV_H }}>
      <h1 className="sr-only">Valete Barbearia — corte e barba</h1>
      <div className={`${container} grid min-h-[calc(100svh-72px)] content-center gap-10 pt-6 pb-10 lg:grid-cols-12 lg:items-end`}>
        <div className="lg:col-span-7">
          <div
            className="relative"
            style={{ aspectRatio: `${ratio}`, width: `min(100%, calc(${FOLD} * ${ratio}))` }}
          >
            <div
              className="v-fade absolute inset-0 bg-ink"
              style={delay(0.9, lettersMask)}
            >
              <HeroVideo
                videoRef={videoRef}
                hideControl
                onPlayingChange={setPlaying}
                className="h-full w-full object-cover"
              />
            </div>
            <svg viewBox={HERO_LETTERS.viewBox} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <path
                d={HERO_LETTERS.d}
                pathLength={1}
                className="v-draw"
                fill="none"
                stroke="#fff"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-start gap-7 lg:col-span-5 lg:pb-2">
          <div className="v-enter" style={delay(0.5)}>
            <ValeteLogo className="w-[clamp(150px,13vw,200px)]" label="Valete — Cut and Beard" />
          </div>
          <p
            style={delay(0.65)}
            className="v-enter font-display max-w-[14ch] text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.02] font-bold tracking-[-0.01em] text-white"
          >
            {HEADLINE}
          </p>
          <div className="v-enter" style={delay(0.8)}>
            <Actions />
          </div>
          <button
            type="button"
            onClick={toggle}
            className="min-h-11 text-sm font-medium text-cinza underline decoration-1 underline-offset-4 hover:text-white"
          >
            {playing ? "Pausar vídeo" : "Tocar vídeo"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// B — logo em destaque + título + CTA; vídeo no painel vertical enquadrado como carta.
// ---------------------------------------------------------------------------
function HeroB() {
  return (
    <section id="topo" className="relative bg-carvao" style={{ paddingTop: NAV_H }}>
      <div className={`${container} grid min-h-[calc(100svh-72px)] items-center gap-12 py-8 lg:grid-cols-12`}>
        <div className="order-2 flex flex-col items-start gap-8 lg:order-1 lg:col-span-6 xl:col-span-7">
          <h1 className="v-enter" style={delay(0.1)}>
            <ValeteLogo className="w-[clamp(260px,34vw,520px)]" label="Valete — Cut and Beard" />
          </h1>
          <p
            style={delay(0.3)}
            className="v-enter font-display max-w-[16ch] text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.02] font-bold tracking-[-0.01em] text-white"
          >
            {HEADLINE}
          </p>
          <div className="v-enter" style={delay(0.45)}>
            <Actions />
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2 lg:col-span-6 lg:justify-end xl:col-span-5">
          <div
            className="v-enter relative overflow-hidden rounded-[18px] border border-ardosia bg-ink"
            style={delay(0, { aspectRatio: "9 / 16", width: `min(100%, calc(${FOLD} * 9 / 16))` })}
          >
            <HeroVideo className="absolute inset-0 h-full w-full object-cover" controlClassName="bottom-4 left-4" />
            {/* véu só nos cantos, para o índice ficar legível sobre o vídeo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 0 0, rgba(10,10,10,.6), transparent 28%), radial-gradient(circle at 100% 100%, rgba(10,10,10,.6), transparent 28%)",
              }}
            />
            <CardIndex className="absolute top-4 left-4" />
            <CardIndex className="absolute right-4 bottom-4 rotate-180" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Hero({ variant }: { variant: HeroVariant }) {
  return variant === "a" ? <HeroA /> : <HeroB />;
}
