# Sync Value

## Register Sync Value

Define a synchronous property that reads immediately without awaiting.

```ts
ctx.defineProperty('syncValue', {
  get: () => `sync-result-${uid()}`,
});
```

## Read Sync Value

Reading the property twice returns the same cached value because getters run once.

```ts
const first = ctx.syncValue;
const second = ctx.syncValue;
return { first, second };
```
