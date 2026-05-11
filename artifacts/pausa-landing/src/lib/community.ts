import { supabase, isSupabaseConfigured } from "./supabase";

export type RingTier = 1 | 2 | 3 | 4 | 5;

export const RING_CONFIG: Record<RingTier, {
  name: string; icon: string; color: string; bg: string; border: string;
  tagline: string; milestone: string; howTo: string;
}> = {
  1: {
    name: "Seed",    icon: "🌱", color: "#a3a3a3",
    bg: "rgba(163,163,163,0.10)", border: "rgba(163,163,163,0.25)",
    tagline: "Planted with intent",
    milestone: "Everyone starts here",
    howTo: "Just join — you're already a Seed. Fill your financial profile to grow faster.",
  },
  2: {
    name: "Sprout",  icon: "🌿", color: "#7eb8e0",
    bg: "rgba(126,184,224,0.12)", border: "rgba(126,184,224,0.30)",
    tagline: "Breaking ground",
    milestone: "Complete 1 goal + fill Financial Profile",
    howTo: "Set up your monthly budget in Financial Plan, then complete your first savings goal.",
  },
  3: {
    name: "Sapling", icon: "🌳", color: "#9b7fe8",
    bg: "rgba(155,127,232,0.12)", border: "rgba(155,127,232,0.30)",
    tagline: "Taking root",
    milestone: "Complete 3 savings goals",
    howTo: "Keep building — finish 3 savings goals total. Each goal you complete is tracked automatically.",
  },
  4: {
    name: "Grove",   icon: "🌲", color: "#e07878",
    bg: "rgba(224,120,120,0.12)", border: "rgba(224,120,120,0.30)",
    tagline: "Thriving, sheltering others",
    milestone: "Complete 6 goals + community contribution",
    howTo: "Finish 6 goals AND answer questions or share your story in the community. Help others grow.",
  },
  5: {
    name: "Forest",  icon: "🌲🌲", color: "#00E5CC",
    bg: "rgba(0,229,204,0.12)",  border: "rgba(0,229,204,0.30)",
    tagline: "Full canopy, shaping the landscape",
    milestone: "Founder selection — max 11 spots",
    howTo: "Forest is by invitation from the founding team. It's for the most impactful contributors. Max 11 people ever.",
  },
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
  family_members?: FamilyMember[];
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

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}

export interface FamilyMember {
  relation: "parents" | "spouse" | "children" | "sibling" | "other";
  count: number;
}

export interface CommunityStory {
  id: string;
  user_id: string;
  title: string;
  situation: string;
  challenge: string;
  action: string;
  result: string;
  city?: string;
  income_range?: string;
  ring_tier: RingTier;
  tags: string[];
  upvotes: number;
  is_featured: boolean;
  created_at: string;
  profiles?: Profile;
}

export const POST_TAGS = [
  "first-job", "debt", "investing", "tax", "insurance",
  "home", "retirement", "freelance", "salary", "emergency-fund",
  "women-finance", "nri", "inheritance",
] as const;

export type PostTag = (typeof POST_TAGS)[number];

const SELECT_PROFILE = "id, display_name, avatar_url, ring_tier, ring_name";
const POST_SELECT = `*, profiles(${SELECT_PROFILE})`;

// ── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function upsertProfile(userId: string, displayName: string, avatarUrl?: string | null): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("profiles").upsert(
    { id: userId, display_name: displayName, avatar_url: avatarUrl ?? null, ring_tier: 1, ring_name: "Seed", fincoin_balance: 0 },
    { onConflict: "id", ignoreDuplicates: true }
  ).select().single();
  if (error) console.error("[upsertProfile]", error.message);
  return data;
}

export async function upgradeRingTier(userId: string, newTier: RingTier): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const cfg = RING_CONFIG[newTier];
  await supabase.from("profiles").update({ ring_tier: newTier, ring_name: cfg.name }).eq("id", userId);
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export async function getOnboarding(userId: string): Promise<{ completed: boolean } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.from("user_onboarding").select("completed").eq("user_id", userId).single();
  return data;
}

export async function saveOnboarding(userId: string, data: Record<string, unknown>): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("user_onboarding").upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
}

export async function completeOnboarding(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("user_onboarding").upsert({ user_id: userId, completed: true, completed_at: new Date().toISOString() }, { onConflict: "user_id" });
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function getPosts(tag?: string): Promise<Post[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false });
  if (tag) q = q.contains("tags", [tag]);
  const { data, error } = await q;
  if (error) console.error("[getPosts]", error.message);
  return (data as Post[]) ?? [];
}

export async function getMyPosts(userId: string): Promise<Post[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("posts").select(POST_SELECT).eq("user_id", userId).order("created_at", { ascending: false });
  return (data as Post[]) ?? [];
}

