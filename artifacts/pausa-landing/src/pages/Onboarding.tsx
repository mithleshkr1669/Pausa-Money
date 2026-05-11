import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useUser } from "@clerk/clerk-react";
import { Loader2, ChevronRight, Phone, ShieldCheck } from "lucide-react";
import { saveOnboarding, completeOnboarding } from "@/lib/community";
import { isClerkConfigured } from "@/lib/clerk-config";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  situation: string;
  worry: string;
  income_range: string;
  supports: string[];
  top_goal: string;
  phone: string;
}

// ── Question steps ────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "situation",
    title: "What brought you here today?",
    subtitle: "This helps us understand your journey — no wrong answers.",
    type: "choice" as const,
    options: [
      { value: "first_job", label: "Just got my first job 🎉", sub: "New to managing money" },
      { value: "debt",      label: "Dealing with debt 😓",    sub: "Need help getting out" },
      { value: "planning",  label: "Planning for family 👨‍👩‍👧",  sub: "Responsibilities are growing" },
      { value: "nri",       label: "Returned from abroad 🌏",  sub: "NRI becoming resident" },
      { value: "confused",  label: "Just confused overall 🤷", sub: "Don't know where to start" },
      { value: "investing",  label: "Ready to invest 📈",      sub: "Have savings, need a plan" },
    ],
  },
  {
    id: "worry",
    title: "What's your biggest money challenge right now?",
    subtitle: "Be honest — this is just for personalizing your experience.",
    type: "choice" as const,
    options: [
      { value: "where_to_start", label: "Don't know where to start", sub: "Overwhelmed by options" },
      { value: "too_much_debt",  label: "Too much debt",             sub: "Loans, credit cards" },
      { value: "no_savings",     label: "Not saving enough",         sub: "Money disappears each month" },
      { value: "no_insurance",   label: "No insurance or safety net", sub: "Worried about emergencies" },
      { value: "investing",      label: "Want to invest but scared",  sub: "Afraid of losing money" },
      { value: "taxes",          label: "Confused about taxes",       sub: "ITR, 80C, TDS etc." },
    ],
  },
  {
    id: "income_range",
    title: "What's your monthly income range?",
    subtitle: "Used only to calibrate advice. Never shared or sold.",
    type: "choice" as const,
    options: [
      { value: "below_20k",  label: "Below ₹20,000",    sub: "" },
      { value: "20k_40k",    label: "₹20,000 – ₹40,000", sub: "" },
      { value: "40k_75k",    label: "₹40,000 – ₹75,000", sub: "" },
      { value: "75k_1lac",   label: "₹75,000 – ₹1 Lakh", sub: "" },
      { value: "above_1lac", label: "Above ₹1 Lakh",      sub: "" },
      { value: "variable",   label: "Variable / Freelance", sub: "Changes month to month" },
    ],
  },
  {
    id: "supports",
    title: "Who do you financially support?",
    subtitle: "Select all that apply. This shapes your safety net advice.",
    type: "multi" as const,
    options: [
      { value: "just_me",   label: "Just myself",     sub: "" },
      { value: "parents",   label: "Parents",         sub: "" },
      { value: "spouse",    label: "Spouse / Partner", sub: "" },
      { value: "children",  label: "Children",        sub: "" },
      { value: "siblings",  label: "Siblings",        sub: "" },
      { value: "extended",  label: "Extended family", sub: "" },
    ],
  },
  {
    id: "top_goal",
    title: "What's your top money goal this year?",
    subtitle: "Pick the one that matters most to you right now.",
    type: "choice" as const,
    options: [
      { value: "emergency_fund", label: "Build an emergency fund 🛟", sub: "3-6 months expenses" },
      { value: "debt_free",      label: "Become debt free 🔓",        sub: "Pay off loans" },
      { value: "first_invest",   label: "Start my first SIP 📈",      sub: "Begin investing" },
      { value: "insurance",      label: "Get proper insurance 🛡️",     sub: "Term + health" },
      { value: "save_home",      label: "Save for a home 🏠",         sub: "Down payment" },
      { value: "travel",         label: "Save for travel / big goal ✈️", sub: "Specific milestone" },
    ],
  },
];

