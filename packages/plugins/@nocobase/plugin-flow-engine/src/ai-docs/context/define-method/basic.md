---
title: "Register Method"
description: "Register method."
---

# Basic

## Register Method

Use this snippet to register method.

```ts
ctx.defineMethod('add', (a, b) => a + b);
```

## Call Defined Method

Use this snippet to call defined method.

```ts
const method = ctx.methods['add'];
return method?.(a, b);
```
