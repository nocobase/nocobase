# ctx.resource

The **FlowResource** instance in the current context; used to access and operate on data. In most blocks (form, table, detail, etc.) and popups, the runtime binds `ctx.resource`; in JSBlock and similar contexts that have no resource by default, call [ctx.initResource()](./init-resource.md) first, then use `ctx.resource`.

## Use Cases

Use whenever RunJS needs structured data (list, single record, custom API, SQL). Form, table, detail blocks and popups usually have it bound; in JSBlock, JSField, JSItem, JSColumn, etc., call `ctx.initResource(type)` first if you need to load data.

## Type

```ts
resource: FlowResource | undefined;
```

- When the context has a bound resource, `ctx.resource` is that instance.
- In JSBlock etc. it is `undefined` by default; after `ctx.initResource(type)` it is set.

## Common methods

Different resource types (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) expose slightly different APIs; common ones:

| Method | Description |
|--------|-------------|
| `getData()` | Current data (list or single record) |
| `setData(value)` | Set local data |
| `refresh()` | Refetch with current params |
| `setResourceName(name)` | Set resource name (e.g. `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Set primary key filter (single get, etc.) |
| `runAction(actionName, options)` | Call any resource action (e.g. `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Subscribe/unsubscribe (e.g. `refresh`, `saved`) |

**MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, etc.

## Examples

### List (after initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Table (pre-bound)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted'));
```

### Single record

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Custom action

```js
await ctx.resource.runAction('create', { data: { name: 'John' } });
```

## Relation to ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Creates and binds if missing; otherwise returns existing. Ensures `ctx.resource` is set.
- **ctx.makeResource(type)**: Creates a new instance and returns it; **does not** set `ctx.resource`. Use when you need multiple resources or a temporary one.
- **ctx.resource**: The bound resource in the current context. Most blocks/popups have it; when not bound it is `undefined` and you must call `ctx.initResource` first.

## Notes

- Prefer null checks: `ctx.resource?.refresh()`, especially in JSBlock and similar contexts.
- After init, call `setResourceName(name)` then `refresh()` to load data.
- See the resource type docs for full API.

## Related

- [ctx.initResource()](./init-resource.md): init and bind resource
- [ctx.makeResource()](./make-resource.md): create resource without binding
- [MultiRecordResource](../resource/multi-record-resource.md)
- [SingleRecordResource](../resource/single-record-resource.md)
- [APIResource](../resource/api-resource.md)
- [SQLResource](../resource/sql-resource.md)
