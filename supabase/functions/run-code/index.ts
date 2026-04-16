const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const SUPPORTED_LANGUAGES = new Set(["python", "javascript"]);
const MAX_CODE_LENGTH = 50_000;
const MAX_TIMEOUT_MS = 30_000;

function errorResponse(message: string, language: string, status = 200) {
  return new Response(
    JSON.stringify({ stdout: "", stderr: message, exitCode: 1, language }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
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
    return errorResponse("Method not allowed", "unknown", 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", "unknown", 400);
  }

  console.log("RUN-CODE incoming body:", JSON.stringify(body));

  const { code, language } = body;

  console.log("RUN-CODE parsed — language:", language, "code length:", code?.length);

  if (!code || typeof code !== "string") {
    return errorResponse("Missing or invalid 'code' field", language || "unknown");
  }

  if (code.length > MAX_CODE_LENGTH) {
    return errorResponse(`Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`, language);
  }

  if (!language || typeof language !== "string" || !SUPPORTED_LANGUAGES.has(language)) {
    return errorResponse(
      `Unsupported language. Supported: ${[...SUPPORTED_LANGUAGES].join(", ")}`,
      language || "unknown"
    );
  }

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.error("LOVABLE_API_KEY not configured");
    return errorResponse("Code execution service is not configured", language);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

  let aiResponse: Response;
  try {
    const aiPayload = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: buildSystemPrompt(language) },
        { role: "user", content: code },
      ],
      temperature: 0,
      max_tokens: 4096,
    };
    console.log("RUN-CODE AI request — model:", aiPayload.model);

    aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify(aiPayload),
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      return errorResponse("Code execution timed out (30s limit)", language);
    }
    console.error("RUN-CODE fetch error:", err);
    return errorResponse("Code execution service is temporarily unavailable", language);
  }
  clearTimeout(timeout);

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("RUN-CODE AI Gateway error:", aiResponse.status, errText);
    return errorResponse("Code execution service is temporarily unavailable. Please try again.", language);
  }

  const result = await aiResponse.json();
  console.log("RUN-CODE AI raw response:", JSON.stringify(result).slice(0, 500));

  const output = result.choices?.[0]?.message?.content ?? "(no output)";

  const isError =
    output.includes("Error:") ||
    output.includes("Traceback") ||
    output.includes("SyntaxError") ||
    output.includes("TypeError") ||
    output.includes("ReferenceError") ||
    output.includes("NameError");

  const finalResponse = {
    stdout: isError ? "" : output,
    stderr: isError ? output : "",
    exitCode: isError ? 1 : 0,
    language,
  };

  console.log("RUN-CODE final response:", JSON.stringify(finalResponse).slice(0, 300));

  return new Response(JSON.stringify(finalResponse), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