// ── Choice Step ───────────────────────────────────────────────────────────────
function ChoiceStep({ step, value, multi, onSelect }: {
  step: typeof STEPS[0]; value: string | string[]; multi: boolean;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {step.options.map((opt) => {
        const isSelected = multi
          ? (value as string[]).includes(opt.value)
          : value === opt.value;
        return (
          <button key={opt.value} onClick={() => onSelect(opt.value)}
            className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
              isSelected
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-white/8 bg-card/50 text-foreground/80 hover:border-white/15 hover:bg-white/3"
            }`}
          >
            <p className="font-medium text-sm">{opt.label}</p>
            {opt.sub && <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>}
          </button>
        );
      })}
    </div>
  );
}

// ── Phone OTP Step ────────────────────────────────────────────────────────────
function PhoneStep({ phone, onPhoneChange, onVerify, verified, verifying }: {
  phone: string; onPhoneChange: (v: string) => void;
  onVerify: () => void; verified: boolean; verifying: boolean;
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    setOtpSent(true);
    // In production: call /api/otp/send with phone number (MSG91 / Twilio)
    // For now: simulate OTP send
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        We'll send you important updates about your financial plan via WhatsApp.
        Your number is never sold or shared.
      </p>

      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-card border border-white/8 rounded-xl px-3 py-2.5 text-sm text-muted-foreground shrink-0">
          🇮🇳 +91
        </div>
        <input
          type="tel" value={phone} onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
          className="flex-1 bg-card border border-white/8 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 font-mono"
        />
      </div>

      {!otpSent ? (
        <button onClick={handleSendOTP} disabled={phone.length < 10}
          className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-40">
          <Phone className="w-4 h-4" />Send OTP via WhatsApp
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Enter the 6-digit OTP sent to +91 {phone}</p>
          <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit OTP"
            className="w-full bg-card border border-white/8 rounded-xl px-4 py-2.5 text-sm text-foreground font-mono text-center tracking-widest focus:outline-none focus:border-primary/40"
          />
          <button onClick={onVerify} disabled={otp.length < 4 || verifying}
            className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-40">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Verify OTP
          </button>
          <button onClick={() => setOtpSent(false)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Change number
          </button>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center">Skip for now ↓</p>
    </div>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user } = isClerkConfigured
    ? require("@clerk/clerk-react").useUser()
    : { user: null };

  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    situation: "", worry: "", income_range: "", supports: [], top_goal: "", phone: "",
  });
  const [phoneVerified] = useState(false);
  const [verifying] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalSteps = STEPS.length + 1; // +1 for phone step
  const isPhoneStep = step === STEPS.length;
  const currentStep = isPhoneStep ? null : STEPS[step];
  const progress = ((step + 1) / totalSteps) * 100;

  const handleChoice = (field: keyof OnboardingData, value: string, multi = false) => {
    setData((prev) => {
      if (multi) {
        const arr = prev.supports;
        if (value === "just_me") return { ...prev, supports: ["just_me"] };
        const filtered = arr.filter((v) => v !== "just_me");
        return {
          ...prev,
          supports: filtered.includes(value) ? filtered.filter((v) => v !== value) : [...filtered, value],
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const canAdvance = () => {
    if (isPhoneStep) return true;
    const s = STEPS[step];
    if (s.type === "multi") return data.supports.length > 0;
    return !!data[s.id as keyof OnboardingData];
  };

  const handleNext = async () => {
    if (step < STEPS.length) {
      setStep((s) => s + 1);
    } else {
      // Finish
      setSaving(true);
      if (user) {
        await saveOnboarding(user.id, {
          ...data,
          phone_verified: phoneVerified,
          completed: true,
          completed_at: new Date().toISOString(),
        });
        await completeOnboarding(user.id);
      } else {
        // Store in localStorage if not signed in
        localStorage.setItem("pausa_onboarding", JSON.stringify({ ...data, completed: true }));
      }
      setSaving(false);
      setLocation("/community");
    }
  };

  const handlePhoneVerify = async () => {
    // In production: verify OTP via /api/otp/verify
    // For now: simulate success
    await handleNext();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-2">Step {step + 1} of {totalSteps}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {isPhoneStep ? (
              <div>
                <div className="mb-6">
                  <div className="text-3xl mb-3">📱</div>
                  <h2 className="text-2xl font-display font-bold mb-2">Stay in the loop</h2>
                  <p className="text-muted-foreground text-sm">Get alerts when someone answers your questions, and your weekly financial digest.</p>
                </div>
                <PhoneStep
                  phone={data.phone}
                  onPhoneChange={(v) => setData((d) => ({ ...d, phone: v }))}
                  onVerify={handlePhoneVerify}
                  verified={phoneVerified}
                  verifying={verifying}
                />
              </div>
            ) : currentStep ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold mb-2">{currentStep.title}</h2>
                  <p className="text-muted-foreground text-sm">{currentStep.subtitle}</p>
                </div>
                <ChoiceStep
                  step={currentStep}
                  value={currentStep.type === "multi" ? data.supports : data[currentStep.id as keyof OnboardingData] as string}
                  multi={currentStep.type === "multi"}
                  onSelect={(v) => handleChoice(currentStep.id as keyof OnboardingData, v, currentStep.type === "multi")}
                />
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => step > 0 ? setStep((s) => s - 1) : setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {step === 0 ? "Back to home" : "Back"}
          </button>
          <button
            onClick={isPhoneStep ? handleNext : handleNext}
            disabled={!canAdvance() || saving}
            className="flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {step === STEPS.length - 1 ? "Almost done" : isPhoneStep ? "Enter the community →" : "Continue"}
            {!saving && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
