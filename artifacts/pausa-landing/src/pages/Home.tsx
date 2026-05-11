import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// ── Language context (EN only, Hindi coming soon) ─────────────────────────────
type Lang = "en" | "hi";

// ── Home Navbar ───────────────────────────────────────────────────────────────
function HomeNav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#faf7f2]/95 backdrop-blur-md shadow-sm border-b border-[#1c1814]/8" : "bg-transparent"}`}>
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🌿</span>
          <span className="font-lora font-bold text-xl text-[#1c1814] tracking-tight">Pausa</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#1c1814]/15 text-[#8c8070] hover:border-[#e8651a]/40 hover:text-[#e8651a] transition-colors"
          >
            {lang === "en" ? "हिंदी" : "English"}
          </button>
          <Link href="/sign-in">
            <button className="text-sm text-[#4a4438] hover:text-[#1c1814] transition-colors font-medium">Sign in</button>
          </Link>
          <Link href="/sign-up">
            <button className="text-sm bg-[#e8651a] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#d4561a] transition-colors shadow-sm">
              Get free plan →
            </button>
          </Link>
        </div>
      </div>
      {/* Hindi coming soon toast */}
      {lang === "hi" && (
        <div className="bg-[#e8651a]/10 border-b border-[#e8651a]/20 text-center py-1.5 text-xs text-[#e8651a] font-medium">
          हिंदी संस्करण जल्द आ रहा है — Hindi version coming soon. Showing English for now.
        </div>
      )}
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  const lines = [
    "You got your first salary.",
    "You asked the internet.",
    "You got a thousand opinions.",
    "",
    "Zero answers.",
  ];

  return (
    <section className="min-h-screen flex flex-col justify-center px-5 pt-24 pb-16 max-w-5xl mx-auto">
      <div className="flex gap-5 items-start max-w-2xl">
        {/* Saffron vertical rule */}
        <div className="w-1 self-stretch bg-[#e8651a] rounded-full mt-1 shrink-0 hidden sm:block" />

        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.18 } } }}
            className="mb-10"
          >
            {lines.map((line, i) => (
              <motion.p
                key={i}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className={`font-lora leading-tight ${
                  line === "" ? "mb-4" :
                  line === "Zero answers." ? "text-4xl sm:text-5xl md:text-6xl font-bold text-[#e8651a] mb-2" :
                  "text-3xl sm:text-4xl md:text-5xl font-bold text-[#1c1814] mb-2"
                }`}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-lg text-[#4a4438] font-jakarta leading-relaxed mb-8 max-w-lg"
          >
            Pausa is the honest elder sibling who figured it out first — and tells you exactly what to do with your money, in your language, for your situation. Free. In 8 seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
          >
            <Link href="/sign-up">
              <button className="bg-[#e8651a] text-white text-base font-semibold px-8 py-3.5 rounded-full hover:bg-[#d4561a] transition-all shadow-lg shadow-[#e8651a]/20 hover:shadow-xl hover:shadow-[#e8651a]/30 hover:-translate-y-0.5 active:translate-y-0">
                Get my free financial plan →
              </button>
            </Link>
            <p className="mt-3 text-xs text-[#8c8070] font-jakarta">
              No account needed to try · Available in Hindi &amp; English · Reviewed by certified experts
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Origin Story ──────────────────────────────────────────────────────────────
function OriginStory() {
  return (
    <section className="bg-[#1a1612] py-20 px-5">
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-xs text-[#e8651a]/70 uppercase tracking-[0.2em] mb-10">The Story</p>

        {/* Pull quote */}
        <div className="relative mb-12">
          <div className="absolute -top-4 -left-2 text-8xl text-[#e8651a]/12 font-lora leading-none select-none">"</div>
          <blockquote className="font-lora text-2xl sm:text-3xl italic text-[#f0e8d8] leading-relaxed pl-4">
            I'm from a place where<br />
            money was never talked about.<br />
            Where asking "how much do you earn?"<br />
            is still considered rude.
          </blockquote>
          <p className="mt-4 text-sm text-[#8c8070] font-mono pl-4">— Founder, Pausa</p>
        </div>

        <div className="space-y-6 font-jakarta text-[#c4b9aa] leading-relaxed text-base sm:text-lg border-t border-white/8 pt-8">
          <p>When I got my first salary, I did what every confused young Indian does. I asked Google. I asked Reddit. I joined WhatsApp groups promising "guaranteed returns." I watched finfluencers who were more interested in selling me their ₹9,999 course.</p>
          <p>Nobody told me the difference between a regular and direct mutual fund. Nobody explained why the LIC policy my father was so proud of was quietly destroying our family's savings. Nobody said: <span className="text-[#f0e8d8] font-medium">"Here's what YOU should do first — given your actual situation."</span></p>
          <p>I got a thousand opinions. Zero honest answers.</p>
          <p className="text-[#f0e8d8] font-medium">So I built Pausa — the platform I needed at 22. Not more articles. Not another forum. Something that listens to your situation and tells you, clearly: here is what to do next.</p>
        </div>
      </div>
    </section>
  );
}

// ── Problem Section ───────────────────────────────────────────────────────────
function ProblemSection() {
  const problems = [
    { icon: "💬", title: "Opinions, not answers", desc: "Reddit gives you 10 contradictory opinions from strangers with no accountability." },
    { icon: "🇺🇸", title: "Built for America", desc: "90% of advice is about 401k and Roth IRA. Nobody explains PPF, NPS, or ELSS." },
    { icon: "🧠", title: "Forgets you exist", desc: "Every post starts from zero. No memory. No journey. You're a stranger every time." },
    { icon: "🎭", title: "Finfluencer agendas", desc: "That YouTuber earns commission from every product he 'recommends.'" },
    { icon: "🔤", title: "English only", desc: "90% of financial content is in English. 90% of India is not." },
    { icon: "⏳", title: "Content, not action", desc: "You've read 'invest in SIP' 50 times. You still haven't started. Nobody helps you do it." },
  ];

  return (
    <section className="py-20 px-5 bg-[#f2ede3]">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs text-[#e8651a]/70 uppercase tracking-[0.2em] mb-4">Why This Exists</p>
        <h2 className="font-lora text-3xl sm:text-4xl font-bold text-[#1c1814] mb-12 max-w-lg leading-tight">
          Every Indian finance community has the same fatal flaw.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-5 shadow-sm border border-[#1c1814]/6">
              <span className="text-2xl block mb-3">{p.icon}</span>
              <h3 className="font-lora font-semibold text-[#1c1814] text-base mb-2">{p.title}</h3>
              <p className="text-sm text-[#8c8070] font-jakarta leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#1c1814]/10 text-center">
          <p className="font-lora text-xl sm:text-2xl text-[#1c1814] font-medium leading-relaxed">
            Pausa doesn't give you more content.<br />
            <span className="text-[#e8651a]">It gives you your next three actions.</span>
          </p>
          <p className="mt-3 text-[#8c8070] font-jakarta text-sm">Specific to your income. Your debt. Your goals. In Hindi or English. In 8 seconds.</p>
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: "01", title: "Describe your situation.", desc: "Type your income, debts, and goals in plain Hindi or English. No jargon needed." },
    { num: "02", title: "AI reads your situation.", desc: "India-specific AI analyses: debt, savings, tax, instruments. 8 seconds." },
    { num: "03", title: "Get your plan. Act on it.", desc: "A numbered list of actions. In order. With rupee amounts. Verified by experts. Free forever." },
  ];

  return (
    <section className="py-20 px-5 bg-[#faf7f2]">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs text-[#e8651a]/70 uppercase tracking-[0.2em] mb-4">How It Works</p>
        <h2 className="font-lora text-3xl sm:text-4xl font-bold text-[#1c1814] mb-14 max-w-md leading-tight">
          From confused to clear. In under 10 seconds.
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <span className="font-mono text-5xl font-bold text-[#e8651a]/15 leading-none block mb-3">{s.num}</span>
              <h3 className="font-lora font-semibold text-[#1c1814] text-lg mb-2 leading-snug">{s.title}</h3>
              <p className="text-sm text-[#8c8070] font-jakarta leading-relaxed">{s.desc}</p>
              {i < 2 && <div className="hidden sm:block absolute top-8 -right-3 text-[#e8651a]/20 text-2xl">→</div>}
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-xs text-[#8c8070] font-mono text-center">
          Educational guidance only · Not SEBI-regulated investment advice · All AI plans reviewed by verified CFPs and SEBI RIAs
        </p>
      </div>
    </section>
  );
}

// ── Ring System ───────────────────────────────────────────────────────────────
function RingSystem() {
  const rings = [
    {
      icon: "🌱", name: "Seed", color: "#a3a3a3", bg: "#f5f5f5",
      who: "Everyone", badge: "All members",
      how: "You're already here. Just join. Complete your financial profile to activate your journey.",
      tagline: "Planted with intent",
    },
    {
      icon: "🌿", name: "Sprout", color: "#3d6b4f", bg: "#f0f7f2",
      who: "Active starters", badge: "Earned",
      how: "Complete 1 savings goal AND fill your Financial Plan. Both steps required.",
      tagline: "Breaking ground",
    },
    {
      icon: "🌳", name: "Sapling", color: "#5a3e8a", bg: "#f5f0ff",
      who: "Committed builders", badge: "Earned",
      how: "Complete 3 savings goals total. Each completed goal is automatically tracked.",
      tagline: "Taking root",
    },
    {
      icon: "🌲", name: "Grove", color: "#8a3e3e", bg: "#fff0f0",
      who: "Community contributors", badge: "Application",
      how: "Complete 6 goals AND actively answer questions in the community. Help others grow.",
      tagline: "Thriving, sheltering others",
    },
    {
      icon: "🌲🌲", name: "Forest", color: "#1a6b5a", bg: "#f0fff9",
      who: "Max 11 people · Forever", badge: "Invitation only",
      how: "Founder selection only. These 11 people shape the platform forever. Their names are on the wall.",
      tagline: "Full canopy · Legacy builder",
    },
  ];

  return (
    <section className="py-20 px-5 bg-[#1a1612]">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs text-[#e8651a]/70 uppercase tracking-[0.2em] mb-4">The Community</p>
        <h2 className="font-lora text-3xl sm:text-4xl font-bold text-[#f0e8d8] mb-4 leading-tight">
          Not just a forum.<br />A living community<br />with real structure.
        </h2>
        <p className="text-[#8c8070] font-jakarta mb-12 max-w-lg leading-relaxed">
          Five plant rings — from Seed to Forest. Each ring has clear, achievable milestones. Here's exactly how to grow.
        </p>

        <div className="space-y-3">
          {rings.map((ring, i) => (
            <motion.div key={ring.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/8 bg-white/3 p-5 flex gap-4 items-start hover:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: ring.bg }}>
                {ring.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-lora font-bold text-lg text-[#f0e8d8]">{ring.name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full border"
                    style={{ color: ring.color, borderColor: ring.color + "40", background: ring.color + "15" }}>
                    {ring.badge}
                  </span>
                  <span className="text-[#8c8070] font-jakarta text-xs">{ring.tagline}</span>
                </div>
                <p className="text-sm font-jakarta text-[#c4b9aa] leading-relaxed">
                  <span className="text-[#f0e8d8] font-medium">How to reach it: </span>
                  {ring.how}
                </p>
              </div>
              <div className="text-xs font-mono text-[#8c8070] shrink-0 hidden sm:block">{ring.who}</div>
            </motion.div>
          ))}
        </div>

        {/* Founding wall CTA */}
        <div className="mt-10 border border-[#e8651a]/30 rounded-2xl p-6 text-center bg-[#e8651a]/5">
          <p className="font-mono text-xs text-[#e8651a]/60 uppercase tracking-widest mb-2">The Founding Wall</p>
          <p className="font-lora text-xl text-[#f0e8d8] font-medium mb-1">9 of 11 Forest spots still open.</p>
          <p className="text-[#8c8070] font-jakarta text-sm mb-5">This is your moment. Founding members shape Pausa forever.</p>
          <Link href="/sign-up">
            <button className="bg-[#e8651a] text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-[#d4561a] transition-colors">
              Become a founding member →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Trust Stats ───────────────────────────────────────────────────────────────
function TrustStats() {
  const stats = [
    {
      stat: "27%",
      label: "of Indians are financially literate",
      sub: "That's 73% who deserve honest help. We're here for them.",
    },
    {
      stat: "800,000+",
      label: "Indians asking finance questions on Reddit",
      sub: "With no real answers. Just opinions and affiliate links.",
    },
    {
      stat: "< 1,000",
      label: "SEBI RIAs for 140 crore people",
      sub: "We're changing the ratio — AI + verified humans at scale.",
    },
  ];

  return (
    <section className="py-16 px-5 bg-[#1c1814]">
      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
        {stats.map((s) => (
          <div key={s.stat} className="text-center">
            <p className="font-lora text-4xl font-bold text-[#e8651a] mb-2">{s.stat}</p>
            <p className="text-sm font-medium text-[#f0e8d8] mb-1">{s.label}</p>
            <p className="text-xs text-[#8c8070] font-jakarta leading-relaxed">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 px-5 bg-[#faf7f2] text-center">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs text-[#e8651a]/70 uppercase tracking-[0.2em] mb-6">Start Here</p>
        <h2 className="font-lora text-3xl sm:text-5xl font-bold text-[#1c1814] mb-6 leading-tight">
          Your next three<br />financial moves.<br />
          <span className="text-[#e8651a]">Waiting for you.</span>
        </h2>
        <p className="text-[#8c8070] font-jakarta mb-8 text-lg">
          Free forever. No upsells. No affiliate links. Just honest guidance.
        </p>
        <Link href="/sign-up">
          <button className="bg-[#e8651a] text-white text-lg font-semibold px-10 py-4 rounded-full hover:bg-[#d4561a] transition-all shadow-lg shadow-[#e8651a]/20 hover:-translate-y-0.5 active:translate-y-0">
            Get my free financial plan →
          </button>
        </Link>
        <p className="mt-4 text-xs text-[#8c8070] font-mono">Takes 2 minutes · No card required · Cancel anytime</p>
      </div>
    </section>
  );
}

// ── Home Footer ───────────────────────────────────────────────────────────────
function HomeFooter() {
  return (
    <footer className="py-10 px-5 bg-[#1c1814] border-t border-white/5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="font-lora font-bold text-[#f0e8d8]">Pausa</span>
          <span className="text-[#8c8070] font-mono text-xs ml-2">pausa.money</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-[#8c8070] font-jakarta">
          <Link href="/community"><span className="hover:text-[#e8651a] transition-colors cursor-pointer">Community</span></Link>
          <Link href="/dashboard"><span className="hover:text-[#e8651a] transition-colors cursor-pointer">Dashboard</span></Link>
          <Link href="/advisor"><span className="hover:text-[#e8651a] transition-colors cursor-pointer">AI Advisor</span></Link>
          <span>·</span>
          <span>Educational guidance only. Not SEBI-registered advice.</span>
        </div>
      </div>
    </footer>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <div className="home-warm font-jakarta">
      <HomeNav lang={lang} setLang={setLang} />
      <HeroSection />
      <OriginStory />
      <ProblemSection />
      <HowItWorks />
      <RingSystem />
      <TrustStats />
      <FinalCTA />
      <HomeFooter />
    </div>
  );
}
