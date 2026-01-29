---
title: "Iterate selected rows"
description: "Loop through selected rows and process each record."
---

# Iterate selected rows

Loop through selected rows and process each record

```ts
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(ctx.t('Selected row:'), row);
}
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```
