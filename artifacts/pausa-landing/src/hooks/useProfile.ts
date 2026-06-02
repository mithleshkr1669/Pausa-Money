// hooks/useProfile.ts
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { getProfile, upsertProfile, type Profile } from "@/lib/community";
import { isClerkConfigured } from "@/lib/clerk-config";

export function useProfile() {
  const clerk = isClerkConfigured ? useUser() : { user: null };
  const user = clerk.user;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upsert + Get latest profile
      await upsertProfile(
        user.id,
        user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User",
        user.imageUrl ?? undefined
      );

      const latestProfile = await getProfile(user.id);
      setProfile(latestProfile);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
  };
}