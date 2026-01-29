---
title: "Conditional Rendering"
description: "Render conditionally with ctx.render() based on data"
---

# Conditional Rendering

Use `ctx.render()` to render conditionally based on data.

```ts
const { data } = await ctx.api.request({ url: 'users:list' });

if (!data?.data?.length) {
  ctx.render('<div style="padding:16px;color:#999;">' + ctx.t('No data') + '</div>');
  return;
}

ctx.render(
  <ul>
    {data.data.map((user) => (
      <li key={user.id}>{user.username || user.id}</li>
    ))}
  </ul>
);
```
