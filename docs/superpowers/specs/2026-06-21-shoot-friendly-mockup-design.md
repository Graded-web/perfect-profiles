# Shoot — "Friendly" Alternate Mockup Design

**Date:** 2026-06-21
**Status:** Approved, ready for implementation planning

## Context

The Shoot marketing site (see `2026-06-21-shoot-website-design.md`) was built in a deliberately editorial visual language: serif italic headlines, eyebrow labels, grain texture, curtain intro, pinned/sticky hero, line-by-line headline reveals, forced-grayscale imagery. This spec covers a second, parallel mockup of the same site — same business content and page set — executed in a less editorial, more conventional SaaS/product visual language, so the two can be compared side by side.

## Goals

- A full second 7-page mockup, living alongside the original without modifying it, so both are browsable and comparable.
- Same information architecture and page-by-page content plan as the original (Home, Services, Portfolio, Pricing, About, Contact, 404).
- Visually warmer and calmer: single sans-serif typeface, white background, green accent, full-color imagery, simplified motion — reads like a typical B2B SaaS marketing site (Gusto/Rippling-adjacent) rather than a magazine spread.
- Pure static HTML/CSS/JS, no build step, consistent with the original.

## Non-goals

- No changes to the existing editorial mockup (`~/shoot/*.html`, `~/shoot/assets/`) — it stays as-is for comparison.
- No booking/payment flow, no CMS, no backend, no real photography assets — same constraints as the original spec.
- No analytics/tracking integration.

## Visual System

- **Palette:** white `#FFFFFF` base, off-white `#F7F8F6` for secondary surfaces, warm near-black ink `#1F2A22`, muted `#5C6B60`, one accent — forest green `#2F6F4E` — used for primary buttons, link hover/active states, and active nav state. Same "mostly neutral + one accent" rule as the original, just a warmer palette instead of black/white/cobalt.
- **Typography:** a single sans-serif family throughout, "Plus Jakarta Sans" (weights 400–800, loaded from Google Fonts) for both headlines and body — no serif, no italics anywhere on the site. Headlines are bold/extrabold sans rather than serif-italic. Logo/nav use the same family at regular tracking (no uppercase letter-spacing treatment).
- **Logo:** plain "Shoot" wordmark in sentence case, built as inline text (matching the original's approach of keeping the brand mark trivially swappable).
- **Buttons:** full rounded-pill shape (`border-radius: 999px`), carried over from the original since pill buttons aren't an editorial-specific cue.
- **Cards/surfaces:** step cards, stat blocks, and pricing tiers get a visible 1px border plus a soft drop shadow, giving a "product UI" feel distinct from the original's borderless, whitespace-driven sections.
- **Imagery:** full-color placeholder photography via `picsum.photos` with fixed seeds (no grayscale filter), in fixed-aspect-ratio containers to prevent layout shift.
- **Texture:** none — no grain overlay.

## Motion Language

Implemented in a trimmed `friendly/assets/js/main.js`, reused across all 7 pages:

- **Nav:** fixed position, transparent over the hero, gains a blurred background + bottom border once scrolled — same pattern as the original.
- **Mobile menu toggle:** same slide-in panel pattern as the original.
- **Scroll-triggered fade-ups:** body content blocks (cards, stat numbers, portfolio tiles, headlines) fade + translateY(20px→0) into view via a single shared `IntersectionObserver`, toggling an `.is-visible` class. This replaces the original's curtain intro, pinned/sticky hero, line-by-line headline mask reveal, and scroll-progress bar — all of those are dropped entirely for a calmer, more typical SaaS feel.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables all transforms/transitions and shows final-state content immediately, same as the original.
- **No-JS fallback:** all reveal-animated elements default to their final visible state in CSS; JS only adds the initial hidden state. Content is fully visible and usable without JavaScript.

## Site Architecture

A new top-level `friendly/` directory, mirroring the original's per-page structure, with its own shared assets:

```
~/shoot/
  index.html, services.html, ...        (existing editorial mockup — untouched)
  assets/                                (existing editorial assets — untouched)
  friendly/
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
                           card/shadow utilities, shared fade-up animation
      js/
        main.js          — nav scroll state, mobile menu toggle, fade-up
                            IntersectionObserver
```

Every page in `friendly/` links its own `base.css` and scripts its own `main.js` — nothing is shared with the original mockup's assets, keeping the two visual systems fully independent and avoiding any risk of one mockup's CSS/JS changes affecting the other.

## Page-by-Page Content Plan

Same 7 pages and information architecture as the original spec (`2026-06-21-shoot-website-design.md`, "Page-by-Page Content Plan" section): Home, Services, Portfolio, Pricing, About, Contact, 404 — same sections per page, same claims and facts.

Copy gets a lighter tone pass to match the friendlier voice — shorter sentences, more conversational phrasing — while keeping the same facts and structure. For example, the original hero subhead ("One photographer, one studio setup, your office. Every employee gets a consistent, professional headshot without leaving the building.") becomes something like "A friendly photographer comes to your office with a full setup — no studio booking, no awkward webcam photos, just sixty seconds per person." Headline copy, CTA labels, and section ordering otherwise stay the same as the original plan unless a section specifically calls for tone adjustment (e.g., dropping the original's more literary phrasing like "a camera in the break room" in favor of plainer language).

## Testing / QA Approach

Same manual approach as the original spec — no automated test framework:

- Serve locally (e.g. `npx serve`) and click through every page/link in `friendly/`.
- Check responsive layout at mobile (~375px), tablet (~768px), and desktop (~1440px) widths.
- Verify `prefers-reduced-motion` disables animations (via browser dev tools emulation).
- Check color contrast of green-on-white and green-on-dark meets WCAG AA for text use.
- Confirm content is fully visible/usable with JavaScript disabled.
- Cross-browser spot check in Chrome, Safari, and Firefox.

## Open Items for Later (Out of Scope Now)

- Real brand name, logo, and copy once finalized (same as original).
- Real photography to replace color stock placeholders.
- Contact form backend integration.
- Analytics integration.
- Deciding which of the two mockups (editorial vs. friendly) becomes the production site, if either.
