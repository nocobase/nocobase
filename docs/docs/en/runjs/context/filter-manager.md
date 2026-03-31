# ctx.filterManager

The filter connection manager that links filter forms (FilterForm) to data blocks (tables, lists, charts, etc.). Provided by `BlockGridModel`; only available in that context (e.g. pages with a filter form block).

## Use Cases

| Scenario | Description |
|----------|-------------|
| **Filter form block** | Manage connections between filter items and target blocks; refresh targets when filters change |
| **Data block (table/list)** | Act as filter target; bind filter conditions via `bindToTarget` |
| **Linkage / custom FilterModel** | In `doFilter`, `doReset`, call `refreshTargetsByFilter` to refresh targets |
| **Connection field config** | Use `getConnectFieldsConfig`, `saveConnectFieldsConfig` for filter–target field mapping |

> Note: `ctx.filterManager` is only available in RunJS contexts that have a `BlockGridModel` (e.g. pages with a filter form); in a plain JSBlock or standalone page it is `undefined`—check before use.

## Type

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;
  targetId: string;
  filterPaths?: string[];
  operator?: string;
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Common Methods

| Method | Description |
|--------|-------------|
| `getFilterConfigs()` | All filter connection configs |
| `getConnectFieldsConfig(filterId)` | Connection field config for a filter |
| `saveConnectFieldsConfig(filterId, config)` | Save connection field config for a filter |
| `addFilterConfig(config)` | Add filter config (filterId + targetId + filterPaths) |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Remove config by filterId and/or targetId |
| `bindToTarget(targetId)` | Bind filter to target block; its resource applies the filter |
| `unbindFromTarget(targetId)` | Unbind filter from target |
| `refreshTargetsByFilter(filterId or filterId[])` | Refresh target block(s) by filter |

## Concepts

- **FilterModel**: Provides filter values (e.g. FilterFormItemModel); must implement `getFilterValue()`.
- **TargetModel**: Data block being filtered; its `resource` must support `addFilterGroup`, `removeFilterGroup`, `refresh`.

## Examples

### Add filter config

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Refresh target blocks

```ts
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Connection field config

```ts
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Remove config

```ts
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Related

- [ctx.resource](./resource.md): target block’s resource must support filter APIs
- [ctx.model](./model.md): current model uid for filterId / targetId
