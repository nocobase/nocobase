# ctx.resource

The data resource object bound to the current block (e.g., table resource, detail resource). Commonly used in JSBlock / Action to perform data operations.

> The specific type depends on the block type. Only common capabilities are described here.

## Common Use Cases

- Execute CRUD operations on the current resource via `ctx.runAction`
- Control data loading via resource methods (e.g., `setFilter`, `refresh`)

```ts
// Example: execute a delete action
await ctx.runAction('destroy', {
  filterByTk: ctx.record?.id,
});
```
