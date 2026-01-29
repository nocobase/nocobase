---
title: "Use in Event Handlers"
description: "Use ctx.router.navigate() inside event handlers"
---

# Use in Event Handlers

Use `ctx.router.navigate()` inside event handlers.

```ts
// Navigate after form submission and replace history
const handleSubmit = async () => {
  await ctx.api.request({ url: '/api/users', method: 'POST', data: formData });
  ctx.router.navigate('/users', { replace: true });
};

// Navigate and pass state
const handleViewDetail = (userId) => {
  ctx.router.navigate(`/users/${userId}`, {
    state: { from: 'list' }
  });
};
```
