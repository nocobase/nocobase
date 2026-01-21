# Async Value

## Register Async Value

Register an asynchronous property that resolves after I/O.

```ts
ctx.defineProperty('asyncValue', {
  async get() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return `async-result-${uid()}`;
  },
});
```

## Read Async Value

Always await async properties; they cannot be read during render directly.

```ts
return await ctx.asyncValue;
```
