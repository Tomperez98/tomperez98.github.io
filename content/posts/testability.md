+++
title = "You can test it!"
description = "Testability as a core property"
date = 2026-08-25
+++

Software is messy. Unit tests — and even sequential end-to-end tests — are rarely enough to reveal the complex bugs hiding in a system. Side effects, state setup, concurrency, error handling: the hard parts resist naive testing.

That's why there are two sides to testing. There's *strategy* — how do you test a given thing? And then there's the side that gets far less attention: *making your software testable in the first place*.

> **Just as important as writing good tests is writing code that can be tested well.**

Testability isn't an afterthought you bolt on once the tests start hurting. It's a property of your code structure, your APIs, your configuration, your packaging, and your automation harnesses.

This post is mostly about that second side — and about the techniques that fall out of it once your code is built to be tested.

## Structure for testability

The shape of your code decides what's testable. Push the messy parts to the edges, make failures explicit, and the tests stop fighting the code.

### Isolate side effects

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

### Parse at the edge

Untrusted input is the same kind of impurity as IO. If every function validates raw strings and shapes on the way in, parsing gets interleaved with business logic — and every caller re-checks the same shapes.

Parse once, at the boundary, and pass meaningful domain values inward. The code inside stops asking "is this shape right?" and starts assuming it already is.

```rust
fn handle_create_user(raw: &str) -> Result<User, Error> {
    let command = parse_create_user(raw)?; // boundary: raw -> domain
    register_user(command)                 // everything inside trusts the value
}
```

`parse_create_user` absorbs all the validation and shape-checking. The functions it calls receive a `CreateUser`, not a pile of untyped input.

### Make errors explicit

A thrown exception is a side effect of a sneaky kind. It's invisible in the function signature, jumps across stack frames, and forces tests to reach for `#[should_panic]` or `try/catch` just to observe a failure path. You can't compose failure paths, and you can't see what a function might fail with just by reading it.

Model errors as *values* instead. `Result<T, E>` makes every expected failure part of the type, so the signature itself is the contract you test against.

```rust
fn parse_port(input: &str) -> Result<u16, InvalidPort> {
    input.parse().map_err(|_| InvalidPort { input: input.into() })
}
```

`parse_port` now *promises* which failures are possible. That promise is exactly what the testing techniques in the second half of this post assert against.

The split is the same rule that shows up everywhere typed code gets serious: **bugs panic, expected failures return values**. If that distinction is new to you, it's the core of [fail-fast software](/posts/fail-fast/). The TypeScript library `better-result` brings this same idea to JavaScript, and its guides — cited below — are the source of several sections that follow.

### One error vocabulary per boundary

Each layer should speak its own error language. A repository's public API might expose `UserNotFound | UserStoreUnavailable`, while the database adapter underneath knows only driver specifics — `NoRows`, timeouts, connection resets. Translate once, at the boundary, and don't let driver or framework error types leak into the domain.

```rust
fn find_user(id: UserId) -> Result<User, UserError> {
    query_user_row(id).map_err(|cause| match cause {
        DbError::NoRows => UserError::NotFound { id },
        other => UserError::StoreUnavailable { cause: other },
    })
}
```

`UserError` is the domain's vocabulary; `DbError` is the adapter's. Callers of `find_user` match on two meaningful cases instead of a pile of database exceptions.

### Compose in a workflow

Put an operation's steps into a single workflow function whose return type records every expected failure. The signature then documents the whole failure space — and the test plan falls out of the type.

```rust
fn register_user(input: &str) -> Result<User, RegisterUserError> {
    let command = parse_create_user(input)?;   // InvalidCreateUser
    ensure_email_available(&command.email)?;    // EmailTaken
    let user = insert_user(command)?;           // UserStoreUnavailable
    publish_user_registered(&user)?;            // PublishFailed
    Ok(user)
}
```

`RegisterUserError` is the union of those four variants. Anyone reading the signature knows exactly what can go wrong — and testing means walking that union, variant by variant.

### Map to transport once

On the way out, translate the result into the transport response in exactly one place. Don't scatter HTTP status codes through the domain; match the union once, at the edge.

```rust
fn to_http_response(result: Result<User, RegisterUserError>) -> Response {
    match result {
        Ok(user) => Response::json(user, 201),
        Err(RegisterUserError::InvalidCreateUser(e)) => Response::json(e, 400),
        Err(RegisterUserError::EmailTaken(e)) => Response::json(e, 409),
        Err(RegisterUserError::UserStoreUnavailable(_)) => Response::json("Try again", 503),
        Err(RegisterUserError::PublishFailed(_)) => Response::json("Try again", 503),
    }
}
```

Parsing in at one edge, mapping out at the other: the domain stays clean, and the transport's concerns are absorbed by the boundaries.

### Tame global state

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

### Package and function boundaries

Break functionality into packages and functions *judiciously*. Done well, it aids testing and improves organization; overdone, it complicates both testing and readability. It's a qualitative judgment with no hard formula.

This gives a clean testing surface:

- Unless a function is extremely complex, try to test only the **exported** API.
- Treat unexported functions and structs as implementation details — means to an end.
- As long as you test the end, and it behaves within spec, the means don't matter.

