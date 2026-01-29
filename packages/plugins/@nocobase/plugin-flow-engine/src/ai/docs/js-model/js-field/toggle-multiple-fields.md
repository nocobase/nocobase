---
title: "Show/hide fields based on condition"
description: "Toggle multiple fields visibility based on a condition."
---

# Show/hide fields based on condition

Toggle multiple fields visibility based on a condition

```ts
// Show payment fields only when paymentMethod is 'online'
const paymentMethod = ctx.record?.paymentMethod;
const showPaymentFields = paymentMethod === 'online';

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

// Fields to toggle
const fieldNames = ['creditCard', 'expiryDate', 'cvv'];

fieldNames.forEach((fieldName) => {
  const field = candidates.find((item) => item?.props?.name === fieldName);
  if (field) {
    field.setProps({
      display: showPaymentFields ? 'visible' : 'hidden',
      // Also clear values when hiding
      value: showPaymentFields ? field.props.value : undefined,
    });
  }
});
```
