import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Language config
const SUPPORTED_LANGUAGES = new Set(["python", "javascript"]);

const MAX_CODE_LENGTH = 50_000; // 50KB
const MAX_TIMEOUT_MS = 30_000; // 30s for AI response

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function buildSystemPrompt(language: string): string {
  return `You are a code execution engine. You must execute the provided ${language} code mentally and return ONLY the exact output that would appear in the terminal/console.

RULES:
- Return ONLY the raw program output (stdout), nothing else
- If the code has errors, return the error message exactly as the ${language} interpreter/runtime would show it
- Do NOT add explanations, comments, markdown formatting, or code blocks
- Do NOT wrap output in backticks or quotes
- If the code produces no output, return exactly: (no output)
- For print/console.log statements, return each output on its own line
- Simulate the code execution accurately — compute actual values, don't approximate
- If the code has an infinite loop, return: RuntimeError: maximum recursion depth exceeded (or equivalent)
- Handle imports/requires as if standard libraries are available
- Be precise with numbers, string formatting, and whitespace`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before running again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const { code, language } = body;

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'code' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!language || typeof language !== "string" || !SUPPORTED_LANGUAGES.has(language)) {
      return new Response(
        JSON.stringify({ error: `Unsupported language. Supported: ${[...SUPPORTED_LANGUAGES].join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Code execution service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call AI Gateway with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

    let aiResponse: Response;
    try {
      aiResponse = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: buildSystemPrompt(language) },
            { role: "user", content: code },
          ],
          temperature: 0,
          max_tokens: 4096,
        }),
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Code execution timed out (30s limit)" }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }
    clearTimeout(timeout);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Code execution service is temporarily unavailable. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await aiResponse.json();
    const output = result.choices?.[0]?.message?.content ?? "(no output)";

    // Check if the AI detected an error in the code
    const isError = output.includes("Error:") || output.includes("Traceback") || 
                    output.includes("SyntaxError") || output.includes("TypeError") ||
                    output.includes("ReferenceError") || output.includes("NameError");

    return new Response(
      JSON.stringify({
        stdout: isError ? "" : output,
        stderr: isError ? output : "",
        exitCode: isError ? 1 : 0,
        language,
        version: language === "python" ? "3.12 (AI)" : "ES2024 (AI)",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("run-code error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
