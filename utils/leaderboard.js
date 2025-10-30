import { supabase } from "./client.js";

// Fetch paginated leaderboard
export async function getLeaderboard(page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, error } = await supabase
    .from("web-leader")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data.slice(start, end + 1);
}
