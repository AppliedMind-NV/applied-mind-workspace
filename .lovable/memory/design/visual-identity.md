---
name: Premium Dark Pink-Magenta Theme
description: Dark UI foundation with pink-magenta primary (330° 70%), lavender/plum accents, glass cards, glow effects
type: design
---

## Color System
- Primary accent: Pink-magenta (330 70% 56% light / 330 70% 60% dark)
- Background: Deep slate (240 15% 6% dark / 240 10% 96% light)
- Cards: Slightly lighter slate with glass blur effect
- Accents: Lavender/purple tones (270°) for secondary surfaces
- Glow: Primary and secondary (270 50% 65%) for effects

## Effects
- `.glass-card`: backdrop-blur(16px) + translucent bg + border
- `.glow-border`: gradient pseudo-element border glow
- `.gradient-text`: primary→secondary gradient text
- `.btn-glow`: box-shadow glow on primary buttons
- Animations: `float`, `pulse-glow`, enhanced `fade-in`

## Design Direction
- Modern, premium, slightly feminine, student-friendly
- Dark-first but light mode supported
- Layered depth with subtle glows, glass effects, rounded corners (0.75rem)
- Clean sans-serif (Inter), strong hierarchy, no visual clutter
