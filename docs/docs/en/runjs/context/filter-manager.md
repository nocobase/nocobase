# ctx.filterManager

The Filter Connection Manager is used to manage the filter associations between filter forms (FilterForm) and data blocks (tables, lists, charts, etc.). It is provided by `BlockGridModel` and is only available within its context (e.g., filter form blocks, data blocks).

## Use Cases

| Scenario | Description |
|------|------|
| **Filter Form Block** | Manages connection configurations between filter items and target blocks; refreshes target data when filters change. |
| **Data Block (Table/List)** | Acts as a filter target, binding filter conditions via `bindToTarget`. |
| **Linkage Rules / Custom FilterModel** | Calls `refreshTargetsByFilter` within `doFilter` or `doReset` to trigger target refreshes. |
| **Connection Field Configuration** | Uses `getConnectFieldsConfig` and `saveConnectFieldsConfig` to maintain field mappings between filters and targets. |

> Note: `ctx.filterManager` is only available in RunJS contexts that have a `BlockGridModel` (e.g., within a page containing a filter form); it is `undefined` in regular JSBlocks or independent pages. It is recommended to use optional chaining before access.

## Type Definitions

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // Filter model UID
  targetId: string;   // Target data block model UID
  filterPaths?: string[];  // Field paths of the target block
  operator?: string;  // Filter operator
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Common Methods

| Method | Description |
|------|------|
| `getFilterConfigs()` | Gets all current filter connection configurations. |
| `getConnectFieldsConfig(filterId)` | Gets the connection field configuration for a specific filter. |
| `saveConnectFieldsConfig(filterId, config)` | Saves the connection field configuration for a filter. |
| `addFilterConfig(config)` | Adds a filter configuration (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Removes filter configurations by filterId, targetId, or both. |
| `bindToTarget(targetId)` | Binds the filter configuration to a target block, triggering its resource to apply the filter. |
| `unbindFromTarget(targetId)` | Unbinds the filter from the target block. |
| `refreshTargetsByFilter(filterId | filterId[])` | Refreshes associated target block data based on the filter(s). |

## Core Concepts

- **FilterModel**: A model providing filter conditions (e.g., FilterFormItemModel), which must implement `getFilterValue()` to return the current filter value.
- **TargetModel**: The data block being filtered; its `resource` must support `addFilterGroup`, `removeFilterGroup`, and `refresh`.

## Examples

### Add Filter Configuration

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Refresh Target Blocks

```ts
// In doFilter / doReset of a filter form
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Refresh targets associated with multiple filters
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Connection Field Configuration

```ts
// Get connection configuration
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Save connection configuration
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Remove Configuration

```ts
// Delete all configurations for a specific filter
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Delete all filter configurations for a specific target
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Related

- [ctx.resource](./resource.md): The target block's resource must support the filter interface.
- [ctx.model](./model.md): Used to get the current model's UID for filterId / targetId.