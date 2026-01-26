---
title: "Select Rows"
description: "Select rows."
---

# Examples

## Select Rows

Use this snippet to select rows.

```ts
return ctx.runsql({
  uid: 'list-users',
  sql: 'SELECT * FROM users WHERE age > $age',
  bind: { age: 30 },
  type: 'selectRows',
});
```

## Select Row

Use this snippet to select row.

```ts
return ctx.runsql({
  uid: 'get-user',
  type: 'selectRow',
  sql: 'SELECT * FROM users WHERE id = $userId',
  bind: { userId },
});
```

## Select Var

Use this snippet to select var.

```ts
return ctx.runsql({
  uid: 'count-users',
  type: 'selectVar',
  sql: 'SELECT COUNT(id) FROM users',
});
```

## Select With Filter

Use this snippet to select with filter.

```ts
return ctx.runsql({
  uid: 'filter-users',
  sql: 'SELECT * FROM users',
  filter: { status: 'active' },
});
```
