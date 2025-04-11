import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Ensure you have this type definition

// Ensure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseServiceRoleKey) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

// Create a singleton instance of the service role client
// IMPORTANT: THIS CLIENT BYPASSES RLS. USE WITH CAUTION ON SERVER-SIDE ONLY.
const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl, 
    supabaseServiceRoleKey,
    {
        auth: {
            // Prevent client from trying to use user session
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);

export { supabaseAdmin }; 