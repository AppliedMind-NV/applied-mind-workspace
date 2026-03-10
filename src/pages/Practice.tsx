import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useState } from "react";

const mockQuestions = [
  {
    id: "1",
    question: "Implement a function to find the longest palindromic substring in a given string.",
    type: "coding",
    topic: "Dynamic Programming",
    answer: "Use expand-around-center approach: for each index, expand outward while characters match. Track the longest found. Time: O(n²), Space: O(1).",
  },
  {
    id: "2",
    question: "Explain the difference between processes and threads in an operating system.",
    type: "concept",
    topic: "Operating Systems",
    answer: "A process is an independent program with its own memory space. A thread is a lightweight unit of execution within a process that shares the process's memory. Threads are cheaper to create and context-switch than processes.",
  },
  {
    id: "3",
    question: "What happens when you type a URL in a browser and press Enter?",
    type: "concept",
    topic: "Networking",
    answer: "DNS resolution → TCP connection (3-way handshake) → TLS handshake (if HTTPS) → HTTP request → Server processes request → HTTP response → Browser renders HTML, fetches assets, executes JS.",
  },
];

export default function Practice() {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  const toggleAnswer = (id: string) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Practice Questions</h1>
        <p className="text-sm text-muted-foreground">
          Test your understanding with concept and coding challenges.
        </p>
      </div>

      <div className="space-y-3">
        {mockQuestions.map((q) => (
          <div key={q.id} className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                  q.type === "coding" ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground"
                }`}>
                  {q.type}
                </span>
                <span className="text-[10px] text-muted-foreground">{q.topic}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">{q.question}</p>
            </div>

            <div className="border-t">
              <button
                onClick={() => toggleAnswer(q.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb size={12} />
                  {revealedAnswers.has(q.id) ? "Hide answer" : "Reveal answer"}
                </span>
                {revealedAnswers.has(q.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {revealedAnswers.has(q.id) && (
                <div className="px-4 pb-4">
                  <p className="text-sm font-serif leading-relaxed text-foreground/90">{q.answer}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
