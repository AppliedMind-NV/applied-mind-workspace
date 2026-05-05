import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="glass-card p-12 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-60" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
              Ready to Transform How You Study?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Join thousands of students who are studying smarter, retaining more, and stressing less with AppliedMind.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="xl" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
