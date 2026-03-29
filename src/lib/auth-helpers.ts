import { supabase } from "@/integrations/supabase/client";

/**
 * Gets the current user's session access token for authenticated API calls.
 * Throws if no session exists.
 */
export async function getSessionToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated. Please sign in.");
  }
  return session.access_token;
}
