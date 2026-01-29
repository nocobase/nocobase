# JSBlockModel

JSBlockModel renders fully custom content inside a Flow model. The script runs with the full FlowContext, so you can access resources, SQL helpers, viewers, and actions exactly as native blocks do.

## When to use

- Build dashboards/widgets that combine multiple collections.
- Prototype bespoke layouts (charts, tables, buttons) before converting them into plugins.
- Drive advanced workflows by calling `ctx.runAction('openView', ...)` or other Flow actions directly from JavaScript.

## Useful context

- `ctx.element`: sandboxed container for your DOM.
- `ctx.React` / `ctx.libs.React`: React runtime (no imports needed); `ctx.libs.antd` exposes Ant Design components/icons.
- `ctx.render(node)`: mount a React node/string/DOM fragment into the block container.
- `ctx.useResource(name)`: bootstrap `MultiRecordResource`, `SingleRecordResource`, or `SQLResource`.
- `ctx.sql.save/run`: register or execute SQL when `flowSettingsEnabled`.
- `ctx.viewer`, `ctx.openView`, `ctx.runAction`: open drawers/dialogs.
- `ctx.message`, `ctx.notification`, `ctx.modal`: provide UI feedback.
