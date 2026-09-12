# ctx.initResource()

**Initializes** the resource for the current context. If `ctx.resource` does not already exist, it creates one of the specified type and binds it to the context; if it already exists, it is used directly. Afterward, it can be accessed via `ctx.resource`.

## Use Cases

Generally used in **JSBlock** (independent block) scenarios. Most blocks, popups, and other components have `ctx.resource` pre-bound and do not require manual calls. JSBlock has no resource by default, so you must call `ctx.initResource(type)` before loading data via `ctx.resource`.

## Type Definition

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Resource type: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Returns**: The resource instance in the current context (i.e., `ctx.resource`).

## Difference from ctx.makeResource()

| Method | Behavior |
|--------|----------|
| `ctx.initResource(type)` | Creates and binds if `ctx.resource` does not exist; returns the existing one if it does. Ensures `ctx.resource` is available. |
| `ctx.makeResource(type)` | Only creates and returns a new instance, does **not** write to `ctx.resource`. Suitable for scenarios requiring multiple independent resources or temporary use. |

## Examples

### List Data (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Single Record (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Specify primary key
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Specify Data Source

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Notes

- In most block scenarios (Forms, Tables, Details, etc.) and popups, `ctx.resource` is already pre-bound by the runtime environment, so calling `ctx.initResource` is unnecessary.
- Manual initialization is only required in contexts like JSBlock where there is no default resource.
- After initialization, you must call `setResourceName(name)` to specify the collection, and then call `refresh()` to load the data.

## Related

- [ctx.resource](./resource.md) — The resource instance in the current context
- [ctx.makeResource()](./make-resource.md) — Creates a new resource instance without binding it to `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Multiple records/List
- [SingleRecordResource](../resource/single-record-resource.md) — Single record
- [APIResource](../resource/api-resource.md) — General API resource
- [SQLResource](../resource/sql-resource.md) — SQL query resource