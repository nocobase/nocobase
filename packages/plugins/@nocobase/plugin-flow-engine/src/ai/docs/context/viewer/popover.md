---
title: "Popover"
description: "Use ctx.viewer.popover to implement Popover."
---

# Popover

## open popover

```ts
ctx.viewer.popover({
  uid: `${ctx.model.uid}-popover`,
  placement: 'right',
  content: () => <PreviewCard record={ctx.record} />,
});
```
