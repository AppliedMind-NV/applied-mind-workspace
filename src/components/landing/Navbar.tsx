import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-heading text-foreground">AppliedMind</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Students</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button variant="hero" size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
