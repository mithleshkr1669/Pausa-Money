import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { GlowButton } from "@/components/ui/GlowButton";
import { cn } from "@/lib/utils";
import {
  Users,
  LogIn,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Menu,
  X,
  Bot,
} from "lucide-react";
import { isClerkConfigured } from "@/lib/clerk-config";
import { useClerk, useUser } from "@clerk/clerk-react";
import { PausaLogo } from "../PausaLogo";
function UserMenuClerk({ onNavClick }: { onNavClick?: () => void }) {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  if (!isLoaded)
    return <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse" />;
  if (!isSignedIn) return <SignInLink onClick={onNavClick} />;

  const initial = (
    user.firstName?.[0] ??
    user.primaryEmailAddress?.emailAddress?.[0] ??
    "U"
  ).toUpperCase();
  const close = () => {
    setOpen(false);
    onNavClick?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            className="w-7 h-7 rounded-full border border-white/10"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-primary font-bold">
            {initial}
          </div>
        )}
        <span className="hidden sm:block max-w-24 truncate">
          {user.firstName ?? "Account"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
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
            <Link href="/dashboard">
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                onClick={close}
              >
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                Dashboard
              </button>
            </Link>
            <Link href="/advisor">
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                onClick={close}
              >
                <Bot className="w-4 h-4 text-muted-foreground" />
                Pausa AI
              </button>
            </Link>
            <Link href="/community">
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                onClick={close}
              >
                <Users className="w-4 h-4 text-muted-foreground" />
                Community
              </button>
            </Link>
            <button
              onClick={() => {
                signOut();
                setLocation("/");
                close();
              }}
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

function SignInLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/sign-in">
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </button>
    </Link>
  );
}

function NavUserArea({ onNavClick }: { onNavClick?: () => void }) {
  if (isClerkConfigured) return <UserMenuClerk onNavClick={onNavClick} />;
  return <SignInLink onClick={onNavClick} />;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isHome = location === "/" || location === "";
  const closeMobile = () => setMobileOpen(false);
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    closeMobile();
  };

  const NAV_LINKS = [
    {
      href: "/community",
      label: "Community",
      icon: <Users className="w-4 h-4" />,
      active: location.startsWith("/community"),
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      active: location === "/dashboard",
    },
    {
      href: "/advisor",
      label: "Pausa AI",
      icon: <Bot className="w-4 h-4" />,
      active: location === "/advisor",
    },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-white/5 py-3"
          : "bg-transparent border-transparent py-4 md:py-6",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 outline-none shrink-0"
        >
          {/* <img
            src="/image.png"
            alt="Pausa logo"
            className="h-8 w-8 md:h-10 md:w-10 object-contain rounded-lg"
          /> */}
          <PausaLogo size={36} />

          <span className="font-display font-bold text-xl md:text-2xl tracking-tight text-foreground">
            Pausa
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {isHome && (
            <div className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
              <button
                onClick={() => scrollTo("problem")}
                className="hover:text-primary transition-colors"
              >
                Vision
              </button>
              <button
                onClick={() => scrollTo("pillars")}
                className="hover:text-primary transition-colors"
              >
                Pillars
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="hover:text-primary transition-colors"
              >
                Engine
              </button>
            </div>
          )}
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <button
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors",
                  l.active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {l.icon}
                {l.label}
              </button>
            </Link>
          ))}
          <NavUserArea />
          {isHome && (
            <GlowButton size="sm" onClick={() => scrollTo("download")}>
              Download APK
            </GlowButton>
          )}
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-3">
          <NavUserArea onNavClick={closeMobile} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {isHome && (
              <>
                <button
                  onClick={() => scrollTo("problem")}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                >
                  Vision
                </button>
                <button
                  onClick={() => scrollTo("pillars")}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                >
                  Pillars
                </button>
                <button
                  onClick={() => scrollTo("how-it-works")}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                >
                  Engine
                </button>
                <div className="my-1 border-t border-white/5" />
              </>
            )}
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={closeMobile}>
                <button
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2",
                    l.active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  {l.icon}
                  {l.label}
                </button>
              </Link>
            ))}
            {isHome && (
              <div className="pt-2">
                <GlowButton
                  size="sm"
                  className="w-full"
                  onClick={() => scrollTo("download")}
                >
                  Download APK
                </GlowButton>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
