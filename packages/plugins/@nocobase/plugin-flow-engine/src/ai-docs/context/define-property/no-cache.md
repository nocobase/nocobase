# No Cache

## Register No Cache Property

Disable cache so every read evaluates the getter again.

```ts
ctx.defineProperty('noCache', {
  cache: false,
  get: () => uid(),
});
```

## Read No Cache

Use this snippet to read no cache.

```ts
const first = ctx.noCache;
const second = ctx.noCache;
return { first, second };
```
