---
title: "Drawer"
description: "Use ctx.viewer.drawer to implement Drawer."
---

# Drawer

## open drawer

```ts
ctx.viewer.drawer({
  uid: `${ctx.model.uid}-drawer`,
  width: 480,
  content: () => <DrawerContent />,
});
```
