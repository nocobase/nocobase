# ctx.addDelegate()

`ctx.addDelegate(delegateCtx)` pushes another FlowContext onto the proxy chain so property lookups fall back to delegates. Use it whenever you need a scoped context to inherit helpers from a parent.

## Usage Patterns

- **Attach or detach delegates** (`@nocobase/plugin-flow-engine/src/ai-docs/context/add-delegate/basic.ts`):
  - `attachDelegate` calls `ctx.addDelegate`
  - `detachDelegate` calls `ctx.removeDelegate`
- **Build a delegate chain** (`@nocobase/plugin-flow-engine/src/ai-docs/context/add-delegate/basic.ts` → `chainDelegates`) to model `root → view → widget` relationships; later delegates override earlier values.

Delegates are prioritized by the order they are added: the most recently added context resolves first. Remove delegates when the scoped object unmounts to avoid stale references.
