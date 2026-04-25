import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ArrowRight, Phone, KeyRound, Sparkles, Brain, BookOpen, Zap } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

type AuthMode = "login" | "signup" | "forgot" | "phone";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate("/dashboard");
  }, [session, navigate]);

  const resetState = () => { setError(""); setMessage(""); };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetState();
    setOtpSent(false);
    setOtp("");
    // Scroll to the auth card so the form is visible after a navbar click
    setTimeout(() => {
      document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetState();
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account.");
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) setError(error.message);
      else setMessage("Check your email for a password reset link.");
    }
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetState();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setError(error.message);
    else { setOtpSent(true); setMessage("OTP sent to your phone."); }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetState();
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    resetState();
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const heroCopy = {
    login: { title: "Welcome back", sub: "Pick up right where you left off." },
    signup: { title: "Start studying smarter", sub: "Your AI study partner, ready in seconds." },
    forgot: { title: "Reset your password", sub: "We'll send you a secure reset link." },
    phone: { title: "Sign in with phone", sub: "We'll text you a one-time code." },
  }[mode];

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onSignIn={() => switchMode("login")}
        onGetStarted={() => switchMode("signup")}
      />

      {/* HERO with auth card */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-lavender/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* LEFT: marketing copy */}
            <div className="space-y-6 text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">AI-Powered Learning Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading leading-[1.1]">
                <span className="text-gradient-hero">{heroCopy.title}</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                {heroCopy.sub} One workspace for notes, flashcards, practice, and code — powered by AI that actually understands what you're studying.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                {[
                  { icon: Brain, label: "AI Study Coach" },
                  { icon: BookOpen, label: "Smart Notes" },
                  { icon: Zap, label: "Instant Flashcards" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="glass-card flex items-center gap-2 px-4 py-2.5">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: auth card (logic unchanged) */}
            <div id="auth-form" className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <Card className="glass-card border-border/30 glow-sm">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-heading">
                    {mode === "login" && "Welcome back"}
                    {mode === "signup" && "Create your account"}
                    {mode === "forgot" && "Reset password"}
                    {mode === "phone" && "Phone sign in"}
                  </CardTitle>
                  <CardDescription>
                    {mode === "login" && "Sign in to continue learning"}
                    {mode === "signup" && "Start your learning journey"}
                    {mode === "forgot" && "We'll send you a reset link"}
                    {mode === "phone" && "Sign in with your phone number"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  {message && (
                    <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary">
                      {message}
                    </div>
                  )}

                  {(mode === "login" || mode === "signup" || mode === "forgot") && (
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" placeholder="you@university.edu" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                      </div>

                      {mode !== "forgot" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">Password</label>
                            {mode === "login" && (
                              <button type="button" onClick={() => switchMode("forgot")} className="text-xs text-primary hover:underline">Forgot password?</button>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                          </div>
                        </div>
                      )}

                      <Button variant="hero" className="w-full gap-2" size="lg" type="submit" disabled={loading}>
                        {loading ? "Loading..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </form>
                  )}

                  {mode === "phone" && !otpSent && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Phone number</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="tel" placeholder="+1 (555) 000-0000" className="pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                        </div>
                      </div>
                      <Button variant="hero" className="w-full gap-2" size="lg" type="submit" disabled={loading}>
                        {loading ? "Loading..." : "Send OTP"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </form>
                  )}

                  {mode === "phone" && otpSent && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Enter OTP</label>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="text" placeholder="123456" className="pl-10" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
                        </div>
                      </div>
                      <Button variant="hero" className="w-full gap-2" size="lg" type="submit" disabled={loading}>
                        {loading ? "Loading..." : "Verify & Sign In"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                      </Button>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); resetState(); }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Change phone number
                      </button>
                    </form>
                  )}

                  {(mode === "login" || mode === "signup") && (
                    <>
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-3 text-muted-foreground">or continue with</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn} disabled={googleLoading}>
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {googleLoading ? "Signing in..." : "Google"}
                      </Button>
                    </>
                  )}

                  <div className="text-center text-sm text-muted-foreground mt-4 space-y-1">
                    {mode === "login" && (
                      <>
                        <p>Don't have an account? <button onClick={() => switchMode("signup")} className="text-primary font-medium hover:underline">Sign up</button></p>
                        <p><button onClick={() => switchMode("phone")} className="text-muted-foreground hover:text-foreground hover:underline text-xs">Sign in with phone</button></p>
                      </>
                    )}
                    {mode === "signup" && (
                      <p>Already have an account? <button onClick={() => switchMode("login")} className="text-primary font-medium hover:underline">Sign in</button></p>
                    )}
                    {(mode === "forgot" || mode === "phone") && (
                      <p><button onClick={() => switchMode("login")} className="text-primary font-medium hover:underline">Back to sign in</button></p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
