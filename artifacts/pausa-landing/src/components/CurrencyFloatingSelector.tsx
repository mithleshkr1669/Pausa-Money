import { useState } from "react";
import { useCurrency, CURRENCIES, type Currency } from "@/hooks/useCurrency";
import { ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function CurrencyFloatingSelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const handleSelect = (c: Currency) => {
    setCurrency(c);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 w-52 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            style={{ background: "rgba(10,10,18,0.97)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-3 py-2 border-b border-white/6">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Select Currency
              </p>
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5 ${
                    c.code === currency.code ? "bg-primary/8" : ""
                  }`}
                >
                  <span
                    className="w-6 text-center text-sm font-bold shrink-0"
                    style={{ color: c.code === currency.code ? "hsl(173 100% 65%)" : "#6b7280" }}
                  >
                    {c.symbol}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${c.code === currency.code ? "text-primary" : "text-foreground"}`}>
                      {c.code}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                  </div>
                  {c.code === currency.code && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/12 text-xs font-semibold transition-all hover:bg-white/5 active:scale-95"
        style={{
          background: "rgba(10,10,18,0.9)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-sm font-bold" style={{ color: "hsl(173 100% 65%)" }}>
          {currency.symbol}
        </span>
        <span className="text-muted-foreground">{currency.code}</span>
        <ChevronUp
          className="w-3 h-3 text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
    </div>
  );
}
