---
title: "Request List with Filter and Sort"
description: "Use ctx.request() with params for filter and sort"
---

# Request List with Filter and Sort

Use `ctx.request()` with `params` for pagination, filter, and sort.

```ts
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```
