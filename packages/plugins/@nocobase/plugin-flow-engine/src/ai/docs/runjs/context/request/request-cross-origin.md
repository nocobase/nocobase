---
title: "Request Cross-Origin"
description: "Use ctx.request() with full URL for cross-origin requests"
---

# Request Cross-Origin

Use `ctx.request()` with a full URL to call another origin. The target must allow CORS.

```ts
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});
```

To send the target's own token, pass it via `headers`:

```ts
await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: { Authorization: 'Bearer <target-token>' },
});
```
