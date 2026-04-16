import { Brain } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold font-heading text-foreground">AppliedMind</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AppliedMind. Built for learners, powered by AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
