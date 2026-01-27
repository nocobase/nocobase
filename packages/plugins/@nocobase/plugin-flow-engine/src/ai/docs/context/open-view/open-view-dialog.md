---
title: "Open view (dialog)"
description: "Open a view in dialog via ctx.openView."
---

# Open view (dialog)

Open a view in dialog via ctx.openView

```ts
// Open a view as dialog and pass arguments at top-level
const popupUid = ctx.model.uid + '-1'; // popupUid should be stable and better bound to ctx.model.uid
await ctx.openView(popupUid, {
  mode: 'dialog',
  title: ctx.t('Sample dialog'),
  size: 'medium',
});
```
