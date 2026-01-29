---
title: "Display number field as percentage bar"
description: "Render numeric values as a percentage progress bar."
---

# Display number field as percentage bar

Render numeric values as a percentage progress bar

```ts
const value = Number(ctx.value ?? 0);

if (!Number.isFinite(value)) {
  ctx.element.innerHTML = '-';
  return;
}

// Ensure value is between 0 and 100
const percent = Math.max(0, Math.min(100, value));

// Color based on value
const getColor = (val) => {
  if (val >= 80) return '#52c41a';
  if (val >= 50) return '#faad14';
  return '#f5222d';
};

const color = getColor(percent);

ctx.element.innerHTML = \
```
