# ctx.on()

Subscribe to context events (such as field value changes, property changes, resource refreshes, etc.) in RunJS. Events are mapped to custom DOM events on `ctx.element` or internal event bus events of `ctx.resource` based on their type.

## Use Cases

| Scenario | Description |
|------|------|
| **JSField / JSEditableField** | Listen for field value changes from external sources (forms, linkages, etc.) to synchronously update the UI, achieving two-way binding. |
| **JSBlock / JSItem / JSColumn** | Listen for custom events on the container to respond to data or state changes. |
| **resource related** | Listen for resource lifecycle events such as refresh or save to execute logic after data updates. |

## Type Definition

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Common Events

| Event Name | Description | Event Source |
|--------|------|----------|
| `js-field:value-change` | Field value modified externally (e.g., form linkage, default value update) | CustomEvent on `ctx.element`, where `ev.detail` is the new value |
| `resource:refresh` | Resource data has been refreshed | `ctx.resource` event bus |
| `resource:saved` | Resource saving completed | `ctx.resource` event bus |

> Event mapping rules: Events prefixed with `resource:` go through `ctx.resource.on`, while others typically go through DOM events on `ctx.element` (if it exists).

## Examples

### Field Two-way Binding (React useEffect + Cleanup)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Native DOM Listening (Alternative when ctx.on is unavailable)

```ts
// When ctx.on is not provided, you can use ctx.element directly
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// During cleanup: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Updating UI After Resource Refresh

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Update rendering based on data
});
```

## Coordination with ctx.off

- Listeners registered using `ctx.on` should be removed at the appropriate time via [ctx.off](./off.md) to avoid memory leaks or duplicate triggers.
- In React, `ctx.off` is typically called within the cleanup function of `useEffect`.
- `ctx.off` may not exist; it is recommended to use optional chaining: `ctx.off?.('eventName', handler)`.

## Notes

1. **Paired Cancellation**: Every `ctx.on(eventName, handler)` should have a corresponding `ctx.off(eventName, handler)`, and the `handler` reference passed must be identical.
2. **Lifecycle**: Remove listeners before the component unmounts or the context is destroyed to prevent memory leaks.
3. **Event Availability**: Different context types support different events. Please refer to the specific component documentation for details.

## Related Documentation

- [ctx.off](./off.md) - Remove event listeners
- [ctx.element](./element.md) - Rendering container and DOM events
- [ctx.resource](./resource.md) - Resource instance and its `on`/`off` methods
- [ctx.setValue](./set-value.md) - Set field value (triggers `js-field:value-change`)