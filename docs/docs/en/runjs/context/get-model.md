# ctx.getModel()

Returns a model instance (e.g. BlockModel, PageModel, ActionModel) from the current engine or view stack by its `uid`. Use in RunJS to access other models across blocks, pages, or popups.

If you only need the model or block for the current execution context, use `ctx.model` or `ctx.blockModel` instead of `ctx.getModel`.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / JSAction** | Get another block’s model by known `uid`; read/write its `resource`, `form`, `setProps`, etc. |
| **RunJS inside popup** | Access a model on the page that opened the popup; pass `searchInPreviousEngines: true` |
| **Custom actions** | Find a form or sub-model in the settings panel across the view stack by `uid` |

## Type

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `uid` | `string` | Unique id of the target model (e.g. from config or creation) |
| `searchInPreviousEngines` | `boolean` | Optional, default `false`. When `true`, search up the view stack from the current engine to find models in parent views (e.g. the page that opened the popup) |

## Return value

- Returns the corresponding `FlowModel` subclass (e.g. `BlockModel`, `FormBlockModel`, `ActionModel`) if found.
- Returns `undefined` if not found.

## Search scope

- **Default (`searchInPreviousEngines: false`)**: Search only in the **current engine** by `uid`. In popups or nested views, each view has its own engine; by default only the current view is searched.
- **`searchInPreviousEngines: true`**: Search from the current engine along the `previousEngine` chain; returns the first match. Use when RunJS in a popup needs to access a model on the page that opened it.

## Examples

### Get another block and refresh

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Access page model from inside popup

```ts
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Cross-model update and rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Null check

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Target model not found');
  return;
}
```

## Related

- [ctx.model](./model.md): model for current execution context
- [ctx.blockModel](./block-model.md): parent block of current JS; often no need for `getModel`
