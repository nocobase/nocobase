---
title: "Save and Reuse SQL Templates"
description: "Use ctx.sql.save and ctx.sql.runById to reuse common SQL."
---

# Save and Reuse SQL Templates

```ts
// 1. Save a SQL template during development/configuration
await ctx.sql.save({
  uid: 'get-active-users',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
  dataSourceKey: 'main',
});

// 2. Reuse it by ID in JSBlock
const users = await ctx.sql.runById('get-active-users', {
  bind: { status: 'active' },
  type: 'select',
});

// 3. Remove it when no longer needed
await ctx.sql.destroy('get-active-users');
```

> Tip:
> - Use meaningful names for `uid` so they are easy to reuse across JSBlocks/flows
> - The second parameter of `runById` matches `run` and supports `bind`, `type`, etc.
