# ctx.makeResource()

**Creates** and returns a new resource instance **without** writing to or modifying `ctx.resource`. It is suitable for scenarios requiring multiple independent resources or temporary usage.

## Use Cases

| Scenario | Description |
|------|------|
| **Multiple resources** | Load multiple data sources simultaneously (e.g., user list + order list), each using an independent resource. |
| **Temporary queries** | One-time queries that are discarded after use, without needing to bind to `ctx.resource`. |
| **Auxiliary data** | Use `ctx.resource` for primary data and `makeResource` to create instances for additional data. |

If you only need a single resource and want to bind it to `ctx.resource`, using [ctx.initResource()](./init-resource.md) is more appropriate.

## Type Definition

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parameter | Type | Description |
|------|------|------|
| `resourceType` | `string` | Resource type: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Returns**: The newly created resource instance.

## Difference from ctx.initResource()

| Method | Behavior |
|------|------|
| `ctx.makeResource(type)` | Only creates and returns a new instance, **not** writing to `ctx.resource`. Can be called multiple times to obtain multiple independent resources. |
| `ctx.initResource(type)` | Creates and binds if `ctx.resource` does not exist; returns it directly if it already exists. Ensures `ctx.resource` is available. |

## Examples

### Single resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource remains its original value (if any)
```

### Multiple resources

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>User count: {usersRes.getData().length}</p>
    <p>Order count: {ordersRes.getData().length}</p>
  </div>
);
```

### Temporary query

```ts
// One-time query, does not pollute ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Notes

- The newly created resource needs to call `setResourceName(name)` to specify the collection, and then load data via `refresh()`.
- Each resource instance is independent and does not affect others; suitable for loading multiple data sources in parallel.

## Related

- [ctx.initResource()](./init-resource.md): Initialize and bind to `ctx.resource`
- [ctx.resource](./resource.md): The resource instance in the current context
- [MultiRecordResource](../resource/multi-record-resource) — Multiple records/List
- [SingleRecordResource](../resource/single-record-resource) — Single record
- [APIResource](../resource/api-resource) — General API resource
- [SQLResource](../resource/sql-resource) — SQL query resource