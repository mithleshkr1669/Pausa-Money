import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { Swords } from "lucide-react";

export function Hero() {
  const scrollToDownload = () => {
    document.getElementById("download")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToEngine = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-abstract.png`}
          alt="Abstract financial nodes"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* Left 40%: The Vitals Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full lg:w-[40%] flex justify-center lg:justify-start"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-primary/20 border-dashed"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-secondary/20"
              />
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-32 h-32 bg-card rounded-full border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)] flex items-center justify-center"
              >
                <Swords className="w-12 h-12 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
              </motion.div>
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_hsl(var(--secondary))]" />
              <div className="absolute bottom-1/4 right-0 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
            </div>
          </motion.div>

          {/* Right 60%: Core Value Prop */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-[60%] lg:pl-12 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Financial RPG — India's AA Ecosystem
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] mb-6">
              Stop Guessing. <br />
              <span className="text-gradient">Start Growing.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Your UPI history is a mess of transactions. Pausa is the AI-powered Financial RPG that turns your bank statement into a <span className="text-foreground font-medium">"Vitality Score."</span> Level up your wealth, one transaction at a time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-4">
              <GlowButton size="lg" className="w-full sm:w-auto" onClick={scrollToDownload}>
                Enter the Arena (Early Access)
              </GlowButton>
              <GlowButton variant="outline" size="lg" className="w-full sm:w-auto" onClick={scrollToEngine}>
                Meet the AI Engine
              </GlowButton>
            </div>

            <p className="text-sm text-muted-foreground text-center lg:text-left flex items-center gap-1.5 justify-center lg:justify-start">
              <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Securely linked via India's Account Aggregator Framework.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
