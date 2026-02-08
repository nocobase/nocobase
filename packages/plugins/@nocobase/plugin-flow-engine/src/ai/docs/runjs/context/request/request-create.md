---
title: "Request Create (POST)"
description: "Use ctx.request() to create data with POST and body"
---

# Request Create (POST)

Use `ctx.request()` to create data with POST and request body.

```ts
await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: '张三', email: 'zhangsan@example.com' },
});
```
