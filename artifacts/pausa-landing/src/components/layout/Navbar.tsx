import { useState, useEffect } from "react";
import { Link } from "wouter";
import { GlowButton } from "@/components/ui/GlowButton";
import { Activity } from "lucide-react";
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
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <Activity className="h-6 w-6" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/20 group-hover:ring-primary/40 transition-colors" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">
            pausa<span className="text-primary">.money</span>
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
