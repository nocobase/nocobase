---
title: "保存并复用 SQL 模板"
description: "通过 ctx.sql.save 和 ctx.sql.runById 复用常用 SQL。"
---

# 保存并复用 SQL 模板

```ts
// 1. 在开发/配置阶段保存一条 SQL 模板
await ctx.sql.save({
  uid: 'get-active-users',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
  dataSourceKey: 'main',
});

// 2. 在 JSBlock 中按 ID 复用这条 SQL
const users = await ctx.sql.runById('get-active-users', {
  bind: { status: 'active' },
  type: 'select',
});

// 3. 不再需要时可以删除
await ctx.sql.destroy('get-active-users');
```

> 提示：
> - 建议为 `uid` 取有语义的名字，便于在多个 JSBlock/流中复用
> - `runById` 的第二个参数与 `run` 保持一致，可传 `bind`、`type` 等选项
