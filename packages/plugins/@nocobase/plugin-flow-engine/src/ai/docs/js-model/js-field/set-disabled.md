---
title: "Set disabled"
description: "Enable or disable another field in linkage scripts."
---

# Set disabled

Enable or disable another field in linkage scripts

```ts
const targetFieldUid = 'FIELD_UID_OR_NAME';
const disabled = true;

const items = ctx.model?.subModels?.grid?.subModels?.items;
const candidates = Array.isArray(items)
  ? items
  : Array.from(items?.values?.() || items || []);
const fieldModel =
  candidates.find((item) => item?.uid === targetFieldUid) ||
  candidates.find((item) => item?.props?.name === targetFieldUid);

if (!fieldModel) {
  ctx.message?.warning?.(ctx.t('Field {{name}} not found', { name: targetFieldUid }));
  return;
}

fieldModel.setProps({ disabled });
ctx.message?.success?.(
  ctx.t(disabled ? 'Disabled field {{name}}' : 'Enabled field {{name}}', {
    name: fieldModel?.props?.label || targetFieldUid,
  }),
);
```
