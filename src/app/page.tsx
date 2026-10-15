import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { Footer } from "@/components/site/footer";
import { Hero, type HeroVariant } from "@/components/site/hero";
import { ScrollProgress, VelocityMarquee } from "@/components/site/kinetics";
import { LocationSection } from "@/components/site/location-section";
import { MotionProvider } from "@/components/site/motion-provider";
import { Navbar } from "@/components/site/navbar";
import { PlansSection } from "@/components/site/plans-section";
import { ServicesSection } from "@/components/site/services-section";
import { SpaceSection } from "@/components/site/space-section";
import { toSchemaOpeningHours } from "@/lib/business-hours";
import { getSiteUrl } from "@/lib/site-url";
import {
  getActivePlans,
  getActiveProfessionals,
  getActiveServices,
  getBusinessSettings,
  getPublicGalleryPhotos,
} from "@/lib/supabase/queries";

// Hero em duas versões até o cliente escolher (DESIGN.md > Hero): ?hero=a | ?hero=b.
const DEFAULT_HERO: HeroVariant = "b";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const variant: HeroVariant = params.hero === "a" ? "a" : params.hero === "b" ? "b" : DEFAULT_HERO;

  const [business, services, professionals, gallery, plans] = await Promise.all([
    getBusinessSettings(),
    getActiveServices(),
    getActiveProfessionals(),
    getPublicGalleryPhotos(),
    getActivePlans(),
  ]);

  // Dados estruturados de negócio local: só os campos que existem no banco.
  const jsonLd = business
    ? {
        "@context": "https://schema.org",
        "@type": "BarberShop",
        name: business.name,
        url: getSiteUrl(),
        ...(business.address && { address: business.address }),
        ...(business.whatsapp && { telephone: business.whatsapp }),
        ...(Object.keys(business.business_hours ?? {}).length > 0 && {
          openingHoursSpecification: toSchemaOpeningHours(business.business_hours),
        }),
      }
    : null;

  return (
    <MotionProvider>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ScrollProgress />
      <Navbar />
      <main id="conteudo" className="flex flex-1 flex-col">
        <Hero variant={variant} />
        <PlansSection plans={plans} whatsapp={business?.whatsapp ?? null} />
        {/* Faixas em movimento entre seções (DESIGN.md > Movimento > Ritmo), levemente inclinadas
            sobre a emenda. Os nomes vêm dos serviços cadastrados. */}
        <div className="relative z-20 -my-5 md:-my-7">
          <VelocityMarquee items={services.map((s) => s.name)} tone="dark" tilt={-2} />
        </div>
        <ServicesSection services={services} whatsapp={business?.whatsapp ?? null} />
        <AboutSection professionals={professionals} />
        <SpaceSection gallery={gallery} />
        <div className="relative z-20 -my-5 md:-my-7">
          <VelocityMarquee
            items={[business?.name ?? "Valete", "Cut and Beard", "Com hora marcada"]}
            tone="light"
            tilt={2}
            baseVelocity={1.8}
          />
        </div>
        <LocationSection business={business} />
        <ContactSection business={business} />
      </main>
      <Footer business={business} />
    </MotionProvider>
  );
}
