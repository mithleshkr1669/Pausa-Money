import { Link } from "wouter";
import { isClerkConfigured } from "@/lib/clerk-config";
import { KeyRound } from "lucide-react";
import { SignUp } from "@clerk/clerk-react";
function ClerkSignUp() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: "#00E5CC",
          colorBackground: "#111114",
          colorText: "#F0EEE9",
          colorTextSecondary: "#7C7C7C",
          colorInputBackground: "#1A1A1D",
          colorInputText: "#F0EEE9",
          colorNeutral: "#F0EEE9",
          fontFamily: "Inter, sans-serif",
          borderRadius: "12px",
        },
        elements: {
          card: "shadow-2xl border border-white/8",
          headerTitle: "font-display",
          formButtonPrimary:
            "bg-primary! text-[#0A0A0C]! font-semibold! hover:opacity-90!",
          footerActionLink: "text-primary! hover:text-primary/80!",
          identityPreviewEditButton: "text-primary!",
          formFieldInput:
            "border-white/10! focus:border-primary/50! bg-[#1A1A1D]!",
          dividerLine: "bg-white/10!",
        },
      }}
    />
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src="/image.png"
              alt="Pausa"
              className="h-10 w-10 rounded-lg"
            />
            <span className="font-display font-bold text-2xl text-foreground">
              Pausa
            </span>
          </Link>
          <p className="text-muted-foreground text-sm">
            Join the community — start as a{" "}
            <span className="text-primary font-medium">Seed 🌱</span>
          </p>
        </div>
        {isClerkConfigured ? (
          <ClerkSignUp />
        ) : (
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold mb-3">
              Setup Required
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Add{" "}
              <code className="bg-card border border-white/10 px-1.5 py-0.5 rounded text-primary text-xs">
                VITE_CLERK_PUBLISHABLE_KEY
              </code>{" "}
              to your{" "}
              <code className="bg-card border border-white/10 px-1.5 py-0.5 rounded text-primary text-xs">
                .env
              </code>{" "}
              file to enable sign up.
            </p>
            <Link href="/">
              <button className="text-sm text-primary hover:underline">
                ← Back to landing page
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
