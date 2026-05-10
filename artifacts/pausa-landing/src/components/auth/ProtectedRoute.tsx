import { useAuth } from "@clerk/clerk-react";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { isClerkConfigured } from "@/lib/clerk-config";
import { KeyRound } from "lucide-react";

function ClerkProtectedInner({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;
  return <>{children}</>;
}

function SetupRequired() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold mb-3">Setup Required</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Add your Clerk publishable key to the{" "}
          <code className="bg-card border border-white/10 px-1.5 py-0.5 rounded text-primary text-xs">.env</code>{" "}
          file to enable authentication and the community features.
        </p>
        <div className="bg-card border border-white/5 rounded-xl p-4 text-left font-mono text-xs text-muted-foreground mb-6 leading-relaxed">
          <p className="text-primary/70"># .env</p>
          <p>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</p>
          <p>VITE_SUPABASE_URL=https://xxx.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=eyJ...</p>
        </div>
        <Link href="/">
          <button className="text-sm text-primary hover:underline">← Back to landing page</button>
        </Link>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured) {
    return <SetupRequired />;
  }
  return <ClerkProtectedInner>{children}</ClerkProtectedInner>;
}
