import { supabase } from "./client.js";

// Fetch paginated leaderboard
export async function getLeaderboard(page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, error } = await supabase
    .from("web-leader")
    .select("*")
    .order("score", { ascending: false })
    .range(start, end);

  if (error) throw new Error(error.message);
  return data;
}

// Fetch top 3 websites only
export async function getTopWebsites() {
  const { data, error } = await supabase
    .from("web-leader")
    .select("*")
    .order("score", { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return data;
}
