---
title: "Set Current Field Value (ctx.setValue)"
description: "Update the current field value in JSField/JSItem and keep it in sync with form state."
---

# Set Current Field Value

```ts
// Set the current field to a fixed default value
ctx.setValue('DEFAULT');

// Restore a placeholder default when input is empty
if (!ctx.getValue()) {
  ctx.setValue('N/A');
}

// Update the current field value dynamically based on other variables
const next = String(externalValue ?? '');
ctx.setValue(next);
```

> Tip:
> - `ctx.setValue(v)` updates the field value in the form and triggers change logic (validation, linkage, etc.)
> - Usually used with `ctx.getValue()`: read the current value first, then write a new value based on business rules
