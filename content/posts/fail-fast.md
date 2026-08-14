+++
title = "Fail fast software"
description = "Crash early, but guard the user experience"
date = 2026-08-14
+++

What do you prioritize when building software? [*Safety or liveness*](https://en.wikipedia.org/wiki/Safety_and_liveness_properties)

> **The Pragmatic Programmer: Crash Early.** A dead program normally does a lot less damage than a crippled one.

## Why fail fast?

### Fail visibly

When your program hits an invalid state, fail *loudly*. Stop running and make it obvious that something went wrong, instead of limping along with bad data.

An error that blows up in your face is much harder to miss than one buried in a log file. Logs help, but a crash makes sure everyone notices.

### Debugging gets easier

If you keep going after an invalid state, you no longer know where things went wrong. Now you have to reproduce the bug, step through code, and hunt for the exact point where the program drifted off course.

Failing fast tells you exactly where execution stopped — that's usually most of the work.

### Avoid cascading failures

Letting a program continue after an invalid state means letting it wander into unknown territory. One bad state leads to another, and small problems snowball into much bigger ones.

Stopping early keeps a small mistake small.

### Simpler mental models

"Failing safe" means adding branches for every possible bad path — more code paths to juggle, and more chances to get it wrong.

Failing fast means you can assume the system is in the state you expect. Once you've ruled out unexpected states, you can reason about your code with confidence.

## Assertive programming

*Assertive programming* is a whole methodology built on fail-fast. I first read about it in *The Pragmatic Programmer*.

The idea is simple: sprinkle `assert!` calls through your code to continuously check the system's state, and crash the moment an assumption stops holding.

```rust
let adult = generate_adult();
assert!(adult.age >= 18);
sell_item_to(&adult);
```

The `assert!` after `generate_adult()` guarantees that execution only reaches line 3 when `adult.age >= 18`. You might think "that can never fail" — and you're probably right. But assertions are cheap insurance: they turn "that can't happen" into "that won't happen".

Assertive programming shines when your code is clever and error-prone:

```rust
fn some_crazy_calculation_that_returns_a_positive_number(num: i32) -> i32 {
    // do something clever with num
    num + 1 // placeholder logic
}

for i in 0..total {
    let a = some_crazy_calculation_that_returns_a_positive_number(i);
    assert!(a > 0); // I don't fully trust my crazy calculation yet
    do_something_with(a);
}
```

Assertions are ultimately a confidence tool: they let you validate assumptions as you code and build robust, fail-fast systems.

## Fail-fast in practice

So how do you apply this in real code? The rule of thumb is simple:

**Use panics for programmer errors and broken invariants. Use `Result`/`Option` for expected, recoverable failures.**

### When to panic

A panic is appropriate when the program has entered a state that *should be impossible* — in other words, a bug:

- A broken invariant (a value that must always hold, like "quantity is positive").
- Incorrect API usage or logic errors.
- Arithmetic that would silently produce a wrong result.

```rust
// A negative quantity is a bug — fail loudly
fn set_quantity(q: i64) {
    assert!(q > 0, "quantity must be positive, got {q}");
    // ...
}
```

### When to return a `Result` or `Option`

An error result is appropriate when failure is *expected* and the caller should decide how to handle it:

- Network errors and file I/O.
- Parsing and validation of user input.
- Business rules that can legitimately be rejected.

```rust
// Reading a config file can legitimately fail — hand the error back
fn read_config(path: &str) -> Result<Config, std::io::Error> {
    let contents = std::fs::read_to_string(path)?;
    // ...
    Ok(config)
}
```

### Handling overflow explicitly

Rust panics on integer overflow in debug builds, which is exactly the fail-fast behavior you want. When you need to handle overflow as an expected case instead, be explicit about it:

```rust
// Debug builds: panics on overflow (fail fast by default)
let total = a + b;

// Explicit handling when overflow is a real possibility
let total = a.checked_add(b)?; // returns Option<...>
```

In release builds you can even set `panic = "abort"` so a panic ends the process cleanly, ready to be restarted by a supervisor. That's the *crash-only* approach: when something unrecoverable happens, restart rather than limp along in a corrupted state.

## References

{% <devlab.card title="The benefits of fail-fast systems" href="https://medium.com/@denhox/the-benefits-of-fail-fast-systems-dc72a665cfb5"> %}
Medium article on why failing fast pays off.
{% </devlab.card> %}

{% <devlab.card title="NautilusTrader — Fail-fast principles" href="https://nautilustrader.io/docs/latest/concepts/architecture/#fail-fast-principles"> %}
Official docs on how NautilusTrader applies fail-fast across its core types.
{% </devlab.card> %}
