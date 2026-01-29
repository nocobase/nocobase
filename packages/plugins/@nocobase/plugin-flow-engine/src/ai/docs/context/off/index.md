# ctx.off()

Remove an event listener registered with `ctx.on(eventName, handler)`.

> Often used with `ctx.on` to clean up subscriptions and avoid memory leaks or duplicate triggers.

## Type Definition (Simplified)

```ts
off(eventName: string, handler: (...args: any[]) => void): void;
```

## Examples

```ts
const handler = (ev) => {
  console.log('value changed', ev?.detail);
};

ctx.on('js-field:value-change', handler);

// Remove the listener when appropriate
ctx.off('js-field:value-change', handler);
```
