---
title: "Display number field as colored text"
description: "Display numeric values using colors based on their sign."
---

# Display number field as colored text

Display numeric values using colors based on their sign

```ts
// Colorize based on numeric sign
const n = Number(ctx.value ?? 0);
const color = Number.isFinite(n) ? (n > 0 ? 'green' : n < 0 ? 'red' : '#999') : '#555';
ctx.element.innerHTML = '<span style=' + JSON.stringify('color:' + color) + '>' + String(ctx.value ?? '') + '</span>';
```
