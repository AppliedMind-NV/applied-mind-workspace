---
name: Premium Dark Berry-Magenta Theme (Lumina Style)
description: Dark UI with berry-magenta primary (330° 65%), lavender/rose/plum accents, glass-morphism, gradient-mesh backgrounds, Plus Jakarta Sans headings
type: design
---

## Color System
- Primary accent: Berry-magenta (330 65% 55%)
- Background: Deep slate (240 15% 6%)
- Cards: Slightly lighter slate (240 12% 9%) with glass blur
- Extended palette: lavender (270 40% 70%), rose (340 60% 65%), plum (280 35% 35%), cool-blue (220 60% 60%)
- Surface glass: 240 12% 12%
- Glow: primary (330 65% 55%) + secondary (270 40% 50%)

## Typography
- Headings: Plus Jakarta Sans (font-heading)
- Body: Inter (font-sans)
- Prose: Source Serif 4
- Code: JetBrains Mono

## Effects & Utilities
- `.glass`: backdrop-blur-xl + translucent bg + border
- `.glass-card`: backdrop-blur-lg + rounded-2xl
- `.glow-primary`: large box-shadow glow
- `.glow-sm`: subtle box-shadow glow
- `.gradient-primary`: primary→secondary gradient bg
- `.gradient-text`: primary→lavender gradient text
- `.gradient-mesh`: multi-radial ambient bg
- `.text-gradient-hero`: white→primary→lavender hero text
- `.glow-border`: gradient pseudo-element border
- `.btn-glow`: box-shadow on buttons

## Button Variants
- `hero`: gradient-primary + glow + bold
- `pill`: rounded-full secondary
- `glass`: glass bg
- Sizes: default, sm, lg, xl

## Design Direction
- Dark-first, premium, slightly feminine, student-friendly
- Layered depth with glass, mesh gradients, pulse-glow animations
- Clean sans-serif, strong hierarchy, academic feel
- Rounded corners (0.75rem base, up to 1.5rem)

## Landing Page
- Componentized: Navbar, HeroSection, FeaturesSection, HowItWorksSection, TestimonialsSection, CTASection, Footer
- Fixed glass navbar, full-height hero, mesh gradient backgrounds