export async function getLikedPosts(userId: string): Promise<Post[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: votes } = await supabase.from("votes").select("target_id").eq("user_id", userId).eq("target_type", "post");
  if (!votes?.length) return [];
  const ids = votes.map((v) => v.target_id);
  const { data } = await supabase.from("posts").select(POST_SELECT).in("id", ids).order("created_at", { ascending: false });
  return (data as Post[]) ?? [];
}

export async function getParticipatedPosts(userId: string): Promise<Post[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: answers } = await supabase.from("answers").select("post_id").eq("user_id", userId);
  if (!answers?.length) return [];
  const ids = [...new Set(answers.map((a) => a.post_id))];
  const { data } = await supabase.from("posts").select(POST_SELECT).in("id", ids).order("created_at", { ascending: false });
  return (data as Post[]) ?? [];
}

export async function getPost(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.from("posts").select(POST_SELECT).eq("id", id).single();
  return data as Post;
}

export async function createPost(
  userId: string, title: string, body: string, tags: string[], familyMembers: FamilyMember[] = []
): Promise<{ data: Post | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: "Supabase not configured." };
  const { data, error } = await supabase.from("posts")
    .insert({ user_id: userId, title, body, tags, upvotes: 0, view_count: 0, family_members: familyMembers })
    .select().single();
  if (error) return { data: null, error: error.message };
  return { data: data as Post, error: null };
}

export async function updatePost(postId: string, userId: string, updates: Partial<Pick<Post, "title" | "body" | "tags">>): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { error: "Supabase not configured." };
  const { error } = await supabase.from("posts").update(updates).eq("id", postId).eq("user_id", userId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deletePost(postId: string, userId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { error: "Supabase not configured." };
  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", userId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function upvotePost(postId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("votes").insert({ user_id: userId, target_id: postId, target_type: "post" });
  if (!error) await supabase.rpc("increment_post_upvotes", { post_id: postId });
}

// ── Answers ───────────────────────────────────────────────────────────────────

export async function getAnswers(postId: string): Promise<Answer[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("answers").select(`*, profiles(${SELECT_PROFILE})`).eq("post_id", postId)
    .order("is_verified", { ascending: false }).order("upvotes", { ascending: false });
  return (data as Answer[]) ?? [];
}

export async function createAnswer(postId: string, userId: string, body: string): Promise<{ data: Answer | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: "Supabase not configured." };
  const { data, error } = await supabase.from("answers").insert({ post_id: postId, user_id: userId, body, upvotes: 0 }).select().single();
  if (error) return { data: null, error: error.message };
  return { data: data as Answer, error: null };
}

export async function upvoteAnswer(answerId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("votes").insert({ user_id: userId, target_id: answerId, target_type: "answer" });
  if (!error) await supabase.rpc("increment_answer_upvotes", { answer_id: answerId });
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(postId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("comments").select(`*, profiles(${SELECT_PROFILE})`).eq("post_id", postId).order("created_at");
  return (data as Comment[]) ?? [];
}

export async function createComment(postId: string, userId: string, body: string): Promise<{ data: Comment | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: "Supabase not configured." };
  const { data, error } = await supabase.from("comments").insert({ post_id: postId, user_id: userId, body }).select(`*, profiles(${SELECT_PROFILE})`).single();
  if (error) return { data: null, error: error.message };
  return { data: data as Comment, error: null };
}

// ── Saved Replies ─────────────────────────────────────────────────────────────

export async function getSavedReplies(userId: string): Promise<(Answer & { saved_note?: string; post_title?: string })[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("saved_replies").select(`note, answers(*, profiles(${SELECT_PROFILE}), posts(id, title))`).eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map((row: any) => ({ ...row.answers, saved_note: row.note, post_title: row.answers?.posts?.title }));
}

export async function saveReply(userId: string, answerId: string, note?: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { error: "Supabase not configured." };
  const { error } = await supabase.from("saved_replies").upsert({ user_id: userId, answer_id: answerId, note: note ?? null }, { onConflict: "user_id,answer_id" });
  return { error: error?.message ?? null };
}

export async function unsaveReply(userId: string, answerId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("saved_replies").delete().eq("user_id", userId).eq("answer_id", answerId);
}

export async function isReplySaved(userId: string, answerId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { count } = await supabase.from("saved_replies").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("answer_id", answerId);
  return (count ?? 0) > 0;
}

// ── Community Stories ─────────────────────────────────────────────────────────

export async function getStories(): Promise<CommunityStory[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase.from("community_stories").select(`*, profiles(${SELECT_PROFILE})`).order("upvotes", { ascending: false }).limit(20);
  return (data as CommunityStory[]) ?? [];
}

export async function createStory(userId: string, story: Omit<CommunityStory, "id" | "user_id" | "upvotes" | "is_featured" | "created_at" | "profiles">): Promise<{ data: CommunityStory | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: "Supabase not configured." };
  const { data, error } = await supabase.from("community_stories").insert({ user_id: userId, ...story, upvotes: 0 }).select().single();
  if (error) return { data: null, error: error.message };
  return { data: data as CommunityStory, error: null };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

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
