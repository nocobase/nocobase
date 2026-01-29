# JSItemModel

JSItemModel renders helper UI inside CreateForm/EditForm blocks. It is not bound to any field value—use it for summaries, inline hints, preview buttons, or any form-side logic that reacts to current values.

## Useful context

- `ctx.element`: container for your HTML, React nodes, and events.
- `ctx.React` / `ctx.libs.React`: render JSX without importing React.
- `ctx.form`: AntD Form instance (read/write field values, trigger validation).
- `ctx.blockModel`: listen to `formValuesChange` to rerender.
- `ctx.viewer`: open drawers/dialogs for previews.
- `ctx.api`: fetch auxiliary data.
