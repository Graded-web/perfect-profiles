# Shoot — Marketing Website Design

**Date:** 2026-06-21
**Status:** Approved, ready for implementation planning

## Context

"Shoot" (placeholder name, will change later) is a new B2B service that sends photographers on-site to large companies to shoot professional headshots for the entire team in a single day. This spec covers the public marketing website only — no booking/payment backend in this pass.

The visual and motion language is adapted from `~/graded-mockups/4-runway-scroll-v2.html`, one of several mockup directions previously built (with Fable 5) for the Graded platform and already shipped to production there. That direction — pinned/sticky hero, curtain intro, scroll-progress bar, line-by-line headline reveals, grain overlay, blur-on-scroll nav — is reused here, reskinned from Graded's cream/ink/rust palette to a black/white/cobalt palette suited to a corporate photography service.

## Goals

- A clean, professional, premium-feeling 6-page marketing site that sells the "we shoot your whole team in a day" pitch to HR/people-ops buyers at large companies.
- Reuse the proven animation quality and patterns from the graded-mockups, not reinvent them.
- Pure static HTML/CSS/JS, no build step, no backend — fast to ship and easy to host anywhere static (Vercel/Netlify/GitHub Pages).
- Brand name, copy specifics (pricing, real photos, team bios) are intentionally placeholder-quality and easy to swap later.

## Non-goals

- No booking/payment flow, no CMS, no backend of any kind.
- No real photography assets — placeholder/stock imagery only, forced to grayscale via CSS.
- No analytics/tracking integration in this pass.
- Contact form has client-side validation only; it does not submit anywhere yet (a TODO comment marks where to wire up a form backend such as Formspree or Netlify Forms).

## Visual System

- **Palette:** pure black/white base — `--ink: #0A0A0A`, `--paper: #FFFFFF` / `#FAFAFA` for secondary surfaces — plus one accent, cobalt blue `--accent: #2D5BFF`, used sparingly: primary CTA buttons, link hover/focus states, and one or two small accent details (e.g. progress bar, active nav state). No other color anywhere on the site.
- **Typography:**
  - Wordmark/nav/UI: a tight geometric sans-serif (Archivo, weights 500/600/700) in uppercase with slight letter-spacing.
  - Editorial headlines (hero H1s, section headers): serif (Source Serif 4), matching the mockups' editorial feel.
  - Body copy: the same geometric sans-serif at regular weight.
- **Logo:** "SHOOT" wordmark in the geometric sans, no icon. Built as inline SVG/text so it's trivial to swap when the real brand name is finalized.
- **Imagery treatment:** every photo gets `filter: grayscale(1) contrast(1.05)` via a shared CSS class, so placeholder images read as consistently B&W regardless of source color. Fixed aspect-ratio containers prevent layout shift while images load.
- **Placeholder image source:** `picsum.photos` (the same service the graded-mockups used), referenced directly by URL — no licensed photography, no local image assets to source or manage. Each `<img>` uses a fixed seed (`picsum.photos/seed/<name>/<w>/<h>`) so placeholders stay stable across reloads instead of changing randomly.
- **Texture:** subtle fixed-position SVG grain overlay (same technique as the mockups: `feTurbulence` data-URI, low opacity, `mix-blend-mode: multiply`), applied site-wide.

## Motion Language

Adapted from `4-runway-scroll-v2.html`, implemented once in shared `assets/js/main.js` and reused across pages:

- **Curtain intro:** full version (wordmark draw-in + lift) on Home only. Subpages get a lighter variant — just the nav drop-in, no curtain — so repeat visitors aren't slowed down navigating between pages.
- **Scroll-progress bar:** thin fixed bar at the very top of the viewport, fills left-to-right with scroll position, accent-colored. Present on every page.
- **Line-reveal headlines:** hero/section H1s and H2s are split into masked lines that translateY from 110% to 0% on load (hero) or on scroll-into-view (sections), using the mockups' `cubic-bezier(0.22, 1, 0.36, 1)` ease.
- **Scroll-triggered fade-ups:** body content blocks (cards, stat numbers, portfolio tiles) fade/translate in via a single shared `IntersectionObserver`, toggling a `.is-visible` class — no per-section bespoke JS.
- **Pinned hero:** sticky/pinned scroll-driven hero stage (`position: sticky` + tall wrapper, as in the mockup) is Home-only. Subpages use a simpler static hero with the same line-reveal headline but no pinning/scroll-jacking, keeping subpages fast and low-friction for a B2B audience that's there to find information, not be wowed twice.
- **Nav:** fixed position, transparent over the hero, gains a blurred background + bottom border once scrolled (`nav.scrolled` pattern from the mockups).
- **Reduced motion:** every animation is wrapped so `prefers-reduced-motion: reduce` disables transforms/transitions and shows final-state content immediately.
- **No-JS fallback:** all reveal-animated elements have their final visible state as the CSS default; JS only adds the initial hidden state and removes it on trigger. If JS fails to load, content is fully visible and usable — progressive enhancement, not a hard dependency.

