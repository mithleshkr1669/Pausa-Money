import { motion } from "framer-motion";

export function DataPreview() {
  const bars = [
    { label: "Liquidity Score", value: 72, color: "from-primary" },
    { label: "Resilience Level", value: 58, color: "from-secondary" },
    { label: "Optimization Index", value: 84, color: "from-primary" }
  ];

  return (
    <section className="py-24 relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            See Your Financial Pulse
          </h2>
          <p className="text-muted-foreground text-lg">
            (Sample Data Visualization)
          </p>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-3xl">
          <div className="space-y-12">
            {bars.map((bar, i) => (
              <div key={bar.label}>
                <div className="flex justify-between items-end mb-4">
                  <h4 className="font-display font-bold text-lg">{bar.label}</h4>
                  <span className="text-2xl font-bold font-mono text-primary">{bar.value}%</span>
                </div>
                <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${bar.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.2 + (i * 0.2), ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${bar.color} to-background border-r border-white/20`}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-muted-foreground font-mono">
              STATUS: <span className="text-secondary">HEALTHY VITALITY DETECTED</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
