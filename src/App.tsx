import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Onboarding } from "@/components/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Notes from "@/pages/Notes";
import Flashcards from "@/pages/Flashcards";
import Practice from "@/pages/Practice";
import QuickReview from "@/pages/QuickReview";
import CodeLab from "@/pages/CodeLab";
import Study from "@/pages/Study";
import SettingsPage from "@/pages/Settings";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, onboardingCompleted, completeOnboarding } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  if (!onboardingCompleted) return <Onboarding onComplete={completeOnboarding} />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/quick-review" element={<QuickReview />} />
              <Route path="/code-lab" element={<CodeLab />} />
              <Route path="/study" element={<Study />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
