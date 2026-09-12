# ctx.getModel()

Retrieves a model instance (such as `BlockModel`, `PageModel`, `ActionModel`, etc.) from the current engine or view stack based on the model `uid`. This is used in RunJS to access other models across blocks, pages, or popups.

If you only need the model or block where the current execution context is located, prioritize using `ctx.model` or `ctx.blockModel` instead of `ctx.getModel`.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSAction** | Get models of other blocks based on a known `uid` to read or write their `resource`, `form`, `setProps`, etc. |
| **RunJS in Popups** | When needing to access a model on the page that opened the popup, pass `searchInPreviousEngines: true`. |
| **Custom Actions** | Locate forms or sub-models in the configuration panel by `uid` across view stacks to read their configuration or state. |

## Type Definition

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameters

| Parameter | Type | Description |
|------|------|------|
| `uid` | `string` | The unique identifier of the target model instance, specified during configuration or creation (e.g., `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Optional, defaults to `false`. When `true`, searches from the current engine up to the root in the "view stack," allowing access to models in upper-level engines (e.g., the page that opened a popup). |

## Return Value

- Returns the corresponding `FlowModel` subclass instance (e.g., `BlockModel`, `FormBlockModel`, `ActionModel`) if found.
- Returns `undefined` if not found.

## Search Scope

- **Default (`searchInPreviousEngines: false`)**: Searches only within the **current engine** by `uid`. In popups or multi-level views, each view has an independent engine; by default, it only searches for models within the current view.
- **`searchInPreviousEngines: true`**: Searches upwards along the `previousEngine` chain starting from the current engine, returning the first match. This is useful for accessing a model on the page that opened the current popup.

## Examples

### Get another block and refresh

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Access a model on the page from a popup

```ts
// Access a block on the page that opened the current popup
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Cross-model read/write and trigger rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Safety check

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Target model does not exist');
  return;
}
```

## Related

- [ctx.model](./model.md): The model where the current execution context is located.
- [ctx.blockModel](./block-model.md): The parent block model where the current JS is located; usually accessible without needing `getModel`.