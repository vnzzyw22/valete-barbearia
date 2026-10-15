import Image from "next/image";
import type { GalleryPhoto } from "@/lib/supabase/types";
import { MediaReveal, TitleReveal } from "./motion";
import { container, sectionTitle } from "./ui";

interface Photo {
  src: string;
  alt: string;
  caption?: string;
  // Recorte: as fotos do Instagram trazem a marca d'água do bigode no centro da base (~91–94% da
  // altura). Em 9:10 sobra 89% da altura: ancorar no topo (0%) deixa a marca de fora.
  position?: string;
}

// Fotos reais da Valete versionadas no projeto (assets-source/fotos → public/fotos). Usadas só
// enquanto a galeria do painel não tiver fotos publicadas. São retratos do trabalho, não do
// salão — por isso a seção se chama "O trabalho" (2026-10-14; antes "O espaço").
const VERSIONED: Photo[] = [
  {
    src: "/fotos/valete-barbeiro-secador.webp",
    alt: "Barbeiro de boné finalizando a barba de um cliente reclinado, com o secador, diante da parede com o logo da Valete.",
    caption: "Finalização da barba",
    position: "50% 40%",
  },
  {
    src: "/fotos/valete-fade-spray.webp",
    alt: "Barbeiro borrifando água no cabelo de um cliente com degradê e risca, a névoa aparecendo contra o fundo escuro.",
    caption: "Degradê com risca",
    position: "50% 0%",
  },
  {
    src: "/fotos/valete-fade-perfil.webp",
    alt: "Perfil de um cliente com degradê baixo recém-feito.",
    caption: "Degradê baixo",
    position: "50% 0%",
  },
  {
    src: "/fotos/valete-barba-navalha-close.webp",
    alt: "Navalha acertando o pezinho, o contorno da nuca, visto bem de perto.",
    caption: "Pezinho na navalha",
    position: "40% 42%",
  },
];

// Composição editorial em 12 colunas (desktop), com escala e ritmo em vez de quadrados iguais:
//   linha 1: foto grande à esquerda (7 col.) | título, texto e a 2ª foto à direita (4 col.)
//   linha 2: 3ª foto menor (4 col.)          | 4ª foto em recorte horizontal, mais baixa (7 col.)
// No celular: grande, depois duas lado a lado, depois a horizontal.
const SLOTS = [
  { li: "col-span-2 lg:col-span-7 lg:row-span-2", frame: "aspect-[4/5]", sizes: "(min-width: 1024px) 55vw, 100vw" },
  { li: "col-span-1 lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:self-end", frame: "aspect-[9/10]", sizes: "(min-width: 1024px) 30vw, 50vw" },
  { li: "col-span-1 lg:col-span-4 lg:row-start-3 lg:mt-16", frame: "aspect-[9/10]", sizes: "(min-width: 1024px) 30vw, 50vw" },
  { li: "col-span-2 lg:col-span-7 lg:col-start-6 lg:row-start-3 lg:mt-40", frame: "aspect-[3/2]", sizes: "(min-width: 1024px) 55vw, 100vw" },
];

export function SpaceSection({ gallery }: { gallery: GalleryPhoto[] }) {
  const photos: Photo[] =
    gallery.length > 0
      ? gallery.slice(0, SLOTS.length).map((p, i) => ({ src: p.url, alt: `Trabalho da Valete Barbearia, foto ${i + 1}` }))
      : VERSIONED;

  return (
    <section id="trabalho" aria-labelledby="trabalho-titulo" className="scroll-mt-[72px] bg-ink py-20 md:py-32">
      <div className={`${container} grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0`}>
        <div className="col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-1">
          <h2 id="trabalho-titulo" className={sectionTitle}>
            <TitleReveal>O trabalho</TitleReveal>
          </h2>
          <p className="mt-5 max-w-[30ch] text-[17px] leading-relaxed text-cinza">
            O que sai das cadeiras da Valete, fotografado de perto.
          </p>
        </div>

        {photos.map((photo, i) => {
          const slot = SLOTS[i];
          return (
            <figure key={photo.src} className={slot.li}>
              <MediaReveal className={slot.frame} delay={i % 2 === 1 ? 0.15 : 0}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={slot.sizes}
                  className="object-cover"
                  style={photo.position ? { objectPosition: photo.position } : undefined}
                />
              </MediaReveal>
              {photo.caption && <figcaption className="mt-3 text-[15px] text-cinza">{photo.caption}</figcaption>}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
