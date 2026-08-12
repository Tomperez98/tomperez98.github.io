+++
title = "Writing a Small CLI in Rust"
description = "Notes from building a command-line tool with clap and anyhow."
date = 2025-11-02

[taxonomies]
tags = ["rust", "cli", "projects"]
+++

I wrote a small CLI tool last weekend. It does one thing — reads a CSV, filters rows by a predicate, writes the result — but I wrote it in Rust and learned a few things along the way.

## The stack

- **[clap](https://docs.rs/clap/latest/clap/)** for argument parsing
- **[csv](https://docs.rs/csv/latest/csv/)** for reading and writing
- **[anyhow](https://docs.rs/anyhow/latest/anyhow/)** for error handling with context

```rust
use anyhow::{Context, Result};
use clap::Parser;

#[derive(Parser)]
struct Args {
    #[arg(short, long)]
    input: PathBuf,
    #[arg(short, long)]
    output: PathBuf,
    #[arg(long)]
    filter: String,
}

fn main() -> Result<()> {
    let args = Args::parse();
    let mut reader = csv::Reader::from_path(&args.input)
        .with_context(|| format!("failed to open {}", args.input.display()))?;

    // ...
    Ok(())
}
```

## What worked well

**clap's derive API** is surprisingly ergonomic. Define a struct, slap on `#[derive(Parser)]`, and you get help text, validation, and typed access for free.

**anyhow** makes error messages readable without ceremony. `with_context` adds a breadcrumb to every `?` point so you always know what failed and why.

## The rough edges

Error messages from the borrow checker are still verbose. For a 200-line tool, I spent more time untangling lifetimes than writing logic. That's the trade-off: you pay upfront, but the program doesn't crash at runtime.

## Bottom line

For a focused CLI, the Rust ecosystem is mature enough that you can go from idea to working binary in a single session. The binary is fast, the help text writes itself, and you never worry about segfaults.

The code is on [GitHub](https://github.com/tomperez98/csv-filter) if you want to take a look.
