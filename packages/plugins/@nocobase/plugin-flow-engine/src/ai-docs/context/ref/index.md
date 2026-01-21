# ctx.ref / ctx.onRefReady

- `ctx.ref` is the component ref bridge provided by `FlowModelContext`. It is populated when a React component registers itself, allowing flows to control the rendered instance.
- `ctx.onRefReady(cb)` lets any FlowRuntimeContext await the moment when the ref becomes available—handy for manipulating sub-views or third-party widgets.
