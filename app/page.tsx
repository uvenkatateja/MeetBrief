import HeroSection from "@/components/ui/hero-section";
import FeaturesSection from "@/components/ui/features-section";
import IntegrationsSection from "@/components/ui/integrations-section";
// import StatsSection from "@/components/ui/stats-section";
// import WallOfLoveSection from "@/components/ui/testimonials-section";
// import Pricing from "@/components/ui/pricing-section";
// import FAQsThree from "@/components/ui/faqs-section";
// import FooterSection from "@/components/ui/footer-section";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <IntegrationsSection />
      {/* <StatsSection />
      <WallOfLoveSection /> */}
      {/* <Pricing />
      <FAQsThree /> */}

      {/* <FooterSection /> */}
    </div>
  );
}
