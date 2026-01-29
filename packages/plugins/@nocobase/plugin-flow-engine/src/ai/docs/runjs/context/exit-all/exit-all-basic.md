---
title: "Terminate Entire Flow (ctx.exitAll)"
description: "Abort the current flow and all subsequent steps and sub-flows when conditions are met."
---

# Terminate Entire Flow

When you call `ctx.exitAll()` at any step, it immediately throws `FlowExitAllException`. The FlowEngine catches it and terminates the current flow instance and all subsequent steps, including nested sub-flows.

## Basic Usage

```ts
if (!ctx.user) {
  // If the user is not logged in, terminate the entire flow (no further steps will run)
  ctx.exitAll();
}
```

> Difference from `ctx.exit()`:
> - `ctx.exit()` only terminates the current flow instance (current FlowRuntimeContext)
> - `ctx.exitAll()` terminates the current flow and all sub-flows triggered by it (useful for global abort scenarios like permission failures)
