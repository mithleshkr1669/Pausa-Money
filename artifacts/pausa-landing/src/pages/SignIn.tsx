import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/pausa-logo.png" alt="Pausa" className="h-10 w-10 rounded-lg" />
            <span className="font-display font-bold text-2xl text-foreground">Pausa</span>
          </a>
          <p className="text-muted-foreground text-sm">Sign in to access the community</p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/community"
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
              formButtonPrimary: "bg-primary! text-[#0A0A0C]! font-semibold! hover:opacity-90!",
              footerActionLink: "text-primary! hover:text-primary/80!",
              identityPreviewEditButton: "text-primary!",
              formFieldInput: "border-white/10! focus:border-primary/50! bg-[#1A1A1D]!",
              dividerLine: "bg-white/10!",
            },
          }}
        />
      </div>
    </div>
  );
}
