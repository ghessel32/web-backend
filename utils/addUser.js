import { log } from "console";
import { supabase } from "./client.js";

export const addOrUpdateUser = async (email, name) => {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      { email, name }, // values to insert
      { onConflict: "email" } // if email exists, replace it
    )
    .select();
  log(data || "no data");

  if (error) {
    console.warn("Supabase warning:", error.message);
    return { success: false, data: null };
  }

  return { success: true, data };
};
