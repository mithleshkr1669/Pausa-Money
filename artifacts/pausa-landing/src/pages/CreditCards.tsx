import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, Search, Trash2, Star, ChevronRight, X, Zap } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";

const API = "/api";

interface SavedCard {
  id: string;
  card_name: string;
  bank: string;
  card_type: string;
  last_four?: string;
  color: string;
}

interface RewardCard {
  cardName: string;
  bank: string;
  cashbackPercent: number;
  category: string;
  monthlyLimit: number | null;
  notes: string;
  owned: boolean;
}

const CARD_PRESETS = [
  { card_name: "HDFC Regalia", bank: "HDFC", color: "#1a1a2e" },
  { card_name: "HDFC Millennia", bank: "HDFC", color: "#0d1b4b" },
  { card_name: "HDFC Diners Club Black", bank: "HDFC", color: "#111111" },
  { card_name: "SBI SimplyCLICK", bank: "SBI", color: "#003785" },
  { card_name: "SBI SimplyCASH", bank: "SBI", color: "#1a4f8a" },
  { card_name: "IRCTC SBI Premier", bank: "SBI", color: "#14213d" },
  { card_name: "Axis Atlas", bank: "Axis", color: "#7b0000" },
  { card_name: "Flipkart Axis Bank", bank: "Axis", color: "#2874a6" },
  { card_name: "Amazon Pay ICICI", bank: "ICICI", color: "#ff9900" },
  { card_name: "MMT ICICI", bank: "ICICI", color: "#1a5276" },
  { card_name: "AmEx Gold", bank: "AmEx", color: "#c5a028" },
  { card_name: "Swiggy HDFC Bank", bank: "HDFC", color: "#fc5200" },
  { card_name: "Zomato RBL Bank", bank: "RBL", color: "#cb202d" },
  { card_name: "OneCard", bank: "IDFC", color: "#1a1a1a" },
];

const BANK_LOGO_COLORS: Record<string, string> = {
  HDFC: "#004c8c",
  SBI: "#003785",
  Axis: "#7b0000",
  ICICI: "#b04800",
  AmEx: "#c5a028",
  RBL: "#cb202d",
  IDFC: "#1a1a1a",
};

