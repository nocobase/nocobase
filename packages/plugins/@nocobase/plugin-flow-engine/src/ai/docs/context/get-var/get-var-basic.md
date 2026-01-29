---
title: "Read Variables (ctx.getVar)"
description: "Read user, record, or parameter variables from the runtime context."
---

# Read Variables

```ts
// Read current logged-in user ID (equivalent to {{ctx.user.id}})
const userId = ctx.getVar('ctx.user.id');

// Read current record primary key
const recordId = ctx.getVar('ctx.record.id');

// Read a custom injected variable with a default value
const token = ctx.getVar('token', '');
```

> Tip:
> - `ctx.getVar(path)` uses the same variable resolution as SQL / JSON templates, making it easy to reuse the same variable names across contexts
> - When a path does not exist, it returns `undefined`; you can provide a default value with the second argument
