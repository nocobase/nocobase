# Remove Cache

## Register Manual Cache

Clear cache manually when data changes externally.

```ts
ctx.defineProperty('cached', {
  get: () => uid(),
});
```

## Refresh Cache

Use this snippet to refresh cache.

```ts
const before = ctx.cached;
ctx.removeCache('cached');
const after = ctx.cached;
return { before, after };
```
