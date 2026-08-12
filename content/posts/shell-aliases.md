+++
title = "Three Shell Aliases I Use Every Day"
description = "Small shell shortcuts that save keystrokes and mental bandwidth."
date = 2026-01-28

[taxonomies]
tags = ["shell", "productivity", "tools"]
+++

I spend a lot of time in the terminal. These three aliases have quietly saved me thousands of keystrokes.

## `g` for `git`

Not exactly revolutionary, but this one-line alias is always the first thing in my `.zshrc`:

```bash
alias g='git'
```

What it unlocks:

```
g st       # git status
g co       # git checkout
g diff     # git diff
g push     # git push
```

Git's subcommand design and Zsh's alias expansion do all the heavy lifting.

## `..` and `...`

```bash
alias ..='cd ..'
alias ...='cd ../..'
```

Two characters to go up one level, three to go up two. It's the kind of alias you forget you have until you're on someone else's machine and `..` does nothing.

## `reload`

```bash
alias reload='exec zsh'
```

Restarts the shell in place after editing `.zshrc`. No new tab, no lost context. Combined with `source ~/.zshrc` when you just need config changes, it's a small quality-of-life bump.

## Honorable mention: `ll`

```bash
alias ll='ls -lah'
```

Not original, but it's muscle memory at this point. I can't use a computer without it.

---

The common thread: good aliases aren't about saving time. They're about removing friction between thought and action.
