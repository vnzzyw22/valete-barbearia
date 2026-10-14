"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import type { Professional } from "@/lib/supabase/types";
import { MediaReveal, TitleReveal } from "./motion";
import { container, sectionTitle } from "./ui";

// "Os artistas" (pedido do usuário em 2026-10-14, antes "A casa"): texto sobre a equipe de
// barbeiros escrito a partir do que é real — os serviços informados pelo cliente e a escolha do
// profissional no agendamento. Sem anos de experiência, nomes ou número de barbeiros: isso só
// entra quando o cliente confirmar. Com null, volta o placeholder explícito.
const ABOUT_PARAGRAPHS: string[] | null = [
  "Na Valete, cada barbeiro tem o seu traço, e todos seguem o mesmo cuidado: ouvir antes de cortar, acertar o acabamento e entregar um visual que combina com você.",
  "Além do corte e da barba, a equipe faz terapia capilar e visagismo, a leitura do formato do rosto para indicar o corte e a barba que mais valorizam os seus traços.",
  "Tem um barbeiro de confiança? No agendamento você escolhe com quem quer cortar.",
];

// Recorte 10:11 com ancoragem no topo: tira da foto a faixa inferior onde fica a marca d'água
// do bigode (as fotos vêm do Instagram da casa com ela no centro da base).
const CROP = "aspect-[10/11] object-top";

// A antiga seção "Equipe" vive aqui dentro desde 2026-10-14: os retratos de quem atende entram
// abaixo do texto e da foto do grupo, só para profissional ativo com foto cadastrada no painel.
// Sem nenhuma foto, "Os artistas" fica só com o texto e a foto da equipe.
export function AboutSection({ professionals = [] }: { professionals?: Professional[] }) {
  const roster = professionals.filter((p) => p.photo_url);
  const photoRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: photoRef, offset: ["start end", "end start"] });
  // Movimento único e lento da foto: leve zoom-out acompanhando a rolagem.
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);

  return (
    <section id="artistas" aria-labelledby="artistas-titulo" className="scroll-mt-[72px] bg-carvao py-20 md:py-32">
      <div className={`${container} grid gap-12 lg:grid-cols-12 lg:gap-10`}>
        <div className="flex flex-col lg:col-span-5 lg:pt-6">
          <h2 id="artistas-titulo" className={sectionTitle}>
            <TitleReveal>Os artistas</TitleReveal>
          </h2>

          <p className="font-display mt-8 max-w-[22ch] text-[clamp(1.375rem,2vw,1.75rem)] leading-[1.2] font-bold text-white">
            A equipe que cuida do seu corte e da sua barba, do primeiro ao último detalhe.
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
          <figcaption className="mt-4 text-[15px] text-cinza">Os artistas da Valete.</figcaption>
        </figure>
      </div>

      {roster.length > 0 && (
        <div className={`${container} mt-20 md:mt-28`}>
          <h3 className="border-t border-ardosia pt-8 text-lg font-bold [font-stretch:112%] text-white">
            Quem atende
          </h3>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {roster.map((p, i) => (
              <li key={p.id}>
                <MediaReveal className="aspect-[4/5]" delay={(i % 4) * 0.08}>
                  <Image
                    src={p.photo_url!}
                    alt={`Retrato de ${p.name}`}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover"
                  />
                </MediaReveal>
                <p className="mt-4 text-lg font-bold [font-stretch:112%] text-white">{p.name}</p>
                {p.bio && <p className="mt-1 text-[15px] leading-relaxed text-cinza">{p.bio}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
