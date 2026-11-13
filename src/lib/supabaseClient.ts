import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const supabasePublicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton browser Supabase client using either VITE_SUPABASE_* or
 * NEXT_PUBLIC_SUPABASE_* environment variables. Returns null if unconfigured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabasePublicKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabasePublicKey);
  }

  return browserClient;
}
