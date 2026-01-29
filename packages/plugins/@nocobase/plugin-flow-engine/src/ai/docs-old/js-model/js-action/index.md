# JSActionModel

JSActionModel powers JavaScript-backed buttons. Scripts run inside the Flow sandbox and can leverage all runtime helpers (resources, viewers, messages, APIs, etc.).

## Variants

- **JSCollectionActionModel** – toolbar actions for multi-select operations.
- **JSRecordActionModel** – row-level actions for a single record.

## Useful context

- `ctx.resource`: access selected rows or refresh the block.
- `ctx.record`, `ctx.filterByTk`: current row data for record actions.
- `ctx.React` / `ctx.render`: compose richer previews (useful when combining with `ctx.viewer` drawers).
- `ctx.message`, `ctx.modal`, `ctx.viewer`: UI feedback and drawers/dialogs.
- `ctx.api`: HTTP client for webhooks or remote operations.
- `ctx.runAction`, `ctx.openView`: chain into other flow actions.
