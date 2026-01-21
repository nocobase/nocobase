# RunJS Reference For JS Models

RunJS lets you extend blocks, actions, fields, and table columns without shipping a plugin. It shares the same capabilities described in `docs/docs/en/interface-builder/runjs.md`, but this index focuses on the AI-facing snippets stored under `@nocobase/plugin-flow-engine/js-model`.

## Quick Start

- **Execution environment** – every script runs inside a Flow sandbox. `ctx.React`, `ctx.libs.antd`, `ctx.viewer`, `ctx.api`, and all other context APIs are available exactly as they are in the interface builder.
- **Copy-ready snippets** – the dedicated docs (below) show raw `ctx.*` statements rather than wrapped functions. Paste them as-is into a JS block/action/field and adjust UIDs or collection names.
- **Async behavior** – use `await` whenever you touch `ctx.resource.refresh`, `ctx.sql.run`, or any observable property created via `ctx.defineProperty`.

## Available Guides

- [`@nocobase/plugin-flow-engine/js-model/js-block.md`](./js-block.md) – end-to-end recipes for JS blocks, including React-driven layouts and Ant Design integrations.
- [`@nocobase/plugin-flow-engine/js-model/js-action.md`](./js-action.md) – how to wire JSCollectionActionModel / JSRecordActionModel with drawers, notifications, or remote APIs.
- [`@nocobase/plugin-flow-engine/js-model/js-field.md`](./js-field.md) – read-only and editable field snippets that format values, open views, or embed custom widgets.
- [`@nocobase/plugin-flow-engine/js-model/js-column.md`](./js-column.md) – preset CRM tables with identity, health, pipeline, and ticket-status renderers.
- [`@nocobase/plugin-flow-engine/js-model/js-item.md`](./js-item.md) – form-side helpers for totals, hints, and previews.
- [`@nocobase/plugin-flow-engine/js-model/js-filter.md`](./js-filter.md) – toolbar chips that push filters to other blocks.
- Example directories under `js-model/example/*/*.md` contain complete snippets (toolbar setups, modal editors, chart renderers) referenced by the guides above.

## Usage Tips

- Prefer referencing the snippet’s canonical path when using the docs tool or prompting the AI (for example: `@nocobase/plugin-flow-engine/js-model/example/js-block/multi-record.md`).
- Keep DOM mutations inside `ctx.element` or call `ctx.render(<Component />)` so the sandbox can dispose components properly.
- Avoid external imports—everything you need (React, Ant Design, dayjs, Flow helpers) is already exposed on `ctx` or `ctx.libs`.
