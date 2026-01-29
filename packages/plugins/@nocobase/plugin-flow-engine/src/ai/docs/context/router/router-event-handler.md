---
title: "在事件处理中使用"
description: "在事件处理函数中使用 ctx.router.navigate() 进行导航"
---

# 在事件处理中使用

在事件处理函数中使用 `ctx.router.navigate()` 进行导航。

```ts
// 在表单提交后导航并替换历史记录
const handleSubmit = async () => {
  await ctx.api.request({ url: '/api/users', method: 'POST', data: formData });
  ctx.router.navigate('/users', { replace: true });
};

// 导航并传递状态
const handleViewDetail = (userId) => {
  ctx.router.navigate(`/users/${userId}`, {
    state: { from: 'list' }
  });
};
```
