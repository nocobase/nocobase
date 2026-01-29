# ctx.model

The current `FlowModel` instance.

## Type Definition (Simplified)

```ts
model: FlowModel;
```

> In practice, `FlowModel` has different subclasses (such as `BlockModel`, `ActionModel`, `PageModel`, etc.). Available properties and methods vary by type, so the full API is not listed here.

Common members (some may not exist on every model; for reference only):

- `uid: string`: unique model identifier, usable with `ctx.getModel(uid)` or as a filter/dialog UID binding
- `collection?: Collection`: the collection bound to the current model (if any)
- `resource?: Resource`: the resource instance associated with the current model (e.g., table, detail)
- `subModels?: Record<string, FlowModel>`: child model collection, e.g. column models inside a table or field models inside a form
- `setProps(partialProps: any): void`: update the model's UI/behavior configuration
- `dispatchEvent(event: { type: string; payload?: any }): void`: dispatch an event to the model to trigger internal logic

> Tip:
> - `ctx.model` always points to the model instance for the current flow/current block, and is the default entry point for JSBlock/JSField/Action
> - To access other blocks/actions across models, use `ctx.getModel(uid)` to get the target model instance
> - If you only care about block-level info (e.g., table/form block), use `ctx.blockModel` together
