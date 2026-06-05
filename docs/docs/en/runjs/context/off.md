# ctx.off()

Removes a listener registered with `ctx.on(eventName, handler)`. Use with [ctx.on](./on.md) and unsubscribe when appropriate to avoid leaks or duplicate triggers.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **React useEffect cleanup** | Call in `useEffect` cleanup; remove on unmount |
| **JSField / JSEditableField** | Unsubscribe from `js-field:value-change` when doing two-way binding |
| **resource** | Unsubscribe from `ctx.resource.on` (refresh, saved, etc.) |

## Type

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Examples

### Pair with on in useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Unsubscribe resource event

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Later
ctx.resource?.off('refresh', handler);
```

## Notes

1. **Same handler reference**: The `handler` passed to `ctx.off` must be the same reference as in `ctx.on`, or it will not be removed.
2. **Clean up in time**: Call `ctx.off` before unmount or context destroy to avoid leaks.

## Related

- [ctx.on](./on.md): subscribe to events
- [ctx.resource](./resource.md): resource and its `on`/`off`
