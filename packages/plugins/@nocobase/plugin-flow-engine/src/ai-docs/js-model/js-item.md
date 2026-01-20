# JSItemModel

JSItemModel renders helper UI inside CreateForm/EditForm blocks. It is not bound to any field value—use it for summaries, inline hints, preview buttons, or any form-side logic that reacts to current values.

## Useful context

- `ctx.element`: container for your HTML and events.
- `ctx.form`: AntD Form instance (read/write field values, trigger validation).
- `ctx.blockModel`: listen to `formValuesChange` to rerender.
- `ctx.viewer`: open drawers/dialogs for previews.
- `ctx.api`: fetch auxiliary data.

## Example

- Real-time total preview: `@nocobase/plugin-flow-engine/src/ai-docs/js-model/example/js-item/preview.ts`

JSItemModel is read-only by design. For writable inputs, use **JSEditableFieldModel** instead.
