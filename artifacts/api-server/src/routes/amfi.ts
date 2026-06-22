import { Router, type IRouter } from "express";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// ─── Curated list of popular Indian mutual funds ─────────────────────────────
// These are AMFI scheme codes for well-known funds
const CURATED_FUNDS = [
  { schemeCode: 118834, name: "Nippon India Nifty 50 Index Fund", category: "Index", subcategory: "Nifty 50", risk: "Moderate", minSip: 100 },
  { schemeCode: 120503, name: "Axis Long Term Equity Fund (ELSS)", category: "ELSS", subcategory: "Tax Saving", risk: "High", minSip: 500 },
  { schemeCode: 118989, name: "Mirae Asset Large Cap Fund", category: "Large Cap", subcategory: "Equity", risk: "Moderate-High", minSip: 1000 },
  { schemeCode: 122639, name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", subcategory: "Equity", risk: "Moderate-High", minSip: 1000 },
  { schemeCode: 119568, name: "HDFC Short Term Debt Fund", category: "Debt", subcategory: "Short Duration", risk: "Low-Moderate", minSip: 500 },
  { schemeCode: 125354, name: "SBI Nifty Index Fund", category: "Index", subcategory: "Nifty 50", risk: "Moderate", minSip: 500 },
  { schemeCode: 120594, name: "Mirae Asset ELSS Tax Saver Fund", category: "ELSS", subcategory: "Tax Saving", risk: "High", minSip: 500 },
  { schemeCode: 119026, name: "ICICI Prudential Bluechip Fund", category: "Large Cap", subcategory: "Equity", risk: "Moderate-High", minSip: 100 },
  { schemeCode: 135781, name: "Navi Nifty 50 Index Fund", category: "Index", subcategory: "Nifty 50", risk: "Moderate", minSip: 10 },
  { schemeCode: 120505, name: "Axis Midcap Fund", category: "Mid Cap", subcategory: "Equity", risk: "High", minSip: 500 },
];

interface FundData {
  schemeCode: number;
  name: string;
  category: string;
  subcategory: string;
  risk: string;
  minSip: number;
  nav: number | null;
  navDate: string | null;
  nav1YAgo: number | null;
  return1Y: number | null;
  return3Y: number | null;
  fetchedAt: number;
}

// In-memory cache
let fundCache: FundData[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

async function fetchFundNAV(schemeCode: number): Promise<{ nav: number | null; navDate: string | null; nav1YAgo: number | null }> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { nav: null, navDate: null, nav1YAgo: null };
    const data = await res.json() as { data: Array<{ date: string; nav: string }> };
    const history = data.data || [];
    if (history.length === 0) return { nav: null, navDate: null, nav1YAgo: null };

    const latestNav = parseFloat(history[0]?.nav ?? "0");
    const latestDate = history[0]?.date ?? null;

    // Find NAV ~1 year ago (252 trading days ≈ index 252)
    const idx1Y = Math.min(252, history.length - 1);
    const nav1YAgo = idx1Y > 0 ? parseFloat(history[idx1Y]?.nav ?? "0") : null;

    return { nav: latestNav || null, navDate: latestDate, nav1YAgo: nav1YAgo || null };
  } catch {
    return { nav: null, navDate: null, nav1YAgo: null };
  }
}

async function loadFunds(): Promise<FundData[]> {
  if (fundCache && Date.now() - cacheTime < CACHE_TTL) return fundCache;

  logger.info("Fetching AMFI fund NAV data...");

  const results = await Promise.allSettled(
    CURATED_FUNDS.map(async (fund) => {
      const { nav, navDate, nav1YAgo } = await fetchFundNAV(fund.schemeCode);
      const return1Y = nav && nav1YAgo && nav1YAgo > 0
        ? parseFloat((((nav - nav1YAgo) / nav1YAgo) * 100).toFixed(2))
        : null;
      const return3Y: number | null = null; // Would need 3Y history
      return {
        ...fund,
        nav,
        navDate,
        nav1YAgo,
        return1Y,
        return3Y,
        fetchedAt: Date.now(),
      };
    })
  );

  const funds: FundData[] = results
    .filter((r): r is PromiseFulfilledResult<FundData> => r.status === "fulfilled")
    .map((r) => r.value);

  fundCache = funds;
  cacheTime = Date.now();
  logger.info({ count: funds.length }, "AMFI fund data cached");

  return funds;
}

/**
 * GET /api/v1/mf/funds — returns curated mutual fund list with live NAV
 * Optional query param: ?category=ELSS|Index|Equity|Debt
 */
router.get("/api/v1/mf/funds", async (req, res): Promise<void> => {
  try {
    const funds = await loadFunds();
    const category = req.query.category as string | undefined;
    const filtered = category
      ? funds.filter((f) => f.category.toLowerCase().includes(category.toLowerCase()))
      : funds;

    res.json({
      funds: filtered,
      source: "AMFI India via api.mfapi.in",
      cachedAt: new Date(cacheTime).toISOString(),
      note: "NAV data is sourced from AMFI (Association of Mutual Funds in India). Past returns do not guarantee future results.",
    });
  } catch (err) {
    logger.error({ err }, "AMFI fund fetch failed");
    res.status(500).json({ error: "Failed to fetch fund data from AMFI" });
  }
});

/**
 * POST /api/v1/mf/refresh — force-refresh the AMFI cache
 */
router.post("/api/v1/mf/refresh", async (_req, res): Promise<void> => {
  fundCache = null;
  cacheTime = 0;
  try {
    const funds = await loadFunds();
    res.json({ message: "Cache refreshed", count: funds.length });
  } catch (err) {
    res.status(500).json({ error: "Refresh failed" });
  }
});

export default router;
