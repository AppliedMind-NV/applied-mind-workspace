import { Brain, FileText, Layers, Lightbulb, Repeat, Sparkles } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Notes",
    description: "Create rich notes with code blocks, formatting, and AI-powered enhancements. Organize by subject, class, or project.",
  },
  {
    icon: Sparkles,
    title: "AI Flashcard Generation",
    description: "Instantly turn your notes into study-ready flashcards. Focus on what matters with intelligent question extraction.",
  },
  {
    icon: Lightbulb,
    title: "Practice Questions",
    description: "Generate practice exams from your materials. Test your understanding with AI-crafted questions tailored to your content.",
  },
  {
    icon: Brain,
    title: "AI Study Coach",
    description: "Get contextual help, explanations, and concept breakdowns. Your AI partner understands your notes and learning goals.",
  },
  {
    icon: Repeat,
    title: "Spaced Repetition",
    description: "Never forget what you learned. Our retention engine schedules reviews at optimal intervals for long-term memory.",
  },
  {
    icon: Layers,
    title: "Study Plans",
    description: "Daily study plans, streak tracking, and progress insights help you stay consistent and build strong study habits.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-4">
            <span className="text-xs font-medium text-primary">Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
            Everything You Need to <span className="gradient-text">Ace Your Studies</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built for the way students actually learn. Powered by AI, designed for results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-heading text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
