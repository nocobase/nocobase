---
title: "使用字符串变量占位符"
description: "在 SQL 中直接使用 ctx 上下文变量作为占位符。"
---

```ts
// 使用字符串变量，直接注入当前用户 ID
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  {
    type: 'selectRow',
  },
);
```

> 说明：
> - 这里的 `{{ctx.user.id}}` 会在执行前由 Flow 引擎解析成实际的 `ctx.user.id` 值，再发送到后端执行
> - 变量由运行时上下文动态提供，支持的来源和 `ctx.getVar()` 一致（如 `ctx.user.*`、`ctx.record.*` 等）
> - 不需要像 `bind` 一样把参数拆成单独对象，适合直接在 SQL 中内联少量上下文变量
