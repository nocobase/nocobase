---
title: "Load Module"
description: "Load module."
---

# Basic

## Load Module

Use this snippet to load module.

```ts
return new Promise((resolve, reject) => {
  ctx.requirejs([moduleName], (mod) => resolve(mod), reject);
});
```
