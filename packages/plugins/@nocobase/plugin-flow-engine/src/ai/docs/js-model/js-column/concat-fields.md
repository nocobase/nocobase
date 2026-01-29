---
title: "Concat two fields"
description: "Combine two field values into the current column cell."
---

# Concat two fields

Combine two field values into the current column cell

```ts
// Demo helper: infer previous columns' dataIndex values based on the current column position
// In production, hardcode field names to avoid surprises when columns are reordered
function resolvePreviousDataIndexes() {
  const parent = ctx.model?.parent;
  const list = parent?.subModels?.columns;
  if (!Array.isArray(list)) return [];
  const currentUid = ctx.model?.uid;
  const currentIndex = list.findIndex((item) => item?.uid === currentUid);
  if (currentIndex <= 0) return [];
  return list
    .slice(Math.max(0, currentIndex - 2), currentIndex)
    .map((item) => (item && item.props ? item.props.dataIndex : undefined))
    .filter((key) => typeof key === 'string' && key.length > 0);
}

const [autoFieldA, autoFieldB] = resolvePreviousDataIndexes();

// Fallback: manually specify field keys when auto detection is not enough
const fieldA = autoFieldA || 'firstName';
const fieldB = autoFieldB || 'lastName';

const normalize = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const valueA = normalize(ctx.record?.[fieldA]);
const valueB = normalize(ctx.record?.[fieldB]);

const parts = [valueA, valueB].filter((item) => item.length > 0);

ctx.element.textContent = parts.length ? parts.join(' / ') : ctx.t('N/A');
```
