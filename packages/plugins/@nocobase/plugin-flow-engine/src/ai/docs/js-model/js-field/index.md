# JSFieldModel

JSFieldModel renders read-only content inside DetailsBlock or TableBlock cells. Scripts can access the current field value, the full record, collection metadata, viewers, APIs, and translation helpers.

## Useful context

- `ctx.element`: sandboxed container (write HTML, bind events).
- `ctx.value`: current field value; use `ctx.record` for other columns.
- `ctx.React` / `ctx.libs.React`: render custom components without importing React.
- `ctx.viewer`, `ctx.openView`: open drawers/dialogs/popovers.
- `ctx.api`: fetch remote data before rendering.
- `ctx.t`: translate inline labels.

# JSEditableFieldModel

JSEditableFieldModel builds fully custom inputs while staying in sync with Ant Design Form.

- `ctx.element`: container for the widget.
- `ctx.getValue()/ctx.setValue(value)`: two-way binding with the form.
- `ctx.form`: read/update other fields or trigger validation.
- `ctx.viewer`, `ctx.api`: reuse Flow helpers (drawers/dialogs/HTTP).

Typical use cases: remote-select inputs, bespoke pickers, complex validation flows, or preview buttons embedded inside the form.
