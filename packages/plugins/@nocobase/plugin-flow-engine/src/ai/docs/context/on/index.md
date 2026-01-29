# ctx.on()

Subscribe to context events in RunJS (e.g., field value changes, property changes, resource refresh).

> Events are ultimately mapped to custom events on `ctx.element` or an internal event bus. Refer to component docs for specific event names.

## Type Definition (Simplified)

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Common Event Examples

- `js-field:value-change`: custom field value change
- `resource:refresh`: resource refresh

## Examples

```ts
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```
