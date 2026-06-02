import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useHealthCheck } from "@workspace/api-client-react";
import {
  MessageSquare,
  Calculator,
  BarChart3,
  Activity,
  Cpu,
  Globe,
  User,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from "lucide-react";
import { useCurrency, CURRENCIES } from "@/hooks/useCurrency";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { fmtCurrencyRaw } from "@/hooks/useCurrency";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { currency, setCurrency } = useCurrency();
  const { profile, updateProfile } = useFinancialProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftIncome, setDraftIncome] = useState(
    profile.monthlyIncome?.toString() ?? "",
  );
  const [draftExpenses, setDraftExpenses] = useState(
    profile.monthlyExpenses?.toString() ?? "",
  );

  const { data: healthStatus } = useHealthCheck({
    query: { queryKey: ["healthCheck"], refetchInterval: 30000 },
  });

  const navItems = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/tools", label: "Tools", icon: Calculator },
    { href: "/analysis", label: "Analysis", icon: BarChart3 },
    { href: "/eval", label: "Eval", icon: Activity },
    { href: "/settings", label: "Settings", icon: Cpu },
  ];

  const saveProfile = () => {
    updateProfile({
      name: draftName,
      monthlyIncome: draftIncome ? Number(draftIncome) : null,
      monthlyExpenses: draftExpenses ? Number(draftExpenses) : null,
    });
    setEditingProfile(false);
  };

  const savings = (profile.monthlyIncome || 0) - (profile.monthlyExpenses || 0);
  const savingsRate = profile.monthlyIncome
    ? ((savings / profile.monthlyIncome) * 100).toFixed(0)
    : null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      <aside
        className="w-56 border-r border-border flex flex-col shrink-0"
        style={{ background: "hsl(0 0% 7%)" }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center gap-2.5 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #00f5d4, #40e0ff)" }}
          >
            <Activity className="w-4 h-4 text-black" />
          </div>
          <span className="font-semibold text-base text-gradient tracking-tight">
            FinAdvisor
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex flex-col gap-1 shrink-0">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-1">
            Navigation
          </div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isActive ? "bg-primary/15 text-primary font-medium border border-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Financial Profile panel */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-white/3 transition-all shrink-0"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              borderBottom: profileOpen
                ? "1px solid rgba(255,255,255,0.06)"
                : "none",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${profile.profileComplete ? "bg-primary/20" : "bg-white/5"}`}
              >
                <User
                  className={`w-3 h-3 ${profile.profileComplete ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {profile.name || "My Profile"}
              </span>
            </div>
            {profileOpen ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            )}
          </button>

          {profileOpen && (
            <div className="px-3 py-3 space-y-2 overflow-y-auto">
              {editingProfile ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none text-foreground placeholder:text-muted-foreground/50"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span className="text-primary text-xs font-bold">
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      value={draftIncome}
                      onChange={(e) => setDraftIncome(e.target.value)}
                      placeholder="Monthly income"
                      className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/50 min-w-0"
                    />
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span className="text-red-400 text-xs font-bold">
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      value={draftExpenses}
                      onChange={(e) => setDraftExpenses(e.target.value)}
                      placeholder="Monthly expenses"
                      className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/50 min-w-0"
                    />
                  </div>
                  <button
                    onClick={saveProfile}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: "linear-gradient(135deg, #00f5d4, #40e0ff)",
                      color: "#0a0a0a",
                    }}
                  >
                    <Check className="w-3 h-3" /> Save Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {!profile.profileComplete ? (
                    <button
                      onClick={() => {
                        setEditingProfile(true);
                        setDraftName(profile.name);
                        setDraftIncome(profile.monthlyIncome?.toString() ?? "");
                        setDraftExpenses(
                          profile.monthlyExpenses?.toString() ?? "",
                        );
                      }}
                      className="w-full text-[11px] px-2.5 py-2 rounded-lg border border-dashed border-primary/30 text-primary/70 hover:border-primary/60 hover:text-primary transition-all text-center"
                    >
                      + Set up financial profile
                    </button>
                  ) : (
                    <>
                      {profile.name && (
                        <p className="text-xs font-medium text-foreground px-1">
                          {profile.name}
                        </p>
                      )}
                      <div className="flex items-center justify-between px-1 py-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          Income
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-400">
                          {fmtCurrencyRaw(profile.monthlyIncome || 0, currency)}
                          /mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1 py-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          Expenses
                        </span>
                        <span className="text-[11px] font-semibold text-red-400">
                          {fmtCurrencyRaw(
                            profile.monthlyExpenses || 0,
                            currency,
                          )}
                          /mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1 py-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          Savings rate
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${Number(savingsRate) >= 20 ? "text-primary" : Number(savingsRate) >= 10 ? "text-amber-400" : "text-red-400"}`}
                        >
                          {savingsRate}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingProfile(true);
                          setDraftName(profile.name);
                          setDraftIncome(
                            profile.monthlyIncome?.toString() ?? "",
                          );
                          setDraftExpenses(
                            profile.monthlyExpenses?.toString() ?? "",
                          );
                        }}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1"
                      >
                        <Edit2 className="w-2.5 h-2.5" /> Edit profile
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Currency + Settings + Status */}
        <div className="p-3 border-t border-border space-y-2 shrink-0">
          <div className="px-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Currency
              </span>
            </div>
            <div className="relative">
              <select
                value={currency.code}
                onChange={(e) => {
                  const found = CURRENCIES.find(
                    (c) => c.code === e.target.value,
                  );
                  if (found) setCurrency(found);
                }}
                className="w-full text-xs rounded-lg px-2.5 py-1.5 text-foreground outline-none cursor-pointer appearance-none pr-6 transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {CURRENCIES.map((c) => (
                  <option
                    key={c.code}
                    value={c.code}
                    style={{ background: "#1a1a1a", color: "#e8e0d0" }}
                  >
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
                ▾
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/2 border border-white/5">
            <span className="text-xs text-muted-foreground">API Status</span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${healthStatus?.status === "ok" ? "bg-primary" : "bg-red-500"}`}
              />
              <span className="text-xs text-muted-foreground">
                {healthStatus?.status === "ok" ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden relative">{children}</main>
    </div>
  );
}
