---
title: "条件渲染"
description: "根据数据条件使用 ctx.render() 进行条件渲染"
---

# 条件渲染

根据数据条件使用 `ctx.render()` 进行条件渲染。

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
