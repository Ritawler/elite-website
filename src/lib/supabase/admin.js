// Service-role client — bypasses RLS entirely. Server-only, never import
// this from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY with a
// NEXT_PUBLIC_ prefix. Used only for confirming payments (see lib/payments.js),
// where the caller (UPayments' webhook, or our own post-checkout verification)
// has no logged-in user session to rely on for normal RLS-scoped access.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
