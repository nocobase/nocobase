---
title: "Toggle visible"
description: "Show or hide another field within linkage scripts."
---

# Toggle visible

Show or hide another field within linkage scripts

```ts
const targetFieldUid = 'FIELD_UID_OR_NAME';
const shouldHide = true;

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

fieldModel.setProps({ hiddenModel: shouldHide });
ctx.message?.success?.(
  ctx.t(shouldHide ? 'Hidden field {{name}}' : 'Shown field {{name}}', {
    name: fieldModel?.props?.label || targetFieldUid,
  }),
);
```
