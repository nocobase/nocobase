---
title: "Get Model in Current Engine"
description: "Use ctx.getModel(uid) to get a model instance in the current engine only."
---

# Get Model in Current Engine

Use `ctx.getModel(uid)` to look up a model only in the current engine. Omit the second argument or pass `false`.

```ts
const block = ctx.getModel('block-uid-xxx');
if (block) {
  console.log(block.uid, block.resource?.getData?.());
}
```
