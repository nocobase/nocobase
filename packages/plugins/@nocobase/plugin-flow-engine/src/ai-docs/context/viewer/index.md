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

- **Dialogs** (`@nocobase/plugin-flow-engine/context/viewer/dialog.md`, `@nocobase/plugin-flow-engine/context/viewer/dialog-header-footer.md`, `@nocobase/plugin-flow-engine/context/viewer/dialog-hook.md`): open modals with custom chrome and hook access.
- **Drawers** (`@nocobase/plugin-flow-engine/context/viewer/drawer.md`, `@nocobase/plugin-flow-engine/context/viewer/drawer-header-footer.md`, `@nocobase/plugin-flow-engine/context/viewer/drawer-hook.md`): slide-out panels with Header/Footer controls.
- **Embedded views** (`@nocobase/plugin-flow-engine/context/viewer/embed.md`, `@nocobase/plugin-flow-engine/context/viewer/embed-header-footer.md`): render content inline while still using FlowViewContext mechanics.
- **Popovers** (`@nocobase/plugin-flow-engine/context/viewer/popover.md`): show lightweight overlays without blocking the page.
- **Advanced control**:
  - `@nocobase/plugin-flow-engine/context/viewer/inherit-context.md` shows how to opt-out of parent context inheritance and delegate manually.
  - `@nocobase/plugin-flow-engine/context/viewer/concurrency.md` demonstrates opening multiple views while keeping uids isolated.

Pair `ctx.viewer` (to open the view) with `ctx.view` inside the content component to manipulate the active instance.
