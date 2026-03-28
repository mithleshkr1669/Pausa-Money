import { motion } from "framer-motion";
import { AlertCircle, Target, TrendingDown } from "lucide-react";

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
            Why Banks Don't Give You the <span className="text-primary">Full Picture</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Generic expense trackers label your gym membership as a "Liability" and a UPI transfer to a friend as "Income". We look deeper.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: AlertCircle,
              title: "Generic Labels Fail",
              desc: "Standard banking apps use simplistic rules. They don't understand the nuance of Indian UPI strings and unstructured narrations."
            },
            {
              icon: Target,
              title: "Missing the 'Why'",
              desc: "Tracking what you spent doesn't tell you if you're financially healthy. It's just a rear-view mirror of your choices."
            },
            {
              icon: TrendingDown,
              title: "Stress Spending Ignored",
              desc: "Are you spending because you have vitality, or because of stress? Traditional systems cannot differentiate."
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
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
