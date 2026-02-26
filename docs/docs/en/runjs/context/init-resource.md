# ctx.initResource()

**Initializes** the current context’s resource: if `ctx.resource` does not exist, creates one of the given type and binds it; otherwise uses the existing one. After that you can use `ctx.resource`.

## Use Cases

Typically used only in **JSBlock** (standalone block). Most blocks and popups already have `ctx.resource`; JSBlock does not, so call `ctx.initResource(type)` first, then use `ctx.resource`.

## Type

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Resource type: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Returns**: The resource instance in the current context (i.e. `ctx.resource`).

## Relation to ctx.makeResource()

| Method | Behavior |
|--------|----------|
| `ctx.initResource(type)` | Creates and binds if `ctx.resource` is missing; otherwise returns existing. Ensures `ctx.resource` is set |
| `ctx.makeResource(type)` | Creates a new instance and returns it; **does not** set `ctx.resource`. Use when you need multiple resources or a temporary one |

## Examples

### List data (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Single record (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Specify data source

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Notes

- In most blocks (form, table, detail, etc.) and popups, `ctx.resource` is already bound; no need to call `ctx.initResource`.
- Only in contexts like JSBlock that have no resource by default do you need to initialize.
- After init, call `setResourceName(name)` and then `refresh()` to load data.

## Related

- [ctx.resource](./resource.md): resource in current context
- [ctx.makeResource()](./make-resource.md): create resource without binding to `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md)
- [SingleRecordResource](../resource/single-record-resource.md)
- [APIResource](../resource/api-resource.md)
- [SQLResource](../resource/sql-resource.md)
