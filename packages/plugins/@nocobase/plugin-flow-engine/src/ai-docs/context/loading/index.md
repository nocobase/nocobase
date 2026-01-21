# Managing async context loading states

Whenever you access `ctx.<asyncProperty>`, prefer awaiting it inside hooks that already support async so the Flow engine can manage loading indicators automatically.

## Model hooks

- Use `onDispatchEventStart/End` for `beforeRender` to resolve async context values right before rendering.
- Avoid `async` work inside `onInit`, `onMount`, `render`, etc.—they are synchronous.
- Example: `@nocobase/plugin-flow-engine/context/loading/hooks.md` defines `LoadingAwareModel` that awaits `ctx.asyncProfile` inside `onDispatchEventStart`.

## Flow steps

- `uiSchema`, `defaultParams`, and `handler` in a step can be `async`; just `await ctx.asyncProperty` inside.
- Loading state is propagated automatically to the runtime UI.

## React components

- Wrap async reads with existing hooks (`useRequest`, SWR, etc.) to track loading / error UI yourself.
- The helper `awaitAsyncProperty` in `@nocobase/plugin-flow-engine/context/loading/hooks.md` shows the simplest pattern.
