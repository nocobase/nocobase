---
title: "使用 state 传递数据"
description: "通过 state 选项传递状态数据，不会出现在 URL 中"
---

# 使用 state 传递数据

通过 `state` 选项传递状态数据，这些数据不会出现在 URL 中，可以通过 `ctx.location.state` 在目标路由中访问。

```ts
// 导航并传递状态数据（不会出现在 URL 中）
ctx.router.navigate('/users/123', {
  state: {
    from: 'dashboard',
    timestamp: Date.now()
  }
});

// 在目标路由中访问传递的状态
const previousState = ctx.location.state;
if (previousState?.from === 'dashboard') {
  // 处理从 dashboard 跳转过来的逻辑
}
```
