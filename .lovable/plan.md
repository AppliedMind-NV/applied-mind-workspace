# Auth + Onboarding Visual Overhaul

Bring `/auth`, `/reset-password`, and the Onboarding flow in line with the landing page's berry-magenta aesthetic. Wrap auth pages in the full landing layout (Navbar + marketing sections + Footer) so users land on a familiar marketing-style page with the sign-in card embedded in the hero.

## Files Changed

### 1. `src/components/landing/Navbar.tsx`
Add optional callback props so the navbar can switch the auth form mode instead of routing.

```tsx
interface NavbarProps {
  onSignIn?: () => void;       // if provided, called instead of <Link to="/auth">
  onGetStarted?: () => void;   // if provided, called instead of <Link to="/auth">
}
```

- When `onSignIn` is set, render the "Sign In" button as `<Button onClick={onSignIn}>` (no `<Link>`).
- When `onGetStarted` is set, render the "Get Started" button as `<Button onClick={onGetStarted}>`.
- Default behavior (no props) is unchanged → still links to `/auth`.
- Anchor links (`#features`, `#how-it-works`, `#testimonials`) remain as `<a href>` so they smooth-scroll to sections on the same page.

### 2. `src/pages/Auth.tsx`
Restructure into a full landing-page layout:

```
<div className="min-h-screen bg-background">
  <Navbar onSignIn={() => switchMode("login")} onGetStarted={() => switchMode("signup")} />

  {/* HERO with auth card */}
  <section className="relative pt-32 pb-20 overflow-hidden">
    <div className="absolute inset-0 gradient-mesh" />
    <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
    <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-lavender/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
      {/* LEFT: marketing copy */}
      <div className="space-y-6">
        <Badge>AI-Powered Learning Platform</Badge>
        <h1 className="text-5xl font-bold font-heading gradient-text">
          {mode === "signup" ? "Start your learning journey" : "Welcome back"}
        </h1>
        <p className="text-lg text-muted-foreground">
          One workspace for notes, flashcards, practice, and code — powered by AI that actually understands what you're studying.
        </p>
        {/* feature pills: Brain / BookOpen / Zap */}
      </div>

      {/* RIGHT: existing auth Card (unchanged logic) */}
      <Card className="glass-card border-border/30 glow-sm">
        ...all current form logic unchanged...
      </Card>
    </div>
  </section>

  <FeaturesSection />
  <HowItWorksSection />
  <TestimonialsSection />
  <CTASection />     {/* CTA buttons can also call switchMode("signup") */}
  <Footer />
</div>
```

**Critical: zero changes to auth logic.** All `handleEmailAuth`, `handleSendOtp`, `handleVerifyOtp`, `handleGoogleSignIn`, state machines, and Supabase calls remain byte-identical. Only the wrapping JSX changes.

Also bump ambient orb opacities (`/8` → `/20`, `/6` → `/15`) so the magenta glow is actually visible against the dark background — this addresses the "too dim" feedback from earlier.

### 3. `src/pages/ResetPassword.tsx`
Wrap in the same landing shell (Navbar + Footer + gradient mesh) and replace raw HTML with themed components:

- `<input>` → `<Input>` from `@/components/ui/input`
- `<button>` → `<Button variant="hero">` from `@/components/ui/button`
- Wrap form in `<Card className="glass-card border-border/30 glow-sm">`
- Add gradient mesh background and pulse-glow orbs
- Keep both states (invalid link / valid recovery) — both get the new shell
- Navbar appears with default props (links to `/auth`) since switching modes doesn't apply here

All recovery token detection, `supabase.auth.updateUser`, and redirect logic remain identical.

### 4. `src/components/Onboarding.tsx`
Apply the unified theme:

- Wrap root in `gradient-mesh` background with pulse-glow orbs
- Replace mixed step icon colors (emerald, amber, violet, rose) with unified `gradient-primary` + `text-primary-foreground` for all 5 steps — keeps a clean, branded look matching the landing page
- Wrap card in `glass-card border-border/30 glow-sm`
- Title gets `gradient-text` class
- Buttons → `<Button variant="hero">` for primary actions, `variant="outline"` for Back
- Progress dots use `bg-primary` (already correct)

All step content, navigation logic, and `onComplete` callback remain identical.

## Why This Works

1. **Zero logic risk**: Every change is JSX/CSS-only. Auth state machines, Supabase calls, OTP flow, password recovery detection, and onboarding completion persistence are untouched. If something breaks visually we can revert without touching backend behavior.

2. **Reuses existing primitives**: `gradient-mesh`, `glass-card`, `glow-sm`, `gradient-text`, `pulse-glow`, `Button variant="hero"` are all already defined in `src/index.css` and `src/components/ui/button.tsx`. We're not inventing new tokens.

3. **Matches inspo screenshots**: The user wanted to see Features / How It Works / Students / Get Started / Sign In on the auth page. Embedding the existing landing sections is the simplest way to achieve that without duplicating content — and any future edits to those sections automatically apply to `/auth`.

4. **Sign-in behavior**: The navbar's Sign In / Get Started buttons toggle the auth card mode via `switchMode()` (no route change, no scroll). This is the cleanest UX since the user is already on the auth page.

5. **No memory violations**: Stays within the 'geological' theme primitives already saved in `mem://design/visual-identity`. No new color tokens, no new fonts.

## Files List

- `src/components/landing/Navbar.tsx` — add optional `onSignIn` / `onGetStarted` props
- `src/pages/Auth.tsx` — wrap in landing layout, two-column hero, brighter ambient orbs
- `src/pages/ResetPassword.tsx` — wrap in landing shell, themed Input/Button/Card
- `src/components/Onboarding.tsx` — unified gradient-primary palette, glass-card, hero buttons

No database changes. No routing changes. No auth logic changes.
