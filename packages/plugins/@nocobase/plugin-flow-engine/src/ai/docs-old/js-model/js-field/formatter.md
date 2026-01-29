---
title: "Formatter"
description: "Code."
---

# Formatter

## Code

Use this snippet to code.

```ts
const price = Number(ctx.value ?? ctx.record?.price) || 0;
const discount = Number(ctx.record?.discount || 0);
const total = price * (1 - discount);
const fmt = (n: number) => `¥${n.toFixed(2)}`;

ctx.element.innerHTML = `
  <div>
    <strong>${fmt(total)}</strong>
    <span style="color:#999;margin-left:8px;">原价 ${fmt(price)}，折扣 ${(discount * 100).toFixed(0)}%</span>
  </div>
`;
```
