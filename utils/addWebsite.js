import { supabase } from "./client.js";

export const addOrUpdateWebsite = async (name, url) => {
  if (!name || !url) return null;

  try {
    const { data, error } = await supabase
      .from("websites")
      .upsert(
        { name, url },
        { onConflict: "url", returning: "representation" }
      ).select();

    if (error) {
      console.error("Supabase upsert error:", error);
      return null;
    }
    return data[0]; 
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};
