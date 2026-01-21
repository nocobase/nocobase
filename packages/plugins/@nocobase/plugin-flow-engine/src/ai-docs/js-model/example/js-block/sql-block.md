# Sql Block

## Code

Use this snippet to code.

```ts
if (ctx.flowSettingsEnabled) {
  await ctx.sql.save({
    uid: ctx.model.uid,
    sql: 'select * from users where id = {{ctx.user.id}}',
    dataSourceKey: 'main',
  });
}

ctx.useResource('SQLResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setFilterByTk(ctx.model.uid);
await ctx.resource.refresh();

ctx.element.innerHTML = `<pre>${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>`;
```
