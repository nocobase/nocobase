# ctx.model

The current `FlowModel` instance.

## Type definition (simplified)

```ts
model: FlowModel;
```

> In practice, `FlowModel` has different subclasses (e.g. `BlockModel`, `ActionModel`, `PageModel`). Available properties and methods vary by type and are not listed exhaustively here.

Common members (not all models have them):

- `uid: string` - unique model identifier, can be used with `ctx.getModel(uid)` or as a filter/modal UID binding
- `collection?: Collection` - collection bound to the model (if any)
- `resource?: Resource` - resource instance associated with the model (e.g. table, detail)
- `subModels?: Record<string, FlowModel>` - sub-models, such as column models in tables or field models in forms
- `setProps(partialProps: any): void` - update UI/behavior config of the model
- `dispatchEvent(event: { type: string; payload?: any }): void` - dispatch event to trigger internal logic

> Tips:
> - `ctx.model` always points to the current flow/block model and is the default entry for JSBlock/JSField/Action
> - Use `ctx.getModel(uid)` to access other blocks/actions across models
> - If you only need block-level info (table/form), use `ctx.blockModel`
