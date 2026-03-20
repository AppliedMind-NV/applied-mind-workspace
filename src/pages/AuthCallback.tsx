import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Handles OAuth callback redirects (e.g. /~oauth, /auth/callback).
 * Waits for the auth session to be established, then redirects to dashboard.
 */
export default function AuthCallback() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    // Once loading is done, redirect based on session state
    if (session) {
      navigate("/", { replace: true });
    } else {
      // If no session after loading completes, something went wrong
      navigate("/auth", { replace: true });
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      </div>
    </div>
  );
}
