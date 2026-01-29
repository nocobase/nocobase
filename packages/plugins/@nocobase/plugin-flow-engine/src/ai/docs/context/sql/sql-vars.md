---
title: "Use String Variable Placeholders"
description: "Use ctx context variables directly as placeholders in SQL."
---

```ts
// Use a string variable to inject the current user ID directly
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  {
    type: 'selectRow',
  },
);
```

> Notes:
> - `{{ctx.user.id}}` is resolved by the Flow engine to the actual `ctx.user.id` value before execution
> - Variables are provided by the runtime context and match the sources supported by `ctx.getVar()` (e.g., `ctx.user.*`, `ctx.record.*`)
> - No need to split parameters into a `bind` object; good for inline use of a small number of context variables in SQL
