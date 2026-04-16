import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya M.",
    role: "Pre-Med, UCLA",
    quote: "AppliedMind turned my 300-page biology notes into flashcards in seconds. My GPA went up a full point last semester.",
    avatar: "PM",
  },
  {
    name: "James T.",
    role: "CS Major, Georgia Tech",
    quote: "The AI study coach actually understands my code notes. It's like having a TA available 24/7 who never judges your questions.",
    avatar: "JT",
  },
  {
    name: "Sofia R.",
    role: "Business, NYU",
    quote: "I've tried every study app out there. This is the first one that feels like it was actually built for how I learn.",
    avatar: "SR",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-32 relative">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose/20 bg-rose/5 px-4 py-1.5 mb-4">
            <span className="text-xs font-medium text-rose">Loved by Students</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
            Students Are <span className="gradient-text">Loving It</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
