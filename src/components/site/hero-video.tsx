"use client";

import { useEffect, useRef, useState } from "react";
import { buttonOverMedia } from "./ui";
import { usePrefersReducedMotion } from "./use-media-query";

export const HERO_VIDEO_SRC = "/videos/valete-hero-v2.mp4";
export const HERO_POSTER_SRC = "/videos/valete-hero-v2-poster.webp";

interface HeroVideoProps {
  className?: string;
  /** Onde fica o botão de pausar/tocar dentro do quadro. */
  controlClassName?: string;
  /** Some o botão (ex.: o vídeo vazado nas letras usa um controle externo). */
  hideControl?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Vídeo da Hero (sem legenda, sem áudio). Toca sozinho, em loop e mudo, exceto com
 * `prefers-reduced-motion`: aí fica o poster e o visitante decide se toca. Sempre há botão de
 * pausar (WCAG 2.2.2).
 *
 * Lições herdadas do Lkas (CLAUDE.md): `muted` setado antes do play(), play reforçado em
 * loadedmetadata/canplay, camada própria de composição e nenhum z-index negativo em ancestral.
 */
export function HeroVideo({ className, controlClassName, hideControl, onPlayingChange, videoRef }: HeroVideoProps) {
  const reduceMotion = usePrefersReducedMotion();
  const localRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? localRef;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    if (reduceMotion) {
      video.pause();
      return;
    }
    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay bloqueado pelo navegador: o poster continua visível e o botão permite tocar.
      });
    };
    if (video.readyState >= 3) tryPlay();
    else {
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
      video.addEventListener("canplay", tryPlay, { once: true });
    }
    return () => {
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [reduceMotion, ref]);

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  return (
    <>
      <video
        ref={ref}
        src={HERO_VIDEO_SRC}
        poster={HERO_POSTER_SRC}
        muted
        loop
        playsInline
        preload={reduceMotion ? "none" : "auto"}
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={className}
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
      />
      {!hideControl && (
        <button
          type="button"
          onClick={toggle}
          className={`${buttonOverMedia} absolute ${controlClassName ?? "bottom-4 left-4"}`}
          aria-label={playing ? "Pausar vídeo" : "Tocar vídeo"}
        >
          {playing ? "Pausar" : "Tocar"}
        </button>
      )}
    </>
  );
}
