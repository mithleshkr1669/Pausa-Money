import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useInView } from "framer-motion";

type Lang = "en" | "hi";

const CY = "#00E5D4";
const CYG = "#00F5A0";

function scrollToDownload() {
  document
    .getElementById("android-download")
    ?.scrollIntoView({ behavior: "smooth" });
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function HomeNav({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#09090f]/96 backdrop-blur-md border-b border-white/6" : "bg-transparent"}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/image.png"
            alt="Pausa"
            className="w-15 h-15 rounded-xl object-cover"
          />
          <span
            className="font-lora font-bold text-lg sm:text-xl tracking-tight"
            style={{ color: CY }}
          >
            Pausa
          </span>
        </div>

        {/* Desktop */}
        {/* <div className="hidden md:flex items-center gap-1">
          {[
            ["Community", "#community"],
            ["AI Advisor", "#ai"],
            ["Why Pausa", "#why"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-sm text-[#8c8070] hover:text-[#f0e8d8] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              {label}
            </a>
          ))}
        </div> */}

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={scrollToDownload}
            className="text-sm font-semibold px-3 py-1.5 rounded-full border border-[#00E5D4]/25 text-[#00E5D4] hover:bg-[#00E5D4]/8 transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            APK
          </button>
          {/* <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="text-xs font-mono px-3 py-1.5 rounded-full border border-white/12 text-[#8c8070] hover:border-[#00E5D4]/30 hover:text-[#00E5D4] transition-colors"
          >
            {lang === "en" ? "हिंदी" : "EN"}
          </button> */}
          <Link href="/sign-in">
            <button className="text-sm text-[#c4b9aa] hover:text-[#f0e8d8] font-medium transition-colors">
              Sign in
            </button>
          </Link>
          <Link href="/sign-up">
            <button
              className="text-sm font-bold px-5 py-2 rounded-full text-[#09090f] hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${CY}, ${CYG})` }}
            >
              Join free →
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#c4b9aa]"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="md:hidden bg-[#09090f]/98 backdrop-blur-md border-t border-white/6 px-4 py-4 flex flex-col gap-2"
          >
            {[
              ["Community", "#community"],
              ["AI Advisor", "#ai"],
              ["Why Pausa", "#why"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-[#c4b9aa] hover:text-[#f0e8d8] py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                {label}
              </a>
            ))}
            <button
              onClick={() => {
                scrollToDownload();
                setMenuOpen(false);
              }}
              className="w-full text-sm font-semibold px-4 py-3 rounded-xl border border-[#00E5D4]/25 text-[#00E5D4] flex items-center justify-center gap-2 mt-1"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download APK
            </button>
            <div className="flex gap-2 mt-1">
              <Link href="/sign-in" className="flex-1">
                <button className="w-full text-sm text-[#c4b9aa] font-medium py-3 rounded-xl border border-white/10">
                  Sign in
                </button>
              </Link>
              <Link href="/sign-up" className="flex-1">
                <button
                  className="w-full text-sm font-bold py-3 rounded-xl text-[#09090f]"
                  style={{
                    background: `linear-gradient(135deg, ${CY}, ${CYG})`,
                  }}
                >
                  Join free →
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {lang === "hi" && (
        <div className="bg-[#00E5D4]/8 border-b border-[#00E5D4]/15 text-center py-1.5 text-xs text-[#00E5D4] font-medium">
          हिंदी संस्करण जल्द — Hindi version coming soon.
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [activeChat, setActiveChat] = useState(0);
  const chatMsgs = [
    {
      role: "user",
      text: "I earn ₹45,000/month. Have ₹2L in savings. No investments. Where do I start?",
    },
    {
      role: "ai",
      text: "Great starting point. Here's your 3-step plan:\n1. Build ₹1.35L emergency fund (3× expenses)\n2. Start ₹5,000/month SIP in Nifty 50 index fund\n3. Open PPF for long-term tax-free growth",
    },
    {
      role: "user",
      text: "Which index fund? I'm confused about direct vs regular.",
    },
    {
      role: "ai",
      text: "Always Direct plan — saves you ~1% commission annually. On ₹5K/month over 10 years, that's ₹80,000+ more in your pocket. Try Zerodha Coin or Groww for direct plans.",
    },
  ];
  useEffect(() => {
    const t = setInterval(
      () => setActiveChat((c) => (c + 1) % chatMsgs.length),
      3000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 pt-20 pb-10 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#00E5D4]/8 border border-[#00E5D4]/20 rounded-full px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5D4] animate-pulse" />
              <span className="text-xs font-mono text-[#00E5D4] uppercase tracking-widest">
                Community × AI
              </span>
            </div>
            <h1 className="font-lora text-4xl sm:text-5xl lg:text-6xl font-bold text-[#f0e8d8] leading-[1.1] mb-6">
              The financial
              <br />
              elder sibling
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${CY} 0%, ${CYG} 100%)`,
                }}
              >
                you never had.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#8c8070] font-jakarta leading-relaxed mb-8 max-w-md">
              AI that speaks your language. A community that's been through it.
              India-specific advice you can actually act on — free.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href="/sign-up">
                <button
                  className="w-full sm:w-auto text-[#09090f] font-bold px-8 py-3.5 rounded-full text-base hover:opacity-90 transition-all hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${CY}, ${CYG})`,
                    boxShadow: `0 8px 32px ${CY}30`,
                  }}
                >
                  Get my free plan →
                </button>
              </Link>
              <button
                onClick={scrollToDownload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-full border border-[#00E5D4]/25 text-[#00E5D4] hover:bg-[#00E5D4]/8 transition-all text-base"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Android APK
              </button>
            </div>
            <p className="text-xs text-[#8c8070] font-jakarta">
              No credit card required. Not a SEBI-registered advisor.
              Educational guidance only.
            </p>
          </motion.div>
        </div>

        {/* Right — AI Chat Demo */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative">
            {/* Glow */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-15"
              style={{
                background: `radial-gradient(ellipse, ${CY}, transparent 70%)`,
              }}
            />
            <div className="relative ai-card p-5 sm:p-6 rounded-3xl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                <div>
                  <p className="text-sm font-semibold text-[#f0e8d8]">
                    Pausa AI
                  </p>
                  <p className="text-xs text-[#00E5D4] font-mono">
                    India-specific
                  </p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-white/15" />
                  ))}
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-3 min-h-[220px]">
                <AnimatePresence>
                  {chatMsgs.slice(0, activeChat + 1).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-jakarta leading-relaxed whitespace-pre-line ${
                          msg.role === "user"
                            ? "bg-white/8 text-[#f0e8d8] rounded-tr-sm"
                            : "text-[#f0e8d8] rounded-tl-sm border border-[#00E5D4]/20"
                        }`}
                        style={
                          msg.role === "ai"
                            ? { background: `${CY}10` }
                            : undefined
                        }
                      >
                        {msg.role === "ai" && (
                          <span className="text-[#00E5D4] font-mono text-xs block mb-1">
                            Pausa AI
                          </span>
                        )}
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Input hint */}
              <div className="mt-4 pt-4 border-t border-white/6 flex items-center gap-2">
                <div className="flex-1 bg-white/5 rounded-full px-4 py-2.5 text-xs text-[#8c8070] font-jakarta">
                  Ask about your money situation...
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#09090f] shrink-0"
                  style={{ background: CY }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <g transform="rotate(90 12 12)">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { n: 800000, suffix: "+", label: "Indians need honest finance help" },
    { n: 27, suffix: "%", label: "Financial literacy in India" },
    { n: 8, suffix: "s", label: "To get your personalised plan" },
    // {
    //   n: 1000,
    //   suffix: "<",
    //   label: "SEBI RIAs for 140 crore people",
    //   pre: true,
    // },
  ];
  return (
    <div className="border-y border-white/6 bg-[#0d0d14]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p
              className="font-lora text-2xl sm:text-3xl font-bold mb-1"
              style={{ color: CY }}
            >
              {s.pre ? s.suffix : ""}
              <Counter to={s.n} suffix={s.pre ? "" : s.suffix} />
            </p>
            <p className="text-xs text-[#8c8070] font-jakarta leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Why Pausa ─────────────────────────────────────────────────────────────────
function WhyPausa() {
  const rows = [
    {
      them: "Reddit gives 10 contradictory opinions",
      us: "One honest plan. Specific to your numbers.",
    },
    {
      them: "Advice built for 401k & Roth IRA",
      us: "PPF, NPS, ELSS, SIP — India-first, always.",
    },
    {
      them: "English-only finance content",
      us: "Hindi & English. Your language, your terms.",
    },
    {
      them: "Finfluencers earn from your clicks",
      us: "Zero affiliate links. Zero commissions. Ever.",
    },
    {
      them: "No memory — you start over every time",
      us: "Remembers your journey. Grows with you.",
    },
    {
      them: "Content overload, no action",
      us: "Your next 3 moves. Numbered. With ₹ amounts.",
    },
  ];
  return (
    <section id="why" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#09090f]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-mono text-xs text-[#00E5D4]/70 uppercase tracking-[0.2em] mb-3">
            Why Pausa
          </p>
          <h2 className="font-lora text-3xl sm:text-5xl font-bold text-[#f0e8d8] mb-4 leading-tight">
            Everyone else gives opinions.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${CY}, ${CYG})`,
              }}
            >
              We give you a plan.
            </span>
          </h2>
          <p className="text-[#8c8070] font-jakarta max-w-lg mx-auto">
            Here's what makes Pausa different from every finance forum, app, and
            YouTube channel you've tried.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {rows.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl overflow-hidden border border-white/6 bg-white/[0.02]"
            >
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-[#8c8070]/60 uppercase tracking-widest">
                      Others
                    </span>
                  </div>
                  <p className="text-sm text-[#8c8070] font-jakarta line-through decoration-white/20">
                    {r.them}
                  </p>
                </div>
                <div className="w-px self-stretch bg-white/8 mx-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-mono uppercase tracking-widest"
                      style={{ color: CY }}
                    >
                      Pausa
                    </span>
                  </div>
                  <p className="text-sm font-jakarta font-medium text-[#f0e8d8]">
                    {r.us}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AI Features ───────────────────────────────────────────────────────────────
function AIFeatures() {
  const features = [
    {
      icon: "🧠",
      title: "India-first AI",
      desc: "Trained on Indian tax law, instruments, and income patterns. Not a ChatGPT wrapper.",
      tag: "Core",
      size: "tall",
    },
    {
      icon: "⚡",
      title: "8-second plan",
      desc: "Describe your situation in plain words.",
      tag: "Speed",
      size: "normal",
    },
    {
      icon: "🔤",
      title: "Hindi + English",
      desc: "Type in Hinglish, Hindi, or English. Pausa understands all three.",
      tag: "Language",
      size: "normal",
    },
    {
      icon: "✅",
      title: "Expert-verified",
      desc: "Every AI plan is reviewed by SEBI-registered advisors and certified financial planners.",
      tag: "Trust",
      size: "wide",
    },
    {
      icon: "🔒",
      title: "Zero conflict of interest",
      desc: "No commissions. No referrals. No ads. Your plan is built for you, not for our revenue.",
      tag: "Ethics",
      size: "normal",
    },
    {
      icon: "📈",
      title: "Save your journey",
      desc: "Unlike forums, Pausa remembers what you told it last month. Your plan evolves.",
      tag: "Memory",
      size: "normal",
    },
  ];

  return (
    <section id="ai" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0d0d14]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 sm:mb-16">
          <p className="font-mono text-xs text-[#00E5D4]/70 uppercase tracking-[0.2em] mb-3">
            AI Features
          </p>
          <h2 className="font-lora text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f0e8d8] leading-tight max-w-2xl">
            Not another chatbot.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${CY}, ${CYG})`,
              }}
            >
              Your financial co-pilot.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-5 sm:p-6 border border-white/6 bg-white/[0.025] hover:border-[#00E5D4]/20 hover:bg-white/[0.04] transition-all group ${f.size === "wide" ? "sm:col-span-2 lg:col-span-2" : ""}`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{f.icon}</span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-[#00E5D4]/20 text-[#00E5D4]/70">
                  {f.tag}
                </span>
              </div>
              <h3 className="font-lora font-bold text-[#f0e8d8] text-lg mb-2 group-hover:text-[#00E5D4] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-[#8c8070] font-jakarta leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Community ─────────────────────────────────────────────────────────────────
function Community() {
  const rings = [
    {
      icon: "🌱",
      name: "Seed",
      color: "#a3a3a3",
      who: "Everyone",
      tagline: "Planted with intent",
      how: "Join and complete your financial profile to activate your journey.",
    },
    {
      icon: "🌿",
      name: "Sprout",
      color: "#3d9b6b",
      who: "Active starters",
      tagline: "Breaking ground",
      how: "Complete 1 savings goal + fill your Financial Plan.",
    },
    {
      icon: "🌳",
      name: "Sapling",
      color: "#7c5cbf",
      who: "Committed builders",
      tagline: "Taking root",
      how: "Complete 3 savings goals in total.",
    },
    {
      icon: "🌲",
      name: "Grove",
      color: "#bf5c5c",
      who: "Community pillars",
      tagline: "Sheltering others",
      how: "Complete 6 goals + actively answer questions in the community.",
    },
    {
      icon: "🌲🌲",
      name: "Forest",
      color: `${CY}`,
      who: "Max 11 · Forever",
      tagline: "Full canopy",
      how: "Founder selection only. These 11 shape the platform forever.",
    },
  ];

  return (
    <section
      id="community"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-[#09090f]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left */}
          <div>
            <p className="font-mono text-xs text-[#00E5D4]/70 uppercase tracking-[0.2em] mb-3">
              The Community
            </p>
            <h2 className="font-lora text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f0e8d8] mb-5 leading-tight">
              Not just a forum.
              <br />
              A living community
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${CY}, ${CYG})`,
                }}
              >
                with real structure.
              </span>
            </h2>
            <p className="text-[#8c8070] font-jakarta text-base leading-relaxed mb-8">
              Pausa isn't Reddit. Members earn their rings through real
              financial progress — not upvotes. When someone in the Grove
              answers your question, they've already done what you're trying to
              do.
            </p>

            <div className="space-y-2 mb-8">
              {[
                "Verified progress, not just opinions",
                "Real accountability with your community",
                "Members who've walked the same path",
                "Questions answered by doers, not talkers",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-jakarta text-[#c4b9aa]"
                >
                  <span className="text-xs shrink-0" style={{ color: CY }}>
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="border border-[#00E5D4]/15 rounded-2xl p-5 bg-[#00E5D4]/[0.04]">
              <p className="font-mono text-xs text-[#00E5D4]/60 uppercase tracking-widest mb-2">
                The Founding Wall
              </p>
              <p className="font-lora text-lg text-[#f0e8d8] font-semibold mb-1">
                9 of 11 Forest spots open.
              </p>
              <p className="text-[#8c8070] font-jakarta text-sm mb-4">
                These 11 founders shape Pausa forever. Their names are on the
                wall.
              </p>
              <Link href="/sign-up">
                <button
                  className="text-sm font-bold px-5 py-2.5 rounded-full text-[#09090f] hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${CY}, ${CYG})`,
                  }}
                >
                  Become a founding member →
                </button>
              </Link>
            </div>
          </div>

          {/* Right — Ring list */}
          <div className="space-y-2.5">
            {rings.map((ring, i) => (
              <motion.div
                key={ring.name}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/6 bg-white/[0.025] p-4 sm:p-5 flex gap-4 items-center hover:bg-white/[0.04] transition-colors group"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl shrink-0 bg-white/5">
                  {ring.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-lora font-bold text-[#f0e8d8] group-hover:text-[#00E5D4] transition-colors">
                      {ring.name}
                    </span>
                    <span
                      className="text-xs font-jakarta"
                      style={{ color: ring.color }}
                    >
                      — {ring.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-[#8c8070] font-jakarta mt-0.5 leading-relaxed">
                    {ring.how}
                  </p>
                </div>
                <div className="text-xs font-mono text-[#8c8070] shrink-0 hidden sm:block text-right leading-tight max-w-[80px]">
                  {ring.who}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Origin Story ──────────────────────────────────────────────────────────────
function OriginStory() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0d0d14] border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-5 gap-8 sm:gap-12 items-start">
          <div className="sm:col-span-2">
            <p className="font-mono text-xs text-[#00E5D4]/70 uppercase tracking-[0.2em] mb-4">
              The Story
            </p>

            <blockquote className="font-lora text-xl sm:text-2xl italic text-[#f0e8d8] leading-relaxed mb-4">
              "I'm from a place where money was never talked about."
            </blockquote>
            <p className="text-sm text-[#8c8070] font-mono">— Founder, Pausa</p>
          </div>
          <div className="sm:col-span-3 space-y-5 font-jakarta text-[#c4b9aa] leading-relaxed text-base sm:text-lg">
            <p>
              When I got my first salary, I did what every confused young Indian
              does — asked Google, asked Reddit, joined WhatsApp groups
              promising "guaranteed returns," watched finfluencers who were more
              interested in selling their ₹9,999 course.
            </p>
            <p>
              Nobody told me the difference between a regular and direct mutual
              fund. Nobody explained why the LIC policy my father was proud of
              was quietly destroying our family's wealth.
            </p>
            <p>
              I got a thousand opinions.{" "}
              <span className="text-[#f0e8d8] font-semibold">
                Zero honest answers.
              </span>
            </p>
            <p
              className="text-[#f0e8d8] font-medium p-5 rounded-2xl border border-[#00E5D4]/15"
              style={{ background: `${CY}08` }}
            >
              So I built Pausa — the platform I needed at 22. Not more articles.
              Not another forum. Something that listens to your situation and
              tells you clearly: <em>here is what to do next.</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: "💬",
      title: "Describe your situation",
      desc: "Type your income, debts, and goals in plain Hindi or English. No forms. No jargon.",
    },
    {
      num: "02",
      icon: "⚡",
      title: "AI builds your plan",
      desc: "India-specific AI analyses debt, savings, tax, and instruments.",
    },
    {
      num: "03",
      icon: "📋",
      title: "Act on it",
      desc: "Get numbered steps with rupee amounts. No guesswork.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#09090f] border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-mono text-xs text-[#00E5D4]/70 uppercase tracking-[0.2em] mb-3">
            How It Works
          </p>
          <h2 className="font-lora text-3xl sm:text-4xl font-bold text-[#f0e8d8] leading-tight">
            From confused to clear
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${CY}, ${CYG})`,
              }}
            >
              without the overwhelm.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 lg:gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center sm:text-left"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto sm:mx-0 border border-[#00E5D4]/15"
                style={{ background: `${CY}10` }}
              >
                {s.icon}
              </div>
              <span
                className="font-mono text-xs font-bold uppercase tracking-widest block mb-2"
                style={{ color: `${CY}60` }}
              >
                {s.num}
              </span>
              <h3 className="font-lora font-bold text-[#f0e8d8] text-xl mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-[#8c8070] font-jakarta leading-relaxed">
                {s.desc}
              </p>

              {i < 2 && (
                <div className="hidden sm:block absolute top-7 -right-4 lg:-right-6 text-[#00E5D4]/20 text-2xl select-none">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* === Community Section === */}
        <div className="mt-16 sm:mt-20 bg-[#111118] border border-[#00E5D4]/10 rounded-3xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#00E5D4]/10 flex items-center justify-center text-4xl">
            👥
          </div>
          <h3 className="text-2xl font-lora font-semibold text-[#f0e8d8] mb-3">
            Have doubts or need real experiences?
          </h3>
          <p className="text-[#8c8070] max-w-md mx-auto mb-6">
            Ask questions from our community who are on the same journey. Get
            practical insights, success stories, and motivation.
          </p>

          {/* Updated Button with Navigation */}
          <Link href="/community">
            <button className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#00E5D4]/30 px-6 py-3.5 rounded-2xl text-sm font-medium text-white">
              <span>Ask the Community</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <g transform="rotate(45 12 12)">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </g>
              </svg>
            </button>
          </Link>
        </div>

        <p className="mt-12 text-xs text-[#8c8070] font-mono text-center">
          Educational guidance only · Not SEBI-regulated investment advice
        </p>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0d0d14] border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center">
        <div className="relative">
          <div
            className="absolute inset-0 blur-3xl opacity-10 rounded-full"
            style={{
              background: `radial-gradient(ellipse, ${CY}, transparent 70%)`,
            }}
          />
          <div className="relative">
            {/* <img
              src="/image.png"
              alt="Pausa"
              className="w-16 h-16 rounded-2xl mx-auto mb-6"
            /> */}
            <h2 className="font-lora text-3xl sm:text-5xl font-bold text-[#f0e8d8] mb-6 leading-tight">
              Your next three
              <br />
              financial moves.
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${CY}, ${CYG})`,
                }}
              >
                Waiting for you.
              </span>
            </h2>
            <p className="text-[#8c8070] font-jakarta mb-8 text-lg max-w-md mx-auto">
              No upsells. No affiliate links. Just honest guidance.
            </p>
            <Link href="/sign-up">
              <button
                className="text-[#09090f] text-lg font-bold px-12 py-4 rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${CY}, ${CYG})`,
                  boxShadow: `0 8px 40px ${CY}30`,
                }}
              >
                Get my free financial plan →
              </button>
            </Link>
            <p className="mt-4 text-xs text-[#8c8070] font-mono">
              No card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Android Download ──────────────────────────────────────────────────────────
function AndroidDownload() {
  const [apkClicked, setApkClicked] = useState(false);

  return (
    <section
      id="android-download"
      className="py-16 sm:py-24 px-4 sm:px-6 bg-[#09090f] border-t border-[#00E5D4]/8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#00E5D4]/8 border border-[#00E5D4]/15 text-[#00E5D4] text-xs font-mono px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5D4] animate-pulse" />
            In Active Development
          </div>
          <h2 className="font-lora text-3xl sm:text-4xl font-bold text-[#f0e8d8] mb-4 leading-tight">
            Pausa for Android
          </h2>
          <p className="text-[#8c8070] font-jakarta text-base leading-relaxed max-w-lg mx-auto">
            We're building the Android app right now. Your plan, your goals, the
            community — all in your pocket. Free.
          </p>
        </div>

        {/* App card */}
        <div className="ai-card p-5 sm:p-6 mb-5 rounded-2xl">
          <div className="flex items-center gap-4 mb-5">
            {/* <img
              src="/image.png"
              alt="Pausa"
              className="w-14 h-14 rounded-xl shrink-0"
            /> */}
            <div className="flex-1 min-w-0">
              <p className="font-lora font-bold text-[#f0e8d8] text-lg">
                Pausa
              </p>
              <p className="text-xs text-[#8c8070] font-mono mb-2">
                Financial Guidance · Android · Beta
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 bg-[#00E5D4]/8 text-[#00E5D4] text-xs font-mono px-2.5 py-1 rounded-full border border-[#00E5D4]/15">
                  <span className="w-1 h-1 rounded-full bg-[#00E5D4] animate-pulse" />
                  v0.1 Beta
                </span>
                <span className="inline-block bg-white/5 text-[#8c8070] text-xs font-mono px-2.5 py-1 rounded-full border border-white/8">
                  Android 8.0+
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-4 border-t border-white/6">
            {["Financial AI", "Community access", "AI plan builder"].map(
              (f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 text-sm text-[#c4b9aa] font-jakarta"
                >
                  <span className="text-xs shrink-0" style={{ color: CY }}>
                    ✓
                  </span>
                  {f}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Download options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <button
              onClick={() => setApkClicked(true)}
              className="w-full flex items-center justify-center gap-2.5 font-bold px-5 py-4 rounded-2xl border transition-all text-base"
              style={{
                background: apkClicked ? `${CY}15` : `${CY}08`,
                borderColor: `${CY}35`,
                color: CY,
              }}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download APK
            </button>
            <AnimatePresence>
              {apkClicked && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-jakarta mt-2 text-center px-2"
                  style={{ color: `${CY}99` }}
                >
                  Build in progress — join below to get notified first.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button className="w-full flex items-center justify-center gap-2.5 font-semibold px-5 py-4 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all text-base text-[#c4b9aa]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M3.18 23.76c.37.2.8.2 1.18 0L16.4 12 4.36.24c-.38-.2-.8-.2-1.18 0C2.44.68 2 1.36 2 2.14v19.72c0 .78.44 1.46 1.18 1.9z"
                opacity=".5"
              />
              <path d="M20.36 10.56l-3.2-1.82L13.7 12l3.46 3.26 3.2-1.82a2 2 0 000-2.88z" />
              <path
                d="M4.36 23.76L16.4 12 4.36.24C4.24.16 4.12.12 4 .12v23.76c.12 0 .24-.04.36-.12z"
                opacity=".7"
              />
            </svg>
            Google Play
            <span className="text-xs font-mono text-[#8c8070] font-normal">
              Soon
            </span>
          </button>
        </div>

        {/* Waitlist */}
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 bg-[#0d0d14] border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Logo + Brand */}
          <div className="flex items-center gap-0">
            {/* Reduced gap */}
            <img
              src="/image.png"
              alt="Pausa"
              className="w-30 h-40 object-contain" // Increased size (you can go w-11 or w-12)
            />
            <span className="font-lora font-bold text-2xl text-[#f0e8d8]">
              Pausa
            </span>
          </div>

          {/* Center - Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#8c8070] font-jakarta">
            <Link href="/community">
              <span className="hover:text-[#00E5D4] transition-colors cursor-pointer">
                Community
              </span>
            </Link>
            <Link href="/dashboard">
              <span className="hover:text-[#00E5D4] transition-colors cursor-pointer">
                Dashboard
              </span>
            </Link>
            <Link href="/advisor">
              <span className="hover:text-[#00E5D4] transition-colors cursor-pointer">
                AI Advisor
              </span>
            </Link>
          </div>

          {/* Right - Disclaimer */}
          <div className="text-xs text-[#8c8070] font-jakarta text-center md:text-right max-w-[280px]">
            Educational guidance only. Not SEBI-registered advice.
          </div>
        </div>
      </div>
    </footer>
  );
}
// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <div className="font-jakarta bg-[#09090f] min-h-screen">
      <HomeNav lang={lang} setLang={setLang} />
      <Hero />
      <StatsBar />
      <WhyPausa />
      {/* <AIFeatures /> */}
      <Community />
      <OriginStory />
      <HowItWorks />
      <FinalCTA />
      <AndroidDownload />
      <Footer />
    </div>
  );
}
