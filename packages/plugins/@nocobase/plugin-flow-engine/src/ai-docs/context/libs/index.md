# ctx.libs and React helpers

Flow run-time injects React, ReactDOM, Ant Design, dayjs, and icons directly into the context so scripts can render JSX without importing anything. Use these helpers instead of `import React from 'react'`—the sandbox already wires everything up and guarantees version compatibility.

## Key properties

- `ctx.React` / `ctx.libs.React`: React namespace with hooks, `createElement`, and `Fragment`. Works with JSX compiled by `compileRunJs`.
- `ctx.ReactDOM` / `ctx.libs.ReactDOM`: ReactDOM client with a patched `createRoot` that inherits the current app theme/config providers.
- `ctx.libs.antd`: Ant Design components (Button, Table, Modal, Form, etc.).
- `ctx.libs.antdIcons`: Ant Design icons namespace.
- `ctx.libs.dayjs`: date utilities for formatting.
- `ctx.render(node, container?)`: mount a React element, DOM node, or HTML string into `ctx.element` (or any ElementProxy).

## Usage patterns

- Render a modal-editable table using only `ctx.React`, `ctx.libs.antd`, and `ctx.render`: `@nocobase/plugin-flow-engine/js-model/example/js-block/editable-modal-table.md`.
- Build live previews inside fields/items by combining `ctx.React` with `ctx.message` for feedback.
- When you need plain DOM (no React), still call `ctx.render('<div>raw HTML</div>')` so the engine manages unmounting safely.

Never import React or Ant Design manually inside JS blocks—doing so bloats bundles and fails in the sandbox. Always rely on `ctx.libs.*` and the helper docs above.
