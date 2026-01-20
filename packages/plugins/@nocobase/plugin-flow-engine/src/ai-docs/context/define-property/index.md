# ctx.defineProperty()

FlowContext centralizes all contextual properties. `ctx.defineProperty()` registers a getter for a property (sync or async) and adds cache, observability, and `once` controls so AI/automation callers can reason about available data.

## API Summary

```ts
ctx.defineProperty({
  key?: string;        // defaults to getter name
  get: () => T | Promise<T>;
  cache?: boolean;     // defaults to true
  observable?: boolean;
  once?: boolean;
});
```

- **Sync properties** resolve immediately and can be read directly.
- **Async properties** return a Promise; consumers must `await` (combine with loading states when needed).
- **Cache** stores the first result by default; set `cache: false` to recompute every time or call `ctx.removeCache(key)` manually.
- **Concurrency guard** ensures multiple parallel reads of the same async property run the getter only once.
- **Observable** pushes updates to all observers when `observable: true`; combine with `observable.ref()` / `observable.box()` for writable reactive values.
- **once** (`once: true`) accepts only the first definition of a property name, preventing accidental overrides.

## Usage Patterns

- **Sync value** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/sync-value.ts`): basic synchronous getter returning a string literal.
- **Async value** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/async-value.ts`): demonstrates awaiting an asynchronous getter result.
- **Concurrent async** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/concurrent-async.ts`): shows that parallel reads share the cached promise.
- **Cache control** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/cache.ts`, `@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/remove-cache.ts`, `@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/no-cache.ts`): enable/disable caching and clear cache entries explicitly.
- **Observable property** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/observable.ts`): toggles `observable: true` so observers react to changes.
- **Observable ref & box** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/observable-ref-box.ts`): compares `observable.ref()` with `observable.box()` for writable state.
- **Async value without cache** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/no-cache.ts`): forces re-computation for each access when `cache: false`.
- **Once-only definition** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/once.ts`): enforces `once: true` so the first declaration wins.
- **Metadata tree** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-property/meta.ts`): inspects `ctx.meta()` to list available context properties.

:::tip
Need writable semantics? Return `observable.ref(value)` or `observable.box(value)` so callers can update via `.value`, `.get()`, or `.set()` while observers stay in sync.
:::
