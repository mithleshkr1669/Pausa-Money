import { motion } from "framer-motion";
import { Star, TreePine, ScrollText } from "lucide-react";

export function Gamification() {
  const features = [
    {
      icon: Star,
      title: "XP Gain & Drain",
      desc: "Earn XP for smart saves; identify \"Stress Spends\" before they drain your level. Every rupee saved is a point scored.",
      tag: "EARN XP"
    },
    {
      icon: TreePine,
      title: "The Skill Tree",
      desc: "Evolve from a Financial Novice to a Sovereign by unlocking real-world milestones — SIPs, Tax-Saving, Debt-Free.",
      tag: "LEVEL UP"
    },
    {
      icon: ScrollText,
      title: "Daily Quests",
      desc: '"Slay the Subscription Ghost" or "Complete a 7-day No-Stress Streak" for exclusive rewards. Make every day count.',
      tag: "QUEST"
    }
  ];

  return (
    <section id="gamification" className="py-24 bg-[#0D0D0D] border-y border-white/5 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">The Hook</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Money Management is a Quest.{" "}
            <span className="text-gradient">Not a Chore.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We turned your financial journey into an RPG. Complete missions, level up your wealth, and unlock real-world rewards.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative glow-border bg-card rounded-3xl p-8 hover:-translate-y-1 transition-transform duration-300 group"
            >
              <div className="absolute top-6 right-6">
                <span className="text-[10px] font-bold tracking-widest text-primary border border-primary/30 rounded-full px-2 py-0.5 bg-primary/10">
                  {feature.tag}
                </span>
              </div>

              <div className="mb-6 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* XP bar visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-xl mx-auto glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Current Level</p>
              <p className="text-lg font-display font-bold text-foreground">Financial Strategist <span className="text-primary">Lv. 7</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono">XP</p>
              <p className="text-primary font-bold font-mono">3,420 / 5,000</p>
            </div>
          </div>
          <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "68%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center font-mono">1,580 XP to next level → <span className="text-secondary">Wealth Sovereign</span></p>
        </motion.div>
      </div>
    </section>
  );
}
