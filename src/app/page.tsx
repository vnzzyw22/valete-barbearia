import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { Footer } from "@/components/site/footer";
import { Hero, type HeroVariant } from "@/components/site/hero";
import { LocationSection } from "@/components/site/location-section";
import { MotionProvider } from "@/components/site/motion-provider";
import { Navbar } from "@/components/site/navbar";
import { ServicesSection } from "@/components/site/services-section";
import { SpaceSection } from "@/components/site/space-section";
import { TeamSection } from "@/components/site/team-section";
import { toSchemaOpeningHours } from "@/lib/business-hours";
import { getSiteUrl } from "@/lib/site-url";
import {
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

  const [business, services, professionals, gallery] = await Promise.all([
    getBusinessSettings(),
    getActiveServices(),
    getActiveProfessionals(),
    getPublicGalleryPhotos(),
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
      <Navbar />
      <main id="conteudo" className="flex flex-1 flex-col">
        <Hero variant={variant} />
        <ServicesSection services={services} whatsapp={business?.whatsapp ?? null} />
        <AboutSection />
        <TeamSection professionals={professionals} />
        <SpaceSection gallery={gallery} />
        <LocationSection business={business} />
        <ContactSection business={business} />
      </main>
      <Footer business={business} />
    </MotionProvider>
  );
}
