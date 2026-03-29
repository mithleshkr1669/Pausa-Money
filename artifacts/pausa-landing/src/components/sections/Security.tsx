import { motion } from "framer-motion";
import { ShieldCheck, Eye, Lock, Server } from "lucide-react";

export function Security() {
  const points = [
    {
      icon: Eye,
      title: "Read-Only Access",
      desc: "We can see your data — not touch it. Your money can never be moved by us. Ever."
    },
    {
      icon: Lock,
      title: "No Passwords Stored",
      desc: "We connect via the official AA framework. Your bank credentials never pass through our servers."
    },
    {
      icon: Server,
      title: "Bank-Grade Encryption",
      desc: "End-to-end AES-256 encryption on all data in transit and at rest. ReBIT-compliant infrastructure."
    }
  ];

  return (
    <section id="security" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left: Icon & Title */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 text-center lg:text-left"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 mb-8 mx-auto lg:mx-0 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
              <ShieldCheck className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>

            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">Trust & Safety</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Your Data. <br />
              <span className="text-gradient">Your Vault.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              We don't want your passwords. Pausa connects via the <span className="text-foreground font-medium">Account Aggregator (AA) network</span>, ensuring bank-grade encryption. We have "Read-Only" access — meaning your money is always safe, always yours.
            </p>
          </motion.div>

          {/* Right: Security points */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 space-y-6"
          >
            {points.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-panel rounded-2xl p-6 flex gap-5 group hover:border-primary/20 transition-colors"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <point.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg mb-1">{point.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{point.desc}</p>
                </div>
              </motion.div>
            ))}

            {/* AA Badge */}
            <div className="flex items-center gap-3 mt-4 px-4 py-3 rounded-xl border border-white/5 bg-card/30 w-fit">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
              <span className="text-sm text-muted-foreground font-mono">ReBIT AA Framework Compliant</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
