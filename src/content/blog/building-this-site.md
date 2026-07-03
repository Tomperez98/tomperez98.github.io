---
title: "How I Built This Site"
description: "A walkthrough of the design and stack behind my personal website — Astro, Tailwind CSS, and a CI/CD pipeline that deploys on every release."
pubDate: "2026-07-01"
---

This site lives at [tomperez98.github.io](https://github.com/Tomperez98/tomperez98.github.io). It's a static personal page with a résumé-like home page and a blog. Here's how it's designed and built.

## Design

The visual language is intentionally restrained. A cool, monochrome palette — steel for primary accents, stone for neutrals — stays out of the way so the typography carries the identity.

The typeface is [Cabinet Grotesk](https://www.fontshare.com/fonts/cabinet-grotesk) via Fontshare. Substantial enough to feel deliberate without being showy. Paired with a system monospace stack for dates and code.

The layout is a single-column centered block, never wider than a comfortable reading measure. Sections on the home page use staggered fade-up animations for a bit of motion without distraction. The blog leans on `@tailwindcss/typography` for prose — it looks good out of the box and doesn't demand micromanagement.

The guiding aesthetic principle: _the website should be the simplest thing that faithfully presents the content._

## The Stack

**[Astro](https://astro.build)** generates static HTML. No client-side framework — every page ships as plain markup. The blog is driven by Astro's [content collections](https://docs.astro.build/en/guides/content-collections/), so posts are just Markdown files in `src/content/blog/`.

**[Tailwind CSS v4](https://tailwindcss.com)** handles styling. The v4 CSS-first config eliminates `tailwind.config.js` — theme tokens live directly in the global stylesheet.

## Where the Résumé Data Comes From

The home page doesn't hardcode anything. On every build, it fetches my CV from a YAML file in a [separate repository](https://github.com/Tomperez98/cv) via GitHub's raw content API, parses it with [Zod](https://zod.dev), and renders the sections. The source of truth lives in one place; the website is just a consumer.

## How It Gets Deployed

Two GitHub Actions workflows:

- **CI** — runs on every push and PR to `main`. Installs dependencies with [Bun](https://bun.sh), builds, and checks formatting with Prettier.

- **CD** — triggers on [GitHub Releases](https://docs.github.com/repositories/releasing-projects-on-github/managing-releases-in-a-repository). Builds the site and deploys to [GitHub Pages](https://pages.github.com).

An RSS feed and sitemap are generated at build time. The entire setup is ~25 source files with zero runtime JavaScript.

## Why This Stack

- **Astro** because it ships zero JS by default and content collections make Markdown feel first-class.
- **Tailwind** because utility classes keep styles co-located with markup.
- **GitHub Pages** because it's free, fast, and the deployment story with Actions is seamless.
- **Bun** because `bun install` is noticeably faster than npm.

No database, no API server, no client-side routing. Just static files served from a CDN.
