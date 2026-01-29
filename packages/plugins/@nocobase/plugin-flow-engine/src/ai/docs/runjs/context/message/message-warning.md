---
title: "Show Warning Message"
description: "Use ctx.message.warning to show a warning toast"
---

# Show Warning Message

Use `ctx.message.warning()` to show a warning toast.

## Basic Usage

```javascript
ctx.message.warning(ctx.t('Please select at least one row'));
```

## Use in conditional checks

```javascript
if (!selectedRows || selectedRows.length === 0) {
  ctx.message.warning(ctx.t('Please select data'));
  return;
}

// Continue processing selected data
ctx.message.success(ctx.t('Processed {{count}} rows', { count: selectedRows.length }));
```

## Show field-not-found warning

```javascript
const field = ctx.form.queryFieldByUid(fieldUid);
if (!field) {
  ctx.message.warning(ctx.t('Field {{name}} not found', { name: fieldUid }));
  return;
}
```
