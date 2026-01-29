---
title: "Export selected rows as JSON"
description: "Download selected rows as a JSON file."
---

# Export selected rows as JSON

Download selected rows as a JSON file

```ts
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select at least one row'));
  return;
}

// Create JSON file and download
const jsonStr = JSON.stringify(rows, null, 2);
const blob = new Blob([jsonStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `export-${new Date().toISOString().split('T')[0]}.json`;
link.click();
URL.revokeObjectURL(url);

ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```
