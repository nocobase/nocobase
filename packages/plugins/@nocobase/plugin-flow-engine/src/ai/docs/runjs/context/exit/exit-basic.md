---
title: "Terminate Current Flow (ctx.exit)"
description: "Stop subsequent steps when conditions are not met or the user cancels."
---

# Terminate Current Flow

```ts
// In a confirmation dialog, terminate the flow when the user cancels
if (!confirmed) {
  ctx.exit();
}

// Terminate the flow when parameter validation fails
if (!isValid(params)) {
  // Show a message first
  ctx.message.error('Invalid parameters');
  // Then terminate the flow; subsequent steps will not run
  ctx.exit();
}
```

> Tip:
> - `ctx.exit()` only stops the current flow; it does not affect other flows triggered by the same event
> - To stop all related flows in the current event, use `ctx.exitAll()`
