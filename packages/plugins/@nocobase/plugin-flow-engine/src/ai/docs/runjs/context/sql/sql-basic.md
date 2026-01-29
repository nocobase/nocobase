---
title: "Run Ad-hoc SQL (ctx.sql.run)"
description: "Execute parameterized SQL directly in JSBlock."
---

# Run Ad-hoc SQL

```ts
// Query users with a specific status
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = $status ORDER BY created_at DESC',
  {
    bind: { status: 'active' },
    type: 'select',
  },
);

// Get total count only
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE status = :status',
  {
    bind: { status: 'active' },
    type: 'selectVar',
  },
);
```

> Tip:
> - Always pass parameters via `bind` to avoid SQL injection risks from string concatenation
> - Use `type` to control the return shape, e.g. `select` / `selectRow` / `selectVar`
