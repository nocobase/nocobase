---
title: "读取变量 (ctx.getVar)"
description: "从运行时上下文中读取用户、记录或参数等变量。"
---

# 读取变量

```ts
// 读取当前登录用户 ID（等价于 {{ctx.user.id}}）
const userId = ctx.getVar('ctx.user.id');

// 读取当前记录主键
const recordId = ctx.getVar('ctx.record.id');

// 读取自定义注入的变量，提供默认值
const token = ctx.getVar('token', '');
```

> 提示：
> - `ctx.getVar(path)` 与 SQL / JSON 模板中的变量解析保持一致，便于在不同场景复用同一套变量命名
> - 当路径不存在时会返回 `undefined`，可以通过第二个参数提供默认值
