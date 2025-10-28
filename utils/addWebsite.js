import { supabase } from "./client.js";

export const addOrUpdateWebsite = async (name, url, score) => {
  if (!name || !url) return { msg: "Missing name or url" };

  try {
    const { data, error } = await supabase
      .from("web-leader")
      .upsert(
        { name, url, score },
        {
          onConflict: "url",
          returning: "representation",
        }
      )
      .select();

    if (error) {
      console.error("Supabase upsert error:", error);
      return { msg: "Database error" };
    }

    if (data && data.length > 0) {
      const isNew = data[0]?.created_at === data[0]?.updated_at;
      return {
        msg: isNew ? "Website stored" : "Website updated",
      };
    }

    return { msg: "No data returned" };
  } catch (err) {
    console.error("Unexpected error in addOrUpdateWebsite:", err);
    return { msg: "Unexpected error" };
  }
};
