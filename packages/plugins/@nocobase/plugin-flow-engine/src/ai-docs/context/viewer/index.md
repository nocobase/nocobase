# ctx.viewer

`ctx.viewer` is the command API for opening child views anywhere in a flow (models, steps, runjs snippets, etc.). It supports dialogs, drawers, popovers, and embedded layouts, with optional Header/Footer rendering and parameter passing.

## Key Methods

- `ctx.viewer.open({ type, ...options })`: generic entry point (type defaults to `drawer`).
- `ctx.viewer.dialog/options`: shorthand for dialog-only configuration.
- `ctx.viewer.drawer/options`: shorthand for drawers.
- `ctx.viewer.popover(options)` and `ctx.viewer.embed(options)` for lightweight views.

Each call accepts:
- `uid`: stable identifier for the spawned sub-model.
- `content`: component or function returning React nodes (receives `{ view }`).
- `inputArgs`: initial parameters accessible via `ctx.view.inputArgs`.
- `Header` / `Footer` render props (dialog & drawer).
- `inheritContext`: control whether the new view inherits parent delegates.

## Examples

- **Dialogs** (`@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/dialog.tsx`, `@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/dialog-header-footer.tsx`, `@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/dialog-hook.tsx`): open modals with custom chrome and hook access.
- **Drawers** (`@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/drawer.tsx`, `@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/drawer-header-footer.tsx`, `@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/drawer-hook.tsx`): slide-out panels with Header/Footer controls.
- **Embedded views** (`@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/embed.tsx`, `@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/embed-header-footer.tsx`): render content inline while still using FlowViewContext mechanics.
- **Popovers** (`@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/popover.tsx`): show lightweight overlays without blocking the page.
- **Advanced control**:
  - `@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/inherit-context.tsx` shows how to opt-out of parent context inheritance and delegate manually.
  - `@nocobase/plugin-flow-engine/src/ai-docs/context/viewer/concurrency.tsx` demonstrates opening multiple views while keeping uids isolated.

Pair `ctx.viewer` (to open the view) with `ctx.view` inside the content component to manipulate the active instance.
