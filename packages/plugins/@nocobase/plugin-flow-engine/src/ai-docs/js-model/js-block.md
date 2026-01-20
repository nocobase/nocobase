# JSBlockModel

JSBlockModel renders fully custom content inside a Flow model. The script runs with the full FlowContext, so you can access resources, SQL helpers, viewers, and actions exactly as native blocks do.

## When to use

- Build dashboards/widgets that combine multiple collections.
- Prototype bespoke layouts (charts, tables, buttons) before converting them into plugins.
- Drive advanced workflows by calling `ctx.runAction('openView', ...)` or other Flow actions directly from JavaScript.

## Useful context

- `ctx.element`: sandboxed container for your DOM.
- `ctx.useResource(name)`: bootstrap `MultiRecordResource`, `SingleRecordResource`, or `SQLResource`.
- `ctx.sql.save/run`: register or execute SQL when `flowSettingsEnabled`.
- `ctx.viewer`, `ctx.openView`, `ctx.runAction`: open drawers/dialogs.
- `ctx.message`, `ctx.notification`, `ctx.modal`: provide UI feedback.

## Examples

- Multi-record resource rendering: `@nocobase/plugin-flow-engine/src/ai-docs/js-model/example/js-block/multi-record.ts`
- SQL-backed block (save + run): `@nocobase/plugin-flow-engine/src/ai-docs/js-model/example/js-block/sql-block.ts`
- Chart rendering with `ctx.requireAsync`: `@nocobase/plugin-flow-engine/src/ai-docs/js-model/example/js-block/chart.ts`
- Button-triggered `openView`: `@nocobase/plugin-flow-engine/src/ai-docs/js-model/example/js-block/open-view.ts`
Author scripts should keep DOM manipulation inside `ctx.element`, rely on Flow resources for data, and delegate persistence to existing actions wherever possible.
