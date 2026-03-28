import { motion } from "framer-motion";
import { Link2, BrainCircuit, Activity } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0D0D0D] border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              Powered by <br/>
              <span className="text-gradient">DistilBERT AI</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Generic LLMs fail at classifying messy Indian UPI transactions. We fine-tuned a custom DistilBERT model on native Account Aggregator (AA) JSON schema to achieve 90%+ confidence.
            </p>

            <div className="space-y-8">
              {[
                { step: "01", title: "Connect via AA", desc: "Securely link your accounts via the official ReBIT Indian Account Aggregator ecosystem.", icon: Link2 },
                { step: "02", title: "AI Analysis", desc: "Our engine maps raw narration fields to identify 'Healthy Vitality' vs 'Stress Spending'.", icon: BrainCircuit },
                { step: "03", title: "Vitalize", desc: "Get actionable, non-judgmental coaching to optimize your liquidity and resilience.", icon: Activity }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-card border border-white/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary/10 transition-colors">
                      {item.step}
                    </div>
                    {i !== 2 && <div className="w-px h-full bg-white/5 my-2" />}
                  </div>
                  <div className="pb-8">
                    <h4 className="text-xl font-bold font-display mb-2 flex items-center gap-2">
                      <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <img 
              src={`${import.meta.env.BASE_URL}images/data-mesh.png`}
              alt="AI neural network mapping financial transactions" 
              className="relative z-10 w-full h-auto rounded-3xl border border-white/10 shadow-2xl"
            />
            
            {/* Overlay code snippet */}
            <div className="absolute -bottom-8 -left-8 lg:-left-16 z-20 bg-[#0B0D10]/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl max-w-sm hidden sm:block">
              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">inference.js</span>
              </div>
              <pre className="text-xs font-mono text-primary/80 overflow-hidden">
                <code>
{`{
  "narration": "UPI/Zomato/SWIGGY",
  "amount": 450.00,
  "type": "DEBIT",
  "prediction": {
    "class": "STRESS_SPENDING",
    "confidence": 0.942
  }
}`}
                </code>
              </pre>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
