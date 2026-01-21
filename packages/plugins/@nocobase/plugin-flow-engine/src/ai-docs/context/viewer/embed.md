---
title: "Embed"
description: "Use ctx.viewer.embed to implement Embed."
---

# Embed

## inline view

```ts
ctx.viewer.embed({
  uid: `${ctx.model.uid}-embed`,
  content: () => <InlinePanel />,
});
```
