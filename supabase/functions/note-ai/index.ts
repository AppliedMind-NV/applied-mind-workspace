import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are a study assistant for AppliedMind, an AI-powered learning platform. You help students understand, retain, and apply technical knowledge. Be concise, clear, and educational. Use markdown formatting. When given note context, reference it directly.`,

  summarize: `You are a study assistant. Summarize the following note content into clear, concise bullet points that capture the key concepts. Use markdown formatting with headers and bullet points. Focus on what a student needs to remember for exams.`,

  explain: `You are a patient tutor. Explain the concepts in the following note content in a way that's easy to understand. Break down complex ideas, use analogies where helpful, and highlight key takeaways. Use markdown formatting.`,

  flashcards: `You are a study tool. Generate flashcards from the following note content. Return ONLY a valid JSON array of objects with "front" and "back" keys. Each flashcard should test one concept. Generate 5-10 flashcards. Example format:
[{"front": "What is X?", "back": "X is..."}]
Do not include any text before or after the JSON array.`,

  practice: `You are an exam prep assistant. Generate practice questions from the following note content. Create a mix of short answer and conceptual questions. For each question, provide the answer. Use markdown formatting with numbered questions and clearly labeled answers.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, action, noteContent, noteTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.chat;

    // Build messages array
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // If there's note context, inject it
    if (noteContent && noteTitle) {
      aiMessages.push({
        role: "user",
        content: `Here is my note titled "${noteTitle}":\n\n${noteContent}`,
      });
    }

    // Add conversation messages
    if (messages && messages.length > 0) {
      aiMessages.push(...messages);
    }

    const isFlashcards = action === "flashcards";

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
          stream: !isFlashcards,
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

    if (isFlashcards) {
      // Non-streaming: return full response for JSON parsing
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
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
