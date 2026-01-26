---
title: "Calculate total price (quantity × price)"
description: "Automatically calculate total when quantity or unit price changes."
---

# Calculate total price (quantity × price)

Automatically calculate total when quantity or unit price changes

```ts
// Get quantity and unit price from current record
const quantity = Number(ctx.record?.quantity) || 0;
const unitPrice = Number(ctx.record?.unitPrice) || 0;
const total = quantity * unitPrice;

// Find and update the 'totalPrice' field
const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

const totalField = candidates.find((item) => item?.props?.name === 'totalPrice');

if (totalField) {
  totalField.setProps({ value: total.toFixed(2) });
} else {
  console.warn('[Form snippet] totalPrice field not found');
}
```
