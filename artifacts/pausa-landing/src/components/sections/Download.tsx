import { motion } from "framer-motion";
import { AlertTriangle, DownloadCloud, CheckCircle2 } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";
import { useAppInfo } from "@/hooks/use-app-info";

export function Download() {
  const { data: appInfo, isLoading, isError } = useAppInfo();

  const handleDownload = () => {
    if (appInfo?.downloadUrl) {
      const a = document.createElement("a");
      a.href = appInfo.downloadUrl;
      a.download = "pausa.apk";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <section id="download" className="py-24 bg-card border-t border-white/5 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="max-w-3xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Important Disclaimer Note */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#1A1500] border border-amber-500/30 rounded-2xl p-8 mb-12 shadow-[0_0_30px_rgba(245,158,11,0.05)]"
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 bg-amber-500/20 p-2 rounded-full text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-amber-500 mb-2">
                Early Access — What to Expect
              </h3>
              <p className="text-amber-500/80 leading-relaxed">
                This app is a preview of what we are building. It contains <strong>DUMMY DATA</strong> and demonstrates the core features of Pausa's Financial Vitality engine. No real financial data is connected yet. We are actively building this product — your feedback is invaluable!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Download Action Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-10 text-center rounded-3xl border-t border-white/10 glow-border"
        >
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <DownloadCloud className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-3xl font-display font-bold mb-4">
            Get the Pausa APK
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Install the Android APK directly to preview the interface and test our AI categorization on sample Account Aggregator JSONs.
          </p>

          <div className="flex flex-col items-center gap-4">
            <GlowButton 
              size="lg" 
              className="w-full sm:w-auto min-w-[280px]"
              onClick={handleDownload}
              isLoading={isLoading}
              disabled={isError}
            >
              <DownloadCloud className="w-5 h-5 mr-2" />
              {isLoading ? "Fetching Info..." : isError ? "Unavailable" : `Download Android APK`}
            </GlowButton>
            
            {appInfo && !isLoading && !isError && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 font-mono bg-background/50 px-4 py-2 rounded-lg border border-white/5">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-primary" /> {appInfo.version}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{appInfo.size}</span>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
