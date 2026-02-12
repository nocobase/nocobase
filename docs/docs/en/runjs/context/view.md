# ctx.view

The current view controller (page, modal, drawer, etc.). Use it in JSBlock / Action to access view-level info or operations.

> Capabilities vary by view type; this is only a conceptual overview.

## Common scenarios

- Read current view params (usually via `ctx.getVar` / `ctx.inputArgs`)
- Use `ctx.openView` / `ctx.viewer` to open/close views

Common properties include: `type`, `inputArgs`, `inputArgs.viewUid`, etc.
