# ctx.makeResource()

**Creates** a new resource instance and returns it; **does not** set or change `ctx.resource`. Use when you need multiple resources or a temporary one.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **Multiple resources** | Load several data sources (e.g. users + orders), each with its own resource |
| **One-off query** | Single query, no need to bind to `ctx.resource` |
| **Auxiliary data** | Main data in `ctx.resource`, extra data from a `makeResource` instance |

If you only need one resource and want it on `ctx.resource`, use [ctx.initResource()](./init-resource.md).

## Type

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `resourceType` | `string` | `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Returns**: The new resource instance.

## Relation to ctx.initResource()

| Method | Behavior |
|--------|----------|
| `ctx.makeResource(type)` | Creates and returns; **does not** set `ctx.resource`; can call multiple times for multiple resources |
| `ctx.initResource(type)` | Creates and binds if missing; otherwise returns existing. Ensures `ctx.resource` is set |

## Examples

### Single resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource unchanged (if it existed)
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
    <p>Users: {usersRes.getData().length}</p>
    <p>Orders: {ordersRes.getData().length}</p>
  </div>
);
```

### One-off query

```ts
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Notes

- Call `setResourceName(name)` then `refresh()` to load data.
- Each instance is independent; good for loading several sources in parallel.

## Related

- [ctx.initResource()](./init-resource.md): init and bind to `ctx.resource`
- [ctx.resource](./resource.md): current context resource
- [MultiRecordResource](../resource/multi-record-resource.md)
- [SingleRecordResource](../resource/single-record-resource.md)
- [APIResource](../resource/api-resource.md)
- [SQLResource](../resource/sql-resource.md)
