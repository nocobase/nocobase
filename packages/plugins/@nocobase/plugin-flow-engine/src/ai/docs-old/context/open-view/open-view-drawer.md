---
title: "Open view (drawer)"
description: "Open a view in drawer via ctx.openView."
---

# Open view (drawer)

Open a view in drawer via ctx.openView

```ts
// Open a view as drawer and pass arguments at top-level
const popupUid = ctx.model.uid + '-1'; // popupUid should be stable and better bound to ctx.model.uid
await ctx.openView(popupUid, {
  mode: 'drawer',
  title: ctx.t('Sample drawer'),
  size: 'large',
});
```
