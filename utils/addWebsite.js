import { supabase } from "./client.js";

export const addOrUpdateWebsite = async (name, url) => {
  if (!name || !url) return null;

  try {
    const { data, error } = await supabase
      .from("websites")
      .upsert(
        { name, url },
        { onConflict: "url", returning: "representation" }
      );

    if (error) {
      console.error("Supabase upsert error:", error);
      return null;
    }
    console.log(data);

    return data[0]; // return the inserted/updated row
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};
