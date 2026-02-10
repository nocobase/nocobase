# ctx.getModel()

Get any model instance in the current engine by model `uid` (e.g. BlockModel, PageModel, ActionModel). Use it to access other blocks/pages/actions from RunJS.

If you only need the model of the current context, prefer `ctx.model` or `ctx.blockModel`.

## Type definition

```typescript
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameters

| Parameter | Type | Description |
|------|------|------|
| `uid` | string | Unique identifier of the target model instance |
| `searchInPreviousEngines` | boolean | Optional, default `false`. When `true`, search from the top of the view stack to root (useful for modals, multi-level views, etc.) |

## Return value

- Returns a `FlowModel` subclass instance (e.g. `BlockModel`, `PageModel`) if found
- Returns `undefined` if not found

## Notes

- By default, it searches only within the **current engine** by `uid`. When `searchInPreviousEngines: true`, it searches the current engine and upstream engines (previousEngine chain), starting from the top of the stack.
- Useful when you need to access models across blocks/pages/modals by a known `uid` (e.g. get another block model and read/write its `resource` or `form`).

## Example

```javascript
// Search only in current engine
const block = ctx.getModel('block-uid-xxx');
if (block) {
  console.log(block.uid, block.resource?.getData?.());
}

// Search in view stack (e.g. modal needs to access a page model)
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

## Tips

- In JS Action / JS Field, use `ctx.getModel` for advanced control of other models.
- If you only need the current model or block, prefer `ctx.model` or `ctx.blockModel`.
