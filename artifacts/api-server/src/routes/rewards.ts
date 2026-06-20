import { Router } from "express";

const router = Router();

// ─── Static Indian credit card rewards matrix ─────────────────────────────────
// Rates are approximate and educational only.

interface CardReward {
  cardName: string;
  bank: string;
  cashbackPercent: number;
  category: string;
  monthlyLimit: number | null; // in rupees; null = unlimited
  notes: string;
}

const REWARDS_MATRIX: Record<string, CardReward[]> = {
  amazon: [
    { cardName: "Amazon Pay ICICI", bank: "ICICI", cashbackPercent: 5, category: "amazon", monthlyLimit: null, notes: "5% for Prime members on Amazon.in" },
    { cardName: "SBI SimplyCLICK", bank: "SBI", cashbackPercent: 10, category: "amazon", monthlyLimit: 2000, notes: "10% cashback, capped ₹2,000/month" },
    { cardName: "HDFC Regalia", bank: "HDFC", cashbackPercent: 3.3, category: "shopping", monthlyLimit: null, notes: "3.3% reward rate (10 pts/₹150, 1pt=₹0.50)" },
  ],
  flipkart: [
    { cardName: "Flipkart Axis Bank", bank: "Axis", cashbackPercent: 5, category: "flipkart", monthlyLimit: null, notes: "5% unlimited cashback on Flipkart & Myntra" },
    { cardName: "HDFC Millennia", bank: "HDFC", cashbackPercent: 5, category: "shopping", monthlyLimit: 1000, notes: "5% on Flipkart via SmartBuy, ₹1K cap" },
    { cardName: "SBI SimplyCLICK", bank: "SBI", cashbackPercent: 2.5, category: "shopping", monthlyLimit: null, notes: "2.5% on all other online shopping" },
  ],
  swiggy: [
    { cardName: "Swiggy HDFC Bank", bank: "HDFC", cashbackPercent: 10, category: "food", monthlyLimit: 1500, notes: "10% on Swiggy & Instamart, ₹1,500 cap" },
    { cardName: "HDFC Regalia", bank: "HDFC", cashbackPercent: 5, category: "dining", monthlyLimit: null, notes: "5% on dining & food delivery" },
    { cardName: "AmEx Gold", bank: "AmEx", cashbackPercent: 5, category: "dining", monthlyLimit: null, notes: "5X Membership Rewards on dining" },
  ],
  zomato: [
    { cardName: "Zomato RBL Bank", bank: "RBL", cashbackPercent: 10, category: "food", monthlyLimit: 750, notes: "10% on Zomato orders, ₹750/month cap" },
    { cardName: "HDFC Regalia", bank: "HDFC", cashbackPercent: 5, category: "dining", monthlyLimit: null, notes: "5% on dining & food delivery" },
    { cardName: "AmEx Gold", bank: "AmEx", cashbackPercent: 5, category: "dining", monthlyLimit: null, notes: "5X Membership Rewards on dining" },
  ],
  irctc: [
    { cardName: "IRCTC SBI Premier", bank: "SBI", cashbackPercent: 10, category: "travel", monthlyLimit: null, notes: "10% value back on AC class train tickets" },
    { cardName: "Axis Atlas", bank: "Axis", cashbackPercent: 5, category: "travel", monthlyLimit: null, notes: "5X EDGE Miles on travel (≈5% value)" },
    { cardName: "HDFC Diners Club Black", bank: "HDFC", cashbackPercent: 3.3, category: "travel", monthlyLimit: null, notes: "3.3% reward rate + lounge access" },
  ],
  makemytrip: [
    { cardName: "MMT ICICI", bank: "ICICI", cashbackPercent: 8, category: "travel", monthlyLimit: null, notes: "8% on MMT hotels & flights" },
    { cardName: "Axis Atlas", bank: "Axis", cashbackPercent: 5, category: "travel", monthlyLimit: null, notes: "5X EDGE Miles on travel" },
    { cardName: "HDFC Regalia", bank: "HDFC", cashbackPercent: 3.3, category: "travel", monthlyLimit: null, notes: "3.3% reward rate on all spends" },
  ],
  uber: [
    { cardName: "Ola Money SBI", bank: "SBI", cashbackPercent: 5, category: "transport", monthlyLimit: null, notes: "5% on Uber, Ola & transport" },
    { cardName: "HDFC Millennia", bank: "HDFC", cashbackPercent: 5, category: "transport", monthlyLimit: 750, notes: "5% on Uber via contactless, ₹750 cap" },
    { cardName: "Axis Atlas", bank: "Axis", cashbackPercent: 2, category: "transport", monthlyLimit: null, notes: "2X EDGE Miles on transport" },
  ],
  bigbasket: [
    { cardName: "Amazon Pay ICICI", bank: "ICICI", cashbackPercent: 2, category: "grocery", monthlyLimit: null, notes: "2% on all non-Amazon online grocery" },
    { cardName: "HDFC Millennia", bank: "HDFC", cashbackPercent: 5, category: "grocery", monthlyLimit: 1000, notes: "5% on grocery apps" },
    { cardName: "Flipkart Axis Bank", bank: "Axis", cashbackPercent: 4, category: "grocery", monthlyLimit: null, notes: "4% on grocery delivery apps" },
  ],
  default: [
    { cardName: "HDFC Regalia", bank: "HDFC", cashbackPercent: 3.3, category: "all", monthlyLimit: null, notes: "3.3% reward rate on all spends" },
    { cardName: "SBI SimplyCASH", bank: "SBI", cashbackPercent: 1.25, category: "all", monthlyLimit: null, notes: "1.25% flat cashback on all spends" },
    { cardName: "Axis ACE", bank: "Axis", cashbackPercent: 2, category: "all", monthlyLimit: null, notes: "2% on all online spends via Google Pay" },
  ],
};

function normalizeMerchant(raw: string): string {
  const m = raw.toLowerCase().trim();
  for (const key of Object.keys(REWARDS_MATRIX)) {
    if (m.includes(key)) return key;
  }
  return "default";
}

// GET /api/v1/rewards?merchant=Swiggy&userCards=HDFC+Regalia,Axis+Atlas
router.get("/v1/rewards", (req, res) => {
  const merchantRaw = (req.query.merchant as string) || "";
  const userCardsRaw = (req.query.userCards as string) || "";
  const userCards = userCardsRaw
    ? userCardsRaw.split(",").map((c) => c.trim().toLowerCase())
    : [];

  const key = normalizeMerchant(merchantRaw);
  const allCards = REWARDS_MATRIX[key] ?? REWARDS_MATRIX["default"];

  // Sort: user's saved cards first, then by cashback %
  const sorted = [...allCards].sort((a, b) => {
    const aOwned = userCards.some((c) => a.cardName.toLowerCase().includes(c));
    const bOwned = userCards.some((c) => b.cardName.toLowerCase().includes(c));
    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    return b.cashbackPercent - a.cashbackPercent;
  });

  res.json({
    merchant: merchantRaw || "General",
    key,
    cards: sorted.map((c) => ({
      ...c,
      owned: userCards.some((u) => c.cardName.toLowerCase().includes(u)),
    })),
  });
});

// POST /api/v1/sync-rewards — placeholder for community reward-sync
router.post("/v1/sync-rewards", (_req, res) => {
  res.json({
    message: "Sync endpoint ready. In production, this fetches from community GitHub repos.",
    syncedAt: new Date().toISOString(),
  });
});

export default router;
