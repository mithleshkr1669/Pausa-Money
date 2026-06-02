import { useState } from "react";
import { Link } from "wouter";
import { Menu, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RING_CONFIG, type RingTier } from "@/lib/community";
import type { Profile } from "@/lib/community";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  dividerAbove?: boolean;
  href?: string;
}

interface AppShellProps {
  navItems: NavItem[];
  activeItem: string;
  onNavSelect: (id: string) => void;
  profile?: Profile | null;
  sectionTitle?: string;
  topBar?: React.ReactNode;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  navItems,
  activeItem,
  onNavSelect,
  profile,
  sectionTitle,
  topBar,
  actionButton,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const ringTier = (profile?.ring_tier ?? 1) as RingTier;
  const ring = RING_CONFIG[ringTier];

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5 shrink-0">
        <Link href="/" onClick={onClose}>
          <div className="flex items-center gap-2.5 cursor-pointer">
            <img
              src="/image.png"
              alt="Pausa logo"
              className="h-8 w-8 md:h-10 md:w-10 object-contain rounded-lg"
            />

            <span className="font-display font-bold text-lg tracking-tight">
              Pausa
            </span>
          </div>
        </Link>
      </div>

      {/* User ring chip */}
      {profile && (
        <div className="px-3 py-3 border-b border-white/5 shrink-0">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ background: ring.bg, border: `1px solid ${ring.border}` }}
          >
            <span className="text-base leading-none">{ring.icon}</span>
            <div className="min-w-0">
              <p
                className="text-xs font-semibold font-display leading-none mb-0.5"
                style={{ color: ring.color }}
              >
                {ring.name}
              </p>
              <p className="text-[11px] text-white/40 truncate leading-none">
                {profile.display_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      {actionButton && <div className="px-3 pt-3 shrink-0">{actionButton}</div>}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <div key={item.id}>
            {item.dividerAbove && (
              <div className="my-2 border-t border-white/5 mx-2" />
            )}
            <button
              onClick={() => {
                onNavSelect(item.id);
                if (item.href) window.location.href = item.href;
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeItem === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          </div>
        ))}
      </nav>

      {/* Bottom - section links */}
      <div className="px-3 py-3 border-t border-white/5 shrink-0 space-y-0.5">
        {[
          { href: "/dashboard", label: "Dashboard", icon: "📊" },
          { href: "/community", label: "Community", icon: "🌱" },
          // { href: "/advisor", label: "AI Advisor", icon: "🤖" },
        ].map((l) => (
          <Link key={l.href} href={l.href} onClick={onClose}>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <span>{l.icon}</span>
              {l.label}
            </button>
          </Link>
        ))}
        {/* <Link href="/" onClick={onClose} >
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-1">
            ← Landing page
          </button>
        </Link> */}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/5 bg-background/80 backdrop-blur-sm">
        <Sidebar />
      </aside>

      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-56 bg-card border-r border-white/10 md:hidden flex flex-col"
          >
            <Sidebar onClose={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0 bg-background/90">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {sectionTitle && (
            <span className="text-sm font-display font-bold">
              {sectionTitle}
            </span>
          )}
          {profile && <span className="ml-auto text-lg">{ring.icon}</span>}
        </div>

        {/* Optional top bar (e.g. goals row) */}
        {topBar && (
          <div className="border-b border-white/5 shrink-0 bg-background/60">
            {topBar}
          </div>
        )}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
