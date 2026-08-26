+++
title = "You can test it!"
description = "Testability as a core property"
date = 2026-08-25
+++

Software is messy. Unit tests — and even sequential end-to-end tests — are rarely enough to reveal the complex bugs hiding in a system. Side effects, state setup, concurrency: the hard parts resist naive testing.

That's why there are two sides to testing. There's *strategy* — how do you test a given thing? And then there's the side that gets far less attention: *making your software testable in the first place*.

> **Just as important as writing good tests is writing code that can be tested well.**

Testability isn't an afterthought you bolt on once the tests start hurting. It's a property of your code structure, your APIs, your configuration, your packaging, and your automation harnesses. This post is about that second side.

## Isolate side effects

A common obstacle to testing is behavior that's tangled up with the outside world. IO event handlers — mouse clicks, keyboard input, network connections — all mix real work with hard-to-reproduce side effects.

The trick is to *extract the purely functional behavior* that's stuck in there. Pull it out, reorder things, and you get a core you can actually test.

Take a handler that deals with mouse state, keyboard state, and a PTY:

```text
Before — logic and IO are interleaved

getMouseState()     -> IO
checkMouseState()   -> functional
getKeyboardState()  -> IO
checkKeyboardState()-> functional
readSetting()       -> IO
encodeKey()         -> functional
writeToPty()        -> IO
```

Garbage in, garbage out — but you *can* test the garbage. Push the IO to the edges and gather the functional logic into one place:

```text
After — IO on the outside, logic in the middle

getMouseState()     -> IO
getKeyboardState()  -> IO
readSetting()       -> IO
KeyEncoder          -> functional
writeToPty()        -> IO
```

Now the `KeyEncoder` — the part doing the real work — is a pure, testable unit. You can throw arbitrary inputs at it without mocking a mouse or a terminal.

## Golden files

Testing complex output doesn't mean hand-writing every assertion. *Golden files* let you capture the output of a correct run and use it as the expected result for future runs.

The workflow is simple:

1. Generate the output once.
2. Have a human eyeball it.
3. If it's correct, commit it as the golden file.

From then on, the test compares new output against the committed golden file. It's a scalable way to test complex structures — config rendering, serialization, formatted text — without maintaining brittle, hardcoded expectations by hand.

## Tame global state

Global state complicates testing: it leaks between tests, makes tests order-dependent, and prevents parallel execution. The recommendation is to minimize it.

When you genuinely need something global, prefer making it a *configuration option* that defaults to the global value. Tests can then override the option without touching process-wide state.

```rust
// Not good on its own
const PORT: u16 = 1000;

// Better — a mutable static can be reassigned in tests
static mut PORT: u16 = 1000;

// Best — a configurable option with a default
const DEFAULT_PORT: u16 = 1000;

struct ServerOpts {
    port: u16, // default it to DEFAULT_PORT somewhere
}
```

The mutable static is a last resort — it still shares state across tests, but tests can at least reset it. Each step up the ladder provides more isolation.

## Test helpers

Tests get hard to read when every one of them re-implements the same boilerplate. Write helpers that make tests easy to write and reduce the mental burden of understanding each one.

Here's the key rule: **never return errors from a test helper. Fail directly instead.**

```rust
// Awkward — every call site needs error checking
fn setup() -> Result<Db, Error> { ... }

let db = setup().expect("setup failed");

// Clean — the helper panics on failure, failing the test for you
fn setup() -> Db { ... }

let db = setup();
```

By not returning errors, the usage stays concise: the error checking disappears, and each test reads as a short sequence of steps rather than a chain of `unwrap`s and `?` operators.

## Package and function boundaries

Break functionality into packages and functions *judiciously*. Done well, it aids testing and improves organization; overdone, it complicates both testing and readability. It's a qualitative judgment with no hard formula.

This gives a clean testing surface:

- Unless a function is extremely complex, try to test only the **exported** API.
- Treat unexported functions and structs as implementation details — means to an end.
- As long as you test the end, and it behaves within spec, the means don't matter.

A further position is to only write integration or acceptance tests — the ultimate "test the end, ignore the means". The approach described here stops short of that: unit tests at the exported-API level provide fast feedback, while the unexported internals still support testability by keeping the exported API testable.

## Interfaces as seams

Interfaces are your mocking points. They let you define *behavior* regardless of *implementation*, which means you can swap a real dependency for a fake at test time — whether through a custom mocking framework or plain test code.

```rust
trait KeyEncoder {
    fn encode(&self, key: &str) -> String;
}
```

The same caveat as packages and functions applies: use interfaces judiciously. Every interface adds an indirection that costs readability, so overdoing it complicates readability the same way overdoing packages does.

## References

{% <devlab.card title="Can we test it? Yes, we can! - Mitchell Hashimoto" href="https://www.youtube.com/watch?v=MqC3tudPH6w"> %}
Mitchell Hashimoto on how to test systems. Engineer and open source contributor, creator of Terraform and Ghostty.
{% </devlab.card> %}
