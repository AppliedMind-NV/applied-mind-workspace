import { supabase } from "@/integrations/supabase/client";

/**
 * Shared AI request helper used by both Notes AI and Code Lab AI.
 * Ensures identical auth + fetch logic across all AI features.
 */
export async function callAI({
  endpoint,
  body,
}: {
  endpoint: string;
  body: Record<string, unknown>;
}): Promise<Response> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.error("AI auth: no session", error);
    throw new Error("User not authenticated. Please sign in.");
  }

  const token = session.access_token;
  console.log("AI request →", endpoint, "token:", token.slice(0, 20) + "…");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("AI request failed:", res.status, text);
    let errorMsg = `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) errorMsg = parsed.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return res;
}
