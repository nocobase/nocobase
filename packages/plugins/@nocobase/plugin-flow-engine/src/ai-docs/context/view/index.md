# ctx.view

`ctx.view` is injected into components opened via `ctx.viewer`. It exposes `Header`, `Footer`, `close()`, `update()`, and `inputArgs`.

## Usage Tips

- `useFlowView()` is the easiest way to retrieve the active view helpers inside React.
- Keep `viewUid` stable when opening views so nested models persist state.
- Combine `ctx.view.inputArgs` with `ctx.viewer`'s `inputArgs` option to pass parameters.
