"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { Reveal } from "./reveal";
import { container, sectionTitle } from "./ui";

// Texto sobre a barbearia: ainda não recebido do cliente (história, desde quando, o que a casa
// valoriza). Enquanto for null, a seção mostra um placeholder explícito — nada inventado.
// Para publicar, troque por um array de parágrafos reais.
const ABOUT_PARAGRAPHS: string[] | null = null;

// Recorte 10:11 com ancoragem no topo: tira da foto a faixa inferior onde fica a marca d'água
// do bigode (as fotos vêm do Instagram da casa com ela no centro da base).
const CROP = "aspect-[10/11] object-top";

export function AboutSection() {
  const photoRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: photoRef, offset: ["start end", "end start"] });
  // Movimento único e lento da foto: leve zoom-out acompanhando a rolagem.
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);

  return (
    <section id="sobre" aria-labelledby="sobre-titulo" className="scroll-mt-[72px] bg-carvao py-20 md:py-32">
      <div className={`${container} grid gap-12 lg:grid-cols-12 lg:gap-10`}>
        <div className="flex flex-col lg:col-span-5 lg:pt-6">
          <Reveal>
            <h2 id="sobre-titulo" className={sectionTitle}>
              A casa
            </h2>
          </Reveal>

          {/* Informado pelo cliente em 2026-10-14. Preços e durações vêm de `services` (painel). */}
          <p className="font-display mt-8 max-w-[24ch] text-[clamp(1.375rem,2vw,1.75rem)] leading-[1.2] font-bold text-white">
            Corte de cabelo, alinhamento de barba, terapia capilar e visagismo.
          </p>

          {ABOUT_PARAGRAPHS ? (
            <div className="mt-8 flex max-w-[52ch] flex-col gap-5 text-[17px] leading-[1.65] text-cinza">
              {ABOUT_PARAGRAPHS.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          ) : (
            <div className="mt-8 max-w-[52ch] rounded-[12px] border border-dashed border-white/30 px-6 py-5 text-[15px] leading-relaxed text-cinza">
              <p className="font-semibold text-white">Texto da barbearia pendente</p>
              <p className="mt-2">
                Espaço reservado para a história da Valete: desde quando atende, como a equipe se formou e o que a casa
                valoriza no corte e na barba. Aguardando o texto real.
              </p>
            </div>
          )}
        </div>

        <figure className="lg:col-span-7">
          <div ref={photoRef} className="relative overflow-hidden bg-ink">
            <motion.div style={reduceMotion ? undefined : { scale }} className="origin-center">
              <Image
                src="/fotos/valete-equipe-parede-logo.webp"
                alt="Equipe da Valete rindo em frente à parede preta com o logo pintado em branco."
                width={1080}
                height={1188}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className={`h-auto w-full object-cover ${CROP}`}
              />
            </motion.div>
          </div>
          <figcaption className="mt-4 text-[15px] text-cinza">A equipe da Valete.</figcaption>
        </figure>
      </div>
    </section>
  );
}
