import { supabase } from "./client.js";

// Utility: normalize URL before saving
function normalizeUrl(inputUrl) {
  try {
    let url = inputUrl.trim();

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const parsed = new URL(url);

    let hostname = parsed.hostname.replace(/^www\./, "");

    const normalized = `${parsed.protocol}//${hostname}`;

    return normalized.toLowerCase();
  } catch (err) {
    console.error("Invalid URL:", inputUrl);
    return null;
  }
}

// Main function
export const addOrUpdateWebsite = async (name, url, score) => {
  if (!name || !url) return { msg: "Missing name or url" };

  const cleanUrl = normalizeUrl(url);
  if (!cleanUrl) return { msg: "Invalid URL" };

  try {
    const { data, error } = await supabase
      .from("web-leader")
      .upsert(
        { name, url: cleanUrl, score },
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
