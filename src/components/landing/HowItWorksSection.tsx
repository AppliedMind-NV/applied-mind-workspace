import { Upload, Sparkles, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload or Create Notes",
    description: "Import your lecture slides, PDFs, or start writing notes from scratch in our rich editor.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "AI Generates Study Tools",
    description: "Our AI reads your notes and creates flashcards, practice questions, and concept summaries automatically.",
  },
  {
    icon: GraduationCap,
    step: "03",
    title: "Study & Retain",
    description: "Review with spaced repetition, take practice quizzes, and track your progress. Actually remember what you learn.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-lavender/20 bg-lavender/5 px-4 py-1.5 mb-4">
            <span className="text-xs font-medium text-lavender">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
            Three Steps to <span className="gradient-text">Better Grades</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.step} className="text-center relative">
              <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-5 flex items-center justify-center glow-sm">
                <step.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-primary mb-2 block">{step.step}</span>
              <h3 className="text-lg font-semibold font-heading text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
