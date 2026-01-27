---
title: "Dialog"
description: "Use ctx.viewer.dialog to implement Dialog."
---

# Dialog

## open dialog

```ts
ctx.viewer.dialog({
  uid: `${ctx.model.uid}-dialog`,
  content: () => <DialogContent />,
  inputArgs: { recordId: ctx.record?.id },
  closeOnEsc: true,
});
```
