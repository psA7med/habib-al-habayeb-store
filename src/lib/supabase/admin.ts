import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client initialized with the secret service role key.
 * NEVER import or expose this client to client components or the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Supabase URL or SUPABASE_SECRET_KEY is missing from environment variables."
    )
  }

  return createSupabaseClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
