# ctx.addDelegate()

`ctx.addDelegate(delegateCtx)` pushes another FlowContext onto the proxy chain so property lookups fall back to delegates. Use it whenever you need a scoped context to inherit helpers from a parent.

## Usage Patterns

  - `attachDelegate` calls `ctx.addDelegate`
  - `detachDelegate` calls `ctx.removeDelegate`

Delegates are prioritized by the order they are added: the most recently added context resolves first. Remove delegates when the scoped object unmounts to avoid stale references.
