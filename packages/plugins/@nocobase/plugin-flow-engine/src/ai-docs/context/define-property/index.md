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

:::tip
Need writable semantics? Return `observable.ref(value)` or `observable.box(value)` so callers can update via `.value`, `.get()`, or `.set()` while observers stay in sync.
:::
