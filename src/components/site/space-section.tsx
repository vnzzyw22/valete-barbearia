"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/supabase/types";
import { SectionMark } from "./kinetics";
import { TitleReveal } from "./motion";
import { sectionTitle } from "./ui";

interface Photo {
  src: string;
  alt: string;
  caption?: string;
  // Recorte: as fotos do Instagram (4:5) trazem a marca d'água do bigode no centro da base
  // (~89–93% da altura). Quadros mais "deitados" que 4:5 com ancoragem alta deixam a marca de fora.
  position?: string;
  // Proporção do quadro (largura / altura). Nunca abaixo de ~0,9 com estas fotos.
  aspect: number;
}

// Fotos reais da Valete versionadas no projeto (assets-source/fotos → public/fotos). Usadas só
// enquanto a galeria do painel não tiver fotos publicadas. São retratos do trabalho, não do salão.
const VERSIONED: Photo[] = [
  {
    src: "/fotos/valete-barbeiro-secador.webp",
    alt: "Barbeiro de boné finalizando a barba de um cliente reclinado, com o secador, diante da parede com o logo da Valete.",
    caption: "Finalização da barba",
    position: "50% 30%",
    aspect: 1,
  },
  {
    src: "/fotos/valete-fade-spray.webp",
    alt: "Barbeiro borrifando água no cabelo de um cliente com degradê e risca, a névoa aparecendo contra o fundo escuro.",
    caption: "Degradê com risca",
    position: "50% 0%",
    aspect: 0.9,
  },
  {
    src: "/fotos/valete-fade-perfil.webp",
    alt: "Perfil de um cliente com degradê baixo recém-feito.",
    caption: "Degradê baixo",
    position: "50% 0%",
    aspect: 1,
  },
  {
    src: "/fotos/valete-barba-navalha-close.webp",
    alt: "Navalha acertando o pezinho, o contorno da nuca, visto bem de perto.",
    caption: "Pezinho na navalha",
    position: "40% 42%",
    aspect: 1.5,
  },
];

// "O trabalho" em rolagem horizontal (DESIGN.md > Movimento > O trabalho): a seção prende na tela
// e a rolagem vertical anda a fila de fotos para o lado, com parallax dentro de cada quadro.
// Sem JavaScript ou com movimento reduzido, vira uma fileira comum de rolar para o lado.
export function SpaceSection({ gallery }: { gallery: GalleryPhoto[] }) {
  const photos: Photo[] =
    gallery.length > 0
      ? gallery.slice(0, 8).map((p, i) => ({ src: p.url, alt: `Trabalho da Valete Barbearia, foto ${i + 1}`, aspect: 1 }))
      : VERSIONED;

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // Quanto a fila precisa andar (largura da fila − largura da tela). 0 = ainda não medido.
  const [distance, setDistance] = useState(0);
  const pinned = !reduceMotion && distance > 0;

  useEffect(() => {
    if (reduceMotion) return;
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduceMotion]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.0005 });
  const x = useTransform(progress, (p) => -p * distance);
  const imageShift = useTransform(progress, [0, 1], ["5%", "-5%"]);

  return (
    <section
      ref={sectionRef}
      id="trabalho"
      aria-labelledby="trabalho-titulo"
      className="relative scroll-mt-[72px] bg-ink"
      style={pinned ? { height: `calc(100svh + ${distance}px)` } : undefined}
    >
      <div
        className={
          pinned
            ? "sticky top-0 flex h-[100svh] items-center overflow-hidden"
            : "overflow-x-auto py-20 [scrollbar-width:none] md:py-32"
        }
      >
        <motion.div
          ref={trackRef}
          className="flex w-max items-end gap-[clamp(20px,4vw,64px)] px-[clamp(20px,5vw,80px)] pt-[72px] will-change-transform"
          style={pinned ? { x } : undefined}
        >
          <div className="flex w-[min(78vw,400px)] shrink-0 flex-col self-center">
            <SectionMark rank="J" />
            <h2 id="trabalho-titulo" className={sectionTitle}>
              <TitleReveal>O trabalho</TitleReveal>
            </h2>
            <p className="mt-5 max-w-[30ch] text-[17px] leading-relaxed text-cinza">
              O que sai das cadeiras da Valete, fotografado de perto.
            </p>
            <p className="mt-8 flex items-center gap-3 text-[15px] font-semibold text-white">
              {pinned ? "Continue rolando" : "Arraste para o lado"}
              <motion.span
                aria-hidden="true"
                animate={reduceMotion ? undefined : { x: [0, 8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </p>
          </div>

          {photos.map((photo, i) => (
            <WorkPhoto key={photo.src} photo={photo} index={i} shift={pinned ? imageShift : null} />
          ))}
        </motion.div>

        {pinned && <WorkProgress progress={progress} count={photos.length} />}
      </div>
    </section>
  );
}

function WorkPhoto({ photo, index, shift }: { photo: Photo; index: number; shift: MotionValue<string> | null }) {
  // Alterna a altura dos quadros para a fila não parecer uma régua.
  const height = index % 2 === 0 ? "h-[min(56svh,620px)]" : "h-[min(46svh,500px)]";
  return (
    <figure className={`shrink-0 ${index % 2 === 1 ? "mb-[8svh]" : ""}`}>
      <div
        className={`relative overflow-hidden bg-carvao ${height}`}
        style={{ aspectRatio: String(photo.aspect) }}
      >
        <motion.div className="absolute inset-y-0 -inset-x-[7%]" style={shift ? { x: shift } : undefined}>
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1024px) 45vw, 85vw"
            className="object-cover"
            style={photo.position ? { objectPosition: photo.position } : undefined}
          />
        </motion.div>
      </div>
      {photo.caption && (
        <figcaption className="mt-3 flex items-baseline gap-3 text-[15px] text-cinza">
          <span className="font-semibold text-white tabular-nums">{String(index + 1).padStart(2, "0")}</span>
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}

function WorkProgress({ progress, count }: { progress: MotionValue<number>; count: number }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1]);
  const [current, setCurrent] = useState(1);
  useEffect(
    () => progress.on("change", (p) => setCurrent(Math.min(count, Math.max(1, Math.round(p * (count - 1)) + 1)))),
    [progress, count],
  );
  return (
    <div aria-hidden="true" className="absolute inset-x-[clamp(20px,5vw,80px)] bottom-8 flex items-center gap-4">
      <span className="text-[13px] font-semibold text-white tabular-nums">
        {String(current).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </span>
      <span className="relative h-px flex-1 bg-white/15">
        <motion.span className="absolute inset-0 origin-left bg-white" style={{ scaleX }} />
      </span>
    </div>
  );
}
