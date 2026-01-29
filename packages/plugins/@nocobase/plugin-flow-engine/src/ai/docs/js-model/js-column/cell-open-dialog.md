---
title: "Cell dialog with row data"
description: "Render a button in cell to open dialog via ctx.openView with current row context."
---

# Cell dialog with row data

Render a button in cell to open dialog via ctx.openView with current row context

```ts
// Render a button inside the cell
ctx.element.innerHTML = '<button class="nb-cell-btn" style="padding:4px 8px">' + ctx.t('View') + '</button>';

const button = ctx.element.querySelector('.nb-cell-btn');
const popupUid = ctx.model.uid + '-1'; // popupUid should be stable and better bound to ctx.model.uid
const primaryKey = ctx.collection?.primaryKey || 'id';

button?.addEventListener('click', async () => {
  await ctx.openView(popupUid, {
    mode: 'dialog',
    title: ctx.t('Row detail'),
    params: {
      filterByTk: ctx.record?.[primaryKey],
      record: ctx.record,
    },
  });
});
```
