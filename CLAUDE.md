# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Important:** This project lives in a path with spaces on Windows. npm's script runner cannot resolve `node_modules/.bin` correctly. Always use node to invoke binaries directly:

```bash
# Dev server
npm run dev          # wraps: node node_modules/vite/bin/vite.js

# Production build
npm run build        # wraps: node node_modules/vite/bin/vite.js build

# Preview production build
npm run preview      # wraps: node node_modules/vite/bin/vite.js preview

# TypeScript check (no emit)
npm run typecheck    # wraps: node node_modules/typescript/bin/tsc --noEmit
```

If you need to run binaries directly (e.g., in a pipeline), use:
```bash
node node_modules/vite/bin/vite.js build
node node_modules/typescript/bin/tsc --noEmit
```

## Architecture

**Stack:** Vite 7 + React 19 + TypeScript 5.9 + TailwindCSS v4 + Framer Motion + react-router-dom v7

### Routing model
Two parallel rendering patterns share the same section components:
- `/` — `Home.tsx` renders all sections sequentially (full landing page). Navbar links use `/#anchor` scroll navigation.
- `/about`, `/services`, `/careers`, `/contact` — dedicated page components each wrap a `PageHero` + the relevant section(s). When navigating away from `/`, anchor links become full page navigations.

`ScrollToTop` in `App.tsx` resets scroll position on route change. Dark/light state lives in `AppLayout` and is passed as props to `Navbar`; theme class is toggled on `document.documentElement`.

### Styling system
TailwindCSS v4 is configured via the `@tailwindcss/vite` plugin (no `tailwind.config.*` file). All design tokens are defined in two places in `src/index.css`:
- `:root` CSS variables (used directly in component inline styles and CSS utilities)
- `@theme {}` block (exposes tokens as Tailwind utility classes like `bg-violet`, `text-lavender`)

Named CSS utility classes defined in `index.css` (not Tailwind utilities):
- `.glass` — frosted glass card base (light and dark variants)
- `.gradient-mesh` — dark hero/section background
- `.badge-amber` — uppercase amber pill label
- `.gradient-text` — lavender→teal gradient text fill
- `.section-py` — standard vertical section padding

### Glass component usage
`GlassCard` (in `src/components/`) is a thin wrapper that applies `.glass` + optional Framer Motion hover lift. It should only be used on: hero CTA container, testimonial cards, contact form card, and career job listing cards. Service cards use plain `bg-white` cards with a hover border glow — not glass.

### Data layer
All site content lives in `src/data/`:
- `services.ts` — 6 service definitions with icon name (lucide-react), gradient color string, and description
- `testimonials.ts` — 3 testimonials with Unsplash avatar URLs
- `jobs.ts` — static job listings + `bambooHRConfig` object. When `bambooHRConfig.enabled = true` and `embedUrl` is set, `Careers.tsx` renders a BambooHR iframe instead of the static cards.
- `nav.ts` — navbar link definitions

### Dark mode
Theme is toggled by adding/removing the `dark` class on `<html>`. Persisted to `localStorage`. `initTheme()` runs synchronously during `useState` initialization to avoid flash. Tailwind dark mode uses the `dark:` variant prefix against the `html.dark` selector.

### Icons
All icons are from `lucide-react`. Service icon names are stored as strings in `src/data/services.ts` and mapped to components via an `iconMap` object in `Services.tsx`.

### Image placeholders
All images use Unsplash URLs with width and quality parameters. To swap: update the constant at the top of the relevant section file (`HERO_IMAGE` in `Hero.tsx`, `ABOUT_IMAGE` in `About.tsx`, etc.).
