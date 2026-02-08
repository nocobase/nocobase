---
title: "Request List (Same-Origin)"
description: "Use ctx.request() to list data with resource-style URL"
---

# Request List (Same-Origin)

Use `ctx.request()` to list data with a resource-style URL (same-origin).

```ts
const { data } = await ctx.request({
  url: 'users:list',
  params: { pageSize: 10 },
});
```
