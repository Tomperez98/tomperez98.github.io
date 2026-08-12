+++
title = "Getting Started with Zola"
description = "A quick tour of the Zola static site generator and why it's worth a look."
date = 2026-02-15

[taxonomies]
tags = ["zola", "rust", "static-sites"]
+++

I recently migrated my site to [Zola](https://www.getzola.org/), a static site generator written in Rust. Here's what stood out.

## Why Zola?

It's a single binary. No dependency hell, no `node_modules`, no waiting for webpack to do its thing. You install it and go.

```bash
brew install zola
zola init my-site
zola serve
```

That's it. Live reload works out of the box.

## Content is just Markdown

Pages live in `content/` as plain Markdown files:

```markdown
+++
title = "Hello, world"
date = 2026-02-15
+++

This is a post.
```

The `+++` block is TOML frontmatter — Zola uses it for metadata, templates, taxonomies, and more. No YAML toggling or JSON quirks.

## Templates with Tera

Zola ships with [Tera](https://keats.github.io/tera/), a Jinja2-inspired template engine. It's familiar if you've used Django, Ansible, or Nunjucks.

```html
<h1>{{ page.title }}</h1>
<div>{{ page.content | safe }}</div>
```

## What I like

- **Fast builds** — even large sites compile in under a second
- **Single binary** — throw it on a server or CI pipeline
- **Sass built in** — compiles `.scss` without external tools
- **Taxonomies** — tags and categories with zero config

If you're considering a static site and don't need a JS framework, Zola is worth an afternoon.
