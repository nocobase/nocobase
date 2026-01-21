# ctx.model

`ctx.model` references the active `FlowModel` instance. Use it to read props, set state, dispatch events, or access nested sub-models from within flow steps.

## Example

- `@nocobase/plugin-flow-engine/context/model/basic.md` reads `ctx.model.props`, updates data through `ctx.model.setProps`, and triggers events on the running model.
