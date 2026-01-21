# Concurrent Async

## Register Concurrent Async

Demonstrates that concurrent reads execute the async getter only once.

```ts
ctx.defineProperty('concurrent', {
  async get() {
    callCounter.value += 1;
    await new Promise((resolve) => setTimeout(resolve, 200));
    return `concurrent-result-${uid()}`;
  },
});
```

## Read Concurrently

Use this snippet to read concurrently.

```ts
const [first, second, third] = await Promise.all([ctx.concurrent, ctx.concurrent, ctx.concurrent]);
return { first, second, third };
```