## Site Architecture

Static multi-page site, shared assets to avoid duplicating CSS/JS across 7 HTML files (unlike the single-file mockups):

```
~/shoot/
  index.html          (Home)
  services.html
  portfolio.html
  pricing.html
  about.html
  contact.html
  404.html
  assets/
    css/
      base.css        — CSS variables, reset, typography, nav, footer, buttons,
                         grain overlay, shared animation keyframes/utility classes
    js/
      main.js          — curtain intro, scroll-progress bar, reveal-on-scroll
                          observer, nav scroll state, mobile menu toggle
    logo.svg
    favicon.ico
```

Every page `<link>`s `base.css` and `<script>`s `main.js`. Page-specific styles (e.g. the portfolio grid, pricing FAQ accordion) live in a small `<style>` block per page rather than spawning more shared files, since each is only used once.

## Page-by-Page Content Plan

1. **Home** (`index.html`)
   - Curtain intro (wordmark draw-in)
   - Pinned hero: headline "We shoot your whole team's headshots — in a day", subhead, two CTAs (primary: "Get a quote", secondary: "See the work")
   - Trusted-by strip: invented placeholder company names rendered as plain text wordmarks (e.g. "NORTHWIND", "ACME GROUP") — not real companies' actual logos, since none have been signed yet
   - How it works: 3–4 step strip (we come to you → no studio commute → every employee photographed same day → fast turnaround)
   - Dramatized stat band (e.g. "500+ headshots, one day", "48-hour delivery", "Zero office disruption" — placeholder figures, clearly swappable)
   - Portfolio teaser: 6–9 image grid linking to full Portfolio page
   - Differentiator section: consistency across offices/locations
   - CTA band → Contact
   - Footer (shared across all pages)

2. **Services** (`services.html`)
   - Static hero with line-reveal headline: "How a shoot day works"
   - Process timeline: pre-shoot logistics → on-site setup → shoot day flow → retouching/QA → delivery
   - What's included: equipment, backdrop options, retouching, delivered file formats/sizes (LinkedIn, Slack, badge, etc.)
   - Logistics for large orgs: multi-location scheduling, team-size ranges
   - CTA → Contact

3. **Portfolio** (`portfolio.html`)
   - Short intro line
   - Grid of placeholder B&W headshot images (grayscale-filtered picsum.photos), hover reveals a caption (industry, anonymized — no real client names)
   - CTA → Contact

4. **Pricing** (`pricing.html`)
   - Hero: "Simple, scalable pricing for teams of any size"
   - Pricing model explainer: drivers are team size, number of locations, turnaround speed — no fixed self-serve numbers (enterprise B2B norm)
   - What's included checklist
   - Quote-request CTA, linking to the Contact form
   - FAQ accordion (common pricing/logistics questions)

5. **About** (`about.html`)
   - Mission/manifesto blurb: why consistent headshots matter for a large distributed team
   - Stats band (years experience, headshots delivered, companies served — placeholder)
   - Values list
   - CTA → Contact

6. **Contact** (`contact.html`)
   - Hero: "Let's get your team in front of the camera"
   - Quote-request form: company name, work email, team size, number of locations, preferred timeline, message. Client-side validation (required fields, email format) only — `<!-- TODO: wire to form backend (Formspree/Netlify Forms) -->` marks the submit handler.
   - Direct contact info (placeholder email/phone)

7. **404** (`404.html`)
   - Minimal: wordmark, "Page not found", link back home. Same nav/footer shell, no curtain.

## Testing / QA Approach

No automated test framework — this is a static marketing site with no application logic to unit test. QA is a manual pass after build:

- Serve locally (e.g. `npx serve`) and click through every page/link.
- Check responsive layout at mobile (~375px), tablet (~768px), and desktop (~1440px) widths.
- Verify `prefers-reduced-motion` actually disables animations (via browser dev tools emulation).
- Check color contrast of cobalt-on-white and cobalt-on-black meets WCAG AA for text use.
- Confirm content is fully visible/usable with JavaScript disabled.
- Cross-browser spot check in Chrome, Safari, and Firefox.

## Open Items for Later (Out of Scope Now)

- Real brand name, logo, and copy once finalized.
- Real photography to replace grayscale stock placeholders.
- Contact form backend integration.
- Analytics integration.
