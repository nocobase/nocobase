---
title: "执行临时 SQL (ctx.sql.run)"
description: "在 JSBlock 中直接执行一段带参数的 SQL。"
---

# 执行临时 SQL

```ts
// 查询指定状态的用户列表
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = $status ORDER BY created_at DESC',
  {
    bind: { status: 'active' },
    type: 'select',
  },
);

// 只取总数
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE status = :status',
  {
    bind: { status: 'active' },
    type: 'selectVar',
  },
);
```

> 提示：
> - 建议总是通过 `bind` 传参数，避免字符串拼接带来的 SQL 注入风险
> - `type` 可控制返回形式，如 `select`/`selectRow`/`selectVar` 等
