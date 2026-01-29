---
title: "Display status field as colored tag"
description: "Display status values using colored tags."
---

# Display status field as colored tag

Display status values using colored tags

```ts
const statusColors = {
  active: 'green',
  pending: 'orange',
  inactive: 'gray',
  error: 'red',
  success: 'blue',
};

const status = String(ctx.value || 'unknown');
const color = statusColors[status] || 'default';

ctx.element.innerHTML = \
```
