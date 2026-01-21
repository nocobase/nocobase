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

## Examples

- Multi-record resource rendering: `@nocobase/plugin-flow-engine/js-model/example/js-block/multi-record.md`
- SQL-backed block (save + run): `@nocobase/plugin-flow-engine/js-model/example/js-block/sql-block.md`
- Chart rendering with `ctx.requireAsync`: `@nocobase/plugin-flow-engine/js-model/example/js-block/chart.md`
- Button-triggered `openView`: `@nocobase/plugin-flow-engine/js-model/example/js-block/open-view.md`
- Editable modal table that relies on `ctx.React`, `ctx.render`, and Ant Design without importing React: `@nocobase/plugin-flow-engine/js-model/example/js-block/editable-modal-table.md`

Author scripts should keep DOM manipulation inside `ctx.element`, rely on Flow resources for data, and delegate persistence to existing actions wherever possible. When copying an example, keep only the snippet body—never import `React` or `FlowModel`. Use `ctx.React`/`ctx.libs` directly so the runtime can inject the correct version.

Need a full reference of injected libraries? See `@nocobase/plugin-flow-engine/context/libs/index.md`.
