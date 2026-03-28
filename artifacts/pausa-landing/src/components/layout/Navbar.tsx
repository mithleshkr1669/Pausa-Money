import { useState, useEffect } from "react";
import { Link } from "wouter";
import { GlowButton } from "@/components/ui/GlowButton";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToDownload = () => {
    document.getElementById("download")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-white/5 py-4"
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group outline-none">
          <img
            src="/pausa-logo.png"
            alt="Pausa logo"
            className="h-10 w-10 object-contain rounded-lg"
          />
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">
            Pausa
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">Vision</button>
            <button onClick={() => document.getElementById("pillars")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">Pillars</button>
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">Engine</button>
          </div>
          <GlowButton size="sm" onClick={scrollToDownload}>
            Download APK
          </GlowButton>
        </div>
      </div>
    </nav>
  );
}
