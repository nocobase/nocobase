# ctx.resource

The **FlowResource** instance in the current context, used to access and operate on data. In most blocks (Forms, Tables, Details, etc.) and pop-up scenarios, the runtime environment pre-binds `ctx.resource`. In scenarios like JSBlock where there is no resource by default, you must first call [ctx.initResource()](./init-resource.md) to initialize it before using it via `ctx.resource`.

## Applicable Scenarios

`ctx.resource` can be used in any RunJS scenario that requires access to structured data (lists, single records, custom APIs, SQL). Forms, Tables, Detail blocks, and pop-ups are typically pre-bound. For JSBlock, JSField, JSItem, JSColumn, etc., if data loading is required, you can call `ctx.initResource(type)` first and then access `ctx.resource`.

## Type Definition

```ts
resource: FlowResource | undefined;
```

- In contexts with pre-binding, `ctx.resource` is the corresponding resource instance.
- In scenarios like JSBlock where there is no resource by default, it is `undefined` until `ctx.initResource(type)` is called.

## Common Methods

Methods exposed by different resource types (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) vary slightly. Below are the universal or commonly used methods:

| Method | Description |
|------|------|
| `getData()` | Get current data (list or single record) |
| `setData(value)` | Set local data |
| `refresh()` | Initiate a request with current parameters to refresh data |
| `setResourceName(name)` | Set resource name (e.g., `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Set primary key filter (for single record `get`, etc.) |
| `runAction(actionName, options)` | Call any resource action (e.g., `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Subscribe/unsubscribe to events (e.g., `refresh`, `saved`) |

**MultiRecordResource Specific**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, etc.

## Examples

### List Data (Requires initResource first)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Table Scenario (Pre-bound)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted'));
```

### Single Record

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Calling a Custom Action

```js
await ctx.resource.runAction('create', { data: { name: 'John Doe' } });
```

## Relationship with ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: If `ctx.resource` does not exist, it creates and binds one; if it already exists, it returns the existing instance. This ensures `ctx.resource` is available.
- **ctx.makeResource(type)**: Creates a new resource instance and returns it, but does **not** write it to `ctx.resource`. This is suitable for scenarios requiring multiple independent resources or temporary usage.
- **ctx.resource**: Accesses the resource already bound to the current context. Most blocks/pop-ups are pre-bound; otherwise, it is `undefined` and requires `ctx.initResource`.

## Notes

- It is recommended to perform a null check before use: `ctx.resource?.refresh()`, especially in scenarios like JSBlock where pre-binding might not exist.
- After initialization, you must call `setResourceName(name)` to specify the collection before loading data via `refresh()`.
- For the full API of each Resource type, see the links below.

## Related

- [ctx.initResource()](./init-resource.md) - Initialize and bind a resource to the current context
- [ctx.makeResource()](./make-resource.md) - Create a new resource instance without binding it to `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Multiple records/Lists
- [SingleRecordResource](../resource/single-record-resource.md) - Single record
- [APIResource](../resource/api-resource.md) - General API resource
- [SQLResource](../resource/sql-resource.md) - SQL query resource