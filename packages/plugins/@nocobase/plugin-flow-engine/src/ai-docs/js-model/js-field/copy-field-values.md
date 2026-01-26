---
title: "Copy value from another field"
description: "Copy value from one field to another when checkbox is checked."
---

# Copy value from another field

Copy value from one field to another when checkbox is checked

```ts
// When 'sameAsAbove' is checked, copy billing address to shipping address
const sameAsAbove = ctx.record?.sameAsAbove;

if (!sameAsAbove) {
  return;
}

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

// Source and target field mappings
const fieldMappings = [
  { from: 'billingAddress', to: 'shippingAddress' },
  { from: 'billingCity', to: 'shippingCity' },
  { from: 'billingZipCode', to: 'shippingZipCode' },
];

fieldMappings.forEach(({ from, to }) => {
  const sourceValue = ctx.record?.[from];
  const targetField = candidates.find((item) => item?.props?.name === to);

  if (targetField) {
    targetField.setProps({ value: sourceValue });
  }
});

ctx.message?.success?.(ctx.t('Address copied successfully'));
```
