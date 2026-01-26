---
title: "Conditional required field"
description: "When 'needsApproval' is true, make 'approver' field required."
---

# Conditional required field

根据另一个字段的值动态设置必填状态

```ts
// When 'needsApproval' is true, make 'approver' field required
const needsApproval = ctx.record?.needsApproval;

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

const approverField = candidates.find((item) => item?.props?.name === 'approver');

if (approverField) {
  approverField.setProps({
    required: !!needsApproval,
    // Also toggle visibility if needed
    // display: needsApproval ? 'visible' : 'hidden',
  });
} else {
  console.warn('[Form snippet] approver field not found');
}
```
