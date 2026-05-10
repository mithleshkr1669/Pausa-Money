import { supabase, isSupabaseConfigured } from "./supabase";

export type RingTier = 1 | 2 | 3 | 4 | 5;

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
  "first-job",
  "debt",
  "investing",
  "tax",
  "insurance",
  "home",
  "retirement",
  "freelance",
  "salary",
  "emergency-fund",
  "women-finance",
  "nri",
  "inheritance",
] as const;

export type PostTag = (typeof POST_TAGS)[number];

// --- Profiles ---

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function upsertProfile(
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
      avatar_url: avatarUrl ?? null,
      ring_tier: 1,
      ring_name: "Beej",
      fincoin_balance: 0,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
}

// --- Posts ---

export async function getPosts(tag?: string): Promise<Post[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase
    .from("posts")
    .select(
      "*, profiles(id, display_name, avatar_url, ring_tier, ring_name, fincoin_balance)"
    )
    .order("created_at", { ascending: false });
  if (tag) q = q.contains("tags", [tag]);
  const { data } = await q;
  return (data as Post[]) ?? [];
}

export async function getPost(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("posts")
    .select(
      "*, profiles(id, display_name, avatar_url, ring_tier, ring_name, fincoin_balance)"
    )
    .eq("id", id)
    .single();
  return data as Post;
}

export async function createPost(
  userId: string,
  title: string,
  body: string,
  tags: string[]
): Promise<Post | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("posts")
    .insert({ user_id: userId, title, body, tags, upvotes: 0, view_count: 0 })
    .select()
    .single();
  return data as Post;
}

export async function upvotePost(
  postId: string,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from("votes")
    .insert({ user_id: userId, target_id: postId, target_type: "post" });
  if (!error) {
    await supabase.rpc("increment_post_upvotes", { post_id: postId });
  }
}

// --- Answers ---

export async function getAnswers(postId: string): Promise<Answer[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("answers")
    .select(
      "*, profiles(id, display_name, avatar_url, ring_tier, ring_name, fincoin_balance)"
    )
    .eq("post_id", postId)
    .order("is_verified", { ascending: false })
    .order("upvotes", { ascending: false });
  return (data as Answer[]) ?? [];
}

export async function createAnswer(
  postId: string,
  userId: string,
  body: string
): Promise<Answer | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("answers")
    .insert({ post_id: postId, user_id: userId, body, upvotes: 0 })
    .select()
    .single();
  return data as Answer;
}

export async function upvoteAnswer(
  answerId: string,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from("votes")
    .insert({ user_id: userId, target_id: answerId, target_type: "answer" });
  if (!error) {
    await supabase.rpc("increment_answer_upvotes", { answer_id: answerId });
  }
}
