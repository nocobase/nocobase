---
title: "Selected count"
description: "Show number of selected rows in list action."
---

# Selected count

Show number of selected rows in list action

```ts
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select data'));
} else {
  ctx.message.success(ctx.t('Selected {{count}} rows', { count: rows.length }));
}
```
