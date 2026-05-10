import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { GlowButton } from "@/components/ui/GlowButton";
import { cn } from "@/lib/utils";
import { Users, LogIn, LogOut, ChevronDown } from "lucide-react";
import { isClerkConfigured } from "@/lib/clerk-config";

// Only imported / rendered when ClerkProvider is mounted
import { useUser, useClerk } from "@clerk/clerk-react";

function SignInLink() {
  return (
    <Link href="/sign-in">
      <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:block">Sign In</span>
      </button>
    </Link>
  );
}

// Only rendered when isClerkConfigured === true (ClerkProvider is present)
function UserMenuInner() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  if (!isLoaded) return <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse" />;
  if (!isSignedIn) return <SignInLink />;

  const initial = (
    user.firstName?.[0] ??
    user.primaryEmailAddress?.emailAddress?.[0] ??
    "U"
  ).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="w-7 h-7 rounded-full border border-white/10" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-primary font-bold">
            {initial}
          </div>
        )}
        <span className="hidden sm:block max-w-24 truncate">{user.firstName ?? "Account"}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium truncate">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <Link href="/community">
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Users className="w-4 h-4 text-muted-foreground" />
                Community
              </button>
            </Link>
            <button
              onClick={() => { signOut(); setLocation("/"); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-white/5"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/" || location === "";

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-white/5 py-4"
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group outline-none">
          <img
            src="/pausa-logo.png"
            alt="Pausa logo"
            className="h-10 w-10 object-contain rounded-lg"
          />
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">
            Pausa
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {isHome && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <button
                onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-primary transition-colors"
              >Vision</button>
              <button
                onClick={() => document.getElementById("pillars")?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-primary transition-colors"
              >Pillars</button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-primary transition-colors"
              >Engine</button>
            </div>
          )}

          <Link href="/community">
            <button
              className={cn(
                "hidden sm:flex items-center gap-1.5 text-sm font-medium transition-colors",
                location.startsWith("/community")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Users className="w-4 h-4" />
              Community
            </button>
          </Link>

          {/* Conditionally render Clerk-hook component */}
          {isClerkConfigured ? <UserMenuInner /> : <SignInLink />}

          {isHome && (
            <GlowButton
              size="sm"
              onClick={() => document.getElementById("download")?.scrollIntoView({ behavior: "smooth" })}
            >
              Download APK
            </GlowButton>
          )}
        </div>
      </div>
    </nav>
  );
}
