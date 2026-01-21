# Observable

## Register Observable

Observable properties notify every observer when the cached value is refreshed.

```ts
ctx.defineProperty('observableValue', {
  observable: true,
  get: () => uid(),
});
```

## Refresh Observable

Use this snippet to refresh observable.

```ts
const before = ctx.observableValue;
ctx.removeCache('observableValue');
const after = ctx.observableValue;
return { before, after };
```
