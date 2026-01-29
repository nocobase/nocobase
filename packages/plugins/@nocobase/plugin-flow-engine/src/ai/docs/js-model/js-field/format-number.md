---
title: "Display number field as localized number"
description: "Format numeric values with locale-aware separators before rendering."
---

# Display number field as localized number

Format numeric values with locale-aware separators before rendering

```ts
// Format number using locale
const n = Number(ctx.value ?? 0);
ctx.element.innerHTML = String(Number.isFinite(n) ? n.toLocaleString() : ctx.value ?? '');
```
