# ctx.filterManager

`ctx.filterManager` lives on `BlockGridModelContext` and orchestrates connections between filter blocks and the target blocks whose resources should react to filter changes.

- **Filter models** must expose `getFilterValue()` to describe their current criteria.
- **Target models** must define `context.resource` objects that support filtering (`supportsFilter: true`, `addFilterGroup()` implemented). Built-in resources such as `MultiRecordResource`, `SingleRecordResource`, and `SQLResource` already provide these capabilities.

## Filter links API

- `addFilterConfig({ filterId, targetId, filterPaths, operator })` registers a relationship.
- `removeFilterConfig({ filterId?, targetId? })` drops matching links.
- `bindToTarget(targetId)` / `unbindFromTarget(targetId)` attach the configs to a model.
- `refreshTargetsByFilter(filterId | filterId[])` recomputes target filters for specific filter blocks.

## Example
