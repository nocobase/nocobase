# ctx.view

The current view controller (page, dialog, drawer, etc.), used in JSBlock / Action to access view-level info or operations.

> Capabilities depend on the view type. This page only provides conceptual notes rather than the full API.

## Common Use Cases

- Read parameters for the current view (usually via `ctx.getVar` / `ctx.inputArgs`)
- Use with `ctx.openView` / `ctx.viewer` to control opening/closing views

- type
- inputArgs
- inputArgs.viewUid
