import { motion } from "framer-motion";
import { Droplets, Brain, Ghost } from "lucide-react";

export function Problem() {
  return (
    <section id="problem" className="py-24 bg-[#0D0D0D] border-y border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Why does your bank balance <span className="text-primary">feel like a leak?</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Most apps tell you what you spent. That just causes stress. Pausa tells you <span className="text-foreground font-medium">how you feel</span> and <span className="text-foreground font-medium">what to do next.</span> We analyze the "why" behind every UPI payment to protect your future.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Droplets,
              title: "Your Cash is Leaking",
              desc: "Silent subscriptions, ghost spends, and unplanned UPI transfers slowly drain your balance — most people never notice until it's too late."
            },
            {
              icon: Brain,
              title: "Tracking ≠ Healing",
              desc: "Knowing your expenses doesn't fix your finances. Pausa goes deeper — identifying the emotional triggers behind your spending patterns."
            },
            {
              icon: Ghost,
              title: "Ghost Subscriptions Haunt You",
              desc: "Forgotten trials, unused apps, auto-renewals. Our DistilBERT AI hunts them down and reclaims your rupees."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-8 rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <item.icon className="w-32 h-32 text-primary" />
              </div>
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-card border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                  <item.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
