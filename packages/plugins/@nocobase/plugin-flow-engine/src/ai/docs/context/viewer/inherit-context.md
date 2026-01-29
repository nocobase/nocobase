---
title: "Inherit Context"
description: "Use ctx.viewer.drawer to implement Inherit Context."
---

# Inherit Context

## opt out of inheritance

```ts
ctx.viewer.drawer({
  inheritContext: false,
  content: () => <IndependentView />,
});
```
