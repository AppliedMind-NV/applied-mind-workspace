import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are an expert programming tutor for AppliedMind, an AI-powered learning platform. Help students understand code, debug issues, and learn programming concepts. Be concise, clear, and educational. Use markdown formatting.`,

  code_explain: `You are an expert programming tutor for AppliedMind. The student has shared code they're working on. Explain the code clearly, covering: what it does, how it works step by step, key concepts and patterns used, and any potential issues. Be encouraging and educational. Use markdown formatting with code references.`,

  code_explain_lines: `You are an expert programming tutor. Go through the provided code LINE BY LINE. For each meaningful line or block, explain what it does in simple terms. Use numbered explanations matching line numbers. Be beginner-friendly. Use markdown formatting with inline code references.`,

  code_fix: `You are an expert programming tutor and debugger. The student has shared code that may have bugs or issues. Analyze the code carefully and suggest fixes. For each issue found: describe the problem, explain why it's wrong, and provide the corrected code. Be encouraging — bugs are learning opportunities! Use markdown with code blocks.`,

  code_improve: `You are a senior software engineer and mentor. The student has shared code they want to improve. Suggest concrete improvements for: readability, performance, best practices, edge case handling, and code organization. Provide improved code snippets. Be constructive and educational. Use markdown formatting.`,

  code_error: `You are a patient programming tutor. The student is encountering an error they don't understand. Explain what the error means in plain English, what typically causes it, and how to fix it. If the student hasn't pasted an error message, analyze their code for likely runtime errors. Use markdown formatting.`,

  code_pseudocode: `You are a helpful coding tutor. The student wants to turn an idea or pseudocode into real working code. Convert their description into clean, well-commented code. Explain each part as you go so they learn, don't just dump code. Use markdown formatting with code blocks.`,

  code_hint: `You are a Socratic coding tutor. The student needs help but wants to learn by thinking through the problem. Give them a helpful HINT or guiding question — NOT the full solution. Ask them what they've tried, suggest what to think about next, or point them toward the right concept. Be encouraging. Use markdown.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { messages, action, noteContent, noteTitle } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.chat;

    const aiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    if (noteContent && noteTitle) {
      aiMessages.push({
        role: "user",
        content: `Here is my code titled "${noteTitle}":\n\n${noteContent}`,
      });
    }

    if (messages && messages.length > 0) {
      aiMessages.push(...messages);
    }

    // Log usage
    try {
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("ai_logs").insert({
        user_id: userId,
        feature: `code-lab-ai:${action || "chat"}`,
      });
    } catch (logErr) {
      console.error("Failed to log AI usage:", logErr);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please check your OpenAI billing." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("OpenAI API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("code-lab-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