function CardVisual({ card }: { card: SavedCard }) {
  const bg = card.color || "#1a1a2e";
  return (
    <div
      className="relative rounded-2xl p-4 w-full aspect-[1.6/1] overflow-hidden flex flex-col justify-between"
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc)` }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 0%, transparent 60%)" }} />
      <div className="flex justify-between items-start">
        <div className="text-white/80 text-xs font-mono">{card.bank}</div>
        <CreditCard className="w-5 h-5 text-white/50" />
      </div>
      <div>
        <div className="text-white/40 text-xs mb-1 font-mono">
          •••• •••• •••• {card.last_four || "****"}
        </div>
        <div className="text-white text-sm font-bold truncate">{card.card_name}</div>
      </div>
    </div>
  );
}

function AddCardModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (card: Omit<SavedCard, "id">) => void;
}) {
  const [selected, setSelected] = useState<(typeof CARD_PRESETS)[0] | null>(null);
  const [lastFour, setLastFour] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#13131e] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#f0e8d8]">Add a Credit Card</h3>
          <button onClick={onClose} className="text-[#8c8070] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
          {CARD_PRESETS.map((p) => (
            <button
              key={p.card_name}
              onClick={() => setSelected(p)}
              className={`text-left px-3 py-2 rounded-xl border text-sm transition-all ${
                selected?.card_name === p.card_name
                  ? "border-[#00E5D4]/50 bg-[#00E5D4]/10 text-[#00E5D4]"
                  : "border-white/10 text-[#8c8070] hover:border-white/20 hover:text-[#f0e8d8]"
              }`}
            >
              <div className="font-medium truncate">{p.card_name}</div>
              <div className="text-xs opacity-60">{p.bank}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="mb-4">
            <label className="text-xs text-[#8c8070] block mb-1">Last 4 digits (optional)</label>
            <input
              type="text"
              maxLength={4}
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/, ""))}
              placeholder="0000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f0e8d8] font-mono focus:outline-none focus:border-[#00E5D4]/40"
            />
          </div>
        )}

        <button
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            onAdd({
              card_name: selected.card_name,
              bank: selected.bank,
              card_type: "credit",
              last_four: lastFour || undefined,
              color: selected.color,
            });
            onClose();
          }}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ background: selected ? "linear-gradient(135deg, #00E5D4, #00F5A0)" : undefined, color: selected ? "#09090f" : undefined }}
        >
          {selected ? `Add ${selected.card_name}` : "Select a card above"}
        </button>
      </motion.div>
    </div>
  );
}

export default function CreditCardsPage() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [rewards, setRewards] = useState<{ merchant: string; cards: RewardCard[] } | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(false);

  // Load cards from Supabase or localStorage
  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured && supabase && userId) {
        const { data } = await supabase
          .from("credit_cards")
          .select("*")
          .eq("user_id", userId)
          .order("added_at", { ascending: false });
        if (data) { setCards(data as SavedCard[]); return; }
      }
      try {
        const ls = JSON.parse(localStorage.getItem("pausa_credit_cards") ?? "[]");
        setCards(ls);
      } catch { /* empty */ }
    }
    load();
  }, [userId]);

  async function handleAddCard(card: Omit<SavedCard, "id">) {
    const newCard: SavedCard = { ...card, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase && userId) {
      const { data, error } = await supabase
        .from("credit_cards")
        .insert({ ...card, user_id: userId })
        .select()
        .single();
      if (!error && data) {
        setCards((prev) => [data as SavedCard, ...prev]);
        return;
      }
    }
    const updated = [newCard, ...cards];
    localStorage.setItem("pausa_credit_cards", JSON.stringify(updated));
    setCards(updated);
  }

  async function handleDeleteCard(id: string) {
    if (isSupabaseConfigured && supabase && userId) {
      await supabase.from("credit_cards").delete().eq("id", id);
    }
    const updated = cards.filter((c) => c.id !== id);
    localStorage.setItem("pausa_credit_cards", JSON.stringify(updated));
    setCards(updated);
  }

  async function handleLookup() {
    if (!merchant.trim()) return;
    setLoadingRewards(true);
    try {
      const userCardsParam = cards.map((c) => c.card_name).join(",");
      const res = await fetch(
        `${API}/v1/rewards?merchant=${encodeURIComponent(merchant)}&userCards=${encodeURIComponent(userCardsParam)}`
      );
      const data = await res.json();
      setRewards(data);
    } catch { /* empty */ }
    setLoadingRewards(false);
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-[#f0e8d8]">Credit Card Optimizer</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Find the best card for every purchase</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #00E5D4, #00F5A0)", color: "#09090f" }}
        >
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <CreditCard className="w-10 h-10 text-[#8c8070] mx-auto mb-3" />
          <p className="text-[#f0e8d8] font-medium mb-1">No cards added yet</p>
          <p className="text-sm text-[#8c8070] mb-4">Add your credit cards to get personalised cashback recommendations</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #00E5D4, #00F5A0)", color: "#09090f" }}
          >
            Add your first card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <CardVisual card={card} />
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Merchant Lookup */}
      <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#00E5D4]" />
          <h3 className="font-semibold text-[#f0e8d8]">Best Card Finder</h3>
        </div>
        <p className="text-sm text-[#8c8070] mb-4">
          Type a merchant or app name to see which card gives you the most cashback.
        </p>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["Amazon", "Swiggy", "Zomato", "IRCTC", "Flipkart", "Uber", "BigBasket"].map((m) => (
            <button
              key={m}
              onClick={() => { setMerchant(m); }}
              className="px-3 py-1 rounded-full text-xs border border-white/10 text-[#8c8070] hover:border-[#00E5D4]/30 hover:text-[#00E5D4] transition-colors"
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="e.g. Swiggy, Amazon, MakeMyTrip…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f0e8d8] placeholder:text-[#8c8070]/60 focus:outline-none focus:border-[#00E5D4]/40"
          />
          <button
            onClick={handleLookup}
            disabled={loadingRewards}
            className="px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #00E5D4, #00F5A0)", color: "#09090f" }}
          >
            {loadingRewards ? (
              <div className="w-4 h-4 border-2 border-[#09090f]/30 border-t-[#09090f] rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {rewards && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 space-y-2"
            >
              <p className="text-xs text-[#8c8070] mb-3 font-mono uppercase tracking-wider">
                Best cards for {rewards.merchant}
              </p>
              {rewards.cards.map((card, i) => (
                <div
                  key={card.cardName}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    card.owned
                      ? "border-[#00E5D4]/30 bg-[#00E5D4]/5"
                      : "border-white/8 bg-white/2"
                  }`}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: BANK_LOGO_COLORS[card.bank] ?? "#333" }}>
                    {card.bank.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[#f0e8d8] truncate">{card.cardName}</span>
                      {card.owned && (
                        <span className="text-[#00E5D4] text-xs flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 fill-current" /> Yours
                        </span>
                      )}
                      {i === 0 && <span className="text-xs bg-[#00E5D4]/15 text-[#00E5D4] px-1.5 py-0.5 rounded font-mono shrink-0">Best</span>}
                    </div>
                    <p className="text-xs text-[#8c8070] truncate">{card.notes}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#00E5D4] font-bold text-sm">{card.cashbackPercent}%</div>
                    {card.monthlyLimit && (
                      <div className="text-xs text-[#8c8070]">cap ₹{(card.monthlyLimit / 1000).toFixed(0)}K</div>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-[#8c8070]/60 mt-3 italic">
                Rates are approximate and educational only. Verify current rates with your bank.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cron sync info */}
      <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00E5D4]/10 flex items-center justify-center shrink-0 mt-0.5">
            <ChevronRight className="w-4 h-4 text-[#00E5D4]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f0e8d8] mb-1">Auto-updating Reward Rates</p>
            <p className="text-xs text-[#8c8070] leading-relaxed">
              Our reward rates are maintained by the community and synced via{" "}
              <code className="text-[#00E5D4]/80 bg-[#00E5D4]/10 px-1 rounded">POST /api/v1/sync-rewards</code>.
              A cron script fetches the latest rules from open-source GitHub repositories and batch-updates values automatically.
            </p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddCardModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCard}
        />
      )}
    </div>
  );
}
