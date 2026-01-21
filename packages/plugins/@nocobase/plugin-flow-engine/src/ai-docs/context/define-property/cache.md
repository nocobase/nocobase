# Cache

## Register Cached Property

Cached properties execute the getter once and reuse the stored value.

```ts
ctx.defineProperty('cached', {
  get: () => uid(),
  // cache defaults to true
});
```

## Read Cached Property

Use this snippet to read cached property.

```ts
const first = ctx.cached;
const second = ctx.cached;
return { first, second };
```
