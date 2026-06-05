# ctx.on()

Subscribe to context events in RunJS (e.g. field value change, property change, resource refresh). Events are mapped to custom DOM events on `ctx.element` or the internal event bus on `ctx.resource`.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSField / JSEditableField** | Sync UI when field value changes from outside (form, linkage); two-way binding |
| **JSBlock / JSItem / JSColumn** | Listen to custom events on the container; react to data/state changes |
| **resource** | Listen to refresh, save, etc.; run logic after data updates |

## Type

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Common Events

| Event | Description | Source |
|-------|-------------|--------|
| `js-field:value-change` | Field value changed from outside (form linkage, default value) | CustomEvent on `ctx.element`; `ev.detail` = new value |
| `resource:refresh` | Resource data refreshed | `ctx.resource` event bus |
| `resource:saved` | Resource save completed | `ctx.resource` event bus |

> Events with `resource:` prefix use `ctx.resource.on`; others typically use DOM events on `ctx.element` when present.

## Examples

### Two-way binding (React useEffect + cleanup)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Native DOM when ctx.on not available

```ts
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Cleanup: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Update UI after resource refresh

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Update render from data
});
```

## With ctx.off

- Unsubscribe with [ctx.off](./off.md) when appropriate to avoid leaks or duplicate handlers.
- In React, usually call `ctx.off` in `useEffect` cleanup.
- `ctx.off` may not exist; use optional chaining: `ctx.off?.('eventName', handler)`.

## Notes

1. **Pair with off**: Each `ctx.on(eventName, handler)` should have a matching `ctx.off(eventName, handler)` with the same `handler` reference.
2. **Lifecycle**: Remove listeners before unmount or context destroy to avoid leaks.
3. **Event support**: Different context types support different events; see component docs.

## Related

- [ctx.off](./off.md): remove listener
- [ctx.element](./element.md): container and DOM events
- [ctx.resource](./resource.md): resource and its `on`/`off`
- [ctx.setValue](./set-value.md): sets field value; triggers `js-field:value-change`
