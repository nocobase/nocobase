---
title: "替换路由"
description: "使用 replace 选项替换当前历史记录，不添加新条目"
---

# 替换路由

使用 `replace: true` 选项替换当前历史记录条目，不会添加新条目，适合登录后跳转等场景。

```ts
// 登录成功后，替换当前路由到首页
ctx.router.navigate('/home', { replace: true });
```
