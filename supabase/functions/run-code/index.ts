import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Piston API — free, no key required, fully sandboxed
const PISTON_API = "https://emkc.org/api/v2/piston/execute";

// Language → Piston runtime mapping
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
};

const MAX_CODE_LENGTH = 50_000; // 50KB
const MAX_TIMEOUT_MS = 10_000; // 10s execution limit

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    if (!language || typeof language !== "string" || !LANGUAGE_MAP[language]) {
      return new Response(
        JSON.stringify({ error: `Unsupported language. Supported: ${Object.keys(LANGUAGE_MAP).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const runtime = LANGUAGE_MAP[language];

    // Call Piston API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

    let pistonResponse: Response;
    try {
      pistonResponse = await fetch(PISTON_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ name: `main.${language === "python" ? "py" : "js"}`, content: code }],
          run_timeout: 5000, // 5s execution time limit on Piston side
          compile_memory_limit: 256_000_000, // 256MB
          run_memory_limit: 256_000_000,
        }),
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Code execution timed out (10s limit)" }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }
    clearTimeout(timeout);

    if (!pistonResponse.ok) {
      const errText = await pistonResponse.text();
      console.error("Piston API error:", pistonResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Code execution service is temporarily unavailable. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await pistonResponse.json();

    // Format response
    const stdout = result.run?.stdout || "";
    const stderr = result.run?.stderr || "";
    const exitCode = result.run?.code ?? null;
    const compileError = result.compile?.stderr || "";

    return new Response(
      JSON.stringify({
        stdout,
        stderr: compileError || stderr,
        exitCode,
        language: runtime.language,
        version: runtime.version,
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
