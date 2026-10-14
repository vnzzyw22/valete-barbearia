import Image from "next/image";
import type { GalleryPhoto } from "@/lib/supabase/types";
import { Reveal } from "./reveal";
import { container, sectionTitle } from "./ui";

interface Photo {
  src: string;
  alt: string;
}

// Fotos reais da Valete versionadas no projeto (assets-source/fotos → public/fotos). Usadas só
// enquanto a galeria do painel não tiver fotos publicadas.
const VERSIONED: Photo[] = [
  { src: "/fotos/valete-fade-perfil.webp", alt: "Perfil de um cliente com degradê recém-feito e risca marcada." },
  { src: "/fotos/valete-barbeiro-secador.webp", alt: "Barbeiro de boné secando o cabelo de um cliente reclinado na cadeira." },
  { src: "/fotos/valete-barba-navalha-close.webp", alt: "Acabamento da barba com navalha, visto de perto." },
  { src: "/fotos/valete-fade-spray.webp", alt: "Barbeiro borrifando água no cabelo de um cliente durante o corte." },
];

// A primeira foto ocupa metade da largura e duas linhas; as outras quatro formam pares ao lado.
// Todas em 4:5: a grande tem a largura de duas pequenas + o gutter, então as alturas fecham
// (diferença de ~0,25 gutter). Sem margens negativas nem sobreposição.
const STRIP = ["md:col-span-3"];
const LAYOUT = ["col-span-2 md:col-span-6 md:row-span-2", "md:col-span-3", "md:col-span-3", "md:col-span-3", "md:col-span-3"];

export function SpaceSection({ gallery }: { gallery: GalleryPhoto[] }) {
  const photos: Photo[] =
    gallery.length > 0
      ? gallery.map((p, i) => ({ src: p.url, alt: `Foto da Valete Barbearia ${i + 1}` }))
      : VERSIONED;
  // Fotos versionadas: faixa de 4 iguais, recortadas acima da marca d'água do bigode.
  const strip = gallery.length === 0;
  const layout = strip ? STRIP : LAYOUT;

  return (
    <section id="espaco" aria-labelledby="espaco-titulo" className="scroll-mt-[72px] bg-ink py-20 md:py-32">
      <div className={container}>
        <Reveal>
          <h2 id="espaco-titulo" className={sectionTitle}>
            O espaço
          </h2>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-4 md:mt-16 md:grid-cols-12 md:gap-6">
          {photos.map((photo, i) => (
            <li key={photo.src} className={layout[i % layout.length]}>
              <div className={`relative overflow-hidden bg-carvao ${strip ? "aspect-[10/11]" : i === 0 ? "aspect-[4/5] md:aspect-auto md:h-full" : "aspect-[4/5]"}`}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={!strip && i === 0 ? "(min-width: 768px) 45vw, 100vw" : "(min-width: 768px) 22vw, 50vw"}
                  className={`object-cover ${strip ? "object-top" : ""}`}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
