---
title: "Multi Record"
description: "Code."
---

# Multi Record

## Code

Use this snippet to code.

```ts
ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();

ctx.element.innerHTML = `<pre>${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>`;
```
