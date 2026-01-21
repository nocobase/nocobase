---
title: "Load AMD module"
description: "Dynamically load an AMD/RequireJS module by URL."
---

# Load AMD module

Dynamically load an AMD/RequireJS module by URL

```ts
// Load an external library (AMD/RequireJS)
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
console.log('dayjs loaded:', dayjs?.default || dayjs);
```
