import { motion } from "framer-motion";
import { Waves, Shield, Zap } from "lucide-react";

export function Pillars() {
  const pillars = [
    {
      title: "LIQUIDITY",
      subtitle: '"The Flow"',
      icon: Waves,
      color: "text-primary",
      glow: "shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
      desc: "Track your daily cash health. Know exactly how many days of \"Life\" your current balance buys you."
    },
    {
      title: "RESILIENCE",
      subtitle: '"The Shield"',
      icon: Shield,
      color: "text-secondary",
      glow: "shadow-[0_0_30px_hsl(var(--secondary)/0.15)]",
      desc: "Build a defense against the unexpected. Automate your emergency fund and \"Shield\" your family with smart insurance."
    },
    {
      title: "OPTIMIZATION",
      subtitle: '"The Edge"',
      icon: Zap,
      color: "text-primary",
      glow: "shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
      desc: "Our DistilBERT AI finds the \"Ghost Subscriptions\" and impulse leaks you didn't know existed."
    }
  ];

  return (
    <section id="pillars" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">The Core Framework</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold">
            The 3 Pillars of Vitality
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className={`glow-border bg-card rounded-3xl p-8 ${pillar.glow} hover:-translate-y-2 transition-transform duration-300`}
            >
              <div className="mb-6 relative inline-block">
                <div className={`absolute inset-0 blur-xl opacity-50 ${pillar.color} bg-current`} />
                <pillar.icon className={`w-14 h-14 ${pillar.color} relative z-10`} strokeWidth={1.5} />
              </div>
              <p className={`text-xs font-bold tracking-widest uppercase ${pillar.color} mb-1`}>{pillar.title}</p>
              <h3 className="text-2xl font-display font-bold mb-2">{pillar.subtitle}</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
