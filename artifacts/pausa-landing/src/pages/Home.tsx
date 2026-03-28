import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Pillars } from "@/components/sections/Pillars";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { DataPreview } from "@/components/sections/DataPreview";
import { Download } from "@/components/sections/Download";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      <main>
        <Hero />
        <Problem />
        <Pillars />
        <HowItWorks />
        <DataPreview />
        <Download />
      </main>

      <Footer />
    </div>
  );
}
