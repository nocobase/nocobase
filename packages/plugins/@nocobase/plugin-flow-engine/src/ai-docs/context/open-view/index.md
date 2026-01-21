# ctx.openView

`ctx.openView(uid, options)` opens a child view (dialog, drawer, or embedded) driven by a FlowModel. It reuses the built-in `openView` action, automatically creating a sub-model when the specified `uid` does not exist yet.

## Options

- `mode`: `'dialog' | 'drawer' | 'embed'` (default: `'drawer'`)
- `size`: `'small' | 'medium' | 'large'`
- `pageModelClass`: root model class, default `ChildPageModel`
- Data context: `dataSourceKey`, `collectionName`, `associationName`, `filterByTk`, `sourceId`
- `defineProperties` / `defineMethods`: inject context helpers into the opened view

Access the spawned view via `ctx.view`, and read inbound parameters from `ctx.view.inputArgs`.

## Example

- `@nocobase/plugin-flow-engine/context/open-view/example.md` opens a drawer, injects custom context properties, and waits for the view to resolve.
