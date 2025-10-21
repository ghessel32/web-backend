import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;


export const supabase = createClient(supabaseUrl, supabaseKey);