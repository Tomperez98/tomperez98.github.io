+++
title = "Why I Stopped Using a Fancy Prompt"
description = "A minimal shell prompt turns out to be better for focus and speed."
date = 2025-12-10

[taxonomies]
tags = ["shell", "minimalism"]
+++

For years I ran a heavily customized prompt. Git branch, Python venv, AWS profile, Kubernetes context, exit code — the whole dashboard. It looked impressive in screenshots.

Then I switched to a prompt that shows **just a `$`** and realized I'd been wrong.

## What the fancy prompt cost

Every time I hit Enter, I'd glance at the status bar that my prompt had become. What branch am I on? Is the cluster still pointing to staging? The prompt was answering questions I hadn't asked yet — and in doing so, it was pulling my attention away from the actual task.

That's the hidden cost: **context switching at the speed of muscle memory**. You don't notice it until it's gone.

## What I use now

```
$
```

That's it. A dollar sign and a space. No colors, no Git integration, no background jobs indicator.

I still get the information I need — I just ask for it explicitly:

```bash
git branch --show-current   # when I need to know
kubectl config current-context   # before I deploy
```

## The unexpected benefit

Without the prompt doing background processing (running `git status` in every directory), the terminal feels faster. More importantly, it's quieter. The blank `$` doesn't compete for attention.

It turns out a prompt is a tool, not a status page. Tools should get out of the way.
