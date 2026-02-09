# ctx.resource

The **current data resource** instance (`FlowResource`) in this RunJS context. It is used to access and operate on data in JS blocks / JS actions.

- In many blocks or dialogs, a resource is pre‑bound by the environment (e.g. table list resource, detail form resource).
- If there is no resource yet, you can call `ctx.initResource(type)` to create and attach one, then use `ctx.resource`.

The concrete type depends on usage, e.g. `MultiRecordResource`, `SingleRecordResource`, `APIResource`, or `SQLResource`.

## Typical usage

```ts
// Ensure there is a resource (initialize one if missing)
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');

await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

Common methods (depending on the actual resource type) include:

- `getData()` / `setData(value)` – read or overwrite local data
- `refresh()` – reload data from the server
- `setResourceName(name)` – bind to a collection (for record resources)
- `setFilterByTk(tk)` – set primary key for single record operations
- `runAction(actionName, params)` – call specific backend actions
- `on(event, fn)` / `off(event, fn)` – subscribe / unsubscribe from events

## Common scenarios

- Use `ctx.resource` in a **table block** to:
  - Refresh list data
  - Access selected rows (via `getSelectedRows()` on `MultiRecordResource`)
- Use `ctx.resource` in a **form block** to:
  - Load a detail record by primary key (`SingleRecordResource`)
  - Save changes via `save()`

You can also create and manage additional resources via:

- [`ctx.initResource()`](../init-resource/index.md) – ensure and bind a resource to `ctx.resource`
- [`ctx.makeResource()`](../make-resource/index.md) – create extra resource instances without touching `ctx.resource`

See also the detailed APIs of each resource type:

- [MultiRecordResource](../../resource/multi-record-resource/index.md) — list / collection resource
- [SingleRecordResource](../../resource/single-record-resource/index.md) — single record resource
- [APIResource](../../resource/api-resource/index.md) — generic API resource
- [SQLResource](../../resource/sql-resource/index.md) — SQL query resource
