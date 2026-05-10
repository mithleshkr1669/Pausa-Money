import { supabase, isSupabaseConfigured } from "./supabase";

export type RingTier = 1 | 2 | 3 | 4 | 5;

export const RING_CONFIG: Record<RingTier, { name: string; icon: string; color: string; bg: string; border: string }> = {
  1: { name: "Seed",      icon: "🌱", color: "#a3a3a3", bg: "rgba(163,163,163,0.10)", border: "rgba(163,163,163,0.25)" },
  2: { name: "Companion", icon: "🤝", color: "#7eb8e0", bg: "rgba(126,184,224,0.12)", border: "rgba(126,184,224,0.30)" },
  3: { name: "Guardian",  icon: "🛡️", color: "#9b7fe8", bg: "rgba(155,127,232,0.12)", border: "rgba(155,127,232,0.30)" },
  4: { name: "Director",  icon: "🎭", color: "#e07878", bg: "rgba(224,120,120,0.12)", border: "rgba(224,120,120,0.30)" },
  5: { name: "Founder",   icon: "👑", color: "#00E5CC", bg: "rgba(0,229,204,0.12)",  border: "rgba(0,229,204,0.30)"  },
};

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  ring_tier: RingTier;
  ring_name: string;
  fincoin_balance: number;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tags: string[];
  upvotes: number;
  view_count: number;
  is_answered: boolean;
  created_at: string;
  profiles?: Profile;
  answer_count?: number;
}

export interface Answer {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  upvotes: number;
  is_ai: boolean;
  is_verified: boolean;
  created_at: string;
  profiles?: Profile;
}

export const POST_TAGS = [
  "first-job", "debt", "investing", "tax", "insurance",
  "home", "retirement", "freelance", "salary", "emergency-fund",
  "women-finance", "nri", "inheritance",
] as const;

export type PostTag = (typeof POST_TAGS)[number];

// ── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function upsertProfile(
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
      avatar_url: avatarUrl ?? null,
      ring_tier: 1,
      ring_name: "Seed",
      fincoin_balance: 0,
    },
    { onConflict: "id", ignoreDuplicates: true }
  ).select().single();
  if (error) console.error("[upsertProfile]", error.message);
  return data;
}

export async function upgradeRingTier(userId: string, newTier: RingTier): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const cfg = RING_CONFIG[newTier];
  await supabase.from("profiles")
    .update({ ring_tier: newTier, ring_name: cfg.name })
    .eq("id", userId);
}

// ── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(tag?: string): Promise<Post[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase
    .from("posts")
    .select("*, profiles(id, display_name, avatar_url, ring_tier, ring_name)")
    .order("created_at", { ascending: false });
  if (tag) q = q.contains("tags", [tag]);
  const { data, error } = await q;
  if (error) console.error("[getPosts]", error.message);
  return (data as Post[]) ?? [];
}

export async function getPost(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(id, display_name, avatar_url, ring_tier, ring_name)")
    .eq("id", id)
    .single();
  if (error) console.error("[getPost]", error.message);
  return data as Post;
}

export async function createPost(
  userId: string,
  title: string,
  body: string,
  tags: string[]
): Promise<{ data: Post | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: "Supabase not configured. Add keys to .env file." };
  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: userId, title, body, tags, upvotes: 0, view_count: 0 })
    .select()
    .single();
  if (error) {
    console.error("[createPost]", error.message, error.details, error.hint);
    return { data: null, error: error.message };
  }
  // Award fincoin for posting
  await supabase.from("fincoin_ledger").insert({ user_id: userId, amount: 10, reason: "community_post" });
  return { data: data as Post, error: null };
}

export async function upvotePost(postId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("votes").insert({ user_id: userId, target_id: postId, target_type: "post" });
  if (!error) await supabase.rpc("increment_post_upvotes", { post_id: postId });
}

// ── Answers ──────────────────────────────────────────────────────────────────

export async function getAnswers(postId: string): Promise<Answer[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("answers")
    .select("*, profiles(id, display_name, avatar_url, ring_tier, ring_name)")
    .eq("post_id", postId)
    .order("is_verified", { ascending: false })
    .order("upvotes", { ascending: false });
  if (error) console.error("[getAnswers]", error.message);
  return (data as Answer[]) ?? [];
}

export async function createAnswer(postId: string, userId: string, body: string): Promise<{ data: Answer | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: "Supabase not configured." };
  const { data, error } = await supabase
    .from("answers")
    .insert({ post_id: postId, user_id: userId, body, upvotes: 0 })
    .select()
    .single();
  if (error) { console.error("[createAnswer]", error.message); return { data: null, error: error.message }; }
  return { data: data as Answer, error: null };
}

export async function upvoteAnswer(answerId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("votes").insert({ user_id: userId, target_id: answerId, target_type: "answer" });
  if (!error) await supabase.rpc("increment_answer_upvotes", { answer_id: answerId });
}

// ── Stats (for milestone checks) ─────────────────────────────────────────────

export async function getUserPostCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { count } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", userId);
  return count ?? 0;
}

export async function getUserUpvotesReceived(userId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { data } = await supabase.from("answers").select("upvotes").eq("user_id", userId);
  return (data ?? []).reduce((sum, a) => sum + (a.upvotes ?? 0), 0);
}
