+++
title = "Durable Execution Is the Missing Piece for AI Agents"
date = 2025-01-15

[taxonomies]
categories = ["AI Engineering"]
tags = ["durable-execution", "ai-agents", "serverless", "resonate"]
+++

AI agents are everywhere. LangChain, AutoGPT, Pydantic AI — the ecosystem is moving fast. But almost every agent framework shares the same blind spot: **they assume the process stays alive**.

Call an LLM, get a response, call a tool, wait for a human — if any step in that chain crashes, you start over. No checkpointing, no retry, no resume.

This is the same problem distributed systems solved decades ago with durable execution. And it's time we applied it to AI.

<!-- more -->

## The problem with agent workflows

A typical agent loop looks like this:

1. Receive a task
2. Call an LLM for reasoning
3. Call a tool (API, database, browser)
4. Maybe ask a human for approval
5. Continue based on the result
6. Eventually produce an output

Steps 2-5 can take seconds, minutes, or hours. If your Lambda function has a 15-minute timeout, or your server restarts during a deploy, or the LLM API flakes — the entire workflow dies. You lose context, you burn tokens on retries, and in the worst case you leave a half-finished side effect in the world.

## What durable execution looks like

Durable execution means **the runtime checkpoints every step**. Your code looks synchronous, but underneath:

- Every function call is persisted
- If the process crashes, it resumes from the last completed step
- Waiting doesn't consume compute — the durable promise suspends and wakes when the result is ready

In practice, this turns a fragile chain of LLM calls into something you can deploy on spot instances. The workflow outlives the worker.

## serverless-pydantic-ai

I built [serverless-pydantic-ai](https://github.com/Tomperez98/serverless-pydantic-ai) to prove this pattern. It wraps a [Pydantic AI](https://ai.pydantic.dev) agent inside a [Resonate](https://resonatehq.io) durable workflow, deployed on AWS Lambda:

- Each LLM call is **durably checkpointed** — crash mid-response, and you replay from the last successful completion
- Human-in-the-loop is a **durable promise** — the workflow suspends, frees the Lambda worker, and resumes when the human responds (minutes or days later)
- Deployments don't kill in-flight workflows — the new container picks them up

The result: a serverless agent that behaves like it's running on a persistent machine, with zero compute cost while waiting.

## Where this is going

Durable execution for AI agents is still early. But the pattern is clear: as agents move from demos to production, they need the same reliability guarantees we expect from payment processing or order fulfillment.

The frameworks that figure this out — checkpoints, idempotent replay, durable timers, and determinism — will be the ones running in production two years from now.
