import { useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LogOut,
  Mail,
  User,
  Shield,
  Calendar,
  Loader2,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/Appshell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { isClerkConfigured } from "@/lib/clerk-config";
import {
  BarChart3,
  Target,
  TrendingUp,
  Sprout,
  Users,
  Bot,
} from "lucide-react";

// ── Avatar, InfoRow, DangerButton (keep as they are) ────────────────────────
// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  imageUrl,
  fullName,
  size = 80,
}: {
  imageUrl?: string | null;
  fullName?: string | null;
  size?: number;
}) {
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={fullName ?? "Profile"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-primary/30"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center font-display font-bold text-primary"
    >
      {initials}
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-mono">
          {label}
        </p>
        <p className="text-sm text-foreground font-medium truncate mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Danger Button ─────────────────────────────────────────────────────────────
function DangerButton({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-red-400 text-sm font-medium disabled:opacity-50"
    >
      <span className="flex items-center gap-3">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        {children}
      </span>
      {!loading && <ChevronRight className="w-4 h-4 opacity-40" />}
    </button>
  );
}

// ── Profile Content Only ─────────────────────────────────────────────────────
function ProfileContent({
  user,
  onSignOut,
}: {
  user: any;
  onSignOut: () => void;
}) {
  const { openUserProfile } = useClerk();
  const [loggingOut, setLoggingOut] = useState(false);

  const joinedDate = user?.createdAt
    ? new Date(user?.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="p-6 max-w-lg mx-auto space-y-5">
      {/* Avatar + Name card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 flex flex-col items-center text-center"
      >
        <div className="relative mb-4">
          <Avatar
            imageUrl={user?.imageUrl}
            fullName={user?.fullName}
            size={80}
          />
          <button
            onClick={() => openUserProfile()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-[#0A0A0C] flex items-center justify-center hover:bg-primary/90 transition-colors"
            title="Edit profile"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>

        <h2 className="text-xl font-display font-bold text-foreground">
          {user?.fullName ?? "—"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.primaryEmailAddress?.emailAddress ?? "—"}
        </p>

        <button
          onClick={() => openUserProfile()}
          className="mt-4 text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Pencil className="w-3 h-3" />
          Edit profile
        </button>
      </motion.div>

      {/* Account Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-panel rounded-2xl px-5 py-2"
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-mono pt-3 pb-1">
          Account details
        </p>

        <InfoRow
          icon={<User className="w-4 h-4" />}
          label="Full name"
          value={user?.fullName ?? "—"}
        />
        <InfoRow
          icon={<Mail className="w-4 h-4" />}
          label="Email"
          value={user?.primaryEmailAddress?.emailAddress ?? "—"}
        />
        <InfoRow
          icon={<Shield className="w-4 h-4" />}
          label="Account status"
          value={
            user?.primaryEmailAddress?.verification.status === "verified"
              ? "Verified ✓"
              : "Unverified"
          }
        />
        <InfoRow
          icon={<Calendar className="w-4 h-4" />}
          label="Member since"
          value={joinedDate}
        />
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DangerButton onClick={onSignOut} loading={loggingOut}>
          {loggingOut ? "Signing out…" : "Sign out"}
        </DangerButton>
      </motion.div>

      <p className="text-center text-[11px] text-muted-foreground/40 pb-2">
        Pausa · Your financial growth companion
      </p>
    </div>
  );
}

// ── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage({
  isInsideDashboard = false,
  profile, // optional: if you want to pass dashboard profile
}: {
  isInsideDashboard?: boolean;
  profile?: any;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, navigate] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
    navigate("/");
  };

  const content = <ProfileContent user={user} onSignOut={handleSignOut} />;

  // If used inside Dashboard tab → return only content
  if (isInsideDashboard) {
    return content;
  }

  // Standalone page → full layout with sidebar
  const navItems: NavItem[] = [
    /* your existing navItems */
  ];

  return (
    <ProtectedRoute>
      <AppShell
        navItems={navItems}
        activeItem="profile"
        onNavSelect={() => {}}
        profile={null}
        sectionTitle="Profile"
      >
        {content}
      </AppShell>
    </ProtectedRoute>
  );
}
