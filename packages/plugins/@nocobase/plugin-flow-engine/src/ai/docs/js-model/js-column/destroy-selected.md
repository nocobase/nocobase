---
title: "Destroy selected rows"
description: "Delete selected rows via resource.destroySelectedRows()."
---

# Destroy selected rows

Delete selected rows via resource.destroySelectedRows()

```ts
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select data'));
  return;
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted {{count}} rows', { count: rows.length }));
```