A further position is to only write integration or acceptance tests — the ultimate "test the end, ignore the means". The approach described here stops short of that: unit tests at the exported-API level provide fast feedback, while the unexported internals still support testability by keeping the exported API testable.

### Interfaces as seams

Interfaces are your mocking points. They let you define *behavior* regardless of *implementation*, which means you can swap a real dependency for a fake at test time — whether through a custom mocking framework or plain test code.

```rust
trait KeyEncoder {
    fn encode(&self, key: &str) -> String;
}
```

The same caveat as packages and functions applies: use interfaces judiciously. Every interface adds an indirection that costs readability, so overdoing it complicates readability the same way overdoing packages does.

## Techniques for testing

The structural work above is what makes the following techniques possible. If the failure paths are explicit and the edges are clean, the tests write themselves.

### Golden files

Testing complex output doesn't mean hand-writing every assertion. *Golden files* let you capture the output of a correct run and use it as the expected result for future runs.

The workflow is simple:

1. Generate the output once.
2. Have a human eyeball it.
3. If it's correct, commit it as the golden file.

From then on, the test compares new output against the committed golden file. It's a scalable way to test complex structures — config rendering, serialization, formatted text — without maintaining brittle, hardcoded expectations by hand.

### Test helpers

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

### Assert the discriminated shape

When a function returns a `Result`, don't reach for `unwrap` the moment you have it. Narrow first — assert the shape, then inspect the payload. The test should follow the same contract a production caller does: match before you touch the value.

```rust
let result = parse_port("3000");

// Narrow first — assert the shape before touching the payload
assert!(matches!(result, Ok(3000)));
```

Don't let a `unwrap` panic be the test's verdict. Assert the shape explicitly, so a failure reads as "wrong variant" — not "test crashed".

### Test every error variant

A workflow's signature promises a union of failures. Cover every variant — not just a generic "it failed" — so each one's translation and payload are verified.

```rust
let result = parse_port("nope");

assert!(matches!(
    result,
    Err(InvalidPort { input }) if input == "nope"
));
```

One test per variant. If `RegisterUserError` has four variants, write four tests. A suite that only ever exercises the happy path plus one error case is a suite that doesn't know its own contract.

### Test short-circuiting

In a composed workflow, once a step fails, the later steps must not run. That short-circuit is part of the contract — assert it.

```rust
let called = Cell::new(false);
let save = || { called.set(true); Ok(()) };

let result = workflow(save); // workflow errors before reaching save()

assert!(result.is_err());
assert!(!called.get(), "save() must not run after an early failure");
```

### Test retries deterministically

Retry logic with real delays is a test killer: slow, flaky, and unrepeatable. Inject the operation, keep delays at zero, and assert the exact attempt list.

```rust
let attempts = RefCell::new(Vec::new());

let result = try_with_retry(
    |attempt| {
        attempts.borrow_mut().push(attempt);
        if attempt < 3 { Err(Error::Temporary) } else { Ok("ready") }
    },
    RetryPolicy { times: 2, delay: Duration::ZERO },
);

assert_eq!(*attempts.borrow(), vec![1, 2, 3]);
assert!(result.is_ok());
```

You assert *which* attempts happened and what each returned — the policy's real behavior, not its timing.

### Keep defects separate

Distinguish *expected failures* from *defects*. Expected failures live in your `Result` union; defects are bugs that should panic. Don't write a test that treats a bug's panic as a normal result — that blurs the very contract you're proving.

```rust
// Expected failure — assert the Err variant
assert!(parse_port("nope").is_err());

// Defect — a broken invariant must panic, and that's the point of the test
#[test]
#[should_panic]
fn negative_quantity_is_a_defect() {
    set_quantity(-5);
}
```

`#[should_panic]` is for documenting that a broken invariant crashes. Expected failures go through `Result` — the same "panic for bugs, `Result` for expected failures" rule as before.

### Compile-time tests

For typed code, the types themselves are part of the API — and the compiler is a test runner you already have. Pin the important unions with a compile-time assertion so a signature can't drift silently.

```rust
// Fails to compile if register_user's failure union drifts from RegisterUserError
const _: fn(&str) -> Result<User, RegisterUserError> = register_user;
```

In TypeScript you'd reach for your repo's type-test convention (`expectTypeOf` or similar); in Rust the coercion above does the job. Either way, the type system is doing the asserting.

## References

{% <devlab.card title="Can we test it? Yes, we can! - Mitchell Hashimoto" href="https://www.youtube.com/watch?v=MqC3tudPH6w"> %}
Mitchell Hashimoto on how to test systems. Engineer and open source contributor, creator of Terraform and Ghostty.
{% </devlab.card> %}

{% <devlab.card title="Better Result — Application patterns" href="https://better-result.dev/guides/application-patterns"> %}
Parse at the edge, one error vocabulary per boundary, compose workflows, and map to transport once. Source of the result-pattern sections above.
{% </devlab.card> %}

{% <devlab.card title="Better Result — Testing" href="https://better-result.dev/guides/testing"> %}
Test every error variant, short-circuiting, retries, and defects through public interfaces. Source of the testing-technique sections above.
{% </devlab.card> %}
