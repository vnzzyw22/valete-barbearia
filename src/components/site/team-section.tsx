import Image from "next/image";
import type { Professional } from "@/lib/supabase/types";
import { Reveal } from "./reveal";
import { container, sectionTitle } from "./ui";

// Só aparece com profissional ativo que tenha foto cadastrada no painel (DESIGN.md > Seções).
export function TeamSection({ professionals }: { professionals: Professional[] }) {
  const withPhoto = professionals.filter((p) => p.photo_url);
  if (withPhoto.length === 0) return null;

  return (
    <section id="equipe" aria-labelledby="equipe-titulo" className="scroll-mt-[72px] bg-carvao py-20 md:py-32">
      <div className={container}>
        <Reveal>
          <h2 id="equipe-titulo" className={sectionTitle}>
            Equipe
          </h2>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {withPhoto.map((p) => (
            <li key={p.id}>
              <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                <Image
                  src={p.photo_url!}
                  alt={`Foto de ${p.name}`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-4 text-lg font-bold [font-stretch:112%] text-white">{p.name}</p>
              {p.bio && <p className="mt-1 text-[15px] leading-relaxed text-cinza">{p.bio}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
