---
title: "Run Inline Query"
description: "Use ctx.sql.run/save/runById/destroy to run inline query."
---

# Examples

## Run Inline Query

Use this snippet to run inline query.

```ts
return ctx.sql.run('SELECT * FROM users WHERE status = $status', {
  status: 'active',
});
```

## Save Sql Snippet

Use this snippet to save sql snippet.

```ts
await ctx.sql.save({
  uid: 'list-active-users',
  title: 'List Active Users',
  sql: 'SELECT * FROM users WHERE status = $status',
});
```

## Run By Id

Use this snippet to run by id.

```ts
return ctx.sql.runById('list-active-users', {
  status: 'active',
});
```

## Destroy Sql Snippet

Use this snippet to destroy sql snippet.

```ts
await ctx.sql.destroy('list-active-users');
```
