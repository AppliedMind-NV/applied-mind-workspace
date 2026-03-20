import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are a study assistant for AppliedMind, an AI-powered learning platform. You help students understand, retain, and apply technical knowledge. Be concise, clear, and educational. Use markdown formatting. When given note context, reference it directly.`,

  summarize: `You are a study assistant. Summarize the following note content into clear, concise bullet points that capture the key concepts. Use markdown formatting with headers and bullet points. Focus on what a student needs to remember for exams.`,

  explain: `You are a patient tutor. Explain the concepts in the following note content in a way that's easy to understand. Break down complex ideas, use analogies where helpful, and highlight key takeaways. Use markdown formatting.`,

  simplify: `You are a patient tutor who specializes in making complex topics simple. Take the provided text and rewrite it in the simplest possible terms. Use everyday language, short sentences, and relatable analogies. Avoid jargon unless you define it immediately. Use markdown formatting.`,

  related: `You are a knowledgeable study assistant. Based on the provided note content, suggest 5-8 related concepts, topics, or areas the student should explore next to deepen their understanding. For each suggestion, provide a brief explanation of how it connects to the current material. Use markdown formatting with a numbered list.`,

  explain_code: `You are an expert programming tutor. Explain the provided code block line by line in a way a beginner can understand. Cover what the code does, why it's written that way, any patterns or concepts used, and potential edge cases. Use markdown formatting with code blocks for references.`,

  flashcards: `You are a study tool. Generate flashcards from the following note content. Return ONLY a valid JSON array of objects with "front" and "back" keys. Each flashcard should test one concept. Generate 5-10 flashcards. Example format:
[{"front": "What is X?", "back": "X is..."}]
Do not include any text before or after the JSON array.`,

  practice_json: `You are an exam prep assistant. Generate 5-10 practice questions from the following note content. Return ONLY a valid JSON array of objects with "question" and "answer" keys. Create a mix of short answer and conceptual questions. Example format:
[{"question": "What is X?", "answer": "X is..."}]
Do not include any text before or after the JSON array.`,

  generate_notes: `You are an expert note-taking assistant for technical students. Given raw lecture content, transcript, or document text, transform it into well-structured study notes. Use this TipTap-compatible JSON format:

Return ONLY a valid JSON object with this structure:
{"type":"doc","content":[...nodes]}

Supported node types:
- {"type":"heading","attrs":{"level":1|2|3},"content":[{"type":"text","text":"..."}]}
- {"type":"paragraph","content":[{"type":"text","text":"..."}]} or {"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"..."},{"type":"text","text":"..."}]}
- {"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}]}
- {"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}]}
- {"type":"codeBlock","attrs":{"language":"python"},"content":[{"type":"text","text":"..."}]}
- {"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"..."}]}]}

Guidelines:
- Start with an H1 title summarizing the topic
- Use H2 for major sections, H3 for subsections
- Use bullet lists for key points and definitions
- Use code blocks for any code snippets (with correct language)
- Bold important terms and concepts
- Add a "Key Takeaways" section at the end
- Be thorough but concise — capture everything a student needs to study
  - Do not include any text before or after the JSON object.`,

  code_explain: `You are an expert programming tutor for AppliedMind. The student has shared code they're working on. Explain the code clearly, covering: what it does, how it works step by step, key concepts and patterns used, and any potential issues. Be encouraging and educational. Use markdown formatting with code references.`,

  code_explain_lines: `You are an expert programming tutor. Go through the provided code LINE BY LINE. For each meaningful line or block, explain what it does in simple terms. Use numbered explanations matching line numbers. Be beginner-friendly. Use markdown formatting with inline code references.`,

  code_fix: `You are an expert programming tutor and debugger. The student has shared code that may have bugs or issues. Analyze the code carefully and suggest fixes. For each issue found: describe the problem, explain why it's wrong, and provide the corrected code. Be encouraging — bugs are learning opportunities! Use markdown with code blocks.`,

  code_improve: `You are a senior software engineer and mentor. The student has shared code they want to improve. Suggest concrete improvements for: readability, performance, best practices, edge case handling, and code organization. Provide improved code snippets. Be constructive and educational. Use markdown formatting.`,

  code_error: `You are a patient programming tutor. The student is encountering an error they don't understand. Explain what the error means in plain English, what typically causes it, and how to fix it. If the student hasn't pasted an error message, analyze their code for likely runtime errors. Use markdown formatting.`,

  code_pseudocode: `You are a helpful coding tutor. The student wants to turn an idea or pseudocode into real working code. Convert their description into clean, well-commented code. Explain each part as you go so they learn, don't just dump code. Use markdown formatting with code blocks.`,

  code_hint: `You are a Socratic coding tutor. The student needs help but wants to learn by thinking through the problem. Give them a helpful HINT or guiding question — NOT the full solution. Ask them what they've tried, suggest what to think about next, or point them toward the right concept. Be encouraging. Use markdown.`,
};

const NON_STREAMING_ACTIONS = new Set(["flashcards", "practice_json", "generate_notes"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Authentication guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { messages, action, noteContent, noteTitle, selectedText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.chat;

    // Build messages array
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Inject note context
    if (noteContent && noteTitle) {
      aiMessages.push({
        role: "user",
        content: `Here is my note titled "${noteTitle}":\n\n${noteContent}`,
      });
    }

    // Inject selected text for contextual actions
    if (selectedText) {
      aiMessages.push({
        role: "user",
        content: `The student has selected this specific text:\n\n"${selectedText}"`,
      });
    }

    // Add conversation messages
    if (messages && messages.length > 0) {
      aiMessages.push(...messages);
    }

    // Log usage to ai_logs
    try {
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("ai_logs").insert({
        user_id: userId,
        feature: `note-ai:${action || "chat"}`,
      });
    } catch (logErr) {
      console.error("Failed to log AI usage:", logErr);
    }

    const isNonStreaming = NON_STREAMING_ACTIONS.has(action);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          stream: !isNonStreaming,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isNonStreaming) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || (action === "flashcards" ? "[]" : "{}");
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("note-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
