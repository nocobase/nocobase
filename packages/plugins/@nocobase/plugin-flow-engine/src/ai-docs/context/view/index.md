# ctx.view

`ctx.view` is injected into the content tree of any view opened via `ctx.viewer`. It represents the currently active dialog/drawer/embed instance and exposes helpers such as `Header`, `Footer`, `close()`, and `update()`.

- Available only inside components rendered by the view’s `content` function (or via `useFlowView()`).
- Works for `dialog`, `drawer`, `popover`, and `embed` views (Header/Footer currently dialog + drawer only).

## Usage Patterns

- **Hook access** (`@nocobase/plugin-flow-engine/context/view/dialog-hook.md`): use `useFlowView()` to grab `Header`, `Footer`, and `close`.
- **Parameter passing** (`@nocobase/plugin-flow-engine/context/view/input-args.md`): read `ctx.view.inputArgs` to drive the content.
- **Delegating FlowViewContext** (`@nocobase/plugin-flow-engine/context/view/model.md`): forward the view context to another model via `delegate` when you instantiate sub-models.

When opening a view, keep the `uid` stable (e.g., `${ctx.model.uid}-drawer`) so repeated opens reuse the same sub-model and state.
