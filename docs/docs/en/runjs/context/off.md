# ctx.off()

Remove an event listener registered via `ctx.on(eventName, handler)`.

> Usually used with `ctx.on` to unsubscribe at the right time and avoid leaks or duplicate triggers.

## Type definition (simplified)

```ts
off(eventName: string, handler: (...args: any[]) => void): void;
```

## Example

```ts
const handler = (ev) => {
  console.log('Value changed', ev?.detail);
};

ctx.on('js-field:value-change', handler);

// Remove listener at the right time
ctx.off('js-field:value-change', handler);
```
