# ctx.off()

Removes event listeners registered via `ctx.on(eventName, handler)`. It is often used in conjunction with [ctx.on](./on.md) to unsubscribe at the appropriate time, preventing memory leaks or duplicate triggers.

## Use Cases

| Scenario | Description |
|------|------|
| **React useEffect Cleanup** | Called within the `useEffect` cleanup function to remove listeners when the component unmounts. |
| **JSField / JSEditableField** | Unsubscribe from `js-field:value-change` during two-way data binding for fields. |
| **Resource Related** | Unsubscribe from listeners like `refresh` or `saved` registered via `ctx.resource.on`. |

## Type Definition

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Examples

### Paired usage in React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Unsubscribing from resource events

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// At the appropriate time
ctx.resource?.off('refresh', handler);
```

## Notes

1. **Consistent handler reference**: The `handler` passed to `ctx.off` must be the same reference as the one used in `ctx.on`; otherwise, it cannot be correctly removed.
2. **Timely cleanup**: Call `ctx.off` before the component unmounts or the context is destroyed to avoid memory leaks.

## Related Documents

- [ctx.on](./on.md) - Subscribe to events
- [ctx.resource](./resource.md) - Resource instance and its `on`/`off` methods