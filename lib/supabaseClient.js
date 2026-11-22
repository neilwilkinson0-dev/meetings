import { createClient } from "@supabase/supabase-js";

// The Supabase project is shared with other apps; this one's tables live in the
// `meetings` schema.
export const DB_SCHEMA = "meetings";

let client = null;

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { db: { schema: DB_SCHEMA } });
  return client;
}
