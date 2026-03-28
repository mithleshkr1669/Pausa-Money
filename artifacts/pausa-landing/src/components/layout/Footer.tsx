import { Activity, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 pt-16 pb-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 bg-primary/10 blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                pausa.money
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm mb-6 text-lg">
              Financial Vitality, <br/>One Transaction at a Time.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Github className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><button onClick={() => document.getElementById("pillars")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">The 3 Pillars</button></li>
              <li><button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">DistilBERT Engine</button></li>
              <li><button onClick={() => document.getElementById("download")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors">Download App</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Pausa. All rights reserved.</p>
          <p>Built for the Account Aggregator Ecosystem.</p>
        </div>
      </div>
    </footer>
  );
}
