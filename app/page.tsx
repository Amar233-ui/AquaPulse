import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </main>
  )
}
