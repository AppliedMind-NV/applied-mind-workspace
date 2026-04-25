import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";

interface NavbarProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

const Navbar = ({ onSignIn, onGetStarted }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base sm:text-lg font-bold font-heading text-foreground truncate">AppliedMind</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Students</a>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {onSignIn ? (
            <Button variant="ghost" size="sm" onClick={onSignIn}>Sign In</Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          )}
          {onGetStarted ? (
            <Button variant="hero" size="sm" className="gap-1.5" onClick={onGetStarted}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Get Started</span>
              <span className="xs:hidden sm:hidden">Start</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Get Started</span>
                <span className="xs:hidden sm:hidden">Start</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
