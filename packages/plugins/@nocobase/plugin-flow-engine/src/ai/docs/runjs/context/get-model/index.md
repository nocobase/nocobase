# ctx.getModel()

Get any model instance in the current engine by its `uid` (e.g. BlockModel, PageModel, ActionModel). Use it in RunJS to access other blocks, pages, or action models.

If you only need the current execution context's model or block, prefer `ctx.model` or `ctx.blockModel` instead of `ctx.getModel`.

## Type Definition

```typescript
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameters

- **uid** (string): Unique identifier of the target model instance (from config or creation).
- **searchInPreviousEngines** (boolean): Optional, default `false`. When `true`, searches the view stack from top to root (useful for dialogs or nested views to get a model from an upstream engine).

## Returns

- Returns the matching `FlowModel` subclass instance (e.g. BlockModel, PageModel) if found.
- Returns `undefined` if not found.

## Notes

- By default, lookup is only in the **current engine**. With `searchInPreviousEngines: true`, lookup runs in the current engine and upstream engines (previousEngine chain), from the top of the stack; first match is returned.
- Use when you need to access another block, page, or dialog model by known `uid` (e.g. read/write its `resource`, `form`, or call `rerender`).
