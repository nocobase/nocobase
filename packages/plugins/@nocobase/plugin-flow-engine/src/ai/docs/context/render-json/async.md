---
title: "Async"
description: "Resolve async."
---

# Async

## Resolve Async

Use this snippet to resolve async.

```ts
ctx.defineProperty('asyncValue', {
  get: async () => ({ foo: 'bar' }),
});
return ctx.resolveJsonTemplate('{{ctx.asyncValue.foo}}');
```
