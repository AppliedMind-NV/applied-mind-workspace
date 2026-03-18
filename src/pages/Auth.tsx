import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, Mail } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot" | "phone";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate("/");
  }, [session, navigate]);

  const resetState = () => {
    setError("");
    setMessage("");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account.");
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a password reset link.");
    }
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
      setMessage("OTP sent to your phone.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetState();
    setOtpSent(false);
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">AppliedMind</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" && "Create your account"}
            {mode === "login" && "Sign in to your workspace"}
            {mode === "forgot" && "Reset your password"}
            {mode === "phone" && "Sign in with phone"}
          </p>
        </div>

        {/* Auth method toggle */}
        <div className="flex items-center justify-center gap-1 rounded-lg border p-1">
          <button
            onClick={() => switchMode("login")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm transition-colors ${
              mode !== "phone" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Mail size={14} />
            Email
          </button>
          <button
            onClick={() => switchMode("phone")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm transition-colors ${
              mode === "phone" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Phone size={14} />
            Phone
          </button>
        </div>

        {/* Email/Password forms */}
        {mode !== "phone" && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
            {message && <p className="text-xs text-primary">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading
                ? "…"
                : mode === "signup"
                ? "Sign up"
                : mode === "forgot"
                ? "Send reset link"
                : "Sign in"}
            </button>
          </form>
        )}

        {/* Phone OTP form */}
        {mode === "phone" && !otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {message && <p className="text-xs text-primary">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "…" : "Send OTP"}
            </button>
          </form>
        )}

        {mode === "phone" && otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Enter OTP code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-3 py-2 rounded-md border bg-card text-sm text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {message && <p className="text-xs text-primary">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "…" : "Verify & Sign in"}
            </button>

            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(""); resetState(); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Change phone number
            </button>
          </form>
        )}

        {/* Bottom links */}
        {mode !== "phone" && (
          <div className="space-y-2 text-center text-xs text-muted-foreground">
            {mode === "login" && (
              <>
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => switchMode("signup")} className="text-primary hover:underline">
                    Sign up
                  </button>
                </p>
                <p>
                  <button onClick={() => switchMode("forgot")} className="text-primary hover:underline">
                    Forgot password?
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p>
                Already have an account?{" "}
                <button onClick={() => switchMode("login")} className="text-primary hover:underline">
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <p>
                <button onClick={() => switchMode("login")} className="text-primary hover:underline">
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
