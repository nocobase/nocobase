# ctx.on()

Subscribe to context events in RunJS (e.g. field value change, property change, resource refresh).

> Events are mapped to custom events on `ctx.element` or an internal event bus. Refer to component docs for available event names.

## Type definition (simplified)

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Common event examples

- `js-field:value-change`: custom field value change
- `resource:refresh`: resource refresh

## Example

```ts
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```
