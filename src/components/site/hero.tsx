"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { CardIndex, ValeteLogo } from "./card-index";
import { HERO_LETTERS } from "./hero-letters";
import { HERO_BLUR_POSTER_SRC, HERO_BLUR_VIDEO_SRC, HeroVideo } from "./hero-video";
import { buttonOverMedia, buttonPrimary, container, textLink } from "./ui";

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
// B — vídeo como fundo da Hero inteira. O vídeo é vertical (720×1280): esticado em tela cheia
// ele ficaria ampliado ~2× e cortado em ~65% da altura. Por isso são duas camadas do mesmo
// arquivo (um download só, o navegador reaproveita):
//   1. fundo: cobre tudo, desfocado e escurecido — o desfoque esconde a ampliação;
//   2. nítida: à direita, perto da resolução nativa, dissolvida para a esquerda por máscara,
//      de modo que logo/título ficam sobre a parte desfocada.
// A Hero inteira faz o papel da carta: índice "V♠" nos cantos opostos, em diagonal.
// ---------------------------------------------------------------------------
function HeroB() {
  const sharpRef = useRef<HTMLVideoElement>(null);
  const blurRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // Um controle só para as duas camadas (WCAG 2.2.2).
  const toggle = () => {
    const videos = [sharpRef.current, blurRef.current].filter((v): v is HTMLVideoElement => !!v);
    if (!videos.length) return;
    if (videos[0].paused) {
      for (const v of videos) {
        v.muted = true;
        v.play().catch(() => {});
      }
    } else for (const v of videos) v.pause();
  };

  return (
    <section id="topo" className="relative isolate min-h-[100svh] overflow-hidden bg-ink">
      {/* 1. fundo desfocado */}
      <div aria-hidden="true" className="hero-b-blur absolute inset-0">
        <HeroVideo
          videoRef={blurRef}
          hideControl
          src={HERO_BLUR_VIDEO_SRC}
          poster={HERO_BLUR_POSTER_SRC}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 2. vídeo nítido, deslocado para a direita */}
      <div aria-hidden="true" className="hero-b-sharp v-fade absolute inset-y-0 right-0" style={delay(0.15)}>
        <HeroVideo
          videoRef={sharpRef}
          hideControl
          onPlayingChange={setPlaying}
          className="h-full w-full object-cover"
        />
      </div>

      {/* véu de leitura: leve, só onde há texto (esquerda no desktop, base no mobile) */}
      <div aria-hidden="true" className="hero-b-veil pointer-events-none absolute inset-0" />

      <div
        className={`${container} relative flex min-h-[100svh] flex-col justify-end pb-24 lg:justify-center lg:pb-16`}
        style={{ paddingTop: `calc(${NAV_H} + 32px)` }}
      >
        <CardIndex className="absolute top-[calc(72px+28px)] left-[clamp(20px,5vw,80px)] hidden lg:flex" />
        <div className="flex max-w-[600px] flex-col items-start gap-8">
          <h1 className="v-enter" style={delay(0.1)}>
            <ValeteLogo className="w-[clamp(240px,34vw,520px)]" label="Valete — Cut and Beard" />
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
      </div>

      {/* canto inferior direito da "carta", na mesma coluna do conteúdo (em 1920 px não encosta na borda) */}
      <div className={`${container} pointer-events-none absolute inset-x-0 bottom-8 flex items-end justify-end gap-4`}>
        <button
          type="button"
          onClick={toggle}
          className={`${buttonOverMedia} pointer-events-auto`}
          aria-label={playing ? "Pausar vídeo" : "Tocar vídeo"}
        >
          {playing ? "Pausar" : "Tocar"}
        </button>
        <CardIndex className="rotate-180" />
      </div>
    </section>
  );
}

export function Hero({ variant }: { variant: HeroVariant }) {
  return variant === "a" ? <HeroA /> : <HeroB />;
}
