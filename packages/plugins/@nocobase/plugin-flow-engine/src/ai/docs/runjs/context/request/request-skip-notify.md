---
title: "Request Skip Global Error Message"
description: "Use ctx.request() with skipNotify to avoid global error toast"
---

# Request Skip Global Error Message

Use `ctx.request()` with `skipNotify: true` so that on failure the app does not show a global error message.

```ts
await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,
});
```
